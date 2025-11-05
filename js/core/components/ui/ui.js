/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// ui

ui = {

    oscilloscope: null,     // reference to the oscilloscope manager
    initialized: false,     // object initialized
    uiInitialized: false,   // indicates if ui is already globally initialized
    popupId: null,          // any id of an html popupId currently opened/showed
    popupCtrlId: null,      // popup control placement if any else null
    bindings: new Bindings(),
    toggles: new Toggles(),

    /**
     * @type {Popups}
     */
    popups: new Popups(),

    channels: new Channels(),
    inputWidgets: new InputWidgets(),
    scrollers: new Scrollers(),
    tabs: new Tabs(),
    errExcludes: ['AbortError'],
    errReplaces: [['NotSupportedError', 'no connection']],
    onResize: [],
    vizTabActivated: false,

    init(oscilloscope) {

        this.oscilloscope = oscilloscope

        this.oscilloscope.channels.forEach(channel => {
            if (!channel.ui) {
                channel.ui = true
            }
        });

        if (!this.uiInitialized) {
            this.init_ui()
            this.uiInitialized = true
            logger.log("UI initialized")
        }
    },

    setupScreen() {
        if (settings.features.constraints.enableRotateYourDevicePopup)
            screen.orientation.addEventListener('change', () => this.updateOrientation())

        if (screen.lockOrientation) screen.lockOrientation(Screen_Orientation_Landscape)

        document.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        })

        const offIconId = 'wrp_fullscreen_off'
        const onIconId = 'wrp_fullscreen_on'
        document.addEventListener('fullscreenchange', () => {
            if (settings.debug.debug)
                logger.log('fullscreen changed')
            if (document.fullscreenElement) {
                $('#' + offIconId).removeClass('hidden')
                $('#' + onIconId).addClass('hidden')
            } else {
                $('#' + onIconId).removeClass('hidden')
                $('#' + offIconId).addClass('hidden')
            }
        })
    },

    showRotateYourDevicePopup() {
        const pid = 'ryd_popup'
        const $popup = $('#' + pid)
        $popup.removeClass('hidden')
    },

    hideRotateYourDevicePopup() {
        const pid = 'ryd_popup'
        const $popup = $('#' + pid)
        $popup.addClass('hidden')
    },

    init_pre_intro() {
        this.setupScreen()
        this.popups.init_popups()
        if (settings.features.constraints.enableRotateYourDevicePopup) {
            this.updateOrientation()        // mobile web
        }
        $('#title_ver').text(' ' + settings.app.wrp.version)
    },

    init_intro() {

        const pid = 'intro_popup'
        const $popup = $('#' + pid)

        $('#sys_app_ver').text(settings.app.kernel.version)
        $('#sys_app_ver_date').text(settings.app.kernel.verDate)
        $('#wrp_app_ver').text(settings.app.wrp.version)
        $('#wrp_app_ver_date').text(settings.app.wrp.verDate)

        this.popups.updatePopupPositionAndSize(null, $popup, null)
        $popup.addClass('opaque')
        $popup.removeClass('transparent')

        $popup.on('click', () => {
            this.hide_intro_popup()
            this.init_post_intro()
            cui.setFullscreen(true)
            setTimeout(() => {
                this.showUI()
            }, 200)
        })
    },

    skip_intro() {
        this.hide_intro_popup()
        this.init_post_intro()
        this.showUI()
    },

    hide_intro() {
        setTimeout(() => {
            this.hide_intro_popup()
        }, settings.ui.introPopupDelay)
    },

    // flag:kiosk
    init_kiosk() {
        this.hide_intro_popup()
        //cui.setFullscreen(true)
        this.showUI()
        this.init_post_intro()
    },

    hideFullscreenButton() {
        $('#fullscreen_button').addClass("hidden")
        $('#bt_bar').addClass('wrp-but-col-no-fsbut')
    },

    hide_intro_popup() {
        const pid = 'intro_popup'
        const $popup = $('#' + pid)
        $popup.addClass("hidden")
    },

    showUI() {
        $('.module-full-pane').removeClass('transparent')
    },

    init_post_intro() {
        if (settings.features.constraints.noFullscreenToggling)
            this.hideFullscreenButton()
    },

    init_ui() {

        // events
        $(window).resize(() => {
            //oscilloscope.refreshView()
            this.popups.updatePopupsPositionAndSize()
            const $c = $(app.canvas)
            const vis = !$c.hasClass('hidden')
            if (vis) {
                app.canvas.width = 0
                app.canvas.height = 0
            }
            this.onResize.forEach(f => {
                f()
            })
        })
        window.onerror = (messOrEvent, src, line, col, err) => {
            this.showError(messOrEvent, src, line, col, err)
        }

        // properties
        $('input').attr('autocomplete', 'off')

        // bindings
        this
            .bindings.bind(this.bindings.binding(
                'app_ver',
                'settings.app.version',
                { readOnly: true, attr: 'text' }))
            .bindings.bind(this.bindings.binding(
                'app_ver_date',
                'settings.app.verDate',
                { readOnly: true, attr: 'text' }))

        const $c = $('#err_txt')
        $c.on('click', () => {
            $c.text('')
        })
    },

    getCurrentChannel() {
        return app.channel
    },

    getCurrentChannelPath(subPath) {
        return 'app.channel.'
            + ((subPath == null || subPath === undefined) ?
                '' : subPath)
    },

    setupCanvasSize(canvas) {
        const vs = cui.viewSize()
        const htmlWidth = vs.width
        const htmlHeight = vs.height
        var updated = false
        // auto size canvas (maximize)
        if (canvas.width !== htmlWidth) {
            canvas.width = htmlWidth
            updated = true
        }
        if (canvas.height !== htmlHeight) {
            canvas.height = htmlHeight
            updated = true
        }
        return updated
    },

    setupUIComponents() {
        const vs = cui.viewSize()
        const w = vs.width
        const h = vs.height

        // buttons bars

        var $b = $('#buttons_bar')
        const nbButtons = 2
        var left = w - 42 * nbButtons - 118 - 7 * (nbButtons + 1)
        var top = h + settings.ui.buttonBarRelY
        $b.css('left', left + 'px')
        $b.css('top', top + 'px')
        $b.removeClass('hidden')

        $b = $('#buttons_bar2')
        left = w - 118 + 7 + 5 - 4
        $b.css('left', left + 'px')
        $b.css('top', top + 'px')
        $b.removeClass('hidden')

        // bottom views

        var $p = $('#bottom-pane')
        $p.css('left', 50 + 'px')
        var btop = h + settings.ui.infoBarRelY
        $p.css('top', btop + 'px')
        $p.removeClass('hidden')

        const $p2 = $('#right_bottom_pane')
        $p2.css('left', w - 25 * 7 + 'px')
        $p2.css('top', btop + 'px')
        $p2.removeClass('hidden')

        // information

        $p = $('#error_pane')
        $p.css('left', 50 + 'px')
        var btop2 = h + settings.ui.errorBarRelY
        $p.css('top', btop2 + 'px')
        $p.removeClass('hidden')

        $('#main_menu').removeClass('hidden')

        this.popups.updatePopupsPositionAndSize()
    },

    hideError() {
        const $e = $('#err_txt')
        $e.text('')
        $('#err_holder').addClass('hidden')
        $('#err_text').addClass('hidden')
    },

    showError(messOrEvent, src, line, col, err) {
        window.err = {
            messOrEvent: messOrEvent,
            src: src,
            line: line,
            col: col,
            err: err
        }
        var novis = false
        this.errExcludes.forEach(e => {
            try {
                const m = messOrEvent.toString()
                novis |= m.startsWith(e)
            } catch (err) { }
        })
        if (!novis) {

            this.errReplaces.forEach(t => {
                try {
                    const m = messOrEvent.toString()
                    if (m.startsWith(t[0]))
                        messOrEvent = t[1]
                } catch (err) { }
            })

            $('#err_holder').removeClass('hidden')
            const $e = $('#err_txt')
            $e.text(messOrEvent)
            $e.removeClass('hidden')
            const self = this
            setTimeout(() => {
                self.hideError()
            }, settings.ui.errDisplayTime)
        }
        logger.error(messOrEvent, err)

        /*  // auto hide timer
            setTimeout(() => {
            $e.text('')
        }, settings.ui.errDisplayTime)*/
    },

    checkSizeChanged() {
        const html = document.querySelector('html')
        const htmlWidth = html.clientWidth
        const htmlHeight = html.clientHeight
        var updated =
            canvas.width !== htmlWidth
            || canvas.height !== htmlHeight
        return updated
    },

    updateOrientation() {
        const or = this.getOrientation()
        if (or != Screen_Orientation_Landscape) {
            this.showRotateYourDevicePopup()
            if (settings.debug.debug)
                logger.log('show rotate your device popup')
        }
        else {
            this.hideRotateYourDevicePopup()
            if (settings.debug.debug)
                logger.log('hide rotate your device popup')
        }
    },

    getOrientation() {
        if (settings.features.constraints.useNavigatorOrientationProperty)
            return this.getOrientationNavProp()
        const or = cui.getOrientation()
        return or
    },

    // use navigator property
    getOrientationNavProp() {
        const orientation = screen.orientation.type;
        var ori = ''
        if (orientation.includes('portrait')) {
            ori = Screen_Orientation_Portrait
        } else if (orientation.includes('landscape')) {
            ori = Screen_Orientation_Landscape
        }
        logger.log('getOrientation = ' + ori)
        return ori
    }
}
