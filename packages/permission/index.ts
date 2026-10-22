export { default as Permission } from './src/Permission.vue'
export { vPermission } from './src/directive'
export {
  PERMISSION_KEY,
  checkPermission,
  providePermissions,
  usePermission,
} from './src/permissions'
export type {
  PermissionContext,
  PermissionDirectiveValue,
  PermissionMode,
  PermissionProps,
  PermissionValue,
} from './src/types'
