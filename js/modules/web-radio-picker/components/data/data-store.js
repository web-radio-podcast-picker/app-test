/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const ST_RadiosLists = 'RadiosLists'
const ST_UIState = 'UIState'

const DataStoreLogPfx = '[--] '

class DataStore {

    /**
     * @type {Db}
     */
    db = null
    saveDisabled = false

    rlDebouncer = new Debouncer('dbcSaveRadiosLists',
        settings.db.minSpanMs,
        settings.db.delayExec
    )
    uisDebouncer = new Debouncer('dbcSaveUIState',
        settings.db.minSpanMs,
        settings.db.delayExec)

    init(onDbReady) {
        // init db
        this.db = new Db(onDbReady)
        this.db.openDb()
        if (settings.debug.debug) window.db = this.db
    }

    saveAll() {
        this.saveRadiosLists()
        this.saveUIState()
    }

    loadRadiosLists(onLoaded) {

        // local storage
        if (settings.dataStore.useLocalStorage) {
            if (localStorage === undefined) return
            const str = localStorage.getItem(ST_RadiosLists)
            if (str == null) {
                this.#dbcSaveRadiosLists()
                return
            }
            radiosLists.fromJSON(str)
        }

        // db
        this.db.loadItemsLists(o => {
            if (o != null)
                radiosLists.fromObject(o)
            else {
                logger.error('favorites not found')
            }
            onLoaded()
        })

    }

    saveRadiosLists() {
        this.rlDebouncer.debounce(() => this.#dbcSaveRadiosLists())
    }

    #dbcSaveRadiosLists() {
        if (this.saveDisabled) return

        try {
            if (settings.debug.info)
                logger.log(DataStoreLogPfx + 'save favorites')

            if (settings.db.useLocalStorage) {
                // local storage
                if (localStorage === undefined) {
                    if (settings.debug.info)
                        logger.warn(DataStoreLogPfx + 'no local storage')
                    return
                }
                const str = radiosLists.toJSON()
                localStorage.setItem(ST_RadiosLists, str)
            }

            // db
            radiosLists.init()
            this.db.saveItemsLists(radiosLists.lists)

        } catch (err) {
            this.saveDisabled = true
            ui.showError('save favorites failed', null, null, null, err)
        }
    }

    initUIStateStorage(initFunc) {
        if (!settings.db.useLocalStorage) return

        // create storage if missing
        if (localStorage === undefined) return
        const str = localStorage.getItem(ST_UIState)
        if (str != null) return false // storage exists. do nothing
        initFunc()
        if (settings.debug.debug)
            logger.log(DataStoreLogPfx + 'UIState local storage initialized')
        return true
    }

    deleteStorage(skipReload) {
        if (localStorage === undefined) return
        localStorage.removeItem(ST_UIState)
        localStorage.removeItem(ST_RadiosLists)
        if (settings.debug.debug)
            logger.log('UIState local storage deleted')
        if (skipReload != true)
            window.location.reload()
    }

    loadUIState(onLoaded) {

        // local storage
        if (settings.db.useLocalStorage) {
            if (localStorage === undefined) return
            const str = localStorage.getItem(ST_UIState)
            if (str == null) {
                this.#dbcSaveUIState()
                return
            }
            uiState.fromJSON(str)
        }

        // db
        this.db.loadUIState(o => {
            if (o != null)
                uiState.fromObject(o)
            else {
                logger.error('ui state not found')
            }
            if (onLoaded) onLoaded()
        })
    }

    saveUIState() {
        this.uisDebouncer.debounce(() => this.#dbcSaveUIState())
    }

    #dbcSaveUIState() {
        if (this.saveDisabled) return
        try {
            if (settings.debug.info)
                logger.log(DataStoreLogPfx + 'save UI state')

            if (settings.db.useLocalStorage) {
                // local storage
                if (localStorage === undefined) {
                    if (settings.debug.info)
                        logger.warn(DataStoreLogPfx + 'no local storage')
                    return
                }
                const str = uiState.toJSON()
                localStorage.setItem(ST_UIState, str)
            }

            // db
            this.db.saveUIState(uiState.getCurrentUIState().object)

        } catch (err) {
            this.saveDisabled = true
            ui.showError('save UI failed', null, null, null, err)
        }
    }
}
