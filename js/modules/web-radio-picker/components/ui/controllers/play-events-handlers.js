/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class PlayEventsHandlers {

    lastEvents = {
        connecting: null,
        noConnection: null,
        connected: null,
        playing: null,
        pauseStateChanged: null
    }

    storeEvent(id) {
        this.lastEvents[id] = sclone(radsItems.getLoadingItem())
    }

    initAudioSourceHandlers() {
        WRPPMediaSource.onLoadError = (err, audio) => this.onLoadError(err, audio)
        WRPPMediaSource.onLoadSuccess = (audio, ev) => this.onLoadSuccess(audio)
        WRPPMediaSource.onCanPlay = (audio) => this.onCanPlay(audio)
    }

    onLoading(item) {
        this.storeEvent('connecting')

        uiState.setPlayPauseButtonFreezeState(true)
        const st = 'connecting...'
        if (settings.debug.debug) {
            logger.log(st)
        }
        radsItems.updateLoadingRadItem(st)

        app.channel.connected = false
        $('#wrp_connected_icon').addClass('hidden')
        $('#wrp_connect_error_icon').addClass('hidden')
        $('#wrp_connect_icon').removeClass('hidden')
    }

    onLoadError(err, audio) {
        this.storeEvent('noConnection')

        // CORS <=> {code: 4, message: 'MEDIA_ELEMENT_ERROR: Format error'}
        var st = 'no connection'

        if (err?.code == 4)
            st = ' not allowed (cors)'      // the most probable

        ui.showError(st)

        if (settings.debug.debug) {
            logger.log(st)
        }
        radsItems.updateLoadingRadItem(st)

        app.channel.connected = false
        $('#wrp_connected_icon').addClass('hidden')
        $('#wrp_connect_icon').addClass('hidden')
        $('#wrp_connect_error_icon').removeClass('hidden')
        $('#err_txt').text(st)
        $('#err_holder').removeClass('hidden')
    }

    onLoadSuccess(audio, ev) {
        this.storeEvent('connected')

        const st = 'connected'
        app.channel.connected = true
        radsItems.updateLoadingRadItem(st)
        radsItems.setLoadingItemMetadata('startTime', Date.now())

        // metatadata available: audio.duration

        if (settings.debug.debug) {
            logger.log(st)
            console.log(ev)
            logger.log('duration:' + audio.duration)
        }
        $('#wrp_connect_icon').addClass('hidden')
        $('#wrp_connect_error_icon').addClass('hidden')
        $('#wrp_connected_icon').removeClass('hidden')

        // enable save to history list

        const o = uiState.currentRDItem
        if (o != null) {

            window.audio = audio
            var dur = audio.duration

            if (!isNaN(dur)) {
                const duration = DurationHMS.fromSeconds(dur)
                dur = duration.toString()
            }

            if (!o.metadata) o.metadata = {}
            if (!o.metadata.duration) {

                if (settings.debug.debug)
                    console.warn('set duration: ' + dur)
                // store duration
                o.metadata.duration = dur
            }
            else {

                if (dur != null) {
                    if (settings.debug.debug)
                        console.warn('update duration: ' + dur)
                    // upd duration
                    o.metadata.duration = dur
                }
            }

            const item = radsItems.loadingRDItem
            if (item != null) {
                if (item.pdc && dur != null)
                    item.subText2 = o.metadata.duration

                radsItems.updateRadItemView(
                    item,
                    radsItems.$loadingRDItem,
                    null
                )
            }

            playHistory.setupAddToHistoryTimer(o)
        }
    }

    onCanPlay(audio) {
        this.storeEvent('playing')

        //this.startPlayTickTimer()

        uiState.setPlayPauseButtonFreezeState(false)
        const st = 'playing'
        if (settings.debug.debug) {
            logger.log(st)
        }
        radsItems
            .updateLoadingRadItem(st)
            .setLoadingItemMetadata('startTime', Date.now())
        tabsController.showPlayingRdItemViz()
    }

    onPauseStateChanged(updateRadItemStatusText, item, $item) {

        this.storeEvent('pauseStateChanged')

        const pause = oscilloscope.pause
        if (updateRadItemStatusText)
            radsItems.updateLoadingRadItem(
                pause ? 'pause' : 'playing',
                null, $item)

        if (pause) {
            this.stopPlayTickTimer()
            playHistory.clearHistoryTimer()
            radsItems.setLoadingItemMetadata('endTime', Date.now())
        } else {
            this.startPlayTickTimer()
            radsItems.setLoadingItemMetadata('startTime', Date.now())
        }

        uiState.updatePauseView()
    }

    tickTimer = null

    startPlayTickTimer() {
        if (this.tickTimer == null)
            this.tickTimer = setInterval(() => {
                const audio = window.audio
                const position = audio?.currentTime
                if (!isNaN(position)) {
                    const pos = DurationHMS.fromSeconds(position)
                    ////console.log(pos.toString())
                    radsItems.setLoadingItemMetadata('currentTime', pos)
                    const cur = radsItems.getLoadingItem()
                    podcasts.podcastsLists.updateEpiItemView(
                        cur.loadingRDItem, cur.$loadingRDItem
                    )
                }
            }, 500);
    }

    stopPlayTickTimer() {
        clearInterval(this.tickTimer)
        this.tickTimer = null
    }
}