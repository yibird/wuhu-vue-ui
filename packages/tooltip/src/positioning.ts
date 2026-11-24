import { flip, offset, shift } from '@floating-ui/vue'
import type { Middleware } from '@floating-ui/vue'

/** Shared placement middleware so the component and directive stay in sync. */
export function createTooltipMiddleware(offsetValue: () => number): Middleware[] {
  return [offset(() => offsetValue()), flip(), shift({ padding: 8 })]
}
