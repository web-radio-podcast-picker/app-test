/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// audio input device manager

audioInputDevice = {

    stream: null,

    label: null,

    getMediaStream: async function () {
        try {
            this.stream = await navigator
                .mediaDevices
                .getUserMedia({
                    audio: true,
                    video: false,
                    /*sampleRate: 24000,
                    sampleSize: 16384,
                    sampleRate: 96000,
                    channelCount: 1,*/
                });
            const tracks = this.stream.getTracks()
            if (tracks.length > 0) {
                this.label = tracks[0].label
            }

            if (settings.debug.info)
                logger.log('Media stream obtained:', this.stream)
            return this.stream
        } catch (err) {
            logger.error('Error accessing media devices.', err)
        }
    },

    createMediaStreamSource(channel) {
        return channel.audioContext.createMediaStreamSource(channel.stream)
    }
}
