/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class RdMediaImage {

    opts(
        imgId,
        paneId,
        noImgSrc,
        tabId,
        onImageUpdatedFunc,
        noImageClass,
        noImageContainer,
        noImageSelfClass
    ) {
        o = {}
        o.imgId = imgId
        o.paneId = paneId
        o.noImgSrc = noImgSrc
        o.tabId = tabId
        o.onImageUpdatedFunc = onImageUpdatedFunc
        o.noImageClass = noImageClass
        o.noImageContainer = noImageContainer
        o.noImageSelfClass = noImageSelfClass
        return o
    }

    constructor(opts) {
        this.imgId = opts.imgId || null
        this.paneId = opts.paneId || null
        this.noImgSrc = opts.noImgSrc || null
        this.tabId = opts.tabId || null
        this.onImageUpdatedFunc = opts.onImageUpdatedFunc || null
        this.noImageClass = opts.noImageClass || null
        this.noImageContainer = opts.noImageContainer || null
        this.noImageSelfClass = opts.noImageSelfClass || null

        ui.onResize.push(() => {
            this.showImage()
        })
    }

    noImage() {
        if (settings.debug.debug)
            console.warn('no image src')
        const $i = $('#' + this.imgId)
        $i.attr('data-noimg', '1')
        $i.attr('width', null)
        $i.attr('height', null)
        $i.attr('data-w', null)
        $i.attr('data-h', null)
        $i[0].src = this.noImgSrc
    }

    resetImage() {
        if (settings.debug.debug)
            console.warn('reset image src')
        const $i = $('#' + this.imgId)
        //$i.attr('data-noimg', null)
        $i.attr('width', null)
        $i.attr('height', null)
        $i.attr('data-w', null)
        $i.attr('data-h', null)
        ////$i.addClass('ptransparent')
    }

    changeImage(url) {

    }

    showImage() {
        const $i = $('#' + this.imgId)
        var noimg = $i[0].src?.includes(this.noImgSrc?.replace('./', ''))

        if (noimg && this.noImageSelfClass)
            $i.addClass(this.noImageSelfClass)

        if (noimg) {
            // no image
            if (this.noImageClass)
                $('#' + this.noImageContainer).addClass(this.noImageClass)
            if (settings.debug.debug)
                console.warn('no image: ' + $i[0].src)
        } else {
            // image
            if (this.noImageClass)
                $('#' + this.noImageContainer).removeClass(this.noImageClass)
            if (this.noImageSelfClass)
                $i.removeClass(this.noImageSelfClass)
            if (settings.debug.debug)
                console.warn('image ok ' + $i[0].src)
        }

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

        const $c = $('#' + this.paneId)
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

        $i.removeClass('ptransparent')

        //this.ignoreNextShowImage = false

        /*if (!wrpp.resizeEventInitialized) {
            ui.onResize.push(() => {
                this.showImage()
            })
            wrpp.resizeEventInitialized = true
        }*/

        if (this.tabId) {
            if ((!tabsController.preserveCurrentTab
                && !uiState.favoriteInputState)
            ) {
                /*tabsController
                    .selectTab(this.tabId)
                    .onTabChanged($('#' + this.tabId))
                tabsController
                    .onTabChanged($('#' + this.tabId))*/
            }
            else
                tabsController.preserveCurrentTab = false
        }

        if (this.onImageUpdatedFunc)
            this.onImageUpdatedFunc()
    }
}