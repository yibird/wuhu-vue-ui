<script setup lang="ts">
import { vTooltip } from '@wuhu-vue-ui/tooltip'
import { computed } from 'vue'
import type {
  OrgTreeClasses,
  OrgTreeExpandSlotProps,
  OrgTreeKeys,
  OrgTreeNode,
  OrgTreeNodeSlotProps,
  OrgTreeStyles,
} from './types'
import { nodeChildren, nodeKey, nodeLabel } from './utils'

const props = defineProps<{
  node: OrgTreeNode
  depth: number
  keys: Required<OrgTreeKeys>
  expandedKeys: ReadonlySet<string>
  selectedKey: string | null
  focusKey: string | null
  collapsable: boolean
  disabled: boolean
  expandLabel: string
  collapseLabel: string
  draggingKey: string | null
  dropKey: string | null
  duplicateNodes: WeakSet<OrgTreeNode>
  classes?: OrgTreeClasses
  styles?: OrgTreeStyles
}>()

const emit = defineEmits<{
  toggle: [node: OrgTreeNode]
}>()

defineSlots<{
  node?: (props: OrgTreeNodeSlotProps) => unknown
  expand?: (props: OrgTreeExpandSlotProps) => unknown
}>()

const key = computed(() => nodeKey(props.node, props.keys))
const label = computed(() => nodeLabel(props.node, props.keys))
const children = computed(() =>
  nodeChildren(props.node, props.keys).filter((child) => !props.duplicateNodes.has(child)),
)
const hasChildren = computed(() => children.value.length > 0)
const expanded = computed(() => !props.collapsable || props.expandedKeys.has(key.value))
const selected = computed(() => props.selectedKey === key.value)

const nodeClasses = computed(() => ({
  'is-leaf': !hasChildren.value,
  'is-expanded': expanded.value,
  'is-selected': selected.value,
  'is-disabled': props.disabled || Boolean(props.node.disabled),
  'is-dragging': props.draggingKey === key.value,
  'is-drop-target': props.dropKey === key.value,
}))

function toggle() {
  emit('toggle', props.node)
}
</script>

<template>
  <div
    class="w-org-tree__node"
    :class="[nodeClasses, classes?.node]"
    :style="styles?.node"
    :data-org-key="key"
    role="none"
  >
    <div class="w-org-tree__node-head" role="none">
      <div
        class="w-org-tree__node-card"
        :class="[
          classes?.card,
          { 'is-selected': selected, 'is-disabled': disabled || node.disabled },
        ]"
        :style="styles?.card"
        role="treeitem"
        :aria-level="depth + 1"
        :aria-expanded="hasChildren ? expanded : undefined"
        :aria-selected="selected"
        :aria-disabled="disabled || node.disabled ? 'true' : undefined"
        :data-org-key="key"
        :tabindex="disabled || node.disabled || focusKey !== key ? -1 : 0"
      >
        <span class="w-org-tree__label" :class="classes?.label" :style="styles?.label">
          <slot name="node" :node="node" :depth="depth" :expanded="expanded" :toggle="toggle">
            {{ label }}
          </slot>
        </span>
      </div>

      <!--
        Pointer-only affordance: not in the tab order and hidden from AT.
        The treeitem already exposes aria-expanded and keyboard toggling, so
        exposing this button too would duplicate the control.
      -->
      <span v-if="hasChildren" class="w-org-tree__toggle-wrap">
        <slot
          name="expand"
          :node="node"
          :expanded="expanded"
          :has-children="hasChildren"
          :toggle="toggle"
        >
          <button
            v-if="collapsable"
            type="button"
            class="w-org-tree__toggle"
            :class="classes?.toggle"
            :style="styles?.toggle"
            tabindex="-1"
            aria-hidden="true"
            :aria-label="expanded ? collapseLabel : expandLabel"
            :aria-expanded="expanded"
            v-tooltip="expanded ? collapseLabel : expandLabel"
            @pointerdown.stop
            @click.stop="toggle"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <path
                class="w-org-tree__toggle-vertical"
                d="M8 3.5v9"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </slot>
      </span>
    </div>

    <div
      v-if="hasChildren && expanded"
      class="w-org-tree__children"
      :class="classes?.children"
      :style="styles?.children"
      role="group"
    >
      <OrgTreeNode
        v-for="child in children"
        :key="nodeKey(child, keys)"
        :node="child"
        :depth="depth + 1"
        :keys="keys"
        :expanded-keys="expandedKeys"
        :selected-key="selectedKey"
        :focus-key="focusKey"
        :collapsable="collapsable"
        :disabled="disabled"
        :expand-label="expandLabel"
        :collapse-label="collapseLabel"
        :dragging-key="draggingKey"
        :drop-key="dropKey"
        :duplicate-nodes="duplicateNodes"
        :classes="classes"
        :styles="styles"
        @toggle="emit('toggle', $event)"
      >
        <template v-if="$slots.node" #node="scope">
          <slot name="node" v-bind="scope" />
        </template>
        <template v-if="$slots.expand" #expand="scope">
          <slot name="expand" v-bind="scope" />
        </template>
      </OrgTreeNode>
    </div>
  </div>
</template>
