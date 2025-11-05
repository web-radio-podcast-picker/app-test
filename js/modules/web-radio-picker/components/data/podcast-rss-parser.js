/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class PodcastRSSParser {

    parse(str) {
        try {
            const parser = new DOMParser()

            if (settings.debug.debug)
                window.str = str

            const xmlDoc = parser.parseFromString(str, 'application/xml')

            // channel infos

            const channel = xmlDoc.querySelector('channel')
            const e = null

            // channel global data

            const $items = $(channel).find('*')
            window.$items = $items

            const get = name => {
                var res = null
                $items.each((i, e) => {
                    if (e.tagName == name && res == null)
                        res = e
                })
                //if (res != null)
                //    res = res.htmlContent
                return res
            }

            const iget = ($item, name) => {
                var res = null
                $item.each((i, e) => {
                    if (e.tagName == name && res == null)
                        res = e
                })
                //if (res != null)
                //    res = res.htmlContent
                return res
            }

            const owner = get('itunes:owner')
            var ownerName = null
            var ownerEmail = null
            if (owner != null) {
                const $childs = $(owner.childNodes)
                ownerName = iget($childs, 'itunes:name')?.textContent || e
                ownerEmail = iget($childs, 'itunes:email')?.textContent || e
            }

            const podcast = {
                title: get('title')?.textContent || e,
                link: get('link')?.textContent || e,
                description: get('description')?.textContent || e,
                language: get('language')?.textContent || e,
                copyright: get('copyright')?.textContent || e,
                lastBuildDate: get('lastBuildDate')?.textContent || e,
                generator: get('generator')?.textContent || e,
                ////managingEditor: get('managingEditor')?.textContent || e,
                webMaster: get('webMaster')?.textContent || e,
                itunes: {
                    author: get('itunes:author')?.textContent || e,
                    subtitle: get('itunes:subtitle')?.textContent || e,
                    summary: get('itunes:summary')?.textContent || e,
                    explicit: get('itunes:explicit')?.textContent || e,
                    type: get('itunes:type')?.textContent || e,
                    owner: {
                        name: ownerName || e,
                        email: ownerEmail || e
                    },
                    image: get('itunes:image')?.getAttribute('href') || e,
                    keywords: get('itunes:keywords')?.textContent || e
                },
                image: channel.querySelector('image > url')?.textContent || e,
                episodes: []
            }

            // channel episodes

            const items = channel.querySelectorAll('item')

            podcast.episodes = Array.from(items).map(item => {

                const $item = $(item.childNodes)

                return {
                    title: iget($item, 'title')?.textContent || e,
                    season: iget($item, 'itunes:season')?.textContent || e,
                    episode: iget($item, 'itunes:episode')?.textContent || e,
                    pubDate: iget($item, 'pubDate')?.textContent || e,
                    guid: iget($item, 'guid')?.textContent || e,
                    audioUrl: iget($item, 'enclosure')?.getAttribute('url') || e,
                    audioType: iget($item, 'enclosure')?.getAttribute('type') || e,
                    audioLength: iget($item, 'enclosure')?.getAttribute('length') || e,
                    duration: iget($item, 'itunes:duration')?.textContent || e,
                    summary: iget($item, 'itunes:summary')?.textContent || e,
                    description: iget($item, 'description')?.textContent || e,
                    explicit: iget($item, 'itunes:explicit')?.textContent || e,
                    episodeType: iget($item, 'itunes:episodeType')?.textContent || e,
                    image: iget($item, 'itunes:image')?.getAttribute('href') || e
                };
            })

            if (settings.debug.obj)
                console.log(podcast)

            return podcast

        } catch (parseError) {
            throw new Error('parse RSS error')
        }
        return null
    }


}
