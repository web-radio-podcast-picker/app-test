/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

const DebouncerLogPfx = '[!!] '

class Debouncer {

    minSpanMs = 5000
    delayExec = 3000

    execFuncDate = null
    execDifferTimer = null
    execDelayTimer = null

    constructor(name, minSpanMs, delayExec) {
        this.name = name
        this.minSpanMs = minSpanMs
        this.delayExec = delayExec
    }

    debounce(func) {

        if (settings.debug.debug)
            logger.log(DebouncerLogPfx + '--> debounce: ' + this.name)
        if (settings.debug.globalObj)
            window.func = func

        const rd = new Date()

        const exec = () => {
            if (settings.debug.debug)
                logger.log(DebouncerLogPfx + 'debounce delay exec (' + this.delayExec + 'ms) : ' + this.name)

            this.execFuncDate = rd

            this.execDelayTimer = setTimeout(() => {
                if (settings.debug.debug)
                    logger.log(DebouncerLogPfx + 'debounce exec: ' + this.name)

                this.execDelayTimer = null
                this.execFuncDate = rd
                func()
            }, this.delayExec)
        }

        if (this.execFuncDate == null) {
            // no previous
            exec()
        } else {

            if (this.execDifferTimer != null
                || this.execDelayTimer != null
            ) {
                // wait programmed
                if (settings.debug.debug)
                    logger.log(DebouncerLogPfx + 'wait differed')
            }
            else {

                const ellapsed = (rd - this.execFuncDate)

                if (settings.debug.debug)
                    logger.log(DebouncerLogPfx + 'ellasped = ' + ellapsed)

                this.execFuncDate = rd

                if (ellapsed < this.minSpanMs) {
                    // wait later

                    if (this.execDelayTimer) {
                        clearTimeout(this.execDelayTimer)
                        this.execDelayTimer = null
                    }

                    const delay = this.minSpanMs - ellapsed

                    if (settings.debug.debug)
                        logger.log(DebouncerLogPfx + 'differ exec ' + delay + ' ms')

                    const self = this
                    this.execDifferTimer = setTimeout(() => {
                        exec()
                        self.execDifferTimer = null
                    }, delay);
                }
                else {
                    // acceptable in time
                    exec()
                }
            }
        }
    }
}