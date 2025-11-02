/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// common ui

cui = {

    setFullscreenToggleText(fs, onText, offText, btnId) {

        settings.ui.fullscreen = fs

        if (fs) {
            var body = document.querySelector('body')
            if (body.requestFullscreen !== undefined) body.requestFullscreen(
                { navigationUI: 'hide' }
            )
        }
        else {
            if (document.fullscreenElement)
                document.exitFullscreen()
        }
        if (btnId !== undefined)
            $('#' + btnId).html(
                fs ? onText : offText
            )
    },

    setFullscreen(fs) {

        settings.ui.fullscreen = fs

        if (fs) {
            var body = document.querySelector('body')
            if (body.requestFullscreen !== undefined) body.requestFullscreen(
                { navigationUI: 'hide' }
            )
        }
        else {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            }
        }
    },

    setFullscreenToggleVis(fs, onIconId, offIconId) {

        settings.ui.fullscreen = fs

        if (fs) {
            var body = document.querySelector('body')
            if (body.requestFullscreen !== undefined) body.requestFullscreen(
                { navigationUI: 'hide' }
            )
            $('#' + onIconId).removeClass('hidden')
            $('#' + offIconId).addClass('hidden')
        }
        else {
            if (document.fullscreenElement) {
                document.exitFullscreen()
                $('#' + offIconId).removeClass('hidden')
                $('#' + onIconId).addClass('hidden')
            }
        }
    },

    isSmallDisplay() {
        const vs = this.viewSize()
        return vs.height <= settings.ui.compactDisplayMaxHeight
    },

    viewSize() {
        const html = document.querySelector('html');
        return {
            width: html.clientWidth /*- settings.ui.clientWidthBorder*/,
            height: html.clientHeight /*- settings.ui.clientHeightBorder*/
        };
    },

    // use html width*height
    getOrientation() {
        const vs = this.viewSize()
        if (vs.width >= vs.height)
            return Screen_Orientation_Landscape
        return Screen_Orientation_Portrait
    }

}
