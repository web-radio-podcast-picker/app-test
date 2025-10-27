/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// module loader

class ModuleLoader {

    modules = []
    baseMess = 'loading module: '

    iuri(uri) {
        return uri + '-module'
    }

    isLoaded(uri) {
        return this.modules[uri] !== undefined
    }

    getHash() {
        // make cache-busting url
        const hash = Math.floor((Math.random() + 1.5) * 1024)
        return '?hash=' + hash
    }

    showError(opts, err) {
        $('#' + opts.errId).text(err)
        ui.showError(err)
        setTimeout(() => {
            $('#' + opts.errId).text('')
        }, settings.ui.introPopupDelay)
    }

    showInf(opts, inf, inf2) {
        inf2 = (inf2 === undefined || inf2 == null) ? '' : ('...' + inf2)
        const txt = inf + inf2
        $('#' + opts.infId).text(txt)
        logger.log(txt)
        setTimeout(() => {
            $('#' + opts.infId).text('')
        }, settings.ui.introPopupDelay)
    }

    // eg. ./modules/web-radio-picker
    load(uri, opts, then) {

        var srcUrl = opts?.srcUrl
        opts.uri = uri
        opts.id = uri

        if (uri == null) {
            this.showError(opts, 'load module failed: uri is not defined')
            return
        }

        if (this.isLoaded(uri)) {
            then(this.modules[uri])
            return
        }
        this.showInf(opts, this.baseMess + opts.id)

        srcUrl = (srcUrl === undefined || srcUrl == null) ?
            './js/modules/' : ''

        const baseUrl = srcUrl + uri + '/'
        const url = baseUrl + this.iuri(uri) + '.js' + this.getHash()

        var o = document.head
        var script = document.createElement('script')
        script.onload = () => {
            const cl = toClassname(uri) + 'Module'
            try {

                // instiantiate & setup module
                const o = eval('new ' + cl + '()')
                o.uri = uri
                this.setup(o, baseUrl, opts, then)

            } catch (err_inst) {
                this.showError(opts, 'error instantiate module ' + opts.id + ' (' + err_inst + ')')
            }
        }
        script.onerror = e => {
            this.showError(opts, 'load module ' + opts.id + ' failed')
            logger.log(url)
        }
        script.src = url

        o.appendChild(script)
    }

    setup(o, baseUrl, opts, then) {
        o.validate()
        if (this.modules[o.id] !== undefined)
            throw new Error('module already plugged: ' + o.id)

        const cnt = {
            viewsCnt: o.views.length,
            settingsCnt: o.settings.length,
            datasCnt: o.settings.length
        }
        this.loadSettings(o, opts, cnt, baseUrl, () =>
            this.loadDatas(o, opts, cnt, baseUrl, () =>
                this.loadViews(o, opts, cnt, baseUrl, then)
            ))
    }

    loadSettings(o, opts, cnt, baseUrl, then) {
        o.settings.forEach(st => {

            this.showInf(opts, this.baseMess + opts.id, 'settings')

            const d = document.createElement('div')
            const $d = $(d)
            const sc = baseUrl + st + this.getHash()
            $d.load(sc, (response, status, xhr) => {
                if (status === "success") {
                    try {
                        const cd = JSON.parse($d.text())
                        settings.modules[o.id] = cd
                        cnt.settingsCnt--
                        if (cnt.settingsCnt == 0) then()
                    }
                    catch (err) {
                        this.showError(opts, 'load settings "' + sc + '" failed: ' + err)
                    }
                } else {
                    this.showError(opts, 'load settings "' + sc + '" failed: ' + xhr.status + ' ' + xhr.statusText)
                }
            })
        })
    }

    loadDatas(o, opts, cnt, baseUrl, then) {
        o.datas.forEach(st => {

            this.showInf(opts, this.baseMess + opts.id, 'data')

            const d = document.createElement('div')
            const $d = $(d)
            const sc = baseUrl + st + this.getHash()
            $d.load(sc, (response, status, xhr) => {
                if (status === "success") {

                    const cd = $d.text()
                    o.setData(st, cd)
                    cnt.datasCnt--
                    if (cnt.datasCnt == 0) then()

                } else {
                    this.showError(opts, 'load view datas "' + sc + '" failed: ' + xhr.status + ' ' + xhr.statusText)
                }
            })
        })
    }

