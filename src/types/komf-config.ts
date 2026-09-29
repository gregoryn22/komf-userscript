// Mirrors komf-api-models (snd.komf.api.config) served by the komf `/api/config` endpoint.
// Update DTOs follow komf PATCH semantics: omitted field = unchanged, `null` = clear.

export const activeProviders = [
    'mangaBaka',
    'mangaUpdates',
    'mangaDex',
    'aniList',
    'mal',
    'bookWalker',
    'comicVine',
] as const

// flagged "to be removed" (bangumi, yenPress, viz, webtoons) or already removed upstream (kodansha, nautiljon, hentag).
// Shown only while enabled so they can be turned off, never offered in "Add New"
export const deprecatedProviders = ['bangumi', 'yenPress', 'viz', 'webtoons', 'kodansha', 'nautiljon', 'hentag'] as const

export type ProviderKey = typeof activeProviders[number] | typeof deprecatedProviders[number]

export const providersWithBooks: readonly string[] = [
    'bookWalker', 'mangaDex', 'comicVine', 'bangumi', 'yenPress', 'viz', 'webtoons', 'kodansha', 'nautiljon'
]
export const providersWithMediaType: readonly string[] = [
    'mangaBaka', 'mangaUpdates', 'mal', 'aniList', 'bookWalker', 'bangumi', 'yenPress'
]

export const providerDisplayNames: Record<string, string> = {
    mangaBaka: 'MangaBaka',
    mangaUpdates: 'MangaUpdates',
    mangaDex: 'MangaDex',
    aniList: 'AniList',
    mal: 'MyAnimeList',
    bookWalker: 'BookWalker',
    comicVine: 'ComicVine',
    bangumi: 'Bangumi (deprecated)',
    yenPress: 'Yen Press (deprecated)',
    viz: 'Viz (deprecated)',
    webtoons: 'Webtoons (deprecated)',
    kodansha: 'Kodansha (removed)',
    nautiljon: 'Nautiljon (removed)',
    hentag: 'Hentag (removed)',
}

export function isKnownProvider(key: string): key is ProviderKey {
    return (activeProviders as readonly string[]).includes(key) || (deprecatedProviders as readonly string[]).includes(key)
}

export const mangaDexLinkOptions = [
    'MANGA_DEX', 'ANILIST', 'ANIME_PLANET', 'BOOKWALKER_JP', 'MANGA_UPDATES', 'NOVEL_UPDATES', 'KITSU',
    'AMAZON', 'EBOOK_JAPAN', 'MY_ANIME_LIST', 'CD_JAPAN', 'RAW', 'ENGLISH_TL'
]

// ---------------------------------------------------------------------------------------------------------------------
// GET /api/config
// ---------------------------------------------------------------------------------------------------------------------

export interface KomfConfigDto {
    komga: KomgaConfigDto,
    kavita: KavitaConfigDto,
    notifications: NotificationConfigDto,
    metadataProviders: MetadataProvidersConfigDto
}

export interface KomgaConfigDto {
    baseUri: string,
    komgaUser: string,
    eventListener: EventListenerConfigDto,
    metadataUpdate: MetadataUpdateConfigDto,
}

export interface KavitaConfigDto {
    baseUri: string,
    eventListener: EventListenerConfigDto,
    metadataUpdate: MetadataUpdateConfigDto,
}

export interface EventListenerConfigDto {
    enabled: boolean,
    metadataLibraryFilter: string[],
    metadataSeriesExcludeFilter: string[],
    notificationsLibraryFilter: string[],
}

export interface MetadataUpdateConfigDto {
    default: MetadataProcessingConfigDto,
    library: Record<string, MetadataProcessingConfigDto>
}

export interface MetadataProcessingConfigDto {
    libraryType: string,
    aggregate: boolean,
    mergeTags: boolean,
    mergeGenres: boolean,
    bookCovers: boolean,
    seriesCovers: boolean,
    overrideExistingCovers: boolean,
    lockCovers: boolean,
    updateModes: string[],
    postProcessing: MetadataPostProcessingConfigDto
}

