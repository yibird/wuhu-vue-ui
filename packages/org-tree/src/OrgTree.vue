<script setup lang="ts">
import {
  clamp,
  clampToViewport,
  toCssUnit,
  useControllableState,
  useDismissable,
  useKeyboardNavigation,
  usePointerDrag,
} from '@wuhu-vue-ui/core'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import OrgTreeNodeComponent from './OrgTreeNode.vue'
import {
  isUsableOrgTreeNode,
  nodeChildren,
  nodeId,
  nodeKey,
  normalizeKeys,
  orgTreeIdKey,
} from './utils'
import type {
  OrgTreeDragEndEvent,
  OrgTreeDragPosition,
  OrgTreeExpandSlotProps,
  OrgTreeId,
  OrgTreeMenuItem,
  OrgTreeNode,
  OrgTreeNodeSlotProps,
  OrgTreeProps,
  OrgTreeReparentEvent,
  OrgTreeZoomEvent,
} from './types'

const props = withDefaults(defineProps<OrgTreeProps>(), {
  keys: () => ({}),
  horizontal: false,
  collapsable: true,
  defaultExpandLevel: 2,
  defaultExpandKeys: () => [],
  draggable: true,
  scalable: true,
  wheelZoom: 'always',
  nodeDraggable: false,
  dropOnEmpty: true,
  mutateData: true,
  disabled: false,
  ariaLabel: '组织架构图',
  expandLabel: '展开',
  collapseLabel: '收起',
  onlyOneNode: false,
  center: false,
  defaultScale: 1,
  minScale: 0.3,
  maxScale: 3,
  defaultOffset: () => ({}),
  contextMenu: () => [
    { label: '编辑节点', command: 'edit' },
    { label: '新增子节点', command: 'add' },
    { label: '删除节点', command: 'delete' },
  ],
  emptyText: '暂无数据',
  minHeight: 400,
})

const emit = defineEmits<{
  'update:expandKeys': [keys: OrgTreeId[]]
  'update:selectedKey': [key: OrgTreeId | null]
  'node-click': [node: OrgTreeNode, event: MouseEvent]
  'node-dblclick': [node: OrgTreeNode, event: MouseEvent]
  'node-contextmenu': [node: OrgTreeNode, event: MouseEvent]
  expand: [node: OrgTreeNode, expanded: boolean]
  'expand-all': [expanded: boolean]
  'node-drag-start': [node: OrgTreeNode]
  'node-drag': [node: OrgTreeNode, position: OrgTreeDragPosition]
  'node-drag-end': [event: OrgTreeDragEndEvent]
  'node-reparent': [event: OrgTreeReparentEvent]
  'menu-click': [command: string, node: OrgTreeNode]
  pan: [translate: { x: number; y: number }]
  zoom: [event: OrgTreeZoomEvent]
}>()

defineSlots<{
  default?: (props: OrgTreeNodeSlotProps) => unknown
  node?: (props: OrgTreeNodeSlotProps) => unknown
  expand?: (props: OrgTreeExpandSlotProps) => unknown
  empty?: () => unknown
}>()

const DRAG_THRESHOLD = 4
const PAN_MARGIN = 40

interface NodeEntry {
  node: OrgTreeNode
  key: string
  depth: number
  parent: OrgTreeNode | null
  hasChildren: boolean
}

interface PointerState {
  mode: 'pan' | 'node'
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  active: boolean
  node: OrgTreeNode | null
  nodeKey: string | null
  capture: HTMLElement | null
}

interface MenuState {
  visible: boolean
  x: number
  y: number
  node: OrgTreeNode | null
}

const viewportRef = ref<HTMLElement>()
const canvasRef = ref<HTMLElement>()

const keys = computed(() => normalizeKeys(props.keys))
const dataVersion = ref(0)
const unmounted = ref(false)

const scale = ref(clamp(props.defaultScale, props.minScale, props.maxScale))
const translate = reactive({ x: props.defaultOffset.x ?? 0, y: props.defaultOffset.y ?? 0 })

const isPanning = ref(false)
const draggingKey = ref<string | null>(null)
const dropKey = ref<string | null>(null)
const focusedKey = ref<string | null>(null)

let pointerState: PointerState | null = null
let lastDragAt = 0
let dragRequest = 0

const menu = ref<MenuState>({ visible: false, x: 0, y: 0, node: null })
const menuRef = ref<HTMLElement | null>(null)
const menuTriggerKey = ref<string | null>(null)

