/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class PlayEventsHandlers {

    initAudioSourceHandlers() {
        WRPPMediaSource.onLoadError = (err, audio) => this.onLoadError(err, audio)
        WRPPMediaSource.onLoadSuccess = (audio, ev) => this.onLoadSuccess(audio)
        WRPPMediaSource.onCanPlay = (audio) => this.onCanPlay(audio)
    }

    onLoading(item) {
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
                try {
                    // should be hh:mm:ss
                    var h = Math.floor(parseFloat((parseFloat(dur) / (60 * 24)).toFixed(2)))
                    const durM = dur - (h * 60 * 24)
                    var m = Math.floor(parseFloat((parseFloat(durM) / 60).toFixed(2)))
                    var s = Math.floor(durM - m * 60)
                    h += ''
                    m += ''
                    s += ''
                    if (h.length == 1) h = '0' + h
                    if (m.length == 1) m = '0' + m
                    if (s.length == 1) s = '0' + s
                    const strDur = h + ':' + m + ':' + s
                    dur = strDur

                } catch {
                    dur = null
                }
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
        if (updateRadItemStatusText)
            radsItems.updateLoadingRadItem(
                oscilloscope.pause ?
                    'pause' : 'playing',
                null, $item)
        const pause = oscilloscope.pause
        if (pause) {
            playHistory.clearHistoryTimer()
            radsItems.setLoadingItemMetadata('endTime', Date.now())
        } else
            radsItems.setLoadingItemMetadata('startTime', Date.now())
        uiState.updatePauseView()
    }
}