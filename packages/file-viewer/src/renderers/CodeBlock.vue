<script setup lang="ts">
import { computed } from 'vue'
import { codeTokenClass, tokenizeCode, tokensToLines } from '../core/code'

const props = withDefaults(
  defineProps<{
    code: string
    language?: string
    lineNumbers?: boolean
    wrap?: boolean
  }>(),
  {
    language: 'plaintext',
    lineNumbers: true,
    wrap: false,
  },
)

const lines = computed(() => tokensToLines(tokenizeCode(props.code, props.language)))
const digits = computed(() => String(lines.value.length).length)
</script>

<template>
  <div
    class="w-file-viewer__code"
    :class="{ 'is-wrap': wrap }"
    :style="{ '--w-file-viewer-code-digits': String(digits) }"
  >
    <div v-for="(line, index) in lines" :key="index" class="w-file-viewer__code-line">
      <span v-if="lineNumbers" class="w-file-viewer__line-number">{{ index + 1 }}</span>
      <span class="w-file-viewer__line-content">
        <template v-for="(token, tokenIndex) in line" :key="tokenIndex">
          <span v-if="token.type !== 'plain'" :class="codeTokenClass(token.type)">{{
            token.text
          }}</span>
          <template v-else>{{ token.text }}</template>
        </template>
        <template v-if="line.length === 0">&#8203;</template>
      </span>
    </div>
  </div>
</template>
