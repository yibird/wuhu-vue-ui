<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useAttrs,
  useId,
  watch,
  type CSSProperties,
  type VNode,
} from 'vue'
import {
  clampToViewport,
  useControllableState,
  useDismissable,
  useKeyboardNavigation,
} from '@wuhu-vue-ui/core'
import type {
  ContextMenuActionItem,
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuProps,
} from './types'

interface MenuPosition {
  x: number
  y: number
}

/** Renders a pre-built virtual node inside the item layout. */
const VNodeContent = (nodeProps: { node: VNode }) => nodeProps.node

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ContextMenuProps>(), {
  open: undefined,
  closeOnSelect: true,
  restoreFocus: true,
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  open: [details: { x: number; y: number }]
  select: [details: { item: ContextMenuItem }]
  close: []
}>()

const attrs = useAttrs()

const openState = useControllableState<boolean>({
  value: () => props.open,
  defaultValue: false,
  onChange: (value) => emit('update:open', value),
})
const isOpen = openState.value

const menuRef = ref<HTMLElement | null>(null)
const triggerEl = shallowRef<HTMLElement | null>(null)
const position = ref<MenuPosition>({ x: 0, y: 0 })
const resolvedItems = shallowRef<ContextMenuItem[] | null>(null)
const activeIndex = ref<number | null>(null)
const baseId = useId()
let runId = 0
let unmounted = false

const menuItems = computed<ContextMenuItem[]>(() => {
  if (typeof props.items === 'function') return resolvedItems.value ?? []
  return props.items ?? []
})

const actionItems = computed(() =>
  menuItems.value.filter(
    (item): item is ContextMenuActionItem => item.type === undefined || item.type === 'item',
  ),
)

const enabledItems = computed(() => actionItems.value.filter((item) => !item.disabled))

function itemId(item: ContextMenuActionItem) {
  return `${baseId}-item-${actionItems.value.indexOf(item)}`
}

const activeItemId = computed(() => {
  const item = activeIndex.value === null ? undefined : enabledItems.value[activeIndex.value]
  return item ? itemId(item) : undefined
})

const shouldRender = computed(() => isOpen.value && actionItems.value.length > 0)

const menuStyle = computed<CSSProperties>(() => ({
  '--w-context-menu-x': `${position.value.x}px`,
  '--w-context-menu-y': `${position.value.y}px`,
  maxHeight: 'calc(100vh - 16px)',
}))

const restAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

function getActiveElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function resolveItems(): ContextMenuItem[] {
  return typeof props.items === 'function' ? props.items() : (props.items ?? [])
}

function hasActionableItems(items: ContextMenuItem[]) {
  return items.some((item) => (item.type ?? 'item') === 'item')
}

function beginOpen(point: MenuPosition, items: ContextMenuItem[], trigger?: HTMLElement | null) {
  if (typeof props.items === 'function') resolvedItems.value = items
  if (trigger) triggerEl.value = trigger
  else if (!isOpen.value || !triggerEl.value) triggerEl.value = getActiveElement()
  position.value = { x: point.x, y: point.y }
  activeIndex.value = null

  const wasOpen = isOpen.value
  openState.setValue(true)
  // Already-open menus do not re-trigger the watch, so schedule explicitly.
  if (wasOpen) scheduleOpen()
}

function openMenu(event: MouseEvent) {
  const items = resolveItems()
  if (!hasActionableItems(items)) return false
  event.preventDefault()
  const trigger =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : getActiveElement()
  beginOpen({ x: event.clientX, y: event.clientY }, items, trigger)
  return true
}

function close() {
  closeInternal()
}

function closeInternal() {
  if (!isOpen.value) return
  runId++
  openState.setValue(false)
  activeIndex.value = null
}

function closeWithRestore() {
  closeInternal()
  nextTick(() => {
    if (isOpen.value) return
    const target = triggerEl.value
    if (props.restoreFocus && target?.isConnected) target.focus()
  })
}

function clampPosition() {
  const menu = menuRef.value
  if (!menu || typeof window === 'undefined') return
  // Use layout size: `getBoundingClientRect()` includes the enter transition's
  // scale and would under-measure the menu while it animates.
  position.value = clampToViewport(position.value.x, position.value.y, {
    width: menu.offsetWidth,
    height: menu.offsetHeight,
  })
}

