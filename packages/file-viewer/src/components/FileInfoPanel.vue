<script setup lang="ts">
import { vTooltip } from '@wuhu-vue-ui/tooltip'
import { formatBytes, formatDateTime } from '../core/format'
import Icon from './Icon.vue'
import type { FileInfoPanelProps } from './types'

defineProps<FileInfoPanelProps>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <aside class="w-file-viewer__info" role="dialog" :aria-label="messages.fileInfo">
    <header>
      <strong>{{ messages.fileInfo }}</strong>
      <button
        type="button"
        class="w-file-viewer__icon-button is-small"
        v-tooltip="messages.close"
        :aria-label="messages.close"
        @click="emit('close')"
      >
        <Icon name="close" :size="15" />
      </button>
    </header>
    <dl>
      <div>
        <dt>{{ messages.name }}</dt>
        <dd>{{ meta.name }}</dd>
      </div>
      <div>
        <dt>{{ messages.format }}</dt>
        <dd>
          {{ meta.label
          }}<template v-if="meta.extension"> · {{ meta.extension.toUpperCase() }}</template>
        </dd>
      </div>
      <div>
        <dt>{{ messages.type }}</dt>
        <dd>{{ meta.mime || messages.unknown }}</dd>
      </div>
      <div v-if="meta.size !== undefined">
        <dt>{{ messages.size }}</dt>
        <dd>{{ formatBytes(meta.size, locale) }}</dd>
      </div>
      <div v-if="source?.lastModified">
        <dt>{{ messages.lastModified }}</dt>
        <dd>{{ formatDateTime(source.lastModified, locale) }}</dd>
      </div>
    </dl>
  </aside>
</template>
