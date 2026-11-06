<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { FileViewerToolbarSlotProps } from '../types'
import type { ViewerToolbarProps } from './types'

const props = defineProps<ViewerToolbarProps>()

const emit = defineEmits<{
  'update:pageInput': [value: string]
  commitPage: []
  previousPage: []
  nextPage: []
  zoomIn: []
  zoomOut: []
  resetZoom: []
  rotateLeft: []
  rotateRight: []
  download: []
  open: []
  print: []
  toggleInfo: []
  toggleTheme: []
  toggleFullscreen: []
}>()

defineSlots<{
  toolbar?: (props: FileViewerToolbarSlotProps) => unknown
  'toolbar-left'?: (props: FileViewerToolbarSlotProps) => unknown
  'toolbar-actions'?: (props: FileViewerToolbarSlotProps) => unknown
}>()

const zoomPercent = computed(() => `${Math.round(props.zoom * 100)}%`)
const hasPageControls = computed(() => props.capabilities.paged && props.pageCount > 1)

function updatePageInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:pageInput', target?.value ?? '')
}

function commitPage() {
  emit('commitPage')
}
</script>

<template>
  <header class="w-file-viewer__toolbar">
    <slot name="toolbar" v-bind="slotProps">
      <div class="w-file-viewer__toolbar-left">
        <slot name="toolbar-left" v-bind="slotProps">
          <span class="w-file-viewer__file-icon">
            <Icon name="file-viewer" :size="17" />
          </span>
          <span class="w-file-viewer__title" :title="displayTitle">{{ displayTitle }}</span>
          <span v-if="meta?.extension" class="w-file-viewer__badge">{{
            meta.extension.toUpperCase()
          }}</span>
        </slot>
      </div>

      <div class="w-file-viewer__toolbar-center">
        <div
          v-if="hasPageControls"
          class="w-file-viewer__group"
          role="group"
          :aria-label="messages.page"
        >
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :disabled="page <= 1"
            :title="messages.previousPage"
            :aria-label="messages.previousPage"
            @click="emit('previousPage')"
          >
            <Icon name="chevron-left" />
          </button>
          <div class="w-file-viewer__page-field">
            <input
              :value="pageInput"
              class="w-file-viewer__page-input"
              type="number"
              min="1"
              :max="pageCount"
              :aria-label="messages.pageInput"
              @input="updatePageInput"
              @change="commitPage"
              @keydown.enter.prevent="commitPage"
            />
            <span>{{ messages.pageOf }} {{ pageCount }}</span>
          </div>
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :disabled="page >= pageCount"
            :title="messages.nextPage"
            :aria-label="messages.nextPage"
            @click="emit('nextPage')"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <span
          v-if="hasPageControls && (capabilities.zoom || capabilities.rotate)"
          class="w-file-viewer__divider"
        />

        <div
          v-if="allowZoom && capabilities.zoom"
          class="w-file-viewer__group"
          role="group"
          :aria-label="messages.zoomIn"
        >
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.zoomOut"
            :aria-label="messages.zoomOut"
            @click="emit('zoomOut')"
          >
            <Icon name="zoom-out" />
          </button>
          <button
            type="button"
            class="w-file-viewer__zoom-value"
            :title="messages.resetZoom"
            :aria-label="messages.resetZoom"
            @click="emit('resetZoom')"
          >
            {{ zoomPercent }}
          </button>
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.zoomIn"
            :aria-label="messages.zoomIn"
            @click="emit('zoomIn')"
          >
            <Icon name="zoom-in" />
          </button>
        </div>

        <span
          v-if="capabilities.zoom && allowRotate && capabilities.rotate"
          class="w-file-viewer__divider"
        />

        <div
          v-if="allowRotate && capabilities.rotate"
          class="w-file-viewer__group"
          role="group"
          :aria-label="messages.rotateRight"
        >
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.rotateLeft"
            :aria-label="messages.rotateLeft"
            @click="emit('rotateLeft')"
          >
            <Icon name="rotate-left" />
          </button>
          <button
            type="button"
            class="w-file-viewer__icon-button"
            :title="messages.rotateRight"
            :aria-label="messages.rotateRight"
            @click="emit('rotateRight')"
          >
            <Icon name="rotate-right" />
          </button>
        </div>
      </div>

      <div class="w-file-viewer__toolbar-right">
        <slot name="toolbar-actions" v-bind="slotProps" />
        <button
          v-if="allowDownload && hasSource"
          type="button"
          class="w-file-viewer__icon-button"
          :title="messages.download"
          :aria-label="messages.download"
          @click="emit('download')"
        >
          <Icon name="download" />
        </button>
        <button
          v-if="allowOpen && hasSource"
          type="button"
          class="w-file-viewer__icon-button"
          :title="messages.openInNewTab"
          :aria-label="messages.openInNewTab"
          @click="emit('open')"
        >
          <Icon name="external" />
        </button>
        <button
          v-if="allowPrint && capabilities.print"
          type="button"
          class="w-file-viewer__icon-button"
          :title="messages.print"
          :aria-label="messages.print"
          @click="emit('print')"
        >
          <Icon name="printer" />
        </button>
        <button
          v-if="hasSource && showFileInfo"
          type="button"
          class="w-file-viewer__icon-button"
          :class="{ 'is-active': showInfo }"
          :title="messages.fileInfo"
          :aria-label="messages.fileInfo"
          :aria-expanded="showInfo"
          @click="emit('toggleInfo')"
        >
          <Icon name="info" />
        </button>
        <button
          v-if="showThemeToggle"
          type="button"
          class="w-file-viewer__icon-button"
          :title="isDark ? messages.switchToLight : messages.switchToDark"
          :aria-label="isDark ? messages.switchToLight : messages.switchToDark"
          @click="emit('toggleTheme')"
        >
          <Icon :name="isDark ? 'sun' : 'moon'" />
        </button>
        <button
          v-if="allowFullscreen"
          type="button"
          class="w-file-viewer__icon-button"
          :title="isFullscreen ? messages.exitFullscreen : messages.fullscreen"
          :aria-label="isFullscreen ? messages.exitFullscreen : messages.fullscreen"
          @click="emit('toggleFullscreen')"
        >
          <Icon :name="isFullscreen ? 'minimize' : 'expand'" />
        </button>
      </div>
    </slot>
  </header>
</template>
