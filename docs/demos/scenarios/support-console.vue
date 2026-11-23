<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import { Copy } from '@wuhu-vue-ui/copy'
import { Loading } from '@wuhu-vue-ui/loading'
import { MotionGroup } from '@wuhu-vue-ui/motion-group'
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
import { Time } from '@wuhu-vue-ui/time'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'
import type { ContextMenuExpose, ContextMenuItem } from '@wuhu-vue-ui/context-menu'
import { cannedReplies, conversationCommands, conversations, lastSyncedAt } from './fixtures'

interface Message {
  id: number
  from: 'customer' | 'agent'
  text: string
}

const activeId = ref(1)
const switching = ref(false)
let switchTimer: number | undefined

const activeConversation = computed(() =>
  conversations.find((conversation) => conversation.id === activeId.value),
)

const threads: Record<number, Message[]> = {
  1: [
    { id: 1, from: 'customer', text: '新版本的权限配置还需要确认一下。' },
    { id: 2, from: 'agent', text: '好的，我先把角色与菜单权限的对应关系整理出来。' },
    { id: 3, from: 'customer', text: '另外希望支持按部门批量授权。' },
  ],
  2: [
    { id: 4, from: 'customer', text: '设计稿已经同步到评审空间。' },
    { id: 5, from: 'agent', text: '收到，我会在今天下班前给出标注反馈。' },
  ],
  3: [
    { id: 6, from: 'customer', text: '接口返回的字段和文档不一致。' },
    { id: 7, from: 'agent', text: '请发一下请求 ID，我们排查日志。' },
  ],
  4: [{ id: 8, from: 'customer', text: '回归测试今天下午开始。' }],
}

const messages = computed(() => threads[activeId.value] ?? [])
const replies = ref([...cannedReplies])

function selectConversation(id: number) {
  if (id === activeId.value) return
  activeId.value = id
  switching.value = true
  window.clearTimeout(switchTimer)
  switchTimer = window.setTimeout(() => {
    switching.value = false
  }, 600)
}

function selectFromCommand(item: CommandMenuItem) {
  selectConversation(Number(String(item.key).replace('conversation:', '')))
}

function addReply() {
  const next = cannedReplies[replies.value.length % cannedReplies.length] ?? cannedReplies[0]!
  replies.value = [...replies.value, next]
}

function removeReply(index: number) {
  replies.value = replies.value.filter((_, current) => current !== index)
}

const menu = ref<ContextMenuExpose>()
const activeMessage = ref<Message | null>(null)

const messageMenuItems: ContextMenuItem[] = [
  { type: 'header', label: '消息操作' },
  { key: 'copy', label: '复制消息' },
  { key: 'forward', label: '转发给同事' },
  { type: 'separator' },
  { key: 'close', label: '结束会话', danger: true },
]

function openMessageMenu(event: MouseEvent, message: Message) {
  activeMessage.value = message
  menu.value?.open(event)
}

function selectMessageAction({ item }: { item: ContextMenuItem }) {
  if (!('label' in item)) return
  activeMessage.value = null
}

onBeforeUnmount(() => {
  window.clearTimeout(switchTimer)
})
</script>

