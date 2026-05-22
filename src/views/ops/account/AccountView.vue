<template>
  <div class="account-view">
    <div class="account-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-user-lock"></i>
        <span>账号管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/account/os', '/ops/account/db', '/ops/account/op', '/ops/account/middleware', '/ops/account/device', '/ops/account/apply', '/ops/account/config']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="account-mobile-nav">
      <a-button type="text" class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">
        <i class="fa-solid" :class="mobileOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </a-button>
      <a-select v-model:value="mobileRoute" style="flex:1;min-width:0" size="small" @change="onMobileSelect">
        <a-select-option v-for="item in flatItems" :key="item.key" :value="item.key">{{ item.title }}</a-select-option>
      </a-select>
    </div>
    <div class="account-mobile-mask" :class="{ open: mobileOpen }" @click="mobileOpen = false"></div>
    <div class="account-mobile-sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-title">
        <i class="fa-solid fa-user-lock"></i>
        <span>账号管理</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/account/os', '/ops/account/db', '/ops/account/op', '/ops/account/middleware', '/ops/account/device', '/ops/account/apply', '/ops/account/config']"
        @select="onMobileSelectTree"
        block-node
      />
    </div>
    <div class="account-content">
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
    title: '操作系统账号',
    key: '/ops/account/os',
    selectable: false,
    children: [
      { title: '账号列表', key: '/ops/account/os/list', isLeaf: true },
      { title: '账号策略', key: '/ops/account/os/policy', isLeaf: true },
      { title: '第三方纳管', key: '/ops/account/os/thirdparty', isLeaf: true },
    ],
  },
  {
    title: '数据库账号',
    key: '/ops/account/db',
    selectable: false,
    children: [
      { title: '账号列表', key: '/ops/account/db/list', isLeaf: true },
      { title: '账号策略', key: '/ops/account/db/policy', isLeaf: true },
    ],
  },
  {
    title: 'OP账号',
    key: '/ops/account/op',
    selectable: false,
    children: [
      { title: '账号列表', key: '/ops/account/op/list', isLeaf: true },
      { title: '账号策略', key: '/ops/account/op/policy', isLeaf: true },
    ],
  },
  {
    title: '应用及中间件账号',
    key: '/ops/account/middleware',
    selectable: false,
    children: [
      { title: '账号列表', key: '/ops/account/middleware/list', isLeaf: true },
      { title: '账号策略', key: '/ops/account/middleware/policy', isLeaf: true },
    ],
  },
  {
    title: '设备及其他账号',
    key: '/ops/account/device',
    selectable: false,
    children: [
      { title: '账号列表', key: '/ops/account/device/list', isLeaf: true },
      { title: '账号策略', key: '/ops/account/device/policy', isLeaf: true },
    ],
  },
  {
    title: '账号申请',
    key: '/ops/account/apply',
    selectable: false,
    children: [
      { title: '已申请账号', key: '/ops/account/apply/history', isLeaf: true },
      { title: '账号申请', key: '/ops/account/apply/new', isLeaf: true },
    ],
  },
  {
    title: '账号配置',
    key: '/ops/account/config',
    selectable: false,
    children: [
      { title: '备份', key: '/ops/account/config/backup', isLeaf: true },
      { title: '更新eSight对接BMC密码', key: '/ops/account/config/esight-bmc', isLeaf: true },
      { title: '快照', key: '/ops/account/config/snapshot', isLeaf: true },
      { title: '账号保管箱', key: '/ops/account/safebox', isLeaf: true },
    ],
  },
]

const selectedKeys = computed(() => {
  const p = route.path
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
  mobileRoute.value = p
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
.account-view {
  display: flex;
  height: 100%;
  min-height: 0;
}
.account-sidebar {
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
.account-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.account-mobile-nav { display: none; }
.account-mobile-sidebar { display: none; }
.account-mobile-mask { display: none; }
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
  .account-sidebar { width: 180px; }
}

@media (max-width: 768px) {
  .account-view { flex-direction: column; }
  .account-sidebar { display: none; }
  .account-mobile-nav {
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
  .account-mobile-mask {
    display: block;
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.35);
    z-index: 1000;
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s;
  }
  .account-mobile-mask.open { opacity: 1; pointer-events: auto; }
  .account-mobile-sidebar {
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
  .account-mobile-sidebar.open { left: 0; }
  .account-content { padding: 16px 12px; }
}
</style>

<style>
@media (max-width: 768px) {
  .account-content .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .account-content .page-header h3 { font-size: 16px; }
  .account-content .page-header .ant-btn { width: 100%; }
  .account-content .button-row { flex-wrap: wrap; }
  .account-content .button-row .ant-btn { flex: 1; min-width: 0; }
  .account-content .search-row .ant-input-search { width: 100% !important; }
  .account-content .ant-table { overflow-x: auto; }
  .account-content .ant-table-body { overflow-x: auto !important; }
}
</style>
