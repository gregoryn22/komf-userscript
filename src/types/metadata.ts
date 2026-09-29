export interface SearchResult {
    url: string | null,
    imageUrl: string | null,
    title: string,
    provider: string
    resultId: string,
}

export interface IdentifyRequest {
    libraryId?: string,
    seriesId: string,
    provider: string,
    providerSeriesId: string,
}

export interface MetadataJobResponse {
    jobId: string
}

export interface MediaServerLibrary {
    id: string,
    name: string,
    roots: string[],
}

export type MetadataJobEvent =
    { type: 'ProviderSeriesEvent', provider: string } |
    { type: 'ProviderBookEvent', provider: string, totalBooks: number, bookProgress: number } |
    { type: 'ProviderCompletedEvent', provider: string } |
    { type: 'ProviderErrorEvent', provider: string, message: string } |
    { type: 'PostProcessingStartEvent' } |
    { type: 'ProcessingErrorEvent', message: string }

export type DownloadProgressEvent =
    { type: 'ProgressEvent', total: number, completed: number, info: string | null } |
    { type: 'FinishedEvent' } |
    { type: 'ErrorEvent', message: string } |
    { type: 'HeartbeatEvent' }
