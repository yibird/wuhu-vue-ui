<script setup lang="ts">
import { Ripple, vRipple } from '@wuhu-ui/ripple'
import DemoCard from '../components/demo-card.vue'
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="按钮" description="v-ripple 默认在 pointerdown 时从点击位置扩散。">
      <div style="display: flex; flex-wrap: wrap; gap: 10px">
        <button v-ripple type="button" class="button button--primary">默认波纹</button>
        <button
          v-ripple="{ color: 'rgba(79, 70, 229, 0.35)', duration: 900 }"
          type="button"
          class="button"
        >
          自定义颜色与时长
        </button>
        <button v-ripple="{ trigger: 'click' }" type="button" class="button button--ghost">
          click 触发
        </button>
      </div>
    </DemoCard>

    <DemoCard title="禁用与居中" description="disabled 阻止波纹；center 让波纹始终从元素中心扩散。">
      <div style="display: flex; flex-wrap: wrap; gap: 10px">
        <button v-ripple="{ disabled: true }" type="button" class="button">禁用波纹</button>
        <button
          v-ripple="{ center: true, color: 'rgba(14, 165, 233, 0.3)' }"
          type="button"
          class="button"
        >
          中心扩散
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="卡片 / 任意容器"
      description="指令会给元素补充 position: relative 与 overflow: hidden，卸载时恢复。"
    >
      <div
        v-ripple="{ trigger: 'click', color: 'rgba(79, 70, 229, 0.18)' }"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          border: 1px dashed var(--w-color-border-strong, #cbd5e1);
          border-radius: 12px;
          color: var(--w-color-text-secondary, #475569);
          cursor: pointer;
          user-select: none;
        "
      >
        点击这块卡片查看波纹
      </div>
    </DemoCard>

    <DemoCard title="Ripple 组件" description="需要语义化标签或更细粒度控制时可直接使用组件。">
      <div style="display: flex; flex-wrap: wrap; gap: 10px">
        <Ripple tag="button" type="button" class="button" trigger="click">组件按钮</Ripple>
        <Ripple
          tag="div"
          center
          :duration="800"
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 150px;
            height: 40px;
            border-radius: 10px;
            background: var(--w-color-surface-hover, #f1f5f9);
            color: var(--w-color-text, #0f172a);
            cursor: pointer;
            user-select: none;
          "
        >
          中心扩散容器
        </Ripple>
      </div>
    </DemoCard>
  </div>
</template>
