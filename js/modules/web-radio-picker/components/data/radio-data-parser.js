/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class RadioDataParser {

    init(wrp) {
        this.wrp = wrp
        return this
    }

    setDataRadioList(text) {
        const t = text.split(Bloc_Sep)
        this.parseGroups(t[0])
        this.parseRadios(t[2])
        this.parseArts(t[1])
    }

    parseGroups(txt) {
        const t = this.getExpLinesArray(txt)
        t.forEach(s => {
            const g = s.split(Sep)
            const grpName = g[0]
            const grpId = g[1]
            const grpIsLang = g[2] == 'X'
            this.wrp.groupsById[grpId] = grpName
            if (!grpIsLang) {
                this.wrp.items[grpName] = []
            }
            else {
                this.wrp.itemsByLang[grpName] = []
            }
        })
    }

    parseRadios(txt) {
        const t = this.getExpLinesArray(txt)
        this.wrp.listCount = 0
        t.forEach(s => {
            const item = this.parseRadio(s)
            this.wrp.itemsAll.push(item)
            this.wrp.itemsById[item.id] = item
            this.wrp.itemsByName['"' + item.name + '"'] = item
            if (item.lang != null) {
                try {
                    this.wrp.itemsByLang[item.lang].push(item)
                } catch (e) {
                    logger.log(item)
                }
            }

            item.groups.forEach(grp => {
                try {
                    if (this.wrp.items[grp])
                        this.wrp.items[grp].push(item)
                } catch (e) {
                    logger.log(item)
                }
            })

            this.wrp.listCount++
        })
    }

    parseRadio(s) {
        const t = s.split(Sep)
        const n = s => s == '' ? null : s
        const item = this.wrp.radioItem(
            t[0],
            t[1],
            null,
            n(t[7]),
            n(t[6])
        )
        item.lang = n(t[3])
        item.country = n(t[4])
        item.artist = n(t[5])
        t[2].split(List_Sep).forEach(grpCode => {
            item.groups.push(
                this.wrp.groupsById[grpCode]
            )
        })
        return item
    }

    getExpLinesArray(txt) { return txt.replaceAll("\\n", "\n").split(Line_Sep) }

    parseArts(txt) {
        const t = this.getExpLinesArray(txt)
        t.forEach(s => {
            const item = this.parseArtist(s)
        })
    }

    parseArtist(s) {
        const t = s.split(Sep)
        const n = s => s == '' ? null : s
        const itemsIds = t[1].split(List_Sep)
        const items = itemsIds.map((value, index, array) =>
            this.wrp.itemsById[value]
        )

        const k = items[0].artist
        if (!this.wrp.itemsByArtists[k])
            this.wrp.itemsByArtists[k] = []
        const its = this.wrp.itemsByArtists[k]
        items.forEach(it => this.wrp.itemsByArtists[k].push(it))
    }
}
