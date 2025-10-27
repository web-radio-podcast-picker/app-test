/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class M3UDataBuilder {

    init(wrp) {
        this.wrp = wrp
        this.dataBuilder = new RadioDataBuilder().init(wrp)
        return this
    }

    setDataRadioListM3U(text) {
        var t = text.split('\n')
        var j = 1
        var n = t.length
        var itemId = 0

        while (j < n) {
            /*
            #EXTINF:-1 tvg-logo="https://kuasark.com/files/stations-logos/aordreamer.png" group-title="(.*),(.*),",AORDreamer
            http://178.33.33.176:8060/stream1
            #EXTINF:-1 tvg-logo="http://hdmais.com.br/universitariafm/wp-content/themes/theme48301/favicon.ico" group-title="Educacao,Universidade",UFC Rádio Universitária 107.9
            http://200.129.35.230:8081/;?type=http&nocache=2705
            */
            var extinf = t[j]
            var i = extinf.lastIndexOf(',')
            const name = extinf.substr(i + 1)?.trim()

            extinf = extinf.substr(0, i - 1)
            i = extinf.indexOf('group-title="')
            var groupTitle = extinf.substr(i + 13)

            extinf = extinf.substr(0, i - 1)
            i = extinf.indexOf('tvg-logo="')
            const logo = extinf.substr(i + 10).slice(0, -1)

            const url = t[j + 1]
            if (groupTitle.endsWith(','))
                groupTitle = groupTitle.slice(0, -1)

            if (groupTitle.startsWith('(.*)')
                || groupTitle == ''
                || groupTitle == '"'
                || groupTitle == ',')
                groupTitle = WRP_Unknown_Group_Label

            const item = this.wrp.radioItem(itemId++, name, groupTitle, url, logo)

            this.wrp.itemsByName['"' + name + '"'] = item
            this.wrp.itemsAll.push(item)
            this.wrp.listCount++

            const isArt = this.isArtistRadio(item)
            if (isArt !== false && isArt !== null) {
                const artName = isArt.artist
                if (this.wrp.itemsByArtists[artName] === undefined)
                    this.wrp.itemsByArtists[artName] = []
                item.artist = artName
                item.groupTitle = groupTitle = WRP_Artists_Group_Label
                this.wrp.itemsByArtists[artName].push(item)
            }

            const grps = groupTitle.split(',')
            var trgrps = []
            grps.forEach(g => {
                g = this.normalizeGroupName(g, item)
                if (g != null)
                    trgrps.push(g)
            })

            trgrps.forEach(grp => {
                var g = grp

                if (g != WRP_Unknown_Group_Label || grps.length == 1) {
                    // don't put in WRP_Unknown_Group_Label group if in another group
                    item.groups.push(g)

                    g = '"' + g + '"'
                    if (g != null && g != '') {
                        if (this.wrp.items[g] === undefined)
                            this.wrp.items[g] = []
                        try {
                            this.wrp.items[g].push(item)
                        } catch (err) {
                            logger.log(err)
                        }
                    }
                    else {
                        logger.log(g)
                    }
                }
            })
            item.groups.sort((a, b) => a.localeCompare(b))

            j += 2
        }

        // arrange 'unclassified' group
        this.groupUnclassified()

        // add tag lang
        this.groupByLang()

        // sorts

        this.wrp.itemsAll.sort((a, b) => a.name.localeCompare(b.name))

        this.wrp.items = this.sortKT(this.wrp.items)
        this.wrp.itemsByArtists = this.sortKT(this.wrp.itemsByArtists)
        this.wrp.itemsByLang = this.sortKT(this.wrp.itemsByLang)

        this.wrp.filteredListCount = this.wrp.listCount

        this.dataBuilder.exportProcessedData()
    }

    addByKey(k, t, e) {
        if (t[k] === undefined)
            t[k] = []
        t[k].push(e)
    }

    removeByKey(k, t, e) {
        if (t[k] === undefined) return
        const tt = t[k]
        remove(tt, e)
    }

    unclassifiedToTag(tag, item) {
        tag = toUpperCaseWorldsFirstLetters(tag)
        if (item.groups.includes(tag)) return

        const gtag = quote(tag)
        this.addByKey(gtag, this.wrp.items, item)

        const nogrp = toUpperCaseWorldsFirstLetters(WRP_Unknown_Group_Label)
        const g = quote(nogrp)
        this.removeByKey(g, this.wrp.items, item)
        remove(item.groups, nogrp)

        item.groups.push(tag)
    }

    unclassifiedToLang(lang, item) {
        lang = toUpperCaseWorldsFirstLetters(lang)
        if (item.groups.includes(lang)) return

        this.addByKey(lang, this.wrp.itemsByLang, item)
        item.lang = lang

        const nogrp = toUpperCaseWorldsFirstLetters(WRP_Unknown_Group_Label)
        const g = quote(nogrp)
        this.removeByKey(g, this.wrp.items, item)
        remove(item.groups, nogrp)

        item.groups.push(lang)
    }

    addTagLang(lang, item) {
        this.unclassifiedToLang(lang, item)
    }

    groupByLang() {
        const st = this.wrp.getSettings()
        this.wrp.itemsAll.forEach(item => {
            const stw = item.name.toLowerCase()
            const tw = stw.split(' ')
            tw.forEach(word => {
                // existing langs
                st.tagToLang.forEach(tl => {
                    if (tl.includes(word))
                        this.addTagLang(tl[0], item)
                    tl.forEach(tgl => {
                        if (stw == tgl)
                            this.addTagLang(tl[0], item)
                    })
                })
            })
        })
    }

    groupUnclassified() {
        const g = quote(toUpperCaseWorldsFirstLetters(WRP_Unknown_Group_Label))
        const t = [...this.wrp.items[g]]
        const st = this.wrp.getSettings()
        const tags = Object.keys(this.wrp.items)
            .map(x => unquote(x.toLowerCase()))

        // new tags from settings

        var i = 0
        t.forEach(item => {

            const stw = item.name.toLowerCase()
            const tw = stw.split(' ')

            tw.forEach(word => {

                // eventuallly build new tags
                if (st.wordToTag.includes(word))
                    this.unclassifiedToTag(word, item)

                // existing tags
                if (tags.includes(word))
                    this.unclassifiedToTag(word, item)

                // existing langs
                st.tagToLang.forEach(tl => {
                    if (tl.includes(word))
                        this.unclassifiedToLang(tl[0], item)
                })

                // word similarities
                st.tagSimilarities.forEach(sm => {
                    if (sm.includes(word))
                        this.unclassifiedToTag(sm[0], item)
                })
            })
            i++
        })
    }

    sortKT(ar) {
        var keys = Object.keys(ar)
        keys.sort((a, b) => a.localeCompare(b))
        const res = []
        keys.forEach(k => {
            const t = ar[k].sort((a, b) => a.name.localeCompare(b.name))
            res[k] = t
        })
        return res
    }

    normalizeGroupName(g, radioItem) {
        if (g == null || g == '' || g == '*' || g == '"') g = WRP_Unknown_Group_Label

        // case
        g = g.toLowerCase()

        // special
        if (g.startsWith('http://')
            || g.startsWith('https://')) g = WRP_Unknown_Group_Label

        // substitutions
        const st = this.wrp.getSettings()
        st.tagSimilarities.some(t => {
            if (t.includes(g)) {
                g = t[0]
                return true
            }
            else
                return false
        })

        // to lang
        st.tagToLang.some(tl => {
            if (tl.includes(g)) {
                g = toUpperCaseWorldsFirstLetters(tl[0])
                if (this.wrp.itemsByLang[g] === undefined)
                    this.wrp.itemsByLang[g] = []
                this.wrp.itemsByLang[g].push(radioItem)
                radioItem.groups.push(g)
                radioItem.lang = g
                // remove tag
                g = null
                return true
            }
            else return false
        })
        if (g == null) return null

        // to artist
        if (st.tagToArtist.includes(g)) {
            g = toUpperCaseWorldsFirstLetters(g)
            if (this.wrp.itemsByArtists[g] === undefined)
                this.wrp.itemsByArtists[g] = []
            radioItem.artist = g
            radioItem.groupTitle += ',' + WRP_Artists_Group_Label
            this.wrp.itemsByArtists[g].push(radioItem)
            // tag Artists
            g = WRP_Artists_Group_Label
            g = toUpperCaseWorldsFirstLetters(g)
            return g
        }

        // deletions
        if (st.removeTags.includes(g))
            // remove tag
            return null

        g = toUpperCaseWorldsFirstLetters(g)
        return g
    }

    isArtistRadio(r) {
        if (r == null || r.url == null) return false
        const st = this.wrp.getSettings()
        var res = null
        st.artistUrlFilters.forEach(t => {
            const url = t[0]
            const f = t[1]
            if (r.url != null && r.url.startsWith(url)) {
                res = {
                    url: r.url,
                    item: r,
                    artist: f == null ? r.name : eval('this.wrp.' + f + '(r)')
                }
                return res
            }
        })
        return res
    }
}