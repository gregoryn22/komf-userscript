<template>
  <q-menu class="text-body2 text-weight-medium">
    <q-item clickable @click="promptIdentifySeries" v-close-popup>
      <q-item-section no-wrap>Identify</q-item-section>
    </q-item>
    <q-item clickable @click="autoIdentify" v-close-popup>
      <q-item-section no-wrap>Auto-Identify</q-item-section>
    </q-item>
    <q-item clickable @click="promptResetSeries" v-close-popup>
      <q-item-section no-wrap>Reset Metadata</q-item-section>
    </q-item>
  </q-menu>

  <q-dialog v-model="loading" maximized transition-duration="0">
    <div class="q-pa-md flex flex-center" style="background-color: rgba(89, 89, 89, 0.5)">
      <q-circular-progress indeterminate rounded size="50px" color="lime" class="q-ma-md" />
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import type KomfMetadataService from '../services/komf-metadata.service'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import IdentifySeriesDialog from '@/components/IdentifySeriesDialog.vue'
import { komfMetadataKey } from '@/injection-keys'
import MediaServer from '@/types/mediaServer'
import { useQuasar } from 'quasar'
import { errorNotification } from '@/errorNotification'
import { useSettingsStore } from '@/stores/settings'
import { trackMetadataJob } from '@/jobProgress'

const $q = useQuasar()
const metadataService = inject<KomfMetadataService>(komfMetadataKey) as KomfMetadataService
const settings = useSettingsStore()

const loading = ref(false)

function seriesTitle(): string {
    let element: HTMLElement | null
    if (settings.mediaServer == MediaServer.Komga) {
        element = document.querySelector('.v-main__wrap .v-toolbar__content .v-toolbar__title span') ||
            document.querySelector('.v-main__wrap .container--fluid .container span.text-h6')
    } else {
        element = document.querySelector('app-series-detail .info-container div h4 span')
    }
    return element?.innerText ?? ''
}

function seriesId() {
    let path = window.location.pathname.split('/')
    return path[path.findIndex(el => el == 'series' || el == 'oneshot') + 1]
}

function libraryId(): string {
    let id: string | undefined
    if (settings.mediaServer == MediaServer.Komga) {
        id = Array.from(document.querySelector('.v-main__wrap .v-toolbar__content')?.children ?? [])
            .map(el => el.getAttribute('href'))
            .find(link => link && /\/libraries.*/.test(link))
            ?.split('/')[2]
    } else {
        let pathTokens = window.location.pathname.split('/')
        let index = pathTokens.findIndex(el => el == 'library')
        id = index >= 0 ? pathTokens[index + 1] : undefined
    }
    if (!id) throw new Error('Could not determine the library of this series')
    return id
}

function promptIdentifySeries() {
    $q.dialog({
        component: IdentifySeriesDialog,

        componentProps: {
            seriesTitle: seriesTitle()
        }
    })
}

function promptResetSeries() {
    $q.dialog({
        component: ConfirmationDialog,

        componentProps: {
            title: 'Reset Series',
            bodyHtml: 'All series metadata will be reset including field locks and thumbnails uploaded by Komf. Files are only modified if you also remove ComicInfo. Continue?',
            optionLabel: 'Also remove ComicInfo.xml from book files',
            confirmText: 'Yes, reset series',
            buttonConfirm: 'Reset',
            buttonConfirmColor: 'negative'
        }
    }).onOk(({ option }: { option: boolean }) => {
        resetSeries(option)
    })
}

async function resetSeries(removeComicInfo: boolean) {
    try {
        await metadataService.resetSeries(libraryId(), seriesId(), removeComicInfo)
    } catch (e) {
        errorNotification(e, $q)
    }
}

async function autoIdentify() {
    loading.value = true
    try {
        const job = await metadataService.matchSeries(libraryId(), seriesId())
        trackMetadataJob($q, metadataService, job.jobId, `Auto-identifying "${seriesTitle()}"`)
    } catch (e) {
        errorNotification(e, $q)
    }
    loading.value = false
}
</script>

<style scoped lang="scss">
@import '../styles/scoped.scss';
</style>
