export type GradientTextType = 'linear' | 'radial' | 'conic'

export interface GradientTextProps {
  /** Colors used to build the gradient. At least two colors are recommended. */
  colors?: string[]
  /** Raw CSS background-image value. Overrides `colors`, `type` and `angle`. */
  gradient?: string
  type?: GradientTextType
  /** Gradient angle in degrees for linear and conic gradients. */
  angle?: number
  /** Animate the gradient background. */
  animate?: boolean
  /** Animation duration in milliseconds. */
  duration?: number
  /** CSS animation-direction value. */
  animationDirection?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  tag?: string
}

export interface GradientTextSlotProps {
  gradient: string
}
