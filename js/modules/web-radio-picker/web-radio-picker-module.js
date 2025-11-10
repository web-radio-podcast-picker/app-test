/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// #region globals consts

const WRP_Radio_List = 'all_stations.m3u'
const WRP_Json_Radio_List = 'radios.txt'
const WRP_Unknown_Group_Label = 'unclassified'
const WRP_Artists_Group_Label = 'artists'
const Group_Name_Artists = 'Artists'

const Sep = '|'
const List_Sep = ','
const Line_Sep = '\n'
const Bloc_Sep = '---------- ----------'

const Build_Json_Radio_List = false

//#endregion

// #region global attributes

/**
 * @type {Dialogs}
 */
var dialogs = null

/**
 * @type {WebRadioPickerModule}
 */
var wrpp = null

/**
 * @type {RadsItems}
 */
var radsItems = null

/**
 * @type {RdMediaImage}
 */
var rdMediaImage = null

/**
 * @type {RdMediaImage}
 */
var pdcPrvImage = null

/**
 * @type {ListsBuilder}
 */
var listsBuilder = null

/**
 * @type {RadListBuilder}
 */
var radListBuilder = null

/**
 * @type {PlayHistory}
 */
var playHistory = null

/**
 * @type {Favorites}
 */
var favorites = null

/**
 * @type {PlayEventsHandlers}
 */
var playEventsHandlers = null

/**
 * @type {InfosPane}
 */
var infosPane = null

/**
 * @type {TabsController}
 */
var tabsController = null

/**
 * @type {RadiosLists}
 */
var radiosLists = null

/**
 * @type {UIState}
 */
var uiState = null

/**
 * @type {Podcasts}
 */
var podcasts = null

/**
 * @type {RemoteDataStore}
 */
var remoteDataStore = null

/**
 * @type {PropertiesStore}
 */
var propertiesStore = null

/**
 * @type {MemoryItemsStore}
 */
var memoryItemsStore = null

/**
 * @type {RssCache}
 */
var rssCache = null

/**
 * @type {PdcListCache}
 */
var pdcListCache = null

//#endregion

// module: web radio picker

class WebRadioPickerModule extends ModuleBase {

    // #region ----- module spec -----

    id = 'web_radio_picker'         // unique id
    author = 'franck gaspoz'        // author
    cert = null                     // certification if any

    views = [                       // module views & styles
        [
            'view.html',            // empty view (real is preloaded in index.html)
            // (any view is necessary to comply to the module loader)
            null                    // idem for the style
        ]
    ]
    settings = [
        'settings.json'             // module settings
    ]
    datas = null                    // module data files

    title = 'Web Radio Picker'
    icon = '☄'

    //#endregion

    // #region attributes

    items = []              // all items by group name
    itemsByArtists = []     // item with artist by artist name
    itemsByName = []        // all items by name
    itemsByLang = []        // items by lang (those having one)
    itemsAll = []           // all items
    listCount = 0
    // items count in rad list
    filteredListCount = 0
    // pre-processed data
    groupsById = {}
    itemsById = {}

    resizeEventInitialized = false

    // components

    m3uDataBuilder = null
    radioDataParser = null

    //#endregion

    // #region init

    constructor() {
        super()
        this.version = settings.app.wrp.version
        this.versionDate = settings.app.wrp.verDate
        this.datas = [
            // radios
            'data/' + (Build_Json_Radio_List ?
                WRP_Radio_List
                : WRP_Json_Radio_List
            )]
        if (Build_Json_Radio_List)
            this.m3uDataBuilder = new M3UDataBuilder().init(this)
        else
            this.radioDataParser = new RadioDataParser().init(this)

        wrpp = this
        remoteDataStore = new RemoteDataStore()
        dialogs = new Dialogs()
        radsItems = new RadsItems()

        rdMediaImage = new RdMediaImage(
            {
                imgId: 'wrp_img',
                paneId: 'left-pane',
                noImgSrc: './img/icon.ico',
                tabId: 'btn_wrp_logo',
                noImageSelfClass: 'wrp-img-half'
            }
        )
        pdcPrvImage = new RdMediaImage(
            {
                imgId: 'wrp_pdc_prv_img',
                paneId: 'wrp_pdc_st_list_container',
                noImgSrc: transparentPixel
            }
        )

        rssCache = new RssCache()
        pdcListCache = new PdcListCache()
        memoryItemsStore = new MemoryItemsStore()
        propertiesStore = new PropertiesStore()
        listsBuilder = new ListsBuilder()
        radListBuilder = new RadListBuilder()
        playHistory = new PlayHistory()
        favorites = new Favorites()
        playEventsHandlers = new PlayEventsHandlers()
        infosPane = new InfosPane()
        tabsController = new TabsController()
        radiosLists = new RadiosLists()
        podcasts = new Podcasts()
        uiState = new UIState()

        radiosLists.addList(RadioList_List, RadioList_History, true)
    }

