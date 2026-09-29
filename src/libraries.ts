import type KomfMetadataService from '@/services/komf-metadata.service'
import type { Library } from '@/stores/configUpdate'
import MediaServer from '@/types/mediaServer'

/**
 * Library list for settings dropdowns. Asks komf first and falls back to scraping the media server's side navigation.
 */
export async function loadLibraries(
    metadataService: KomfMetadataService,
    komfUrl: string,
    mediaServer: MediaServer | undefined
): Promise<Library[]> {
    try {
        const libraries = await metadataService.getLibraries(komfUrl)
        return libraries.map(library => ({ id: library.id, name: library.name }))
    } catch (e) {
        console.warn('komf: failed to load libraries from komf, falling back to page navigation', e)
        return scrapeLibraries(mediaServer)
    }
}

function scrapeLibraries(mediaServer: MediaServer | undefined): Library[] {
    if (mediaServer == MediaServer.Komga) {
        const drawer = document.getElementsByClassName('v-navigation-drawer__content')[0]
        if (!drawer) return []
        return Array.from(drawer.getElementsByTagName('a'))
            .filter(el => el.classList.contains('v-list-item--dense') && /\/libraries.*/.test(el.getAttribute('href') ?? ''))
            .map(el => {
                const pathTokens = el.getAttribute('href')!.split('/')
                return {
                    id: pathTokens[pathTokens.findIndex(token => token == 'libraries') + 1],
                    name: el.text
                }
            })
    } else {
        const nav = document.getElementsByTagName('app-side-nav')[0]
        if (!nav) return []
        return Array.from(nav.getElementsByTagName('a'))
            .filter(el => el.classList.contains('side-nav-item') && /\/library.*/.test(el.getAttribute('href') ?? ''))
            .map(el => {
                const pathTokens = el.getAttribute('href')!.split('/')
                return {
                    id: pathTokens[pathTokens.findIndex(token => token == 'library') + 1],
                    name: Array.from(el.getElementsByTagName('span'))
                        .find(span => span.classList.contains('side-nav-text'))?.textContent ?? ''
                }
            })
    }
}
