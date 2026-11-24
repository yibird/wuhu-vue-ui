<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useControllableState, useKeyboardNavigation } from '@wuhu-vue-ui/core'
import { Empty } from '@wuhu-vue-ui/empty'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Rect, Virtualizer } from '@tanstack/vue-virtual'
import IconGlyph from './IconGlyph'
import { useIconPickerIcons } from './config'
import type {
  IconPickerEmptySlotProps,
  IconPickerEmits,
  IconPickerGroup,
  IconPickerItem,
  IconPickerModelValue,
  IconPickerProps,
  IconPickerSlots,
} from './types'

const props = withDefaults(defineProps<IconPickerProps>(), {
  value: undefined,
  multiple: false,
  showSearch: true,
  placeholder: '搜索图标',
  emptyText: '没有匹配的图标',
  allLabel: '全部图标',
  groupsLabel: '按用途浏览',
  libraryLabel: '图标库',
  countLabel: (count: number) => `${count} 个`,
  clearSearchLabel: '清除搜索',
  columns: undefined,
  itemMinWidth: 72,
  itemHeight: 72,
  height: 420,
  overscan: 4,
  disabled: false,
})

const emit = defineEmits<IconPickerEmits>()

defineSlots<IconPickerSlots>()

const ROW_GAP = 6
const SCROLL_PADDING = 16

const query = ref('')
const activeGroupKey = ref<string | null>(null)
const { value: selectedValue, setValue: setSelectedValue } =
  useControllableState<IconPickerModelValue>({
    value: () => props.value,
    defaultValue: null,
    normalize: (value) => {
      if (value == null) return props.multiple ? [] : null
      if (props.multiple) {
        const list = Array.isArray(value) ? value : [value]
        return [...new Set(list.filter((key): key is string => typeof key === 'string'))]
      }
      return Array.isArray(value) ? (value[0] ?? null) : value
    },
    onChange: (value) => emit('update:value', value),
  })
const focusedKey = ref<string | null>(null)
const scrollRef = ref<HTMLElement>()
const viewportWidth = ref(0)

let resizeObserver: ResizeObserver | undefined

const globalGroups = useIconPickerIcons()
const groups = computed(() => props.items ?? globalGroups.value)
const totalCount = computed(() => groups.value.reduce((sum, group) => sum + group.items.length, 0))
const currentGroup = computed(
  () => groups.value.find((group) => group.key === activeGroupKey.value) ?? null,
)
const groupByItemKey = computed(() => {
  const map = new Map<string, IconPickerGroup>()
  for (const group of groups.value) {
    for (const item of group.items) map.set(item.key, group)
  }
  return map
})
const selectedKeys = computed<ReadonlySet<string>>(() => {
  const value = selectedValue.value
  if (Array.isArray(value)) return new Set(value)
  return value ? new Set([value]) : new Set()
})
const emptySlotProps = computed<IconPickerEmptySlotProps>(() => ({
  group: currentGroup.value,
  query: query.value,
}))
const emptyHint = computed(() => {
  if (query.value) return '换个关键词试试'
  return currentGroup.value ? '当前分组还没有图标' : '当前图标库还没有内容'
})

const filteredItems = computed<IconPickerItem[]>(() => {
  const source = currentGroup.value ? [currentGroup.value] : groups.value
  const keyword = query.value.trim().toLowerCase()

  if (!keyword) return source.flatMap((group) => group.items)

  return source.flatMap((group) =>
    group.items.filter((item) => item.label.toLowerCase().includes(keyword)),
  )
})

const columns = computed(() => {
  if (props.columns && props.columns > 0) return Math.floor(props.columns)

  const width = viewportWidth.value
  if (width <= 0) return 6

  const usable = Math.max(0, width - SCROLL_PADDING)
  return Math.max(1, Math.floor((usable + ROW_GAP) / (props.itemMinWidth + ROW_GAP)))
})

const rowCount = computed(() => Math.ceil(filteredItems.value.length / columns.value))

/**
 * Fall back to the configured height when the browser (or a test environment)
 * has not measured the scroll container yet.
 *
 * Relies on the `@tanstack/vue-virtual` v3 `VirtualizerOptions.observeElementRect`
 * contract: receive a rect callback and return an optional cleanup function.
 * Re-check this adapter when upgrading TanStack Virtual.
 */