    loadViews(o, opts, cnt, baseUrl, then) {
        // load views
        o.views.forEach(t => {

            const viewId = t[0]
            const styleId = t.length > 1 ? t[1] : null
            const sc = baseUrl + viewId + this.getHash()
            const st = baseUrl + styleId + this.getHash()
            var c = opts.viewContainerId == null ?
                document.createElement('div')
                : $('#' + opts.viewContainerId)[0]
            const $c = $(c)
            var s = document.createElement('div')
            const $s = $(s)

            this.showInf(opts, this.baseMess + opts.id, 'view')

            const setupView = () => {
                const addModule = (c, viewId, o, css) => {

                    try {
                        this.showInf(opts, 'plug module: ' + opts.id)

                        this.initView(c, viewId, o, css, opts)
                        if (!opts.noPopup)
                            $('body')[0].appendChild(c)

                        this.modules[o.uri] = o

                        o.initView(viewId)

                        if (!opts.noPopup)
                            ui.popups.initPopup(
                                ui.popups.popup(o.id, null),
                                $c,
                                o.id)

                        cnt.viewsCnt--
                        if (cnt.viewsCnt == 0) {
                            then(o, viewId)
                        }
                    } catch (err) {
                        this.showError(opts, 'plug module:' + opts.id + ' failed: ' + err)
                    }
                }

                if (styleId != null && !opts.skipLoadViews)
                    $s.load(st, (response, status, xhr) => {
                        if (status === "success") {

                            const css = response
                            addModule(c, viewId, o, css)

                        } else {
                            this.showError(opts, 'load style "' + st + '" failed: ' + xhr.status + ' ' + xhr.statusText)
                        }
                    })
                else {
                    addModule(c, viewId, o, null)
                }
            }

            if (!opts.skipLoadViews)
                $c.load(sc, (response, status, xhr) => {
                    if (status === "success") {
                        setupView()
                    } else {
                        this.showError(opts, 'load view "' + sc + '" failed: ' + xhr.status + ' ' + xhr.statusText)
                    }
                })
            else
                setupView()
        })
    }

    initView(c, viewId, o, css, opts) {

        const div = (cl, txt) => tag('div', cl, txt)

        const tag = (tagname, cl, txt) => {
            const e = document.createElement(tagname)
            const $e = $(e)
            $e.addClass(cl)
            $e.text(txt)
            return e
        }

        const $c = $(c)
        $c.attr('id', o.id)
        $c.attr('data-author', o.author)
        $c.attr('data-cert', o.cert)
        if (!opts.noPopup)
            $c.addClass('popup popup-pane module-pane hidden')
        else
            $c.addClass('module-full-pane')

        if (!opts.noPopup) {
            const but_close = div('popup-close btn-red', '✕')
            const icon = div('popup-icon', o.icon || '⚙')
            const title = div('popup-title', o.title || o.id)
            const style = css != null ? tag('style', null, css) : null

            c.appendChild(but_close)
            c.appendChild(icon)
            c.appendChild(title)
            if (style != null)
                c.appendChild(style)

            if (c.childNodes.length > 0) {
                c.insertBefore(title, c.childNodes[0])
                c.insertBefore(icon, c.childNodes[0])
                c.insertBefore(but_close, c.childNodes[0])
                if (style != null)
                    c.insertBefore(style, c.childNodes[0])
            }
        }
    }

    opts(infId, errId, srcUrl) {
        return {
            infId: infId,
            errId: errId,
            srcUrl: srcUrl
        }
    }

    getModuleById(id) {
        var r = null
        Object.values(this.modules).forEach(m => {
            if (m.id == id) {
                r = m
                return
            }
        })
        return r
    }
}
