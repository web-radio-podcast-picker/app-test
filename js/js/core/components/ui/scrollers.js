/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// scrollers

class Scrollers {

    scrollers = []

    update(scrollPaneId) {
        var sp = null
        this.scrollers.forEach(scroller => {
            if (scroller.scrollPaneIds.includes(scrollPaneId))
                sp = scroller
        })
        if (sp == null) return
        this.setUpArrowsVis(sp)
    }

    new(scroller) {
        this.scrollers.push(scroller)
        const $scrollPanes =
            scroller.scrollPaneIds.map(id => $('#' + id))

        const $activeScrollPane = /*() => $scrollPanes.reduce((acc, $sp) =>
            $sp.parent().hasClass('hidden') ?
                (acc == null ? $sp : acc)
                : $sp)*/
            () => {
                var res = null
                $scrollPanes.forEach(($sp, i) => {
                    if (res == null
                        && !$sp.parent().hasClass('hidden')
                        && !$sp.hasClass('hidden'))
                        res = $sp
                })
                return res
            }

        const $btup = $('#' + scroller.upButtonId)
        const $btdo = $('#' + scroller.downButtonId)
        scroller.$scrollPanes = $scrollPanes
        scroller.$activeScrollPane = $activeScrollPane
        scroller.$btup = $btup
        scroller.$btdo = $btdo
        this.setUpArrowsVis(scroller)

        const click = (e, isUp) => this.clickUpDown(scroller, $(e.target), isUp)
        $btup.on('mousedown', e => click(e, true))
        $btdo.on('mousedown', e => click(e, false))
        const unclick = e => this.unclick(scroller, $(e.target))
        $btup.on('mouseup', e => unclick(e))
        $btdo.on('mouseup', e => unclick(e))

        $scrollPanes.forEach($sp =>
            $sp.on('scroll', e => this.scrollEvent(scroller, e)))

        return this
    }

    scrollEvent(scroller, e) {
        this.setUpArrowsVis(scroller)
    }

    setUpArrowsVis(scroller) {
        const $p = scroller.$activeScrollPane()
        const $btup = scroller.$btup
        const $btdo = scroller.$btdo
        var y = $p.scrollTop()
        if (y == 0) {
            if ($btup.hasClass('selected'))
                this.scrollEnd(scroller, $btup)
            $btup.addClass('hidden')
        }
        else
            $btup.removeClass('hidden')
        const container = $p[0]
        const bottom = container.scrollHeight - container.scrollTop === container.clientHeight
        if (bottom) {
            if ($btdo.hasClass('selected'))
                this.scrollEnd(scroller, $btdo)
            $btdo.addClass('hidden')
        }
        else {
            $btdo.removeClass('hidden')
        }
    }

    clickUpDown(scroller, $but, isUp) {
        clearTimeout(scroller.pressedTimer)

        $but.addClass('selected')
        const $sp = scroller.$activeScrollPane()
        var y = $sp.scrollTop()
        //var maxy = $sp[0].scrollHeight - $sp[0].clientHeight
        var $items = $sp.find('div')
        if ($items.length == 0) return

        var it0 = $($items[0])
        var dy = it0.height()
        if (isUp) dy *= -1
        y += dy * scroller.speed
        scroller.speed *= scroller.acceleration

        $sp.scrollTop(y)

        scroller.pressedTimer = setTimeout(
            () => this.clickUpDown(scroller, $but, isUp),
            scroller.repeatDelay
        )
    }

    scrollEnd(scroller, $but) {
        $but.removeClass('selected')
        clearTimeout(scroller.pressedTimer)
        scroller.speed = 1
    }

    unclick(scroller, $but) {
        this.scrollEnd(scroller, $but)
        this.setUpArrowsVis(scroller)
    }

    scroller(scrollPaneIds, upButtonId, downButtonId) {
        return {
            scrollPaneIds: scrollPaneIds,
            upButtonId: upButtonId,
            downButtonId: downButtonId,
            $scrollPanes: null,
            $activeScrollPane: null,
            $btup: null,
            $btdo: null,
            pressedTimer: null,
            speed: 1,
            acceleration: 1.14,
            repeatDelay: 50
        }
    }
}