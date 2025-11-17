/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class CallbacksDelegate {

    callbacks = []
    eventId = null

    constructor(eventId) {
        this.eventId = eventId
    }

    add(func) {
        this.callbacks.push(func)
    }

    fire(...args) {
        if (settings.debug.debug)
            logger.log('👉 fire event: ' + this.eventId, args)
        this.callbacks.forEach(f => {
            f(...args)
        })
    }
}