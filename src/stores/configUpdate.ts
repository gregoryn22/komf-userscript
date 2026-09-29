import { defineStore } from 'pinia'
import type { Ref } from 'vue'
import { reactive, ref } from 'vue'
import type {
    BookMetadataConfigDto,
    BookMetadataConfigUpdateDto,
    EventListenerConfigDto,
    EventListenerConfigUpdateDto,
    KavitaConfigDto,
    KavitaConfigUpdateDto,
    KomfConfigDto,
    KomfConfigUpdateDto,
    KomgaConfigDto,
    KomgaConfigUpdateDto,
    MetadataPostProcessingConfigUpdateDto,
    MetadataProcessingConfigDto,
    MetadataProcessingConfigUpdateDto,
    MetadataProvidersConfigUpdateDto,
    MetadataUpdateConfigDto,
    MetadataUpdateConfigUpdateDto,
    NotificationConfigDto,
    NotificationConfigUpdateDto,
    ProviderConfigDto,
    ProviderConfigUpdateDto,
    ProviderKey,
    ProvidersConfigDto,
    ProvidersConfigUpdateDto,
    PublisherTagNameConfigDto,
    SeriesMetadataConfigDto,
    SeriesMetadataConfigUpdateDto,
    TitleSanitizationConfigDto
} from '@/types/komf-config'
import {
    activeProviders,
    defaultProviderConfig,
    isKnownProvider,
    providerDisplayNames,
    providersWithBooks,
    providersWithMediaType
} from '@/types/komf-config'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'

export interface Library {
    id: string,
    name: string
}

export interface LibraryRef {
    id: string,
    name: string | undefined
}

export interface ProviderModel extends ProviderConfigDto {
    name: string,
    books: boolean,
    mediaTypeEnabled: boolean
}

export interface LibraryProvidersModel {
    id: string,
    name: string,
    deleted: boolean,
    providers: ProviderModel[],
    disabledProviders: ProviderModel[]
}

export interface ListEntry {
    value: string | null,
    existing: boolean
}