const rawRootNodes = computed<OrgTreeNode[]>(() => {
  void dataVersion.value
  if (Array.isArray(props.data)) {
    return props.data.filter((node) => isUsableOrgTreeNode(node, keys.value))
  }
  return isUsableOrgTreeNode(props.data, keys.value) ? [props.data] : []
})

const indexState = computed(() => {
  void dataVersion.value
  const entries: NodeEntry[] = []
  const byKey = new Map<string, NodeEntry>()
  const parentOf = new Map<string, OrgTreeNode | null>()
  const duplicates = new WeakSet<OrgTreeNode>()
  const seen = new Set<string>()

  function walk(nodes: OrgTreeNode[], depth: number, parent: OrgTreeNode | null) {
    for (const node of nodes) {
      if (!isUsableOrgTreeNode(node, keys.value)) continue
      const key = nodeKey(node, keys.value)
      if (seen.has(key)) {
        duplicates.add(node)
        continue
      }
      seen.add(key)
      const children = nodeChildren(node, keys.value)
      entries.push({
        node,
        key,
        depth,
        parent,
        hasChildren: children.length > 0,
      })
      byKey.set(key, entries[entries.length - 1]!)
      parentOf.set(key, parent)
      walk(children, depth + 1, node)
    }
  }

  walk(rawRootNodes.value, 0, null)
  return { entries, byKey, parentOf, duplicates }
})

const allEntries = computed(() => indexState.value.entries)
const visibleRootNodes = computed(() =>
  rawRootNodes.value.filter((node) => !indexState.value.duplicates.has(node)),
)

/** Visible entries in depth-first order, used for roving keyboard focus. */
const visibleEntries = computed<NodeEntry[]>(() => {
  const result: NodeEntry[] = []
  const walk = (nodes: OrgTreeNode[]) => {
    for (const node of nodes) {
      if (indexState.value.duplicates.has(node)) continue
      const entry = indexState.value.byKey.get(nodeKey(node, keys.value))
      if (!entry) continue
      result.push(entry)
      if (entry.hasChildren && expandKeysSet.value.has(entry.key)) {
        walk(nodeChildren(node, keys.value))
      }
    }
  }
  walk(rawRootNodes.value)
  return result
})

/** Roving tabindex: only the current (or first visible) node is a tab stop. */
const tabStopKey = computed(() => {
  const key = focusedKey.value
  if (key && visibleEntries.value.some((entry) => entry.key === key)) return key
  return visibleEntries.value[0]?.key ?? null
})

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

const internalExpandKeys = ref<Set<string>>(new Set())
const expandControlled = computed(() => props.expandKeys !== undefined)
const expandKeysSet = computed<ReadonlySet<string>>(() => {
  if (expandControlled.value) {
    return new Set((props.expandKeys ?? []).map((key) => orgTreeIdKey(key)))
  }
  return internalExpandKeys.value
})

let expansionInitialized = false
let knownKeys = new Set<string>()
const explicitExpandState = new Map<string, boolean | undefined>()

function serializeExpansion(set: ReadonlySet<string>): OrgTreeId[] {
  return allEntries.value
    .filter((entry) => set.has(entry.key))
    .map((entry) => nodeId(entry.node, keys.value))
}

function commitExpansion(next: Set<string>, notify = true) {
  if (expandControlled.value) {
    if (notify) emit('update:expandKeys', serializeExpansion(next))
    return
  }
  internalExpandKeys.value = next
  if (notify) emit('update:expandKeys', serializeExpansion(next))
}

function reconcileExpansion() {
  const entries = allEntries.value
  const valid = new Set(entries.map((entry) => entry.key))

  if (expandControlled.value) {
    expansionInitialized = true
    knownKeys = valid
    return
  }

  const next = expansionInitialized
    ? new Set([...internalExpandKeys.value].filter((key) => valid.has(key)))
    : new Set<string>()
  const defaults = new Set(props.defaultExpandKeys.map((key) => orgTreeIdKey(key)))

  for (const entry of entries) {
    if (!entry.hasChildren) continue
    const explicit = typeof entry.node.expand === 'boolean' ? entry.node.expand : undefined

    if (!expansionInitialized) {
      if (explicit === true) next.add(entry.key)
      else if (
        explicit !== false &&
        (defaults.has(entry.key) || entry.depth < props.defaultExpandLevel)
      ) {
        next.add(entry.key)
      }
    } else if (!knownKeys.has(entry.key)) {
      if (explicit === true || (explicit !== false && entry.depth < props.defaultExpandLevel)) {
        next.add(entry.key)
      }
    } else {
      const previous = explicitExpandState.get(entry.key)
      if (explicit !== previous && explicit !== undefined) {
        if (explicit) next.add(entry.key)
        else next.delete(entry.key)
      }
    }

    explicitExpandState.set(entry.key, explicit)
  }

  for (const key of explicitExpandState.keys()) {
    if (!valid.has(key)) explicitExpandState.delete(key)
  }

  knownKeys = valid
  expansionInitialized = true
  internalExpandKeys.value = next
}

