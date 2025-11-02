/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// toggles

class Toggles {

    toggles = []

    setToggle(controlId, state) {
        const $c = $('#' + controlId)
        const path = $c.attr('tag')
        const hasPath = path !== undefined && path != null
        const inverted = $c.attr('data-inverted') == 'true'
        const vstate = inverted ? !state : state

        if (vstate) {
            $c.addClass('on')
            $c.removeClass('off')
        }
        else {
            $c.addClass('off')
            $c.removeClass('on')
        }

        $c.text(vstate ? 'ON' : 'OFF')

        if (hasPath) {
            xevalAssign(path, state)
            return this
        }
    }

    updateToggle(controlId, forceVal) {
        const $c = $('#' + controlId)
        const path = $c.attr('tag')
        const hasPath = path !== undefined && path != null
        if (hasPath) {
            // eval context is ui
            try {
                var val =
                    (forceVal !== undefined && forceVal != null) ?
                        forceVal : xeval(path)
                if (typeof val == 'object') {
                    if (val.success)
                        this.setToggle(controlId, val.value)
                }
                else
                    this.setToggle(controlId, val)
            } catch (err) {
                // ignore or debug
                if (settings.debug.debug)
                    logger.log(err)
            }
        }
    }

    updateToggles() {
        const t = this
        this.toggles.forEach(cid => {
            const $c = $('#' + cid)
            t.updateToggle(cid)
        })
    }

    initToggle(controlId, onChange, path, inverted) {
        const $c = $('#' + controlId)
        const hasPath = path !== undefined && path != null
        if (hasPath)
            $c.attr('tag', path)
        if (inverted === undefined || inverted == null)
            inverted = false
        $c.attr('data-inverted', inverted ? 'true' : 'false')

        $c.on('click', () => {
            this.setToggle(controlId,
                $c.hasClass(
                    inverted ? 'on' : 'off'))
            if (onChange != undefined && onChange != null) onChange($c)
        })
        this.toggles.push(controlId)
        this.updateToggle(controlId)
        return ui
    }
}