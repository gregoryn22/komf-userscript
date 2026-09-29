import type { AxiosInstance } from 'axios'
import { useSettingsStore } from '@/stores/settings'
import type { KomfConfigDto, KomfConfigUpdateDto } from '@/types/komf-config'
import type { DownloadProgressEvent } from '@/types/metadata'
import { errorMessage } from '@/services/komf-metadata.service'

export type ProviderDatabase = 'manga-baka' | 'book-walker'

export default class KomfConfigService {
    private http: AxiosInstance
    private settings = useSettingsStore()

    constructor(http: AxiosInstance) {
        this.http = http
    }

    async getConfig(): Promise<KomfConfigDto> {
        return this.getConfigFromUrl(this.settings.komfUrl)
    }

    async getConfigFromUrl(url: string): Promise<KomfConfigDto> {
        let config
        try {
            config = (await this.http.get(`${url}/api/config`)).data
        } catch (e: unknown) {
            throw new Error(errorMessage('Failed to retrieve config', e))
        }

        if (typeof config != 'object' || !('metadataProviders' in config) || !('notifications' in config)) {
            throw new Error('Connection Failed: unexpected response. Is this a komf version that serves /api routes?')
        }

        return config
    }

    async updateConfig(config: KomfConfigUpdateDto) {
        try {
            await this.http.patch(`${this.settings.komfUrl}/api/config`, config)
        } catch (e: unknown) {
            throw new Error(errorMessage('Failed to update config', e))
        }
    }

    /**
     * Triggers a provider database download. komf streams newline-delimited JSON progress events
     * for the duration of the download.
     */
    async updateDatabase(database: ProviderDatabase, onEvent: (event: DownloadProgressEvent) => void) {
        const response = await fetch(`${this.settings.komfUrl}/api/update-${database}-db`, { method: 'POST' })
        if (!response.ok || !response.body) {
            throw new Error(`Database update failed: ${response.status} ${response.statusText}`)
        }

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
        let buffer = ''
        for (; ;) {
            const { done, value } = await reader.read()
            if (value) buffer += value
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
                if (line.trim() == '') continue
                onEvent(JSON.parse(line) as DownloadProgressEvent)
            }
            if (done) break
        }
        if (buffer.trim() != '') onEvent(JSON.parse(buffer) as DownloadProgressEvent)
    }
}