watch(allEntries, reconcileExpansion, { immediate: true })

function isExpanded(entry: NodeEntry): boolean {
  return !props.collapsable || expandKeysSet.value.has(entry.key)
}

function toggleNode(node: OrgTreeNode) {
  if (props.disabled || !props.collapsable) return
  const key = nodeKey(node, keys.value)
  const entry = indexState.value.byKey.get(key)
  if (!entry || !entry.hasChildren) return

  const expanded = !expandKeysSet.value.has(key)
  const next = new Set(expandKeysSet.value)
  if (expanded) next.add(key)
  else next.delete(key)

  commitExpansion(next)
  emit('expand', node, expanded)
}

function expandAll() {
  if (props.disabled || !props.collapsable) return
  const next = new Set<string>()
  for (const entry of allEntries.value) {
    if (entry.hasChildren) next.add(entry.key)
  }
  commitExpansion(next)
  emit('expand-all', true)
}

function collapseAll() {
  if (props.disabled || !props.collapsable) return
  commitExpansion(new Set())
  emit('expand-all', false)
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

const { value: selectedKey, setValue: setSelectedKey } = useControllableState<OrgTreeId | null>({
  value: () => props.selectedKey,
  defaultValue: null,
  onChange: (value) => emit('update:selectedKey', value),
})
const selectedKeyString = computed(() => {
  const value = selectedKey.value
  return value === null || value === undefined ? null : orgTreeIdKey(value)
})

function selectNode(node: OrgTreeNode) {
  if (props.disabled || node.disabled) return
  const id = nodeId(node, keys.value)
  if (orgTreeIdKey(id) === selectedKeyString.value) return
  setSelectedKey(id)
}

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */

function isInteractiveTarget(target: Element | null): boolean {
  if (!target) return false
  return Boolean(target.closest('button, a, input, textarea, select, [data-org-no-drag]'))
}

function entryFromElement(element: Element | null): NodeEntry | null {
  const card = element?.closest('.w-org-tree__node-card')
  if (!card) return null
  const key = card.getAttribute('data-org-key')
  if (key === null) return null
  return indexState.value.byKey.get(key) ?? null
}

function resolveEntryAt(
  clientX: number,
  clientY: number,
  fallback: EventTarget | null,
): NodeEntry | null {
  let element: Element | null = null
  if (typeof document !== 'undefined' && typeof document.elementFromPoint === 'function') {
    try {
      element = document.elementFromPoint(clientX, clientY)
    } catch {
      element = null
    }
  }
  if (!element && typeof Element !== 'undefined' && fallback instanceof Element) {
    element = fallback
  }
  return entryFromElement(element)
}

function isBlankViewportTarget(fallback: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(fallback instanceof Element)) return false
  const viewport = viewportRef.value
  if (!viewport || !viewport.contains(fallback)) return false
  return !fallback.closest('.w-org-tree__node-card')
}

/* ------------------------------------------------------------------ */
/* Canvas position                                                     */
/* ------------------------------------------------------------------ */

function clampTranslation(x: number, y: number): { x: number; y: number } {
  const viewport = viewportRef.value
  if (!viewport) return { x, y }
  const width = viewport.clientWidth
  const height = viewport.clientHeight
  // jsdom and display:none containers report zero; clamping would trap the
  // canvas at an arbitrary offset, so leave the value untouched.
  if (width <= 0 || height <= 0) return { x, y }

  const canvas = canvasRef.value
  const contentWidth = (canvas?.offsetWidth ?? 0) * scale.value
  const contentHeight = (canvas?.offsetHeight ?? 0) * scale.value
  const minX = PAN_MARGIN - contentWidth
  const maxX = width - PAN_MARGIN
  const minY = PAN_MARGIN - contentHeight
  const maxY = height - PAN_MARGIN

  return {
    x: clamp(x, Math.min(minX, maxX), Math.max(minX, maxX)),
    y: clamp(y, Math.min(minY, maxY), Math.max(minY, maxY)),
  }
}

