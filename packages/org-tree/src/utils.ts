import type { OrgTreeId, OrgTreeKeys, OrgTreeNode } from './types'

export function isOrgTreeNode(value: unknown): value is OrgTreeNode {
  return typeof value === 'object' && value !== null
}

/** Type-qualified key so numeric `1` and string `"1"` never collide. */
export function orgTreeIdKey(id: OrgTreeId): string {
  return `${typeof id}:${String(id)}`
}

/**
 * A node is usable when it has an id and label of a supported primitive type.
 * Invalid entries are skipped instead of producing an empty key (which would
 * make every malformed node collide with the same index entry).
 */
export function isUsableOrgTreeNode(
  value: unknown,
  keys: Required<OrgTreeKeys>,
): value is OrgTreeNode {
  if (!isOrgTreeNode(value)) return false
  const id = value[keys.id]
  if (typeof id !== 'string' && typeof id !== 'number') return false
  const label = value[keys.label]
  return typeof label === 'string' || typeof label === 'number'
}

export function nodeKey(node: OrgTreeNode, keys: Required<OrgTreeKeys>): string {
  const value = node[keys.id]
  return typeof value === 'string' || typeof value === 'number' ? orgTreeIdKey(value) : ''
}

export function nodeId(node: OrgTreeNode, keys: Required<OrgTreeKeys>): OrgTreeId {
  const value = node[keys.id]
  return typeof value === 'string' || typeof value === 'number' ? value : ''
}

export function nodeLabel(node: OrgTreeNode, keys: Required<OrgTreeKeys>): string {
  const value = node[keys.label]
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value : String(value)
}

export function nodeChildren(node: OrgTreeNode, keys: Required<OrgTreeKeys>): OrgTreeNode[] {
  const value = node[keys.children]
  if (!Array.isArray(value)) return []
  return value.filter((child) => isUsableOrgTreeNode(child, keys))
}

/** Resolve custom `children` fields to a required key object. */
export function normalizeKeys(keys: OrgTreeKeys | undefined): Required<OrgTreeKeys> {
  return {
    id: keys?.id ?? 'id',
    label: keys?.label ?? 'label',
    children: keys?.children ?? 'children',
  }
}
