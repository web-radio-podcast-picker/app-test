/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class Volume {

    initialized = false
    isHandling = false
    dbg = false

    openDial() {
        if (!this.initialized)
            this.init()

        const $ico = this.$getIcon()
        if ($ico.hasClass('but-icon-disabled')) return
        $ico.addClass('but-icon-disabled')

        const vol = this.getVolume()
        this.updateVolumeIcon(vol)
        const dialOpts = dialogs.dialogConfirm(
            'Volume',
            this.toPercent(vol),
            res => this.closeDial(res),
            Id_Dialog_Volume
        )
        this.setPosition(vol)
        dialOpts.freezeUI = false
        dialOpts.enableCloseOnClick = false
        //dialOpts.disablePopupClick = true
        dialogs.showDialogConfirm(dialOpts)
    }

    updateVolumeIcon(vol) {
        const $ico = this.$getIcon()
        if (vol == 0)
            $ico[0].src = './img/icons8-mute-50.png'
        else
            $ico[0].src = './img/icons8-volume-moyen-50.png'
    }

    init() {
        this.initialized = true
        const $plot = this.$getPlot()
        const $dial = this.$getDial()
        $plot.on('mousedown', e => this.startHandle(e))
        $plot.on('mouseup', e => this.endHandle(e))
        $dial.on('mouseup', e => this.endHandle(e))
        $dial.on('mouseleave', e => this.endHandle(e))
        $dial.on('mousemove', e => this.handle(e))
    }

    handle(e) {
        if (!this.isHandling) return

        const $bar = this.$getBar()
        const rect = $bar[0].getBoundingClientRect()

        const x = Math.max(0,
            Math.min(
                rect.width, e.clientX - rect.left))
        const v = x / rect.width

        this.updatePosition(v, x)
    }

    updatePosition(v, x) {
        const $text = this.$getDial().find('.dialog-text2')
        $text.text(this.toPercent(v))
        this.setPosition(v)
        this.setVolume(v)
    }

    startHandle(e) {
        this.isHandling = true
        if (this.dbg) console.log('start handle')
    }

    endHandle(e) {
        this.isHandling = false
        if (this.dbg) console.log('end handle')
    }

    toPercent(value) {
        return parseInt(value * 100) + ' %'
    }

    setVolume(value) {
        if (settings.features.constraints.isIPhone) {
            if (audio)
                audio.volume = value
        }
        else {
            if (app.channel?.gain?.gain)
                app.channel.gain.gain.value = value
        }
        uiState.defaultVolume = value
    }

    setPosition(value) {
        const $plot = this.$getPlot()
        const left = this.toPercent(value).replace(' ', '')
        $plot.css('left', left)
        if (this.dbg)
            console.log('left=' + left + ', value=' + value)
    }

    getVolume() {
        return uiState.defaultVolume >= 0 ?
            uiState.defaultVolume : 1
        /*return settings.features.constraints.isIPhone ?
            (audio?.volume || 1)
            : (app.channel?.gain?.gain?.value || 1)*/
    }

    $getIcon() {
        return $('#btn_wrp_vol_icon')
    }

    $getBar() {
        return this.$getDial().find('.volume-plot')
    }

    $getPlot() {
        return this.$getDial().find('.volume-circle')
    }

    $getDial() {
        return $('#' + Id_Dialog_Volume)
    }

    closeDial() {
        dialogs.hidePopup(Id_Dialog_Volume)
        this.$getIcon().removeClass('but-icon-disabled')
        this.updateVolumeIcon(this.getVolume())
        settings.dataStore.saveUIState()
    }
}