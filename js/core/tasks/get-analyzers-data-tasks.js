/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// grap data from channels analyzers to get samples task

getAnalyzersDataTasks = {

    run() {
        oscilloscope.channels.forEach(channel => {
            if (channel.getSamplesTask != null)
                channel.getSamplesTask.run()
        })
    }
}