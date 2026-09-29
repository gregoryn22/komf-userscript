<template>
  <div class="col-auto" style="padding: 8px 0 0 0">
    <span class="text-body2">{{ label }}</span>
    <template v-for="(entry, i) in entries" :key="i">
      <div class="row q-pt-sm" v-if="entry.value != null">
        <div class="col">
          <q-input
            v-model="entry.value"
            autogrow
            filled
            dense
            :disable="entry.existing"
          />
        </div>

        <div class="col-auto">
          <q-btn
            @click="removeEntry(i)"
            flat
            round
            :icon="komga ? 'mdi-delete' :'fa fa-trash'"
            :size="komga ? 'md':'sm'"
          />
        </div>
      </div>
    </template>
  </div>

  <div class="col-auto" style="padding: 8px 0 0 0">
    <div class="row">
      <q-space />
      <q-btn
        round
        size="sm"
        color="secondary"
        @click="entries.push({ value: '', existing: false })"
        :icon="komga ? 'mdi-plus' :'fa fa-plus'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'
import type { ListEntry } from '@/stores/configUpdate'

const props = defineProps({
    label: {
        type: String,
        required: true
    },
    entries: {
        type: Array as PropType<ListEntry[]>,
        required: true
    }
})

const settings = useSettingsStore()
const komga = computed(() => settings.mediaServer === MediaServer.Komga)

// existing entries keep their index (komf merges by index) and are marked for removal instead
function removeEntry(index: number) {
    const entry = props.entries[index]
    if (entry.existing) entry.value = null
    else props.entries.splice(index, 1)
}
</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';
</style>