function setTranslation(x: number, y: number) {
  const next = clampTranslation(x, y)
  translate.x = next.x
  translate.y = next.y
}

function zoomAt(nextScale: number, clientX?: number, clientY?: number) {
  const clamped = clamp(nextScale, props.minScale, props.maxScale)
  if (Math.abs(clamped - scale.value) < 0.0001) return

  const viewport = viewportRef.value
  if (!viewport || viewport.clientWidth <= 0 || viewport.clientHeight <= 0) {
    scale.value = clamped
  } else {
    const rect = viewport.getBoundingClientRect()
    const px = (clientX ?? rect.left + viewport.clientWidth / 2) - rect.left
    const py = (clientY ?? rect.top + viewport.clientHeight / 2) - rect.top
    const ratio = clamped / scale.value
    const nextX = px - (px - translate.x) * ratio
    const nextY = py - (py - translate.y) * ratio
    scale.value = clamped
    setTranslation(nextX, nextY)
  }

  emit('zoom', { scale: scale.value, translate: { x: translate.x, y: translate.y } })
}

function zoomIn() {
  zoomAt(scale.value * 1.2)
}

function zoomOut() {
  zoomAt(scale.value / 1.2)
}

function center(notify = true) {
  const viewport = viewportRef.value
  const canvas = canvasRef.value
  if (!viewport || !canvas) return
  const width = viewport.clientWidth
  const height = viewport.clientHeight
  if (width <= 0 || height <= 0) return
  translate.x = (width - canvas.offsetWidth * scale.value) / 2
  translate.y = (height - canvas.offsetHeight * scale.value) / 2
  if (notify) {
    emit('zoom', { scale: scale.value, translate: { x: translate.x, y: translate.y } })
  }
}

function fit() {
  const viewport = viewportRef.value
  const canvas = canvasRef.value
  if (!viewport || !canvas) return
  const width = viewport.clientWidth
  const height = viewport.clientHeight
  const contentWidth = canvas.offsetWidth
  const contentHeight = canvas.offsetHeight
  if (width <= 0 || height <= 0 || contentWidth <= 0 || contentHeight <= 0) return

  const padding = 24
  const next = Math.min(
    (width - padding * 2) / contentWidth,
    (height - padding * 2) / contentHeight,
  )
  scale.value = clamp(next, props.minScale, props.maxScale)
  center(false)
  emit('zoom', { scale: scale.value, translate: { x: translate.x, y: translate.y } })
}

function resetView() {
  scale.value = clamp(props.defaultScale, props.minScale, props.maxScale)
  translate.x = props.defaultOffset.x ?? 0
  translate.y = props.defaultOffset.y ?? 0
  if (props.center) center(false)
  emit('zoom', { scale: scale.value, translate: { x: translate.x, y: translate.y } })
}

function handleWheel(event: WheelEvent) {
  if (!props.scalable || props.disabled || props.wheelZoom === 'none') return
  if (props.wheelZoom === 'ctrl' && !(event.ctrlKey || event.metaKey)) return
  event.preventDefault()
  const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
  zoomAt(scale.value * factor, event.clientX, event.clientY)
}

/* ------------------------------------------------------------------ */
/* Pointer interaction                                                 */
/* ------------------------------------------------------------------ */

function handlePointerDown(event: PointerEvent) {
  if (props.disabled || event.button !== 0) return

  const target = event.target as Element | null
  if (isInteractiveTarget(target)) return

  const entry = entryFromElement(target)
  let mode: PointerState['mode'] | null = null

  if (entry && props.nodeDraggable && !entry.node.disabled) {
    mode = 'node'
  } else if (props.draggable) {
    mode = 'pan'
  }

  if (!mode) return

  event.preventDefault()
  closeMenu()

  const capture = viewportRef.value
  pointerState = {
    mode,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    active: false,
    node: entry?.node ?? null,
    nodeKey: entry?.key ?? null,
    capture: capture ?? null,
  }

  try {
    capture?.setPointerCapture(event.pointerId)
  } catch {
    // Pointer capture is best-effort.
  }

  drag.start(event)
  window.addEventListener('keydown', handleInteractionKeydown)
}

