/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// store items dynamic properties
// is a cache object key -> properties

class PropertiesStore {

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

    getProps(item) {
        const o = {
            key: item.key,
            metadata: item.metadata,
            favLists: item.favLists,
            subText: item.subText,
            subText2: item.subText2
        }
        o[StoreObjectKeyName] = item.key
        return o
    }

    setProps(item, props) {
        item.metadata = props.metadata
        item.favLists = props.favLists
        item.subText = props.subText
        item.subText2 = props.subText2
    }

    save(item) {
        wrpp.checkItemKey(item)
        const key = item.key
        const props = this.getProps(item)
        this.data[key] = props
        return props
    }

    savePropsToDb(item) {
        const props = this.save(item)
        settings.dataStore.savePropertiesSingle(props)
    }

    load(item) {
        const key = item.key
        const props = this.data[key]
        if (props)
            this.setProps(item, props)
    }

    check(item) {
        const key = item.key
    }
}