import { shallowRef } from 'vue'
import type { IconPickerGroup } from './types'

const globalIconGroups = shallowRef<IconPickerGroup[]>([])

/**
 * Register the icon library used by every `IconPicker` that does not receive
 * an explicit `items` prop. Replacing the array updates mounted pickers.
 */
export function setIconPickerIcons(groups: IconPickerGroup[]) {
  globalIconGroups.value = groups
}

/** Read the current global icon library. */
export function getIconPickerIcons(): IconPickerGroup[] {
  return globalIconGroups.value
}

/** Reactive access used by the component. */
export function useIconPickerIcons() {
  return globalIconGroups
}