function activatePointer(state: PointerState) {
  state.active = true
  if (state.mode === 'pan') {
    isPanning.value = true
  } else if (state.node && state.nodeKey) {
    draggingKey.value = state.nodeKey
    emit('node-drag-start', state.node)
  }
}

function handlePointerMove(event: PointerEvent) {
  const state = pointerState
  if (!state || event.pointerId !== state.pointerId) return

  if (!state.active) {
    const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY)
    if (distance < DRAG_THRESHOLD) return
    activatePointer(state)
  }

  if (state.mode === 'pan') {
    const deltaX = event.clientX - state.lastX
    const deltaY = event.clientY - state.lastY
    setTranslation(translate.x + deltaX, translate.y + deltaY)
    state.lastX = event.clientX
    state.lastY = event.clientY
    emit('pan', { x: translate.x, y: translate.y })
    return
  }

  if (state.node && state.nodeKey) {
    const entry = resolveEntryAt(event.clientX, event.clientY, event.target)
    dropKey.value = entry && canDrop(state.nodeKey, entry) ? entry.key : null
    emit('node-drag', state.node, { x: event.clientX, y: event.clientY })
  }
}

function handlePointerUp(event: PointerEvent) {
  const state = pointerState
  if (!state || event.pointerId !== state.pointerId) return

  if (!state.active) {
    finishPointer()
    return
  }

  if (state.mode === 'pan') {
    emit('pan', { x: translate.x, y: translate.y })
    finishPointer()
    return
  }

  const node = state.node
  const nodeKeyValue = state.nodeKey
  const entry = resolveEntryAt(event.clientX, event.clientY, event.target)
  const rootDrop = !entry && isBlankViewportTarget(event.target)
  finishPointer()

  if (node && nodeKeyValue) {
    void finishNodeDrag(node, nodeKeyValue, entry, rootDrop)
  }
}

function handlePointerCancel(event: PointerEvent) {
  const state = pointerState
  if (!state || event.pointerId !== state.pointerId) return
  cancelInteraction()
}

function handleInteractionKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  cancelInteraction()
}

function finishPointer() {
  const state = pointerState
  pointerState = null
  isPanning.value = false
  draggingKey.value = null
  dropKey.value = null

  drag.stop()
  window.removeEventListener('keydown', handleInteractionKeydown)

  if (state?.capture) {
    try {
      state.capture.releasePointerCapture(state.pointerId)
    } catch {
      // Already released.
    }
  }

  if (state?.active) lastDragAt = Date.now()
}

const drag = usePointerDrag({
  onMove: handlePointerMove,
  onEnd: handlePointerUp,
  onCancel: handlePointerCancel,
})

function cancelInteraction() {
  const state = pointerState
  if (!state) return
  const { active, mode, node, nodeKey: key } = state
  finishPointer()

  if (active && mode === 'node' && node && key) {
    const parent = indexState.value.byKey.get(key)?.parent ?? null
    emit('node-drag-end', { node, parent, canceled: true, changed: false })
  }
}

/* ------------------------------------------------------------------ */
/* Node dragging                                                       */
/* ------------------------------------------------------------------ */

function canDrop(dragKey: string, entry: NodeEntry): boolean {
  if (props.disabled) return false
  if (entry.key === dragKey) return false
  if (entry.node.disabled) return false

  const currentParent = indexState.value.parentOf.get(dragKey) ?? null
  if (currentParent && nodeKey(currentParent, keys.value) === entry.key) return false

  let parent = indexState.value.parentOf.get(entry.key) ?? null
  while (parent) {
    if (nodeKey(parent, keys.value) === dragKey) return false
    parent = indexState.value.parentOf.get(nodeKey(parent, keys.value)) ?? null
  }

  return true
}

function ensureChildren(node: OrgTreeNode): OrgTreeNode[] {
  const field = keys.value.children
  const value = node[field]
  if (Array.isArray(value)) return value as OrgTreeNode[]
  const children: OrgTreeNode[] = []
  node[field] = children
  return children
}

function detachNode(node: OrgTreeNode, key: string): boolean {
  const entry = indexState.value.byKey.get(key)
  if (entry?.parent) {
    const siblings = ensureChildren(entry.parent)
    const index = siblings.indexOf(node)
    if (index === -1) return false
    siblings.splice(index, 1)
    return true
  }

  if (!Array.isArray(props.data)) return false
  const index = props.data.indexOf(node)
  if (index === -1) return false
  props.data.splice(index, 1)
  return true
}

