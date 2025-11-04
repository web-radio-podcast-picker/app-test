/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// media this.socket media source
class WRPPWSMediaSource {

    static onLoadError = null      // on load error handler
    static onLoadSuccess = null    // on load success handler

    static sourceInitialized = false
    static sourcePlugged = false

    socket = null

    constructor() {
        this.init()
    }

    init() {
        const tagId = 'audio_tag'
        this.audio = $('#' + tagId)[0]
        if (WRPPWSMediaSource.sourceInitialized) return

        this.audio.addEventListener('loadedmetadata', (ev) => {
            // equivalent to a load success event
            if (settings.debug.debug)
                logger.log('Metadata loaded:', this.audio.src)

            if (WRPPMediaSource.onLoadSuccess != null)
                WRPPMediaSource.onLoadSuccess(this.audio, ev)
        })

        this.audio.addEventListener('error', () => {
            const err = this.getAudioSourceError()
            if (settings.debug.debug)
                logger.log(err)

            if (err.code != MediaError.MEDIA_ERR_ABORTED
                && WRPPMediaSource.onLoadError != null)
                WRPPMediaSource.onLoadError(err, this.audio)
        })

        this.audio.addEventListener('canplaythrough', async (o) => {
            if (settings.debug.debug) {
                logger.log('can play through')
                if (settings.debug.trace)
                    logger.log(o)
            }
            if (!WRPPMediaSource.sourcePlugged) {
                //await oscilloscope.initChannelForMedia(app.channel)
                //WRPPMediaSource.sourcePlugged = true
            }
            //app.playChannelMedia(app.channel)
        })
    }

    async testPlay() {
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        this.controller = new AbortController()

        await this.loadFile3(
            'https://icecast.radiofrance.fr/franceinfo-hifi.aac',
            audioContext,
            analyser
        )
    }

    async handleAudioChunk(audioContext, data) {
        try {
            const buffer = new ArrayBuffer(data.length)

            const audioBufferChunk = await audioContext.decodeAudioData(
                data
                //this.withWaveHeader(data, 2, 44100)
            )
        } catch (e) {
            logger.log(e)
        }
    }

    async loadFile3(url, audioContext, anaylser) {

        const t = this

        fetch(url, {
            headers: { 'Icy-MetaData': '1' },
            signal: this.controller.signal
        })
            .then((response) => {
                const reader = response.body.getReader()
                logger.log('reader getted')

                reader.read().then(async function pump({ done, value }) {
                    if (done) {
                        // Do something with last chunk of data then exit reader
                        logger.log('stream end')
                        return
                    }
                    // Otherwise do something here to process current chunk
                    await t.handleAudioChunk(audioContext, value)
                    logger.log('chunk received: ' + value.byteLength)

                    // Read some more, and call this function again
                    return reader.read().then(pump)
                })

            })
            .catch((err) => logger.error(err))
    }

