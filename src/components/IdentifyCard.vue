<template>
  <q-card v-ripple @click="onClick"
          :class="`${selected ? 'item-border' : '' } identify-card cursor-pointer q-hoverable`"
  >
    <span class="q-focus-helper"></span>

    <q-card-section horizontal class="card-border">
      <div class="full-width" style="padding: 0">
        <q-img
          :src="imageUrl" ratio="0.7071"
          referrerpolicy="no-referrer"
        >
          <a v-if="item.url"
             :href="item.url"
             target="_blank"
             rel="noopener noreferrer"
             class="absolute-top-right source-link"
             title="Open on provider site"
             @click.stop
          >
            <q-icon :name="komga ? 'mdi-open-in-new' : 'fa fa-arrow-up-right-from-square'" size="xs" />
          </a>
        </q-img>

        <q-card-section class="full-width">
          <div class="text-center ellipsis-2-lines" style="max-height:42px;height:42px">
            {{ item.title }}
            <q-tooltip :delay="500">{{ item.title }}</q-tooltip>
          </div>

          <div class="text-center text-weight-bold ellipsis">{{ providerName }}</div>
        </q-card-section>
      </div>
    </q-card-section>

  </q-card>
</template>

<script setup lang="ts">
import type { SearchResult } from '@/types/metadata'
import type { PropType } from 'vue'
import { computed, inject } from 'vue'
import { komfMetadataKey } from '@/injection-keys'
import type KomfMetadataService from '@/services/komf-metadata.service'
import { providerDisplayName } from '@/jobProgress'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'

const emit = defineEmits(['on-select-result'])
const props = defineProps({
    item: {
        type: Object as PropType<SearchResult>,
        required: true
    },
    selected: {
        type: Boolean,
        required: true
    },
    libraryId: {
        type: String,
        required: false
    },
    width: {
        type: [String],
        required: false,
        default: '160px'
    }
})
const metadataService = inject<KomfMetadataService>(komfMetadataKey) as KomfMetadataService
const komga = useSettingsStore().mediaServer === MediaServer.Komga

const providerName = computed(() => providerDisplayName(props.item.provider))

// some providers don't return a thumbnail url with search results; komf can proxy the cover instead
const imageUrl = computed(() => {
    if (props.item.imageUrl) return props.item.imageUrl
    if (!props.libraryId) return undefined
    return metadataService.seriesCoverUrl(props.libraryId, props.item.provider, props.item.resultId)
})

function onClick() {
    emit('on-select-result', props.item)
}
</script>

<style scoped lang="scss">
.identify-card {
  max-width: v-bind(width);
  width: v-bind(width);
  border: 3px solid transparent;
}

.identify-card:hover {
  border: 3px solid $highlight;
}

.source-link {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 4px;
  border-bottom-left-radius: 4px;
}

.item-border {
  border: 3px solid $highlight;
}
</style>
