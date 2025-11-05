/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const Pdc_List_Lang = 'lang'
const Pdc_List_Tag = 'tag'
const Pdc_List_Letter = 'letter'
const Pdc_List_Pdc = 'pdc'
const Pdc_List_Epi = 'epi'

class Podcasts {

    /**
     * @type {Podcasts}
     */
    podcastsLists = null

    /**
     * @type {PodcastRSSParser}
     */
    rssParser = null

    indexInitialized = false
    onReadyFuncs = []

    listIdToTabId = {}
    initializedLists = {}
    initializingPodcasts = null

    // selection values
    selection = {
        lang: null,
        langSubListId: null,
        tag: null,
        tagSubListId: null,
        letter: null,
        letterSubListId: null,
        pdc: null,
        pdcSubListId: null,
        epi: null,
        epiSubListId: null,
        // TODO: is the order to open epi enabled. is setted to false after execution
        epiOpen: false,
        // TODO: Not usefull ??
        epiOpening: false,
        noPage: 1,
    }

    previousListId = null

    langItems = []
    tagItems = []
    letterItems = []
    pdcItems = []
    epiItems = []

    constructor() {
        this.listIdToTabId[Pdc_List_Lang] = 'btn_wrp_podcast_lang'
        this.listIdToTabId[Pdc_List_Tag] = 'btn_wrp_podcast_tag'
        this.listIdToTabId[Pdc_List_Letter] = 'btn_wrp_podcast_alpha'
        this.listIdToTabId[Pdc_List_Pdc] = 'btn_wrp_podcast_pdc'
        this.listIdToTabId[Pdc_List_Epi] = 'btn_wrp_podcast_epi'      // npt a tab
        //this.listIdToTabId[Pdc_List_Epi] = 'wrp_radio_list_container'

        this.podcastsLists = new PodcastsLists(this)    // TODO: bad link practice (to be removed - not reproduce)
        this.rssParser = new PodcastRSSParser()

        $('#wrp_pdc_prv_em_button').on('click', (e) => {

            //TODO podcasts.selection.epiOpen = true

            this.podcastsLists.clickOpenEpiList(e)
        })

        const r = remoteDataStore.getPodcastsIndex(
            this.initPodcastIndex)
    }

    getListIdByTabId(tabId) {
        var res = null
        for (const listId in this.listIdToTabId) {
            const ltabId = this.listIdToTabId[listId]
            if (tabId == ltabId)
                res = listId
        }
        return res
    }

    initPodcastIndex(data) {
        const parser = new FlatIndexTextExportParser()
        podcasts.index = parser.parse(data)

        if (settings.debug.info)
            logger.log('podcast index initialized')
        if (settings.debug.debug)
            console.log(podcasts.index)

        //podcasts.langItems = podcasts.podcastsLists.buildLangItems(podcasts.index)
        podcasts.indexInitialized = true

        podcasts.onReadyFuncs.forEach(func => func())
        podcasts.onReadyFuncs = []
    }

    // TODO: case index never initialized: never call (case no network)
    onReady(func) {
        if (this.indexInitialized) func()
        else
            this.onReadyFuncs.push(func)
    }

    getListById(listId) {
        switch (listId) {
            case Pdc_List_Lang: return this.langItems
            case Pdc_List_Tag: return this.tagItems
            case Pdc_List_Letter: return this.letterItems
            case Pdc_List_Pdc: return this.pdcItems
            case Pdc_List_Epi: return this.epiItems
        }
        return null
    }

    getSelectionById(listId, sel) {
        if (sel === undefined) sel = this.selection
        switch (listId) {
            case Pdc_List_Lang: return sel.lang
            case Pdc_List_Tag: return sel.tag
            case Pdc_List_Letter: return sel.letter
            case Pdc_List_Pdc: return sel.pdc
            case Pdc_List_Epi: return sel.epi
        }
        return null
    }

    updateInitializedStatusFromSelection() {
        const s = this.selection
        if (s.tag == null)
            this.initializedLists[Pdc_List_Tag] = null
        if (s.letter == null)
            this.initializedLists[Pdc_List_Letter] = null
        if (s.pdc == null)
            this.initializedLists[Pdc_List_Pdc] = null
        if (s.epi == null)
            this.initializedLists[Pdc_List_Epi] = null
        return this
    }

