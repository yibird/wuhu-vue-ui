import { cloneVNode, defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import type { IconPickerIcon } from './types'

export default defineComponent({
  name: 'WIconPickerGlyph',
  props: {
    icon: {
      type: [String, Object] as PropType<IconPickerIcon>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      typeof props.icon === 'string'
        ? h('i', { class: props.icon, 'aria-hidden': 'true' })
        : cloneVNode(props.icon)
  },
})
