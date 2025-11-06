/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

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

        uiState.setPlayPauseButtonFreezeState(true)
        const st = 'connecting...'
        if (settings.debug.debug) {
            logger.log(st)
        }

        radsItems.updateLoadingRadItem(st)
        this.storeEvent('connecting', st, item)

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
            logger.log(st)
        }

        radsItems.updateLoadingRadItem(st)
        this.storeEvent('noConnection', st, radsItems.loadingRDItem)

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
                dur = DurationHMS.fromSeconds(dur)
            }
            else {
                dur = DurationHMS.fromInfinite()
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

            const cur = radsItems.getLoadingItem()
            const item = cur.item
            if (item != null) {
                if (item.pdc && dur != null)
                    item.subText2 = o.metadata.duration?.text()

                podcasts.podcastsLists.updateEpiItemView(item, cur.$item)
            }

            playHistory.setupAddToHistoryTimer(o)
        }
    }

    onCanPlay(audio) {

        uiState.setPlayPauseButtonFreezeState(false)
        const st = 'playing'
        if (settings.debug.debug) {
            logger.log(st)
        }

        radsItems
            .updateLoadingRadItem(st)
            .setLoadingItemMetadata('startTime', Date.now())

        this.storeEvent(st, st, radsItems.loadingRDItem)

        tabsController.showPlayingRdItemViz()
    }

    onPauseStateChanged(updateRadItemStatusText, item, $item) {

        const pause = oscilloscope.pause
        const pauseText = pause ? 'pause' : 'playing'

        if (updateRadItemStatusText)
            radsItems.updateLoadingRadItem(
                pauseText,
                null, $item)

        this.storeEvent('pauseStateChanged', pauseText, item)

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

    onEnded(e, audio) {
        const cur = radsItems.getLoadingItem()

        const st = 'ended'
        this.storeEvent(st, st, cur.loadingRDItem)

        podcasts.podcastsLists.updateEpiItemView(cur.loadingRDItem, cur.$loadingRDItem)
    }

    tickTimer = null

    startPlayTickTimer() {
        if (this.tickTimer == null)
            this.tickTimer = setInterval(() => {
                const audio = window.audio

                const position = audio?.currentTime
                const pos = DurationHMS.fromSeconds(position)    ////console.log(pos.toString())
                radsItems.setLoadingItemMetadata
                radsItems.setLoadingItemMetadata('currentTime', pos)

                const cur = radsItems.getLoadingItem()
                podcasts.podcastsLists.updateEpiItemView(
                    cur.loadingRDItem, cur.$loadingRDItem
                )
            }, 500);
    }

    stopPlayTickTimer() {
        clearInterval(this.tickTimer)
        this.tickTimer = null
    }
}