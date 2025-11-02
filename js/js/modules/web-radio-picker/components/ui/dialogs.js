/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const Id_Popup_Info = 'info_popup'
const Id_Dialog_Confirm = 'confirm_dialog'

class Dialogs {

    autoHidePopupTimer = null
    dialogConfirmInitialized = false

    infoPopup(text, text2, error, error2, noAutoHide) {
        return {
            text: text,
            text2: text2,
            error: error,
            error2: error2,
            noAutoHide: noAutoHide,
            enableCloseOnClick: true,
            freezeUI: false
        }
    }

    infoPopupError(error, error2, noAutoHide) {
        return {
            text: null,
            text2: null,
            error: error,
            error2: error2,
            noAutoHide: noAutoHide !== undefined ? noAutoHide : true,
            enableCloseOnClick: true,
            freezeUI: false
        }
    }

    showInfoPopup(opts) {
        opts = {
            ...opts,
            ...{
                id: Id_Popup_Info,
                clText: 'info-popup-text',
                clText2: 'info-popup-text2',
                clError: 'info-popup-error',
                clError2: 'info-popup-error2',
                hasErrorPane: true
            }
        }
        this.showPopup(opts)
    }

    dialogConfirm(text, text2, then) {
        return {
            id: Id_Dialog_Confirm,
            text: text,
            text2: text2,
            clText: 'dialog-text',
            clText2: 'dialog-text2',
            hasErrorPane: false,
            then: then,
            enableCloseOnClick: false,
            noAutoHide: true,
            freezeUI: true
        }
    }

    dialogOpts(opts) {
        return {
            ...opts,
            ...{
                clText: 'dialog-text',
                clText2: 'dialog-text2',
                hasErrorPane: false,
                enableCloseOnClick: false,
                noAutoHide: true,
                freezeUI: true
            }
        }
    }

    showDialog(opts) {
        opts = this.dialogOpts(opts)
        this.showPopup(opts)
    }

    showDialogConfirm(opts) {
        opts = this.dialogOpts(opts)
        opts.id = Id_Dialog_Confirm

        const $dial = $('#' + opts.id)
        if (!$dial.hasClass('dialog-confirm-initialized')) {
            $dial.find('.dialog-btn-yes').on('click', () => {
                if (opts.freezeUI) uiState.setFreezeUI(false)
                if (window.then) window.then({ confirm: true })
            })
            $dial.find('.dialog-btn-no').on('click', () => {
                if (opts.freezeUI) uiState.setFreezeUI(false)
                if (window.then) window.then({ confirm: false })
            })
            $dial.addClass('dialog-confirm-initialized')
        }
        window.then = opts.then

        this.showPopup(opts)
    }

    showPopup(opts) {
        if (opts == null || opts === undefined) return

        clearTimeout(this.autoHidePopupTimer)

        const $popup = $('#' + opts.id)
        if (!$popup.hasClass('popup-initialized')) {
            $popup.on('click', () => {
                if (window.opts.enableCloseOnClick)
                    this.hideInfoPopup()
            })
            $popup.addClass('popup-initialized')
        }

        const updVis = (v, $e) => {
            if (v)
                $e.removeClass(Class_Hidden)
            else
                $e.addClass(Class_Hidden)
        }

        // text
        const $text = $popup.find('.' + opts.clText)
        const $text2 = $popup.find('.' + opts.clText2)
        $text.html(opts.text)
        $text2.html(opts.text2)
        updVis(opts.text, $text)
        updVis(opts.text2, $text2)

        // error
        if (opts.hasErrorPane) {
            const $error = $popup.find('.' + opts.clError)
            const $error2 = $popup.find('.' + opts.clError2)
            $error.html(opts.error)
            $error2.html(opts.error2)
            updVis(opts.error, $error)
            updVis(opts.error2, $error2)
        }

        window.opts = opts
        if (opts.freezeUI) uiState.setFreezeUI(true)
        ui.popups.showPopup(null, opts.id, null, this.appearFunc)
        if (opts.noAutoHide != true)
            this.startautoHidePopupTimer()
    }

    appearFunc($e) {
        $e.removeClass('hidden').addClass('pop-anim').fadeIn(
            settings.ui.infoPopupFadeInDelay
        )
    }

    hideFunc($e) {
        $e.fadeOut(settings.ui.infoPopupFadeOutDelay)
    }

    startautoHidePopupTimer() {
        clearTimeout(this.autoHidePopupTimer)
        this.autoHidePopupTimer = setTimeout(
            () => this.hideInfoPopup(),
            settings.ui.autoHideInfoPopupDelay)
    }

    hideInfoPopup(hideFunc) {
        this.hidePopup(Id_Popup_Info, hideFunc)
    }

    hideDialogConfirm(hideFunc) {
        this.hidePopup(Id_Dialog_Confirm, hideFunc)
    }

    hidePopup(id, hideFunc) {
        ui.popups.hidePopup(id, hideFunc || this.hideFunc)
    }
}