function focusMenu() {
  menuRef.value?.focus()
}

function highlightItem(index: number) {
  activeIndex.value = index
}

function scheduleOpen() {
  const id = ++runId
  nextTick(() => {
    if (unmounted || id !== runId || !isOpen.value) return
    if (!triggerEl.value) triggerEl.value = getActiveElement()
    clampPosition()
    focusMenu()
    emit('open', {
      x: position.value.x,
      y: position.value.y,
    })
  })
}

watch(isOpen, (open) => {
  if (open) {
    scheduleOpen()
    return
  }

  activeIndex.value = null
  emit('close')
})

useDismissable({
  enabled: isOpen,
  ignore: menuRef,
  resize: true,
  scroll: true,
  onDismiss: (reason, event) => {
    if (reason === 'escape') {
      event?.preventDefault()
      closeWithRestore()
      return
    }
    closeInternal()
  },
})

const navigation = useKeyboardNavigation<ContextMenuActionItem>({
  items: enabledItems,
  activeIndex: () => activeIndex.value,
  loop: true,
  onHighlight: (index) => highlightItem(index),
  onActivate: (item) => selectItem(item),
})

function itemIndex(item: ContextMenuActionItem) {
  return enabledItems.value.indexOf(item)
}

function activateOnHover(item: ContextMenuActionItem) {
  const index = itemIndex(item)
  if (index >= 0) activeIndex.value = index
}

function selectItem(item: ContextMenuActionItem) {
  if (item.disabled) return
  emit('select', { item })
  if (props.closeOnSelect) closeWithRestore()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    const target = triggerEl.value
    closeInternal()
    if (props.restoreFocus && target?.isConnected) target.focus()
    return
  }
  navigation.handleKeydown(event)
}

onBeforeUnmount(() => {
  unmounted = true
  runId++
})

defineExpose<ContextMenuExpose>({
  open: openMenu,
  close,
  focus: focusMenu,
  get isOpen() {
    return isOpen.value
  },
})
</script>

<template>
  <Teleport to="body">
    <Transition name="w-context-menu">
      <div
        v-if="shouldRender"
        ref="menuRef"
        v-bind="restAttrs"
        class="w-context-menu"
        :class="[attrs.class, props.classes?.root]"
        :style="[menuStyle, attrs.style, props.styles?.root]"
        role="menu"
        aria-orientation="vertical"
        aria-label="上下文菜单"
        :aria-activedescendant="activeItemId"
        tabindex="-1"
        @keydown="handleKeydown"
        @contextmenu.prevent.stop
        @pointerdown.stop
        @click.stop
      >
        <template v-for="(item, index) in menuItems" :key="item.key ?? `${item.type}-${index}`">
          <div
            v-if="item.type === 'header'"
            class="w-context-menu__group-label"
            :class="props.classes?.groupLabel"
            :style="props.styles?.groupLabel"
            role="presentation"
          >
            {{ item.label }}
          </div>
          <div
            v-else-if="item.type === 'separator'"
            class="w-context-menu__separator"
            :class="props.classes?.separator"
            :style="props.styles?.separator"
            role="separator"
            aria-orientation="horizontal"
          />
          <button
            v-else
            :id="itemId(item)"
            type="button"
            class="w-context-menu__item"
            :class="[
              props.classes?.item,
              {
                'is-active': itemIndex(item) === activeIndex,
                'is-disabled': item.disabled,
                'is-danger': item.danger,
              },
            ]"
            :style="props.styles?.item"
            role="menuitem"
            tabindex="-1"
            :disabled="item.disabled"
            @mousedown.prevent
            @mouseenter="activateOnHover(item)"
            @click.stop="selectItem(item)"
          >
            <span
              v-if="item.icon"
              class="w-context-menu__item-icon"
              :class="props.classes?.icon"
              :style="props.styles?.icon"
              aria-hidden="true"
            >
              <VNodeContent :node="item.icon" />
            </span>
            <span
              class="w-context-menu__item-label"
              :class="props.classes?.label"
              :style="props.styles?.label"
            >
              {{ item.label }}
            </span>
            <span
              v-if="item.suffix"
              class="w-context-menu__item-suffix"
              :class="props.classes?.suffix"
              :style="props.styles?.suffix"
            >
              <VNodeContent :node="item.suffix" />
            </span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
