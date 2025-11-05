/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const ST_RadiosLists = 'RadiosLists'
const ST_UIState = 'UIState'

const DataStoreLogPfx = '[!!] '

class DataStore {

    saveDisabled = false

    rlDebouncer = new Debouncer('dbcSaveRadiosLists')
    uisDebouncer = new Debouncer('dbcSaveUIState')

    constructor() {

    }

    saveAll() {
        this.saveRadiosLists()
        this.saveUIState()
    }

    loadRadiosLists() {
        if (localStorage === undefined) return
        const str = localStorage.getItem(ST_RadiosLists)
        if (str == null) {
            this.#dbcSaveRadiosLists()
            return
        }
        radiosLists.fromJSON(str)
    }

    saveRadiosLists() {
        this.rlDebouncer.debounce(() => this.#dbcSaveRadiosLists())
    }

    #dbcSaveRadiosLists() {
        if (this.saveDisabled) return
        try {
            if (settings.debug.info)
                logger.log(DataStoreLogPfx + 'save radio lists')
            if (localStorage === undefined) {
                if (settings.debug.info)
                    logger.warn(DataStoreLogPfx + 'no local storage')
                return
            }
            const str = radiosLists.toJSON()
            localStorage.setItem(ST_RadiosLists, str)
        } catch (err) {
            this.saveDisabled = true
            ui.showError('save lists failed', null, null, null, err)
        }
    }

    initUIStateStorage(initFunc) {
        if (localStorage === undefined) return
        const str = localStorage.getItem(ST_UIState)
        if (str != null) return false // storage exists. do nothing
        initFunc()
        if (settings.debug.debug)
            logger.log('UIState local storage initialized')
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

    loadUIState() {
        if (localStorage === undefined) return
        const str = localStorage.getItem(ST_UIState)
        if (str == null) {
            this.#dbcSaveUIState()
            return
        }
        uiState.fromJSON(str)
    }

    saveUIState() {
        this.uisDebouncer.debounce(() => this.#dbcSaveUIState())
    }

    #dbcSaveUIState() {
        if (this.saveDisabled) return
        try {
            if (settings.debug.info)
                logger.log(DataStoreLogPfx + 'save UI state')
            if (localStorage === undefined) {
                if (settings.debug.info)
                    logger.warn(DataStoreLogPfx + 'no local storage')
                return
            }
            const str = uiState.toJSON()
            localStorage.setItem(ST_UIState, str)
        } catch (err) {
            this.saveDisabled = true
            ui.showError('save UI failed', null, null, null, err)
        }
    }
}
