/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// get samples task

class GetSamplesTask {

    analyzer = null     // analyzer for getting samples

    bufferLength = 0    // length of the buffer
    dataArray = null        // array for storing samples (mixed channels)
    leftDataArray = null    // left channel samples
    rightDataArray = null   // right channel samples

    fftLength = 0       // length of the fft buffer
    fftDataArray = null // array for storing fft data
    fftByteDataArray = null // array for storing fft data

    sampleRate = 0      // sample rate
    channelCount = 0    // fft array channel count

    minDb = null        // input min db
    maxDb = null        // input max db

    channel = null      // relative channel

    init(channel) {
        this.channel = channel
        this.analyzer = channel.analyzer
        this.bufferLength = this.analyzer.frequencyBinCount
        this.dataArray = new Float32Array(this.bufferLength)
        this.leftDataArray = new Float32Array(this.bufferLength)
        this.rightDataArray = new Float32Array(this.bufferLength)
        this.channelCount = this.analyzer.channelCount
        this.fftLength = this.analyzer.fftSize / this.channelCount
        this.fftDataArray = new Float32Array(this.fftLength)
        this.fftByteDataArray = new Uint8Array(this.fftLength)
        this.sampleRate = this.analyzer.context.sampleRate
        this.minDb = this.analyzer.minDecibels
        this.maxDb = this.analyzer.maxDecibels
        return this
    }

    run() {
        if (this.analyzer != null
            && this.channel.analyzerLeft != null
            && this.channel.analyzerRight != null
        ) {
            if ((!this.channel.pause
                && !oscilloscope.pause)
                || !this.channel.isDisplayed) {

                if (!settings.features.constraints.noVisualizers) {
                    if (ui.vizTabActivated) {
                        // wave
                        this.analyzer.getFloatTimeDomainData(this.dataArray)
                        // fft
                        this.analyzer.getFloatFrequencyData(this.fftDataArray)
                    }

                    // vu meter left + right
                    this.channel.analyzerLeft.getFloatTimeDomainData(this.leftDataArray)
                    this.channel.analyzerRight.getFloatTimeDomainData(this.rightDataArray)
                }
            }
        } else {
            logger.error("Analyzer(s) not initialized")
            return;
        }
    }
}