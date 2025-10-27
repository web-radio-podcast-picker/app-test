/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const Pdc_List_Lang = 'lang'
const Pdc_List_Tag = 'tag'
const Pdc_List_Letter = 'letter'
const Pdc_List_Pdc = 'pdc'

class Podcasts {

    /**
     * @type {Podcasts}
     */
    podcastsLists = null

    indexInitialized = false
    onReadyFuncs = []

    listIdToTabId = {}
    initializedLists = {}

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
        noPage: 1,
    }

    previousListId = null

    langItems = []
    tagItems = []
    letterItems = []
    pdcItems = []

    constructor() {
        this.listIdToTabId[Pdc_List_Lang] = 'btn_wrp_podcast_lang'
        this.listIdToTabId[Pdc_List_Tag] = 'btn_wrp_podcast_tag'
        this.listIdToTabId[Pdc_List_Letter] = 'btn_wrp_podcast_alpha'
        this.listIdToTabId[Pdc_List_Pdc] = 'btn_wrp_podcast_pdc'

        this.podcastsLists = new PodcastsLists(this)

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
        }
        return null
    }

    getSelectionById(listId) {
        switch (listId) {
            case Pdc_List_Lang: return this.selection.lang
            case Pdc_List_Tag: return this.selection.tag
            case Pdc_List_Letter: return this.selection.letter
            case Pdc_List_Pdc: return this.selection.pdc
        }
        return null
    }

    updateInitializedStatusFromSelection() {
        const s = this.selection
        if (s.tag == null)
            this.initializedLists[Pdc_List_Tag] = false
        if (s.letter == null)
            this.initializedLists[Pdc_List_Letter] = false
        if (s.pdc == null)
            this.initializedLists[Pdc_List_Pdc] = false
        // TODO: pdc sublist
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
                // TODO: pdc sublist
                break
        }
        this.updateInitializedStatusFromSelection()
        return this
    }

    getMoreFocusableListId() {
        const selection = this.selection
        const slistId =
            // TODO: add pdc sub list
            (selection.pdc != null ? Pdc_List_Pdc : null)
            || (selection.letter != null ? Pdc_List_Letter : null)
            || (selection.tag != null ? Pdc_List_Tag : null)
            || (selection.lang != null ? Pdc_List_Lang : null)
        return slistId
    }

    updateSelectionSubListsIds(selection) {
        selection.langSubListId = selection.lang == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Lang)
        selection.tagSubListId = selection.tag == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Tag)
        selection.letterSubListId = selection.letter == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Letter)
        // TODO: sub list of pdc
        selection.pdcSubListId = selection.pdc == null ? null
            : this.podcastsLists.getSubListId(selection, Pdc_List_Pdc)
        return this
    }

    selectTab(selection, targetListId) {

        this.onReady(() => {
            // find available tabs

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

            var slistId = this.getMoreFocusableListId()
            if (targetListId !== undefined && targetListId != null)
                slistId = targetListId

            this.availableLists.forEach(listId => {

                if (settings.debug.debug)
                    logger.log('add pdc list: ' + listId)

                if (!this.initializedLists[listId]) {

                    this.onReady(() => {
                        if (slistId == listId) {
                            // only if visible
                            // build items
                            const isBuildAsync = this.podcastsLists.buildItems(listId)
                            if (!isBuildAsync) {
                                // load and init listId view
                                this.podcastsLists.updateListView(listId)
                            }
                        }
                    })
                }
            })

            this.initTabs(slistId)

            settings.dataStore.saveUIState()
        })
    }

    asyncInitTab(slistId) {
        //var slistId = this.getMoreFocusableListId()
        this.initTabs(slistId)
        const item = this.getSelectionById(slistId)?.item
        this.podcastsLists.selectItem(slistId, item)
    }

    initTabs(slistId) {
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

        // select current tab & item

        const slist = self.getListById(slistId)
        const sel = self.getSelectionById(slistId)
        const sitem = sel?.item

        logger.log('select podcast tab: ' + slistId)

        ui.tabs.selectTab(
            self.listIdToTabId[slistId],
            tabsController.pdcTabs)

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
    }

    openPodcasts(selection) {
        if (selection === undefined || selection == null)
            selection = this.selection
        this.selectTab(selection)
    }
}