export const useConfigUpdateStore = defineStore('settingsUpdate', () => {
    const settings = useSettingsStore()
    const libraries: Ref<Library[]> = ref([])
    const currentConfig: Ref<KomfConfigDto | null> = ref(null)
    const titleSanitizationSupported = ref(false)

    const notifications = reactive({
        komgaLibraries: [] as LibraryRef[] | null,
        kavitaLibraries: [] as LibraryRef[] | null,
        discord: {
            webhooks: [] as ListEntry[],
            seriesCover: false
        },
        apprise: {
            urls: [] as ListEntry[],
            seriesCover: false
        }
    })

    const metadataProviders = reactive({
        malClientId: '' as string | null,
        malClientIdDisabled: false,
        comicVineClientId: '' as string | null,
        comicVineClientIdDisabled: false,
        comicVineSearchLimit: null as number | string | null,
        comicVineIssueName: null as string | null,
        comicVineIdFormat: null as string | null,
        nameMatchingMode: 'CLOSEST_MATCH',
        mangaBakaDatabase: null as { downloadTimestamp: string, checksum: string } | null,
        bookWalkerDownloadDate: null as string | null,
        defaultProviders: [] as ProviderModel[],
        defaultDisabledProviders: [] as ProviderModel[],
        libraryProviders: [] as LibraryProvidersModel[]
    })

    const komgaMetadata = reactive({
        default: defaultProcessingModel(),
        library: [] as ProcessingLibraryUpdateModel[]
    })

    const kavitaMetadata = reactive({
        default: defaultProcessingModel(),
        library: [] as ProcessingLibraryUpdateModel[]
    })

    const komga = reactive({
        baseUri: 'http://localhost:8080',
        user: 'admin@example.org',
        password: '',
        passwordDisabled: true,
        eventListener: {
            enabled: false,
            libraries: [] as LibraryRef[] | null,
            excludeSeries: [] as string[] | null
        }
    })

    const kavita = reactive({
        baseUri: 'http://localhost:5000',
        apiKey: '',
        eventListener: {
            enabled: false,
            libraries: [] as LibraryRef[] | null,
            excludeSeries: [] as string[] | null
        }
    })

    function reset(config: KomfConfigDto, serverLibraries: Library[]) {
        libraries.value = serverLibraries
        currentConfig.value = structuredClone(config)
        config = structuredClone(config)
        titleSanitizationSupported.value = config.komga.metadataUpdate.default.postProcessing.titleSanitization != undefined

        notifications.discord.webhooks = (config.notifications.discord.webhooks ?? [])
            .map(value => ({ value: value, existing: true }))
        notifications.discord.seriesCover = config.notifications.discord.seriesCover
        notifications.apprise.urls = (config.notifications.apprise.urls ?? [])
            .map(value => ({ value: value, existing: true }))
        notifications.apprise.seriesCover = config.notifications.apprise.seriesCover
        notifications.komgaLibraries = toLibraryRefs(config.komga.eventListener.notificationsLibraryFilter)
        notifications.kavitaLibraries = toLibraryRefs(config.kavita.eventListener.notificationsLibraryFilter)

        const providersConfig = config.metadataProviders
        metadataProviders.malClientId = providersConfig.malClientId ?? ''
        metadataProviders.malClientIdDisabled = !!providersConfig.malClientId
        metadataProviders.comicVineClientId = providersConfig.comicVineClientId ?? ''
        metadataProviders.comicVineClientIdDisabled = !!providersConfig.comicVineClientId
        metadataProviders.comicVineSearchLimit = providersConfig.comicVineSearchLimit
        metadataProviders.comicVineIssueName = providersConfig.comicVineIssueName
        metadataProviders.comicVineIdFormat = providersConfig.comicVineIdFormat
        metadataProviders.nameMatchingMode = providersConfig.nameMatchingMode
        metadataProviders.mangaBakaDatabase = providersConfig.mangaBakaDatabase
        metadataProviders.bookWalkerDownloadDate = providersConfig.bookWalkerDownloadDate

        const defaultProviders = toProviderModels(providersConfig.defaultProviders)
        metadataProviders.defaultProviders = defaultProviders.enabled
        metadataProviders.defaultDisabledProviders = defaultProviders.disabled
        metadataProviders.libraryProviders = Object.entries(providersConfig.libraryProviders)
            .map(([libraryId, providers]) => {
                const models = toProviderModels(providers)
                return {
                    id: libraryId,
                    name: libraryName(libraryId),
                    deleted: false,
                    providers: models.enabled,
                    disabledProviders: models.disabled
                }
            })

        komga.baseUri = config.komga.baseUri
        komga.user = config.komga.komgaUser
        komga.password = ''
        komga.passwordDisabled = true
        komga.eventListener.enabled = config.komga.eventListener.enabled
        komga.eventListener.libraries = toLibraryRefs(config.komga.eventListener.metadataLibraryFilter)
        komga.eventListener.excludeSeries = [...config.komga.eventListener.metadataSeriesExcludeFilter]
        resetProcessing(komgaMetadata, config.komga.metadataUpdate)

        kavita.baseUri = config.kavita.baseUri
        kavita.apiKey = ''
        kavita.eventListener.enabled = config.kavita.eventListener.enabled
        kavita.eventListener.libraries = toLibraryRefs(config.kavita.eventListener.metadataLibraryFilter)
        kavita.eventListener.excludeSeries = [...config.kavita.eventListener.metadataSeriesExcludeFilter]
        resetProcessing(kavitaMetadata, config.kavita.metadataUpdate)
    }

    function resetProcessing(
        model: { default: ProcessingUpdateModel, library: ProcessingLibraryUpdateModel[] },
        config: MetadataUpdateConfigDto
    ) {
        model.default = toProcessingModel(config.default)
        model.library = Object.entries(config.library)
            .map(([libraryId, libraryConfig]) => ({
                ...toProcessingModel(libraryConfig),
                id: libraryId,
                name: libraryName(libraryId),
                deleted: false,
            }))
    }

    function newLibraryProcessingModel(): ProcessingUpdateModel {
        const model = defaultProcessingModel()
        if (!titleSanitizationSupported.value) model.titleSanitization = null
        return model
    }

    function newLibraryProviderModels(): ProviderModel[] {
        return activeProviders
            .map(key => toProviderModel(key, defaultProviderConfig(key)))
            .sort((a, b) => providerLabel(a.name).localeCompare(providerLabel(b.name)))
    }

    function toLibraryRefs(ids: string[]): LibraryRef[] {
        return ids.map(id => ({ name: libraries.value.find(library => library.id == id)?.name, id: id }))
    }

    function libraryName(id: string): string {
        return libraries.value.find(l => l.id == id)?.name ?? ''
    }

    // -----------------------------------------------------------------------------------------------------------------
    // updates
    // -----------------------------------------------------------------------------------------------------------------

    function getUpdates(): KomfConfigUpdateDto {
        const config = currentConfig.value
        if (!config) throw Error('uninitialized config')

        const changes: KomfConfigUpdateDto = {}
        if (settings.mediaServer == MediaServer.Kavita)
            changes.kavita = getKavitaUpdates(config.kavita)
        else
            changes.komga = getKomgaUpdates(config.komga)
        changes.metadataProviders = getMetadataProvidersUpdates()
        changes.notifications = getNotificationUpdates(config.notifications)
        return changes
    }

    function getKomgaUpdates(current: KomgaConfigDto): KomgaConfigUpdateDto | undefined {
        const changes: KomgaConfigUpdateDto = {}
        if (komga.baseUri != current.baseUri)
            changes.baseUri = komga.baseUri
        if (komga.user != current.komgaUser)
            changes.komgaUser = komga.user
        if (!komga.passwordDisabled && komga.password != '')
            changes.komgaPassword = komga.password

        changes.eventListener = getEventListenerUpdates(current.eventListener, komga.eventListener, notifications.komgaLibraries)
        changes.metadataUpdate = getMetadataUpdates(current.metadataUpdate, komgaMetadata)
        return undefinedIfEmpty(changes)
    }

    function getKavitaUpdates(current: KavitaConfigDto): KavitaConfigUpdateDto | undefined {
        const changes: KavitaConfigUpdateDto = {}
        if (kavita.baseUri != current.baseUri)
            changes.baseUri = kavita.baseUri
        if (kavita.apiKey)
            changes.apiKey = kavita.apiKey

        changes.eventListener = getEventListenerUpdates(current.eventListener, kavita.eventListener, notifications.kavitaLibraries)
        changes.metadataUpdate = getMetadataUpdates(current.metadataUpdate, kavitaMetadata)
        return undefinedIfEmpty(changes)
    }

    function getEventListenerUpdates(
        current: EventListenerConfigDto,
        patch: { enabled: boolean, libraries: LibraryRef[] | null, excludeSeries: string[] | null },
        notificationLibraries: LibraryRef[] | null
    ): EventListenerConfigUpdateDto | undefined {
        const changes: EventListenerConfigUpdateDto = {}
        if (patch.enabled != current.enabled)
            changes.enabled = patch.enabled

        const libraryFilter = patch.libraries?.map(library => library.id) ?? []
        if (!equalArrays(libraryFilter, current.metadataLibraryFilter))
            changes.metadataLibraryFilter = libraryFilter

        const excludeFilter = patch.excludeSeries ?? []
        if (!equalArrays(excludeFilter, current.metadataSeriesExcludeFilter))
            changes.metadataExcludeSeriesFilter = excludeFilter

        const notificationsFilter = notificationLibraries?.map(library => library.id) ?? []
        if (!equalArrays(notificationsFilter, current.notificationsLibraryFilter))
            changes.notificationsLibraryFilter = notificationsFilter

        return undefinedIfEmpty(changes)
    }

    function getMetadataUpdates(
        current: MetadataUpdateConfigDto,
        patch: { default: ProcessingUpdateModel, library: ProcessingLibraryUpdateModel[] }
    ): MetadataUpdateConfigUpdateDto | undefined {
        const changes: MetadataUpdateConfigUpdateDto = {}
        changes.default = getMetadataProcessingUpdates(current.default, patch.default)
        changes.library = getLibraryMetadataUpdates(current.library, patch.library)
        return undefinedIfEmpty(changes)
    }

    function getMetadataProcessingUpdates(
        current: MetadataProcessingConfigDto | undefined,
        patch: ProcessingUpdateModel
    ): MetadataProcessingConfigUpdateDto | undefined {
        const changes: MetadataProcessingConfigUpdateDto = {}
        if (patch.libraryType != current?.libraryType)
            changes.libraryType = patch.libraryType
        if (patch.aggregateMetadata != current?.aggregate)
            changes.aggregate = patch.aggregateMetadata
        if (patch.mergeTags != current?.mergeTags)
            changes.mergeTags = patch.mergeTags
        if (patch.mergeGenres != current?.mergeGenres)
            changes.mergeGenres = patch.mergeGenres
        if (patch.bookCovers != current?.bookCovers)
            changes.bookCovers = patch.bookCovers
        if (patch.seriesCovers != current?.seriesCovers)
            changes.seriesCovers = patch.seriesCovers
        if (patch.overrideExistingCovers != current?.overrideExistingCovers)
            changes.overrideExistingCovers = patch.overrideExistingCovers
        if (patch.lockCovers != current?.lockCovers)
            changes.lockCovers = patch.lockCovers
        if (!equalArrays(patch.modes, current?.updateModes ?? []))
            changes.updateModes = patch.modes

        const currentPost = current?.postProcessing
        const post: MetadataPostProcessingConfigUpdateDto = {}
        if (patch.seriesTitle != currentPost?.seriesTitle)
            post.seriesTitle = patch.seriesTitle
        if (blankToNull(patch.seriesTitleLanguage) != blankToNull(currentPost?.seriesTitleLanguage))
            post.seriesTitleLanguage = blankToNull(patch.seriesTitleLanguage)
        if (patch.alternativeTitles != currentPost?.alternativeSeriesTitles)
            post.alternativeSeriesTitles = patch.alternativeTitles
        if (!equalArrays(patch.alternativeTitleLanguages, currentPost?.alternativeSeriesTitleLanguages ?? []))
            post.alternativeSeriesTitleLanguages = patch.alternativeTitleLanguages
        if (patch.fallbackToAltTitle != currentPost?.fallbackToAltTitle)
            post.fallbackToAltTitle = patch.fallbackToAltTitle
        if (patch.orderBooks != currentPost?.orderBooks)
            post.orderBooks = patch.orderBooks
        if (patch.respectBookNumberLock != currentPost?.respectBookNumberLock)
            post.respectBookNumberLock = patch.respectBookNumberLock
        if (blankToNull(patch.readingDirectionValue) != blankToNull(currentPost?.readingDirectionValue))
            post.readingDirectionValue = blankToNull(patch.readingDirectionValue)
        if (blankToNull(patch.languageValue) != blankToNull(currentPost?.languageValue))
            post.languageValue = blankToNull(patch.languageValue)
        if (blankToNull(patch.scoreTagName) != blankToNull(currentPost?.scoreTagName))
            post.scoreTagName = blankToNull(patch.scoreTagName)
        if (blankToNull(patch.originalPublisherTagName) != blankToNull(currentPost?.originalPublisherTagName))
            post.originalPublisherTagName = blankToNull(patch.originalPublisherTagName)

        const publisherTagNames = patch.publisherTagNames
            .filter(tag => tag.tagName.trim() != '' && tag.language.trim() != '')
        if (JSON.stringify(publisherTagNames) != JSON.stringify(currentPost?.publisherTagNames ?? []))
            post.publisherTagNames = publisherTagNames

        if (patch.titleSanitization) {
            const sanitization = {
                enabled: patch.titleSanitization.enabled,
                stripSuffixes: patch.titleSanitization.stripSuffixes.filter(s => s != ''),
                stripPatterns: patch.titleSanitization.stripPatterns.filter(s => s != ''),
            }
            const currentSanitization = currentPost?.titleSanitization && normalizeTitleSanitization(currentPost.titleSanitization)
            if (JSON.stringify(sanitization) != JSON.stringify(currentSanitization))
                post.titleSanitization = sanitization
        }

        changes.postProcessing = undefinedIfEmpty(post)
        return undefinedIfEmpty(changes)
    }

    function getLibraryMetadataUpdates(
        current: Record<string, MetadataProcessingConfigDto>,
        patch: ProcessingLibraryUpdateModel[]
    ): Record<string, MetadataProcessingConfigUpdateDto | null> | undefined {
        const currentLibrariesConfig = new Map(Object.entries(current ?? {}))
        const changes: Record<string, MetadataProcessingConfigUpdateDto | null> = {}
        for (const libraryConfig of patch) {
            const existing = currentLibrariesConfig.get(libraryConfig.id)
            if (libraryConfig.deleted) {
                if (existing) changes[libraryConfig.id] = null
                continue
            }
            const update = getMetadataProcessingUpdates(existing, libraryConfig)
            if (update !== undefined) changes[libraryConfig.id] = update
        }
        return undefinedIfEmpty(changes)
    }

    function getNotificationUpdates(current: NotificationConfigDto): NotificationConfigUpdateDto | undefined {
        const discord: NotificationConfigUpdateDto['discord'] = {}
        if (notifications.discord.seriesCover != current.discord.seriesCover)
            discord.seriesCover = notifications.discord.seriesCover
        discord.webhooks = getIndexedListUpdates(notifications.discord.webhooks)

        const apprise: NotificationConfigUpdateDto['apprise'] = {}
        if (notifications.apprise.seriesCover != current.apprise.seriesCover)
            apprise.seriesCover = notifications.apprise.seriesCover
        apprise.urls = getIndexedListUpdates(notifications.apprise.urls)

        return undefinedIfEmpty({
            discord: undefinedIfEmpty(discord),
            apprise: undefinedIfEmpty(apprise)
        })
    }

    // komf merges these lists by index: existing entries are masked and can only be removed (null),
    // new entries are appended after them
    function getIndexedListUpdates(entries: ListEntry[]): Record<number, string | null> | undefined {
        const changes: Record<number, string | null> = {}
        entries.forEach((entry, index) => {
            if (entry.existing) {
                if (entry.value === null) changes[index] = null
            } else if (entry.value && entry.value.trim() != '') {
                changes[index] = entry.value.trim()
            }
        })
        return undefinedIfEmpty(changes)
    }

    function getMetadataProvidersUpdates(): MetadataProvidersConfigUpdateDto | undefined {
        const current = currentConfig.value?.metadataProviders
        if (!current) throw Error('uninitialized config')

        const changes: MetadataProvidersConfigUpdateDto = {}
        if (!metadataProviders.malClientIdDisabled && blankToNull(metadataProviders.malClientId) != blankToNull(current.malClientId))
            changes.malClientId = blankToNull(metadataProviders.malClientId)
        if (!metadataProviders.comicVineClientIdDisabled && blankToNull(metadataProviders.comicVineClientId) != blankToNull(current.comicVineClientId))
            changes.comicVineClientId = blankToNull(metadataProviders.comicVineClientId)

        const searchLimit = toIntOrNull(metadataProviders.comicVineSearchLimit)
        if (searchLimit != (current.comicVineSearchLimit ?? null))
            changes.comicVineSearchLimit = searchLimit
        if (blankToNull(metadataProviders.comicVineIssueName) != blankToNull(current.comicVineIssueName))
            changes.comicVineIssueName = blankToNull(metadataProviders.comicVineIssueName)
        if (blankToNull(metadataProviders.comicVineIdFormat) != blankToNull(current.comicVineIdFormat))
            changes.comicVineIdFormat = blankToNull(metadataProviders.comicVineIdFormat)
        if (metadataProviders.nameMatchingMode != current.nameMatchingMode)
            changes.nameMatchingMode = metadataProviders.nameMatchingMode

        changes.defaultProviders = getProvidersUpdates(
            current.defaultProviders,
            metadataProviders.defaultProviders,
            metadataProviders.defaultDisabledProviders
        )
        changes.libraryProviders = getLibraryProvidersUpdates(current.libraryProviders)
        return undefinedIfEmpty(changes)
    }

    function getLibraryProvidersUpdates(
        current: Record<string, ProvidersConfigDto>
    ): Record<string, ProvidersConfigUpdateDto | null> | undefined {
        const currentLibrariesConfig = new Map(Object.entries(current ?? {}))
        const changes: Record<string, ProvidersConfigUpdateDto | null> = {}
        for (const libraryConfig of metadataProviders.libraryProviders) {
            const existing = currentLibrariesConfig.get(libraryConfig.id)
            if (libraryConfig.deleted) {
                if (existing) changes[libraryConfig.id] = null
                continue
            }
            const update = getProvidersUpdates(existing, libraryConfig.providers, libraryConfig.disabledProviders)
            if (update !== undefined) changes[libraryConfig.id] = update
        }
        return undefinedIfEmpty(changes)
    }

    function getProvidersUpdates(
        current: ProvidersConfigDto | undefined,
        enabled: ProviderModel[],
        disabled: ProviderModel[]
    ): ProvidersConfigUpdateDto | undefined {
        enabled.forEach((provider, index) => provider.priority = index + 1)

        const changes: ProvidersConfigUpdateDto = {}
        for (const provider of enabled.concat(disabled)) {
            if (!isKnownProvider(provider.name)) continue
            changes[provider.name as ProviderKey] = getProviderUpdates(current?.[provider.name], provider)
        }
        return undefinedIfEmpty(changes)
    }

    function getProviderUpdates(
        current: ProviderConfigDto | undefined,
        updated: ProviderModel
    ): ProviderConfigUpdateDto | undefined {
        const changes: ProviderConfigUpdateDto = {}
        if (updated.enabled != current?.enabled)
            changes.enabled = updated.enabled
        if (updated.priority != current?.priority)
            changes.priority = updated.priority
        if ((updated.nameMatchingMode ?? null) != (current?.nameMatchingMode ?? null))
            changes.nameMatchingMode = updated.nameMatchingMode ?? null
        if (!equalArrays(updated.authorRoles, current?.authorRoles ?? []))
            changes.authorRoles = updated.authorRoles
        if (!equalArrays(updated.artistRoles, current?.artistRoles ?? []))
            changes.artistRoles = updated.artistRoles
        if (updated.mediaType && updated.mediaType != current?.mediaType)
            changes.mediaType = updated.mediaType

        changes.seriesMetadata = getSeriesMetadataUpdates(current?.seriesMetadata, updated.seriesMetadata)
        if (updated.books && updated.bookMetadata)
            changes.bookMetadata = getBookMetadataUpdates(current?.bookMetadata ?? undefined, updated.bookMetadata)

        switch (updated.name) {
            case 'aniList': {
                const scoreThreshold = toIntOrNull(updated.tagsScoreThreshold ?? null)
                if (scoreThreshold != null && scoreThreshold != current?.tagsScoreThreshold)
                    changes.tagsScoreThreshold = scoreThreshold
                const sizeLimit = toIntOrNull(updated.tagsSizeLimit ?? null)
                if (sizeLimit != null && sizeLimit != current?.tagsSizeLimit)
                    changes.tagsSizeLimit = sizeLimit
                break
            }
            case 'mangaDex':
                if (updated.coverLanguages && !equalArrays(updated.coverLanguages, current?.coverLanguages ?? []))
                    changes.coverLanguages = updated.coverLanguages
                if (updated.links && !equalArrays(updated.links, current?.links ?? []))
                    changes.links = updated.links
                break
            case 'mangaBaka':
                if (updated.mode && updated.mode != current?.mode)
                    changes.mode = updated.mode
                break
        }

        return undefinedIfEmpty(changes)
    }

    function getSeriesMetadataUpdates(
        current: SeriesMetadataConfigDto | undefined,
        updated: SeriesMetadataConfigDto
    ): SeriesMetadataConfigUpdateDto | undefined {
        const changes: Record<string, boolean | string | null> = {}
        for (const [key, value] of Object.entries(updated) as [keyof SeriesMetadataConfigDto, boolean | string | null | undefined][]) {
            if (typeof value == 'boolean') {
                if (value != current?.[key]) changes[key] = value
            } else {
                // publisher tag names: blank means unset
                const normalized = blankToNull(value)
                if (normalized != blankToNull(current?.[key] as string | null | undefined)) changes[key] = normalized
            }
        }
        return undefinedIfEmpty(changes as SeriesMetadataConfigUpdateDto)
    }

    function getBookMetadataUpdates(
        current: BookMetadataConfigDto | undefined,
        updated: BookMetadataConfigDto
    ): BookMetadataConfigUpdateDto | undefined {
        const changes: BookMetadataConfigUpdateDto = {}
        for (const key of Object.keys(updated) as (keyof BookMetadataConfigDto)[]) {
            if (updated[key] != current?.[key]) changes[key] = updated[key]
        }
        return undefinedIfEmpty(changes)
    }

    return {
        currentConfig,
        titleSanitizationSupported,
        notifications,
        metadataProviders,
        komgaMetadata,
        kavitaMetadata,
        libraries,
        kavita,
        komga,
        reset,
        getUpdates,
        newLibraryProcessingModel,
        newLibraryProviderModels,
    }
})

