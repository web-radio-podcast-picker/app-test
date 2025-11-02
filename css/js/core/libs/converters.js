/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// converters functions

function frequency(v) {
    return toUnit(v, Units_Frequencies, null, vround3)
}

function kilo(v) {
    return toUnit(v, Units_Kilos, null, vround2)
}

function kilo3(v) {
    return toUnit(v, Units_Kilos, null, vround3)
}

function kilobyte(v) {
    return toUnit(v, Units_Bytes, 1024, vround2)
}

function volt(v) {
    return toUnit(v, Units_Volts, 1000, vround4, Units_Volts_Steps)
}

function toUnit(v, units, c, frnd, steps) {
    if (v == null || v == undefined || isNaN(v))
        return { value: Number.NaN, unit: '', text: 'NaN', text2: 'NaN' }
    if (c == null || c === undefined) c = 1000.0
    if (frnd == null || frnd === undefined) frnd = vround4

    var cc = 1.0
    var n = Math.abs(v)
    //  1 / 1 000 000 000 .. 1 000 000 000
    // nano, micro, milli, U, kilo, mega, giga
    var i = 0
    var f = 1.0 / (c * c * c)      // nano
    var r = { value: v, unit: units[3] }
    for (var i = 0; i < units.length && i < 7; i++) {
        if (steps !== undefined) {
            const t = f = steps[i]
            if (t.__proto__.constructor.name == 'Array') {
                f = t[0]
                cc = t[1]
            }
            else
                cc = 1.0
        }
        const matchF = (f < 1 && n < f) || (f >= 1 && n >= f)
        if (matchF && units[i] != null) {
            r = {
                value: v / f * cc,
                unit: units[i],
                c: c,
                cc: cc,
                f: f,
                i: i,
                v: v,
                u: units
            }
            if (f < 1)
                break
        }
        if (steps === undefined) {
            f *= c
        }
    }
    r.value = frnd(r.value)
    r.text = r.value + r.unit
    r.text2 = r.value + ' ' + r.unit
    return r
}

function parseRgba(s) {
    var t = s
        .replace('rgba(', '')
        .replace(')', '')
        .replace(' ', '')
        .split(',')
    return {
        r: Number(t[0]),
        g: Number(t[1]),
        b: Number(t[2]),
        a: Number(t[3])
    }
}

function addLight(c, d) {
    c += d
    if (c < 0) c = 0
    if (c > 255) c = 255
    return c
}

function toRgba(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
}

function setRgbaOpacity(s, opacity) {
    const t = parseRgba(s)
    return toRgba(t.r, t.g, t.b, opacity)
}

function vround7(v) {
    return parseFloat(v.toFixed(7));
}

function vround(v) {
    return parseFloat(v.toFixed(5));
}

function vround4(v) {
    return parseFloat(v.toFixed(4));
}

function vround2(v) {
    return parseFloat(v.toFixed(2));
}

function vround3(v) {
    return parseFloat(v.toFixed(3));
}

function tround(t) {
    return !Number.isFinite(t) ? null : parseFloat(t.toFixed(3));
}

function pround(t) {
    return !Number.isFinite(t) ? null : parseFloat(t.toFixed(2));
}

function fround(t) {
    return !Number.isFinite(t) ? null : parseFloat(t.toFixed(1))
}

function milli(n) {
    return n * 1000;
}

// @TODO: NOT USED 
// -1..1 -> 0..256
function float32ToByteRange(channel, f) {
    const v = valueToVolt(channel, f);
    return v * 128 / settings.audioInput.vScale + 128;
}

// normalize to -1 ... 1 ? (input calibration. 255 <=> x Volts)
function float32ToVolt(f) {
    //return f; // -1 .. 1 ?
    return f / 1.5;     // -1.5 .. 1.5 ?
}
function voltToText(v) {
    if (v == null || v == undefined || isNaN(v)) return Number.NaN
    if (v == Number.MAX_VALUE || v == Number.MIN_VALUE)
        return '?'

    const z = vround(v)
    return z
}

function valueToVolt(channel, value) {
    switch (channel.sourceId) {
        case Source_Id_AudioInput:
            return float32ToVolt(value) * settings.audioInput.vScale;
        default:
            // currently Media source
            return value
    }
}

function toCamelCase(str) {
    return str
        .replace(/[-_]+/g, ' ') // Replace dashes/underscores with spaces
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, ''); // Remove spaces
}

function toClassname(str) {
    if (str == null || str === undefined) return
    var s = toCamelCase(str)
    if (s.length > 0)
        s = s[0].toUpperCase() + s.slice(1)
    return s
}

function unquote(s) {
    return s.slice(1, -1)
}

function toUpperCaseWorldsFirstLetters(g) {
    return g.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
}

function toHex0(str) {
    var hex = ''
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i)
        hex += charCode.toString(16).padStart(2, '0') // Ensures two-digit representation
    }
    return hex
}

const toHex = str => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
    if (hex.length % 2 !== 0) {
        throw new Error("Chaîne hex invalide (longueur impaire)");
    }

    const bytes = new Uint8Array(
        hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}
