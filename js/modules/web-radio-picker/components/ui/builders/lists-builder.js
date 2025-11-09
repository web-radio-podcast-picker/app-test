/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class ListsBuilder {

    buildTagItems() {
        const $tag = $('#opts_wrp_tag_list')
        const keys = Object.keys(wrpp.items)
        var i = 0
        keys.forEach(k => {
            const { item, $item } = radListBuilder.buildListItem(
                ifQuoteUnQuote(k),
                i,
                i,
                { count: wrpp.items[k].length },
                null,
                null,
                null
            )
            i++
            this.initListItem($tag, item, $item, wrpp.items[k],
                uiState.RDList(RadioList_Tag, k, $item))
            $tag.append($item)
        })
        return this
    }

    buildArtItems() {
        this.buildNamesItems('opts_wrp_art_list', wrpp.itemsByArtists, RadioList_Art)
        return this
    }

    buildLangItems() {
        this.buildNamesItems('opts_wrp_lang_list', wrpp.itemsByLang, RadioList_Lang)
        return this
    }

    favoriteListItemOpts(lst) {
        return { count: lst.length }
    }

    clearFavoritesView() {
        const $pl = $('#opts_wrp_play_list')
        $pl[0].innerHTML = ''
        return this
    }

    buildListsItems() {
        const $pl = $('#opts_wrp_play_list')
        const t = radiosLists.lists
        const names = getSortedNames(t)

        // put History first
        remove(names, RadioList_History)
        names.unshift(RadioList_History)

        var i = 0
        names.forEach(name => {
            if (name != StoreKeyName) {

                // ----- construct data ----

                const list = t[name]
                const lst = list.items
                const { item, $item } = radListBuilder.buildListItem(
                    name,
                    i,
                    i,
                    this.favoriteListItemOpts(lst),
                    null,
                    null,
                    null
                )

                // ----- ui init -----

                i++
                this.initListItem($pl, item, $item, lst,
                    uiState.RDList(RadioList_List, name, $item)
                )
                if (list.name == RadioList_History) {
                    $item.addClass('wrp-list-item-history-favs')
                    radListBuilder.updateListItemText($item, RadioList_List_VisibleName)
                }
                $pl.append($item)
            }
        })
        return this
    }

    updateListsItems() {
        const $pl = $('#opts_wrp_play_list')
        const $selected = $pl.find('.item-selected')
        const id = $selected.attr('data-id')
        const y = $pl.scrollTop()

        if ($pl.length > 0)
            $pl[0].innerHTML = ''
        this.buildListsItems()

        $pl.scrollTop(y)
        if (id !== undefined) {
            // restore selection
            const it = wrpp.getPlaysListsItemById(id)
            if (it != null) {
                it.item.scrollIntoView(ScrollIntoViewProps)
                const $item = $(it.item)
                const name = $item.attr('data-text')
                $item.addClass('item-selected')
                // unfold
                radsItems.buildFoldableItem(
                    null,
                    $item,
                    RadioList_List,
                    name,
                    this.favoriteListItemOpts(
                        radiosLists.getList(name)
                    ),
                    true
                )
            }
            return { $panel: $pl, $selected: $selected, id: id, it: it }
        }
        return { $panel: $pl, $selected: $selected, id: id, it: null }
    }

    /**
     * init ui of a rad list item for (pdc/epi) : tag,letter,lang,pdc,epi
     * @param {String} containerId 
     * @param {Object} itemsByName items by names
     * @param {String} listId 
     * @param {Function} onClick 
     * @param {Function} countFunc 
     * @param {Function} textViewFunc 
     * @returns 
     */
    buildNamesItems(containerId, itemsByName, listId, onClick, countFunc, textViewFunc) {

        const $container = $('#' + containerId)
        var i = 0
        const btns = []
        const keys = Object.keys(itemsByName)
        var j = 0
        keys.forEach(name => {

            // ----- construct data -----

            const dataItem = itemsByName[name]
            const { item, $item } = radListBuilder.buildListItem(
                name,
                j,
                j,
                {
                    count: ''
                },
                dataItem,
                RadioList_Podcast,
                listId,
                textViewFunc
            )

            // ----- init ui -----

            j++
            btns[name] = $item
            this.initListItem($container, item, $item, itemsByName[name],
                uiState.RDList(listId, name, $item), onClick)
            try {
                $container.append($item)
            } catch (err) {
                // TODO: check this case (seems not catchable)
                console.warn(err)
            }
        })

        keys.forEach(name => {
            const cnt =
                (countFunc === undefined || countFunc == null) ?
                    itemsByName[name].length
                    : countFunc(name, itemsByName[name])
            this.setupItemOptions(
                btns[name],
                {
                    count: cnt
                }
            )
        })

        return this
    }

    setupItemOptions($artBut, opts) {
        const $n = $artBut.find('.wrp-list-item-box')
        $n.text(opts.count)
    }

    /**
     * init ui of a rad list item for (pdc/epi) : tag,letter,lang,pdc,epi
     * @param {JQuery} $container 
     * @param {Object} item 
     * @param {JQuery} $item 
     * @param {Array} t pdc items arrays
     * @param {RDList} currentRDList 
     * @param {Function} onClick 
     */
    initListItem($container, item, $item, t, currentRDList, onClick) {
        const $textContainer = $item.find('.wrp-list-item-text-container')

        if (onClick !== undefined)
            $textContainer.on('click', e => onClick(e, $item))
        else
            $textContainer.on('click', e => {
                const $e = $(e.currentTarget)
                if ($e.hasClass(Class_Icon_Disabled)) return
                const isDisabled = $item.hasClass(Class_Icon_Disabled)
                const isSelected = $item.hasClass(Class_Item_Selected)
                const isAccepted = !isDisabled && !isSelected

                if (currentRDList.listId == RadioList_List
                    && uiState.favoriteInputState
                    && isAccepted
                )
                    // favorite select
                    favorites.endAddFavorite($item, currentRDList, false)

                else {

                    if (!isAccepted) return

                    var listName = currentRDList.name

                    // clear selections & unbuild folded items
                    wrpp.clearListsSelection()

                    if (currentRDList.listId == RadioList_List) {

                        // upd list name
                        listName = $item.attr('data-text')

                        radsItems

                            // unfold
                            .buildFoldableItem(
                                null,
                                $item,
                                currentRDList.listId,
                                currentRDList.name,
                                this.favoriteListItemOpts(
                                    radiosLists.getList(currentRDList.name)
                                ),
                                true
                            )
                    }

                    // select
                    infosPane.hideInfoPane()
                    $item.addClass('item-selected')
                    radListBuilder
                        .updateRadList(
                            t,
                            currentRDList.listId,
                            listName)
                    wrpp.setCurrentRDList(currentRDList)

                }
            })
    }

    clickListItem($item) {
        const z = $item.find('.wrp-list-item-text-container')
        if (z.length == 0) return
        z[0].click()
    }
}