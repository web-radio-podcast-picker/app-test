/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class RadioDataBuilder {

    init(wrp) {
        this.wrp = wrp
        return this
    }

    exportProcessedData() {
        // groups
        const groups = this.encodeGroups()
        var i = 0
        groups.sort((a, b) => a.localeCompare(b))
        const exp = { groups: groups.join(Line_Sep) }
        // radio items (all)
        const its = []
        this.wrp.itemsAll.forEach(item => {
            its.push(this.encodeRadioItem(item))
        })
        exp.radioList = its.join(Line_Sep)
        // artists
        const arts = []
        var artId = -1
        for (const artName in this.wrp.itemsByArtists) {
            artId++
            arts.push(
                artId
                + Sep
                + this.wrp.encodeArtistGroup(artName))
        }
        exp.artists = arts.join(Line_Sep)

        if (settings.debug.globalObj) {
            window.export_obj = exp
            window.export_txt =
                [exp.groups, exp.artists, exp.radioList]
                    .join(Bloc_Sep)
        }
    }

    encodeRadioItem(item) {
        const n = s => s == null ? '' : s
        return item.id + Sep +          // 0
            item.name + Sep +           // 1
            item.groupsCodes.join(List_Sep) + Sep + // 2
            n(item.lang) + Sep +        // 3
            n(item.country) + Sep +     // 4
            n(item.artist) + Sep +      // 5
            n(item.logo) + Sep +        // 6
            item.url                    // 7
            ;
    }

    encodeArtistGroup(artName) {
        const artLst = this.wrp.itemsByArtists[artName]
        var items = artLst.map((value, index, array) => value.id)
        return items.join(List_Sep)
    }

    encodeGroup(grp, groupId, item) {
        return grp
            + Sep + groupId + Sep
            + ((Object.getOwnPropertyNames(this.wrp.itemsByLang).includes(grp)) ? 'X' : '')
    }

    encodeGroups() {
        var groupId = 0
        const groups = []
        const grps = []
        this.wrp.itemsAll.forEach(item => {
            item.groupsCodes = []
            item.groups.forEach(grp => {
                if (!grps.includes(grp)) {
                    grps.push(grp)
                    groups.push(this.encodeGroup(grp, groupId, item))
                    item.groupsCodes.push(groupId++)
                } else {
                    item.groupsCodes.push(grps.indexOf(grp))
                }
            })
        })
        return groups
    }
}
