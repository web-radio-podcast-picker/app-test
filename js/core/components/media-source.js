/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// media source

class WRPPMediaSource {

    audio = null        // audio tag
    source = null       // media source
    url = null          // media url

    static onLoadError = null      // on load error handler
    static onLoadSuccess = null    // on load success handler
    static onCanPlay = null        // on can play handler
    static onEnded = null        // on ended handler

    static sourceInitialized = false
    static sourcePlugged = false

    static captureStream = false

    constructor() {
        this.init()
    }

    init() {
        const tagId = 'audio_tag'
        this.audio = $('#' + tagId)[0]

        if (WRPPMediaSource.sourceInitialized) return
        WRPPMediaSource.sourceInitialized = true

        this.audio.addEventListener('loadedmetadata', (ev) => {
            // equivalent to a load success event
            if (settings.debug.debug)
                logger.log('Metadata loaded:', this.audio.src)

            if (WRPPMediaSource.onLoadSuccess != null)
                WRPPMediaSource.onLoadSuccess(this.audio)
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
                logger.log('can play')
                logger.log(o)
            }
            if (WRPPMediaSource.captureStream || !WRPPMediaSource.sourcePlugged) {
                await oscilloscope.initChannelForMedia(app.channel)
                WRPPMediaSource.sourcePlugged = true
            }
            app.playChannelMedia(app.channel)
            if (WRPPMediaSource.onCanPlay != null)
                WRPPMediaSource.onCanPlay(this.audio)
        })

        this.audio.addEventListener('ended', e => {
            if (settings.debug.debug) {
                logger.log('ended')
            }
            if (WRPPMediaSource.onEnded != null)
                WRPPMediaSource.onEnded(e, this.audio)
        })

        this.audio.crossOrigin = "anonymous"
    }

    createAudioSource(audioContext, url, tagId) {
        this.deleteSource()
        // this one not working on ios : safari/chrome/firefox
        if (!WRPPMediaSource.captureStream)
            this.source = audioContext.createMediaElementSource(this.audio)

        //if (this.source != null) return this.source

        if (WRPPMediaSource.captureStream)
            this.source = this.stream = this.audio.captureStream()

        return this.source
    }

    getAudioSourceError() {
        if (this.audio == null || this.audio.error == null) return null
        const err = this.audio.error
        return {
            'code': err.code,
            'message': err.message
        }
    }

    deleteSource() {
        if (this.audio == null) return
        this.audio.pause()
    }

    async getMediaStream(audioContext) {
        //this.msadn = audioContext.createMediaStreamDestination()
        //this.stream = this.msadn.stream
        //return this.stream
        return this.source
    }

    createMediaStreamSource(channel) {
        // it should have been already created
        if (this.source == null)
            throw new Error('source not initialized')

        //if (this.mss != null) return this.mss
        if (WRPPMediaSource.captureStream) {
            this.mss = channel.audioContext.createMediaStreamSource(this.stream)
            return this.mss
        }
        else
            return this.source
    }

    play() {
        return this.audio.play()
    }

    pause() {
        return this.audio.pause()
    }
}