<script setup lang="ts">
import { computed, ref } from 'vue'
import { Permission, providePermissions, vPermission } from '@wuhu-vue-ui/permission'
import DemoCard from '../components/demo-card.vue'

const permissions = ref(['user:read', 'user:write', 'order:read'])
const canWrite = computed(() => permissions.value.includes('user:write'))

function toggleWrite() {
  permissions.value = canWrite.value
    ? permissions.value.filter((item) => item !== 'user:write')
    : [...permissions.value, 'user:write']
}

providePermissions(permissions)
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="all 模式" description="默认要求 value 中的权限全部具备。">
      <div class="permission-demo">
        <Permission :value="['user:read', 'user:write']">
          <span class="permission-demo__badge">可编辑用户</span>
        </Permission>
        <Permission :value="['user:read', 'order:delete']">
          <span class="permission-demo__badge">可删除订单</span>
          <template #fallback>
            <span class="hint">缺少 order:delete，展示 fallback</span>
          </template>
        </Permission>
      </div>
    </DemoCard>

    <DemoCard title="any 模式" description="mode=any 时只要具备任意一个权限即可放行。">
      <div class="permission-demo">
        <Permission :value="['user:read', 'order:delete']" mode="any">
          <span class="permission-demo__badge">任意一项即可</span>
        </Permission>
      </div>
    </DemoCard>

    <DemoCard
      title="显式 permissions"
      description="permissions 存在时优先于注入的上下文，可用于局部覆盖。"
    >
      <div class="permission-demo">
        <Permission value="admin" :permissions="['admin']">
          <span class="permission-demo__badge">局部管理员权限</span>
        </Permission>
        <Permission value="admin" :permissions="['guest']">
          <span class="permission-demo__badge">不应显示</span>
          <template #fallback>
            <span class="hint">局部权限不足</span>
          </template>
        </Permission>
      </div>
    </DemoCard>

    <DemoCard
      title="指令 v-permission"
      description="无权限时隐藏元素；权限恢复或卸载时还原原始 display。"
    >
      <div class="permission-demo">
        <button
          v-permission="{ value: ['user:read', 'user:write'], mode: 'all' }"
          type="button"
          class="button button--small"
        >
          编辑用户
        </button>
        <button v-permission="'order:delete'" type="button" class="button button--small">
          删除订单
        </button>
        <button type="button" class="button button--small" @click="toggleWrite">
          {{ canWrite ? '移除 user:write' : '授予 user:write' }}
        </button>
      </div>
      <p class="hint">当前权限：{{ permissions.join('、') }}</p>
    </DemoCard>
  </div>
</template>
