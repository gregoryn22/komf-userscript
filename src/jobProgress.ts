import type { QVueGlobals } from 'quasar'
import type KomfMetadataService from '@/services/komf-metadata.service'
import { providerLabel } from '@/stores/configUpdate'

const providerNames: Record<string, string> = {
    MANGA_BAKA: 'mangaBaka',
    MANGA_UPDATES: 'mangaUpdates',
    MANGADEX: 'mangaDex',
    ANILIST: 'aniList',
    MAL: 'mal',
    BOOK_WALKER: 'bookWalker',
    COMIC_VINE: 'comicVine',
}

export function providerDisplayName(provider: string): string {
    const key = providerNames[provider]
    if (key) return providerLabel(key)
    return provider.toLowerCase().split('_')
        .map(token => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ')
}

/**
 * Shows a persistent notification that follows a komf metadata job until it completes.
 */
export function trackMetadataJob(quasar: QVueGlobals, metadataService: KomfMetadataService, jobId: string, title: string) {
    const errors: string[] = []
    const notification = quasar.notify({
        group: false,
        timeout: 0,
        spinner: true,
        color: 'secondary',
        message: title,
        caption: 'Starting...'
    })

    metadataService.subscribeToJob(
        jobId,
        event => {
            switch (event.type) {
                case 'ProviderSeriesEvent':
                    notification({ caption: `${providerDisplayName(event.provider)}: series metadata` })
                    break
                case 'ProviderBookEvent':
                    notification({
                        caption: `${providerDisplayName(event.provider)}: book ${event.bookProgress}/${event.totalBooks}`
                    })
                    break
                case 'ProviderErrorEvent':
                    errors.push(`${providerDisplayName(event.provider)}: ${event.message}`)
                    break
                case 'PostProcessingStartEvent':
                    notification({ caption: 'Post-processing' })
                    break
                case 'ProcessingErrorEvent':
                    errors.push(event.message)
                    break
            }
        },
        () => {
            notification({
                spinner: false,
                timeout: errors.length ? 10000 : 3000,
                color: errors.length ? 'negative' : 'positive',
                caption: errors.length ? errors.join('; ') : 'Done',
                actions: [{ label: 'Dismiss', color: 'white' }]
            })
        }
    )
}