export interface MetadataPostProcessingConfigDto {
    seriesTitle: boolean,
    seriesTitleLanguage: string | null,
    alternativeSeriesTitles: boolean | null,
    alternativeSeriesTitleLanguages: string[],
    orderBooks: boolean,
    respectBookNumberLock: boolean,
    readingDirectionValue: string | null,
    languageValue: string | null,
    fallbackToAltTitle: boolean,
    scoreTagName: string | null,
    originalPublisherTagName: string | null,
    publisherTagNames: PublisherTagNameConfigDto[],
    // only present on the gregoryn22/komf fork
    titleSanitization?: TitleSanitizationConfigDto,
}

export interface PublisherTagNameConfigDto {
    tagName: string,
    language: string
}

export interface TitleSanitizationConfigDto {
    enabled: boolean,
    stripSuffixes: string[],
    stripPatterns: string[],
}

export interface MetadataProvidersConfigDto {
    malClientId: string | null,
    comicVineClientId: string | null,
    comicVineSearchLimit: number | null,
    comicVineIssueName: string | null,
    comicVineIdFormat: string | null,
    nameMatchingMode: string,
    defaultProviders: ProvidersConfigDto,
    libraryProviders: Record<string, ProvidersConfigDto>,
    mangaBakaDatabase: { downloadTimestamp: string, checksum: string } | null,
    bookWalkerDownloadDate: string | null,
}

export type ProvidersConfigDto = Partial<Record<string, ProviderConfigDto>>

export interface ProviderConfigDto {
    priority: number,
    enabled: boolean,
    seriesMetadata: SeriesMetadataConfigDto,
    bookMetadata?: BookMetadataConfigDto | null,
    nameMatchingMode?: string | null,
    mediaType?: string | null,
    authorRoles: string[],
    artistRoles: string[],

    // aniList
    tagsScoreThreshold?: number,
    tagsSizeLimit?: number,
    // mangaDex
    coverLanguages?: string[],
    links?: string[],
    // mangaBaka
    mode?: string,
}

export interface SeriesMetadataConfigDto {
    status: boolean
    title: boolean
    summary: boolean
    publisher: boolean
    readingDirection: boolean
    ageRating: boolean
    language: boolean
    genres: boolean
    tags: boolean
    totalBookCount: boolean
    authors: boolean
    releaseDate: boolean
    thumbnail: boolean
    links: boolean
    books: boolean
    useOriginalPublisher: boolean

    originalPublisherTagName?: string | null
    englishPublisherTagName?: string | null
    frenchPublisherTagName?: string | null
}

export interface BookMetadataConfigDto {
    title: boolean,
    summary: boolean,
    number: boolean,
    numberSort: boolean,
    releaseDate: boolean,
    authors: boolean,
    tags: boolean,
    isbn: boolean,
    links: boolean,
    thumbnail: boolean,
}

export interface NotificationConfigDto {
    apprise: { urls: string[] | null, seriesCover: boolean },
    discord: { webhooks: string[] | null, seriesCover: boolean },
}

// ---------------------------------------------------------------------------------------------------------------------
// PATCH /api/config
// ---------------------------------------------------------------------------------------------------------------------

export interface KomfConfigUpdateDto {
    komga?: KomgaConfigUpdateDto,
    kavita?: KavitaConfigUpdateDto,
    notifications?: NotificationConfigUpdateDto,
    metadataProviders?: MetadataProvidersConfigUpdateDto
}

export interface KomgaConfigUpdateDto {
    baseUri?: string,
    komgaUser?: string,
    komgaPassword?: string,
    eventListener?: EventListenerConfigUpdateDto,
    metadataUpdate?: MetadataUpdateConfigUpdateDto,
}

export interface KavitaConfigUpdateDto {
    baseUri?: string,
    apiKey?: string,
    eventListener?: EventListenerConfigUpdateDto,
    metadataUpdate?: MetadataUpdateConfigUpdateDto,
}

export interface EventListenerConfigUpdateDto {
    enabled?: boolean,
    metadataLibraryFilter?: string[],
    metadataExcludeSeriesFilter?: string[],
    notificationsLibraryFilter?: string[],
}

export interface NotificationConfigUpdateDto {
    discord?: { webhooks?: Record<number, string | null>, seriesCover?: boolean },
    apprise?: { urls?: Record<number, string | null>, seriesCover?: boolean },
}

export interface MetadataUpdateConfigUpdateDto {
    default?: MetadataProcessingConfigUpdateDto,
    library?: Record<string, MetadataProcessingConfigUpdateDto | null>
}

