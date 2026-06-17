<template>
  <div class="alarm-manage-view">
    <div class="alarm-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-bell"></i>
        <span>告警管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/alarm/settings']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="alarm-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="alarm-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="alarm-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-bell"></i>
        <span>告警管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/alarm/settings']"
        @select="onMobileSelectTree"
        block-node
      />
    </div>
    <div class="alarm-content">
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
  { title: '告警', key: '/alarm/current', isLeaf: true },
  { title: '事件', key: '/alarm/events', isLeaf: true },
  {
    title: '设置',
    key: '/alarm/settings',
    selectable: false,
    children: [
      { title: '告警规则', key: '/alarm/settings/rules', isLeaf: true },
      { title: '告警通知', key: '/alarm/settings/notification', isLeaf: true },
      { title: '告警扩展', key: '/alarm/settings/extension', isLeaf: true },
    ],
  },
  { title: '个性化', key: '/alarm/customize', isLeaf: true },
]

const selectedKeys = computed(() => [route.path])
const isCreatePage = computed(() => false)

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
.alarm-manage-view { display: flex; height: 100%; min-height: 0; }
.alarm-sidebar { width: 200px; flex-shrink: 0; border-right: 1px solid var(--border); background: var(--bg); overflow-y: auto; padding: 16px 0; }
.sidebar-title { display: flex; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text); padding: 0 16px 12px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.sidebar-title i { font-size: 14px; color: var(--brand); }
.sidebar-subtitle { font-size: 11px; color: var(--brand); font-weight: 400; }
.alarm-content { flex: 1; overflow-y: auto; padding: 0 24px 24px; }
.alarm-mobile-nav { display: none; }
.alarm-mobile-sidebar { display: none; }
.alarm-mobile-mask { display: none; }
:deep(.ant-tree) { background: transparent; }
:deep(.ant-tree .ant-tree-treenode) { padding: 2px 0; }
:deep(.ant-tree .ant-tree-node-content-wrapper) { font-size: 13px; }
:deep(.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected) { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
:deep(.ant-tree .ant-tree-treenode:not(.ant-tree-treenode-disabled).ant-tree-treenode-selected) { background: transparent; }
:deep(.ant-tree .ant-tree-indent-unit) { width: 16px; }

@media (max-width: 1024px) { .alarm-sidebar { width: 180px; } }
@media (max-width: 768px) {
  .alarm-manage-view { flex-direction: column; }
  .alarm-sidebar { display: none; }
  .alarm-mobile-nav { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--bg); flex-shrink: 0; }
  .mobile-menu-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; flex-shrink: 0; }
  .mobile-menu-btn:hover { border-color: var(--brand); color: var(--brand); }
  .alarm-mobile-mask { display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .alarm-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .alarm-mobile-sidebar { display: block; position: fixed; top: 0; left: -260px; bottom: 0; width: 240px; background: var(--bg); z-index: 1001; padding: 16px 0; overflow-y: auto; transition: left 0.25s ease; box-shadow: 2px 0 8px rgba(0,0,0,0.12); }
  .alarm-mobile-sidebar.open { left: 0; }
  .alarm-content { padding: 0; }
}
</style>

<style>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .page-header .ant-btn { width: 100%; }
  .filter-bar { flex-direction: column; gap: 8px; }
  .filter-bar .ant-input-search,
  .filter-bar .ant-select,
  .filter-bar input,
  .filter-bar .ant-input-affix-wrapper { width: 100% !important; }
  .button-row { flex-wrap: wrap; }
  .button-row .ant-btn { flex: 1; min-width: 0; }
  .filter-row { flex-direction: column; gap: 8px; }
  .filter-row .ant-input-search,
  .filter-row .ant-select,
  .filter-row .ant-input-affix-wrapper { width: 100% !important; }
  .search-row .ant-input-search { width: 100% !important; }
  .ant-table { overflow-x: auto; }
  .ant-table-body { overflow-x: auto !important; }
}
</style>
