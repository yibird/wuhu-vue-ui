<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
  type CSSProperties,
  type VNodeChild,
} from 'vue'
import { toCssUnit, useListNavigation } from '@wuhu-ui/core'
import { pinyin } from 'pinyin-pro'
import type {
  CommandMenuEmptySlotProps,
  CommandMenuItem,
  CommandMenuItemSlotProps,
  CommandMenuKey,
  CommandMenuProps,
} from './types'

defineOptions({
  name: 'WCommandMenu',
})

const props = withDefaults(defineProps<CommandMenuProps>(), {
  modelValue: undefined,
  placeholder: '搜索命令...',
  emptyText: '未找到匹配的命令',
  autoFocus: false,
  filterable: true,
  disabled: false,
  escapeBehavior: 'clear',
  maxHeight: 360,
  ariaLabel: '搜索命令',
  clearLabel: '清除搜索',
})

const emit = defineEmits<{
  'update:modelValue': [key: CommandMenuKey]
  select: [item: CommandMenuItem]
  search: [value: string]
  escape: [event: KeyboardEvent]
  close: []
}>()

defineSlots<{
  /** Replaces the content of every command row. */
  item?: (props: CommandMenuItemSlotProps) => VNodeChild
  /** Replaces the empty-result message. */
  empty?: (props: CommandMenuEmptySlotProps) => VNodeChild
}>()

interface DisplayGroup {
  key: string
  label?: string
  items: CommandMenuItem[]
}

const CJK_CHARACTER = /[\u3400-\u9fff\uf900-\ufaff]/
const UNGROUPED_GROUP_KEY = '__w-command-menu-ungrouped__'
const ALL_ITEMS_GROUP_KEY = '__w-command-menu-all__'

const instance = getCurrentInstance()
const uid = `w-command-menu-${instance?.uid ?? 0}`

const query = ref('')
const hoveredKey = ref<CommandMenuKey | null>(null)
const composing = ref(false)
/**
 * Two independent indexes over the flattened, enabled item list:
 * - selectedIndex is derived from `modelValue`.
 * - highlightIndex is the keyboard cursor and starts empty.
 */
const highlightIndex = ref<number | null>(null)
const inputRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const optionRefs = new Map<CommandMenuKey, HTMLElement>()

/**
 * Pinyin matching is derived once per item rather than on every keystroke.
 * The full pinyin and the initials are both indexed, so "gongzuotai" and
 * "gzt" can find "工作台". Descriptions and keywords are indexed as well.
 */
function buildHaystack(item: CommandMenuItem): string {
  const sources = [item.label, item.description, ...(item.keywords ?? [])]
  const segments: string[] = []

  for (const source of sources) {
    if (!source) continue

    segments.push(source.toLowerCase())

    if (!CJK_CHARACTER.test(source)) continue

    segments.push(
      pinyin(source, {
        toneType: 'none',
        pattern: 'pinyin',
        type: 'array',
        nonZh: 'consecutive',
      })
        .join('')
        .toLowerCase(),
    )
    segments.push(
      pinyin(source, {
        toneType: 'none',
        pattern: 'first',
        type: 'array',
        nonZh: 'consecutive',
      })
        .join('')
        .toLowerCase(),
    )
  }

  return segments.join('\n')
}

const haystackCache = new WeakMap<CommandMenuItem, string>()

function haystackFor(item: CommandMenuItem): string {
  const cached = haystackCache.get(item)
  if (cached !== undefined) return cached

  const value = buildHaystack(item)
  haystackCache.set(item, value)
  return value
}

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const filteredItems = computed<CommandMenuItem[]>(() => {
  // Lazy indexing: avoid running pinyin passes until a query exists.
  if (!props.filterable || !normalizedQuery.value) return props.items

  const tokens = normalizedQuery.value.split(/\s+/).filter(Boolean)
  return props.items.filter((item) => {
    const haystack = haystackFor(item)
    return tokens.every((token) => haystack.includes(token))
  })
})

/**
 * Groups keep their first-appearance order. Ungrouped items are collected
 * into an anonymous bucket inserted where the first ungrouped item appears;
 * they are never dropped. Duplicate group names intentionally merge.
 */
