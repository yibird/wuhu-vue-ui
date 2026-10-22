import type { OrgTreeId, OrgTreeKeys, OrgTreeNode } from './types'

export function isOrgTreeNode(value: unknown): value is OrgTreeNode {
  return typeof value === 'object' && value !== null
}

export function nodeKey(node: OrgTreeNode, keys: Required<OrgTreeKeys>): string {
  const value = node[keys.id]
  return value === undefined || value === null ? '' : String(value)
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
  return value.filter(isOrgTreeNode)
}

/** Resolve custom `children` fields to a required key object. */
export function normalizeKeys(keys: OrgTreeKeys | undefined): Required<OrgTreeKeys> {
  return {
    id: keys?.id ?? 'id',
    label: keys?.label ?? 'label',
    children: keys?.children ?? 'children',
  }
}