    async loadFile2(url, audioContext, anaylser) {
        const mediaSource = new MediaSource()
        const audioElement = this.audio
        audioElement.src = URL.createObjectURL(mediaSource)

        mediaSource.addEventListener('sourceopen', async () => {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')

            try {
                // Dynamically import the ESM-only module
                const { parseIcyResponse } = await import('https://cdn.jsdelivr.net/npm/@music-metadata/icy@0.1.0/+esm')

                const response = await fetch(url, {
                    //headers: { 'Icy-MetaData': '1' }
                })

                const audioStream = parseIcyResponse(response, metadata => {
                    for (const [key, value] of metadata.entries()) {
                        logger.log(`Rx ICY Metadata: ${key}: ${value}`)
                    }
                    const title = metadata.get('StreamTitle')
                    if (title) {
                        //trackDisplay.textContent = title
                    }
                })

                const reader = audioStream.getReader()

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    if (value && !sourceBuffer.updating) {
                        sourceBuffer.appendBuffer(value)
                    } else {
                        await new Promise(resolve => {
                            sourceBuffer.addEventListener('updateend', resolve, { once: true })
                        })
                        sourceBuffer.appendBuffer(value)
                    }
                }

                mediaSource.endOfStream()
            } catch (err) {
                logger.error('Error streaming audio:', err.message)
                //trackDisplay.textContent = 'Failed to load stream'
            }
        })
    }

    loadFile(url, audioContext, analyser /*, { frequencyC, sinewaveC }, styles, props*/) {
        return new Promise(async (resolve, reject) => {
            try {
                //const { changeAudionState, setDuration } = props
                this.socket = io(url)
                let source = null
                let playWhileLoadingDuration = 0
                let startAt = 0
                let audioBuffer = null
                let activeSource = null

                // create audio context
                //const { audioContext, analyser } = getAudioContext()
                const gainNode = audioContext.createGain()

                const playWhileLoading = (duration = 0) => {
                    source.connect(audioContext.destination)
                    source.connect(gainNode)
                    source.connect(analyser)
                    source.start(0, duration)
                    activeSource = source
                    //drawFrequency()
                    //drawSinewave()
                }

                const play = (resumeTime = 0) => {
                    // create audio source
                    source = audioContext.createBufferSource()
                    source.buffer = audioBuffer


                    source.connect(audioContext.destination)
                    source.connect(gainNode)
                    gainNode.connect(audioContext.destination)
                    source.connect(analyser)


                    source.start(0, resumeTime)

                    //drawFrequency()
                    //drawSinewave()
                }

                const whileLoadingInterval = setInterval(() => {
                    if (startAt) {
                        const inSec = (Date.now() - startAt) / 1000
                        if (playWhileLoadingDuration && inSec >= playWhileLoadingDuration) {
                            playWhileLoading(playWhileLoadingDuration)
                            playWhileLoadingDuration = source.buffer.duration
                        }
                    } else if (source) {
                        playWhileLoadingDuration = source.buffer.duration
                        startAt = Date.now()
                        playWhileLoading()
                    }
                }, 500)

                const stop = () => source && source.stop(0)
                const setVolume = (level) =>
                    gainNode.gain.setValueAtTime(level, audioContext.currentTime)

                // load file while this.socket
                this.socket.emit('track', (e) => { })

                ss(this.socket).on('track-stream', (stream, { stat }) => {
                    let rate = 0
                    let isData = false
                    stream.on('data', async (data) => {
                        const audioBufferChunk = await audioContext.decodeAudioData(withWaveHeader(data, 2, 44100))
                        const newaudioBuffer = (source && source.buffer)
                            ? appendBuffer(source.buffer, audioBufferChunk, audioContext)
                            : audioBufferChunk
                        source = audioContext.createBufferSource()
                        source.buffer = newaudioBuffer

                        const loadRate = (data.length * 100) / stat.size
                        rate = rate + loadRate

                        //changeAudionState({ loadingProcess: rate, startedAt: startAt })

                        if (rate >= 100) {
                            clearInterval(whileLoadingInterval)
                            audioBuffer = source.buffer
                            const inSec = (Date.now() - startAt) / 1000
                            activeSource.stop()
                            play(inSec)
                            resolve({ play, stop, setVolume })
                        }
                        isData = true
                        // first time load
                        if (isData && rate === loadRate) {
                            const duration = (100 / loadRate) * audioBufferChunk.duration
                            //setDuration(duration)
                        }
                    })
                })
            } catch (e) {
                reject(e)
            }
        })
    }

    createAudioSource(audioContext) {

    }

    getAudioSourceError() {

    }

    deleteSource() {

    }

    getMediaStream() {

    }

    play() {

    }

    pause() {

    }

    concat(buffer1, buffer2) {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)

        tmp.set(new Uint8Array(buffer1), 0)
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength)

        return tmp.buffer
    }

    appendBuffer(buffer1, buffer2, context) {
        const numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels)
        const tmp = context.createBuffer(numberOfChannels, (buffer1.length + buffer2.length), buffer1.sampleRate)
        for (let i = 0; i < numberOfChannels; i++) {
            const channel = tmp.getChannelData(i)
            channel.set(buffer1.getChannelData(i), 0)
            channel.set(buffer2.getChannelData(i), buffer1.length)
        }
        return tmp
    }

    withWaveHeader(data, numberOfChannels, sampleRate) {
        const header = new ArrayBuffer(44)

        const d = new DataView(header)

        d.setUint8(0, "R".charCodeAt(0))
        d.setUint8(1, "I".charCodeAt(0))
        d.setUint8(2, "F".charCodeAt(0))
        d.setUint8(3, "F".charCodeAt(0))

        d.setUint32(4, data.byteLength / 2 + 44, true)

        d.setUint8(8, "W".charCodeAt(0))
        d.setUint8(9, "A".charCodeAt(0))
        d.setUint8(10, "V".charCodeAt(0))
        d.setUint8(11, "E".charCodeAt(0))
        d.setUint8(12, "f".charCodeAt(0))
        d.setUint8(13, "m".charCodeAt(0))
        d.setUint8(14, "t".charCodeAt(0))
        d.setUint8(15, " ".charCodeAt(0))

        d.setUint32(16, 16, true)
        d.setUint16(20, 1, true)
        d.setUint16(22, numberOfChannels, true)
        d.setUint32(24, sampleRate, true)
        d.setUint32(28, sampleRate * 1 * 2)
        d.setUint16(32, numberOfChannels * 2)
        d.setUint16(34, 16, true)

        d.setUint8(36, "d".charCodeAt(0))
        d.setUint8(37, "a".charCodeAt(0))
        d.setUint8(38, "t".charCodeAt(0))
        d.setUint8(39, "a".charCodeAt(0))
        d.setUint32(40, data.byteLength, true)

        return concat(header, data)
    }
}