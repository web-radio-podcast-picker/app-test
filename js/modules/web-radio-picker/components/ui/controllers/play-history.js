/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class PlayHistory {

    // timer to add later to history (if any)
    addToHistoryTimer = null

    setupAddToHistoryTimer(radItem) {
        const tid = setTimeout(() => this.addToHistory(radItem),
            wrpp.getSettings().addToHistoryDelay
        )
        if (this.addToHistoryTimer != null)
            clearTimeout(this.addToHistoryTimer)
        this.addToHistoryTimer = tid
    }

    clearHistoryTimer() {
        if (this.addToHistoryTimer != null)
            clearTimeout(this.addToHistoryTimer)
    }

    addToHistory(o) {
        if (uiState.favoriteInputState) return
        // TODO: the method seams not giving credible results
        const historyVisible = wrpp.isRDListVisible(RadioList_List, RadioList_History)

        if (settings.debug.debug)
            logger.log('add to history:' + o?.name)
        o.listenDate = Date.now
        var history = radiosLists.getList(RadioList_History).items
        const itemInList = wrpp.findRadItemInList(o, history)
        if (itemInList != null) {
            // move to top: remove -> will be added on top
            history = history.filter(x => x != itemInList)
            radiosLists.getList(RadioList_History).items = history
        }

        history.unshift(o)

        //const hasRss = o.rss != null && o.rss !== undefined
        //const rss = hasRss ? o.rss : null
        //o.rss = null
        settings.dataStore.saveAll()
        //if (hasRss) o.rss = rss

        // update views
        const list = listsBuilder.updateListsItems()

        // update history list if visible

        if (historyVisible)
            // TODO: restore scroll pos after that
            radListBuilder.updateCurrentRDList(o)
    }

    // always called from the history rd list
    removeFromHistory(item, $item, listId, listName, $butOn, $butOff) {
        if (settings.debug.debug)
            logger.log(`remove from history: ${item.name} list=${listId}:${listName}`)

        this.clearHistoryTimer()

        radiosLists.removeFromList(item, listName)
        if (!oscilloscope.pause)
            app.toggleOPause(() => playEventsHandlers
                .onPauseStateChanged(false, item, $item))
        uiState
            .setPlayPauseButtonFreezeState(true)
            .updateCurrentRDItem(null, true)
        settings.dataStore.saveAll()

        // update views
        const list = listsBuilder.updateListsItems()

        // update history list if visible

        if (wrpp.isRDListVisible(RadioList_List, RadioList_History))
            radListBuilder
                .updateCurrentRDList(item)

        // clear Media view
        rdMediaImage.noImage()
        wrpp.clearRadioView()
        setTimeout(() =>
            app.clearMediaView(), 500)
    }
}