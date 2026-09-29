<template>
  <div class="column q-pt-sm">
    <div class="row items-center">
      <div class="col">
        <div class="text-body2">{{ label }} database</div>
        <div class="text-caption text-grey">
          {{ lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleString()}` : 'Not downloaded' }}
        </div>
      </div>
      <div class="col-auto">
        <q-btn color="secondary" no-caps :loading="running" @click="update">
          {{ lastUpdated ? 'Update' : 'Download' }}
        </q-btn>
      </div>
    </div>
    <div v-if="running || message" class="col-auto q-pt-xs">
      <q-linear-progress v-if="running" :value="progress ?? undefined" :indeterminate="progress == null" color="secondary" />
      <div class="text-caption">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type PropType, ref } from 'vue'
import { useQuasar } from 'quasar'
import { komfConfigKey } from '@/injection-keys'
import type KomfConfigService from '@/services/komf-config.service'
import type { ProviderDatabase } from '@/services/komf-config.service'
import { errorNotification } from '@/errorNotification'

const props = defineProps({
    database: {
        type: String as PropType<ProviderDatabase>,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: String as PropType<string | null>,
        default: null
    }
})

const $q = useQuasar()
const configService = inject<KomfConfigService>(komfConfigKey) as KomfConfigService

const running = ref(false)
const progress = ref<number | null>(null)
const message = ref('')

async function update() {
    running.value = true
    progress.value = null
    message.value = 'Starting download...'
    try {
        await configService.updateDatabase(props.database, event => {
            switch (event.type) {
                case 'ProgressEvent':
                    progress.value = event.total > 0 ? event.completed / event.total : null
                    message.value = event.info ?? `${event.completed} / ${event.total}`
                    break
                case 'FinishedEvent':
                    message.value = 'Finished. Reopen settings to refresh the timestamp'
                    break
                case 'ErrorEvent':
                    message.value = `Error: ${event.message}`
                    break
            }
        })
    } catch (e) {
        message.value = ''
        errorNotification(e, $q)
    }
    running.value = false
}
</script>
