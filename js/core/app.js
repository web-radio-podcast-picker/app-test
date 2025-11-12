/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// this is the main app body

app = {

    // properties

    audioInputDevice: null,     // current audio input device
    audioOutputDevice: null,    // current audio output device
    audioInputChannel: null,    // audio input channel (shared)
    oscilloscope: null,         // oscilloscope channels manager
    gaugeView: null,            // gauge view
    tasks: [],                  // tasks,
    canvas: null,               // canvas for visualization
    ui: null,                   // UI component
    powerOn: true,              // indicates if turned on or off

    onStartUI: null,            // ui started callback
    lastFrameStartTime: null,
    frameStartTime: null,
    endFramePermanentOperations: [],    // end frame operations (always)
    endFrameOneShotOperations: [],      // end frame operations (single shot)
    startFramePermanentOperations: [],  // start frame operations (always)
    startFrameOneShotOperations: [],    // start frame operations (single shot)

    frameAvgFPS: 0,
    frameAvgPeriod: 0,

    moduleLoader: new ModuleLoader(),

    channel: null,                      // the web radio channel

    // operations

    addOnStartUI(fn) {
        if (this.onStartUI == null)
            this.onStartUI = () => { fn() }
        else {
            const f = this.onStartUI
            this.onStartUI = () => { fn(); f() }
        }
    },

    initSettings() {
        settings.sys.mobile = navigator?.userAgentData?.mobile
        settings.sys.platform =
            navigator?.userAgentData?.platform
            || navigator.platform
        settings.sys.platformText = settings.sys.platform
            + (settings.sys.mobile ? ' (mobile)' : '')
        settings.sys.brand = navigator.userAgentData?.brands.map(x => x?.brand)?.join(' | ')
        settings.sys.userAgent = navigator.userAgent
        settings.sys.electron = navigator.userAgent?.includes('Electron/')
    },

    initFlags() {
        const flags = settings.flags
        const urlParams = new URLSearchParams(window.location.search)
        const qflags = urlParams.get('flags')
        const t = qflags?.split('-')
        flags.raspberry = t?.includes(Flag_Raspberry) || false
        flags.kiosk = t?.includes(Flag_Kiosk) || false
        flags.noSwype = t?.includes(Flag_NoSwype) || false
        flags.app = t?.includes(Flag_App) || false
        flags.noviz = t?.includes(Flag_NoViz) || false
        flags.ipho = t?.includes(Flag_IPhone) || false
    },

    fixFlags() {
        const lp = settings.sys.platform?.toLowerCase()
        if (lp.indexOf('iphone') != -1) {
            settings.sys.mobile =
                settings.features.constraints.isIPhone = true
            settings.sys.platformText = settings.sys.platformText + ' (mobile)'
        }
    },

    initFeatures() {
        const flags = settings.flags
        const feats = settings.features

        // support for noswype

        feats.swype.enableArrowsButtonsOverScrollPanes = flags.noSwype

        // constraints

        feats.constraints.isIPhone |= flags.ipho

        feats.constraints.noFullscreenToggling =
            flags.kiosk
            || (flags.app && settings.sys.mobile)

        feats.constraints.enableRotateYourDevicePopup = !flags.kiosk
            && !(flags.app && settings.sys.mobile && !settings.features.constraints.isIPhone)

        feats.constraints.noIntroPopup = flags.kiosk || flags.app || true

        feats.constraints.useNavigatorOrientationProperty =
            feats.constraints.noVisualizers = feats.constraints.isIPhone
            || flags.noviz

        // small display

        feats.smallDisp.increaseSmallText = flags.smallDisp
    },

    initLogger() {
        window.logger = new Logger('opts_log_pane')
    },

    async run() {

        this.initLogger()
        this.initSettings()
        this.initFlags()
        this.fixFlags()
        this.initFeatures()

        ui.init_pre_intro()

        if (settings.flags.kiosk) {
            ui.init_kiosk()
        }
        else {
            if (settings.features.constraints.noIntroPopup) {
                ui.hide_intro_popup()
                ui.init_post_intro()
                ui.showUI()
            }
            else
                ui.init_intro()
        }

        const opts = app.moduleLoader.opts(
            'wrp_mod_inf_txt_inview',
            'wrp_mod_err_txt_inview'
        )
        opts.skipLoadViews = true
        opts.viewContainerId = 'wrp-pane'
        opts.noPopup = true

        app.openModule('web-radio-picker', opts)

        //await this.checkAudio()   // unnecessary access to media devices

        if (navigator?.audioSession != null)
            navigator.audioSession.type = 'playback'    // >= ios 17

        this.oscilloscope = oscilloscope
        this.gaugeView = new GaugeView()

        this.canvas = $('#cnv_oscillo')[0]

        await this.setupWebRadioChannel()
        this.gaugeView.init(this.channel)

        this.initUI()

        if (this.channel != null &&
            this.channel.error == null) {
            this.start()
        }
    },

    async setupWebRadioChannel() {
        const channel = await oscilloscope.createChannel(Source_Id_Media)
        this.channel = channel
        ui.getCurrentChannel = () => this.channel
        this.oscilloscope.addChannel(channel, false)
    },

    async checkAudio() {
        if (!navigator.mediaDevices?.enumerateDevices) {
            throw new Error("enumerateDevices() not supported.")
        } else {
            // list input & output devices
            navigator.mediaDevices
                .enumerateDevices()
                .then((devices) => {
                    devices.forEach((device) => {
                        logger.log(`${device.kind}: ${device.label} id = ${device.deviceId}`)

                        if (device.kind == Device_Kind_Id_Audio_Input &&
                            device.deviceId == Device_Id_Default
                        )
                            this.audioInputDevice = device

                        if (device.kind == Device_Kind_Id_Audio_Output &&
                            device.deviceId == Device_Id_Default
                        )
                            this.audioOutputDevice = device
                    })
                })
                .catch((err) => {
                    logger.error(`${err.name}: ${err.message}`)
                })
        }
    },

    initUI() {
        ui.init(this.oscilloscope)
    },

    startUI() {
        // ui started event
        if (this.onStartUI != null) {
            const f = this.onStartUI
            this.onStartUI = null
            f()
        }
        // Setup the visualization timer
        this.requestAnimationFrame()
    },

    updateDisplay() {
        // update grid view
        // update non paused signals (data and view)
        // update paused signals (view only)
        /*this.startFrameOneShotOperations.push(() => {
        })*/
        oscilloscope.refreshView()
    },

    async initDefaultAudioInput() {
        // build a channel for the default audio input device
        const channel = await oscilloscope.createChannel(
            Source_Id_AudioInput, audioInputDevice)
        return channel
    },

    start() {
        // setup the tasks
        channelsAnimationTask.init(this.oscilloscope)
        startViewTask.init(this.canvas)

        this.endFramePermanentOperations.push(() => {
            oscilloscope.frameEndCallback()
        })
        this.startFramePermanentOperations.push(() => {
            oscilloscope.frameStartCallback()
        })

        // grab & publish data
        this.tasks.push(this.task(getAnalyzersDataTasks))

        // views tasks
        this.tasks.push(this.task(startFrameTask, this.mrr))            // frame start
        this.tasks.push(this.task(startViewTask, this.mrr))
        this.tasks.push(this.task(this.gaugeView, this.mrr))
        this.tasks.push(this.task(channelsAnimationTask, this.mrr))

        // end of frame
        this.tasks.push(this.task(requestAnimationFrameTask))      // frame end

        this.startUI()
    },

    mrr() {
        // check to know if must limit the refresh rate
        if (!Number.isFinite(startFrameTask.frameFPS))
            return { value: false, delta: 0 }

        const tooFast = startFrameTask.frameFPS > settings.ui.maxRefreshRate
        const d = Date.now() - startFrameTask.frameStartTime
        const f = 1000.0 / d
        const lateEnough = f <= settings.ui.maxRefreshRate

        this.frameAvgFPS =
            Math.min(startFrameTask.frameFPS,
                Math.min(settings.ui.maxRefreshRate, f))
        this.frameAvgPeriod = 1.0 / this.frameAvgFPS

        return (tooFast && !lateEnough) ?
            {
                value: true,
                frameFPS: startFrameTask.frameFPS,
                frameAvgFPS: this.frameAvgFPS
            }
            : { value: false, delta: 0 }
    },

    task(task, rateLimitFunc) {
        return { task: task, rateLimitFunc: rateLimitFunc }
    },

    requestAnimationFrame: function () {

        const rlf = this.mrr
        const rateLimit = rlf != null && rlf != undefined
            ? (rlf == this.mrr ? this.mrr() : { value: null, data: null })
            : { value: null, delta: null }
        const t = this

        this.tasks.forEach(task => {
            const rlf = task.rateLimitFunc
            const hasRlf = rlf != null && rlf != undefined ? rlf == this.mrr : false
            if (!hasRlf || !rateLimit.value) {
                const fn = task.task
                requestAnimationFrame((() => fn.run(rateLimit)).bind(fn))
            }
        })
    },

    clearMediaView() {
        const drawContext = this.canvas.getContext('2d');
        const canvasHeight = this.canvas.height;
        const canvasWidth = this.canvas.width;
        drawContext.clearRect(0, 0, canvasWidth, canvasHeight);
    },

    async setChannelSource(channel, sourceId) {
        if (channel.sourceId == sourceId) return
        switch (sourceId) {
            case Source_Id_AudioInput:
                await this.setChannelSourceAudioInput(channel)
                break
            case Source_Id_Media:
                await this.setChannelSourceMedia(channel)
                break
        }
    },

    async setChannelSourceAudioInput(channel) {
        await oscilloscope.initChannelForSource(
            channel,
            Source_Id_AudioInput,
            audioInputDevice)
        this.audioInputChannel = channel
    },

    getInputChannel() {
        return this.audioInputChannel
    },

    async setChannelSourceMedia(channel) {
        await oscilloscope.initChannelForMedia(channel)
    },

    playChannelMedia(channel) {
        if (channel.pause || oscilloscope.pause) return
        oscilloscope.setOut(channel, true)
        channel.mediaSource.play()
            .catch(err => {
                ui.showError(err)
            })
    },

    async updateChannelMedia(channel, url) {
        if (channel.pause || oscilloscope.pause) return
        try {
            if (settings.net.enforceHttps)
                url = url.replace('http://', 'https://')
            channel.mediaSource.audio.src = url
            channel.mediaSource.url = url
            // --> events Metadata loaded + can play
            ///await oscilloscope.initChannelForMedia(channel)
            ///this.playChannelMedia(channel)
        } catch (err) {
            ui.showError(err)
        }
    },

    async addChannel() {
        const channel = await oscilloscope.createChannel(
            Source_Id_None, null)
        oscilloscope.addChannel(channel)
        this.initUI()
        this.requestAnimationFrame()
    },

    deleteChannel(channelId) {
        const channel = oscilloscope.getChannel(channelId)
        if (channel == null)
            logger.error('channel not found', channelId)
        else {
            channel.deleteSource()
            ui.channels.removeControls(channel)
            oscilloscope.removeChannel(channel)
            this.requestAnimationFrame()
        }
    },

    deleteAllChannels() {
        const t = [...oscilloscope.channels]
        t.forEach(channel => {
            this.deleteChannel(channel.channelId)
        })
        this.requestAnimationFrame()
    },
    toggleOPause(then) {
        if (oscilloscope.pause) {
            // unpause immediately
            this.performTogglePause()
            if (then !== undefined) then()
        }
        else
            this.endFrameOneShotOperations.push(() => {
                // delay pause until end of frame
                this.performTogglePause()
                if (then !== undefined) then()
            })
    },

    performTogglePause() {
        oscilloscope.pause = !oscilloscope.pause
        // case Analyzer not controlling sound throught destination (ios createMediaElementSource fails)
        if (oscilloscope.pause) {
            app.channel.mediaSource.pause()
        }
        else {
            app.channel.mediaSource.play()
        }
        // <--
        ui.channels.pauseAllOuts(oscilloscope.pause)
        app.requestAnimationFrame()
    },

    openModule(uri, opts) {
        this.moduleLoader.load(uri, opts, (o, v) => {
            if (!opts.noPopup)
                ui.popups.showPopup(null, o.id)
        })
    },

    onEndOfFrameDo(fn) {
        app.endFrameOneShotOperations.push(
            () => fn()
        )
    },

    /** Device
    * deviceId
    * groupId
    * kind
    * label
    **/

    getInputDevice() {
        return this.audioInputDevice
    },

    getOutputDevice() {
        return this.audioOutputDevice
    }
}

// -------- cordova -----------

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    //document.getElementById('deviceready').classList.add('ready');
}

// -----------------------------

document.addEventListener('DOMContentLoaded', function () {
    if (settings.debug.info)
        console.log('start app')
    app.run()
}, false)