    initView(viewId) {

        tabsController.initTabs()

        const readOnly = { readOnly: true, attr: 'text' };

        const $img = $('#wrp_img')
        $img
            .on('error', () => {
                rdMediaImage.noImage()
            })
            .on('load', () => {
                const img = $('#wrp_img')[0]
                if (img.width <= 1 || img.height <= 1)
                    rdMediaImage.noImage()
                else
                    rdMediaImage.showImage()
            })

        $('#wrp_pdc_prv_img')
            .on('error', () => {
                pdcPrvImage.noImage()
            })
            .on('load', () => {
                const img = $('#wrp_pdc_prv_img')[0]
                /*if (img.width < 1 || img.height < 1)
                    pdcPrvImage.noImage()
                else*/ {
                    pdcPrvImage.resetImage()
                    pdcPrvImage.showImage()
                }
            })

        const thisPath = 'app.moduleLoader.getModuleById("' + this.id + '").'
        const listCountPath = thisPath + 'listCount'
        const filteredListCountPath = thisPath + 'filteredListCount'

        ui
            .bindings.bind(ui.bindings.binding(
                'wrp_list_count',
                listCountPath + '==' + filteredListCountPath + '?' + listCountPath + ' :  (' + filteredListCountPath + '+" / "+' + listCountPath + ')',
                readOnly))

        if (false)  // not available/deprecated from 1.3.16.4
            $('#btn_wrp_all_radios').on('click', () => {
                this.allRadios()
            })

        if (!settings.features.constraints.noFullscreenToggling) {
            $('#wrp_fullscreen_on').on('click', () => {
                cui.setFullscreen(true)
                if (this.resizeEventInitialized)
                    rdMediaImage.showImage()
            })

            $('#wrp_fullscreen_off').on('click', () => {
                cui.setFullscreen(false)
                if (this.resizeEventInitialized)
                    rdMediaImage.showImage()
            })
        }

        $('#wrp_btn_pause_onoff').on('click', () => {
            if ($('#wrp_btn_pause_on').hasClass('but-icon-disabled'))
                return
            app.toggleOPause(() => playEventsHandlers
                .onPauseStateChanged(
                    true,
                    uiState.currentRDItem,
                    null
                ))
        })

        $('#wrp_but_add_fav').on('click', (e) => {
            const $e = $(e.currentTarget)
            if ($e.hasClass('menu-item-disabled')) return
            if (!uiState.favoriteInputState) return
            favorites.addNewFavoriteList()
        })

        $('#btn_wrp_infos').on('click', e => {
            this.removeHighlight(e.currentTarget)
            if (uiState.favoriteInputState) return
            infosPane.toggleInfos()
        })

        $('#btn_wrp_exp_fav').on('click', () => {
            this.exportRadiosListsToClipboard()
        })

        $('#btn_wrp_imp_fav').on('click', async () => {
            await this.importRadiosListsFromClipboard()
        })

        $('#btn_wrp_del_allfav').on('click', () => {
            favorites.deleteAllFavoritesLists()
        })

        infosPane.initEventsHandlers()

        if (settings.features.swype.enableArrowsButtonsOverScrollPanes) {
            $("#rdl_top").removeClass('hidden')
            $("#rdl_btm").removeClass('hidden')

            ui.scrollers
                .new(ui.scrollers.scroller(
                    ['wrp_radio_list', 'opts_wrp_inf', 'opts_wrp_set', 'opts_log_pane'],
                    'rdl_top',
                    'rdl_btm'
                ))
        }

        // modules are late binded. have the responsability to init bindings
        this.updateBindings()

        // initial datas & ui state

        // TODO: remove local storage init
        const firstInit = settings.dataStore.initUIStateStorage(
            () => {
                // first launch init
                if (settings.debug.info)
                    logger.log('initializing first launch')
                uiState.updateCurrentTab('btn_wrp_tag_list')
                radListBuilder.updateCurrentRDList(
                    uiState.RDList(
                        RadioList_Tag,
                        null,
                        $('#btn_wrp_tag_list')
                    ))
            }
        )

        settings.dataStore.init(() => {

            settings.dataStore.loadProperties(() => {

                settings.dataStore.loadPdcLists(() => {

                    settings.dataStore.loadRss(() => {

                        settings.dataStore.loadRadiosLists(
                            () => {

                                const uiInitFunc = () => {
                                    listsBuilder
                                        .buildTagItems()
                                        .buildArtItems()
                                        .buildLangItems()
                                        .buildListsItems()

                                    if (!firstInit)
                                        settings.dataStore.loadUIState()    // will launch // tasks
                                }

                                if (settings.migration.fixFavoritesItemsFavLists) {
                                    if (settings.debug.debug)
                                        console.warn(DataStoreLogPfx + 'reload properties (migration: fixFavoritesItemsFavLists)')
                                    // async save
                                    settings.dataStore.db.saveProperties(propertiesStore.toObject())
                                    setTimeout(() => {
                                        // delay start
                                        settings.dataStore.loadProperties(() => uiInitFunc())
                                    }, 5000)
                                }
                                else
                                    uiInitFunc()
                            })
                    })
                })
            })
        })
    }

