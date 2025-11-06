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
    isInfinite = false

    static toSeconds(o) {
        return o.h * 60 * 24 + o.m * 60 + o.s
    }

    static check(o) {
        if (isNaN(o.h) || isNaN(o.m) || isNaN(o.s))
            o.isInfinite = true
    }

    static text(o) {
        if (o.error) return ''
        DurationHMS.check(o)
        if (o.isInfinite) return ''

        var h = o.h + ''
        var m = o.m + ''
        var s = o.s + ''
        if (h.length == 1) h = '0' + h
        if (m.length == 1) m = '0' + m
        if (s.length == 1) s = '0' + s
        var z = '00'
        var str = ''
        var p = ':'
        if (h != z) str += h + p + m + p + s
        else {
            /*if (m != z) str += m + p + s
            else
                str = s*/
            str += m + p + s
        }

        return str
    }

    // convert from a number of seconds
    static fromSeconds(sec) {
        const res = new DurationHMS()
        if (isNaN(sec)) {
            res.isInfinite = true
            return res
        }
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
            res.isInfinite = true
        }
        return res
    }

    static fromInfinite() {
        const dur = new DurationHMS()
        dur.isInfinite = true
        return dur
    }

    // convert from [[hh:]mm:]ss
    static fromHMS(str) {

    }
}
