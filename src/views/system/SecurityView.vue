<template>
  <div class="security-view">
    <div class="security-sidebar">
      <div class="sidebar-title">安全管理</div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/system/security/tenant', '/system/security/auth', '/system/security/integration']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="security-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const treeData = [
  {
    title: '租户管理',
    key: '/system/security/tenant',
    selectable: false,
    children: [
      { title: '用户管理', key: '/system/security/users', isLeaf: true },
    ],
  },
  {
    title: '授权管理',
    key: '/system/security/auth',
    selectable: false,
    children: [
      { title: '用户组管理', key: '/system/security/user-groups', isLeaf: true },
      { title: '策略管理', key: '/system/security/policies', isLeaf: true },
      { title: '角色管理', key: '/system/security/roles', isLeaf: true },
      { title: '资源组', key: '/system/security/resource-groups', isLeaf: true },
    ],
  },
  {
    title: '集成管理',
    key: '/system/security/integration',
    selectable: false,
    children: [
      { title: '应用集成管理', key: '/system/security/app-integration', isLeaf: true },
      { title: '身份提供商', key: '/system/security/idp', isLeaf: true },
      { title: '集成账号', key: '/system/security/integration-accounts', isLeaf: true },
    ],
  },
]

const selectedKeys = computed(() => {
  const p = route.path
  if (p.startsWith('/system/security/idp/create')) return ['/system/security/idp']
  return [p]
})

function onSelect(keys) {
  if (keys.length && keys[0] !== route.path) {
    router.push(keys[0])
  }
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.security-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
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
</style>