function ensureParentExpanded(parent: OrgTreeNode) {
  const parentEntry = indexState.value.byKey.get(nodeKey(parent, keys.value))
  if (parentEntry?.hasChildren && !expandKeysSet.value.has(parentEntry.key)) {
    const next = new Set(expandKeysSet.value)
    next.add(parentEntry.key)
    commitExpansion(next)
  }
}

function reparentNode(node: OrgTreeNode, key: string, parent: OrgTreeNode): boolean {
  // Move the original node object: never clone it, otherwise the consumer's
  // reference and the rendered nodes diverge.
  if (!detachNode(node, key)) return false
  ensureChildren(parent).push(node)
  dataVersion.value += 1
  ensureParentExpanded(parent)
  return true
}

function moveNodeToRoot(node: OrgTreeNode, key: string): boolean {
  if (!Array.isArray(props.data)) return false
  const entry = indexState.value.byKey.get(key)
  if (!entry || entry.parent === null) return false
  if (props.onlyOneNode && props.data.some((root) => root !== node)) return false
  if (!detachNode(node, key)) return false
  props.data.push(node)
  dataVersion.value += 1
  return true
}

async function finishNodeDrag(
  node: OrgTreeNode,
  key: string,
  target: NodeEntry | null,
  rootDrop: boolean,
) {
  const request = ++dragRequest
  let canceled = false

  if (target) {
    if (!canDrop(key, target)) {
      canceled = true
    } else if (props.beforeDragEnd) {
      try {
        const allowed = await props.beforeDragEnd(node, target.node)
        if (request !== dragRequest || unmounted.value) return
        if (!allowed) canceled = true
      } catch {
        if (request !== dragRequest || unmounted.value) return
        canceled = true
      }
    }
  } else if (!rootDrop || !props.dropOnEmpty) {
    canceled = true
  }

  if (request !== dragRequest || unmounted.value) return

  if (canceled) {
    const parent = indexState.value.byKey.get(key)?.parent ?? null
    emit('node-drag-end', { node, parent, canceled: true, changed: false })
    return
  }

  if (target && !canDrop(key, target)) {
    const parent = indexState.value.byKey.get(key)?.parent ?? null
    emit('node-drag-end', { node, parent, canceled: true, changed: false })
    return
  }

  const parent = target?.node ?? null
  const previousParent = indexState.value.byKey.get(key)?.parent ?? null
  let changed: boolean

  if (props.mutateData) {
    changed = parent ? reparentNode(node, key, parent) : moveNodeToRoot(node, key)
  } else {
    // Immutable/read-only mode: emit the payload and let the parent update data.
    changed = parent !== previousParent
    if (changed) {
      const event: OrgTreeReparentEvent = {
        id: nodeId(node, keys.value),
        node,
        parent,
        previousParent,
      }
      emit('node-reparent', event)
      if (parent) ensureParentExpanded(parent)
    }
  }

  emit('node-drag-end', {
    node,
    parent,
    canceled: !changed,
    changed,
  })
}

/* ------------------------------------------------------------------ */
/* Clicks, keyboard and context menu                                   */
/* ------------------------------------------------------------------ */

function handleClick(event: MouseEvent) {
  if (props.disabled) return
  if (Date.now() - lastDragAt < 120) return

  const target = event.target as Element | null
  if (isInteractiveTarget(target)) return

  const entry = entryFromElement(target)
  if (!entry) return

  selectNode(entry.node)
  emit('node-click', entry.node, event)
}

function handleDoubleClick(event: MouseEvent) {
  if (props.disabled) return
  if (Date.now() - lastDragAt < 120) return

  const target = event.target as Element | null
  if (isInteractiveTarget(target)) return

  const entry = entryFromElement(target)
  if (entry) emit('node-dblclick', entry.node, event)
}

