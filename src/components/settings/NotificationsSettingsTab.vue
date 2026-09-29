<template>
  <div class="column">
    <div class="text-h6 gt-xs q-pb-lg">
      <q-icon :name="komga ? 'mdi-bell' :'fa fa-bell'" />
      Notifications
    </div>

    <div class="col-auto" style="padding: 8px 0 8px 0">
      <q-select
        v-if="komga"
        filled
        v-model="config.komgaLibraries"
        multiple
        clearable
        :options="configStore.libraries"
        :option-label="libraryLabel"
        label="Notify for Libraries"
        hint="will notify for all libraries if empty"
      />
      <q-select
        v-else
        filled
        v-model="config.kavitaLibraries"
        multiple
        clearable
        :options="configStore.libraries"
        :option-label="libraryLabel"
        label="Notify for Libraries"
        hint="will notify for all libraries if empty"
      />
    </div>

    <q-separator />

    <div class="text-subtitle1 q-pt-md">Discord</div>
    <div class="col-auto">
      <q-checkbox v-model="config.discord.seriesCover" label="Upload Series Cover" />
    </div>
    <NotificationTargetList label="Webhooks" :entries="config.discord.webhooks" />

    <q-separator class="q-mt-md" />

    <div class="text-subtitle1 q-pt-md">Apprise</div>
    <div class="col-auto">
      <q-checkbox v-model="config.apprise.seriesCover" label="Attach Series Cover" />
    </div>
    <NotificationTargetList label="Apprise URLs" :entries="config.apprise.urls" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'
import { type LibraryRef, useConfigUpdateStore } from '@/stores/configUpdate'
import NotificationTargetList from '@/components/settings/NotificationTargetList.vue'

const settings = useSettingsStore()
const configStore = useConfigUpdateStore()
const config = configStore.notifications
const komga = computed(() => settings.mediaServer === MediaServer.Komga)

function libraryLabel(library: LibraryRef) {
    return `${library.name} (${library.id})`
}
</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';
</style>
