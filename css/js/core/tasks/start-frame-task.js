/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// at begin of frame

startFrameTask = {

    lastFrameStartTime: null,
    frameStartTime: null,
    frameFPS: 0,
    frameDuration: 0,

    run() {
        const lst = this.lastFrameStartTime
        this.lastFrameStartTime = this.frameStartTime
        this.frameStartTime = Date.now()
        if (lst != null) {
            this.frameDuration = this.frameStartTime - lst
            const fps = 1000.0 / this.frameDuration;
            this.frameFPS = fps;
        }
    }
}