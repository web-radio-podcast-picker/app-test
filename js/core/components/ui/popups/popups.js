/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// popups

class Popups {

    popups = {}

    // @TODO: NOT USED
    setPopupInputWidget($ctrl, inputWidget) {
        const $popup = $ctrl.closest('.popup')
        if ($popup.length == 0) return false
        const popupId = $popup.attr('id')
        const popup = this.popups[popupId]
        popup.inputWidget = inputWidget
        return true
    }

    popup(popupId, controlId) {
        return {
            popupId: popupId,
            controlId: controlId,
            visible: false,
            inputWidget: null,
            align: null
        }
    }

    init_popups() {
        $('.popup').each((i, e) => {
            const $popup = $(e)
            const popupId = $popup.attr('id')
            const popup = this.popup(popupId, null)
            this.initPopup(popup, $popup, popupId)
        })
    }

    initPopup(popup, $popup, popupId) {
        this.popups[popupId] = popup
        $popup
            .find('.popup-close')
            .on('click', (c) => {
                popup.visible = false
                this.togglePopup(null, popupId, false)
                ui.inputWidgets.closeInputWidget()
            })
    }

    showPopup(controlId, popupId, align, appearFunc) {
        this.togglePopup(controlId, popupId, true, align, appearFunc, null)
    }

    hidePopup(popupId, hideFunc) {
        this.togglePopup(null, popupId, false, null, null, hideFunc)
    }

    togglePopup(controlId, popupId, showState, align, appearFunc, hideFunc) {

        const $popup = $('#' + popupId);
        const visible = !$popup.hasClass('hidden');
        const popup = this.popups[popupId]
        popup.controlId = controlId
        popup.align = align
        var newvis = false

        if (showState === undefined) {

            $popup.toggleClass('hidden');
            if (!visible) {
                newvis = true
                ui.bindings.initBindedControls();
            }
        } else {

            if (!showState) {
                if (hideFunc)
                    hideFunc($popup)
                else
                    $popup.addClass('hidden');
            }
            else {
                if (appearFunc) {
                    this.updatePopupPositionAndSize(controlId, $popup, align)
                    newvis = true
                    appearFunc($popup)
                }
                else {
                    $popup.removeClass('hidden');
                    newvis = true
                }
                ui.bindings.initBindedControls();
            }
        }

        popup.visible = newvis

        if (newvis) this.updatePopupPositionAndSize(controlId, $popup, align)

        if (!popup.visible)
            ui.inputWidgets.closeInputWidget()
    }

    updatePopupPositionAndSize(controlId, $popup, align) {
        var bounds = { width: $popup.outerWidth(), height: $popup.outerHeight() }
        const w = bounds.width
        const h = bounds.height
        var left = 0;
        var top = 0;
        const vs = cui.viewSize()

        if (controlId != null) {
            // left align
            const $ctrl = $(controlId);
            var pos = $ctrl.offset();
            pos.left -= w;
            pos.left -= settings.ui.menuContainerWidth; // 3*1em
            left = pos.left;
            top = pos.top;
        } else {
            if (align == Align_Center_Middle_Top) {
                left = (vs.width - w) / 2.0;
                top = (vs.height - h) / 4.0;
            }
            else {
                if (align == Align_Center_Top) {
                    left = (vs.width - w) / 2.0;
                    top = 12;
                }
                else {
                    // center
                    left = (vs.width - w) / 2.0
                    top = (vs.height - h) / 2.0
                }
            }
        }
        // repos if out
        if (left < 0) left = 0
        if (top < 0) top = 0
        // resize if outfit
        const rx = vs.width / w
        const ry = vs.height / h
        if (rx < 1 || ry < 1) {
            if (rx < 1) left = 0
            if (ry < 1) top = 0
            const zoom = Math.min(rx, ry)
            $popup.css('zoom', zoom)
            // center
            // bounding client rect not updated by zoom factor on chromium
            //bounds = $popup[0].getBoundingClientRect()
            bounds = { width: w * zoom, height: h * zoom }
            switch (align) {
                case Align_Center_Middle_Top:
                    left = (vs.width - bounds.width) / 2.0 / zoom;
                    top = (vs.height - bounds.height) / 4.0 / zoom;
                    break
                case Align_Center_Top:
                    left = (vs.width - bounds.width) / 2.0 / zoom
                    break
                default:
                    left = (vs.width - bounds.width) / 2.0 / zoom
                    top = (vs.heght - bounds.height) / 2.0 / zoom
                    break
            }
        } else {
            $popup.css('zoom', 1)
        }
        $popup.css('left', left + 'px');
        $popup.css('top', top + 'px');
    }

    updatePopupsPositionAndSize() {
        const $popups = $('.popup').not('[class*="hidden"]')
        $popups.each((i, e) => {
            const $popup = $(e)
            const popupId = $popup.attr('id')
            const popup = this.popups[popupId]
            this.updatePopupPositionAndSize(popup.controlId, $popup, popup.align)
        })
    }
}