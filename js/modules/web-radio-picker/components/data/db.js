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
    rssStoreName = 'rss'
    pdclistsStoreName = 'pdclists'
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
        this.rssStoreName = settings.db.rssStoreName
        this.pdcListsStoreName = settings.db.pdcListsStoreName
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
                logger.log(DbLogPfx + 'db ready (no migration) cur ver=' + settings.db.dbVer)
            if (this.onDbReady) this.onDbReady()
        }
        req.onupgradeneeded = e => this.createDb(e, e.target.result)
        return this
    }

    /**
     * create the db
     * @param {IDBVersionChangeEvent} e 
     * @param {IDBDatabase} db 
     */
    createDb(e, db) {

        if (settings.debug.debug) {
            logger.log(DbLogPfx + 'create db', e)
            logger.log(DbLogPfx + 'current version: ' + settings.db.dbVer)
            logger.log(DbLogPfx + 'db migration from version ' + e.oldVersion + ' to ' + e.newVersion)
        }

        const checkReady = (id, cnt) => {
            if (cnt == null || cnt === undefined) cnt = 1
            this.#count++
            this.dbReady = this.#count == 5
            if (settings.debug.debug)
                logger.log(DbLogPfx + 'check ready: ' + id)
            if (this.dbReady) {
                if (settings.debug.debug)
                    logger.log(DbLogPfx + 'db ready')
                if (this.onDbReady) this.onDbReady()
            }
        }

        const noPrevVer = e.oldVersion == null || e.oldVersion === undefined || e.oldVersion == 0

        if (noPrevVer) {    // first upgrade event (first db create)

            if (settings.debug.debug) logger.log(DbLogPfx + 'migrate db to version 1')

            // version 1
            // favorites : items without key
            const favoritesStore = db.createObjectStore(
                this.itemsListsStoreName, { keyPath: StoreKeyName })
            favoritesStore.transaction.oncomplete = e => checkReady(this.itemsListsStoreName)

            // properties : items by key 'key' (key==name+url)
            const propertiesStoreName = db.createObjectStore(
                this.propertiesStoreName, { keyPath: StoreObjectKeyName })
            propertiesStoreName.transaction.oncomplete = e => checkReady(this.propertiesStoreName)

            // uistate : items by key 'storeKey'
            const uiStateStore = db.createObjectStore(
                this.uiStateStoreName, { keyPath: StoreKeyName })
            uiStateStore.transaction.oncomplete = e => checkReady(this.uiStateStoreName)
        } else checkReady(this.uiStateStoreName, 3)

        if (noPrevVer || e.oldVersion == 1) {

            if (settings.debug.debug) logger.log(DbLogPfx + 'migrate db to version 2')

            // version 2
            // rss: rss parsed objects by key 'key'
            const rssStore = db.createObjectStore(
                this.rssStoreName, { keyPath: StoreObjectKeyName })
            rssStore.transaction.oncomplete = e => checkReady(this.rssStoreName)
        } else checkReady(this.rssStoreName, 1)

        if (noPrevVer || e.oldVersion <= 2) {

            if (settings.debug.debug) logger.log(DbLogPfx + 'migrate db to version 3')

            // version 3
            // pdc lists: list.txt files parsed objects by key 'key
            const pdcListsStore = db.createObjectStore(
                this.pdcListsStoreName, { keyPath: StoreObjectKeyName })
            pdcListsStore.transaction.oncomplete = e => checkReady(this.pdcListsStoreName)
        } else checkReady(this.pdcListsStoreName, 1)

        // version 4 - fix mig version 1 to 3
    }

    /**
     * save properties
     * @param {Object} o 
     */
    saveProperties(o) {
        const label = 'properties'
        for (const key in o) {
            this.#saveObject(o[key], this.propertiesStoreName, label, true)
        }
        if (settings.debug.debug)
            logger.log(DbLogPfx + label + ' saved in db')
    }

    /**
     * save item properties
     * @param {Object} props pdc/epi properties
     */
    savePropertiesSingle(props) {
        const label = this.propertiesStoreName
        this.#saveObject(props, this.propertiesStoreName, label)
    }

    /**
     * save rss object
     * @param {Object} rss 
     */
    saveRss(rss) {
        const label = this.rssStoreName
        this.#saveObject(rss, this.rssStoreName, label)
    }

    /**
     * save a pdc list object
     * @param {Object} rss 
     */
    savePdcList(list) {
        const label = 'pdc list'
        this.#saveObject(list, this.pdclistsStoreName, label)
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

    #saveSingleObject(o, storeName, label, nolog) {
        const tc = this.db.transaction(storeName, 'readwrite')
            .objectStore(storeName)
        const req = tc.clear()
        req.onerror = e => this.dbError(e)
        req.onsuccess = e => {
            const ts = this.db.transaction(storeName, 'readwrite')
                .objectStore(storeName)
            const req2 = ts.put(o)
            req2.onsuccess = e => {
                if (nolog != true && settings.debug.debug)
                    logger.log(DbLogPfx + label + ' saved in db')
            }
        }
    }

    #saveObject(o, storeName, label, nolog) {
        const ts = this.db.transaction(storeName, 'readwrite')
            .objectStore(storeName)
        const req2 = ts.put(o)
        req2.onsuccess = e => {
            if (nolog != true && settings.debug.debug)
                logger.log(DbLogPfx + label + ' saved in db')
        }
    }

    /**
     * load pdc lists
     * @param {Function} onLoaded 
     */
    loadPdcLists(onLoaded) {
        this.#loadAllObjects(this.pdclistsStoreName, 'pdcList', onLoaded)
    }

    /**
     * load rss
     * @param {Function} onLoaded 
     */
    loadRss(onLoaded) {
        this.#loadAllObjects(this.rssStoreName, 'rss', onLoaded)
    }

    /**
     * load properties
     * @param {Function} onLoaded 
     */
    loadProperties(onLoaded) {
        //this.#loadSingleObject(this.propertiesStoreName, 'properties', 'properties', onLoaded)
        this.#loadAllObjects(this.propertiesStoreName, 'properties', onLoaded)
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

    #loadAllObjects(storeName, label, onLoaded) {
        const tc = this.db.transaction(storeName, 'readwrite')
            .objectStore(storeName)
        const req = tc.getAll()
        req.onerror = e => this.dbError(e)
        req.onsuccess = e => {
            if (settings.debug.debug)
                logger.log(DbLogPfx + label + ' loaded from db')
            const o = req.result
            onLoaded(o)
        }
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