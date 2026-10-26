<script setup lang="ts">
import { computed, ref } from 'vue'
import { CountDown } from '@wuhu-vue-ui/count-down'
import DemoCard from '../components/demo-card.vue'

const launchTarget = Date.now() + 2 * 60 * 60 * 1000 + 36 * 60 * 1000 + 18 * 1000
const duration = 30_000

const timer = ref<InstanceType<typeof CountDown> | null>(null)
const slotTimer = ref<InstanceType<typeof CountDown> | null>(null)
const slotState = ref('已就绪')
const controlledTimer = ref<InstanceType<typeof CountDown> | null>(null)
const controlledRemaining = ref(8_000)

const targetLabel = computed(() =>
  new Date(launchTarget).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
)

function startTimer() {
  timer.value?.start()
}

function pauseTimer() {
  timer.value?.pause()
}

function resetTimer() {
  timer.value?.reset()
}

function startSlotTimer() {
  slotState.value = '进行中'
  slotTimer.value?.start()
}

function resetSlotTimer() {
  slotState.value = '已就绪'
  slotTimer.value?.reset()
}

function restartControlledTimer() {
  controlledRemaining.value = 8_000
  controlledTimer.value?.start()
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="目标时间" description="传入 target 后按 Date.now() 持续校正，避免定时器漂移。">
      <div style="display: flex; align-items: baseline; gap: 10px">
        <CountDown :target="launchTarget" format="DD 天 HH:mm:ss" :interval="1000" />
      </div>
      <p class="hint">目标时间：{{ targetLabel }}</p>
    </DemoCard>

    <DemoCard
      title="时长 + 暂停重置"
      description="duration 模式支持 start / pause / reset，毫秒精度可调。"
    >
      <CountDown ref="timer" :duration="duration" :interval="100" format="HH:mm:ss.SSS" />
      <div style="display: flex; gap: 8px; margin-top: 14px">
        <button type="button" class="button button--small" @click="startTimer">开始</button>
        <button type="button" class="button button--ghost button--small" @click="pauseTimer">
          暂停
        </button>
        <button type="button" class="button button--ghost button--small" @click="resetTimer">
          重置
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="插槽渲染"
      description="默认插槽接收完整 CountDownState；结束后切换到 finished 插槽。"
    >
      <CountDown ref="slotTimer" :duration="6_000" :auto-start="false">
        <template #default="{ seconds, milliseconds, running }">
          <span style="font-size: 30px; font-weight: 700; letter-spacing: -0.02em">
            {{ running ? `${seconds}.${String(milliseconds).padStart(3, '0')}s` : slotState }}
          </span>
        </template>
        <template #finished>
          <span style="font-weight: 700; color: var(--w-color-danger, #dc2626)">活动已结束</span>
        </template>
      </CountDown>
      <div style="display: flex; gap: 8px; margin-top: 14px">
        <button type="button" class="button button--small" @click="startSlotTimer">开始</button>
        <button type="button" class="button button--ghost button--small" @click="resetSlotTimer">
          重置
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="双向绑定剩余时间"
      description="v-model:remaining 把剩余毫秒交给外部管理，也可以从外部直接改写。"
    >
      <CountDown
        ref="controlledTimer"
        v-model:remaining="controlledRemaining"
        :duration="8_000"
        :interval="100"
      />
      <div style="display: flex; gap: 8px; margin-top: 14px">
        <button
          type="button"
          class="button button--ghost button--small"
          @click="restartControlledTimer"
        >
          重置为 8 秒
        </button>
      </div>
      <p class="hint">当前剩余：{{ controlledRemaining }}ms</p>
    </DemoCard>

    <DemoCard title="结束文案" description="finishText 在倒计时归零后替代默认格式化文本。">
      <CountDown :duration="4_000" finish-text="优惠已结束" :interval="100" />
      <p class="hint">4 秒后自动结束，finish 事件只会触发一次。</p>
    </DemoCard>
  </div>
</template>