    updateBindings() {
        ui.bindings.updateBindingTarget('wrp_list_count')
    }

    // #endregion

    // #region import/export

    async importRadiosListsFromClipboard() {
        try {
            const res = await radiosLists.importFromClipboard()
            this.#updateFavsAfterImport(res)
        } catch (err) {
            dialogs.showInfoPopup(
                dialogs.infoPopupError('Import failed', err)
            )
        }
    }

    importRadiosListsFromText(text) {
        try {
            const res = radiosLists.importFromText(text)
            this.#updateFavsAfterImport(res)
        } catch (err) {
            dialogs.showInfoPopup(
                dialogs.infoPopupError('Import failed', err)
            )
        }
    }

    #updateFavsAfterImport(res) {
        listsBuilder.updateListsItems()
        settings.dataStore.saveRadiosLists()
        const text = `&bull; imported lists: ${res.importedLists}<br>&bull; imported items: ${res.importedItems}`
        dialogs.showInfoPopup(
            dialogs.infoPopup('Favorites imported', text, null, null, true)
        )
    }

    /**
     * import favs from a json file
     * @param {Object} file fileInput.files[0]
     */
    importRadiosListsFromFile(file) {
        try {
            const reader = new FileReader()
            reader.onload = e => {
                const text = e.target.result
                this.importRadiosListsFromText(text)
            }
            reader.readAsText(file)
        } catch (err) {
            dialogs.showInfoPopup(
                dialogs.infoPopupError('Import failed', err)
            )
        }
    }

    exportRadiosListsToClipboard() {
        try {
            radiosLists.exportToClipboard()
            dialogs.showInfoPopup(
                dialogs.infoPopup('Favorites exported')
            )
        } catch (err) {
            dialogs.showInfoPopup(
                dialogs.infoPopupError('Export failed', err)
            )
        }
    }

    // #endregion

    // #region lists/items accessors

    getPaneScrollBackup($pane) {
        return {
            $pane: $pane,
            y: $pane.scrollTop(),
            selectedItemId: $pane.find('.item-selected').attr('data-id')
        }
    }

    /**
     * @deprecated will be removed with dynamic station list loading
     * search item in full stations list
     * @param {Object} item searched item
     * @returns 
     */
    findRadItem(item) {
        return this.findRadItemInList(item, this.itemsAll)
    }

    findRadItemInList(item, lst) {
        var res = null
        lst.some(o => {
            if (item.name == o.name
                && item.url == o.url) {
                res = o
                return true
            }
            return false
        })
        return res
    }

    findSelectedListItem(containerId) {
        return $('#' + containerId).find('.item-selected')
    }

    isGroupALang(grp) {
        const langs = Object.keys(this.itemsByLang)
        return langs.includes(grp)
    }

    // return the clickable item (a button or a tab or a list item)
    // returns null || { item, name, listId }
    getListItem(rdList) {
        if (rdList == null || rdList.listId == null)
            return null
        var res = null
        switch (rdList.listId) {
            case RadioList_Info:
                // must be ignored to preserve list init
                break
            case RadioList_All:
                res = { item: $('#btn_wrp_all_radios')[0], name: null, listId: RadioList_All }
                break
            case RadioList_Viz: // no list. will switch to tab
                break
            default:
                const butId = uiState.listIdToTabId[rdList.listId]
                if (butId !== undefined) {
                    const paneId = butId.replace('btn_', 'opts_')
                    res = radiosLists.findListItemByName(rdList.name, paneId)
                    if (res != null)
                        res.listId = rdList.listId
                }
                break
        }
        return res
    }

    // { domElement, id }
    getPdcListItem(item) {
        return radiosLists.findListItemByName(item.name, 'opts_wrp_podcast_pdc')
    }

    // { domElement, id }
    getEpiListItem(item) {
        return radiosLists.findListItemByName(item.name, 'opts_wrp_podcast_epi')
    }

    // { domElement, id }
    getRadListItem(item) {
        return radiosLists.findListItemById(item.id, 'wrp_radio_list')
    }

    // { domElement, id }
    getRadListItemById(id) {
        return radiosLists.findListItemById(id, 'wrp_radio_list')
    }

    // { domElement, id }
    getPlaysListsItemById(id) {
        return radiosLists.findListItemById(id, 'opts_wrp_play_list')
    }

    // { domElement, id }
    getPlaysListsItemByName(name) {
        return radiosLists.findListItemByName(name, 'opts_wrp_play_list')
    }

    // { domElement, id }
    getTagsListsItemByName(name) {
        return radiosLists.findListItemByName(name, 'opts_wrp_tag_list')
    }

    // { domElement, id }
    getLangsListsItemByName(name) {
        return radiosLists.findListItemByName(name, 'opts_wrp_lang_list')
    }

    // { domElement, id }
    getArtistsListsItemByName(name) {
        return radiosLists.findListItemByName(name, 'opts_wrp_art_list')
    }

    // #endregion

    // #region lists/items setters

    removeHighlight(e) {
        // no impl found
    }

    focusListItem(element, selectIt) {
        const $e = $(element)
        if (selectIt)
            $e.addClass('item-selected')
        radsItems.setTitleIconsVisibility($e, false)
        element.scrollIntoView(ScrollIntoViewProps)
    }

    setCurrentRDList(currentRDList) {
        uiState.updateCurrentRDList(currentRDList)
    }

    clearRadioView() {
        this.clearAppStatus()
        this.setupRadioView(null)
    }

    setupRadioView(rdItem) {
        const url = rdItem?.url || ''
        const name = rdItem?.name || ''
        $('#wrp_radio_url').text(url)
        $('#wrp_radio_name').text(name)
        radListBuilder.pathBuilder.buildRadioViewTagPath(rdItem)
    }

    clearAppStatus() {
        $('#err_txt').text('')
        $('#err_holder').addClass('hidden')
    }

    clearListsSelection() {
        this
            .clearContainerSelection('opts_wrp_art_list')
            .clearContainerSelection('opts_wrp_play_list')
            .clearContainerSelection('opts_wrp_tag_list')
            .clearContainerSelection('opts_wrp_lang_list')
        // fold any unfolded list item
        radsItems
            .unbuildFoldedItems('opts_wrp_play_list')
    }

    clearContainerSelection(containerId) {
        const $container = $('#' + containerId)
        $container.find('.item-selected')
            .removeClass('item-selected')
        return this
    }

    /**
     * @deprecated // TODO: listing all radios is going to be removed
     */
    allRadios() {
        this.clearListsSelection()
        radListBuilder
            .updateRadList(this.itemsAll, RadioList_All)
        this.setCurrentRDList(uiState.RDList(RadioList_All, null, null))
    }

    setPaneScroll(scrollBackup) {
        const s = scrollBackup
        if (s.selectedItemId != null && s.selectedItemId != '') {
            const $item = s.$pane.find('[data-id="' + s.selectedItemId + '"]')
            if ($item.length > 0) {
                const domItem = $item[0]
                domItem.scrollIntoView(ScrollIntoViewProps)
            }
        }
    }

    // #endregion

    // #region data

    compareItems(item1, item2) {
        return item1?.code == item2?.code
            && item1?.name == item2?.name
            && item1?.url == item2?.url
            ;
    }

    playingState(item) {
        const isCurrent = this.compareItems(
            uiState.currentRDItem,
            item)
        const isPaused = oscilloscope.pause
        return {
            isPaused: isPaused,
            isCurrent: isCurrent,
            isPlaying: isCurrent && !isPaused
        };
    }

    /**
     * check if a playable item key is correclty initialized. fix it if possible
     * @param {Object} item 
     */
    checkItemKey(item) {
        if (item.key) return
        item.key = item.name + item.url
    }

    toArtistFromtreamingExclusive(r) {
        if (r === undefined || r == null) return null
        return r.name?.replace('- Hits', '')?.trim()
    }

    isRDListVisible(listId, listName) {
        const crdl = uiState.currentRDList
        if (crdl == null) return null
        return crdl.listId == listId && crdl.name == listName
    }

    // radio item model
    radioItem(id, name, groupName, url, logo) {
        const rdItem = {
            // const properties
            id: id,
            name: name,
            description: null,
            groupTitle: groupName,
            groups: [],
            url: url,
            logo: logo,
            artist: null,
            lang: null,
            channels: null,
            // static & dynamic properties
            country: null,
            favLists: [],
        }
        // dynamic properties
        this.checkMetaData(rdItem)
        return rdItem
    }

    checkMetaData(rdItem) {
        if (rdItem.metadata === undefined)
            rdItem.metadata = {
                duration: null,
                stereo: null,
                encoding: null,
                sampleFrq: null,
                sampleRes: null,
                country: null,
                statusText: null,
                startTime: null,
                stopTime: null,
                position: null
            }
    }

    // set data from .m3u or .txt
    setData(dataId, text) {
        if (dataId.includes(WRP_Radio_List))
            this.m3uDataBuilder.setDataRadioListM3U(text)
        if (dataId.includes(WRP_Json_Radio_List))
            this.radioDataParser.setDataRadioList(text)
    }

    //#endregion
}