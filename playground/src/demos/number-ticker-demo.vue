<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'
import DemoCard from '../components/demo-card.vue'

const tickerValue = ref(12860.5)
const percentValue = ref(86.4)
const usersValue = ref(28416)
const deltaValue = ref(-12480.75)
const replayKey = ref(0)

const metrics = reactive({
  requests: 12860,
  users: 28416,
  successRate: 99.2,
})

const liveRunning = ref(false)
const leverageValue = computed(() => Math.round(deltaValue.value * 3.2 * 100) / 100)

let liveTimer: number | undefined

function incrementTicker() {
  tickerValue.value = Math.round((tickerValue.value + 8888.8) * 10) / 10
}

function randomizeTicker() {
  tickerValue.value = Math.round((6800 + Math.random() * 120000) * 10) / 10
}

function shiftDelta(amount: number) {
  deltaValue.value = Math.round((deltaValue.value + amount) * 100) / 100
}

function replayMountAnimation() {
  replayKey.value += 1
}

function tickLive() {
  metrics.requests = Math.max(0, Math.round(metrics.requests + (Math.random() - 0.42) * 2400))
  metrics.users = Math.max(0, Math.round(metrics.users + (Math.random() - 0.5) * 180))
  metrics.successRate = Math.min(
    100,
    Math.max(90, Math.round((metrics.successRate + (Math.random() - 0.5) * 0.8) * 10) / 10),
  )
}

function toggleLive() {
  liveRunning.value = !liveRunning.value
  if (liveRunning.value) {
    liveTimer = window.setInterval(tickLive, 1400)
  } else {
    stopLive()
  }
}

function stopLive() {
  if (liveTimer !== undefined) {
    window.clearInterval(liveTimer)
    liveTimer = undefined
  }
}