<template>
  <div class="scenario-app scenario-console">
    <header class="scenario-app__bar">
      <div class="scenario-app__title">
        <strong>客服工作台</strong>
        <span>在线会话 {{ conversations.length }} 个</span>
      </div>
      <div class="scenario-app__meta">
        <Copy :text="() => `conversation:${activeId}`">复制会话编号</Copy>
        <span>更新于 <Time :time="lastSyncedAt" /></span>
      </div>
    </header>

    <div class="scenario-app__body">
      <aside class="scenario-console__inbox">
        <div class="scenario-console__search">
          <CommandMenu
            :items="conversationCommands"
            :auto-focus="false"
            placeholder="搜索会话..."
            aria-label="搜索会话"
            @select="selectFromCommand"
          />
        </div>
        <Scrollbar height="100%">
          <div class="scenario-app__list">
            <button
              v-for="conversation in conversations"
              :key="conversation.id"
              type="button"
              class="scenario-conversation"
              :class="{ 'is-active': conversation.id === activeId }"
              @click="selectConversation(conversation.id)"
            >
              <span class="scenario-conversation__head">
                <strong>{{ conversation.name }}</strong>
                <span>{{ conversation.time }}</span>
              </span>
              <span class="scenario-conversation__company">{{ conversation.company }}</span>
              <span class="scenario-conversation__preview">{{ conversation.preview }}</span>
            </button>
          </div>
        </Scrollbar>
      </aside>

      <section class="scenario-console__thread">
        <header class="scenario-console__thread-head">
          <strong>{{ activeConversation?.name }}</strong>
          <span>{{ activeConversation?.company }}</span>
        </header>
        <div class="scenario-console__messages">
          <Loading
            v-if="switching"
            animation="spinner"
            title="加载会话"
            description="正在同步最近消息"
          />
          <template v-else>
            <div
              v-for="message in messages"
              :key="message.id"
              class="scenario-message"
              :class="`is-${message.from}`"
              @contextmenu.prevent="openMessageMenu($event, message)"
            >
              {{ message.text }}
            </div>
          </template>
        </div>
      </section>

      <aside class="scenario-app__side scenario-console__detail">
        <section class="scenario-app__section">
          <h3 class="scenario-app__section-title">客户信息</h3>
          <dl class="scenario-app__metrics">
            <div class="scenario-app__metric">
              <dt>所属企业</dt>
              <dd class="is-text">{{ activeConversation?.company }}</dd>
            </div>
            <div class="scenario-app__metric">
              <dt>未读消息</dt>
              <dd>{{ activeConversation?.unread ?? 0 }}</dd>
            </div>
          </dl>
        </section>

        <section class="scenario-app__section scenario-app__section--fill">
          <h3 class="scenario-app__section-title">快捷回复</h3>
          <MotionGroup animation="fade" :duration="220" class="scenario-replies">
            <button
              v-for="(reply, index) in replies"
              :key="`${reply}-${index}`"
              type="button"
              class="scenario-reply"
              @click="removeReply(index)"
            >
              {{ reply }}
            </button>
          </MotionGroup>
          <button type="button" class="button button--ghost button--small" @click="addReply">
            插入常用回复
          </button>
        </section>
      </aside>
    </div>

    <ContextMenu ref="menu" :items="messageMenuItems" @select="selectMessageAction" />
  </div>
</template>

<style lang="less">
.scenario-console__inbox {
  display: flex;
  flex-direction: column;
  width: 260px;
  flex: none;
  min-height: 0;
  border-right: 1px solid var(--w-color-border);
  background: var(--w-color-bg);
}

.scenario-console__search {
  padding: 10px;

  .w-command-menu {
    box-shadow: none;
  }
}

.scenario-conversation {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border: 0;
  border-radius: var(--w-radius-md, 8px);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--w-color-interactive-hover);
  }

  &.is-active {
    background: var(--w-color-selected);
    color: var(--w-color-selected-text);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    strong {
      font-size: var(--w-font-size-xs);
      font-weight: 600;
    }

    span {
      color: var(--w-color-text-tertiary);
      font-size: var(--w-font-size-2xs);
    }
  }

  &__company {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-2xs);
  }

  &__preview {
    overflow: hidden;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-2xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.scenario-console__thread {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.scenario-console__thread-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--w-color-border-subtle);

  strong {
    font-size: var(--w-font-size-sm);
    font-weight: 600;
  }

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-2xs);
  }
}

.scenario-console__messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.scenario-message {
  max-width: 78%;
  padding: 8px 11px;
  border-radius: var(--w-radius-md, 8px);
  font-size: var(--w-font-size-xs);
  line-height: 1.55;

  &.is-customer {
    align-self: flex-start;
    border: 1px solid var(--w-color-border);
    background: var(--w-color-surface);
  }

  &.is-agent {
    align-self: flex-end;
    background: var(--w-color-selected);
    color: var(--w-color-selected-text);
  }
}

.scenario-console__detail {
  width: 280px;
}

.scenario-replies {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.scenario-reply {
  padding: 8px 10px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface);
  color: var(--w-color-text-secondary);
  font: inherit;
  font-size: var(--w-font-size-xs);
  line-height: 1.5;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: var(--w-color-border-strong);
    background: var(--w-color-interactive-hover);
  }
}

.scenario-app__metric dd.is-text {
  font-size: var(--w-font-size-xs);
  font-weight: 500;
}

@media (max-width: 860px) {
  .scenario-console__inbox {
    width: auto;
    border-right: 0;
    border-bottom: 1px solid var(--w-color-border);
  }

  .scenario-console__detail {
    width: auto;
  }
}
</style>