const hasGroups = computed(() => filteredItems.value.some((item) => Boolean(item.group?.trim())))

const groups = computed<DisplayGroup[]>(() => {
  if (!hasGroups.value) {
    return [{ key: ALL_ITEMS_GROUP_KEY, items: filteredItems.value }]
  }

  const result: DisplayGroup[] = []
  const byKey = new Map<string, DisplayGroup>()

  for (const item of filteredItems.value) {
    const label = item.group?.trim()
    const key = label ? `group:${label}` : UNGROUPED_GROUP_KEY
    let group = byKey.get(key)

    if (!group) {
      group = { key, label: label || undefined, items: [] }
      byKey.set(key, group)
      result.push(group)
    }

    group.items.push(item)
  }

  return result
})

// Groups are a pure display concern. Navigation always works on one flattened
// sequence so group headings never become keyboard stops and the cursor can
// move freely across group boundaries.
const flatItems = computed<CommandMenuItem[]>(() => groups.value.flatMap((group) => group.items))

const enabledItems = computed<CommandMenuItem[]>(() =>
  props.disabled ? [] : flatItems.value.filter((item) => !item.disabled),
)

const selectedKey = computed(() => props.modelValue)

const selectedIndex = computed(() => {
  const value = props.modelValue
  if (value === undefined) return -1
  return enabledItems.value.findIndex((item) => item.key === value)
})

const highlightItem = computed<CommandMenuItem | null>(() => {
  const index = highlightIndex.value
  if (index === null) return null
  return enabledItems.value[index] ?? null
})

const highlightKey = computed(() => highlightItem.value?.key ?? null)

const optionIds = computed(() => {
  const ids = new Map<CommandMenuKey, string>()

  flatItems.value.forEach((item, index) => {
    ids.set(item.key, `${uid}-option-${index}`)
  })

  return ids
})

const optionIndexes = computed(() => {
  const indexes = new Map<CommandMenuKey, number>()

  flatItems.value.forEach((item, index) => {
    indexes.set(item.key, index)
  })

  return indexes
})

const activeOptionId = computed(() =>
  highlightItem.value ? optionIds.value.get(highlightItem.value.key) : undefined,
)

const listStyle = computed<CSSProperties>(() => ({
  maxHeight: toCssUnit(props.maxHeight),
}))

function groupHeadingId(index: number): string {
  return `${uid}-group-${index}`
}

function isItemDisabled(item: CommandMenuItem): boolean {
  return props.disabled || Boolean(item.disabled)
}

function focus(): void {
  inputRef.value?.focus({ preventScroll: true })
}

function clearSearch(): void {
  updateQuery('')
}

function handleClear(): void {
  clearSearch()
  focus()
}

/**
 * Dragging the native scrollbar moves focus to the document body in most
 * browsers, which would stop arrow keys from reaching the menu. Restore focus
 * after pointer interaction unless the user intentionally focused something
 * inside the list (for example a custom item action).
 */
function handleListMouseUp(): void {
  if (props.disabled) return

  const active = document.activeElement
  if (active === inputRef.value) return
  if (active instanceof HTMLElement && listRef.value?.contains(active)) return
  focus()
}

function updateQuery(value: string): void {
  if (query.value === value) return
  query.value = value
  emit('search', value)
}

function handleInput(event: Event): void {
  updateQuery((event.target as HTMLInputElement).value)
}

function handleCompositionStart(): void {
  composing.value = true
}

function handleCompositionEnd(event: CompositionEvent): void {
  composing.value = false
  // Safari/Firefox may order the final input event differently; resync once.
  updateQuery((event.target as HTMLInputElement).value)
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) return

  // Ignore Enter/arrows while an IME candidate list is open.
  if (event.isComposing || composing.value || event.keyCode === 229) return

  if (event.key === 'Escape') {
    handleEscape(event)
    return
  }

  if (listNavigation.handleKeydown(event)) {
    // Keep the key from reaching outer shortcut or scroll handlers.
    event.stopPropagation()
  }
}

