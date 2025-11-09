/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// store items by key in memories. used to share instance instead of cloning
// is a cache object key -> item

class MemoryItemsStore {

    data = {}

    // add or replace an item
    put(item) {
        const key = this.#checkKey(item)
        if (!key) return
        this.data[key] = item
    }

    get(key) {
        if (!key) return null
        return this.data[key]
    }

    #checkKey(item) {
        const key = item.key
        if (!key) logger.error('item has no key: ' + item.name)
        return key
    }
}