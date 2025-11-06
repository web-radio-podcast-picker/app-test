/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class DurationHMS {

    h = 0
    m = 0
    s = 0

    error = false

    toString() {
        if (this.error) return null
        var h = this.h + ''
        var m = this.m + ''
        var s = this.s + ''
        if (h.length == 1) h = '0' + h
        if (m.length == 1) m = '0' + m
        if (s.length == 1) s = '0' + s
        const strDur = h + ':' + m + ':' + s
        return strDur
    }

    // convert from a number of seconds
    static fromSeconds(sec) {
        if (isNaN(sec)) return null
        const res = new DurationHMS()
        try {
            // should be hh:mm:ss
            var h = Math.floor(parseFloat((parseFloat(sec) / (60 * 24)).toFixed(2)))
            const durM = sec - (h * 60 * 24)
            var m = Math.floor(parseFloat((parseFloat(durM) / 60).toFixed(2)))
            var s = Math.floor(durM - m * 60)
            res.h = h
            res.m = m
            res.s = s
        } catch {
            res.error = true
        }
        return res
    }

    // convert from [[hh:]mm:]ss
    static fromHMS(str) {

    }
}