onBeforeUnmount(stopLive)
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="货币指标" description="前缀、小数与千分位组合，适合营收或金额看板。">
      <div class="ticker-card">
        <span class="ticker-card__label">本月营收</span>
        <div class="ticker-card__value">
          <NumberTicker :value="tickerValue" :decimals="1" prefix="¥ " :duration="900" />
        </div>
        <span class="ticker-card__meta">较上月增长 18.2%</span>
      </div>
      <div class="ticker-actions">
        <button type="button" class="button button--small" @click="incrementTicker">
          + 8,888.8
        </button>
        <button type="button" class="button button--ghost button--small" @click="randomizeTicker">
          随机数值
        </button>
      </div>
    </DemoCard>

    <DemoCard title="百分比与本地化" description="suffix、locale 与 decimals 可自由组合。">
      <div class="ticker-metrics">
        <div class="ticker-metric">
          <span>转化率</span>
          <strong>
            <NumberTicker :value="percentValue" :decimals="1" suffix="%" :duration="720" />
          </strong>
        </div>
        <div class="ticker-metric">
          <span>活跃用户（en-US）</span>
          <strong>
            <NumberTicker :value="usersValue" locale="en-US" :duration="720" />
          </strong>
        </div>
        <div class="ticker-metric">
          <span>活跃用户（zh-CN）</span>
          <strong>
            <NumberTicker :value="usersValue" locale="zh-CN" :duration="720" />
          </strong>
        </div>
      </div>
      <div class="ticker-actions">
        <button
          type="button"
          class="button button--small"
          @click="percentValue = Math.random() * 100"
        >
          随机转化率
        </button>
        <button
          type="button"
          class="button button--ghost button--small"
          @click="usersValue = Math.round(10000 + Math.random() * 90000)"
        >
          随机用户数
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="动效参数"
      description="startValue 与 duration 控制首屏滚动动画，easing 可接入自定义曲线。"
      wide
    >
      <div class="ticker-row">
        <div class="ticker-chip">
          <span>duration 300</span>
          <NumberTicker :value="8600" :start-value="0" :duration="300" suffix=" ms" />
        </div>
        <div class="ticker-chip">
          <span>duration 1200</span>
          <NumberTicker :value="8600" :start-value="0" :duration="1200" suffix=" ms" />
        </div>
        <div class="ticker-chip">
          <span>无千分位</span>
          <NumberTicker :value="8600" :use-grouping="false" suffix=" users" />
        </div>
      </div>
    </DemoCard>

    <DemoCard
      title="负值与涨跌"
      description="负号会作为普通字符参与滚动，适合盈亏、差值等需要正负切换的指标。"
    >
      <div class="ticker-metrics">
        <div class="ticker-metric">
          <span>账户盈亏（2 位小数）</span>
          <strong>
            <NumberTicker
              :value="deltaValue"
              :decimals="2"
              prefix="$ "
              locale="en-US"
              :start-value="-5000"
            />
          </strong>
        </div>
        <div class="ticker-metric">
          <span>整数显示</span>
          <strong>
            <NumberTicker :value="deltaValue" suffix=" pts" :start-value="0" />
          </strong>
        </div>
        <div class="ticker-metric">
          <span>杠杆后（3.2x）</span>
          <strong>
            <NumberTicker :value="leverageValue" :decimals="2" prefix="$ " locale="en-US" />
          </strong>
        </div>
      </div>
      <div class="ticker-actions">
        <button type="button" class="button button--small" @click="shiftDelta(-500)">
          下跌 500
        </button>
        <button type="button" class="button button--small" @click="shiftDelta(1250.5)">
          反弹 1,250.5
        </button>
        <button type="button" class="button button--ghost button--small" @click="deltaValue = 0">
          归零
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="挂载动画与缓动"
      description="animateOnMount=false 跳过首屏动画；easing 可切换线性、回弹等曲线。点击重播重新挂载。"
    >
      <div class="ticker-row">
        <div class="ticker-chip">
          <span>linear</span>
          <NumberTicker
            :key="`linear-${replayKey}`"
            :value="8642.5"
            :decimals="1"
            :start-value="0"
            :duration="900"
            easing="linear"
            suffix=" pts"
          />
        </div>
        <div class="ticker-chip">
          <span>cubic-bezier 回弹</span>
          <NumberTicker
            :key="`bounce-${replayKey}`"
            :value="8642.5"
            :decimals="1"
            :start-value="0"
            :duration="900"
            easing="cubic-bezier(0.34, 1.56, 0.64, 1)"
            suffix=" pts"
          />
        </div>
        <div class="ticker-chip">
          <span>跳过首屏动画</span>
          <NumberTicker
            :key="`instant-${replayKey}`"
            :value="8642.5"
            :decimals="1"
            :animate-on-mount="false"
            suffix=" pts"
          />
        </div>
      </div>
      <div class="ticker-actions">
        <button type="button" class="button button--small" @click="replayMountAnimation">
          重播挂载动画
        </button>
      </div>
    </DemoCard>

    <DemoCard
      title="实时数据流"
      description="高频更新时逐位滚动；数值跨越位数（如 9,999 → 10,000）会即时调整布局。"
      wide
    >
      <div class="ticker-row">
        <div class="ticker-chip">
          <span>实时请求 / 秒</span>
          <NumberTicker :value="metrics.requests" locale="en-US" :duration="420" />
        </div>
        <div class="ticker-chip">
          <span>在线用户</span>
          <NumberTicker :value="metrics.users" :duration="420" />
        </div>
        <div class="ticker-chip">
          <span>成功率</span>
          <NumberTicker :value="metrics.successRate" :decimals="1" suffix="%" :duration="420" />
        </div>
      </div>
      <div class="ticker-actions">
        <button type="button" class="button button--small" @click="toggleLive">
          {{ liveRunning ? '暂停' : '开始' }}
        </button>
        <button type="button" class="button button--ghost button--small" @click="tickLive">
          单步更新
        </button>
      </div>
    </DemoCard>
  </div>
</template>
