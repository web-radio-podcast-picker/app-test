/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// start view task

startViewTask = {

    canvas: null,       // canvas for visualization

    init(canvas) {
        this.canvas = canvas;
    },

    run() {

        if (ui.vizTabActivated) {
            // clear view
            app.clearMediaView()
        }

        app.startFramePermanentOperations.forEach(fn => {
            fn();
        });
        app.startFrameOneShotOperations.forEach(fn => {
            fn();
        });
        app.startFrameOneShotOperations.length = 0;
    }
}