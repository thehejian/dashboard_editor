<template>
  <div class="log-manage-view">
    <div class="log-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-file-lines"></i>
        <span>日志管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/logs/operation', '/ops/logs/runtime', '/ops/logs/config']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="log-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="log-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="log-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-file-lines"></i>
        <span>日志管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/logs/operation', '/ops/logs/runtime', '/ops/logs/config']"
        @select="onMobileSelectTree"
        block-node
      />
    </div>
    <div class="log-content" :class="{ 'create-mode': isCreatePage }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const treeData = [
  {
    title: '操作日志',
    key: '/ops/logs/operation',
    selectable: false,
    children: [
      { title: '日志查询', key: '/ops/logs/operation/query', isLeaf: true },
      { title: '参数配置', key: '/ops/logs/operation/config', isLeaf: true },
      { title: '集群状态', key: '/ops/logs/operation/cluster', isLeaf: true },
    ],
  },
  {
    title: '运行日志',
    key: '/ops/logs/runtime',
    selectable: false,
    children: [
      { title: '日志查询', key: '/ops/logs/runtime/query', isLeaf: true },
      { title: '日志下载', key: '/ops/logs/runtime/download', isLeaf: true },
    ],
  },
  {
    title: '参数配置',
    key: '/ops/logs/config',
    selectable: false,
    children: [
      { title: '日志采集任务', key: '/ops/logs/config/tasks', isLeaf: true },
      { title: '日志转发任务', key: '/ops/logs/config/forward', isLeaf: true },
      { title: '日志采集模板', key: '/ops/logs/config/templates', isLeaf: true },
      { title: '日志转发目的地', key: '/ops/logs/config/destinations', isLeaf: true },
      { title: '日志下载配置', key: '/ops/logs/config/download-settings', isLeaf: true },
    ],
  },
]

const isCreatePage = computed(() => route.path.includes('/tasks/create'))

const selectedKeys = computed(() => {
  const p = route.path
  if (p.includes('/tasks/create')) return ['/ops/logs/config/tasks']
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

watch(() => route.path, (p) => {
  if (p.includes('/tasks/create')) {
    mobileRoute.value = '/ops/logs/config/tasks'
  } else {
    mobileRoute.value = p
  }
}, { immediate: true })

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
.log-manage-view { display: flex; height: 100%; min-height: 0; }
.log-sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid var(--border); background: var(--bg); overflow-y: auto; padding: 16px 0; }
.sidebar-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); padding: 0 16px 12px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.sidebar-title i { font-size: 14px; color: var(--brand); }
.log-content { flex: 1; overflow-y: auto; padding: 16px 24px 24px; }
.log-content.create-mode { padding: 0; }
.log-mobile-nav { display: none; }
.log-mobile-sidebar { display: none; }
.log-mobile-mask { display: none; }
:deep(.ant-tree) { background: transparent; }
:deep(.ant-tree .ant-tree-treenode) { padding: 2px 0; }
:deep(.ant-tree .ant-tree-node-content-wrapper) { font-size: 13px; }
:deep(.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected) { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
:deep(.ant-tree .ant-tree-treenode:not(.ant-tree-treenode-disabled).ant-tree-treenode-selected) { background: transparent; }
:deep(.ant-tree .ant-tree-indent-unit) { width: 16px; }

@media (max-width: 1024px) { .log-sidebar { width: 180px; } }
@media (max-width: 768px) {
  .log-manage-view { flex-direction: column; }
  .log-sidebar { display: none; }
  .log-mobile-nav { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--bg); flex-shrink: 0; }
  .mobile-menu-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; flex-shrink: 0; }
  .mobile-menu-btn:hover { border-color: var(--brand); color: var(--brand); }
  .log-mobile-mask { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .log-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .log-mobile-sidebar { display: block; position: fixed; top: 0; left: -260px; bottom: 0; width: 240px; background: var(--bg); z-index: 1001; padding: 16px 0; overflow-y: auto; transition: left 0.25s ease; box-shadow: 2px 0 8px rgba(0,0,0,0.12); }
  .log-mobile-sidebar.open { left: 0; }
  .log-content { padding: 16px 12px; }
}
</style>
