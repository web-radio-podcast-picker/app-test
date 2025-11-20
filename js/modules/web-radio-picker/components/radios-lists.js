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

    /**
     * migration: removeItemRefProperty
     */
    removeItemRefPropertyFromRadioLists() {
        logger.log('migration: removeItemRefProperty')
        for (const listName in this.lists) {
            if (listName != StoreKeyName) {
                const list = this.lists[listName]
                if (list.items) {
                    list.items.forEach(item => {
                        if (item.ref) delete item['ref']
                        if (item.sel?.pdc?.item) delete item.sel.pdc.item['ref']
                        if (item.sel?.epi?.item) delete item.sel.epi.item['ref']
                    })
                }
            }
        }
    }

    addList(listId, name, isSystem) {
        if (isSystem === undefined) isSystem = false
        if (!this.lists[name]) {
            this.lists[name] = this.radioList(listId, name, isSystem)
        }
        settings.dataStore.saveRadiosLists()
        return this.lists[name]
    }

    addToList(listId, listName, item) {
        const added = this.#addFavItem(item, listName)
        settings.dataStore.saveRadiosLists()
        return added
    }

    #addFavItem(item, listName) {

        const add = (item, listName) => {
            if (item == null || item === undefined) return
            const list = this.getList(listName)
            if (list == null) return false

            const exItem = list.items.filter(x => x.name == item.name
                && x.url == item.url
            )
            if (exItem.length == 0) {
                list.items.push(item)
                addUnique(item.favLists, listName)
                settings.dataStore.resetItemProperties(item)
                return true
            }
            return false
        }

        const added = add(item, listName)
        add(item.sel?.pdc?.item, listName)
        add(item.sel?.epi?.item, listName)
        return added
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
            this.#renameFavItem(rad, id, name)
        })

        settings.dataStore.saveRadiosLists()

        return list
    }

    #renameFavItem(item, oldname, newname) {

        const rmfv = (item, oldname, newname) => {
            if (item == null || item === undefined) return
            item.favLists = item.favLists.filter(x => x != oldname)
            item.favLists.push(newname)
            settings.dataStore.resetItemProperties(item)
        }
        rmfv(item, oldname, newname)
        rmfv(item.sel?.epi?.item)
        rmfv(item.sel?.pdc?.item)
    }

    emptyList(name) {
        const list = this.lists[name]
        // delete in favs lists
        list.items.forEach(rad => {
            this.#emptyFavItem(rad, name)
        })
        // empty the favlist
        this.lists[name].items = []

        settings.dataStore.saveRadiosLists()
    }

    #emptyFavItem(item, name) {
        const rmfv = (item, name) => {
            if (item == null || item === undefined) return
            this.#removeFavFromList(item, name)
            settings.dataStore.resetItemProperties(item, false)
        }
        rmfv(item, name)
        rmfv(item.sel?.pdc?.item, name)
        rmfv(item.sel?.epi?.name, name)
    }

    deleteList(name) {
        if (name == StoreKeyName) return
        const list = this.lists[name]
        // delete in favs lists
        list.items.forEach(rad => {
            this.#deleteFavItem(rad, name)
        })
        // delete the favlist
        delete this.lists[name]

        settings.dataStore.saveRadiosLists()
    }

    #deleteFavItem(item, name) {
        const rmfv = (item, name) => {
            if (item == null || item === undefined) return
            this.#removeFavFromList(item, name)
            settings.dataStore.resetItemProperties(item, false)
        }
        rmfv(item, name)
        rmfv(item.sel?.pdc?.item)
        rmfv(item.sel?.epi?.item)
    }

    deleteAllLists() {
        const ids = Object.getOwnPropertyNames(this.lists)
        ids.forEach(id => {
            if (id != [RadioList_History])
                this.deleteList(id)
        })
        this.init()

        settings.dataStore.saveRadiosLists()
    }

    #removeFavFromList(rdItem, favName) {
        const rmfv = (item, favName) =>
            item.favLists = item.favLists.filter(x => x != favName)
        rmfv(rdItem, favName)
    }

    removeFromList(item, listName) {
        this.#removeFavItem(item, listName)
        settings.dataStore.saveRadiosLists()
    }

    #removeFavItem(item, listName) {

        const rm = (item, listName) => {
            if (item == null || item === undefined) return
            this.#removeFavFromList(item, listName)
            const list = this.getList(listName)
            if (list == null || !list.items) return
            // ℹ️ compare on name/url to support clones
            list.items = list.items.filter(x => x.name != item.name
                && x.url != item.url
            )
            settings.dataStore.resetItemProperties(item)
        }

        rm(item, listName)
        rm(item.sel?.pdc?.item, listName)
        rm(item.sel?.epi?.item, listName)
    }

    removeFromAnyList(item) {
        const lLists = this.lists
        for (const listName in lLists) {
            const list = lLists[listName]
            if (listName != RadioList_History && list.items) {
                this.removeFromList(item, listName)
                settings.dataStore.resetItemProperties(item)
            }
        }

        settings.dataStore.saveRadiosLists()
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

    importFromText(text) {
        window.importedFavorites = txt
        const o = JSON.parse(text)
        return this.importFavoritesJSONExport(o)
    }

    async importFromClipboard() {
        const txt = await readFromClipboard()
        window.importedFavorites = txt
        const o = JSON.parse(txt)
        return this.importFavoritesJSONExport(o)
    }

    importFromText(txt) {
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
                            propertiesStore.savePropsToDb(srcItem)
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

                            //console.log(item.favLists.join(','))

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

        if (settings.migration.removeItemRefProperty)
            this.removeItemRefPropertyFromRadioLists()

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
                    this.#removeFavFromList(item, favName)
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