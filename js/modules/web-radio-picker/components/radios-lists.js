/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const FavoritesJSONExportValidatorTag = 'WRPP-FavoritesJSONExportValidatorTag'

class RadiosLists {

    validator = FavoritesJSONExportValidatorTag

    // list id to containers ids
    listIdToPanelId = {
        'List': 'opts_wrp_play_list',
        'All': 'wrp_radio_list',
        'Art': 'opts_wrp_art_list',
        'Lang': 'opts_wrp_lang_list',
        'Tag': 'opts_wrp_tag_list',
        'rad': 'wrp_radio_list'
    }

    // radio lists
    lists = {}

    constructor() {
        this.init()
    }

    init() {
        this.lists[StoreKeyName] = 'itemsLists'
    }

    addList(listId, name, isSystem) {
        if (isSystem === undefined) isSystem = false
        if (!this.lists[name]) {
            this.lists[name] = this.radioList(listId, name, isSystem)
        }
        return this.lists[name]
    }

    addToList(listId, name, radItem) {
        const list = this.getList(name)
        if (list == null) return false
        //if (list.items.includes(radItem)) return false // fix for clones
        const exItem = list.items.filter(x => x.name == radItem.name
            && x.url == radItem.url
        )
        if (exItem.length == 0) {
            list.items.push(radItem)
            return true
        }
        return false
    }

    getList(name) {
        return this.lists[name]
    }

    renameList(id, name) {
        // rename the list itself
        const list = this.getList(id)
        delete this.lists[id]
        if (list == null) return
        this.lists[name] = list
        list.name = name
        // renames list in rad items favs
        list.items.forEach(rad => {
            this.removeFavFromList(rad, id)
            rad.favLists.push(name)
        })
        return list
    }

    emptyList(name) {
        const list = this.lists[name]
        // delete in favs lists
        list.items.forEach(rad => {
            this.removeFavFromList(rad, name)
        })
        // empty the favlist
        this.lists[name].items = []
    }

    deleteList(name) {
        const list = this.lists[name]
        // delete in favs lists
        list.items.forEach(rad => {
            this.removeFavFromList(rad, name)
        })
        // delete the favlist
        delete this.lists[name]
    }

    deleteAllLists() {
        const ids = Object.getOwnPropertyNames(this.lists)
        ids.forEach(id => {
            if (id != [RadioList_History])
                this.deleteList(id)
        })
        this.init()
    }

    removeFavFromList(rdItem, favName) {
        rdItem.favLists = rdItem.favLists.filter(x => x != favName)
    }

    removeFromList(item, listName) {
        item.favLists = item.favLists.filter(x => x != listName)
        const list = this.getList(listName)
        if (list == null || !list.items) return
        // compare on name/url to support clones
        list.items = list.items.filter(x => x.name != item.name
            && x.url != item.url
        )
    }

    removeFromAnyList(item) {
        for (const listName in this.lists) {
            const list = this.lists[listName]
            if (list.items) {
                const existsIn = list.items.filter(
                    x => x.name == item.name
                        && x.url == item.url).length > 0
                if (existsIn) {
                    list.items =
                        list.items.filter(
                            x => x.name != item.name
                                && x.url != item.url
                        )
                    if (settings.debug.debug)
                        console.log('remove item "' + item.name + '" from favList: ' + listName)
                }
            }
        }
    }

    findItem(listId, itemId) {
        const list = this.getList(listId)
        if (list == null) return null
        var res = null
        if (list.items)
            list.items.some(o => {
                if (o.id == itemId) {
                    res = o
                    return true
                }
                return false
            })
        return res
    }

    findItemByNameAndUrl(listId, name, url) {
        const list = this.getList(listId)
        if (list == null) return null
        var res = null
        if (list.items)
            list.items.some(o => {
                if (o.name == name && o.url == url) {
                    res = o
                    return true
                }
                return false
            })
        return res
    }

