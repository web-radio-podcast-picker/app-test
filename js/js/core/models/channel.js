/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// channel

class Channel {

    channelId = null           // channel id (1, 2,...)
    isDisplayed = false        // false if not already displayed
    pause = false              // true if paused (source,view) - use setPause
    connected = false

    // audioInputDevice/generator/... (@see globals.js)
    sourceId = null            // source id of the signal, e.g., 'input', 'file', etc.

    source = null               // signal source (Source_Id_AudioInput, ...)
    mediaSource = null          // media multi element source
    streamSource = null         // media stream source
    stream = null               // media stream
    analyzer = null             // audio analyzer

    splitter = null             // left-right channel splitter
    analyzerLeft = null         // left channel analyzer
    analyzerRight = null        // right channel analyzer

    gain = null                 // audio gain
    gainValue = 1               // gain value
    ///generator = new Generator() // signal generator
    ///trigger = new Trigger()     // trigger
    fft = new FFT()
    markers = null              // channel markers
    audioContext = null         // audio context for processing
    getSamplesTask = null       // samples provider if required (if has a source)
    out = false                 // true if channel is binded to audio output
    outMute = false             // if true out is mute due to pause
    outConnected = false

    view = null                // signal view (drawer)
    fftView = null             // fft view (drawer)
    measures = null            // signal measures data
    measuresView = null        // signal measures view

    color = settings.oscilloscope.channels.defaultColor             // color for channel
    lineWidth = settings.oscilloscope.channels.defaultLineWidth              // line width for channel
    tempColor = false
    bright = false

    vScale = 1                 // volt scale (256 digital value corresponding volts)
    yScale = 1                 // multiplier for Y-axis scaling
    xScale = 1                 // multiplier for X-axis scaling
    yOffset = 0                // Y-axis offset for channel
    xOffset = 0                // X-axis offset for channel

    error = null               // error message if any

    ui = false                 // indicates if ui is built for this channel

    triggerOn = false          // trigger enabled
    triggerKind = null

    constructor(channelId, sourceId) {
        this.channelId = channelId
        this.sourceId = sourceId
        ///this.measures = new SignalMeasures()
        ///this.measuresView = new SignalMeasuresView()
        this.view = new SignalView()
        this.fftView = new FFTView()
        ///this.markers = new Markers().init(this)
        ///this.measuresView.init(this, this.measures)
        this.mediaSource = new WRPPMediaSource()
        //this.mediaSourceWS = new WRPPWSMediaSource()
    }

    setAnalyser(analyser) {
        this.analyzer = analyser
        this.fft.init(this)
    }

    setPause(pause) {
        this.pause = pause
        this.setPauseOut(pause)
        ///this.generator.setPause(pause)
    }

    setPauseOut(pause) {
        if (this.out || this.outMute) {
            const isPaused = this.pause || oscilloscope.pause
            if ((isPaused && this.outConnected)
                || (!isPaused && !this.outConnected)) {
                oscilloscope.setOut(this, !pause)
            }
            this.outMute = isPaused
            this.out = !this.outMute
        }
    }

    setGain(v) {
        this.gainValue = v
        if (this.gain != null)
            this.gain.gain.value = v
    }

    // unset channel source
    deleteSource() {
        this.mediaSource.deleteSource()
        if (this.generator != null)
            this.generator.stop()
        if (this.out || this.outMute)
            oscilloscope.setOut(this, false)

        this.sourceId = Source_Id_None
        this.streamSource =
            ///this.generator.oscillator =
            this.analyzer =
            this.gain =
            this.getSamplesTask =
            this.audioContext =
            this.splitter =
            this.analyzerLeft =
            this.analyzerRight = null
        ///this.measures.reset()
        this.out =
            this.outConnected =
            this.outMute = false
        this.gainValue = 1
    }
}