function focusEntry(entry: NodeEntry | undefined) {
  if (!entry) return
  const cards = viewportRef.value?.querySelectorAll<HTMLElement>('.w-org-tree__node-card')
  const card = cards
    ? Array.from(cards).find((element) => element.dataset.orgKey === entry.key)
    : null
  card?.focus({ preventScroll: true })
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  const target = event.target as Element | null
  if (isInteractiveTarget(target)) return

  const entry = entryFromElement(target)
  if (!entry) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectNode(entry.node)
    return
  }

  const entries = visibleEntries.value
  const index = entries.findIndex((item) => item.key === entry.key)

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (entries.length === 0) return
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = Math.min(Math.max(index + delta, 0), entries.length - 1)
    focusEntry(entries[nextIndex])
    return
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusEntry(event.key === 'Home' ? entries[0] : entries[entries.length - 1])
    return
  }

  if (event.key === 'ArrowRight' && entry.hasChildren && !isExpanded(entry)) {
    event.preventDefault()
    toggleNode(entry.node)
    return
  }

  if (event.key === 'ArrowRight' && isExpanded(entry)) {
    event.preventDefault()
    const child = entries[index + 1]
    if (child && child.parent === entry.node) focusEntry(child)
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (entry.hasChildren && isExpanded(entry)) {
      toggleNode(entry.node)
      return
    }
    if (entry.parent) {
      const parentEntry = entries.find((item) => item.node === entry.parent)
      focusEntry(parentEntry)
    }
  }
}

function menuItems(): OrgTreeMenuItem[] {
  return props.contextMenu === false ? [] : props.contextMenu
}

function closeMenu() {
  if (!menu.value.visible) return
  const triggerKey = menuTriggerKey.value
  menu.value = { ...menu.value, visible: false, node: null }
  menuDismiss.stop()
  menuTriggerKey.value = null
  if (triggerKey && !unmounted.value) {
    nextTick(() => focusEntry(indexState.value.byKey.get(triggerKey)))
  }
}

function handleFocusIn(event: FocusEvent) {
  const target = event.target as Element | null
  const key = target?.closest('.w-org-tree__node-card')?.getAttribute('data-org-key')
  if (key) focusedKey.value = key
}

function menuButtons(): HTMLButtonElement[] {
  return Array.from(
    menuRef.value?.querySelectorAll<HTMLButtonElement>('.w-org-tree__menu-item:not(:disabled)') ??
      [],
  )
}

const menuNavigation = useKeyboardNavigation({
  items: () => menuItems(),
  activeIndex: () => {
    const buttons = menuButtons()
    return buttons.indexOf(document.activeElement as HTMLButtonElement)
  },
  onHighlight: (index) => {
    menuButtons()[index]?.focus({ preventScroll: true })
  },
})

const menuDismiss = useDismissable({
  ignore: menuRef,
  onDismiss: () => closeMenu(),
})

function handleMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
    return
  }
  menuNavigation.handleKeydown(event)
}

function handleContextMenu(event: MouseEvent) {
  if (props.disabled || props.contextMenu === false) return

  const target = event.target as Element | null
  if (isInteractiveTarget(target)) return

  const entry = entryFromElement(target)
  if (!entry || entry.node.disabled) return

  const items = menuItems()
  if (items.length === 0) return

  event.preventDefault()

  menuTriggerKey.value = entry.key
  menu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node: entry.node,
  }
  menuDismiss.start()

  nextTick(() => {
    const menuElement = menuRef.value
    if (!menuElement) return
    const next = clampToViewport(menu.value.x, menu.value.y, menuElement.getBoundingClientRect(), {
      margin: 8,
    })
    menu.value = { ...menu.value, ...next }
    menuNavigation.first()
  })

  emit('node-contextmenu', entry.node, event)
}

