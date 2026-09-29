import axios, { type AxiosInstance } from 'axios'
import type { IdentifyRequest, MediaServerLibrary, MetadataJobEvent, MetadataJobResponse, SearchResult } from '@/types/metadata'
import { useSettingsStore } from '@/stores/settings'

const jobEventNames = [
    'ProviderSeriesEvent',
    'ProviderBookEvent',
    'ProviderCompletedEvent',
    'ProviderErrorEvent',
    'PostProcessingStartEvent',
    'ProcessingErrorEvent'
] as const

export default class KomfMetadataService {
    private http: AxiosInstance
    private settings = useSettingsStore()

    constructor(http: AxiosInstance) {
        this.http = http
    }

    private serverUrl(baseUrl: string = this.settings.komfUrl) {
        return `${baseUrl}/api/${this.settings.mediaServer}`
    }

    async searchSeries(seriesName: string, libraryId?: string, seriesId?: string): Promise<SearchResult[]> {
        try {
            return (
                await this.http.get(`${this.serverUrl()}/metadata/search`, {
                    params: { name: seriesName, libraryId: libraryId, seriesId: seriesId },
                    paramsSerializer: { indexes: null }
                })
            ).data
        } catch (e: unknown) {
            throw new Error(errorMessage('Failed to retrieve search results', e))
        }
    }

    seriesCoverUrl(libraryId: string, provider: string, providerSeriesId: string): string {
        const params = new URLSearchParams({ libraryId, provider, providerSeriesId })
        return `${this.serverUrl()}/metadata/series-cover?${params}`
    }

    async identifySeries(request: IdentifyRequest): Promise<MetadataJobResponse> {
        try {
            return (await this.http.post(`${this.serverUrl()}/metadata/identify`, request)).data
        } catch (e) {
            throw new Error(errorMessage('Failed to identify series', e))
        }
    }

    async matchLibrary(libraryId: string) {
        try {
            await this.http.post(`${this.serverUrl()}/metadata/match/library/${libraryId}`)
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status == 409)
                throw new Error('Failed to match library: Scan is already in progress')
            throw new Error(errorMessage('Failed to match library', e))
        }
    }

    async matchSeries(libraryId: string, seriesId: string): Promise<MetadataJobResponse> {
        try {
            return (await this.http.post(`${this.serverUrl()}/metadata/match/library/${libraryId}/series/${seriesId}`)).data
        } catch (e) {
            throw new Error(errorMessage('Failed to match series', e))
        }
    }

    async resetSeries(libraryId: string, seriesId: string, removeComicInfo: boolean) {
        try {
            await this.http.post(
                `${this.serverUrl()}/metadata/reset/library/${libraryId}/series/${seriesId}`,
                null,
                { params: { removeComicInfo } }
            )
        } catch (e) {
            throw new Error(errorMessage('Failed to reset series', e))
        }
    }

    async resetLibrary(libraryId: string, removeComicInfo: boolean) {
        try {
            await this.http.post(
                `${this.serverUrl()}/metadata/reset/library/${libraryId}`,
                null,
                { params: { removeComicInfo } }
            )
        } catch (e) {
            throw new Error(errorMessage('Failed to reset library', e))
        }
    }

    async getLibraries(baseUrl?: string): Promise<MediaServerLibrary[]> {
        try {
            return (await this.http.get(`${this.serverUrl(baseUrl)}/media-server/libraries`)).data
        } catch (e) {
            throw new Error(errorMessage('Failed to retrieve libraries', e))
        }
    }

    async checkConnection(url: string) {
        let data
        try {
            data = (await this.http.get(`${this.serverUrl(url)}/metadata/providers`)).data
        } catch (e) {
            throw new Error(errorMessage('Connection Failed', e))
        }

        if (!Array.isArray(data)) {
            throw new Error('Connection Failed')
        }
    }

    /**
     * Subscribes to metadata job progress over SSE. `onClose` fires when the job stream ends.
     * Returns a function that cancels the subscription.
     */
    subscribeToJob(jobId: string, onEvent: (event: MetadataJobEvent) => void, onClose: () => void): () => void {
        const source = new EventSource(`${this.settings.komfUrl}/api/jobs/${jobId}/events`)
        let closed = false
        const close = () => {
            if (closed) return
            closed = true
            source.close()
            onClose()
        }

        for (const name of jobEventNames) {
            source.addEventListener(name, (message) => {
                let data = {}
                try {
                    data = JSON.parse((message as MessageEvent).data || '{}')
                } catch { /* PostProcessingStartEvent may carry no payload */ }
                onEvent({ ...data, type: name } as MetadataJobEvent)
            })
        }
        source.addEventListener('EventStreamNotFoundEvent', close)
        // server closes the stream on job completion which surfaces as an error on EventSource
        source.onerror = close
        return close
    }
}

export function errorMessage(prefix: string, e: unknown): string {
    if (axios.isAxiosError(e)) {
        const body = e.response?.data
        const detail = typeof body == 'object' && body && 'message' in body ? body.message : e.message
        return `${prefix}: ${detail}`
    }
    if (e instanceof Error) return `${prefix}: ${e.message}`
    return prefix
}
