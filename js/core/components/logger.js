/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class Logger {

    $pane = null

    constructor(paneId) {
        this.$pane = $('#' + paneId)
        if (this.$pane.length == 0)
            this.$pane.length = null
    }

    log(s, o) {
        if (o === undefined)
            console.log(s)
        else
            console.log(s, o)
        if (this.$pane == null) return
        const str1 = this.toStr(s)
        const str2 = o !== undefined ? this.toStr(o) : null
        this.addLogItem(str1, str2)
    }

    error(s, o) {
        if (o === undefined)
            console.error(s)
        else
            console.error(s, o)
        if (this.$pane == null) return
        const str1 = this.toStr(s)
        const str2 = o !== undefined ? this.toStr(o) : null
        this.addLogItem(str1, str2, 'log-item-error')
    }

    warn(s, o) {
        if (o === undefined)
            console.warn(s)
        else
            console.warn(s, o)
        if (this.$pane == null) return
        const str1 = this.toStr(s)
        const str2 = o !== undefined ? this.toStr(o) : null
        this.addLogItem(str1, str2, 'log-item-warning')
    }

    addLogItem(s1, s2, cl) {
        const c = cl === undefined ? '' : cl
        const it = s => $('<div class="log-item ' + c + '">' + s + '</div>')
        const $item = it(s1)
        this.$pane.append($item)
        if (s2 == null) return
        const $item2 = it(s2)
        this.$pane.append($item2)
    }

    toStr(o) {
        var str = o
        if (typeof str == 'object')
            str = (typeof str) + ':' + JSON.stringify(o)
        return str
    }

}
