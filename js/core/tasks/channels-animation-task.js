/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// channels animation

channelsAnimationTask = {

    oscilloscope: null, // oscilloscope manager

    init(oscilloscope) {
        this.oscilloscope = oscilloscope;
    },

    run() {
        this.oscilloscope.channels.forEach(channel => {
            channel.view.run()
            channel.fftView.run()
            ///channel.measuresView.run()
        })
    }
}