/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const PlayEventsHandlersLogPfx = '[@@] '

class PlayEventsHandlers {

    resetEvents() {
        this.lastEvents = {
            connecting: null,
            noConnection: null,
            connected: null,
            ended: null,
            playing: null,
            pauseStateChanged: null
        }
    }

    storeEvent(id, statusText, item) {
        this.lastEvents[id] = sclone(radsItems.getLoadingItem())
        const ps = wrpp.playingState(item)
        const events = {}
        for (const evk in this.lastEvents) {
            events[evk] = this.lastEvents[evk] != null
        }

        radsItems.setLoadingItemMetadata('playState',
            {
                statusText: statusText,
                loadingState: id,
                playingState: sclone(ps),
                events: events
            })
        radsItems.setLoadingItemMetadata('statusText', statusText)
    }

    initAudioSourceHandlers() {
        WRPPMediaSource.onLoadError = (err, audio) => this.onLoadError(err, audio)
        WRPPMediaSource.onLoadSuccess = (audio, ev) => this.onLoadSuccess(audio)
        WRPPMediaSource.onCanPlay = (audio) => this.onCanPlay(audio)
        WRPPMediaSource.onEnded = (e, audio) => this.onEnded(e, audio)
        this.resetEvents()
    }

    onLoading(item) {

        this.resetEvents()
        this.stopPlayTickTimer()

        uiState.setPlayPauseButtonFreezeState(true)
        const st = 'connecting...'
        if (settings.debug.debug) {
            logger.log(PlayEventsHandlersLogPfx + st)
        }

        radsItems.updateLoadingRadItem(st)
        this.storeEvent('connecting', st, item)

        // auto save single item
        propertiesStore.savePropsToDb(item)

        app.channel.connected = false
        $('#wrp_connected_icon').addClass('hidden')
        $('#wrp_connect_error_icon').addClass('hidden')
        $('#wrp_connect_icon').removeClass('hidden')
    }

    onLoadError(err, audio) {

        // CORS <=> {code: 4, message: 'MEDIA_ELEMENT_ERROR: Format error'}
        var st = 'no connection'

        if (err?.code == 4)
            st = ' not allowed (cors)'      // the most probable

        ui.showError(st)

        if (settings.debug.debug) {
            logger.log(PlayEventsHandlersLogPfx + st)
        }

        const item = radsItems.loadingRDItem
        radsItems.updateLoadingRadItem(st)
        this.storeEvent('noConnection', st, item)

        // auto save single item
        propertiesStore.savePropsToDb(item)

        app.channel.connected = false
        $('#wrp_connected_icon').addClass('hidden')
        $('#wrp_connect_icon').addClass('hidden')
        $('#wrp_connect_error_icon').removeClass('hidden')
        $('#err_txt').text(st)
        $('#err_holder').removeClass('hidden')
    }

    onLoadSuccess(audio, ev) {

        const st = 'connected'
        app.channel.connected = true
        radsItems.updateLoadingRadItem(st)
        radsItems.setLoadingItemMetadata('startTime', Date.now())

        this.storeEvent(st, st, radsItems.loadingRDItem)

        // metatadata available: audio.duration

        if (settings.debug.debug) {
            logger.log(PlayEventsHandlersLogPfx + st)
            console.log(ev)
            logger.log(PlayEventsHandlersLogPfx + ' duration:' + audio.duration)
        }
        $('#wrp_connect_icon').addClass('hidden')
        $('#wrp_connect_error_icon').addClass('hidden')
        $('#wrp_connected_icon').removeClass('hidden')

        // enable save to history list

        const o = uiState.currentRDItem     // TODO: why current item and not loading item ?
        if (o != null) {

            window.audio = audio
            var dur = audio.duration

            if (!isNaN(dur)) {
                dur = DurationHMS.fromSeconds(dur)
            }
            else {
                dur = DurationHMS.fromInfinite()
            }

            if (!o.metadata) o.metadata = {}
            if (!o.metadata.duration) {

                if (settings.debug.debug)
                    console.log(PlayEventsHandlersLogPfx + 'set duration: ' + DurationHMS.text(dur))
                // store duration
                o.metadata.duration = dur
            }
            else {

                if (dur != null) {
                    if (settings.debug.debug)
                        console.log(PlayEventsHandlersLogPfx + 'update duration: ' + DurationHMS.text(dur))
                    // upd duration
                    o.metadata.duration = dur
                }
            }

            // try restore last play position
            if (o.metadata.currentTime) {
                o.metadata.currentTime = DurationHMS.check(o.metadata.currentTime)

                if (DurationHMS.isSeekable(o.metadata.currentTime)) {
                    // restore playing position
                    audio.currentTime = DurationHMS.toSeconds(o.metadata.currentTime)
                    if (settings.debug.debug)
                        console.log(PlayEventsHandlersLogPfx + 'restore position: ' + DurationHMS.text(o.metadata.currentTime))
                }
            }

            const cur = radsItems.getLoadingItem()
            const item = cur.item
            if (item != null) {     // TODO: null here 
                if (item.pdc && dur != null)
                    item.subText2 = o.metadata.duration?.text()

                podcasts.podcastsLists.updateEpiItemView(item, cur.$item)
            }

            ////propertiesStore.save(o)
            // auto save single item
            propertiesStore.savePropsToDb(o)

            playHistory.setupAddToHistoryTimer(o)
        }
    }

