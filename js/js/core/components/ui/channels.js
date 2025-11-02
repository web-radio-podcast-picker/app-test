/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// channels ui
class Channels {

    toggleOut(channel) {
        if (channel.pause || oscilloscope.pause) return
        channel.out = !channel.out
        oscilloscope.setOut(channel, channel.out)
        oscilloscope.refreshView()
    }

    pauseAllOuts(pause) {
        // pause all channels output (oscilloscope pause)
        oscilloscope.channels.forEach(channel => {
            if (channel.out || channel.outMute) {
                channel.setPauseOut(pause)
                this.updatePause(channel)
            }
        })
    }

    updatePause(channel) {
        channel.setPause(channel.pause)// apply after binding the proprer method call
    }

    updateVisible(channel) {
        const $vb = $('#btn_viewch_' + channel.channelId)
        if (channel.view.visible)
            $vb.removeClass('line-through')
        else
            $vb.addClass('line-through')
        app.requestAnimationFrame()
    }

    toggleVisible(channel) {
        const $vb = $('#btn_viewch_' + channel.channelId)
        $vb.click()
    }

    setupChannelLabel($channelLabel, id, channel) {
        $channelLabel.text('CH' + id)
        $channelLabel.css('background-color', channel.color)
    }

    getChannelIndex(channel) {
        var r = 0
        var idx = 0
        oscilloscope.channels.forEach(c => {
            if (c == channel)
                r = idx
            idx++
        })
        return r
    }
}