/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class UIState {

    //#region attributes

    // RDList is the right pane container. can holds an item list or not (eg. info pane)
    // struct RDList { listId, name, $item }
    currentRDList = null
    currentRDList_Back = null
    // current playable item ref
    currentRDItem = null
    // history of current items refs
    RDItemsRefsHistory = []
    // list id -> tab id
    listIdToTabId = {
        'List': 'btn_wrp_play_list',
        'All': 'btn_wrp_all_radios',  // not a tab
        'Art': 'btn_wrp_art_list',
        'Lang': 'btn_wrp_lang_list',
        'Tag': 'btn_wrp_tag_list',
        'Podcast': 'btn_wrp_podcast',
        'Viz': 'btn_wrp_logo'         // not a tab
        // RadioList_Info
    }
    // current group tab
    currentTab = null
    disableSave = false
    // rd lists cur & back memo
    memRDLists = null
    // ui in favorite input state if true
    favoriteInputState = false
    freezedState = false
    addingFavoriteItem = null
    $addingFavoriteItem = null
    $addingFavoriteItemButOn = null
    $addingFavoriteItemButOff = null
    addingNewFavoriteListItem = null
    $addingNewFavoriteListItem = null

    //#endregion

    tabIdToListId(tabId) {
        var res = null
        for (var listId in this.listIdToTabId) {
            const ltabId = this.listIdToTabId[listId]
            if (tabId == ltabId)
                res = listId
        }
        return res
    }

    setTab(listId) {
        if (this.listIdToTabId[listId]) {
            const tabId = this.listIdToTabId[listId]
            const $tab = $('#' + tabId)
            $tab.click()

            tabsController.focusTabSelectedItem($tab)

            logger.log('set tab: ' + tabId)
            uiState.updateCurrentTab($tab[0].id)

            return tabId
        }
        return null
    }

    updateCurrentTab(tabId, skipSave) {
        const t = Object.keys(uiState.listIdToTabId)
            .map(x => { return { 'listId': x, 'tabId': uiState.listIdToTabId[x] } })
            .filter(x => x.tabId == tabId)
        this.currentTab = t.length > 0 ? t[0] : null

        if (this.currentTab != null) {
            const $tab = $('#' + tabId)
            tabsController.focusTabSelectedItem($tab)
        }

        if (skipSave !== true && !this.disableSave)
            settings.dataStore.saveUIState()

        if (settings.debug.debug)
            logger.log('currentTab=' + JSON.stringify(t))
    }

    #setRDList(rdList) {
        const acceptNoName = [
            RadioList_All
            /*RadioList_Info*/
        ]
        const skipInit = [
            RadioList_Info
        ]
        if (skipInit.includes(rdList.listId)) return

        this.updateCurrentRDList(rdList, true)
        if (((rdList?.name || null) == null)
            && !acceptNoName.includes(rdList.listId))
            return
        const itemRef = wrpp.getListItem(rdList)
        if (itemRef == null) return

        const $item = $(itemRef.item)
        if (rdList.listId == RadioList_All) {
            // button 'all'
            $item.click()
        }
        else {
            // list item
            const $cbox = $item.find('.wrp-list-item-text-container')
            $cbox[0].click()
        }
    }

    updateCurrentRDList(newList, skipSave) {
        this.currentRDList_Back = this.currentRDList
        this.currentRDList = newList
        if (skipSave !== true && !this.disableSave)
            settings.dataStore.saveUIState()
        if (settings.debug.debug)
            console.log('currentRDList=' + JSON.stringify(this.currentRDList))
    }

    getCurrentRDLists() {
        return {
            cur: this.uiState.currentRDList,
            back: this.uiState.currentRDList_Back
        }
    }

    #setRDItem(rdItem) {
        var radItem = wrpp.findRadItem(rdItem)
        if (radItem == null) return
        this.currentRDItem = radItem    // avoid a clone
        var item = wrpp.getRadListItem(radItem)
        if (item != null) {
            const $item = $(item.item)
            wrpp.focusListItem(item.item)
            $item.find('.wrp-list-item-text-container').click()
        }
    }

    // a playable item (not a group) : radioItem
    // build a RD
    updateCurrentRDItem(radioItem, skipSave) {
        if (radioItem != null)
            radioItem.ref = this.radioRef()
        this.currentRDItem = radioItem
        if (skipSave !== true && !this.disableSave)
            settings.dataStore.saveUIState()
        if (settings.debug.trace)
            logger.log('currentRDItem=' + JSON.stringify(radioItem))
    }

    // build a RDList struct
    RDList(listId, name, $item) {
        return {
            listId: listId,
            name: name,
            $item: $item
        }
    }

    getCurrentUIState() {

        if (this.currentRDItem != null && this.currentRDItem.ref != null)
            this.currentRDItem.ref.currentRDList.$item = null

        const r = {
            storeKey: 'uiState',
            currentRDList: {
                listId: this.currentRDList?.listId || null,
                name: this.currentRDList?.name || null
            },
            currentRDList_Back: {
                listId: this.currentRDList_Back?.listId || null,
                name: this.currentRDList_Back?.name || null
            },
            currentTab: {
                listId: this.currentTab?.listId || null,
                name: this.currentTab?.tabId || null
            },
            currentRDItem: this.currentRDItem,
            podcastSelection: podcasts.selection
        }

        const str =
            settings.db.useLocalStorage ?
                JSON.stringify(r, (k, v) => {
                    if (serializeField(k))
                        return v
                    else return null
                }) : ''

        return { object: r, json: str }
    }

    restoreUIState(state) {
        this.disableSave = true

        if (state.podcastSelection != null)
            podcasts.selection = state.podcastSelection

        if (state.currentRDList_Back != null)
            this.#setRDList(state.currentRDList_Back)
        if (state.currentRDList != null)
            this.#setRDList(state.currentRDList)
        if (state.currentTab != null)
            this.setTab(state.currentTab.listId)
        tabsController.preserveCurrentTab = true
        // ---
        if (state.currentRDItem != null)
            this.#setRDItem(state.currentRDItem)

        if (settings.debug.debug) {
            console.log('restore UI state: ')
            console.log(state)
            console.log(this)
            if (settings.debug.globalObj)
                window.state = state
        }

        this.disableSave = false
    }

    // radio reference model - locate a radio in a list
    radioRef() {
        return {
            currentRDList: this.currentRDList,
            currentTab: this.currentTab
        }
    }

    toJSON() {
        const state = this.getCurrentUIState().json
        ////return JSON.stringify(state)
        return state
    }

    fromJSON(s) {
        const state = JSON.parse(s)
        this.fromObject(state)
    }

    fromObject(o) {
        this.restoreUIState(o)
    }

    // ----- UI states updaters -----

    setPlayPauseButtonFreezeState(freezed) {
        const c = 'but-icon-disabled'
        const setState = (id, freezed) => {
            const $b = $('#' + id)
            if (freezed)
                $b.addClass(c)
            else
                $b.removeClass(c)
        }
        setState('wrp_btn_pause_on', freezed)
        setState('wrp_btn_pause_off', freezed)
        return this
    }

    updatePauseView() {
        if (oscilloscope.pause) {
            $('#wrp_btn_pause_on').addClass('hidden')
            $('#wrp_btn_pause_off').removeClass('hidden')
        } else {
            $('#wrp_btn_pause_off').addClass('hidden')
            $('#wrp_btn_pause_on').removeClass('hidden')
        }
    }

    // ----- UI freeze & editing status management -----

    memoRDLists() {
        this.memRDLists = {
            curList: this.currentRDList,
            backList: this.currentRDList_Back,
            curTab: this.currentTab,
            curRDItem: this.currentRDItem
        }
    }

    restoreRDLists(opts) {
        const m = this.memRDLists
        if (m == null) return
        this.currentRDList = m.curList
        this.currentRDList_Back = m.backList
        if (opts.noChangeTab != true) {
            const listId = m.curTab != null ?
                m.curTab.listId :
                m.curList.listId
            const tabId = this.setTab(listId)
            this.currentTab = { listId: listId, tabId: tabId }
        }
        this.memRDLists = null
    }

    setAddNewFavoriteListInputState(item, $item) {
        this.addingNewFavoriteListItem = item
        this.$addingNewFavoriteListItem = $item
    }

    getNewFavoriteListInput() {
        return {
            item: this.addingNewFavoriteListItem,
            $item: this.$addingNewFavoriteListItem
        }
    }

    getAddingFavoriteItem() {
        return {
            addingFavoriteItem: this.addingFavoriteItem,
            $addingFavoriteItem: this.$addingFavoriteItem,
            $addingFavoriteItemButOn: this.$addingFavoriteItemButOn,
            $addingFavoriteItemButOff: this.$addingFavoriteItemButOff
        }
    }

    setFreezeUI(enabled) {
        const opts = {
            noRestoreLists: true,
            setListState: 'opts_wrp_play_list',
            noChangeTab: true,
            noActionPane: true,
            noUnselectItem: true,
            avoidAddingState: true
        }
        this.setFreezeUIState(enabled, opts)
    }

    setFreezeUIState(enabled, opts, item, $item, $butOn, $butOff) {
        if (opts === undefined || opts == null)
            opts = {}
        this.freezedState = enabled
        const menuItemDisabledCl = 'menu-item-disabled'

        ui.tabs
            .setTabsFreezed(tabsController.tabs,
                'btn_wrp_play_list',
                menuItemDisabledCl, enabled)
            .setTabsFreezed(
                ['btn_wrp_all_radios'],
                null, menuItemDisabledCl, enabled)

        this.setInfoButtonState(!enabled)
        this.setCurrentRadItemButtonsState(!enabled)
        this.setSelectedListItemButtonsState(!enabled)
        this.setRadItemsListState(!enabled)
        this.setSelectedItemsState(!enabled)
        this.setPathButtonsState(!enabled)
        if (opts.setListState)
            this.setItemsListState(opts.setListState, !enabled, true)

        if (enabled) {

            if (opts.noRestoreLists != true)
                this.memoRDLists()
            if (opts.noChangeTab != true)
                this.setTab(RadioList_List)
            if (opts.noActionPane != true) {
                $('#opts_add_favorite_action_pane')
                    .removeClass('hidden')
                $('#left-pane')
                    .addClass('showActionPane')
            }
            if (opts.noUnselectItem != true)
                // remove selection
                wrpp.clearContainerSelection('opts_wrp_play_list')

            if (opts.avoidAddingState != true) {
                this.addingFavoriteItem = item
                this.$addingFavoriteItem = $item
                this.$addingFavoriteItemButOn = $butOn
                this.$addingFavoriteItemButOff = $butOff
            }

        } else {

            $('#opts_add_favorite_action_pane')
                .addClass('hidden')
            $('#left-pane')
                .removeClass('showActionPane')
            if (opts.noRestoreLists != true)
                this.restoreRDLists(opts)
            $('#wrp_but_add_fav').removeClass('menu-item-disabled')
        }
    }

    setFavoriteInputState(enabled, item, $item, $butOn, $butOff, opts) {

        this.setFreezeUIState(enabled, opts, item, $item, $butOn, $butOff)
        this.favoriteInputState = enabled
        return this
    }

    setInfoButtonState(enabled) {
        const $cnt = $('#btn_wrp_infos')
        const $bt = $cnt.find('img')
        const disabledCl = 'but-icon-disabled'
        const disabledBtCl = 'menu-item-disabled'
        if (!enabled) {
            $cnt.addClass(disabledCl)
            $bt.addClass(disabledBtCl)
        }
        else {
            $cnt.removeClass(disabledCl)
            $bt.removeClass(disabledBtCl)
        }
    }

    setCurrentRadItemButtonsState(enabled) {
        const item = this.currentRDItem
        if (item == null) return
        const radListItem = wrpp.getRadListItemById(item.id)
        if (radListItem != null) {
            const $item = $(radListItem.item)
            const $buts = $item.find('.wrp-rad-item-icon ')
            const disabledCl = 'but-icon-disabled'
            if (!enabled) {
                $buts.addClass(disabledCl)
            }
            else {
                $buts.removeClass(disabledCl)
            }
        }
    }

    setSelectedItemsState(enabled) {
        const $items = $('.item-selected')
            .find('.wrp-list-item-text-container')
        if (!enabled) {
            $items.addClass('but-icon-disabled-light')
        }
        else {
            $items.removeClass('but-icon-disabled-light')
        }
    }

    setPathButtonsState(enabled) {
        const $items = $('.fav-path-button[class]')
            .not('[class*="selected"]')
        if (!enabled)
            $items.addClass('but-icon-disabled')
                .addClass('menu-item-disabled')
        else
            $items.removeClass('but-icon-disabled')
                .removeClass('menu-item-disabled')
    }

    setSelectedListItemButtonsState(enabled) {
        const $item = wrpp.findSelectedListItem('opts_wrp_play_list')
        if ($item.length == 0) return
        const $buts = $item.find('.wrp-rad-item-icon ')
        const disabledCl = 'but-icon-disabled'
        if (!enabled) {
            $buts.addClass(disabledCl)
        }
        else {
            $buts.removeClass(disabledCl)
        }
    }

    setRadItemsListState(enabled) {
        const disabledCl = 'but-icon-disabled'
        const $items = $('#wrp_radio_list')
            .find('.wrp-list-item:not([class~="item-selected"])')
        if (!enabled)
            $items.addClass(disabledCl)
        else
            $items.removeClass(disabledCl)
    }

    setItemsListState(paneId, enabled, skipSelectedItem) {
        const disabledCl = 'but-icon-disabled'
        const $items = $('#' + paneId)
            .find('.wrp-list-item' +
                (skipSelectedItem != true ? '' :
                    ':not([class~="item-selected"])')
            )
        if (!enabled)
            $items.addClass(disabledCl)
        else
            $items.removeClass(disabledCl)
    }

    isRadOpenDisabled() {
        return this.favoriteInputState || this.freezedState
    }
}

