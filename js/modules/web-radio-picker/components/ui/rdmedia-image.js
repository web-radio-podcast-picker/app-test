/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class RdMediaImage {

    noImage() {
        const $i = $('#wrp_img')
        $i[0].src = './img/icon.ico'
        $i.attr('data-noimg', '1')
        $i.attr('width', null)
        $i.attr('height', null)
        $i.attr('data-w', null)
        $i.attr('data-h', null)
    }

    showImage() {
        const $i = $('#wrp_img')
        const noimg = $i.attr('data-noimg') != null
        if (noimg)
            $i.addClass('wrp-img-half')

        $i.removeClass('ptransparent')
        $i.removeClass('hidden')

        var iw = $i[0].width
        var ih = $i[0].height
        const dw = $i.attr('data-w')
        const dh = $i.attr('data-h')
        if (dw != null && dh != null) {
            // case: resize
            iw = dw
            ih = dh
        } else {
            $i.attr('data-w', iw)
            $i.attr('data-h', ih)
        }
        var r = iw / ih

        const $c = $('#left-pane')
        const cw = $c.width()
        const ch = $c.height()
        var rw = iw / cw
        var rh = ih / ch

        // auto zoom
        if (!noimg) {
            iw *= 2
            ih *= 2
        }

        // limit bounds
        if (iw >= ih) {
            // square or landscape
            if (iw > cw) {
                iw = cw
                ih = iw / r
            }
            if (ih > ch) {
                ih = ch
                iw = r * ih
            }
        } else {
            // portrait
            if (ih > ch) {
                ih = ch
                iw = r * ih
            }
            if (iw > cw) {
                iw = cw
                ih = iw / r
            }
        }
        $i.attr('width', iw + 'px')
        $i.attr('height', ih + 'px')

        //this.ignoreNextShowImage = false

        if (!wrpp.resizeEventInitialized) {
            ui.onResize.push(() => {
                this.showImage()
            })
            wrpp.resizeEventInitialized = true
        }

        if (!tabsController.preserveCurrentTab
            && !uiState.favoriteInputState
        ) {
            tabsController
                .selectTab('btn_wrp_logo')
                .onTabChanged($('#btn_wrp_logo'))
        }
        else
            tabsController.preserveCurrentTab = false
    }
}