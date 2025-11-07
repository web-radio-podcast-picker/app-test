/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const DbLogPfx = '[$$] '

class Db {

    dbName = 'wrpp'
    dbVer = 1
    db = null   // open db
    itemsListsStoreName = 'lists'
    propertiesStoreName = 'properties'
    uiStateStoreName = 'uistate'
    dbReady = false
    #count = 0
    onDbReady = null

    constructor(onDbReady) {
        this.onDbReady = onDbReady
        this.dbName = settings.db.dbName
        this.dbVer = settings.db.dbVer
        this.itemsListsStoreName = settings.db.itemsListsStoreName
        this.propertiesStoreName = settings.db.propertiesStoreName
        this.uiStateStoreName = settings.db.uiStateStoreName
    }

    /**
     * open the db. creates it if necessary
     * callback onDbReady when done
     * @returns 
     */
    openDb() {
        const req = indexedDB.open(this.dbName, this.dbVer)
        req.onerror = e => this.dbError(e)
        req.onsuccess = e => {
            this.db = e.target.result
            this.dbReady = true
            if (settings.debug.debug)
                logger.log(DbLogPfx + 'db ready')
            if (this.onDbReady) this.onDbReady()
        }
        req.onupgradeneeded = e => this.createDb(e.target.result)
        return this
    }

    /**
     * create the db
     * @param {IDBDatabase} db 
     */
    createDb(db) {

        if (settings.debug.debug) logger.log(DbLogPfx + 'create db')

        const checkReady = () => {
            this.#count++
            this.dbReady = this.#count == 3
            if (this.dbReady) {
                if (settings.debug.debug)
                    logger.log(DbLogPfx + 'db ready')
                if (this.onDbReady) this.onDbReady()
            }
        }

        // favorites : items without key
        const favoritesStore = db.createObjectStore(
            this.itemsListsStoreName, { keyPath: StoreKeyName })
        // properties : items by key 'key' (key==name+url)
        const propertiesStoreName = db.createObjectStore(
            this.propertiesStoreName, { keyPath: StoreObjectKeyName })
        // uistate : items by key 'storeKey'
        const uiStateStore = db.createObjectStore(
            this.uiStateStoreName, { keyPath: StoreKeyName })

        favoritesStore.transaction.oncomplete = e => checkReady()
        propertiesStoreName.transaction.oncomplete = e => checkReady()
        uiStateStore.transaction.oncomplete = e => checkReady()
    }

    /**
     * save items lists
     * @param {Object} o 
     */
    saveItemsLists(o) {

        // fix bad datas
        if (o.currentRDItem &&
            typeof o.currentRDItem.listenDate == 'function')
            o.currentRDItem.listenDate = null

        this.#saveSingleObject(o, this.itemsListsStoreName, 'favorites')
    }

    /**
     * save ui state data from UIState.getCurrentUIState().object
     * @param {Object} o 
     */
    saveUIState(o) {
        this.#saveSingleObject(o, this.uiStateStoreName, 'ui state')
    }

    #saveSingleObject(o, storeName, label) {
        const tc = this.db.transaction(storeName, 'readwrite')
            .objectStore(storeName)
        const req = tc.clear()
        req.onerror = e => this.dbError(e)
        req.onsuccess = e => {
            const ts = this.db.transaction(storeName, 'readwrite')
                .objectStore(storeName)
            const req2 = ts.put(o)
            req2.onsuccess = e => {
                if (settings.debug.debug)
                    logger.log(DbLogPfx + label + ' saved in db')
            }
        }
    }

    /**
     * load items lists
     * @param {Function} onLoaded 
     */
    loadItemsLists(onLoaded) {
        this.#loadSingleObject(this.itemsListsStoreName, 'itemsLists', 'favorites', onLoaded)
    }

    /**
     * load ui state data
     * @param {Function} onLoaded
     */
    loadUIState(onLoaded) {
        this.#loadSingleObject(this.uiStateStoreName, 'uiState', 'ui state', onLoaded)
    }

    #loadSingleObject(storeName, key, label, onLoaded) {
        const tc = this.db.transaction(storeName, 'readwrite')
            .objectStore(storeName)
        const req = tc.get(key)
        req.onerror = e => this.dbError(e)
        req.onsuccess = e => {
            if (settings.debug.debug)
                logger.log(DbLogPfx + label + ' loaded from db')
            const o = req.result
            onLoaded(o)
        }
    }

    /**
     * report any db error
     * @param {Event} e 
     */
    dbError(e) {
        console.error(e.target.error?.message)
    }
}