    resetSelectionsById(listId) {
        const s = this.selection
        switch (listId) {
            case Pdc_List_Lang:
                s.tag = s.letter = s.pdc = null
                break
            case Pdc_List_Tag:
                s.letter = s.pdc = null
                break
            case Pdc_List_Letter:
                s.pdc = null
                break
            case Pdc_List_Pdc:
                // TODO: ok after startup, no good at startup (current lost)
                //s.epi = null
                break
            case Pdc_List_Epi:
                //s.epi = null
                break
        }
        this.updateInitializedStatusFromSelection()
        return this
    }

    getMoreFocusableListId() {
        const selection = this.selection
        const slistId =
            //(selection.epi != null ? Pdc_List_Epi : null) ||

            (selection.pdc != null ? Pdc_List_Pdc : null)
            || (selection.letter != null ? Pdc_List_Letter : null)
            || (selection.tag != null ? Pdc_List_Tag : null)
            || (selection.lang != null ? Pdc_List_Lang : null)
            || Pdc_List_Lang
        return slistId
    }

    updateSelectionSubListsIds(selection) {
        selection.langSubListId = selection.lang == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Lang)
        selection.tagSubListId = selection.tag == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Tag)
        selection.letterSubListId = selection.letter == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Letter)
        selection.pdcSubListId = selection.pdc == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Pdc)
        selection.epiSubListId = selection.epi == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Epi)
        return this
    }

    initTabsCounter = null

    selectTab(selection, targetListId) {

        if (settings.debug.debug)
            console.log('targetListId= ' + targetListId + 'selection= ' + selection)

        this.onReady(() => {
            // find available tabs

            this.initTabsCounter = 0

            if (settings.debug.debug) {
                //console.clear()
                console.log('[##] ---------------SELECT TAB----------- targetListId=' + targetListId)
            }

            this.updateSelectionSubListsIds(selection)

            if (settings.debug.debug)
                console.log(selection)

            // get availables lists
            this.availableLists = []

            this.availableLists.push(Pdc_List_Lang)   // put the default

            if (selection.langSubListId != null)
                this.availableLists.push(selection.langSubListId)

            if (selection.tagSubListId != null)
                this.availableLists.push(selection.tagSubListId)

            if (selection.letterSubListId != null)
                this.availableLists.push(selection.letterSubListId)

            if (selection.pdcSubListId != null)
                this.availableLists.push(selection.pdcSubListId)

            if (selection.epiSubListId != null)
                this.availableLists.push(selection.epiSubListId)

            var slistId = this.getMoreFocusableListId()

            if (targetListId !== undefined && targetListId != null)
                slistId = targetListId

            var initTabDone = false

            this.availableLists.forEach(listId => {

                if (settings.debug.debug)
                    logger.log('add pdc list: ' + listId)

                if (!this.isListInitialized(listId, selection)) {

                    this.onReady(() => {
                        if (slistId == listId) {
                            this.initializedLists[listId] = true
                            // only if visible
                            // build items
                            const isBuildAsync = this.podcastsLists.buildItems(listId)
                            if (!isBuildAsync) {
                                // load and init listId view
                                this.podcastsLists.updateListView(listId)
                            } else
                                // done async by the buildItems method
                                initTabDone = true
                        }
                    })
                }
            })

            if (!initTabDone) {
                this.initTabs(slistId)
            }
        })
    }

    resetInitializedLists() {
        // can preserve Lang
        this.initializedLists[Pdc_List_Tag] = null
        this.initializedLists[Pdc_List_Letter] = null
        this.initializedLists[Pdc_List_Pdc] = null
        this.initializedLists[Pdc_List_Epi] = null
    }

    changePodcasts(selection, openOpts) {
        this.openOpts = openOpts
        this.selection = selection
        this.resetInitializedLists()        // TODO: cache management
        const $pdcBut = $('#btn_wrp_podcast')
        if ($pdcBut.text() == '<<<')        // TODO : improve this way of checking
            $pdcBut.click()
        $pdcBut.click()
    }

    isListInitialized(listId, sel) {

        if (!this.initializedLists[listId]) return false

        /*const isInit = (sel1, sel2) => {
            if (sel1 == null) return false
            if (sel2 == null) return false
            if (sel1.name == sel2.name
                && sel1.
            )
        }

        const o = this.initializedLists[listId]
        if (!o) return false
        if (sel.lang != null && sel.lang != o.lang) {
            return o.lang = o.tag = o.letter = o.pdc = o.epi = null
        }
        if (sel.tag != null && sel.tag != o.tag) {
            return o.tag = o.letter = o.pdc = o.epi = null
        }
        if (sel.letter != null && sel.letter != o.letter) {
            return o.letter = o.pdc = o.epi = null
        }
        if (sel.pdc != null && sel.pdc != o.pdc) {
            return o.pdc = o.epi = null
        }
        if (sel.epi != null && sel.epi != o.epi) {
            return o.epi = null
        }*/
    }

    asyncInitTab(slistId) {

        if (settings.debug.debug)
            console.log('---------------ASYNC INIT TABS-----------')

        //var slistId = this.getMoreFocusableListId()
        this.initTabs(slistId, true)
        const item = this.getSelectionById(slistId)?.item

        if (item != null) {
            const paneId = this.podcastsLists.listIdToPaneId[slistId]
            const $item = this.podcastsLists.findListItemInView(paneId, item)
            if ($item.length > 0 && !$item.hasClass('item-selected'))
                this.podcastsLists.selectItem(slistId, item)
        }
    }

    initTabs(slistId, skipSelectItem) {

        if (settings.debug.debug)
            console.log('## ---------------INIT TABS----------- slistId=' + slistId + ' skipSel=' + skipSelectItem)

        const self = podcasts
        const selection = self.selection

        ui.tabs
            .setTabVisiblity(self.listIdToTabId[Pdc_List_Tag],
                selection.langSubListId != null)
            .setTabVisiblity(self.listIdToTabId[Pdc_List_Letter],
                selection.tagSubListId == Pdc_List_Letter)
            .setTabVisiblity(self.listIdToTabId[Pdc_List_Pdc],
                selection.tagSubListId == Pdc_List_Pdc
                || selection.letterSubListId == Pdc_List_Pdc)
            // no need
            .setTabVisiblity(self.listIdToTabId[Pdc_List_Epi],
                false) //selection.pdcSubListId == Pdc_List_Epi)

        // select current tab & item

        const slist = self.getListById(slistId)
        const sel = self.getSelectionById(slistId)
        const sitem = sel?.item

        logger.log('select podcast tab: ' + slistId)

        if (this.openOpts == null
            || this.openOpts.selectTab == slistId) {
            ui.tabs.selectTab(
                self.listIdToTabId[slistId],
                tabsController.pdcTabs)
            if (settings.debug.debug)
                console.log('selected: ' + slistId)
        }

        if (this.previousListId != slistId)
            if (sitem != null) {
                if (settings.debug.debug)
                    logger.log('select item: ' + sitem?.name)
                self.podcastsLists.selectItem(slistId, sitem)
            } else {
                // default scroll top
                const $pp = this.podcastsLists.$getPanel(slistId).parent()
                $pp[0].scrollTop = 0
            }

        this.previousListId = slistId

        this.setEpiListVisible(slistId == Pdc_List_Epi
            || this.shouldRestoreEpiVisibleState)   // TODO: check this

        if (infosPane.isVisibleInfosPane())
            // hide preview if infos pane is opened
            infosPane.toggleInfos()

        if (skipSelectItem !== true) {            // if must show prv
            if (slistId == Pdc_List_Pdc) {
                this.setPdcPreviewVisible(true)
            }
        }

        // TODO: race condition. can be applied too late (pdc async, epi sync before pdc)
        this.setEpiListMediaVisible(slistId == Pdc_List_Epi)

        if (tabsController.openingVizWithEpiListVisible === true)
            $('#btn_wrp_podcast_pdc')
                .removeClass('selected')

        this.initializingPodcasts--
        if (settings.debug.debug) {
            console.log('initializingPodcasts = ' + this.initializingPodcasts + ' -- ' + this.selection.epiOpen)
            console.log('--------------------------')
        }

        this.initTabsCounter++
        if (this.initTabsCounter == 2) {
            if (settings.debug.debug)
                console.log('## end init tabs')
            if (this.openOpts && this.openOpts.onCompleted) {
                if (settings.debug.debug)
                    console.log('## onCompleted()')
                this.openOpts.onCompleted()
            }
            this.openOpts = null
        }

        settings.dataStore.saveUIState()
    }

    // restore from ui state
    openPodcasts(selection/*, openOpts*/) {

        /*this.openOpts = openOpts*/

        if (settings.debug.debug) {
            //console.clear()
            console.log('[##] open podcasts')
            console.log('[##] ', this.openOpts)
        }

        if (this.initializingPodcasts == null)
            this.initializingPodcasts = 1
        if (selection === undefined || selection == null)
            selection = this.selection

        this.selectTab(selection, null)
    }

    // pdc channel rss & show pdc preview
    openPdcPreview(item, $item) {

        if (settings.debug.debug) {
            logger.log('open pdc preview: ' + item.name + ' | ' + item.url)
            console.log(item)
        }

        ui.hideError()
        item.metadata.statusText = 'opening...'
        radsItems.updateRadItemView(item, $item)

        // fix sel
        const sel = cloneSelection(item.sel)
        sel.pdc = { item: item }

        // any clone here prevent any item update after loading! (buildPdcPreview)
        const cItem = item //cloneItem(item)   // fix sel in item
        //cItem.sel = cloneSelection(cItem.sel)

        // TODO: avoid ops after receipt if other request started after this one
        remoteDataStore.getPodcastChannelRss(
            item.url,
            data => this.buildPdcPreview(cItem, $item, data, sel),
            (mess, response) => this.openPdcPreviewError(item, $item, mess, response)
        )
    }

    openPdcPreviewError(item, $item, mess, response) {
        console.log(response)
        const text = 'channel not found'
        ui.showError(text)
        item.metadata.statusText = text
        radsItems.updateRadItemView(item, $item)
    }

    isPdcPreviewVisible() {
        return !$('#wrp_pdc_btn_bar').hasClass('hidden')
    }

    setPdcPreviewVisible(isVisible, skipTogglePath) {
        if (isVisible && !this.previewInitizalized)
            return
        if (isVisible) {
            if (skipTogglePath !== true) {
                $('#wrp_pdc_btn_bar').removeClass('hidden')
                $('#wrp_radio_list_btn_bar').addClass('hidden')
            }
            $('#wrp_radio_list_container').addClass('hidden')
            $('#wrp_pdc_st_list_container').removeClass('hidden')

            if (!this.shouldRestoreEpiVisibleState)
                this.setEpiListVisible(false)
            else
                this.setEpiListVisible(true)

        } else {

            if (skipTogglePath !== true) {
                $('#wrp_pdc_btn_bar').addClass('hidden')
                $('#wrp_radio_list_btn_bar').removeClass('hidden')
            }
            $('#wrp_radio_list_container').removeClass('hidden')
            $('#wrp_pdc_st_list_container').addClass('hidden')
            // reset click count
            if (this.selection.pdc)
                this.selection.pdc.selCnt = 0
        }
    }

    setEpiListMediaVisible(isVisible) {
        if (isVisible) {
            $('#opts_wrp_podcast_epi_media').removeClass('hidden')
        } else {
            $('#opts_wrp_podcast_epi_media').addClass('hidden')
        }
    }

    shouldRestoreEpiVisibleState = false

    setEpiListVisible(isVisible) {

        //if (!this.podcastsLists.isOpenPdcFromTabSelect)
        this.shouldRestoreEpiVisibleState = isVisible

        if (isVisible) {
            $('#wrp_pdc_epi_list_container').removeClass('hidden')
            this.epiHideStListContainer = true
            $('#wrp_pdc_st_list_container').addClass('hidden')

            $('#opts_wrp_podcast_epi').removeClass('hidden')

        } else {
            $('#wrp_pdc_epi_list_container').addClass('hidden')
            if (this.epiHideStListContainer) {
                //$('#wrp_pdc_st_list_container').removeClass('hidden')
                this.epiHideStListContainer = false
            }

            $('#opts_wrp_podcast_epi').addClass('hidden')
        }
        this.setEpiListMediaVisible(isVisible && !this.forceHideEpiMediaView)

        if (settings.debug.debug)
            console.log('setEpiListVisible= ' + isVisible + ' -- initializingPodcasts= ' + this.initializingPodcasts)

        if (!isVisible && this.initializingPodcasts < -2) {

            // TODO -------------------------------
            // TODO this.selection.epiOpen = false
            // TODO -------------------------------

            settings.dataStore.saveUIState()
        }
    }

    isPdcVisible() {
        return this.isEpiListVisible() ||
            this.isPdcPreviewVisible()
    }

    isEpiListVisible() {
        return !$('#wrp_pdc_epi_list_container').hasClass('hidden')
    }

    buildEpiMediaView(item) {

        // TODO: use a rdMediaImage
        const img = item.logo // item.rss.image || item.rss.itunes.image

        $('#wrp_pdc_epim_img')[0].src = img == null ?
            transparentPixel        // TODO: this have councerns: image resetted, never reinitialized
            : img

        const title = $('#wrp_pdc_prv_name').html()
        $('#wrp_pdc_epim_name').html(title)
        $('#wrp_pdc_epim_desc').addClass('hidden')

        // TODO this.selection.epiOpen = true

        //this.selection.epiOpening = false
        settings.dataStore.saveUIState()
    }

    // build pdc preview
    buildPdcPreview(item, $item, data, sel) {

        if (settings.debug.debug) {
            console.log('[##] build pdc preview: ' + item.name)
            if (settings.debug.obj)
                console.log('[##]', sel)
        }

        ui.hideError()
        item.metadata.statusText = ''
        radsItems.updateRadItemView(item, $item)

        item.selCnt++   // only if preview is ok

        // update the top path bar
        radListBuilder.pathBuilder.buildPdcTopPath(item, $item)

        // get rss datas
        try {
            const o = this.rssParser.parse(data)

            item.rss = o    // Must be deleted when not needed (too big for storage)
            item.logo = item.rss.image || item.rss.itunes.image

            if (settings.debug.debug)
                window.rss = o

            this.populatePdcPreview(item, $item, o, sel)

            // store opened item
            //this.podcastsLists.pdcPreviewItem = item //= cloneItem(item)    // keep sel

            if (settings.debug.obj)
                console.log('[##]', this.podcastsLists.pdcPreviewItem)

            this.podcastsLists.$pdcPreviewItem = $item

            if (infosPane.isVisibleInfosPane())
                // hide preview if infos pane is opened
                infosPane.toggleInfos()

            // ----- AUTO OPEN EPI -----
            if (true/*!this.isEpiListVisible()*/) {

                this.setPdcPreviewVisible(true)

                if (this.selection.epiOpen

                    /*&& this.buildPdcPreviewCount < 1*/) {
                    ////this.selection.epiOpening = true
                    this.selection.epiOpen = false

                    //$('#opts_wrp_podcast_pdc').removeClass('hidden')
                    //$('#opts_wrp_podcast_pdc').removeClass('hidden')
                    ////$('#wrp_pdc_st_list').removeClass('hidden')
                    //$('#wrp_pdc_st_list_container').removeClass('hidden')

                    // case on start TODO: ?? // why not generalize ???

                    if (settings.debug.debug)
                        logger.log('[##] opening epi list')

                    this.autoOpenedEpiList = true
                    // TODO: click fail if epi list was initially visible
                    $('#wrp_pdc_prv_em_button').click()
                }
            }
            else {
                item.rss = null
            }

            this.buildPdcPreviewCount++
        } catch (parseError) {
            const st = 'parse error'
            radsItems.updateLoadingRadItem(st)
        }
    }

    buildPdcPreviewCount = 0

    populatePdcPreview(item, $item, o, sel) {

        $('#wrp_pdc_st_list')[0].scrollTop = 0

        // bg image
        const $bgImg = $('#wrp_pdc_prv_img')

        const img = o.image || o.itunes.image

        if (img) {
            if (settings.debug.debug)
                console.warn('load pdc media image: ' + img)
            // immediately hide image before other loads
            //$bgImg.addClass('ptransparent')
            $bgImg.addClass('hidden')
            $bgImg[0].src = img
        }
        else {
            if (settings.debug.debug)
                console.warn('pdc media no image')
            pdcPrvImage.noImage()
        }

        var author = (o.itunes.author || o.copyright)?.trim()
        var title = o.title
        const finalAuthor = author
        if (author != null && author != '') {
            author = '<div class="wrp_pdc_prv_author_text">' + author + '</div>'
            title += author
        }

        const t = [
            // target id, js path
            ['name', 'title'],
            ['desc', 'o.description'],
            ['author', 'author']
        ]

        t.forEach(d => {
            const targetId = 'wrp_pdc_prv_' + d[0]
            const $e = $('#' + targetId)
            var txt = eval(d[1])
            $e.html(txt)
        })

        $('#wrp_pdc_prv_em_button')
            .text(o.episodes.length + ' episode'
                + (o.episodes.length > 1 ? 's' : '')
            )

        // update item with new datas
        item.qty = o.episodes.length
        if (finalAuthor != null && finalAuthor != '')
            item.subText = finalAuthor
        radsItems.updateRadItemView(item, $item,
            {
                countFunc: item => item.qty
            }
        )

        // update stored clone
        this.podcastsLists.pdcPreviewItem = cloneItem(item)
        this.podcastsLists.pdcPreviewItem.sel = sel

        this.previewInitizalized = true
        this.setPdcPreviewVisible(true)
        //this.setEpiListVisible(false)        
        //// prevent first switch to view visible when not initialized
        ////$('#wrp_pdc_st_list').removeClass('ptransparent')
    }

}
