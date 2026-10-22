<script setup lang="ts">
import { computed } from 'vue'
import type {
  OrgTreeExpandSlotProps,
  OrgTreeKeys,
  OrgTreeNode,
  OrgTreeNodeSlotProps,
} from './types'
import { nodeChildren, nodeKey, nodeLabel } from './utils'

defineOptions({
  name: 'WOrgTreeNode',
})

const props = defineProps<{
  node: OrgTreeNode
  depth: number
  keys: Required<OrgTreeKeys>
  expandedKeys: ReadonlySet<string>
  selectedKey: string | null
  collapsable: boolean
  disabled: boolean
  expandLabel: string
  collapseLabel: string
  draggingKey: string | null
  dropKey: string | null
  duplicateNodes: WeakSet<OrgTreeNode>
  labelClassName: string
  selectedClassName: string
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
  <div class="w-org-tree__node" :class="nodeClasses" :data-org-key="key" role="none">
    <div class="w-org-tree__node-head" role="none">
      <div
        class="w-org-tree__node-card"
        :class="[
          selectedClassName,
          { 'is-selected': selected, 'is-disabled': disabled || node.disabled },
        ]"
        role="treeitem"
        :aria-level="depth + 1"
        :aria-expanded="hasChildren ? expanded : undefined"
        :aria-selected="selected"
        :aria-disabled="disabled || node.disabled ? 'true' : undefined"
        :data-org-key="key"
        :tabindex="disabled || node.disabled ? -1 : 0"
      >
        <span class="w-org-tree__label" :class="labelClassName">
          <slot name="node" :node="node" :depth="depth" :expanded="expanded" :toggle="toggle">
            {{ label }}
          </slot>
        </span>
      </div>

      <span v-if="hasChildren" class="w-org-tree__toggle-wrap">
        <slot
          name="expand"
          :node="node"
          :expanded="expanded"
          :has-children="hasChildren"
          :toggle="toggle"
        >
          <span
            v-if="collapsable"
            class="w-org-tree__toggle"
            aria-hidden="true"
            :title="expanded ? collapseLabel : expandLabel"
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
          </span>
        </slot>
      </span>
    </div>

    <div v-if="hasChildren && expanded" class="w-org-tree__children" role="group">
      <OrgTreeNode
        v-for="child in children"
        :key="nodeKey(child, keys)"
        :node="child"
        :depth="depth + 1"
        :keys="keys"
        :expanded-keys="expandedKeys"
        :selected-key="selectedKey"
        :collapsable="collapsable"
        :disabled="disabled"
        :expand-label="expandLabel"
        :collapse-label="collapseLabel"
        :dragging-key="draggingKey"
        :drop-key="dropKey"
        :duplicate-nodes="duplicateNodes"
        :label-class-name="labelClassName"
        :selected-class-name="selectedClassName"
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