function setHighlightIndex(index: number | null): void {
  const length = enabledItems.value.length
  highlightIndex.value = index === null || index < 0 || index >= length ? null : index
  // The pointer may still rest over another row; drop that stale hover state so
  // only the keyboard-highlighted row stays highlighted.
  hoveredKey.value = null
}

const listNavigation = useListNavigation<CommandMenuItem>({
  items: enabledItems,
  activeIndex: () => {
    if (highlightIndex.value !== null) return highlightIndex.value
    return selectedIndex.value >= 0 ? selectedIndex.value : null
  },
  loop: true,
  onHighlight: (index: number) => setHighlightIndex(index),
  onActivate: (item: CommandMenuItem) => selectItem(item),
  isComposing: () => composing.value,
})

function handleEscape(event: KeyboardEvent): void {
  emit('escape', event)

  if (props.escapeBehavior === 'close') {
    event.preventDefault()
    emit('close')
    return
  }

  if (props.escapeBehavior === 'clear' && query.value) {
    event.preventDefault()
    updateQuery('')
  }
}

function selectItem(item: CommandMenuItem): void {
  if (isItemDisabled(item)) return

  emit('update:modelValue', item.key)
  emit('select', item)
}

function handleItemHover(item: CommandMenuItem): void {
  if (isItemDisabled(item)) {
    hoveredKey.value = null
    return
  }

  // Keep the keyboard highlight in sync while the pointer moves between rows.
  hoveredKey.value = item.key
  const index = enabledItems.value.findIndex((candidate) => candidate.key === item.key)
  if (index >= 0) highlightIndex.value = index
}

function clearHover(): void {
  hoveredKey.value = null
}

function handleListMouseOver(event: MouseEvent): void {
  if (event.target === event.currentTarget) clearHover()
}

function setOptionRef(el: Element | ComponentPublicInstance | null, key: CommandMenuKey): void {
  if (el instanceof HTMLElement) {
    optionRefs.set(key, el)
  } else {
    optionRefs.delete(key)
  }
}

function scrollActiveIntoView(): void {
  const list = listRef.value
  const key = highlightKey.value

  if (!list || key === null) return

  const option = optionRefs.get(key)
  if (!option) return

  // For the first row of a group, reveal the group heading too. Otherwise
  // scrolling from the bottom to the top leaves the heading clipped above the
  // viewport even though the row itself is visible.
  const previous = option.previousElementSibling
  const anchor =
    previous instanceof HTMLElement && previous.classList.contains('w-command-menu__group-label')
      ? previous
      : option

  const listRect = list.getBoundingClientRect()
  const optionRect = option.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()

  // Scrolling down still follows the row itself (the heading sits above it);
  // scrolling up reveals the heading when the row is first in its group.
  if (optionRect.bottom > listRect.bottom) {
    list.scrollTop += optionRect.bottom - listRect.bottom
  } else if (anchorRect.top < listRect.top) {
    list.scrollTop -= listRect.top - anchorRect.top
  }
}

// Reset a stale highlight when the visible set changes. The highlight index is
// not persisted across filtering because the same index may point at a
// different row; falling back to the selected row keeps it deterministic.
watch(enabledItems, () => {
  if (highlightIndex.value === null) return
  setHighlightIndex(selectedIndex.value)
})

