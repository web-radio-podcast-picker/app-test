/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class FlatIndexTextExportParser {

    rowIndex = 0
    data = null

    j = {}
    index = {}
    dump = false
    dumpLang = false

    constructor() {
        this.c = settings.dataProvider
    }

    /**
     * to be used from any external context
     * @param {string} exportText flat index text export file content
     * @returns json object
     */
    parse(exportText) {
        this.data = exportText.split('\n')
        this.parseProps()
        this.parseLangs()
        this.j.langs = this.index
        return this.j
    }

    parseLangs() {
        while (!this.endOfFile()) {
            this.parseLang()
            this.nextLine()
        }
    }

    parseLang() {
        const pklang = this.currentLine()
        const langProps = this.splitProps(pklang)
        const klang = langProps.name
        this.index[klang] = {}
        if (langProps.props) this.index[klang].props = langProps.props

        if (this.dumpLang) logger.log('lang=' + klang)

        this.nextLine()
        var line = null
        while (
            !this.endOfFile() &&
            (line = this.currentLine()) != this.c.endOfTagList) {
            this.parseTags(klang)
        }
    }

    parseTags(klang) {
        var line = null
        while (
            !this.endOfFile() &&
            (line = this.currentLine()) != this.c.endOfAlphaList
            && line != this.c.endOfTagList) {
            this.parseTag(klang)
            this.nextLine()
        }
    }

    parseTag(klang) {
        const pktag = this.currentLine()
        const tagProps = this.splitProps(pktag)
        const ktag = tagProps.name

        this.index[klang][ktag] = {}

        if (tagProps.props) this.index[klang][ktag].props = tagProps.props

        if (this.dump) logger.log('tag=' + ktag)
        this.nextLine()
        this.parseAlphas(klang, ktag)
    }

    parseAlphas(klang, ktag) {
        var line = null
        while (
            !this.endOfFile() &&
            (line = this.currentLine()) != this.c.endOfAlphaList) {
            this.parseAlpha(klang, ktag)
            this.nextLine()
        }
    }

    parseAlpha(klang, ktag) {
        const pkalpha = this.currentLine()
        const alphaProps = this.splitProps(pkalpha)
        const kalpha = alphaProps.name

        this.index[klang][ktag][kalpha] = {}

        if (alphaProps.props) this.index[klang][ktag][kalpha].props = alphaProps.props
    }

    parseProps() {
        const t = []
        var line = null
        while ((line = this.currentLine()) != this.c.txtExportLineSeparator) {
            t.push(line)
            this.nextLine()
        }
        const props = JSON.parse(t.join('\n'))
        this.j.props = props
        this.nextLine()
    }

    splitProps(line) {
        const t = line.split(this.c.dataPropSeparator)
        if (t.length == 2) {
            const t2 = t[1].split(this.c.breakSeparator)
            return {
                name: t[0],
                props: {
                    count: parseInt(t2[0]),
                    stores: t2[1].split(this.c.listSeparator)
                        .map(x => parseInt(x))
                }
            }
        }
        else {
            return { name: t[0] }
        }
    }

    // -----

    currentLine() {
        return this.data[this.rowIndex]
    }

    endOfFile() {
        return this.rowIndex >= this.data.length
    }

    nextLine() {
        this.rowIndex++
    }
}