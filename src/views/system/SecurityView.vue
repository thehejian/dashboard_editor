<template>
  <div class="security-view">
    <div class="security-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-shield-halved"></i>
        <span>安全管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/system/security/tenant', '/system/security/auth', '/system/security/integration']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="security-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="security-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="security-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-shield-halved"></i>
        <span>安全管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/system/security/tenant', '/system/security/auth', '/system/security/integration']"
        @select="onMobileSelectTree"
        block-node
      />
    </div>
    <div class="security-content" :class="{ 'create-mode': isCreatePage }">
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
    title: '租户管理',
    key: '/system/security/tenant',
    selectable: false,
    children: [
      { title: '用户', key: '/system/security/users', isLeaf: true },
    ],
  },
  {
    title: '授权管理',
    key: '/system/security/auth',
    selectable: false,
    children: [
      { title: '用户组', key: '/system/security/user-groups', isLeaf: true },
      { title: '策略', key: '/system/security/policies', isLeaf: true },
      { title: '角色', key: '/system/security/roles', isLeaf: true },
      { title: '资源组', key: '/system/security/resource-groups', isLeaf: true },
    ],
  },
  {
    title: '集成管理',
    key: '/system/security/integration',
    selectable: false,
    children: [
      { title: '应用集成', key: '/system/security/app-integration', isLeaf: true },
      { title: '身份提供商', key: '/system/security/idp', isLeaf: true },
      { title: '集成账号', key: '/system/security/integration-accounts', isLeaf: true },
    ],
  },
]

const isCreatePage = computed(() => route.path.includes('/idp/create') || route.path.includes('/app-integration/create'))

const selectedKeys = computed(() => {
  const p = route.path
  if (p.startsWith('/system/security/idp/create')) return ['/system/security/idp']
  if (p.startsWith('/system/security/app-integration/create')) return ['/system/security/app-integration']
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
  if (p.startsWith('/system/security/idp/create')) {
    mobileRoute.value = '/system/security/idp'
  } else if (p.startsWith('/system/security/app-integration/create')) {
    mobileRoute.value = '/system/security/app-integration'
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
.security-view {
  display: flex;
  height: 100%;
  min-height: 0;
}
.security-sidebar {
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
.security-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.security-content.create-mode {
  overflow: hidden;
  padding: 0;
}
.security-mobile-nav { display: none; }
.security-mobile-sidebar { display: none; }
.security-mobile-mask { display: none; }
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
  .security-sidebar { width: 180px; }
}

@media (max-width: 768px) {
  .security-view { flex-direction: column; }
  .security-sidebar { display: none; }
  .security-mobile-nav {
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
  .security-mobile-mask {
    display: block;
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.35);
    z-index: 1000;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
  }
  .security-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .security-mobile-sidebar {
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
  .security-mobile-sidebar.open { left: 0; }
  .security-content { padding: 16px 12px; }
  .security-content.create-mode { padding: 0; }
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
