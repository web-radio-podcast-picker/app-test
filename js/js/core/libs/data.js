/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// data lib functions

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (settings.debug.debug)
            logger.log('text copied to clipboard');
    }).catch(err => {
        logger.error('failed to copy text to clipboard')
        throw new Error(err);
    })
}

async function readFromClipboard() {
    const res = await navigator.clipboard.readText()
    if (settings.debug.debug)
        logger.log('text readed from clipboard');
    return res
}

function remove(t, e) {
    const index = t.indexOf(e);
    if (index > -1)
        t.splice(index, 1)
}

function arrangeXEvalExpr(expr) {
    if (expr == null || expr === undefined) return null
    if (typeof expr != 'string')
        expr += ''
    return expr.replaceAll('.', '?.').replaceAll('??.', '?.')
}

function xevalAssign(path, value, showError) {

    const p = arrangeXEvalExpr(path)
    try {
        const pathExists = xeval(p, false) != null
        if (!pathExists)
            throw new Error('path is not valid: ' + path)
        return xeval(path, showError, value)
    }
    catch (err) {
        return handleXEvalError(p + '=' + value, err, showError)
    }
}

function xevalValue(value, showError) {
    return xeval(null, showError, value)
}

// eval expr. handle error. returns success: true and value: value if ok otherwize success: false. eventually log
function xeval(expr, showError, assignValue) {

    var p = expr
    try {
        if (assignValue !== undefined) {
            if (expr == null)
                p = assignValue
            else
                p += '=' + assignValue
        }
        else
            p = arrangeXEvalExpr(p)

        const value = eval(p)

        return { success: true, value: value, expr: p }
    } catch (err) {
        return handleXEvalError(p, err, showError)
    }
}

function handleXEvalError(expr, err, showError) {
    // ignore or debug
    if (settings.debug.debug) {
        logger.log(expr, err.message)
        ui.showError(err.message, null, null, null, err)
    }
    window.xeval_err = err
    if (settings.debug.stackTrace)
        logger.log(err)
    //logger.debug(err)
    return { success: false }
}

function deepClone(obj) {
    if (null == obj || obj == undefined || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepClone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function toUpperCaseWorldsFirstLetters(g) {
    return g.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
}

function firstCharToUpper(str) {
    if (str === undefined || str == null) return
    const c = str.charAt(0)
    return c.toUpperCase() + str.slice(1)
}

function remove(t, e) {
    const i = index(t, e)
    if (i == -1) return
    t.splice(i, 1)
}

function index(t, e) {
    for (var i = 0; i < t.length; i++)
        if (t[i] == e) return i
    return -1
}

function quote(s) {
    return '"' + s + '"'
}

function ifQuoteUnQuote(s) {
    if (!s.startsWith('"')) return s
    return unquote(s)
}

function getSortedNames(t) {
    const names = Object.keys(t)
    names.sort((a, b) => a.localeCompare(b))
    return names
}
