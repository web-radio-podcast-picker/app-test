/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// tabs

class Tabs {

    initTabs(tabs, opts) {
        const t = this
        if (opts === undefined || opts == null) opts = {}
        tabs.forEach(e => {
            const $c = $('#' + e)
            $c.on('click', () => {
                if (!$c.hasClass('selected')
                    && !$c.hasClass('menu-item-disabled')) {

                    if (opts.onChange)
                        opts.onChange($c)

                    t.selectTab($c.attr('id'), tabs)

                    if (opts.onPostChange)
                        opts.onPostChange($c)
                }
            })
        })
        return ui
    }

    setTabsFreezed(tabs, exceptTab, disabledClass, freezed) {
        tabs.forEach(tabId => {
            if (tabId != exceptTab) {
                this.setTabFreezed(tabId, disabledClass, freezed)
            }
        })
        return this
    }

    setTabFreezed(tabId, disabledClass, freezed) {
        const $c = $('#' + tabId)
        if (freezed) {
            $c.attr('data-freezed', 1)
            $c.addClass(disabledClass)
        }
        else {
            $c.attr('data-freezed', null)
            $c.removeClass(disabledClass)
        }
    }

    tabIdToPaneId(tabId) {
        if (tabId === undefined || tabId == null) return null
        return tabId.replace('btn_', 'opts_')
    }

    setTabPaneVisibility(tabId, vis) {
        const pId = this.tabIdToPaneId(tabId)
        const $p = $('#' + pId)
        if (!vis)
            $p.addClass('hidden')
        else
            $p.removeClass('hidden')
    }

    setSelectedTabPaneVisibility(vis, tabs) {
        const tabId = this.selectedTabId(tabs)
        this.setTabPaneVisibility(tabId, vis)
    }

    setTabVisiblity(tabId, isVisible) {
        if (isVisible)
            $('#' + tabId).removeClass('hidden')
        else
            $('#' + tabId).addClass('hidden')
        return this
    }

    selectedTabId(tabs) {
        var r = null
        tabs.forEach(e => {
            const $t = $('#' + e)
            const pId = this.tabIdToPaneId(e)
            const $p = $('#' + pId)
            if ($t.hasClass('selected') &&
                !$t.hasClass('disabled')) {
                r = e
            }
        })
        return r
    }

    selectTab(selectedTabId, tabs) {
        tabs.forEach(e => {
            const $t = $('#' + e)
            const pId = this.tabIdToPaneId(e)
            const $p = $('#' + pId)
            if ($t.hasClass('selected') &&
                !$t.hasClass('disabled')) {
                $t.removeClass('selected')
                $p.addClass('hidden')
            }
            if ($t.attr('id') == selectedTabId) {
                $t.addClass('selected')
                $p.removeClass('hidden')
            }
        })
        ui.inputWidgets.closeInputWidget()
    }
}