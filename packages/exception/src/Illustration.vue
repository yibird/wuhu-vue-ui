<script setup lang="ts">
import type { ExceptionType } from './types'

defineProps<{
  type: ExceptionType
}>()
</script>

<template>
  <svg
    class="w-exception-illustration"
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="120" cy="90" r="72" fill="var(--w-exception-soft)" />

    <template v-if="type === 'notFound'">
      <rect
        x="66"
        y="44"
        width="108"
        height="92"
        rx="10"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
      />
      <path d="M66 68h108" stroke="currentColor" stroke-width="2.2" opacity="0.55" />
      <circle cx="82" cy="56" r="3" fill="currentColor" />
      <circle cx="94" cy="56" r="3" fill="currentColor" opacity="0.65" />
      <circle cx="106" cy="56" r="3" fill="currentColor" opacity="0.4" />
      <path
        d="M113 96a7 7 0 0 1 14 0c0 3.7-2.4 5.3-4.1 6.6-1.3 1-1.9 1.9-1.9 3.6"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
      />
      <circle cx="121" cy="110" r="2.2" fill="currentColor" />
      <path
        d="M100 124h40"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        opacity="0.35"
      />
      <path
        d="M64 54h-8M196 94h8M70 140h-8"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        opacity="0.45"
      />
    </template>

    <template v-else-if="type === 'forbidden'">
      <path
        d="M120 30l46 19v37c0 31-20 51-46 63-26-12-46-32-46-63V49l46-19Z"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <rect
        x="99"
        y="83"
        width="42"
        height="34"
        rx="7"
        fill="var(--w-exception-soft)"
        stroke="currentColor"
        stroke-width="2.4"
      />
      <path
        d="M108 83V72a12 12 0 0 1 24 0v11"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <circle cx="120" cy="98" r="4" fill="currentColor" />
      <path d="M120 102v7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path
        d="M74 55h-8M174 55h8M120 22v8"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        opacity="0.45"
      />
    </template>

    <template v-else-if="type === 'serverError'">
      <rect
        x="66"
        y="38"
        width="108"
        height="32"
        rx="8"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
      />
      <rect
        x="66"
        y="80"
        width="108"
        height="32"
        rx="8"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
      />
      <rect
        x="66"
        y="122"
        width="108"
        height="22"
        rx="8"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
      />
      <circle cx="84" cy="54" r="3" fill="currentColor" />
      <circle cx="95" cy="54" r="3" fill="currentColor" opacity="0.55" />
      <circle cx="84" cy="96" r="3" fill="currentColor" />
      <circle cx="95" cy="96" r="3" fill="currentColor" opacity="0.55" />
      <path
        d="M84 140h20M84 147h12"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        opacity="0.6"
      />
      <path
        d="M160 30l-20 34h18l-10 36 34-46h-18l12-24Z"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="type === 'networkError'">
      <path
        d="M78 124h84a24 24 0 0 0 4-47 40 40 0 0 0-77-9 21 21 0 0 0-11 56Z"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <path
        d="M92 73a42 42 0 0 1 56 0"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        opacity="0.45"
      />
      <path
        d="M104 88a26 26 0 0 1 32 0"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        opacity="0.7"
      />
      <circle cx="120" cy="103" r="3.5" fill="currentColor" />
      <path d="m88 48 64 64" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" />
    </template>

    <template v-else>
      <path
        d="M84 32h50l26 26v90H84V32Z"
        fill="var(--w-exception-surface)"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <path d="M134 32v26h26" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M120 80v28" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <circle cx="120" cy="122" r="3" fill="currentColor" />
      <path
        d="M100 70h14M100 138h40"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.4"
      />
      <path
        d="M48 70h-8M200 108h-8M60 130h-8"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        opacity="0.45"
      />
    </template>
  </svg>
</template>