function handleMenuItem(item: OrgTreeMenuItem) {
  const node = menu.value.node
  closeMenu()
  if (!node || item.disabled) return
  emit('menu-click', item.command, node)
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function getNode(id: OrgTreeId): OrgTreeNode | undefined {
  return indexState.value.byKey.get(orgTreeIdKey(id))?.node
}

async function scrollToNode(id: OrgTreeId) {
  const key = orgTreeIdKey(id)
  const entry = indexState.value.byKey.get(key)
  if (!entry) return

  if (props.collapsable) {
    const next = new Set(expandKeysSet.value)
    let changed = false
    let parent = entry.parent
    while (parent) {
      const parentKey = nodeKey(parent, keys.value)
      if (!next.has(parentKey)) {
        next.add(parentKey)
        changed = true
      }
      parent = indexState.value.byKey.get(parentKey)?.parent ?? null
    }
    if (changed) {
      commitExpansion(next)
      await nextTick()
    }
  }

  const viewport = viewportRef.value
  if (!viewport || viewport.clientWidth <= 0) return

  const card = [...viewport.querySelectorAll<HTMLElement>('.w-org-tree__node-card')].find(
    (element) => element.dataset.orgKey === key,
  )
  if (!card) return

  const viewportRect = viewport.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  translate.x += viewportRect.left + viewport.clientWidth / 2 - (cardRect.left + cardRect.width / 2)
  translate.y += viewportRect.top + viewport.clientHeight / 2 - (cardRect.top + cardRect.height / 2)
  setTranslation(translate.x, translate.y)
}

const canvasStyle = computed<CSSProperties>(() => ({
  transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale.value})`,
}))

const rootStyle = computed<CSSProperties>(() => ({
  minHeight: toCssUnit(props.minHeight),
}))

const menuStyle = computed<CSSProperties>(() => ({
  left: `${menu.value.x}px`,
  top: `${menu.value.y}px`,
}))

const rootClasses = computed(() => ({
  'is-horizontal': props.horizontal,
  'is-disabled': props.disabled,
  'is-panning': isPanning.value,
  'is-node-draggable': props.nodeDraggable,
  'is-node-dragging': draggingKey.value !== null,
  'is-empty': visibleRootNodes.value.length === 0,
}))

const selectedKeyForChildren = computed(() => selectedKeyString.value)

onMounted(() => {
  if (props.center) nextTick(center)
})

onBeforeUnmount(() => {
  unmounted.value = true
  dragRequest += 1
  cancelInteraction()
  closeMenu()
})

defineExpose({
  scale,
  translate,
  zoomIn,
  zoomOut,
  resetView,
  fit,
  center,
  expandAll,
  collapseAll,
  scrollToNode,
  getNode,
})
</script>

<template>
  <div class="w-org-tree" :class="[rootClasses, classes?.root]" :style="[rootStyle, styles?.root]">
    <div
      ref="viewportRef"
      class="w-org-tree__viewport"
      :class="classes?.viewport"
      :style="styles?.viewport"
      @pointerdown="handlePointerDown"
      @wheel="handleWheel"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu="handleContextMenu"
      @keydown="handleKeydown"
      @focusin="handleFocusIn"
      @dragstart.prevent
    >
      <div
        ref="canvasRef"
        class="w-org-tree__canvas"
        :class="classes?.canvas"
        :style="[canvasStyle, styles?.canvas]"
      >
        <div
          v-if="visibleRootNodes.length > 0"
          class="w-org-tree__roots"
          role="tree"
          :aria-label="ariaLabel"
        >
          <OrgTreeNodeComponent
            v-for="node in visibleRootNodes"
            :key="nodeKey(node, keys)"
            :node="node"
            :depth="0"
            :keys="keys"
            :expanded-keys="expandKeysSet"
            :selected-key="selectedKeyForChildren"
            :focus-key="tabStopKey"
            :collapsable="collapsable"
            :disabled="disabled"
            :expand-label="expandLabel"
            :collapse-label="collapseLabel"
            :dragging-key="draggingKey"
            :drop-key="dropKey"
            :duplicate-nodes="indexState.duplicates"
            :classes="classes"
            :styles="styles"
            @toggle="toggleNode"
          >
            <template v-if="$slots.node" #node="scope">
              <slot name="node" v-bind="scope" />
            </template>
            <template v-else-if="$slots.default" #node="scope">
              <slot name="default" v-bind="scope" />
            </template>
            <template v-if="$slots.expand" #expand="scope">
              <slot name="expand" v-bind="scope" />
            </template>
          </OrgTreeNodeComponent>
        </div>
      </div>

      <div
        v-if="visibleRootNodes.length === 0"
        class="w-org-tree__empty"
        :class="classes?.empty"
        :style="styles?.empty"
      >
        <slot name="empty">
          <span>{{ emptyText }}</span>
        </slot>
      </div>
    </div>

    <Teleport v-if="menu.visible" to="body">
      <div
        ref="menuRef"
        class="w-org-tree__menu"
        :class="classes?.menu"
        role="menu"
        :style="[menuStyle, styles?.menu]"
        data-org-no-drag
        @pointerdown.stop
        @click.stop
        @contextmenu.prevent
        @keydown="handleMenuKeydown"
      >
        <button
          v-for="item in menuItems()"
          :key="item.command"
          type="button"
          class="w-org-tree__menu-item"
          :class="classes?.menuItem"
          :style="styles?.menuItem"
          role="menuitem"
          :disabled="item.disabled"
          @click="handleMenuItem(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