function observeElementRect(
  instance: Virtualizer<HTMLElement, Element>,
  callback: (rect: Rect) => void,
): (() => void) | undefined {
  const element = instance.scrollElement
  if (!element) return

  const measure = () => {
    const rect = element.getBoundingClientRect()
    callback({
      width: rect.width || viewportWidth.value || 640,
      height: rect.height || (typeof props.height === 'number' ? props.height : 420),
    })
  }

  measure()

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }
}

const virtualizerOptions = computed(() => ({
  count: rowCount.value,
  getScrollElement: () => scrollRef.value ?? null,
  estimateSize: () => props.itemHeight + ROW_GAP,
  overscan: props.overscan,
  observeElementRect,
  initialRect: {
    width: viewportWidth.value || 640,
    height: typeof props.height === 'number' ? props.height : 420,
  },
}))

const rowVirtualizer = useVirtualizer(virtualizerOptions)
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

const rootStyle = computed<CSSProperties>(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

function rowStyle(row: { start: number }): CSSProperties {
  return {
    height: `${props.itemHeight}px`,
    gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
    transform: `translateY(${row.start}px)`,
  }
}

function rowItems(rowIndex: number): IconPickerItem[] {
  const start = rowIndex * columns.value
  return filteredItems.value.slice(start, start + columns.value)
}

function selectGroup(key: string | null) {
  activeGroupKey.value = key
}

const tabbableKey = computed(() => {
  const items = filteredItems.value
  if (items.length === 0) return null
  if (focusedKey.value && items.some((item) => item.key === focusedKey.value)) {
    return focusedKey.value
  }
  const selectedInView = items.find((item) => selectedKeys.value.has(item.key))
  return selectedInView?.key ?? items[0]?.key ?? null
})

/**
 * The virtualizer renders rows after the scroll position settles, so a single
 * tick is not enough when the target row was outside the viewport. Poll a few
 * frames for the node before giving up.
 */
async function waitForItemNode(key: string): Promise<HTMLElement | null> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const nodes = scrollRef.value?.querySelectorAll<HTMLElement>('.w-icon-picker__item')
    const node = nodes ? Array.from(nodes).find((element) => element.dataset.key === key) : null
    if (node) return node

    await nextTick()
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }

  return null
}

let focusToken = 0

async function focusItemAt(index: number): Promise<void> {
  const items = filteredItems.value
  const target = items[Math.min(Math.max(index, 0), items.length - 1)]
  if (!target) return

  const token = ++focusToken
  focusedKey.value = target.key
  rowVirtualizer.value.scrollToIndex(Math.floor(Math.min(index, items.length - 1) / columns.value))

  const node = await waitForItemNode(target.key)
  // A newer navigation may have started while the virtualizer rendered the
  // target row; only focus if this call is still the latest one.
  if (token !== focusToken || focusedKey.value !== target.key) return
  node?.focus({ preventScroll: true })
}

const listNavigation = useKeyboardNavigation<IconPickerItem>({
  items: filteredItems,
  columns: () => columns.value,
  loop: false,
  activeIndex: () => {
    const index = filteredItems.value.findIndex((item) => item.key === focusedKey.value)
    return index >= 0 ? index : null
  },
  onHighlight: (index: number) => {
    void focusItemAt(index)
  },
})

function handleItemKeydown(event: KeyboardEvent) {
  listNavigation.handleKeydown(event)
}

function choose(item: IconPickerItem) {
  if (props.disabled) return

  focusedKey.value = item.key
  const group = groupByItemKey.value.get(item.key)

  if (props.multiple) {
    const next = new Set(selectedKeys.value)
    const wasSelected = next.has(item.key)
    if (wasSelected) next.delete(item.key)
    else next.add(item.key)

    setSelectedValue([...next])
    if (!wasSelected && group) emit('select', item, group)
    return
  }

  setSelectedValue(item.key)
  if (group) emit('select', item, group)
}

watch(
  [query, activeGroupKey],
  async () => {
    focusedKey.value = null
    await nextTick()
    rowVirtualizer.value.scrollToOffset(0)
  },
  { flush: 'post' },
)

