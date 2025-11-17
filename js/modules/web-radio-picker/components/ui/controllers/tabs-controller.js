/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class TabsController {

    premanentTabs = [
        'btn_wrp_play_list'
    ]

    tabs = ['btn_wrp_tag_list',
        'btn_wrp_lang_list',
        'btn_wrp_art_list',
        'btn_wrp_play_list',
        'btn_wrp_podcast',
        'btn_wrp_logo']

    pdcTabs = [
        'btn_wrp_podcast_lang',
        'btn_wrp_podcast_tag',
        'btn_wrp_podcast_alpha',
        'btn_wrp_podcast_pdc',
        'btn_wrp_podcast_epi'
    ]

    infTabs = ['btn_wrp_inf', 'btn_wrp_set', 'btn_log_pane']

    // ask to not change current tab automatically (eg. case restore ui state)
    preserveCurrentTab = false

    tabBeforeOpenPdc = null
    pdcTabSelected = false

    initTabs() {
        ui.tabs.initTabs(this.tabs, {
            onChange: $c => {
                this.onTabChange($c)
            },
            onPostChange: ($c) => {
                this.onTabChanged($c)
            }
        })

        ui.tabs.initTabs(this.pdcTabs, {
            onPostChange: $c => {
                const tabId = $c.attr('id')
                const listId = podcasts.getListIdByTabId(tabId)

                // flip back from epi list visible and viz tab opened
                if (this.openingVizWithEpiListVisible) {
                    $('#opts_wrp_logo').addClass('hidden')
                    $('#cnv_oscillo').addClass('hidden')
                    $('#btn_wrp_logo').removeClass('selected')
                    ui.vizTabActivated = false
                    this.openingVizWithEpiListVisible = false
                }

                if (podcasts.shouldRestoreEpiVisibleState) {
                    podcasts.forceHideEpiMediaView = true
                }

                podcasts.selectTab(
                    podcasts.selection,
                    listId
                )

                viewManager.onPodcastTabChanged.fire(uiState.currentTab, listId)
            }
        })

        ui.tabs.initTabs(this.infTabs, {

            onPostChange: ($c) => {
                //podcasts.setEpiListVisible(false)
                this.onInfTabChanged($c)
            }
        })

        viewManager.onStationTabChanged
            .add((tab, listId) =>
                this.onStationPodcastTabChanged(tab, listId))
        viewManager.onPodcastTabChanged
            .add((tab, listId) =>
                this.onStationPodcastTabChanged(tab, listId))
    }

    getListIconStation() {
        return '<img name="sta" src="./img/icons8-notes-de-musique-50.png" class="wrp-item-sta-list-title-icon">'
    }

    getListIconPodcast() {
        return '<img name="pod" src="./img/icons8-podcast-50.png" class="wrp-item-pod-list-title-icon">'
    }

    getListIconFav() {
        return '<img name="fav" src="./img/icons8-heart-outline-48.png" class="wrp-item-fav-list-title-icon">'
    }

    onStationPodcastTabChanged(tab, listId) {
        if (tab == null || tab === undefined) return
        const lid = tab.listId
        var name = null
        var icon = ''
        $('#wrp_list_path').html('')

        if (this.stationsListsIds.includes(lid)) {
            name = 'Stations'
            icon = this.getListIconStation()
        }

        if (lid == RadioList_Podcast) {
            name = 'Podcasts'
            icon = this.getListIconPodcast()
            this.setupListTitlePdcPath(tab, listId)
        }

        if (lid == RadioList_List) {
            name = 'Favoris'
            icon = this.getListIconFav()
        }

        if (name != null)
            $('#wrp_list_title').html(name)
        if (icon != null)
            $('#wrp_list_icon').html(icon)

        setVisible($('#wrp_list_title_container'), !viewManager.epiListMediaVisible)
        classIf($('#opts_wrp_podcast'), 'below-list-title', !viewManager.epiListMediaVisible)
    }

    setupListTitlePdcPath(tab, listId) {
        const sel = podcasts.selection
        var txt = ''
        const sep = ' > '
        const sep2 = '> '
        const t = []
        if (sel.lang?.item) {
            t.push(sel.lang.item.name)
        }
        if (sel.tag?.item) {
            t.push(firstCharToUpper(sel.tag.item.name))
        }
        if (sel.letter?.item) {
            t.push(sel.letter.item.name)
        }
        /*if (sel.pdc?.item) {
            t.push(sel.pdc.item.name)
        }*/
        if (t.length > 0) {
            txt = t.join(sep)
            if (txt.length > 0)
                txt = sep2 + txt
        }
        $('#wrp_list_path').html(txt)
    }

    stationsListsIds = [
        RadioList_Tag,
        RadioList_Lang,
        RadioList_Art,
        //RadioList_List,
        //RadioList_Viz
    ]

    tabControlToPaneId($tab) {
        return $tab.attr('id').replace('btn_', 'opts_')
    }

    onInfTabChanged($tab) {
        if (settings.features.swype.enableArrowsButtonsOverScrollPanes)
            ui.scrollers.update(
                this.tabControlToPaneId($tab))
    }

    // #region ----- lists tabs -----

    onTabChange($tab) {
        const tabId = ui.tabs.selectedTabId(this.tabs)
        const newTabId = $tab.attr('id')

        if (tabId != null && tabId != 'btn_wrp_podcast')
            this.tabBeforeOpenPdc = tabId

        if (podcasts.isEpiListVisible() && newTabId != 'btn_wrp_logo'
            && newTabId != 'btn_wrp_podcast')
            podcasts.setEpiListVisible(false)

        if (newTabId == 'btn_wrp_podcast')
            podcasts.podcastsLists.isOpenPdcFromTabSelect = true
    }

    onTabChanged($tab) {
        const c = $tab[0]
        var cid = c.id
        const $cnv = $(app.canvas)

        // #region close or activate podcast menu

        this.openingVizWithEpiListVisible = false

        // hide pdc channel preview in case of
        if (podcasts.isPdcPreviewVisible() /*&& cid != 'btn_wrp_logo'*/) {
            podcasts.setPdcPreviewVisible(false)
            podcasts.podcastsLists.resetPdcItemsClickState()
        }
        if (podcasts.isEpiListVisible()) {
            if (cid != 'btn_wrp_logo') {
                podcasts.setEpiListVisible(false)
            }
            else
                this.openingVizWithEpiListVisible = true
        }

        if (cid == 'btn_wrp_podcast') {
            // reclick on 'podcast' -> close podcast menu
            if (this.pdcTabSelected) {
                this.pdcTabSelected = false
                // go back to tabBeforeOpenPdc
                ui.tabs.selectTab(this.tabBeforeOpenPdc, this.tabs)
                cid = this.tabBeforeOpenPdc
                uiState.updateCurrentTab(cid, true)
                // restore viz
                if (this.tabBeforeOpenPdc == 'btn_wrp_logo')
                    ui.vizTabActivated = true
            }
            else {
                this.pdcTabSelected = true
            }
        } else
            this.pdcTabSelected = this.openingVizWithEpiListVisible

        if (this.pdcTabSelected)
            this.showPDCTabs()
        else {
            if (cid != 'btn_wrp_podcast')
                this.tabBeforeOpenPdc = cid
            this.showNonPDCListsTabs(cid)
        }

        // #endregion

        if (cid == 'btn_wrp_logo') {
            $cnv.removeClass('hidden')
            ui.vizTabActivated = true
        }
        else {
            $cnv.addClass('hidden')
            ui.vizTabActivated = false
        }

        //uiState.updateCurrentTab(c.id)

        return this
    }

    focusTabSelectedItem($tab) {
        const $pane = $('#' + this.tabControlToPaneId($tab))
        const $selected = $pane.find('.item-selected')
        if ($selected.length > 0)
            wrpp.focusListItem($selected[0], false)
        return this
    }

    selectTab(tabId) {
        this.pdcTabSelected = tabId == 'btn_wrp_podcast'
        if (!this.pdcTabSelected)
            this.showNonPDCListsTabs()

        ui.tabs.selectTab(tabId, this.tabs)
        return this
    }

    showNonPDCListsTabs(cid) {
        this.tabs.forEach(tabId => {
            if (!this.premanentTabs.includes(tabId))
                $('#' + tabId).removeClass('hidden')
        })
        this.pdcTabs.forEach(tabId => {
            $('#' + tabId).addClass('hidden')
        })
        $('#btn_wrp_podcast').removeClass('selected')
        $('#opts_wrp_podcast').addClass('hidden')       // fix for tag path button not hidding pdc pane

        $('#btn_wrp_podcast').html(StationSwitchButtonLabel)
            .attr('data-id', StationSwitchButtonId)

        uiState.updateCurrentTab(cid)
        //settings.dataStore.saveUIState()
    }

    showPDCTabs() {
        this.tabs.forEach(tabId => {
            if (!this.premanentTabs.includes(tabId))
                $('#' + tabId).addClass('hidden')
        })
        this.pdcTabs.forEach(tabId => {
            $('#' + tabId).addClass('hidden')
        })
        $('#btn_wrp_podcast_lang').removeClass('hidden')
        $('#btn_wrp_podcast')
            .removeClass('hidden')
            .removeClass('selected')
        $('#btn_wrp_logo').removeClass('hidden')

        $('#btn_wrp_podcast').html(PodcastSwitchButtonLabel)
            .attr('data-id', PodcastSwitchButtonId)

        uiState.updateCurrentTab('btn_wrp_podcast')
        podcasts.openPodcasts()
    }

    showPlayingRdItemViz() {
        $('#btn_wrp_logo').click()
    }

    // #endregion
}