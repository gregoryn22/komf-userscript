<template>
  <q-card flat style="max-height: 750px">
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
      <template v-for="(library,index) in config.libraryProviders" :key="library.id">
        <q-tab :name="library.id" v-if="!library.deleted" no-caps>
          <div>
            {{ `${library.name} (${library.id})` }}
            <q-btn flat
                   size="xs"
                   :icon-right="komga ? 'mdi-close' :'fa fa-xmark'"
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
          <q-icon :name="komga ? 'mdi-plus' :'fa fa-plus'" />
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
        <div class="column">
          <div class="col-auto" style="padding: 0">
            <Sortable
              :list="config.defaultProviders"
              item-key="name"
              :options="sortableOptions"
              :key="config.defaultProviders.length"
              @end="(event)=> moveItemInArray(config.defaultProviders,event.oldIndex!, event.newIndex!)"
              @start="() => hideExpandedProviders()"
            >
              <template #item="{element, index}">
                <ProviderCard :key="element.name"
                              :provider="element"
                              :index="index"
                              @remove="disableProvider(config.defaultProviders, config.defaultDisabledProviders, index)"
                              @expansion-ref="addExpansionItemRef"
                />
              </template>
            </Sortable>
          </div>

          <div class="col-auto">
            <q-btn color="secondary" :disable="config.defaultDisabledProviders.length == 0">
              <div class="col-auto">
                Add New
              </div>
              <div class="col-auto q-ml-sm">
                <q-icon :name="komga ? 'mdi-plus' :'fa fa-plus'" />
              </div>
              <q-menu auto-close>
                <q-list>
                  <q-item
                    v-for="(provider,index) in config.defaultDisabledProviders"
                    :key="provider.name"
                    clickable
                    @click="enableProvider(config.defaultProviders, config.defaultDisabledProviders, index)"
                  >
                    <q-item-section>
                      <q-item-label>{{ providerLabel(provider.name) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

              </q-menu>
            </q-btn>
          </div>


          <div class="col-auto" style="padding: 8px 0 0 0">
            <q-select v-model="config.nameMatchingMode"
                      :options="matchingModeOptions"
                      label="Name Matching Mode"
                      dense
                      filled
            />
          </div>

          <div class="col-auto" style="padding: 8px 0 0 0">
            <div class="row">
              <div class="col" style="padding: 0">
                <q-input v-model="config.malClientId"
                         label="MyAnimeList ClientId"
                         dense
                         filled
                         :disable="config.malClientIdDisabled"
                />
              </div>
              <div class="col-auto" v-if="config.malClientIdDisabled" style="padding: 0">
                <q-btn
                  @click="config.malClientId=''; config.malClientIdDisabled=false"
                  flat
                  round
                  :icon="komga ? 'mdi-pencil' :'fa fa-pencil'"
                  :size="komga ? 'md':'sm'"
                />
              </div>
            </div>
          </div>

          <q-expansion-item class="q-pt-sm" dense dense-toggle expand-separator label="ComicVine">
            <div class="row">
              <div class="col" style="padding: 8px 0 0 0">
                <q-input v-model="config.comicVineClientId"
                         label="ComicVine API Key"
                         dense
                         filled
                         :disable="config.comicVineClientIdDisabled"
                />
              </div>
              <div class="col-auto" v-if="config.comicVineClientIdDisabled" style="padding: 8px 0 0 0">
                <q-btn
                  @click="config.comicVineClientId=''; config.comicVineClientIdDisabled=false"
                  flat
                  round
                  :icon="komga ? 'mdi-pencil' :'fa fa-pencil'"
                  :size="komga ? 'md':'sm'"
                />
              </div>
            </div>
            <div class="col-auto" style="padding: 8px 0 0 0">
              <q-input v-model="config.comicVineSearchLimit"
                       type="number"
                       label="Search Limit"
                       dense
                       filled
                       clearable
              />
            </div>
            <div class="col-auto" style="padding: 8px 0 0 0">
              <q-input v-model="config.comicVineIssueName"
                       label="Issue Name Format"
                       dense
                       filled
                       clearable
              />
            </div>
            <div class="col-auto" style="padding: 8px 0 0 0">
              <q-input v-model="config.comicVineIdFormat"
                       label="Id Format"
                       dense
                       filled
                       clearable
              />
            </div>
          </q-expansion-item>

          <q-expansion-item dense dense-toggle expand-separator label="Provider Databases">
            <ProviderDatabaseRow database="manga-baka"
                                 label="MangaBaka"
                                 :last-updated="config.mangaBakaDatabase?.downloadTimestamp ?? null"
            />
            <ProviderDatabaseRow database="book-walker"
                                 label="BookWalker"
                                 :last-updated="config.bookWalkerDownloadDate"
            />
          </q-expansion-item>
        </div>

      </q-tab-panel>

      <template v-for="(library,libraryIndex) in config.libraryProviders" :key="library.id">
        <q-tab-panel :name="library.id" v-if="!library.deleted" style="padding: 8px 0 0 0">
          <Sortable
            :list="library.providers"
            item-key="name"
            :options="sortableOptions"
            :key="library.providers.length"
            @end="(event)=> moveItemInArray(library.providers, event.oldIndex!, event.newIndex!)"
            @start="() => hideExpandedProviders()"
          >
            <template #item="{element, index}">
              <ProviderCard :key="element.name"
                            :provider="element"
                            :index="index"
                            @remove="disableProvider(library.providers, library.disabledProviders, index)"
                            @expansion-ref="addExpansionItemRef"
              />
            </template>
          </Sortable>

          <q-btn
            class="q-mb-sm"
            color="secondary"
            :disable="library.disabledProviders.length == 0"
          >
            <div class="col-auto">
              Add New
            </div>
            <div class="col-auto q-ml-sm">
              <q-icon :name="komga ? 'mdi-plus' :'fa fa-plus'" />
            </div>
            <q-menu auto-close>
              <q-list v-for="(provider,index) in config.libraryProviders[libraryIndex].disabledProviders"
                      :key="provider.name"
              >
                <q-item clickable @click="enableProvider(library.providers, library.disabledProviders, index)">
                  <q-item-section>
                    <q-item-label>{{ providerLabel(provider.name) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

            </q-menu>
          </q-btn>
        </q-tab-panel>
      </template>

    </q-tab-panels>
  </q-card>

</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'
import { providerLabel, type ProviderModel, useConfigUpdateStore } from '@/stores/configUpdate'
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import type { AutoScrollOptions } from 'sortablejs/plugins'
import type { QExpansionItem } from 'quasar'
import { QTabPanels } from 'quasar'
import ProviderCard from '@/components/settings/ProviderCard.vue'
import ProviderDatabaseRow from '@/components/settings/ProviderDatabaseRow.vue'

const settings = useSettingsStore()
const configStore = useConfigUpdateStore()
const config = configStore.metadataProviders
const komga = computed(() => settings.mediaServer === MediaServer.Komga)

const tab = ref('default')
const tabsKey = computed(() => config.libraryProviders.map(p => p.deleted).join())

const expansionItems = ref<Set<(InstanceType<typeof QExpansionItem> | null)>>(new Set())
const matchingModeOptions = ['CLOSEST_MATCH', 'EXACT']

const sortableOptions = computed<SortableOptions | AutoScrollOptions>(() => {
    return {
        draggable: '.draggable',
        animation: 150,
        ghostClass: 'ghost',
        dragClass: 'drag',
        scroll: true,
        scrollSensitivity: 50,
        scrollSpeed: 10,
        bubbleScroll: true,
        handle: '.provider-handle',
        forceFallback: true
    }
})

const tabPanel = ref<InstanceType<typeof QTabPanels> | null>(null)

const moveItemInArray = <T>(array: T[], from: number, to: number) => {
    const item = array.splice(from, 1)[0]
    array.splice(to, 0, item)
}

function hideExpandedProviders() {
    let filteredItems = Array.from(expansionItems.value).filter(item => item != null)
    filteredItems.forEach(item => item!.hide())
    expansionItems.value = new Set(filteredItems)
}

function addExpansionItemRef(item: any) {
    expansionItems.value.add(item)
}

function enableProvider(enabled: ProviderModel[], disabled: ProviderModel[], index: number) {
    let provider = disabled[index]
    provider.enabled = true
    enabled.push(provider)
    disabled.splice(index, 1)
}

function disableProvider(enabled: ProviderModel[], disabled: ProviderModel[], index: number) {
    let provider = enabled[index]
    provider.enabled = false
    enabled.splice(index, 1)
    disabled.push(provider)
    disabled.sort((a, b) => providerLabel(a.name).localeCompare(providerLabel(b.name)))
}

async function addLibrary(id: string) {
    let existing = config.libraryProviders.find(library => library.id == id)
    if (existing) {
        existing.deleted = false
        await nextTick()
        tabPanel.value?.goTo(id)
        return
    }

    config.libraryProviders.push({
        id: id,
        name: configStore.libraries.find(l => l.id == id)?.name ?? '',
        deleted: false,
        providers: [],
        disabledProviders: configStore.newLibraryProviderModels()
    })

    await nextTick()
    tabPanel.value?.goTo(id)
}

function removeLibrary(index: number) {
    config.libraryProviders[index].deleted = true
    tabPanel.value?.goTo('default')
}

function getLibraries() {
    let libraryProviders = configStore.metadataProviders.libraryProviders
    return configStore.libraries.filter(library => !libraryProviders.find(libraryConfig => !libraryConfig.deleted && libraryConfig.id == library.id))
}

</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';

.ghost {
  opacity: 0.5;
  background: $dark;
  border: 1px dashed #ccc;
}

.drag {
  background: $dark;
  max-height: 82px;
  overflow: hidden;
}
</style>