watch(
  () => props.showSearch,
  (show) => {
    if (!show) query.value = ''
  },
)

onMounted(() => {
  const element = scrollRef.value
  if (!element) return

  const measure = () => {
    viewportWidth.value = element.clientWidth
  }

  measure()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(element)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
})
</script>

<template>
  <div
    class="w-icon-picker"
    :class="{ 'is-disabled': disabled }"
    :style="rootStyle"
    role="group"
    aria-label="图标选择器"
  >
    <div v-if="showSearch" class="w-icon-picker__toolbar">
      <div v-if="showSearch" class="w-icon-picker__search">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" stroke-width="1.6" />
          <path
            d="m12.75 12.75 3.75 3.75"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="query"
          type="text"
          :placeholder="placeholder"
          :aria-label="placeholder"
          :disabled="disabled"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          v-if="query"
          type="button"
          class="w-icon-picker__search-clear"
          :aria-label="clearSearchLabel"
          @click="query = ''"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="m4 4 8 8M12 4l-8 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="w-icon-picker__body">
      <aside class="w-icon-picker__sidebar">
        <div class="w-icon-picker__sidebar-title">
          <span>{{ libraryLabel }}</span>
          <span class="w-icon-picker__count">{{ totalCount }}</span>
        </div>

        <div class="w-icon-picker__groups">
          <button
            type="button"
            class="w-icon-picker__group"
            :class="{ 'is-active': activeGroupKey === null }"
            :aria-pressed="activeGroupKey === null"
            @click="selectGroup(null)"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" stroke="currentColor" />
              <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" stroke="currentColor" />
              <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" />
              <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" />
            </svg>
            <span>{{ allLabel }}</span>
            <span class="w-icon-picker__count">{{ totalCount }}</span>
          </button>

          <div v-if="groups.length" class="w-icon-picker__sidebar-label">{{ groupsLabel }}</div>

          <button
            v-for="group in groups"
            :key="group.key"
            type="button"
            class="w-icon-picker__group"
            :class="{ 'is-active': activeGroupKey === group.key }"
            :aria-pressed="activeGroupKey === group.key"
            @click="selectGroup(group.key)"
          >
            <span class="w-icon-picker__group-dot" aria-hidden="true" />
            <span>{{ group.label }}</span>
            <span class="w-icon-picker__count">{{ group.items.length }}</span>
          </button>
        </div>
      </aside>

      <section class="w-icon-picker__main">
        <header class="w-icon-picker__head">
          <span class="w-icon-picker__head-title">
            {{ currentGroup?.label ?? allLabel }}
          </span>
          <span class="w-icon-picker__head-count">{{ countLabel(filteredItems.length) }}</span>
        </header>

        <div ref="scrollRef" class="w-icon-picker__scroll">
          <div
            v-if="filteredItems.length"
            class="w-icon-picker__spacer"
            :style="{ height: `${totalSize}px` }"
          >
            <div
              v-for="row in virtualRows"
              :key="String(row.key)"
              class="w-icon-picker__row"
              :style="rowStyle(row)"
            >
              <button
                v-for="item in rowItems(row.index)"
                :key="item.key"
                type="button"
                class="w-icon-picker__item"
                :class="{ 'is-selected': selectedKeys.has(item.key) }"
                :title="item.label"
                :aria-pressed="selectedKeys.has(item.key)"
                :tabindex="item.key === tabbableKey ? 0 : -1"
                :data-key="item.key"
                :disabled="disabled"
                @focus="focusedKey = item.key"
                @keydown="handleItemKeydown"
                @click="choose(item)"
              >
                <span class="w-icon-picker__glyph">
                  <IconGlyph :icon="item.icon" />
                </span>
                <span class="w-icon-picker__label">{{ item.label }}</span>
                <span
                  v-if="selectedKeys.has(item.key)"
                  class="w-icon-picker__check"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" fill="none">
                    <path
                      d="m4 8.5 2.5 2.5L12 5.5"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div v-else class="w-icon-picker__empty">
            <slot name="empty" v-bind="emptySlotProps">
              <Empty size="sm" :title="emptyText" :description="emptyHint" />
            </slot>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
