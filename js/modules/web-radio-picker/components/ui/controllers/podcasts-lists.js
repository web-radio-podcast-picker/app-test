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
        $pl[0].innerHTML = ''

        switch (listId) {
            case Pdc_List_Lang:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.langItems,
                    RadioList_Podcast,
                    self.openLang,
                    (name, data) => data.qty
                )
                break
            case Pdc_List_Tag:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.tagItems,
                    RadioList_Podcast,
                    self.openTag,
                    (name, data) => data.qty,
                    firstCharToUpper
                )
                break
            case Pdc_List_Letter:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.letterItems,
                    RadioList_Podcast,
                    self.openLetter,
                    (name, data) => data.qty
                )
                break
            case Pdc_List_Pdc:
                listsBuilder.buildNamesItems(
                    paneId,
                    self.podcasts.pdcItems,
                    RadioList_Podcast,
                    self.openPdc,
                    (name, data) => ''
                )
                break
            default:
                break
        }

        if (!self.podcasts.initializedLists[listId])
            self.podcasts.initializedLists[listId] = true
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

    openPdc(e, $item) {
        podcasts.podcastsLists.openList(
            e,
            $item,
            Pdc_List_Pdc,
            name => podcasts.pdcItems[name],
            (selection, item) => selection.pdc = { item: item },
            selection => selection.pdcSubListId,
            true, true
        )
    }

    openList(e, $item, listId, getItemFunc, updateSelectionFunc, getSubListIdFunc,
        noList, unfoldSelection
    ) {
        const name = $item.attr('data-text')
        const item = getItemFunc(name)

        if (settings.debug.debug)
            console.log('select \'' + listId + '\' item: ' + name)

        const self = podcasts.podcastsLists
        const { $e, isDisabled, isSelected, isAccepted } = self.getItemProps(e, $item)
        if (isDisabled) return

        // #region select item
        wrpp.clearContainerSelection(self.paneId)
        // fold any unfolded list item
        radsItems.unbuildFoldedItems(self.paneId)
        // unfold selection
        if (unfoldSelection)
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
        $item.addClass('item-selected')
        // #endregion

        // update selection
        const selection = podcasts.selection
        updateSelectionFunc(selection, item)

        podcasts
            .resetSelectionsById(listId)
            .updateSelectionSubListsIds(selection)

        if (noList !== true) {
            // switch to tab
            const targetTabId = podcasts.listIdToTabId[getSubListIdFunc(selection)]
            $('#' + targetTabId).click()
        }
        else {
            const slistId = podcasts.getMoreFocusableListId()
            if (slistId != listId)
                // simply focus selection if different list
                $item[0].scrollIntoView(ScrollIntoViewProps)
        }

        settings.dataStore.saveUIState()
    }


    findListItemInView(paneId, item) {
        const $panel = $('#' + paneId)
        const $item = $panel.find('[data-text="' + item.name + '"]')
        return $item
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
            // TODO: no subs for pdc at the moment. later must add the parsed emission list by podcast
            case Pdc_List_Pdc:
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
            logger.log('build items: ' + listId)
        const self = this//podcasts.podcastsLists

        const index = self.podcasts.index
        switch (listId) {
            case Pdc_List_Lang: self.buildLangItems(index)
                return
            case Pdc_List_Tag: self.buildTagsItems(index)
                return
            case Pdc_List_Letter: self.buildLettersItems(index)
                break
            case Pdc_List_Pdc: self.getAndBuildPdcItems(index)
                return true
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

    getAndBuildPdcItems(index) {
        const sel = podcasts.selection
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
        $pane[0].innerHTML = ''

        remoteDataStore.getPodcastsList(
            storeIndex,
            langk,
            tagk,
            letterk,
            (data) => {
                podcasts.podcastsLists.buildPdcItems(
                    item, storeIndex, sel.noPage, data)
            }
        )
    }

    buildPdcItems(pItem, store, page, data) {
        const pdcItems = {}
        if (settings.debug.debug)
            window.data = data

        if (settings.debug.debug) {
            console.log(pItem)
            console.log('store = ' + store + ', page = ' + page)
            //console.log(data)
        }
        const t = data.trim()       // coz there is empty lines
            .split('\n')

        t.forEach(row => {
            const c = row.split(settings.dataProvider.columnSeparator)
            const tagItem =
                this.podcastItem(
                    null,
                    c[0],
                    '',
                    pItem.stores,
                    null
                )
            tagItem.id = c[0]   // here id == title (no id in podcasts)
            tagItem.url = c[1].trim()       // coz see \r in results
            tagItem.store = store
            tagItem.page = page
            tagItem.pItem = pItem
            // make it compatible with favorites management
            tagItem.favLists = []   // TODO: keep favorites in store and réinit here
            tagItem.pdc = true      // indicates it's a pdc, not a station

            pdcItems[tagItem.name] = tagItem

            this.podcasts.pdcItems = pdcItems
        })

        this.updateListView(Pdc_List_Pdc)   // do here coz async from caller
        this.podcasts.asyncInitTab(Pdc_List_Pdc)
    }
}
