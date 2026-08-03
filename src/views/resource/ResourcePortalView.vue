<template>
  <div class="resource-view">
    <div class="resource-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-server"></i>
        <span>资源</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :show-icon="true"
        @select="onSelect"
        block-node
      />
    </div>

    <div class="resource-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="resource-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="resource-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-server"></i>
        <span>资源</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :show-icon="true"
        @select="onMobileSelectTree"
        block-node
      />
    </div>

    <div class="resource-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const treeData = [
  { title: '资源概览', key: '/resource/list/overview', icon: () => h('i', { class: 'fa-solid fa-chart-pie' }) },
  { title: '资源发现', key: '/resource/list/discovery', icon: () => h('i', { class: 'fa-solid fa-magnifying-glass-chart' }) },
  { title: '资源管理', key: '/resource/list/manage', icon: () => h('i', { class: 'fa-solid fa-server' }) },
  { title: '配置审计与合规', key: '/resource/list/audit', icon: () => h('i', { class: 'fa-solid fa-shield-halved' }) },
]

const selectedKeys = computed(() => {
  const p = route.path
  const matched = treeData.find(n => p.startsWith(n.key))
  return [matched ? matched.key : '/resource/list/overview']
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
  const matched = treeData.find(n => p.startsWith(n.key))
  mobileRoute.value = matched ? matched.key : '/resource/list/overview'
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
.resource-view {
  display: flex;
  height: 100%;
  min-height: 0;
}
.resource-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--bg);
  overflow-y: auto;
  padding: 16px 0;
}
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.sidebar-title i { font-size: 14px; color: var(--brand); }
.resource-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.resource-mobile-nav { display: none; }
.resource-mobile-sidebar { display: none; }
.resource-mobile-mask { display: none; }
:deep(.ant-tree) {
  background: transparent;
}
:deep(.ant-tree .ant-tree-treenode) {
  padding: 2px 0;
}
:deep(.ant-tree .ant-tree-node-content-wrapper) {
  font-size: 13px;
}
:deep(.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected) {
  background: var(--brand-subtle);
  color: var(--brand);
  font-weight: 500;
}
:deep(.ant-tree .ant-tree-treenode:not(.ant-tree-treenode-disabled).ant-tree-treenode-selected) {
  background: transparent;
}
:deep(.ant-tree .ant-tree-indent-unit) {
  width: 16px;
}

@media (max-width: 1024px) {
  .resource-sidebar { width: 180px; }
}

@media (max-width: 768px) {
  .resource-view { flex-direction: column; }
  .resource-sidebar { display: none; }
  .resource-mobile-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    flex-shrink: 0;
  }
  .mobile-menu-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .mobile-menu-btn:hover { border-color: var(--brand); color: var(--brand); }
  .resource-mobile-mask {
    display: block;
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.35);
    z-index: 1000;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
  }
  .resource-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .resource-mobile-sidebar {
    display: block;
    position: fixed; top: 0; left: -260px; bottom: 0;
    width: 240px;
    background: var(--bg);
    z-index: 1001;
    padding: 16px 0;
    overflow-y: auto;
    transition: left 0.25s ease;
    box-shadow: 2px 0 8px rgba(0,0,0,0.12);
  }
  .resource-mobile-sidebar.open { left: 0; }
  .resource-content { padding: 16px 12px; }
}
</style>