export function providerLabel(key: string): string {
    return providerDisplayNames[key] ?? key
}

function toProviderModel(key: string, config: ProviderConfigDto): ProviderModel {
    const model: ProviderModel = {
        ...structuredClone(config),
        name: key,
        books: providersWithBooks.includes(key),
        mediaTypeEnabled: providersWithMediaType.includes(key),
    }
    if (model.books && !model.bookMetadata) model.bookMetadata = defaultProviderConfig(key).bookMetadata
    return model
}

function toProviderModels(providers: ProvidersConfigDto): { enabled: ProviderModel[], disabled: ProviderModel[] } {
    const models = Object.entries(providers)
        .filter((entry): entry is [string, ProviderConfigDto] => entry[1] != undefined && isKnownProvider(entry[0]))
        .map(([key, value]) => toProviderModel(key, value))

    return {
        enabled: models.filter(provider => provider.enabled)
            .sort((a, b) => a.priority - b.priority),
        // deprecated providers can be disabled but not re-added
        disabled: models.filter(provider => !provider.enabled && (activeProviders as readonly string[]).includes(provider.name))
            .sort((a, b) => providerLabel(a.name).localeCompare(providerLabel(b.name)))
    }
}

function defaultProcessingModel(): ProcessingUpdateModel {
    return {
        libraryType: 'MANGA',
        aggregateMetadata: false,
        mergeTags: false,
        mergeGenres: false,
        modes: ['API'],
        bookCovers: false,
        seriesCovers: false,
        overrideExistingCovers: true,
        lockCovers: true,
        seriesTitle: false,
        seriesTitleLanguage: 'en',
        alternativeTitles: false,
        alternativeTitleLanguages: ['en', 'ja', 'ja-ro'],
        fallbackToAltTitle: false,
        orderBooks: false,
        respectBookNumberLock: true,
        readingDirectionValue: null,
        languageValue: null,
        scoreTagName: null,
        originalPublisherTagName: null,
        publisherTagNames: [],
        titleSanitization: { enabled: false, stripSuffixes: [], stripPatterns: [] }
    }
}

