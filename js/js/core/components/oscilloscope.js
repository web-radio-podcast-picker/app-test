/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// oscilloscope manager

oscilloscope = {

    channels: [],             // array of channels
    lastStartTime: null,      // last start time for visualization
    startTime: null,          // start time for visualization
    endTime: null,            // end time for visualization

    pause: false,             // pause on/off all channels

    scanPeriod: null,         // scan period (in ms, eg view period)
    scanFrq: null,            // scan frequency (in Hz, eg 1000 ms / view period)

    framePeriod: null,
    frameDuration: null,
    frameFPS: null,

    getChannel(channelId) {
        var r = null;
        // get a channel from channel id, null if not found
        this.channels.forEach(channel => {
            if (channel.channelId == channelId) {
                r = channel;
                return;
            }
        });
        return r;
    },

    removeChannel(channel) {
        const idx = this.channels.indexOf(channel);
        if (idx != -1) {
            this.channels.splice(idx, 1);
        }
        else
            logger.error('channel not found', channel);
    },

    addChannel(channel, addControls) {
        if (addControls === undefined) addControls = true
        // add a channel to the oscilloscope
        channel.view.init(app.canvas, channel)
        channel.fftView.init(app.canvas, channel)
        this.channels.push(channel)
        // add controls for the Channel
        if (addControls)
            ui.channels.addControls(channel)
    },

    async createChannel(sourceId, source) {

        // create a new channel and return it
        var chId = 0;
        this.channels.forEach(channel => {
            chId = Math.max(chId, channel.channelId);
        });
        chId++;
        const channel = new Channel(chId, sourceId);

        if (source != null || source != undefined) {

            // source provided
            await this.initChannelForSource(channel, sourceId, source);

        } else {
            // dynamic source from classname (sourceId)
            // @TODO: NOT IMPLEMENTED
        }

        return channel;
    },

    setOut(channel, on) {
        try {
            if (channel != null && channel.analyzer != null) {
                if (on)
                    channel.analyzer.connect(channel.audioContext.destination)
                else
                    channel.analyzer.disconnect(channel.audioContext.destination)
                channel.outConnected = on
            }
        } catch (err) {
            if (settings.debug.debug)
                logger.log(err)
        }
        channel.out = on
    },

    async initChannelForMedia(channel, sourceId) {
        channel.deleteSource()
        if (channel.audioContext == null) {
            channel.audioContext = new AudioContext() // not before getMediaStream
            await channel.audioContext.resume()   // ios/android (old fix, usefull?)
        }
        channel.source = channel.mediaSource
        channel.mediaSource.createAudioSource(
            channel.audioContext,
            channel.mediaSource.url,
            'audio_tag'
        )
        await this.initChannelForSource(channel, sourceId, channel.mediaSource, true)
    },

    initChannelForNone(channel) {
        channel.deleteSource()
        channel.sourceId = Source_Id_None
    },

    async initChannelForSource(channel, sourceId, source, channelSourceInitialized) {

        if (channelSourceInitialized != true) {
            channel.deleteSource()
            channel.source = source
        }

        if (channel.source != null)
            channel.stream = await channel.source.getMediaStream(channel.audioContext)

        channel.sourceId = sourceId
        if (sourceId == Source_Id_AudioInput)
            // setup audio input range
            channel.vScale = settings.audioInput.vScale

        if (channel.audioContext == null) {
            channel.audioContext = new AudioContext() // not before getMediaStream
            await channel.audioContext.resume()
        }

        channel.gain = channel.audioContext.createGain()
        channel.splitter = channel.audioContext.createChannelSplitter(2)
        // Create an AnalyserNode for each channel
        channel.analyzerLeft = channel.audioContext.createAnalyser()
        channel.analyzerRight = channel.audioContext.createAnalyser()
        // Connect each channel to its respective AnalyserNode
        channel.splitter.connect(channel.analyzerLeft, 0); // Left channel
        channel.splitter.connect(channel.analyzerRight, 1); // Right channel

        if (channel.stream != undefined) {

            channel.streamSource = channel.source.createMediaStreamSource(channel)
            if (settings.debug.info)
                logger.log("Input media stream ok")

            // source -> splitter -> analyzer Left
            //                    -> analyzer Right

            channel.streamSource.connect(channel.splitter);

            channel.setAnalyser(
                channel.audioContext.createAnalyser())      // mixed channels analyzer

            channel.analyzer.fftSize = settings.input.bufferSize * 2

            // source -> gain -> analyzer   [ -> channel.audioContext.destination ]

            channel.streamSource.connect(channel.gain)
            channel.gain.connect(channel.analyzer)
            channel.getSamplesTask = new GetSamplesTask()
                .init(channel)

            if (settings.debug.info)
                logger.log("Input stream set", channel.analyzer)
        }
        else {
            channel.error = "No input media stream"
            logger.error(channel.error)
        }
    },

    refreshView() {
        if (this.pause)
            app.requestAnimationFrame()
    },

    frameStartCallback() {
        // called at the start of the frame
        const lst = this.lastStartTime
        this.lastStartTime = this.startTime
        this.startTime = Date.now()
        if (lst != null) {
            this.framePeriod = this.startTime - lst;
            this.frameFPS = parseFloat((1000 / this.framePeriod).toFixed(2))
        }
    },

    frameEndCallback() {
        // called at the end of the frame        
        this.endTime = Date.now();
        this.frameDuration = this.endTime - this.startTime;
    }
}
