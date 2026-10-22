export const RELATIONSHIP_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
export const XML_NS = 'http://www.w3.org/XML/1998/namespace'
export const XLINK_NS = 'http://www.w3.org/1999/xlink'

export type XmlParent = Document | Element

export function parseXml(source: string): Document {
  const document = new DOMParser().parseFromString(source, 'application/xml')
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML.')
  }
  return document
}

export function descendants(parent: XmlParent, localName: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', localName))
}

export function children(parent: XmlParent, localName: string): Element[] {
  const result: Element[] = []
  for (const child of Array.from(parent.children)) {
    if (child.localName === localName) result.push(child)
  }
  return result
}

export function firstChild(parent: XmlParent, localName: string): Element | undefined {
  for (const child of Array.from(parent.children)) {
    if (child.localName === localName) return child
  }
  return undefined
}

export function firstDescendant(parent: XmlParent, localName: string): Element | undefined {
  return parent.getElementsByTagNameNS('*', localName)[0]
}

export function hasChild(parent: XmlParent, localName: string): boolean {
  return firstChild(parent, localName) !== undefined
}

export function attribute(element: Element, localName: string): string | undefined {
  const attr = element.attributes.getNamedItem(localName)
  if (attr) return attr.value
  for (const candidate of Array.from(element.attributes)) {
    if (candidate.localName === localName) return candidate.value
  }
  return undefined
}

export function attributeNS(
  element: Element,
  namespace: string,
  localName: string,
): string | undefined {
  return element.getAttributeNS(namespace, localName) ?? undefined
}

export function value(element: Element | undefined): string | undefined {
  return element ? attribute(element, 'val') : undefined
}

export function isOn(element: Element | undefined): boolean {
  if (!element) return false
  const raw = attribute(element, 'val')
  return raw === undefined || raw === '1' || raw === 'true' || raw === 'on'
}

export function isOff(element: Element | undefined): boolean {
  return element !== undefined && !isOn(element)
}

export function textOf(element: Element | undefined): string {
  return element?.textContent ?? ''
}

export function childValue(parent: XmlParent | undefined, localName: string): string | undefined {
  if (!parent) return undefined
  return value(firstChild(parent, localName))
}

export function childText(parent: XmlParent | undefined, localName: string): string | undefined {
  if (!parent) return undefined
  const child = firstChild(parent, localName)
  return child ? textOf(child) : undefined
}

export function childAttribute(
  parent: XmlParent | undefined,
  childName: string,
  attributeName: string,
): string | undefined {
  if (!parent) return undefined
  const child = firstChild(parent, childName)
  return child ? attribute(child, attributeName) : undefined
}

export function offOnValue(element: Element | undefined, fallback = false): boolean {
  if (!element) return fallback
  const raw = attribute(element, 'val')
  if (raw === undefined) return true
  return raw !== '0' && raw !== 'false' && raw !== 'off'
}
