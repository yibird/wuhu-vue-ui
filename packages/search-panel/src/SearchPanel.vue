<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  watch,
  type CSSProperties,
} from 'vue'
import { useControllableState, useDismissable } from '@wuhu-vue-ui/core'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import type {
  CommandMenuItem,
  CommandMenuKey,
  CommandMenuClasses,
  CommandMenuStyles,
} from '@wuhu-vue-ui/command-menu'
import { trapTab } from './useFocusTrap'
import { lockScroll, unlockScroll } from './useScrollLock'
import { isEditableTarget, matchesShortcut, parseShortcut } from './useShortcut'
import type {
  SearchPanelCloseReason,
  SearchPanelExpose,
  SearchPanelProps,
  SearchPanelSlots,
} from './types'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SearchPanelProps>(), {
  value: undefined,
  open: undefined,
  description: undefined,
  placeholder: '搜索命令...',
  emptyText: '未找到匹配的命令',
  filterable: true,
  filter: undefined,
  disabled: false,
  shortcut: 'Mod+K',
  closeOnSelect: true,
  width: 500,
  height: undefined,
  zIndex: 1001,
  to: 'body',
  classes: undefined,
  styles: undefined,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'update:value': [key: CommandMenuKey]
  select: [item: CommandMenuItem]
  search: [value: string]
  open: []
  close: [reason: SearchPanelCloseReason]
}>()

const slots = defineSlots<SearchPanelSlots>()

const attrs = useAttrs()
const panelRef = ref<HTMLElement | null>(null)
const commandRef = ref<InstanceType<typeof CommandMenu> | null>(null)
const triggerEl = shallowRef<HTMLElement | null>(null)
const pendingReason = ref<SearchPanelCloseReason | null>(null)
let runId = 0
let scrollLocked = false
let unmounted = false

const openState = useControllableState<boolean>({
  value: () => props.open,
  defaultValue: false,
  onChange: (value) => emit('update:open', value),
})
const isOpen = openState.value

const parsedShortcut = computed(() => parseShortcut(props.shortcut))
const shortcutLabel = computed(() => parsedShortcut.value?.label ?? null)

const panelStyle = computed<CSSProperties>(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const overlayStyle = computed<CSSProperties>(() => ({ zIndex: props.zIndex }))

const dialogLabel = computed(() => {
  const label = attrs['aria-label']
  return typeof label === 'string' ? label : '搜索面板'
})

const commandClasses = computed<CommandMenuClasses | undefined>(() => props.classes?.command)

const commandStyles = computed<CommandMenuStyles | undefined>(() => props.styles?.command)

const restAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

function getActiveElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function restoreTrigger() {
  const target = triggerEl.value
  if (target?.isConnected) target.focus({ preventScroll: true })
}

function focusContent() {
  if (props.disabled) {
    panelRef.value?.focus({ preventScroll: true })
    return
  }
  commandRef.value?.focus()
}

function enterOpen() {
  if (typeof window === 'undefined') return

  triggerEl.value = getActiveElement()
  if (!scrollLocked) {
    lockScroll()
    scrollLocked = true
  }

  const id = ++runId
  void nextTick(() => {
    if (unmounted || id !== runId || !isOpen.value) return
    focusContent()
    emit('open')
  })
}

function leaveOpen(reason: SearchPanelCloseReason) {
  if (scrollLocked) {
    unlockScroll()
    scrollLocked = false
  }
  runId += 1
  emit('close', reason)

  if (reason === 'backdrop') return

  void nextTick(() => {
    if (unmounted || isOpen.value) return
    restoreTrigger()
  })
}

watch(isOpen, (value) => {
  if (value) {
    enterOpen()
    return
  }
  const reason = pendingReason.value ?? 'api'
  pendingReason.value = null
  leaveOpen(reason)
})

function open() {
  if (props.disabled) return
  if (isOpen.value) {
    focusContent()
    return
  }
  openState.setValue(true)
}

function close(reason: SearchPanelCloseReason = 'api') {
  if (!isOpen.value) return
  pendingReason.value = reason
  openState.setValue(false)
}

function handleSelect(item: CommandMenuItem) {
  emit('select', item)
  if (props.closeOnSelect) close('select')
}

useDismissable({
  enabled: isOpen,
  ignore: panelRef,
  escape: false,
  onDismiss: () => close('backdrop'),
})

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat) return
  if (event.isComposing || event.keyCode === 229) return

  if (isOpen.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close('escape')
      return
    }

    if (event.key === 'Tab') {
      trapTab(event, panelRef.value)
      return
    }

    if (parsedShortcut.value && matchesShortcut(event, parsedShortcut.value)) {
      event.preventDefault()
      focusContent()
    }
    return
  }

  if (props.disabled || !parsedShortcut.value) return
  if (isEditableTarget(event.target)) return
  if (!matchesShortcut(event, parsedShortcut.value)) return

  event.preventDefault()
  open()
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
  if (isOpen.value) enterOpen()
})

onBeforeUnmount(() => {
  unmounted = true
  runId += 1
  window.removeEventListener('keydown', handleWindowKeydown)
  if (scrollLocked) {
    unlockScroll()
    scrollLocked = false
  }
})

defineExpose<SearchPanelExpose>({
  open,
  close,
  focus: focusContent,
  get isOpen() {
    return isOpen.value
  },
})
</script>

<template>
  <Teleport :to="props.to">
    <Transition name="w-search-panel" appear>
      <div
        v-if="isOpen"
        class="w-search-panel"
        :class="props.classes?.overlay"
        :style="[overlayStyle, props.styles?.overlay]"
      >
        <div
          class="w-search-panel__backdrop"
          :class="props.classes?.backdrop"
          :style="props.styles?.backdrop"
          aria-hidden="true"
        />

        <div
          ref="panelRef"
          v-bind="restAttrs"
          class="w-search-panel__panel"
          :class="[attrs.class, props.classes?.panel]"
          :style="[panelStyle, attrs.style, props.styles?.panel]"
          role="dialog"
          aria-modal="true"
          :aria-label="dialogLabel"
          tabindex="-1"
        >
          <header
            v-if="slots.header"
            class="w-search-panel__header"
            :class="props.classes?.header"
            :style="props.styles?.header"
          >
            <slot name="header" :description="props.description" :close="() => close('api')" />
          </header>

          <CommandMenu
            ref="commandRef"
            :items="props.items"
            :placeholder="props.placeholder"
            :empty-text="props.emptyText"
            :filterable="props.filterable"
            :filter="props.filter"
            :disabled="props.disabled"
            :max-height="320"
            :auto-focus="false"
            escape-behavior="none"
            class="w-search-panel__command"
            :classes="commandClasses"
            :styles="commandStyles"
            @update:model-value="emit('update:value', $event)"
            @select="handleSelect"
            @search="emit('search', $event)"
          >
            <template v-if="slots.item" #item="slotProps">
              <slot name="item" v-bind="slotProps" />
            </template>
            <template v-if="slots.empty" #empty="slotProps">
              <slot name="empty" v-bind="slotProps" />
            </template>
          </CommandMenu>

          <footer
            class="w-search-panel__footer"
            :class="props.classes?.footer"
            :style="props.styles?.footer"
          >
            <slot name="footer" :shortcut-label="shortcutLabel" :close="() => close('api')">
              <span>↑ ↓ 导航 · Enter 选择 · Esc 关闭</span>
              <kbd v-if="shortcutLabel" class="w-search-panel__shortcut">{{ shortcutLabel }}</kbd>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
