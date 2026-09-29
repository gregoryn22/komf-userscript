<template>
  <div class="column">
    <div class="col-auto" style="width: 200px; padding: 8px 0 0 0">
      <q-select
        filled
        dense
        v-model="model.libraryType"
        :options="libraryTypeOptions"
        label="Library type"
      />
    </div>
    <div class="row">
      <div class="col-auto">
        <q-checkbox v-model="model.aggregateMetadata" label="Aggregate from all providers" />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="model.mergeGenres" :disable="!model.aggregateMetadata" label="Merge Genres" />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="model.mergeTags" :disable="!model.aggregateMetadata" label="Merge Tags" />
      </div>
    </div>

    <div class="col-auto" style="padding: 8px 0 0 0">
      <div class="row">
        <div class="col-auto">
          <q-checkbox v-model="model.orderBooks" label="Order Books" />
        </div>
        <div class="col-auto">
          <q-checkbox v-model="model.respectBookNumberLock"
                      :disable="!model.orderBooks"
                      label="Respect Book Number Lock"
          />
        </div>
      </div>
    </div>

    <div class="col-auto" style="padding: 8px 0 0 0">
      <div class="row">
        <div class="col-auto">
          <q-checkbox v-model="model.seriesCovers" label="Series Cover" />
        </div>
        <div class="col-auto">
          <q-checkbox v-model="model.bookCovers" label="Book Cover" />
        </div>
        <div v-if="komga" class="col-auto">
          <q-checkbox v-model="model.overrideExistingCovers" label="Override Existing Covers" />
        </div>
        <div class="col-auto">
          <q-checkbox v-model="model.lockCovers" label="Lock Covers" />
        </div>
      </div>
    </div>

    <div class="col-auto" style="padding: 8px 0 0 0">
      <div class="row">
        <div class="col-auto">
          <q-checkbox v-model="model.seriesTitle" label="Series Title" />
        </div>
        <div class="col-auto">
          <q-checkbox v-model="model.alternativeTitles" label="Alternative Series Titles" />
        </div>
        <div class="col-auto">
          <q-checkbox v-model="model.fallbackToAltTitle" label="Fallback to Alternative Title" />
        </div>
      </div>
    </div>

    <div class="col-auto" style="padding: 8px 0 0 0">
      <div class="row">
        <div class="col-auto" style="width: 200px; margin: 0 16px 0 0">
          <q-input
            v-model="model.seriesTitleLanguage"
            label="Title Language"
            filled
            dense
            clearable
            hint="BCP 47 language tag. ja-ro for romanized"
            hide-hint
            :rules="[val => isBlank(val) || isLangCode(val).res]"
          />
        </div>

        <div class="col-auto" style="width: 250px">
          <q-select
            v-model="model.alternativeTitleLanguages"
            label="Alternative Title Languages"
            filled
            dense
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            input-debounce="0"
            @new-value="createLanguageValue"
            hint="BCP 47 language tag. ja-ro for romanized"
            hide-hint
          />
        </div>
      </div>
    </div>

    <div class="col-auto" style="width: 200px; padding: 8px 0 0 0">
      <q-select
        filled
        dense
        v-model="model.modes"
        multiple
        :options="updateModeOptions"
        label="Update modes"
      />
    </div>

    <div class="col-auto" style="padding: 8px 0 0 0">
      <div class="row">
        <div v-if="komga" class="col-auto" style="width: 200px; margin: 0 16px 0 0">
          <q-select
            filled
            dense
            clearable
            v-model="model.readingDirectionValue"
            :options="readingDirectionOptions"
            label="Default Reading Direction"
          />
        </div>

        <div class="col-auto" style="width: 200px">
          <q-input
            v-model="model.languageValue"
            label="Series Default Language"
            dense
            filled
            clearable
            hint="IETF BCP 47 language tag"
            hide-hint
            :rules="[val => isBlank(val) || isLangCode(val).res]"
          />
        </div>
      </div>
    </div>

    <q-expansion-item class="q-pt-sm" dense dense-toggle expand-separator label="Tags">
      <div class="row">
        <div class="col-auto" style="width: 200px; margin: 0 16px 0 0; padding: 8px 0 0 0">
          <q-input v-model="model.scoreTagName"
                   label="Score Tag Name"
                   hint="adds the provider score as a tag"
                   dense
                   filled
                   clearable
          />
        </div>
        <div class="col-auto" style="width: 200px; padding: 8px 0 0 0">
          <q-input v-model="model.originalPublisherTagName"
                   label="Original Publisher Tag Name"
                   dense
                   filled
                   clearable
          />
        </div>
      </div>

      <div class="text-body2 q-pt-md">Publisher Tag Names</div>
      <div v-for="(tag, index) in model.publisherTagNames" :key="index" class="row items-center q-pt-sm">
        <div class="col" style="margin: 0 8px 0 0">
          <q-input v-model="tag.tagName" label="Tag Name" dense filled />
        </div>
        <div class="col-auto" style="width: 120px">
          <q-input v-model="tag.language"
                   label="Language"
                   dense
                   filled
                   hide-bottom-space
                   :rules="[val => isLangCode(val).res]"
          />
        </div>
        <div class="col-auto">
          <q-btn flat round
                 :icon="komga ? 'mdi-delete' : 'fa fa-trash'"
                 :size="komga ? 'md' : 'sm'"
                 @click="model.publisherTagNames.splice(index, 1)"
          />
        </div>
      </div>
      <div class="row q-pt-sm">
        <q-space />
        <q-btn round color="secondary" size="sm"
               :icon="komga ? 'mdi-plus' : 'fa fa-plus'"
               @click="model.publisherTagNames.push({ tagName: '', language: '' })"
        />
      </div>
    </q-expansion-item>

    <q-expansion-item v-if="model.titleSanitization" dense dense-toggle expand-separator label="Title Sanitization">
      <q-checkbox v-model="model.titleSanitization.enabled" label="Enabled" />
      <div class="col-auto" style="padding: 8px 0 0 0">
        <q-select
          v-model="model.titleSanitization.stripSuffixes"
          label="Strip Suffixes"
          :disable="!model.titleSanitization.enabled"
          filled
          dense
          use-input
          use-chips
          multiple
          hide-dropdown-icon
          input-debounce="0"
          new-value-mode="add-unique"
          hint="case-insensitive title suffixes to remove, e.g. (Volumes)"
        />
      </div>
      <div class="col-auto" style="padding: 8px 0 0 0">
        <q-select
          v-model="model.titleSanitization.stripPatterns"
          label="Strip Patterns"
          :disable="!model.titleSanitization.enabled"
          filled
          dense
          use-input
          use-chips
          multiple
          hide-dropdown-icon
          input-debounce="0"
          @new-value="createRegexValue"
          hint="regular expressions removed from titles"
        />
      </div>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { isLangCode } from 'is-language-code'
import { useSettingsStore } from '@/stores/settings'
import MediaServer from '@/types/mediaServer'
import type { ProcessingUpdateModel } from '@/stores/configUpdate'

defineProps({
    model: {
        type: Object as PropType<ProcessingUpdateModel>,
        required: true
    }
})

const settings = useSettingsStore()
const komga = computed(() => settings.mediaServer === MediaServer.Komga)

const updateModeOptions = ['API', 'COMIC_INFO']
const libraryTypeOptions = ['MANGA', 'NOVEL', 'COMIC', 'WEBTOON']
const readingDirectionOptions = ['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT', 'VERTICAL', 'WEBTOON']

function isBlank(val: string | null) {
    return val == null || val === ''
}

function createLanguageValue(val: string, done: Function) {
    if (isLangCode(val).res) done(val, 'add-unique')
}

function createRegexValue(val: string, done: Function) {
    try {
        new RegExp(val)
        done(val, 'add-unique')
    } catch {
        // invalid pattern, komf would reject it
    }
}
</script>

<style scoped lang="scss">
@import '../../styles/scoped.scss';
</style>
