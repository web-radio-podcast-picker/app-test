/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class ViewManager {

    // station: tag,lang,artist,fav,viz
    onStationTabChanged = new CallbacksDelegate('onStationTabChanged')
    // podcast: lang,tag,letter,channel, viz?
    onPodcastTabChanged = new CallbacksDelegate('onPodcastTabChanged')
    // epi media view visibility changed
    onEpiMediaViewVisibilityChanged = new CallbacksDelegate('onEpiMediaViewVisibilityChanged')

    epiListMediaVisible = false
}
