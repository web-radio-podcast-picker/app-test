/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// FFT

class FFT {

    channel
    vScale          /* vertical linear scale */
    vScaleFactor    /* vertical linear scale factor */
    hScale          /* horizontal linear scale (1: full bandwidth)*/
    minDb           /* min db reference */
    maxDb           /* max db reference */
    position        /* view position (half bottom,full,..) */
    displayGrid     /* display fft grid (auto if true) or not (false) */
    color           /* fft main color */
    lineWidth       /* stroke width */
    grid            /* grid properties */
    isDisplayed     /* true if displayed */

    constructor() {
        this.vScale = settings.fft.vScale
        this.hScale = settings.fft.hScale
    }

    init(channel) {
        this.channel = channel
        this.displayGrid = true
        this.position = Half_Bottom
        this.minDb = channel.analyzer.minDecibels
        this.maxDb = channel.analyzer.maxDecibels
        this.vScale = settings.fft.vScale
        this.vScaleFactor = settings.fft.vScaleFactor
        this.hScale = settings.fft.hScale
        this.color = channel.color
        this.lineWidth = settings.fft.stroke.lineWidth
        this.grid = { ...settings.fft.grid }
        this.grid.color = channel.color
        this.isDisplayed = false
    }

    hasSameScaleH(fft) {
        return this.hScale == fft.hScale
            && this.grid.hDivCount == fft.grid.hDivCount
            && this.grid.hDivCountSD == fft.grid.hDivCountSD
    }

    hasSameScaleV(fft) {
        return this.vScale == fft.vScale
            && this.vScaleFactor == fft.vScaleFactor
            && this.position == fft.position
            && this.grid.dbPerDiv == fft.grid.dbPerDiv
            && this.grid.dbPerDivSD == fft.grid.dbPerDivSD
    }

    toScaleHSignature() {
        const sep = '-'
        return this.hScale
            + sep + this.grid.hDivCount
            + sep + this.grid.hDivCountSD
    }

    toScaleVSignature() {
        const sep = '-'
        return this.vScale
            + sep + this.vScaleFactor
            + sep + this.position
            + sep + this.grid.dbPerDiv
            + sep + this.grid.dbPerDivSD
    }
}
