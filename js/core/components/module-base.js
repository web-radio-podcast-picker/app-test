/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// module base - any module must inherits from this

class ModuleBase {

    validate() {
        if (this.views === undefined
            || this.id === undefined
            || this.settings === undefined
            || this.views == null
            || this.id == null
            || this.views == null
            || this.settings == null
            || this.views.length === undefined
            || this.settings.length === undefined
        )
            throw new Error('module is not valid')
    }

    getSettings() {
        return settings.modules[this.id]
    }

    getSettingsPath() {
        return 'settings.modules[' + this.id + ']'
    }

}