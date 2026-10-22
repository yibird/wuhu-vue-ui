<script setup lang="ts">
import { computed, ref } from 'vue'
import { MotionGroup } from '@wuhu-ui/motion-group'
import type { MotionGroupAnimation } from '@wuhu-ui/motion-group'
import DemoCard from '../components/demo-card.vue'

type CardStatus = 'todo' | 'doing' | 'done'

interface StatusCard {
  id: number
  title: string
  owner: string
  status: CardStatus
}

const statusLabels: Record<CardStatus, string> = {
  todo: '待处理',
  doing: '进行中',
  done: '已完成',
}

const statusWeight: Record<CardStatus, number> = {
  doing: 0,
  todo: 1,
  done: 2,
}

const animations: MotionGroupAnimation[] = ['fade', 'slide', 'scale', 'flip', 'bounce', 'reveal']
const animation = ref<MotionGroupAnimation>('fade')
const cards = ref<StatusCard[]>([
  { id: 1, title: '需求评审', owner: 'Lin', status: 'todo' },
  { id: 2, title: '视觉定稿', owner: 'Mia', status: 'doing' },
  { id: 3, title: '接口联调', owner: 'Chen', status: 'todo' },
  { id: 4, title: '上线检查', owner: 'Iris', status: 'done' },
  { id: 5, title: '埋点验收', owner: 'Rui', status: 'doing' },
])

const filter = ref<'all' | CardStatus>('all')
const filteredCards = computed(() =>
  filter.value === 'all' ? cards.value : cards.value.filter((card) => card.status === filter.value),
)
const filters: { label: string; value: 'all' | CardStatus }[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
]

function reorderCards() {
  cards.value = [...cards.value].sort(
    (a, b) => statusWeight[a.status] - statusWeight[b.status] || a.id - b.id,
  )
}

function advanceCard(card: StatusCard) {
  card.status = card.status === 'todo' ? 'doing' : card.status === 'doing' ? 'done' : 'todo'
  reorderCards()
}

function shuffleCards() {
  const next = [...cards.value]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const current = next[index]!
    next[index] = next[target]!
    next[target] = current
  }
  cards.value = next
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="动画预设与重排" description="切换 6 套预设，观察重排、进入与离开动画。" wide>
      <div class="sortable-demo">
        <div class="sortable-demo__controls">
          <div class="segmented" role="group" aria-label="动画预设">
            <button
              v-for="preset in animations"
              :key="preset"
              type="button"
              :class="{ 'is-active': animation === preset }"
              @click="animation = preset"
            >
              {{ preset }}
            </button>
          </div>
          <div class="sortable-demo__actions">
            <button type="button" class="button button--ghost button--small" @click="shuffleCards">
              随机排序
            </button>
            <button type="button" class="button button--ghost button--small" @click="reorderCards">
              按状态排序
            </button>
          </div>
        </div>

        <MotionGroup
          :animation="animation"
          :duration="320"
          appear
          tag="div"
          class="sortable-demo__list"
        >
          <article
            v-for="card in cards"
            :key="card.id"
            class="status-card"
            :class="`status-card--${card.status}`"
          >
            <span class="status-card__dot" aria-hidden="true" />
            <div class="status-card__main">
              <strong>{{ card.title }}</strong>
              <span>{{ card.owner }} · {{ statusLabels[card.status] }}</span>
            </div>
            <button type="button" class="button button--small" @click="advanceCard(card)">
              推进状态
            </button>
          </article>
        </MotionGroup>
      </div>
    </DemoCard>

    <DemoCard title="过滤进出场" description="列表项被筛选时同样会播放离开与进入动画。">
      <div class="sortable-filters">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          class="button button--small"
          :class="{ 'is-active': filter === option.value }"
          @click="filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <MotionGroup animation="scale" :duration="280" tag="div" class="sortable-filter-list">
        <article
          v-for="card in filteredCards"
          :key="card.id"
          class="status-card"
          :class="`status-card--${card.status}`"
        >
          <span class="status-card__dot" aria-hidden="true" />
          <div class="status-card__main">
            <strong>{{ card.title }}</strong>
            <span>{{ statusLabels[card.status] }}</span>
          </div>
        </article>
      </MotionGroup>
    </DemoCard>

    <DemoCard
      title="禁用动画"
      description="disabled=true 保留列表能力但关闭全部过渡，便于调试或减少动效。"
    >
      <MotionGroup disabled tag="div" class="sortable-filter-list">
        <article class="status-card status-card--doing">
          <span class="status-card__dot" aria-hidden="true" />
          <div class="status-card__main">
            <strong>无动画列表</strong>
            <span>结构与普通列表一致</span>
          </div>
        </article>
        <article class="status-card status-card--done">
          <span class="status-card__dot" aria-hidden="true" />
          <div class="status-card__main">
            <strong>稳定渲染</strong>
            <span>适合性能敏感场景</span>
          </div>
        </article>
      </MotionGroup>
    </DemoCard>
  </div>
</template>