function toProcessingModel(config: MetadataProcessingConfigDto): ProcessingUpdateModel {
    const post = config.postProcessing
    return {
        libraryType: config.libraryType,
        aggregateMetadata: config.aggregate,
        mergeTags: config.mergeTags,
        mergeGenres: config.mergeGenres,
        modes: [...config.updateModes],
        bookCovers: config.bookCovers,
        seriesCovers: config.seriesCovers,
        overrideExistingCovers: config.overrideExistingCovers,
        lockCovers: config.lockCovers,
        seriesTitle: post.seriesTitle,
        seriesTitleLanguage: post.seriesTitleLanguage,
        alternativeTitles: post.alternativeSeriesTitles ?? false,
        alternativeTitleLanguages: [...post.alternativeSeriesTitleLanguages],
        fallbackToAltTitle: post.fallbackToAltTitle,
        orderBooks: post.orderBooks,
        respectBookNumberLock: post.respectBookNumberLock,
        readingDirectionValue: post.readingDirectionValue,
        languageValue: post.languageValue,
        scoreTagName: post.scoreTagName,
        originalPublisherTagName: post.originalPublisherTagName,
        publisherTagNames: post.publisherTagNames.map(tag => ({ ...tag })),
        titleSanitization: post.titleSanitization ? normalizeTitleSanitization(post.titleSanitization) : null
    }
}