// Duplicate keys break option ids, selection and `aria-activedescendant`.
// Warn (do not throw) so existing consumers keep working in development.
watch(
  () => props.items,
  (items) => {
    if (!import.meta.env.DEV) return

    const seen = new Set<CommandMenuKey>()
    const duplicates = new Set<CommandMenuKey>()

    for (const item of items) {
      if (seen.has(item.key)) duplicates.add(item.key)
      else seen.add(item.key)
    }

    if (duplicates.size > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[CommandMenu] Duplicate item key(s): ${[...duplicates]
          .map((key) => String(key))
          .join(', ')}. Keys must be unique for selection and ARIA to work correctly.`,
      )
    }
  },
  { immediate: true },
)

watch([highlightIndex, flatItems], async () => {
  await nextTick()
  scrollActiveIntoView()
})

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) hoveredKey.value = null
  },
)

onMounted(() => {
  if (props.autoFocus && !props.disabled) focus()
})

onBeforeUnmount(() => {
  optionRefs.clear()
})

defineExpose({
  focus,
  clearSearch,
})
</script>

<template>
  <div
    class="w-command-menu"
    :class="[{ 'is-disabled': disabled }, props.classes?.root]"
    :style="props.styles?.root"
    @keydown="handleKeydown"
  >
    <div
      class="w-command-menu__search"
      :class="props.classes?.search"
      :style="props.styles?.search"
    >
      <svg
        class="w-command-menu__search-icon"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8.75" cy="8.75" r="5.25" />
        <path d="m12.75 12.75 3.75 3.75" />
      </svg>

      <input
        ref="inputRef"
        class="w-command-menu__input"
        :class="props.classes?.input"
        :style="props.styles?.input"
        type="text"
        role="combobox"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :value="query"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        aria-autocomplete="list"
        aria-expanded="true"
        :aria-controls="`${uid}-listbox`"
        :aria-activedescendant="activeOptionId"
        :aria-disabled="disabled || undefined"
        @input="handleInput"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />

      <button
        v-if="query"
        type="button"
        class="w-command-menu__clear"
        :class="props.classes?.clear"
        :style="props.styles?.clear"
        :aria-label="clearLabel"
        :title="clearLabel"
        @mousedown.prevent
        @click="handleClear"
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

    <div
      :id="`${uid}-listbox`"
      ref="listRef"
      class="w-command-menu__list"
      :class="props.classes?.list"
      :style="[listStyle, props.styles?.list]"
      role="listbox"
      :aria-label="ariaLabel"
      @mouseleave="clearHover"
      @mouseover="handleListMouseOver"
      @mouseup="handleListMouseUp"
    >
      <template v-if="flatItems.length > 0">
        <div
          v-for="(group, groupIndex) in groups"
          :key="group.key"
          class="w-command-menu__group"
          :class="props.classes?.group"
          :style="props.styles?.group"
          :role="group.label ? 'group' : undefined"
          :aria-labelledby="group.label ? groupHeadingId(groupIndex) : undefined"
        >
          <div
            v-if="group.label"
            :id="groupHeadingId(groupIndex)"
            class="w-command-menu__group-label"
            :class="props.classes?.groupLabel"
            :style="props.styles?.groupLabel"
            @mouseenter="clearHover"
          >
            {{ group.label }}
          </div>

          <div
            v-for="item in group.items"
            :id="optionIds.get(item.key)"
            :key="item.key"
            :ref="(el) => setOptionRef(el, item.key)"
            class="w-command-menu__item"
            :class="[
              {
                'is-active': item.key === highlightKey,
                'is-hovered': item.key === hoveredKey,
                'is-selected': item.key === selectedKey,
                'is-disabled': isItemDisabled(item),
              },
              props.classes?.item,
            ]"
            :style="props.styles?.item"
            role="option"
            :aria-selected="item.key === selectedKey"
            :aria-disabled="isItemDisabled(item) || undefined"
            @mouseenter="handleItemHover(item)"
            @mousedown.prevent
            @click="selectItem(item)"
          >
            <slot
              name="item"
              :item="item"
              :index="optionIndexes.get(item.key) ?? 0"
              :active="item.key === highlightKey"
              :selected="item.key === selectedKey"
              :disabled="isItemDisabled(item)"
              :select="() => selectItem(item)"
            >
              <span v-if="item.icon" class="w-command-menu__item-icon" aria-hidden="true">
                <span v-if="typeof item.icon === 'string'">{{ item.icon }}</span>
                <component :is="item.icon" v-else focusable="false" />
              </span>

              <span class="w-command-menu__item-content">
                <span class="w-command-menu__item-label">{{ item.label }}</span>
                <span v-if="item.description" class="w-command-menu__item-description">
                  {{ item.description }}
                </span>
              </span>

              <kbd v-if="item.shortcut" class="w-command-menu__shortcut">{{ item.shortcut }}</kbd>
            </slot>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="flatItems.length === 0"
      class="w-command-menu__empty"
      :class="props.classes?.empty"
      :style="props.styles?.empty"
      role="status"
    >
      <slot name="empty" :query="query">{{ emptyText }}</slot>
    </div>
  </div>
</template>
