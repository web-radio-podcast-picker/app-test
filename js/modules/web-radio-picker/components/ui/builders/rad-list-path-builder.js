/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class RadListPathBuilder {

    listIdToLabel(listId) {
        var id = listId
        // match consts to ui texts
        switch (listId) {
            case RadioList_List:
                id = 'Favs'
                break
            case RadioList_Tag:
                id = 'Tags'
                break
            case RadioList_Lang:
                id = 'Langs'
                break
            case RadioList_Art:
                id = 'Artists'
                break
            case RadioList_All:
                id = 'All'
                break
            default: break
        }
        return id
    }

    buildRadioViewTagPath(item) {
        const $p = $('#wrp_radio_box')
        $p[0].innerHTML = ''
        $p.append(this.buildHistorybutton())
        if (item == null) return

        if (!item.groups) {
            // fix missing item groups for pdc/epi items
            item.groups = []
        }

        // fav button
        const favs = favorites.getItemFavoritesFiltered(item)
        if (favs.length > 0) {
            const fav = favs[0]
            const $favBut = this.buildFavButton(fav)
            $p.append($favBut)
        }

        this.#addListsIcon($p)

        if (item.epi) {
            this.#buildEpiViewTagPath(item, $p)
            return
        }

        // tag path / lang path / artists path

        var i = 0
        item.groups.forEach(grp => {
            const $but = this.buildTagPathButton(item, grp, i > 0)
            $p.append($but)
            i++
        });
        // artist == listName, if any
        if (item.artist == null || item.artist === undefined) return;
        $p.append(this.buildRightChevron())
        $p.append(this.buildArtistButton(item.artist, false))
    }

    #buildEpiViewTagPath(item, $p) {
        /*if (settings.debug.debug)
            console.log(item.sel)*/
        const pdc = item.sel.pdc?.item?.name

        const selclone = cloneSelection(item.sel)
        //this.#addLangLetterTagEpiPathButtons(item.sel, selclone, $p, true)
        if (pdc) this.#addPdcEpiPathButton(pdc, $p, selclone, true)
        const $ctxt = this.buildRightChevron().addClass('right-chevron-small')

        const $epiBut = this.buildPdcPathButton(Pdc_List_Epi, item.name, $ctxt[0].outerHTML, true, false)
        $p.append($epiBut)

        $epiBut.on('click', e => {

            const $tabChannel = $('#btn_wrp_podcast_pdc')

            const selclone = cloneSelection(uiState.currentRDItem?.sel)

            selclone.epi = { item: item }
            selclone.epiOpen = true
            selclone.epiOpening = false

            if (!$tabChannel.hasClass('selected'))
                $tabChannel.click()

            podcasts.changePodcasts(selclone, {
                onCompleted: () => {
                    //$('#wrp_pdc_prv_em_button').click()     // too early
                    //podcasts.setEpiListVisible(true)
                }
            })
        })
    }

    #addListsIcon($p) {
        const w = 24
        const $img = $(`<img name="fav_but" class="small-tag-icon" src="./img/icons8-tag-50.png" width="${w}" height="${w}" alt="fav_but">`)
        $p.append($img)
    }

    buildHistorybutton() {
        const w = 24
        const $img = $(`<img name="histo_but" class="hover-icon small-tag-icon fav-path-button margin-right" src="./img/icons8-list-50.png" width="${w}" height="${w}" alt="histo_but">`)
        $img.on('click', e => {
            infosPane.hideInfoPane()
            this.favButtonOnClick(e, RadioList_List, RadioList_History, true, null)
        })
        return $img
    }

    goPdcPath(sel, tabId, listId) {

        const restoreSelection = (listId, sel) => {
            if (listId != null && listId !== undefined) {
                if (settings.debug.debug)
                    console.log('## restore selection')
                podcasts.podcastsLists.restoreSelection(listId, sel)
            }
        }

        podcasts.changePodcasts(
            sel,
            {
                onCompleted: () => {
                    if (settings.debug.debug)
                        console.log('[##] on completed')

                    podcasts.openOpts = {
                        onCompleted: () => {
                            console.error('[##] RE ON COMPLETED')
                            restoreSelection(listId, sel)
                        }
                    }

                    $('#' + tabId).click()
                    restoreSelection(listId, sel)
                }
            }
        )
    }

    buildPdcTopPath(item, $item) {
        const $p = $('#wrp_pdc_list_ref')
        $p[0].innerHTML = ''
        const $p2 = $('#wrp_pdc_list_ref_name')
        $p2[0].innerHTML = ''

        const sel = podcasts.selection
        const selclone = cloneSelection(sel)

        this.#addLangLetterTagEpiPathButtons(sel, selclone, $p2, false)

        this.#addBottomRightChevron($p2)

        this.#addPdcEpiPathButton(item.name, $p2, selclone)
    }

    #addBottomRightChevron($p) {
        $p.append(this.buildRightChevron().addClass('right-chevron-extended'))
    }

    #addPdcEpiPathButton(name, $p2, selclone, useCurrentItem) {
        const $nameBut = this.buildPdcPathButton(Pdc_List_Pdc, name, name, true, true)
        $p2.append($nameBut)
        $nameBut.on('click', e => {
            const sc = !useCurrentItem ? selclone
                : cloneSelection(uiState.currentRDItem?.sel)
            sc.epiOpen = false
            podcasts.changePodcasts(
                sc
            )
        })
    }

    #addLangLetterTagEpiPathButtons(sel, selclone, $p2, rightMargin) {
        const $langBut = this.buildPdcPathButton(Pdc_List_Lang, sel.lang.item.name, sel.lang.item.name, true, true)
        $p2.append($langBut)
        $langBut.on('click', e => {
            $('#btn_wrp_podcast_lang').click()
        })

        if (sel.tag) {
            const $tagBut = this.buildPdcPathButton(Pdc_List_Tag, sel.tag.item.name, firstCharToUpper(sel.tag.item.name), true, sel.letter || rightMargin)
            $p2.append($tagBut)

            $tagBut.on('click', e => {
                this.goPdcPath(selclone, 'btn_wrp_podcast_tag', Pdc_List_Tag)
            })
        }
        if (sel.letter) {
            const $letterBut = this.buildPdcPathButton(Pdc_List_Letter, sel.letter.item.name, sel.letter.item.name, true, rightMargin)
            $p2.append($letterBut)

            $letterBut.on('click', e => {
                this.goPdcPath(selclone, 'btn_wrp_podcast_alpha', Pdc_List_Letter)
            })
        }
    }

    buildTopFavPath(listId, listName) {
        const id = this.listIdToLabel(listId)
        const $p = $('#wrp_rad_list_ref')
        $p[0].innerHTML = ''
        const $p2 = $('#wrp_rad_list_ref_name')
        $p2[0].innerHTML = ''
        if (listId == RadioList_All) return
        if (listId != null) {
            const $listIdBut = this.buildFavPathButton(listId, listId, id, true, false)
            $p.append($listIdBut)
        }
        $p.append(this.buildRightChevron().addClass('right-chevron-extended'))
        if (listName != null) {
            const $listNameBut = this.buildFavPathButton(listId, listName, listName, false, false, null, null, true)
            $p2.append($listNameBut)
        }
    }

    buildRightChevron() {
        const $img = $('<img alt="chevron" src="./img/icons8-right-arrow-24.png" class="right-chevron">')
        return $img
    }

    buildTagPathButton(item, grp, hasLeftMargin) {
        const rm = hasLeftMargin ? ' hmargin-left' : ''
        const $but = $(`<span data-id="${grp}" class="fav-path-button menu-item menu-item-blue onoff-small-height2 no-width ${rm}">${grp}</span>`)
        $but.on('click', e => {
            if ($(e.currentTarget).hasClass('but-icon-disabled')) return
            infosPane.hideInfoPane()

            if (grp == Group_Name_Artists
                && item.artist != null) {
                // artists list
                this.selectArtistPath(item, item.artist)
            } else {
                if (wrpp.isGroupALang(item.lang) && item.lang == grp)
                    // langs
                    this.selectLangPath(grp)
                else
                    // tags
                    this.selectTagPath(grp)
            }
        })
        return $but
    }

    buildArtistButton(artist, hasLeftMargin) {
        const rm = hasLeftMargin ? ' hmargin-left' : ''
        const $but = $(`<span data-id="${artist}" class="fav-path-button menu-item onoff-small-height2 no-width selected ${rm}">${artist}</span>`)
        return $but
    }

    buildFavButton(fav) {
        const w = 24
        const $img = $(`<img name="fav_but" class="small-fav-icon" src="./img/icons8-heart-outline-48.png" width="${w}" height="${w}" alt="fav_but">`)
        const $but = this.buildFavPathButton(
            RadioList_List,
            fav,
            fav,
            true,
            true,
            'onoff-small-height2',
            () => {
                this.selectFavList(fav)
            }
        )
        const $div = $('<span class="wrp_radio_box_fav_button"></span>')
        $div.append($img)
        $div.append($but)
        return $div
    }

    selectTagPath(grp) {
        uiState.setTab(RadioList_Tag)   // /!\ this doesn't set currentRDList
        const cLst = uiState.currentRDList
        if (cLst == null
            || (cLst.listId != RadioList_Tag || cLst.name != grp)) {
            const listItem = wrpp.getTagsListsItemByName(grp)
            if (listItem != null) {
                const $item = $(listItem.item)
                listsBuilder.clickListItem($item)
                wrpp.focusListItem(listItem.item)
            }
        }
    }

    selectLangPath(grp) {
        uiState.setTab(RadioList_Lang)   // /!\ this doesn't set currentRDList
        const cLst = uiState.currentRDList
        if (cLst == null
            || (cLst.listId != RadioList_Lang || cLst.name != grp)) {
            const listItem = wrpp.getLangsListsItemByName(grp)
            if (listItem != null) {
                const $item = $(listItem.item)
                listsBuilder.clickListItem($item)
                wrpp.focusListItem(listItem.item)
            }
        }
    }

    selectArtistPath(item, grp) {
        uiState.setTab(RadioList_Art)   // /!\ do not set currentRDList
        const cLst = uiState.currentRDList
        if (cLst == null
            || (cLst.listId != RadioList_Art || cLst.name != grp)) {
            const listItem = wrpp.getArtistsListsItemByName(grp)
            if (listItem != null) {
                const $item = $(listItem.item)
                listsBuilder.clickListItem($item)
                wrpp.focusListItem(listItem.item)
            }
        }
    }

    buildFavPathButton(listId, id, text, isTab, hasRightMargin, cl, onClick, noClick) {
        cl = (cl == null || cl === undefined) ? 'onoff-small-height' : cl
        const rm = hasRightMargin ? ' margin-right' : ''
        const selected = !isTab ? 'selected' : ''
        const butcl = noClick == true ? '' : 'menu-item-blue'
        const $but = $(`<span data-id="${id}" class="${butcl} fav-path-button menu-item ${cl} no-width ${rm} ${selected}">${text}</span>`)
        if (noClick != true)
            $but.on('click', e => {
                /*if ($(e.currentTarget).hasClass('but-icon-disabled')) return
                this.selectFavPath(listId, id, isTab)
                if (onClick !== undefined && onClick != null)
                    onClick()*/
                this.favButtonOnClick(e, listId, id, isTab, onClick)
            })
        return $but
    }

    buildPdcPathButton(listId, id, text, isTab, hasRightMargin, cl, onClick, noClick) {
        cl = (cl == null || cl === undefined) ? 'onoff-small-height' : cl
        const rm = hasRightMargin ? ' margin-right' : ''
        const selected = !isTab ? 'selected' : ''
        const butcl = noClick == true ? '' : 'menu-item-blue'
        const $but = $(`<span data-id="${id}" class="${butcl} fav-path-button menu-item ${cl} no-width ${rm} ${selected}">${text}</span>`)
        if (noClick != true && onClick !== undefined && onClick != null)
            $but.on('click', e => {
                this.pdcButtonOnClick(e, listId, id, isTab, onClick)
            })
        return $but
    }

    favButtonOnClick(e, listId, id, isTab, onClick) {
        if ($(e.currentTarget).hasClass('but-icon-disabled')) return
        this.selectFavPath(listId, id, isTab)
        if (onClick !== undefined && onClick != null)
            onClick()
    }

    pdcButtonOnClick(e, listId, id, isTab, onClick) {
        if ($(e.currentTarget).hasClass('but-icon-disabled')) return
        ////this.selectFavPath(listId, id, isTab)
        if (onClick !== undefined && onClick != null)
            onClick()
    }

    selectFavPath(listId, listName, isTab) {
        if (isTab) {
            uiState.setTab(listId)
            const cLst = uiState.currentRDList
            if (cLst == null
                || (cLst.listId != listId || cLst.name != listName)) {
                const listItem = wrpp.getPlaysListsItemByName(listName)
                if (listItem != null) {
                    const $item = $(listItem.item)
                    listsBuilder.clickListItem($item)
                    wrpp.focusListItem(listItem.item)
                }
            }
        }
    }

    selectFavList(listName) {

    }
}