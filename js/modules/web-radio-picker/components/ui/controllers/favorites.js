/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class Favorites {

    addFavorite(item, $item, listId, listName, $butOn, $butOff) {
        if (settings.debug.debug)
            logger.log(`add favorite: ${item.name} (from list=${listId}:${listName})`)

        // must select a fav in lists ui

        uiState.setFavoriteInputState(
            true,
            item,
            $item,
            $butOn, $butOff)
    }

    endAddFavorite($favItem, rdList, isNewFavList) {
        if (settings.debug.debug)
            logger.log(`add favorite to: list=${rdList.listId}:${rdList.name}`)

        const {
            addingFavoriteItem,
            $addingFavoriteItem,
            $addingFavoriteItemButOn,
            $addingFavoriteItemButOff
        } = uiState.getAddingFavoriteItem()

        uiState.setFavoriteInputState(
            false,
            uiState.addingFavoriteItem,
            uiState.$addingFavoriteItem)

        // update fav list
        // TODO: should remove from any list where it exists coz there is only one favorite possible
        radiosLists.removeFromAnyList(addingFavoriteItem)

        if (!radiosLists.addToList(rdList.listId, rdList.name, addingFavoriteItem)) {
            radiosLists.removeFromList(addingFavoriteItem, rdList.name)
            radiosLists.addToList(rdList.listId, rdList.name, addingFavoriteItem)
        }

        // upd item favlist

        if (!addingFavoriteItem.favLists.includes(rdList.name))
            addingFavoriteItem.favLists.push(rdList.name)

        // ---- put new fav in mem items store -----
        wrpp.checkItemKey(addingFavoriteItem)
        memoryItemsStore.put(addingFavoriteItem)
        propertiesStore.savePropsToDb(addingFavoriteItem)
        // ------------------------------------------

        // TODO: this update occurs before list is visible in case of async view build
        radsItems.updateRadItemView(
            addingFavoriteItem,
            $addingFavoriteItem
        )
        wrpp.setupRadioView(uiState.currentRDItem)

        // update the fav list
        listsBuilder.updateListsItems()

        settings.dataStore.saveAll()
    }

    editFavoriteListName($item, listId, listName) {
        if (settings.debug.debug)
            logger.log(`edit favorite list name: list=${listId}:${listName}`)

        playHistory.clearHistoryTimer()

        uiState.setFavoriteInputState(
            true,
            null,
            $item,
            null, null,
            {
                noActionPane: true,
                noUnselectItem: true,
                noChangeTab: true,
                setListState: 'opts_wrp_play_list'
            })

        radsItems.setAllButtonsStatus($item, false)
        $item.find('.wrp-list-item-sub').addClass('hidden')

        const $inp = $('<input type="text" id="input_list_item">')
        const $container = $item.find('.wrp-list-item-text-container')
        const value = $container.text()
        $container.text('')
        $inp[0].value = value
        $container.append($inp)

        $inp.on('keypress', e => {
            const $inp = $(e.currentTarget)
            const text = $inp.length > 0 ? $inp[0].value : null
            const textValid = text !== undefined && text != null && text != ''
            // return
            if (textValid && e.which == 13) {
                this.endEditFavoriteListName($item, $inp, text)
            }
        })

        $inp.focus()
    }

    endEditFavoriteListName($item, $inp, text) {

        playHistory.clearHistoryTimer()

        uiState.setFavoriteInputState(
            false,
            null,
            $item,
            null, null,
            {
                noActionPane: true,
                noUnselectItem: true,
                noChangeTab: true,
                setListState: 'opts_wrp_play_list'
            })

        const key = $item.attr('data-text')
        radiosLists.renameList(key, text)
        uiState.currentRDList.name = text
        $item.attr('data-text', text)
        if (settings.debug.debug) {
            logger.log(`rename list '${key}' to '${text}'`)
        }

        const { loadingRDItem, $loadingRDItem } = radsItems.getLoadingItem()
        if (settings.debug.debug) {
            logger.log(`loading RDItem : ${loadingRDItem?.name}`)
        }
        radsItems.updateRadItemView(loadingRDItem, $loadingRDItem)

        const lst = uiState.currentRDList
        radListBuilder.pathBuilder.buildTopFavPath(lst.listId, lst.name)
        wrpp.setupRadioView(uiState.currentRDItem)

        $inp.remove()
        $item.find('.wrp-list-item-text-container').text(text)

        radsItems.setAllButtonsStatus($item, true)
        $item.find('.wrp-list-item-sub').removeClass('hidden')

        settings.dataStore.saveAll()
    }

    //#updateCurrentItemFav()

    addNewFavoriteList() {
        $('#wrp_but_add_fav').addClass('menu-item-disabled')
        const t = radiosLists.lists
        const names = getSortedNames(t)
        const i = names.length
        const listName = "input_list_item"
        const { domItem, $item } = radListBuilder.buildListItem(
            "",
            i,
            i,
            { count: 0 },
            null,
            null,
            null
        )
        const $inp = $('<input type="text" id="' + listName + '">')
        const $container = $item.find('.wrp-list-item-text-container')
        $container.append($inp)

        const item = radiosLists.radioList(RadioList_List, listName)

        $inp.on('keypress', e => {
            const $inp = $(e.currentTarget)
            const text = $inp.length > 0 ? $inp[0].value : null
            const textValid = text !== undefined && text != null && text != ''
            // return
            if (textValid && e.which == 13) {
                this.endNewFavoriteList(item, $item, false)
            }
        })

        uiState.setAddNewFavoriteListInputState(item, $item)
        const listId = 'opts_wrp_play_list'
        const $pl = $('#' + listId)
        $pl.find('.wrp-list-item').addClass('but-icon-disabled')
        uiState.setItemsListState(listId, false)
        $pl.append($item)
        $inp.focus()
    }

    endNewFavoriteList(favItem, $favItem, isCancelled) {
        const listName = "input_list_item"
        const { item, $item } = uiState.getNewFavoriteListInput()
        const $inp = $item.find('#' + listName)
        const text = $inp[0].value
        item.name = text
        const rdList = radiosLists.addList(item.listId, item.name)
        uiState.setAddNewFavoriteListInputState(null, null)
        this.endAddFavorite($favItem, rdList, true)
    }

    getItemFavoritesFiltered(item) {
        const favs = item.favLists.filter(x => x != RadioList_History)
        return favs
    }

    removeFavorite(item, $item, listName, $butOn, $butOff) {
        if (settings.debug.debug)
            logger.log(`remove favorite: ${item.name}`)

        playHistory.clearHistoryTimer()

        const favs = this.getItemFavoritesFiltered(item)
        var delFav = null
        favs.forEach(fav => {
            radiosLists.removeFromList(item, fav)
            delFav = fav
        });
        radsItems.updateRadItemView(item, $item)

        // ----- update storage -----
        wrpp.checkItemKey(item)
        propertiesStore.savePropsToDb(item)

        // update the fav list
        listsBuilder.updateListsItems()

        wrpp.setupRadioView(uiState.currentRDItem)

        // update rad list if current is the fav list
        const crdl = uiState.currentRDList
        if (crdl.listId == RadioList_List && crdl.name == delFav)
            radListBuilder
                .updateCurrentRDList(item)

        settings.dataStore.saveAll()
    }

    // always called from the history list
    deleteFavoriteList(listName) {
        if (settings.debug.debug)
            logger.log(`delete favorite list: ${listName}`)

        playHistory.clearHistoryTimer()

        dialogs.showDialogConfirm(
            dialogs.dialogConfirm(
                'Confirm delete ?', null,
                res => this.confirmDeleteFavoriteList(res, listName)
            )
        )
    }

    deleteAllFavoritesLists() {
        if (settings.debug.debug)
            logger.log('delete all favorites lists')
        playHistory.clearHistoryTimer()
        dialogs.showDialogConfirm(
            dialogs.dialogConfirm(
                'Confirm delete all ?', null,
                res => this.confirmDeleteAllFavoritesLists(res)
            )
        )
    }

    confirmDeleteAllFavoritesLists(res) {
        dialogs.hideDialogConfirm()
        if (!res.confirm) return

        radiosLists.deleteAllLists()
        // cleanup history view
        listsBuilder
            .clearFavoritesView()
            .buildListsItems()
        // refresh top path
        if (uiState.currentRDList_Back?.listId == RadioList_List) {
            radListBuilder.clearRadList()
            radListBuilder.pathBuilder.buildTopFavPath(
                RadioList_List, null
            )
        }
        if (uiState.currentRDItem != null) {
            // refresh current rd list
            radListBuilder.updateCurrentRDList(
                uiState.currentRDItem,
                uiState.currentRDList_Back)
            // refresh bottom path
            radListBuilder.pathBuilder.buildRadioViewTagPath(
                uiState.currentRDItem
            )
        }

        settings.dataStore.saveAll()
    }

    confirmDeleteFavoriteList(res, listName) {

        dialogs.hideDialogConfirm()

        if (!res.confirm) return

        radiosLists.deleteList(listName)

        radListBuilder
            .deleteSelectedListItem('opts_wrp_play_list')
            .clearRadList()

        uiState.updateCurrentRDList(null, true)

        settings.dataStore.saveAll()
    }

    emptyFavoriteList(listName) {
        if (settings.debug.debug)
            logger.log(`empty favorite list: ${listName}`)

        playHistory.clearHistoryTimer()

        dialogs.showDialogConfirm(
            dialogs.dialogConfirm(
                'Confirm erase ?', null,
                res => this.confirmEmptyFavoriteList(res, listName)
            )
        )
    }

    confirmEmptyFavoriteList(res, listName) {

        dialogs.hideDialogConfirm()

        if (!res.confirm) return

        radiosLists.emptyList(listName)

        // update the fav list
        listsBuilder.updateListsItems()
        radListBuilder.clearRadList()

        settings.dataStore.saveAll()
    }

    getFavName(rdItem) {
        if (rdItem == null || rdItem.favLists === undefined || rdItem.favLists == null)
            return null
        const favs = rdItem.favLists.filter(x => x != RadioList_History)
        const favName = favs.length > 0 ? favs[0] : null
        return favName
    }
}