// older fork builds don't return every field
function normalizeTitleSanitization(config: Partial<TitleSanitizationConfigDto>): TitleSanitizationConfigDto {
    return {
        enabled: config.enabled ?? false,
        stripSuffixes: [...(config.stripSuffixes ?? [])],
        stripPatterns: [...(config.stripPatterns ?? [])],
    }
}

function undefinedIfEmpty<T extends object>(obj: T): T | undefined {
    return Object.values(obj).every(val => val === undefined) ? undefined : obj
}

function blankToNull(value: string | null | undefined): string | null {
    if (value == null || value.trim() == '') return null
    return value
}

function toIntOrNull(value: number | string | null): number | null {
    if (value === null || value === '') return null
    const parsed = typeof value == 'number' ? value : parseInt(value)
    return isNaN(parsed) ? null : parsed
}

function equalArrays(a1: unknown[], a2: unknown[]): boolean {
    return a1.length == a2.length && a1.every((elem, index) => elem == a2[index])
}

export interface ProcessingUpdateModel {
    libraryType: string,
    aggregateMetadata: boolean,
    mergeTags: boolean,
    mergeGenres: boolean,
    modes: string[],
    bookCovers: boolean,
    seriesCovers: boolean,
    overrideExistingCovers: boolean,
    lockCovers: boolean,
    seriesTitle: boolean,
    seriesTitleLanguage: string | null,
    alternativeTitles: boolean,
    alternativeTitleLanguages: string[],
    fallbackToAltTitle: boolean,
    orderBooks: boolean,
    respectBookNumberLock: boolean,
    readingDirectionValue: string | null,
    languageValue: string | null,
    scoreTagName: string | null,
    originalPublisherTagName: string | null,
    publisherTagNames: PublisherTagNameConfigDto[],
    // null when the connected komf does not support title sanitization (upstream komf)
    titleSanitization: TitleSanitizationConfigDto | null,
}

export interface ProcessingLibraryUpdateModel extends ProcessingUpdateModel {
    id: string,
    name: string,
    deleted: boolean,
}