    findListItemById(id, containerId) {
        const $items = $('#' + containerId).find('.wrp-list-item')
        // TODO: use 'some' operator to speed up this
        const t = $items.map((i, e) => {
            return {
                item: e,
                id: e.attributes['data-id'].value
            }
        })
        const r = t.filter((i, x) => x.id == id)
        return (r.length == 0) ? null : r[0]
    }

    findListItemByName(name, containerId) {
        const $items = $('#' + containerId).find('.wrp-list-item')
        // TODO: use 'some' operator to speed up this
        const t = $items.map((i, e) => {
            return {
                item: e,
                id: e.attributes['data-text'].value
            }
        })
        const r = t.filter((i, x) => x.id == name)
        return (r.length == 0) ? null : r[0]
    }

    findListItemByIdAndListId(id, listId) {
        const panelId = this.listIdToPanelId[listId]
        if (panelId === undefined) return null
        return this.findListItemById(id, panelId)
    }

    // radio list model
    radioList(listId, name, isSystem) {
        return {
            listId: listId,
            name: name,
            items: [],
            isSystem: isSystem !== undefined ? isSystem : false
        }
    }

    exportToClipboard() {
        this.lists[FavoritesJSONExportValidatorTag]
            = FavoritesJSONExportValidatorTag
        this.purgeItems()

        const txt = this.toJSON(true)

        delete this.lists[FavoritesJSONExportValidatorTag]
        window.exportedFavorites = txt
        copyToClipboard(txt)
    }

    async importFromClipboard() {
        const txt = await readFromClipboard()
        window.importedFavorites = txt
        const o = JSON.parse(txt)
        return this.importFavoritesJSONExport(o)
    }

    importFavoritesJSONExport(o) {
        if (o[FavoritesJSONExportValidatorTag] === undefined)
            throw new Error('favorites JSON export is not a valid object')

        delete o[FavoritesJSONExportValidatorTag]
        // remove history
        delete o[RadioList_History]

        const names = Object.keys(o).filter(x => x != StoreKeyName)
        if (settings.debug.info) {
            logger.log('favorites lists: ' + names.length)
            logger.log(names.join(','))
        }
        // merge favorites
        var importedItems = 0
        var importedLists = 0
        names.forEach(name => {
            const srcList = o[name]
            var tgtList = this.lists[name]
            if (tgtList === undefined) {
                // add list
                tgtList = this.radioList(srcList.listId, srcList.name, false)
                this.lists[name] = tgtList
                importedLists++
                if (settings.debug.info)
                    logger.log('add favorite list: ' + name)
            }
            // update target list
            srcList.items.forEach(srcItem => {

                const tgtItem = this.findItemByNameAndUrl(name, srcItem.name, srcItem.url)

                if (tgtItem == null) {
                    // add favorite
                    // TODO: findRadItem will be removed
                    const newItem = wrpp.findRadItem(srcItem)
                    if (newItem != null) {

                        /**
                         * ------------ station -----------
                         */

                        // merge favs lists
                        this.merge(srcItem.favLists, newItem.favLists)
                        // add to favlist
                        tgtList.items.push(newItem)
                        importedItems++
                        if (settings.debug.info)
                            logger.log('add to favorite list "' + name + '" : ' + srcItem.name)
                    }
                    else {

                        /**
                         * ---------- pdc/epi -----------
                         */

                        if (srcItem.pdc) {
                            logger.log('add PDC to favorite list "' + name + '" : ' + srcItem.name)
                            tgtList.items.push(srcItem)
                            importedItems++

                            // ------- persists in memory store ---------
                            memoryItemsStore.put(srcItem)
                        }
                        else {
                            logger.warn('skip item not in db: ' + srcItem.name)
                            console.log(srcItem)
                        }
                    }
                } else {
                    // already in target fav list. update favlist nevertheless
                    this.merge(srcItem.favLists, tgtItem.favLists)
                }
            })
        })
        if (settings.debug.info) {
            logger.log('favorites lists imported: ' + importedLists)
            logger.log('favorites imported: ' + importedItems)
        }
        return {
            importedLists: importedLists,
            importedItems: importedItems
        }
    }

