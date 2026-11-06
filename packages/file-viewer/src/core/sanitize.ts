import { sanitizeUrl } from './format'

export interface SanitizeHtmlOptions {
  /** Extra tags to keep (lower-case). */
  allowTags?: string[]
  /** Extra attributes to keep (lower-case). */
  allowAttributes?: string[]
  /** Base URL used to resolve relative links. */
  base?: string
  /** Allow base64 bitmap data URLs in `src`. */
  allowDataImage?: boolean
}

const DEFAULT_TAGS = new Set(
  (
    'a abbr article aside b blockquote br caption cite code col colgroup dd del details ' +
    'dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd ' +
    'li main mark nav ol p pre q s samp section small span strike strong sub summary sup ' +
    'table tbody td tfoot th thead time tr u ul var'
  ).split(' '),
)

const DANGEROUS_TAGS = new Set([
  'applet',
  'base',
  'basefont',
  'button',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'option',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
])

const GLOBAL_ATTRIBUTES = new Set([
  'title',
  'lang',
  'dir',
  'colspan',
  'rowspan',
  'align',
  'start',
  'reversed',
])
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt', 'width', 'height']),
  ol: new Set(['start', 'reversed', 'type']),
  td: new Set(['colspan', 'rowspan', 'align']),
  th: new Set(['colspan', 'rowspan', 'align', 'scope']),
  time: new Set(['datetime']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span']),
}

function unwrap(element: Element) {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

function cleanAttributes(element: Element, tag: string, options: SanitizeHtmlOptions) {
  const tagAttributes = TAG_ATTRIBUTES[tag]
  const extra = new Set((options.allowAttributes ?? []).map((name) => name.toLowerCase()))

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.localName.toLowerCase()
    const allowed =
      GLOBAL_ATTRIBUTES.has(name) ||
      tagAttributes?.has(name) ||
      extra.has(name) ||
      name.startsWith('data-epub-')

    if (!allowed) {
      element.removeAttributeNode(attribute)
      continue
    }

    if (name === 'href') {
      const safe = sanitizeUrl(attribute.value, { base: options.base })
      if (!safe) {
        element.removeAttribute('href')
        continue
      }
      element.setAttribute('href', safe)
      if (/^https?:\/\//i.test(safe)) {
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      }
    }

    if (name === 'src') {
      const safe = sanitizeUrl(attribute.value, {
        allowBlob: true,
        allowDataImage: options.allowDataImage ?? true,
      })
      if (!safe) {
        element.removeAttribute('src')
        continue
      }
      element.setAttribute('src', safe)
    }
  }
}

/**
 * Sanitize arbitrary HTML by allow-listing tags and attributes. Scripts, event
 * handlers, inline styles and unsafe URLs are always removed.
 */
export function sanitizeHtml(html: string, options: SanitizeHtmlOptions = {}): string {
  const allowedTags = new Set([
    ...DEFAULT_TAGS,
    ...(options.allowTags ?? []).map((tag) => tag.toLowerCase()),
  ])

  const document = new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    'text/html',
  )

  const clean = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as Element
    const tag = element.localName.toLowerCase()

    if (DANGEROUS_TAGS.has(tag)) {
      element.remove()
      return
    }

    for (const child of Array.from(element.childNodes)) clean(child)

    if (!allowedTags.has(tag)) {
      unwrap(element)
      return
    }

    cleanAttributes(element, tag, options)
  }

  for (const child of Array.from(document.body.childNodes)) clean(child)
  return document.body.innerHTML
}
