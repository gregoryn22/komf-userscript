<template>
  <q-tabs
    v-model="tab"
    dense
    class="text-grey"
    active-color="primary"
    indicator-color="primary"
    align="justify"
    narrow-indicator
    :key="tabsKey"
  >
    <q-tab name="default" label="Default" no-caps />
    <template v-for="(library,index) in model.library" :key="library.id">
      <q-tab :name="library.id" v-if="!library.deleted" no-caps>
        <div>
          {{ `${library.name} (${library.id})` }}
          <q-btn flat
                 size="xs"
                 :icon-right="settings.mediaServer === MediaServer.Komga? 'mdi-close' :'fa fa-xmark'"
                 @click="removeLibrary(index)"
          >
          </q-btn>
        </div>
      </q-tab>

    </template>
    <q-btn
      v-if="getLibraries().length"
      flat
    >
      <div class="col-auto">
        Library
      </div>
      <div class="col-auto q-ml-sm">
        <q-icon :name="settings.mediaServer === MediaServer.Komga? 'mdi-plus' :'fa fa-plus'" />
      </div>

      <q-menu fit>
        <q-list dense v-for="library in getLibraries()" :key="library.id">
          <q-item clickable v-close-popup @click="addLibrary(library.id)">
            <q-item-section>
              <q-item-label>{{ library.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

      </q-menu>
    </q-btn>

  </q-tabs>

  <q-separator />

  <q-tab-panels v-model="tab" ref="tabPanel" animated>
    <q-tab-panel name="default" style="padding: 8px 0 0 0">
      <ProcessingForm :model="model.default" />
    </q-tab-panel>

    <template v-for="library in model.library" :key="library.id">
      <q-tab-panel :name="library.id" v-if="!library.deleted" style="padding: 8px 0 0 0">
        <ProcessingForm :model="library" />
      </q-tab-panel>
    </template>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { useConfigUpdateStore } from '@/stores/configUpdate'
import MediaServer from '@/types/mediaServer'
import { QTabPanels } from 'quasar'
import { computed, nextTick, ref } from 'vue'
import ProcessingForm from '@/components/settings/ProcessingForm.vue'

const settings = useSettingsStore()
const config = useConfigUpdateStore()

const model = settings.mediaServer === MediaServer.Kavita
    ? config.kavitaMetadata
    : config.komgaMetadata

const tab = ref('default')
const tabsKey = computed(() => model.library.map(p => p.deleted).join())
const tabPanel = ref<InstanceType<typeof QTabPanels> | null>(null)

async function addLibrary(id: string) {
    let existing = model.library.find(library => library.id == id)
    if (existing) {
        existing.deleted = false
        await nextTick()
        tabPanel.value?.goTo(id)
        return
    }
    model.library.push({
        ...config.newLibraryProcessingModel(),
        id: id,
        name: config.libraries.find(l => l.id == id)?.name ?? '',
        deleted: false,
    })

    await nextTick()
    tabPanel.value?.goTo(id)
}

function removeLibrary(index: number) {
    model.library[index].deleted = true
    tabPanel.value?.goTo('default')
}

function getLibraries() {
    let libraryConfigs = model.library
    return config.libraries.filter(library => !libraryConfigs.find(conf => !conf.deleted && conf.id == library.id))
}

</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';
</style>
