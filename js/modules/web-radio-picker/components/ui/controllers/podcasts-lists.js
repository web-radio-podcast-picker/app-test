/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class PodcastsLists {

    paneId = 'opts_wrp_podcast'

    listIdToPaneId = {}

    constructor(podcasts) {
        this.podcasts = podcasts
        this.listIdToPaneId[Pdc_List_Lang] = 'opts_wrp_podcast_lang'
        this.listIdToPaneId[Pdc_List_Tag] = 'opts_wrp_podcast_tag'
        this.listIdToPaneId[Pdc_List_Letter] = 'opts_wrp_podcast_alpha'
        this.listIdToPaneId[Pdc_List_Pdc] = 'opts_wrp_podcast_pdc'
        //this.listIdToPaneId[Pdc_List_Epi] = 'wrp_radio_list'
        this.listIdToPaneId[Pdc_List_Epi] = 'opts_wrp_podcast_epi'
    }

    $getPanel(listId) {
        return $('#' + this.listIdToPaneId[listId])
    }

    updateListView(listId) {
        if (settings.debug.info)
            logger.log('update list view: ' + listId)
        const self = podcasts.podcastsLists
        const sel = self.podcasts.selection

        const paneId = self.listIdToPaneId[listId]
        const $pl = $('#' + paneId)
        // clear pane
        $pl[0].innerHTML = ''

        switch (listId) {
            case Pdc_List_Lang:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.langItems,
                    listId,
                    self.openLang,
                    (name, data) => data.qty
                )
                break
            case Pdc_List_Tag:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.tagItems,
                    listId,
                    self.openTag,
                    (name, data) => data.qty,
                    firstCharToUpper
                )
                break
            case Pdc_List_Letter:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.letterItems,
                    listId,
                    self.openLetter,
                    (name, data) => data.qty
                )
                break
            case Pdc_List_Pdc:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.pdcItems,
                    listId,
                    self.openPdc,
                    (name, data) => data.qty
                )
                break
            case Pdc_List_Epi:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.epiItems,
                    listId,
                    self.openEpi,
                    null
                )
                break
            default:
                break
        }

        if (!self.podcasts.initializedLists[listId])
            self.podcasts.initializedLists[listId] = true

        const $loadingPane = $('#opts_wrp_pane_loading')
        $loadingPane.addClass('hidden')

        podcasts.asyncInitTab(listId)

    }

    openLang(e, $item) {
        podcasts.podcastsLists.openList(
            e,
            $item,
            Pdc_List_Lang,
            name => podcasts.langItems[name],
            (selection, item) => selection.lang = { item: item },
            selection => selection.langSubListId
        )
    }

    openTag(e, $item) {
        podcasts.podcastsLists.openList(
            e,
            $item,
            Pdc_List_Tag,
            name => podcasts.tagItems[name],
            (selection, item) => selection.tag = { item: item },
            selection => selection.tagSubListId
        )
    }

    openLetter(e, $item) {
        podcasts.podcastsLists.openList(
            e,
            $item,
            Pdc_List_Letter,
            name => podcasts.letterItems[name],
            (selection, item) => selection.letter = { item: item },
            selection => selection.letterSubListId
        )
    }

    resetPdcItemsClickState(exceptItem) {
        for (const pdcKey in podcasts.pdcItems) {
            const pdcItem = podcasts.pdcItems[pdcKey]
            if (pdcItem != exceptItem)
                pdcItem.selCnt = 0
        }
    }

    // pdc preview / open list
    openPdc(e, $item) {

        const self = podcasts.podcastsLists
        const name = $item.attr('data-text')
        const item = podcasts.pdcItems[name]

        if (!self.fromSelectItem /*&& !self.isOpenPdcFromTabSelect*/)   // avoid double call
        {
            podcasts.shouldRestoreEpiVisibleState = item == podcasts.selection.pdc?.item
        }
        self.fromSelectItem = false
        self.isOpenPdcFromTabSelect = false

        // reset all other pdc items click state
        self.resetPdcItemsClickState(item)

        self.openList(
            e,
            $item,
            Pdc_List_Pdc,
            name => podcasts.pdcItems[name],
            (selection, item) => selection.pdc = { item: item },
            selection => selection.pdcSubListId,
            true, true
        )

        if (/*true ||*/ item.selCnt == 0) {
            // open preview : at first select
            podcasts.openPdcPreview(item, $item)   // open & show
        }
        else
            item.selCnt++
    }

    openEpi(e) {
        const self = podcasts.podcastsLists
        const item = podcasts.selection.pdc.item

        const $epiItem = $(e.currentTarget).parent()
        const name = $epiItem.attr('data-text')
        const epiItem = podcasts.epiItems[name]

        if (settings.debug.debug) {
            logger.log('open episode: ' + epiItem.name)
            console.log(epiItem)
        }

        const list = uiState.RDList(RadioList_Podcast, Pdc_List_Epi, $epiItem)
        if (uiState.currentRDList?.listId != RadioList_Podcast)
            uiState.updateCurrentRDList(list)

        const $rad = $('#opts_wrp_podcast_epi')
        podcasts.selection.epi = { item: epiItem }
        radListBuilder.onClickItemRad($rad, $epiItem, epiItem)
    }

    // open episods list
    clickOpenEpiList(e) {
        const self = podcasts.podcastsLists
        const item = this.pdcPreviewItem
        const $item = this.$pdcPreviewItem

        if (settings.debug.debug)
            console.log('[##] open epi list: ' + item.name)

        self.openList(
            e,
            $item,
            Pdc_List_Epi,
            name => podcasts.pdcItems[name],
            (selection, item) => {
                /*selection.epi = { item: item } */
            },
            selection => Pdc_List_Epi
            //, true, true
        )

        // media view

        podcasts.buildEpiMediaView(item)

        // epi item

        //const epiItem = self.podcasts.selection.epi?.item
        const epiItem = uiState.currentRDItem

        const paneId = 'opts_wrp_podcast_epi'
        const $pane = $('#' + paneId)
        // restore selection in view
        if (epiItem != null) {
            // try select epi
            const $item = this.findListItemInView(paneId, epiItem)
            if ($item.length > 0) {

                const isCurrent = wrpp.playingState(epiItem).isCurrent

                if (isCurrent) {

                    // late update ----- UPDATE COZ DOM CHANGED
                    radsItems.$loadingRDItem = $item

                    if (!$item.hasClass('wrp-list-item-foldable')) {
                        // re-unfold the items and uptate item view
                        this.selectEpiItem(Pdc_List_Epi, paneId, epiItem, $item, true)
                        this.updateEpiItemView(epiItem, $item)
                    }
                } else
                    $item
                        .removeClass('item-selected')
                        .removeClass('wrp-list-item-foldables')

                $item[0].scrollIntoView(ScrollIntoViewProps)        // TODO: done in podcastsLists:332 (openList) ?
            }
            else {
                // sel not found
                $pane.scrollTop(0)
            }
        } else {
            // no selection
            $pane.scrollTop(0)
        }

        if (podcasts.autoOpenedEpiList) {
            podcasts.autoOpenedEpiList = false

            if (epiItem != null) {
                if (settings.debug.debug)
                    logger.log('[##] auto open epi: ' + epiItem.name)

                // TODO: ------ /!\ here not found if list not visible/constructed --------
                const $epiItem = $(wrpp.getEpiListItem(epiItem)?.item)

                //if (true || !wrpp.isPlaying(epiTem)) {
                // auto play
                const $clkb = $epiItem.find('.wrp-list-item-text-container')
                $clkb.click()

                /*}
                else {
                    // already playing
                    // select without play
                }*/
            }
        }

        item.rss = null
    }

    updateEpiItemView(item, $item) {
        var subText2 = ''
        var $sep = ' / '

        ////console.warn(item.metadata?.duration)
        ////console.warn(item.metadata?.currentTime)

        const dur = item.metadata?.duration
        if (dur != null) {
            DurationHMS.check(dur)
            if (!dur.isInfinite) {
                subText2 = DurationHMS.text(dur)
            } else {
                subText2 = ' '
                $sep = ''
            }
        }

        if (subText2 != '')
            if (item.metadata?.currentTime) subText2 =
                DurationHMS.text(item.metadata.currentTime) + $sep + subText2

        item.subText2 = subText2
        item.metadata.statusText = this.getEpiItemPlayStateText(item)
        radsItems.updateRadItemView(item, $item)
    }

    getEpiItemPlayStateText(item) {
        const playState = wrpp.playingState(item)
        var status = ''
        if (playState.isCurrent) {
            status = 'playing'  // TODO: or 'connecting...' !
            if (playState.isPaused)
                status = 'pause'
        }
        return status
    }

    selectEpiItem(listId, paneId, item, $item, unfoldSelection) {
        wrpp.clearContainerSelection(paneId)
        // #region select item
        wrpp.clearContainerSelection(paneId)
        // fold any unfolded list item
        radsItems.unbuildFoldedItems(paneId)
        // unfold selection
        if (unfoldSelection)
            radsItems.buildFoldableItem(
                item,
                $item,
                RadioList_Podcast,
                Pdc_List_Pdc,       // TODO: ??
                '',
                true,
                true,
                listId
            )
        // TODO: favorite icon lost after that ...
        $item.addClass('item-selected')
        // auto-focus
        $item[0].scrollIntoView(ScrollIntoViewProps)
    }

    openList(
        e,
        $item,
        listId,
        getItemFunc,
        updateSelectionFunc,
        getSubListIdFunc,
        noList,
        unfoldSelection
    ) {
        const name = $item.attr('data-text')
        const item = getItemFunc(name)

        if (settings.debug.debug) {
            console.log('## open list: ' + listId)
            console.log('select \'' + listId + '\' item: ' + name)
        }

        const self = podcasts.podcastsLists
        const { $e, isDisabled, isSelected, isAccepted } = self.getItemProps(e, $item)
        if (isDisabled) return

        // TODO: do not rebuild selected item in case of opening epi list
        // #region select item
        //self.selectItem(listId, self.paneId, item, $item, unfoldSelection)

        wrpp.clearContainerSelection(self.paneId)
        // fold any unfolded list item
        radsItems.unbuildFoldedItems(self.paneId)
        // unfold selection
        if (unfoldSelection)
            radsItems.buildFoldableItem(
                item,
                $item,
                RadioList_Podcast,
                Pdc_List_Pdc,       // TODO: ??
                '',
                true,
                true,
                listId
            )
        // TODO: favorite icon lost after that ...
        $item.addClass('item-selected')
        // #endregion

        // update selection
        const selection = podcasts.selection
        updateSelectionFunc(selection, item)

        if (podcasts.initializingPodcasts < 0) {
            podcasts
                .resetSelectionsById(listId)
                .updateSelectionSubListsIds(selection)
        }

        if (noList !== true) {
            // switch to tab
            const targetTabId = podcasts.listIdToTabId[getSubListIdFunc(selection)]
            if (settings.debug.debug)
                console.log('## open list: switch to tab: ' + targetTabId)
            $('#' + targetTabId).click()
        }
        else {
            const slistId = podcasts.getMoreFocusableListId()
            if (settings.debug.debug)
                console.log('## open list: auto focus: ' + slistId)
            if (slistId != listId)
                // simply focus selection if different list
                $item[0].scrollIntoView(ScrollIntoViewProps)
        }

        settings.dataStore.saveUIState()
    }

    findListItemInView(paneId, item) {
        const $panel = $('#' + paneId)
        const $item = $panel.find('[data-text=' + $.escapeSelector(item.name) + ']')
        return $item
    }

    compareItems($item1, $item2) {
        return $item1.attr('data-text') == $item2.attr('data-text')
    }

    selectFoldableItem(item, $item, listId) {
        radsItems.buildFoldableItem(
            item,
            $item,
            RadioList_Podcast,
            Pdc_List_Pdc,       // TODO: ??
            '',
            true,
            true,
            listId)
        $item.addClass('item-selected')
    }

    restoreSelection(listId, sel, isFoldable) {
        const item = podcasts.getSelectionById(listId, sel)?.item
        const paneId = this.listIdToPaneId[listId]
        //const $pane = $('#' + paneId)
        const $item = this.findListItemInView(paneId, item)
        if ($item != null) {
            const $selItem = wrpp.findSelectedListItem(paneId)
            if (!this.compareItems($item, $selItem)) {
                // unselect+unfold any other
                wrpp.clearContainerSelection(paneId)
                radsItems.unbuildFoldableItem($selItem)
                // select new item
                if (isFoldable)
                    this.selectFoldableItem(
                        item,
                        $item,
                        listId,
                    )
                else
                    $item.addClass('item-selected')
            }
        }
    }

    selectItem(listId, item) {
        const paneId = this.listIdToPaneId[listId]
        wrpp.clearContainerSelection(paneId)
        // fold any unfolded list item
        radsItems.unbuildFoldedItems(paneId)
        if (item == null) return

        // TODO: if emmission item, should be foldable
        // TODO: also if add a text under the name for some particular purpose (eg. description)

        const $item = this.findListItemInView(paneId, item)
        $item.addClass('item-selected')

        const unfold = listId == Pdc_List_Pdc
        if (unfold)
            radsItems.buildFoldableItem(
                item,
                $item,
                RadioList_Podcast,
                Pdc_List_Pdc,
                '',
                true,
                true,
                listId
            )

        if ($item.length > 0)
            $item[0].scrollIntoView(ScrollIntoViewProps)

        // if must show prv
        if (listId == Pdc_List_Pdc) {
            const $b = $item.find('.wrp-list-item-text-container')
            this.fromSelectItem = true
            $b.click()
        }
    }

    getItemProps(e, $item) {
        const $e = $(e.currentTarget)
        const isDisabled = $item.hasClass(Class_Icon_Disabled)
        const isSelected = $item.hasClass(Class_Item_Selected)
        const isAccepted = !isDisabled && !isSelected
        if (isDisabled) return { $e: $e, isDisabled: true, isSelected: isSelected, isAccepted: isAccepted }
        return { $e: $e, isDisabled: isDisabled, isSelected: isSelected, isAccepted: isAccepted }
    }

    getSubListId(selection, listId) {
        var subListId = null
        const index = this.podcasts.index.langs
        const propsPropName = settings.dataProvider.propsPropName

        switch (listId) {
            case Pdc_List_Lang:
                subListId = selection.lang != null ?
                    Pdc_List_Tag : null
                break
            case Pdc_List_Tag:
                if (selection.tag != null) {
                    //if (selection.tag.item)
                    const tagItem = selection.tag.item
                    const ref = index[selection.lang.item.code][tagItem.name]
                    if (ref[propsPropName]) {
                        // no letters
                        subListId = Pdc_List_Pdc
                    } else {
                        // letters
                        subListId = Pdc_List_Letter
                    }
                }
                break
            case Pdc_List_Letter:
                if (selection.letter != null)
                    subListId = Pdc_List_Pdc
                break
            case Pdc_List_Pdc:
                if (selection.pdc != null)
                    subListId = Pdc_List_Epi
                break
            case Pdc_List_Epi:
                //if (selection.epi != null)
                subListId = null
                break
        }
        return subListId
    }

    // podcast item model
    podcastItem(code, name, qty, stores, favorites) {
        const o = {
            code: code,
            name: name,
            qty: qty
        }
        if (favorites) o.favLists = favorites
        if (stores) o.stores = stores
        return o
    }

    // returns true if async
    buildItems(listId) {
        if (settings.debug.debug)
            logger.log('## build items: ' + listId)
        const self = this//podcasts.podcastsLists

        const index = self.podcasts.index
        switch (listId) {
            case Pdc_List_Lang: self.buildLangItems(index)
                break
            case Pdc_List_Tag: self.buildTagsItems(index)
                break
            case Pdc_List_Letter: self.buildLettersItems(index)
                break
            case Pdc_List_Pdc: self.getAndBuildPdcItems(index)
                return true
            case Pdc_List_Epi: self.buildEpiItems(index)
                break
            default:
                break
        }
        return false
    }

    buildLangItems(index) {
        const langItems = {}
        const t = index.props.langs
        for (const langk in t) {
            const lang = t[langk]
            const langItem =
                this.podcastItem(
                    lang.code,
                    lang.name,
                    lang.count
                )
            langItems[lang.name] = langItem
        }
        this.podcasts.langItems = langItems
    }

    buildLettersItems(index) {

        const $pane = $('#' + this.listIdToPaneId[Pdc_List_Letter])
        this.setListPaneLoadingStateEnabled($pane)

        const letterItems = {}
        const countPropName = settings.dataProvider.countPropName
        const storesPropName = settings.dataProvider.storesPropName
        const propsPropName = settings.dataProvider.propsPropName
        const sel = this.podcasts.selection
        const langk = sel.lang.item.name
        const langRef = index.props.langs[langk]
        const langTags = index.langs[langRef.code]
        const langTag = langTags[sel.tag.item.name]

        const lettersk = Object.getOwnPropertyNames(langTag)
            .filter(x => x != countPropName && x != propsPropName)

        lettersk.forEach(letterk => {
            const letter = langTag[letterk]
            var count = 0

            const letterItem =
                this.podcastItem(
                    null,
                    letterk,
                    letter[propsPropName][countPropName],
                    letter[propsPropName][storesPropName]
                )
            letterItems[letterItem.name] = letterItem
        })
        this.podcasts.letterItems = letterItems
    }

    buildTagsItems(index) {

        const $pane = $('#' + this.listIdToPaneId[Pdc_List_Tag])
        this.setListPaneLoadingStateEnabled($pane)

        const tagItems = {}
        const countPropName = settings.dataProvider.countPropName
        const storesPropName = settings.dataProvider.storesPropName
        const propsPropName = settings.dataProvider.propsPropName
        const langk = this.podcasts.selection.lang.item.name
        const langRef = index.props.langs[langk]
        const langTags = index.langs[langRef.code]

        const tagsk = Object.getOwnPropertyNames(langTags)
            .filter(x => x != countPropName && x != propsPropName)

        tagsk.forEach(tagk => {
            const tag = langTags[tagk]
            var count = 0

            var props = Object.getOwnPropertyNames(tag)
            if (props.includes(propsPropName)) {
                // no letters
                count += tag[propsPropName][countPropName]
            }

            props = props
                .filter(x => x != countPropName && x != propsPropName)

            if (props.length > 0) {
                // letters
                props.forEach(prop => {
                    count += tag[prop][propsPropName][countPropName]
                })
            }

            const tagItem =
                this.podcastItem(
                    null,
                    tagk,
                    count,
                    null
                )
            tagItems[tagItem.name] = tagItem
            if (tag[propsPropName])
                tagItem.stores = tag[propsPropName][storesPropName]
        })
        this.podcasts.tagItems = tagItems
    }

    setListPaneLoadingStateEnabled($pane) {
        $pane[0].innerHTML = ''
        const $loadingPane = $('#opts_wrp_pane_loading')
        $loadingPane.removeClass('hidden')
    }

    getAndBuildPdcItems(index) {
        const sel = cloneSelection(podcasts.selection)  // TODO: seems not valid ??? - maybe clone is the sol -
        const langk = sel.lang.item.code
        const tagk = sel.tag.item.name
        const letterk = sel.letter?.item?.name
        //const tagOrLetterk = letterk || tagk
        const item = letterk != null ? sel.letter : sel.tag
        const stores = letterk != null
            ? sel.letter.item.stores
            : sel.tag.item.stores

        const storeIndex = stores[0]

        // erase list before async get
        // TODO: add a wait load/init message ...
        const $pane = $('#' + this.listIdToPaneId[Pdc_List_Pdc])

        //$pane[0].innerHTML = ''
        this.setListPaneLoadingStateEnabled($pane)

        remoteDataStore.getPodcastsList(
            storeIndex,
            langk,
            tagk,
            letterk,
            (data) => {
                podcasts.podcastsLists.buildPdcItems(
                    item, storeIndex, sel.noPage, data, sel)
            }
        )
    }

    buildEpiItems(index) {
        const self = podcasts.podcastsLists

        const item = this.pdcPreviewItem

        var epiItems = {}
        var index = 1
        var prfx = ''

        const sel = cloneCleanupSelection(item.sel) // share accross items

        item.rss.episodes.forEach(rssItem => {

            const epiItem = this.podcastItem(
                null,
                rssItem.title,
                '',
                null,
                null
            )

            if (epiItems[epiItem.name]) {
                // duplicated name
                epiItem.name += ' ' + prfx + index
                index++
                if (index > 9) {
                    prfx += '9.'
                    index = 1
                }
            }

            // item details
            epiItem.subText2 = rssItem.duration
            try {
                const d = new Date(rssItem.pubDate)
                epiItem.subText =
                    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            } catch { }

            // epi items props
            epiItem.url = rssItem.audioUrl
            //epiItem.pItem = item
            epiItem.sel = sel
            //epiItem.rss = rssItem       // TODO: avoid store RSS (too big)

            // state datas
            //epiItem.selCnt = 0

            // make it compatible with favorites management
            epiItem.id = epiItem.name   // here id == title (no id in podcasts)
            epiItem.favLists = []   // TODO: keep favorites in store and réinit here

            // compat with favorites & rdItem management
            //epiItem.logo = item.rss.image || item.rss.itunes.image
            epiItem.logo = rssItem.image ||
                item.rss.image || item.rss.itunes.image
                || item.logo

            epiItem.metadata = {}
            epiItem.pdc = true      // indicates it's a pdc, not a station
            epiItem.epi = true      // indicates it's a pdc episode, not a channel

            epiItem.pubDate = rssItem.pubDate

            epiItems[epiItem.name] = epiItem

        })

        item.rss = null

        self.podcasts.epiItems = {}
        const keys = Object.getOwnPropertyNames(epiItems)
        // alpha sort
        keys.sort((a, b) => {
            var r = a.localeCompare(b)
            const o1 = epiItems[a]
            const o2 = epiItems[b]
            if (o1?.pubDate && o2?.pubDate) {
                try {
                    const d1 = new Date(o1.pubDate)
                    const d2 = new Date(o2.pubDate)
                    r = d1 <= d2
                }
                catch { }
            }
            return r
        })
        keys.forEach(k => {
            self.podcasts.epiItems[k] = epiItems[k]
        })
    }

    buildPdcItems(pItem, store, page, data, sel) {
        const pdcItems = {}
        if (settings.debug.debug)
            window.data = data

        if (settings.debug.debug) {
            console.log(pItem)
            console.log('store = ' + store + ', page = ' + page)
            console.log(sel)
        }
        const t = data.trim()       // coz there is empty lines
            .split('\n')

        t.forEach(row => {
            const c = row.split(settings.dataProvider.columnSeparator)
            const pdcItem =
                this.podcastItem(
                    null,
                    c[0],
                    '',
                    pItem.stores,
                    null
                )

            // pdc item props
            pdcItem.url = c[1].trim()       // coz see \r in results
            pdcItem.store = store
            pdcItem.page = page
            //pdcItem.pItem = pItem
            pdcItem.sel = cloneSelection(sel)
            ////pdcItem.sel.pdc = { item: pdcItem }

            // state datas
            pdcItem.selCnt = 0

            // make it compatible with favorites management
            pdcItem.id = c[0]   // here id == title (no id in podcasts)
            pdcItem.favLists = []   // TODO: keep favorites in store and réinit here

            // compat with favorites & rdItem management
            pdcItem.metadata = {}
            pdcItem.pdc = true      // indicates it's a pdc, not a station

            pdcItems[pdcItem.name] = pdcItem

            this.podcasts.pdcItems = pdcItems
        })

        this.updateListView(Pdc_List_Pdc)   // do here coz async from caller
        this.podcasts.asyncInitTab(Pdc_List_Pdc)
    }
}
