import { computed, type ModelRef } from 'vue'

export interface CollapseTriggerProps {
  collapsible: boolean
  trigger: boolean
}

export function useCollapse(
  collapsed: ModelRef<boolean>,
  props: CollapseTriggerProps,
  emit: (event: 'collapse', collapsed: boolean) => void,
) {
  const showTrigger = computed(() => props.collapsible && props.trigger)

  function toggle() {
    const next = !collapsed.value
    collapsed.value = next
    emit('collapse', next)
  }

  return { showTrigger, toggle }
}
