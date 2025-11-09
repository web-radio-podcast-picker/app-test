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

    static equals(x, y) {
        if (x==null || y==null) return false
        return x.h == y.h && x.m == y.m && x.s == y.s
    }

    static toSeconds(o) {
        return o.h * 60 * 24 + o.m * 60 + o.s
    }

    static isSeekable(o) {
        DurationHMS.check(o)
        return (!o.isInfinite &&
            o.h + o.m + o.s > 0
        )
    }

    static fromObject(o) {
        const d = new DurationHMS()
        d.h = o.h
        d.m = o.m
        d.s = o.s
        d.error = o.error
        d.isInfinite = o.isInfinite
        return d
    }

    static check(o) {
        if (o == null || o === undefined)
            return DurationHMS.fromInfinite()

        if (className(o) == 'Object') {
            const names = Object.getOwnPropertyNames(o)
            if (names.includes('h')
                && names.includes('m')
                && names.includes('s')) {
                // has muted to an 'Object' , mutate to a DurationHMS
                o = DurationHMS.fromObject(o)
            }
        }

        if (className(o) != 'DurationHMS') {
            if (!isNaN(o))
                // case 1 : number of seconds
                o = DurationHMS.fromSeconds(parseInt(o))
            else {
                // case 2 - a string
                if (className(o) == 'String') {
                    o = DurationHMS.fromHMS(o)
                }
                else
                    return DurationHMS.fromInfinite()
            }
        }

        if (isNaN(o.h) || isNaN(o.m) || isNaN(o.s))
            o.isInfinite = true

        return o
    }

    static text(o) {
        if (o==null || o===undefined) return null
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

    static fromZero() {
        const d = new DurationHMS()
        d.h = d.m = d.s = 0
        return d
    }

    // convert from [[hh:]mm:]ss
    static fromHMS(str) {
        var t = str.split(':')
        if (t.length > 3) return DurationHMS.fromInfinite()
        if (t.length == 0) {
            if (isNaN(str))
                return DurationHMS.fromSeconds(parseInt(str))
            else
                return DurationHMS.fromInfinite()
        }
        if (t.length == 1) t = [0, 0, t[0]]
        if (t.length == 2) t = [0, t[0], t[1]]
        if (t.length == 3) t = [t[0], t[1], t[2]]
        const d = new DurationHMS()
        d.h = t[0]
        d.m = t[1]
        d.s = t[2]
        return d
    }
}