export interface MetadataProcessingConfigUpdateDto {
    libraryType?: string,
    aggregate?: boolean,
    mergeTags?: boolean,
    mergeGenres?: boolean,
    bookCovers?: boolean,
    seriesCovers?: boolean,
    overrideExistingCovers?: boolean,
    lockCovers?: boolean,
    updateModes?: string[],
    postProcessing?: MetadataPostProcessingConfigUpdateDto
}

export interface MetadataPostProcessingConfigUpdateDto {
    seriesTitle?: boolean,
    seriesTitleLanguage?: string | null,
    alternativeSeriesTitles?: boolean,
    alternativeSeriesTitleLanguages?: string[],
    fallbackToAltTitle?: boolean,
    orderBooks?: boolean,
    respectBookNumberLock?: boolean,
    readingDirectionValue?: string | null,
    languageValue?: string | null,
    scoreTagName?: string | null,
    originalPublisherTagName?: string | null,
    publisherTagNames?: PublisherTagNameConfigDto[],
    titleSanitization?: TitleSanitizationConfigDto,
}

export interface MetadataProvidersConfigUpdateDto {
    malClientId?: string | null,
    comicVineClientId?: string | null,
    comicVineSearchLimit?: number | null,
    comicVineIssueName?: string | null,
    comicVineIdFormat?: string | null,
    nameMatchingMode?: string,
    defaultProviders?: ProvidersConfigUpdateDto,
    libraryProviders?: Record<string, ProvidersConfigUpdateDto | null>,
}

export type ProvidersConfigUpdateDto = Partial<Record<ProviderKey, ProviderConfigUpdateDto>>

export interface ProviderConfigUpdateDto {
    mediaType?: string,
    nameMatchingMode?: string | null,
    authorRoles?: string[],
    artistRoles?: string[],
    priority?: number,
    enabled?: boolean,
    seriesMetadata?: SeriesMetadataConfigUpdateDto,
    bookMetadata?: BookMetadataConfigUpdateDto,
    tagsScoreThreshold?: number,
    tagsSizeLimit?: number,
    coverLanguages?: string[],
    links?: string[],
    mode?: string,
}

export type SeriesMetadataConfigUpdateDto = {
    [K in keyof SeriesMetadataConfigDto]?: SeriesMetadataConfigDto[K]
}

export type BookMetadataConfigUpdateDto = Partial<BookMetadataConfigDto>

// ---------------------------------------------------------------------------------------------------------------------
// defaults used when a library override is created in the UI
// ---------------------------------------------------------------------------------------------------------------------

export class DefaultSeriesMetadataConfig implements SeriesMetadataConfigDto {
    ageRating: boolean = true
    authors: boolean = true
    books: boolean = true
    genres: boolean = true
    language: boolean = true
    links: boolean = true
    publisher: boolean = true
    readingDirection: boolean = true
    releaseDate: boolean = true
    status: boolean = true
    summary: boolean = true
    tags: boolean = true
    thumbnail: boolean = true
    title: boolean = true
    totalBookCount: boolean = true
    useOriginalPublisher: boolean = false
}

export class DefaultBookMetadataConfig implements BookMetadataConfigDto {
    authors: boolean = true
    isbn: boolean = true
    links: boolean = true
    number: boolean = true
    numberSort: boolean = true
    releaseDate: boolean = true
    summary: boolean = true
    tags: boolean = true
    thumbnail: boolean = true
    title: boolean = true
}

export function defaultProviderConfig(key: string): ProviderConfigDto {
    const config: ProviderConfigDto = {
        enabled: false,
        priority: 10,
        authorRoles: ['WRITER'],
        artistRoles: ['PENCILLER', 'INKER', 'COLORIST', 'LETTERER', 'COVER'],
        mediaType: 'MANGA',
        nameMatchingMode: null,
        seriesMetadata: new DefaultSeriesMetadataConfig(),
        bookMetadata: providersWithBooks.includes(key) ? new DefaultBookMetadataConfig() : null,
    }
    switch (key) {
        case 'aniList':
            config.tagsScoreThreshold = 60
            config.tagsSizeLimit = 15
            break
        case 'mangaDex':
            config.coverLanguages = ['en', 'ja']
            config.links = []
            break
        case 'mangaBaka':
            config.mode = 'API'
            break
    }
    return config
}
