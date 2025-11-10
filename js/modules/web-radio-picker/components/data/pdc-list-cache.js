/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// store parsed list text files as objects
// is a cache object key -> parsed lists data

class PdcListCache {

    data = {}

    toObject() {
        return this.data
    }

    /**
     * from an array of objects
     * @param {Array} o 
     */
    fromObject(t) {
        const d = {}
        ////this.data = o
        if (t == null || t === undefined) return
        t.forEach(o => {
            d[o.key] = o
        })
        this.data = d
    }

    put(list) {
        const key = list.key
        this.data[key] = list
        settings.dataStore.db.savePdcList(list)
    }

    get(key) {
        const obj = this.data[key]
        return obj || null
    }
}