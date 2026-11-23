import type { Cropper, CropperCanvas, CropperImage, CropperSelection } from 'cropperjs'

/** Position and size of the current crop selection, in cropper canvas pixels. */
export interface CropperData {
  x: number
  y: number
  width: number
  height: number
}

/** Options passed to `CropperSelection.$toCanvas()`. */
export interface CropperOutputOptions {
  width?: number
  height?: number
  beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
}

/** Options for `getCroppedBlob()` / `getCroppedDataUrl()`. */
export interface CropperFileOptions extends CropperOutputOptions {
  /** MIME type, `image/png` by default. */
  type?: string
  /** Encoder quality between 0 and 1, used by lossy formats such as `image/jpeg`. */
  quality?: number
}

export interface CropperLabels {
  /** Accessible name of the built-in action bar. */
  actionBar: string
  zoomIn: string
  zoomOut: string
  rotateLeft: string
  rotateRight: string
  reset: string
  /** Accessible name of the crop area and alt text of the source image. */
  image: string
}

export interface CropperToolbarOptions {
  /** Allow the image to be rotated. Defaults to `true`. */
  rotatable?: boolean
  /** Allow the image to be scaled. Defaults to `true`. */
  scalable?: boolean
  /** Allow the image to be dragged. Defaults to `true`. */
  translatable?: boolean
  /** Allow the crop selection to be moved. Defaults to `true`. */
  movable?: boolean
  /** Allow the crop selection to be resized. Defaults to `true`. */
  resizable?: boolean
  /** Allow the selection to be zoomed with the mouse wheel. Defaults to `true`. */
  zoomable?: boolean
  /** Enable arrow-key nudging of the crop selection. Defaults to `true`. */
  keyboard?: boolean
}

/**
 * Built-in toolbar configuration.
 *
 * - `true` (default): show the toolbar and enable every interaction.
 * - `false`: hide the toolbar; gestures and keyboard interactions stay enabled.
 * - object: show the toolbar and override individual interactions.
 */
export type CropperToolbar = boolean | CropperToolbarOptions

export interface CropperProps {
  /** Image URL to crop. */
  src: string
  /** Overrides for the built-in action labels. */
  labels?: Partial<CropperLabels>
  /** Container height. Numbers are treated as pixels. */
  height?: string | number
  /** Lock the selection to a fixed width / height ratio, e.g. `1` for a square. */
  aspectRatio?: number
  /**
   * Fraction of the image covered by the selection, from 0 to 1. Changing it
   * resets the selection to the new coverage.
   */
  initialCoverage?: number
  /** Built-in toolbar and interaction configuration. */
  toolbar?: CropperToolbar
  /** `crossorigin` attribute for the image element. */
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
}

export interface CropperReadyEvent {
  cropper: Cropper
  image: CropperImage
}

export interface CropperSlotProps {
  ready: boolean
  cropper: Cropper | null
  image: CropperImage | null
  selection: CropperSelection | null
  canvas: CropperCanvas | null
  zoomIn: () => void
  zoomOut: () => void
  rotateLeft: () => void
  rotateRight: () => void
  reset: () => void
  crop: (options?: CropperOutputOptions) => Promise<HTMLCanvasElement | null>
}

export interface CropperExpose {
  /** The underlying Cropper.js instance. */
  getInstance: () => Cropper | null
  getSelection: () => CropperSelection | null
  getImage: () => CropperImage | null
  getCanvas: () => CropperCanvas | null
  /** Current selection geometry in cropper canvas pixels. */
  getData: () => CropperData | null
  /** Move / resize the selection. Omitted values are kept. */
  setData: (data: Partial<CropperData>) => void
  /** Update the selection aspect ratio. Pass `NaN` to unlock. */
  setAspectRatio: (ratio: number) => void
  /** Render the selected area to a canvas. */
  getCroppedCanvas: (options?: CropperOutputOptions) => Promise<HTMLCanvasElement | null>
  /** Render the selected area to a Blob. */
  getCroppedBlob: (options?: CropperFileOptions) => Promise<Blob | null>
  /** Render the selected area to a data URL. */
  getCroppedDataUrl: (options?: CropperFileOptions) => Promise<string | null>
  /** Positive values zoom in; negative values zoom out. */
  zoom: (scale: number) => void
  /** Rotate the image by the given number of degrees. */
  rotate: (degrees: number) => void
  /** Reset image transforms and the crop selection. */
  reset: () => void
  /** Retry initialization after a load/initialization error. */
  retry: () => void
}
