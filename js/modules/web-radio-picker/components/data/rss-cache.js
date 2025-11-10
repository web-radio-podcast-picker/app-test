/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// store parsed rss streams as objects
// is a cache object key -> parsed rss

class RssCache {

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

    put(rss) {
        const key = rss.key
        this.data[key] = rss
        settings.dataStore.db.saveRss(rss)
    }

    get(key) {
        const rss = this.data[key]
        return rss || null
    }
}