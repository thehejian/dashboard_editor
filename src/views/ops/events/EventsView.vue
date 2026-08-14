<template>
  <div class="events-view">
    <div class="events-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-bolt"></i>
        <span>异常事件管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/events/overview', '/ops/events/list', '/ops/events/trace', '/ops/events/rules', '/ops/events/alerts']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="events-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="events-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="events-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-bolt"></i>
        <span>异常事件管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/events/overview', '/ops/events/list', '/ops/events/trace', '/ops/events/rules', '/ops/events/alerts']"
        @select="onMobileSelectTree"
        block-node
      />
    </div>
    <div class="events-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MOCK_EVENTS } from './mockData.js'

const route = useRoute()
const router = useRouter()

const treeData = [
  {
    title: () => h('span', '概览'),
    key: '/ops/events/overview',
    selectable: false,
    children: [
      { title: '事件概览', key: '/ops/events/overview/view', isLeaf: true },
    ],
  },
  {
    title: () => h('span', '事件列表'),
    key: '/ops/events/list',
    selectable: false,
    children: [
      { title: () => h('span', null, ['全部事件', h('span', { style: { marginLeft: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '16px', borderRadius: '8px', background: '#ff4d4f', color: '#fff', fontSize: '10px', padding: '0 5px' } }, MOCK_EVENTS.filter(e => e.status === 'unprocessed').length.toString())]), key: '/ops/events/list/all', isLeaf: true },
      { title: '未处理事件', key: '/ops/events/list/unprocessed', isLeaf: true },
      { title: '紧急事件', key: '/ops/events/list/emergency', isLeaf: true },
    ],
  },
  {
    title: () => h('span', '日志追踪'),
    key: '/ops/events/trace',
    selectable: false,
    children: [
      { title: '追踪任务管理', key: '/ops/events/trace/tasks', isLeaf: true },
    ],
  },
  {
    title: () => h('span', '检测规则'),
    key: '/ops/events/rules',
    selectable: false,
    children: [
      { title: '规则管理', key: '/ops/events/rules/manage', isLeaf: true },
    ],
  },
  {
    title: () => h('span', '转告警规则'),
    key: '/ops/events/alerts',
    selectable: false,
    children: [
      { title: '告警转换规则', key: '/ops/events/alerts/rules', isLeaf: true },
    ],
  },
]

const selectedKeys = computed(() => {
  const p = route.path
  if (p === '/ops/events/trace/result') {
    const taskId = route.query.taskId
    return taskId ? ['/ops/events/trace/tasks'] : ['/ops/events/trace/tasks']
  }
  if (p === '/ops/events/analysis') return ['/ops/events/list/all']
  return [p]
})

function onSelect(keys) {
  if (keys.length && keys[0] !== route.path) {
    router.push(keys[0])
  }
}

const mobileOpen = ref(false)
const mobileRoute = ref('')

function flatTree(nodes, depth = 0) {
  const result = []
  for (const n of nodes) {
    result.push({ title: n.title, key: n.key, depth })
    if (n.children) result.push(...flatTree(n.children, depth + 1))
  }
  return result
}
const flatItems = computed(() => flatTree(treeData).filter(i => i.depth > 0))

watch(() => route.path, (p) => { mobileRoute.value = p }, { immediate: true })

function onMobileSelect(key) {
  if (key && key !== route.path) {
    router.push(key)
    mobileOpen.value = false
  }
}

function onMobileSelectTree(keys) {
  mobileOpen.value = false
  onSelect(keys)
}
</script>

<style scoped>
.events-view { display: flex; height: 100%; min-height: 0; }
.events-sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid var(--border); background: var(--bg); overflow-y: auto; padding: 16px 0; }
.sidebar-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); padding: 0 16px 12px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.sidebar-title i { font-size: 14px; color: var(--brand); }
.events-content { flex: 1; overflow-y: auto; padding: 16px 24px 24px; }
.events-mobile-nav { display: none; }
.events-mobile-sidebar { display: none; }
.events-mobile-mask { display: none; }
:deep(.ant-tree) { background: transparent; }
:deep(.ant-tree .ant-tree-treenode) { padding: 2px 0; }
:deep(.ant-tree .ant-tree-node-content-wrapper) { font-size: 13px; }
:deep(.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected) { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
:deep(.ant-tree .ant-tree-treenode:not(.ant-tree-treenode-disabled).ant-tree-treenode-selected) { background: transparent; }
:deep(.ant-tree .ant-tree-indent-unit) { width: 16px; }
@media (max-width: 1024px) { .events-sidebar { width: 180px; } }
@media (max-width: 768px) {
  .events-view { flex-direction: column; }
  .events-sidebar { display: none; }
  .events-mobile-nav { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--bg); flex-shrink: 0; }
  .mobile-menu-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; flex-shrink: 0; }
  .mobile-menu-btn:hover { border-color: var(--brand); color: var(--brand); }
  .events-mobile-mask { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .events-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .events-mobile-sidebar { display: block; position: fixed; top: 0; left: -260px; bottom: 0; width: 240px; background: var(--bg); z-index: 1001; padding: 16px 0; overflow-y: auto; transition: left 0.25s ease; box-shadow: 2px 0 8px rgba(0,0,0,0.12); }
  .events-mobile-sidebar.open { left: 0; }
  .events-content { padding: 16px 12px; }
}
</style>