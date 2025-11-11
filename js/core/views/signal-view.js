/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// signal view

class SignalView {

    canvas = null;           // canvas for visualization
    pause = false;           // pause flag for visualization
    visible = true;          // visible flag for visualization
    hidden = false;          // hidden for vizualisation
    channel = null;          // channel
    renderers = []          // renderers . on sigview, before signal draw
    pointRenderers = []     // point renderers. on signal point, before signal point

    constructor() {
        ui.onResize.push(() => {
            this.updateOnResize()
        })
    }

    init(canvas, channel) {
        this.canvas = canvas;
        this.channel = channel;
    }

    /**----- cached values -----*/

    canvasHeight = null
    chBoundingClientRect = null
    canvasWidth = null
    canvasHeight = null

    updateOnResize() {
        this.canvasHeight = null
        this.chBoundingClientRect = null
        this.canvasWidth = this.canvasHeight = null
    }

    /** ----------------------- */

    offsetToVolt(offset) {
        const canvasHeight = this.canvasHeight ||
            (this.canvasHeight = this.canvas.height)   // avoid reflow
        const signalRange = settings.audioInput.vScale;
        const displayRange = this.getDisplayRange()

        offset -= this.channel.yOffset
        var height = offset - canvasHeight / 2.0
        height /= this.channel.yScale
        var percent = height * 2.0 / canvasHeight
        percent /= signalRange / displayRange
        const value = -percent * signalRange
        return value
    }

    voltOffset(value) {
        const canvasHeight = this.canvasHeight ||
            (this.canvasHeight = this.canvas.height)    // avoid reflow
        const signalRange = settings.audioInput.vScale
        const displayRange = this.getDisplayRange()

        // adjust y position (y multiplier, y position shift, v scale)
        var percent = -value / signalRange
        percent *= signalRange / displayRange // adjust to display range
        var height = canvasHeight * percent / 2.0
        height *= this.channel.yScale
        var offset = canvasHeight / 5 + height
        offset += this.channel.yOffset
        return offset
    }

    getDisplayRange() {
        return settings.oscilloscope.vPerDiv * 5.0
    }

    run() {

        if (settings.features.constraints.noVisualizers) return
        if (!this.visible) return
        if (this.canvas == null) return
        if (this.channel != null && !this.channel.connected) return

        const ch = $('#left-pane')[0]
        const cnvSize = this.chBoundingClientRect
            || (this.chBoundingClientRect = ch.getBoundingClientRect())     // avoid reflow

        const canvasHeight = Math.trunc(cnvSize.height)
        const canvasWidth = Math.trunc(cnvSize.width)
        // adjust canvas size if needed
        if (this.canvasWidth != canvasWidth || this.canvasHeight != canvasHeight) {
            this.canvasWidth = this.canvas.width = canvasWidth
            this.canvasHeight = this.canvas.height = canvasHeight
        }

        const dataArray = this.channel?.getSamplesTask?.dataArray

        if (dataArray != null) {

            var x = -1
            var y = -1
            const drawContext = this.canvas.getContext('2d');

            const signalRange = settings.audioInput.vScale
            const displayRange = this.getDisplayRange()        // base

            const timePerDiv = settings.oscilloscope.tPerDiv;
            // full buffer view : scale 1ms/div
            const barWidth = canvasWidth / dataArray.length / timePerDiv;

            const baseI = 0

            const rprops = {
                canvasWidth: canvasWidth
            }

            this.renderers.forEach(r => {
                r(this.channel, drawContext, rprops)
            })

            for (var i = baseI; i < dataArray.length; i += 1) {
                var value = dataArray[i];

                value = valueToVolt(this.channel, value);
                const offset = this.voltOffset(value)

                var nx = (i - baseI) * barWidth
                var ny = offset;
                if (x == -1 && y == -1) {
                    x = nx
                    y = ny
                }

                drawContext.beginPath()
                drawContext.moveTo(x, y)
                drawContext.lineTo(nx, ny)
                drawContext.setLineDash([]);
                var col = this.channel.color
                drawContext.strokeStyle = settings.oscilloscope.channels.shadowColor
                drawContext.lineWidth = this.channel.lineWidth * 4
                drawContext.stroke()
                x = nx
                y = ny
            }

            x = y = -1

            for (var i = baseI; i < dataArray.length; i += 1) {
                var value = dataArray[i];

                value = valueToVolt(this.channel, value);
                const offset = this.voltOffset(value)

                var nx = (i - baseI) * barWidth
                var ny = offset;
                if (x == -1 && y == -1) {
                    x = nx
                    y = ny
                }

                drawContext.beginPath()
                drawContext.moveTo(x, y)
                drawContext.lineTo(nx, ny)
                drawContext.setLineDash([]);
                var col = this.channel.color
                drawContext.strokeStyle = col
                const props = {
                    col: col,
                    op: 1,
                    value: value,
                    offset: offset
                }

                this.pointRenderers.forEach(o => {
                    var r = o.render(this.channel, drawContext, props)
                    if (r.col !== undefined)
                        props.col = r.col
                })

                drawContext.strokeStyle = col
                drawContext.lineWidth = this.channel.lineWidth
                drawContext.stroke()

                x = nx
                y = ny
            }
            this.channel.isDisplayed = true;
        }
    }
}