    onCanPlay(audio) {

        uiState.setPlayPauseButtonFreezeState(false)
        const st = 'playing'
        if (settings.debug.debug) {
            logger.log(PlayEventsHandlersLogPfx + st)
        }

        const item = radsItems.loadingRDItem
        radsItems
            .updateLoadingRadItem(st)
            .setLoadingItemMetadata('startTime', Date.now())

        this.storeEvent(st, st, item)

        this.setupPlayTickTimer(false)

        // auto save single item
        propertiesStore.savePropsToDb(item)

        // TODO: this should be optimized in epi cases (to be checked)
        tabsController.showPlayingRdItemViz()
    }

    onPauseStateChanged(updateRadItemStatusText, item, $item) {

        // TODO: item null here, coz uiState.currentRDItem is null
        if (item == null) item = radsItems.loadingRDItem

        const pause = oscilloscope.pause
        var pauseText = pause ? 'pause' : 'playing'   // TODO: could be connected not playing
        if (!pause && this.lastEvents.playing == null)
            pauseText = 'connected'

        if (updateRadItemStatusText)
            radsItems.updateLoadingRadItem(
                pauseText,
                null, $item)

        const st = 'pauseStateChanged'
        this.storeEvent(st, pauseText, item)

        if (settings.debug.debug)
            logger.log(PlayEventsHandlersLogPfx + st + ' : ' + pauseText)

        if (this.lastEvents['playing'] && pauseText != 'connected')
            this.setupPlayTickTimer(pause)

        // auto save single item
        propertiesStore.savePropsToDb(item)

        uiState.updatePauseView()
    }

    setupPlayTickTimer(pause) {
        if (pause) {
            this.stopPlayTickTimer()
            playHistory.clearHistoryTimer()
            radsItems.setLoadingItemMetadata('endTime', Date.now())
        } else {
            this.startPlayTickTimer()
            radsItems.setLoadingItemMetadata('startTime', Date.now())
        }
    }

    onEnded(e, audio) {
        const cur = radsItems.getLoadingItem()

        const st = 'ended'
        this.storeEvent(st, st, cur.loadingRDItem)

        // auto save single item
        propertiesStore.savePropsToDb(cur.loadingRDItem)

        podcasts.podcastsLists.updateEpiItemView(cur.loadingRDItem, cur.$loadingRDItem)
    }

    tickTimer = null

    startPlayTickTimer() {
        if (this.tickTimer == null) {
            if (settings.debug.debug)
                console.log(PlayEventsHandlersLogPfx + 'start play tick timer')

            this.tickTimer = setInterval(() => {
                const audio = window.audio

                const position = audio?.currentTime
                const pos = DurationHMS.fromSeconds(position)    ////console.log(pos.toString())
                radsItems.setLoadingItemMetadata('currentTime', pos)

                const cur = radsItems.getLoadingItem()
                podcasts.podcastsLists.updateEpiItemView(
                    cur.loadingRDItem, cur.$loadingRDItem
                )
            }, 500)
        }
    }

    stopPlayTickTimer() {
        if (settings.debug.debug)
            console.log(PlayEventsHandlersLogPfx + 'stop play tick timer')

        clearInterval(this.tickTimer)
        this.tickTimer = null
    }
}