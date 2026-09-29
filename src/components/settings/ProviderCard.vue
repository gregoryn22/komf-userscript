<template>
  <q-card bordered class="draggable provider-card q-mb-sm">
    <q-card-section class="q-pa-sm">
      <div class="column">
        <div class="col-auto" style="padding: 0">
          <div class="row items-center">
            <q-icon class="provider-handle"
                    :size="komga ? 'sm' : 'xs'"
                    :name="komga ? 'mdi-drag' : 'fa fa-grip-vertical'"
            />
            {{ `${index + 1} - ${providerLabel(provider.name)}` }}
            <q-space />
            <q-btn
              @click="emit('remove')"
              flat
              round
              :icon="komga ? 'mdi-close' : 'fa fa-xmark'"
              :size="komga ? 'sm' : 'xs'"
            />
          </div>
        </div>
        <div class="col-auto full-width" style="padding: 0">
          <q-expansion-item :ref="el => emit('expansion-ref', el)"
                            dense
                            dense-toggle
                            expand-separator
                            label="Options"
          >
            <q-card>
              <q-card-section class="q-pa-sm">
                <q-expansion-item dense dense-toggle expand-separator label="Series Metadata">
                  <q-checkbox v-for="field in seriesFields" :key="field.key"
                              v-model="provider.seriesMetadata[field.key]"
                              :label="field.label"
                  />
                </q-expansion-item>

                <q-expansion-item dense dense-toggle expand-separator label="Book Metadata"
                                  v-if="provider.books && provider.bookMetadata"
                >
                  <q-checkbox v-model="provider.seriesMetadata.books" label="Enabled" />
                  <q-checkbox v-for="field in bookFields" :key="field.key"
                              v-model="provider.bookMetadata[field.key]"
                              :disable="!provider.seriesMetadata.books"
                              :label="field.label"
                  />
                </q-expansion-item>

                <q-expansion-item dense dense-toggle expand-separator label="Misc">
                  <div v-if="provider.name === 'mangaBaka'" class="col-auto" style="padding: 8px 0 0 0">
                    <q-select v-model="provider.mode"
                              :options="['API', 'DATABASE']"
                              label="Mode"
                              hint="DATABASE uses a local copy of the MangaBaka database (download it below)"
                              dense
                              filled
                    />
                  </div>

                  <template v-if="provider.name === 'mangaDex'">
                    <div class="col-auto" style="padding: 8px 0 0 0">
                      <q-select v-model="provider.coverLanguages"
                                label="Cover Languages"
                                filled
                                dense
                                use-input
                                use-chips
                                multiple
                                hide-dropdown-icon
                                input-debounce="0"
                                new-value-mode="add-unique"
                                hint="ISO 639-1 language codes"
                      />
                    </div>
                    <div class="col-auto" style="padding: 8px 0 0 0">
                      <q-select v-model="provider.links"
                                :options="mangaDexLinkOptions"
                                label="Links"
                                dense
                                filled
                                multiple
                                use-chips
                      />
                    </div>
                  </template>

                  <template v-if="provider.name === 'aniList'">
                    <div class="col-auto" style="padding: 8px 0 0 0">
                      <q-input v-model.number="provider.tagsScoreThreshold"
                               type="number"
                               label="Tags Score Threshold"
                               dense
                               filled
                      />
                    </div>
                    <div class="col-auto" style="padding: 8px 0 0 0">
                      <q-input v-model.number="provider.tagsSizeLimit"
                               type="number"
                               label="Tags Size Limit"
                               dense
                               filled
                      />
                    </div>
                  </template>

                  <div v-if="provider.mediaTypeEnabled" class="col-auto" style="padding: 8px 0 0 0">
                    <q-select v-model="provider.mediaType"
                              :options="mediaTypeOptions"
                              label="Media Type"
                              dense
                              filled
                    />
                  </div>

                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-select v-model="provider.nameMatchingMode"
                              :options="matchingModeOptions"
                              label="Name Matching Mode"
                              dense
                              filled
                              clearable
                    />
                  </div>

                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-select v-model="provider.authorRoles"
                              :options="rolesOptions"
                              dense
                              filled
                              multiple
                              label="Author Roles"
                    />
                  </div>

                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-select v-model="provider.artistRoles"
                              :options="rolesOptions"
                              dense
                              filled
                              multiple
                              label="Artist Roles"
                    />
                  </div>

                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-input v-model="provider.seriesMetadata.englishPublisherTagName"
                             label="English Publisher Tag Name"
                             dense
                             filled
                    />
                  </div>
                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-input v-model="provider.seriesMetadata.originalPublisherTagName"
                             label="Original Publisher Tag Name"
                             dense
                             filled
                    />
                  </div>
                  <div class="col-auto" style="padding: 8px 0 0 0">
                    <q-input v-model="provider.seriesMetadata.frenchPublisherTagName"
                             label="French Publisher Tag Name"
                             dense
                             filled
                    />
                  </div>
                </q-expansion-item>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'
import { providerLabel, type ProviderModel } from '@/stores/configUpdate'
import { type BookMetadataConfigDto, mangaDexLinkOptions, type SeriesMetadataConfigDto } from '@/types/komf-config'

defineProps({
    provider: {
        type: Object as PropType<ProviderModel>,
        required: true
    },
    index: {
        type: Number,
        required: true
    }
})
const emit = defineEmits(['remove', 'expansion-ref'])

const settings = useSettingsStore()
const komga = computed(() => settings.mediaServer === MediaServer.Komga)

const matchingModeOptions = ['CLOSEST_MATCH', 'EXACT']
const rolesOptions = ['WRITER', 'PENCILLER', 'INKER', 'COLORIST', 'LETTERER', 'COVER', 'EDITOR', 'TRANSLATOR']
const mediaTypeOptions = ['MANGA', 'NOVEL']

type BooleanKeys<T> = { [K in keyof T]-?: T[K] extends boolean ? K : never }[keyof T]

const seriesFields: { key: BooleanKeys<SeriesMetadataConfigDto>, label: string }[] = [
    { key: 'ageRating', label: 'Age Rating' },
    { key: 'authors', label: 'Authors' },
    { key: 'thumbnail', label: 'Cover' },
    { key: 'genres', label: 'Genres' },
    { key: 'language', label: 'Language' },
    { key: 'links', label: 'Links' },
    { key: 'publisher', label: 'Publisher' },
    { key: 'useOriginalPublisher', label: 'Use Original Publisher' },
    { key: 'readingDirection', label: 'Reading Direction' },
    { key: 'releaseDate', label: 'Release Date' },
    { key: 'status', label: 'Status' },
    { key: 'summary', label: 'Summary' },
    { key: 'tags', label: 'Tags' },
    { key: 'title', label: 'Title' },
    { key: 'totalBookCount', label: 'Book Count' },
]

const bookFields: { key: keyof BookMetadataConfigDto, label: string }[] = [
    { key: 'authors', label: 'Authors' },
    { key: 'thumbnail', label: 'Cover' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'links', label: 'Links' },
    { key: 'number', label: 'Number' },
    { key: 'numberSort', label: 'Number Sort' },
    { key: 'releaseDate', label: 'Release Date' },
    { key: 'summary', label: 'Summary' },
    { key: 'tags', label: 'Tags' },
    { key: 'title', label: 'Title' },
]
</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';

.provider-handle {
  cursor: move;
}
</style>