    toJSON(applyFormat) {

        const selFn = (k, v) => {
            if (serializeField(k))
                return v
            else return null
        }

        var js = !applyFormat ?
            JSON.stringify(this.lists, selFn)
            : JSON.stringify(this.lists, selFn, 2)

        if (settings.debug.debug)
            console.log('size=' + js.length)

        this.purgeItems()

        js = !applyFormat ?
            JSON.stringify(this.lists, selFn)
            : JSON.stringify(this.lists, selFn, 2)

        if (settings.debug.debug)
            console.log('purged.size=' + js.length)

        return js
    }

    purgeItems() {
        for (const name in this.lists) {
            const list = this.lists[name]
            if (list.items)
                list.items.forEach(item => {
                    if (item.sel) {
                        if (item.sel.pdc?.item?.sel)
                            item.sel.pdc.item.sel = null
                        if (item.sel.epi?.item?.sel)
                            item.sel.epi.item.sel = null
                        if (item.sel.pdc?.item)
                            item.sel.pdc.item.pItem = null
                        if (item.sel.epi?.item)
                            item.sel.epi.item.pItem = null
                    }
                    if (item.pItem) item.pItem = null
                })
            else
                console.warn('list "' + name + '" has no items prop')
        }
    }

    fromJSON(str) {
        const lists = JSON.parse(str)
        this.fromObject(lists)
    }

    fromObject(lists) {
        const t = {}
        const names = Object.keys(lists)
        names.forEach(name => {
            if (name != StoreKeyName) {
                const srcList = lists[name]
                t[name] = srcList
                const substItems = []
                // normalize props
                if (srcList.isSystem === undefined)
                    srcList.isSystem = srcList.name == RadioList_History
                // transfers props
                srcList.items.forEach(item => {

                    // TODO: this search in allItems . thus loose pdcs & epis
                    // TODO: will be removed with dynamic station list loading
                    const newItem = wrpp.findRadItem(item)

                    // copy dynamic properties from storage
                    if (newItem != null) {

                        /**
                        * ----------- station item  -------------
                        **/

                        newItem.favLists = [...item.favLists]
                        // fix history fav
                        if (name == RadioList_History && !newItem.favLists.includes(RadioList_History))
                            newItem.favLists.push(RadioList_History)

                        wrpp.checkItemKey(newItem)

                        substItems.push(newItem)
                    }
                    else {

                        if (item.pdc) {

                            /**
                            * -----------  pdc/epi items  -------------
                            **/

                            substItems.push(item)

                            // fix history fav
                            if (name == RadioList_History && !item.favLists.includes(RadioList_History))
                                item.favLists.push(RadioList_History)

                            if (settings.migration.fixFavoritesItemsFavLists) {
                                // fix item favFists: add listId to favList
                                if (!item.favLists.includes(name))
                                    item.favLists.push(name)
                            }

                            // init properties from local db
                            wrpp.checkItemKey(item)
                            propertiesStore.load(item)
                            // put item in memory store
                            memoryItemsStore.put(item)

                        }
                    }
                })
                srcList.items = substItems
            }
        })
        this.lists = t
        this.purgeItems()
        this.cleanupHistoryItemsFavorites()

    }

    cleanupHistoryItemsFavorites() {
        // delete unexisting favorites in history items
        const list = this.lists[RadioList_History]
        const listNames = Object.keys(this.lists)
        list.items.forEach(item => {
            const t = [...item.favLists]
            t.forEach(favName => {
                if (!listNames.includes(favName))
                    this.removeFavFromList(item, favName)
            })
        })
    }

    equalTo(rdList1, rdList2) {
        return rdList1 == null
            || rdList2 == null
            || (rdList1.listId == rdList2.listId
                && rdList1.name == rdList2.name)
    }

    merge(from, into) {
        if (from == null || into == null) return
        from.forEach(x => {
            if (!into.includes(x))
                into.push(x)
        })
    }
}