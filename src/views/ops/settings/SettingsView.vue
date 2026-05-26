<template>
  <div class="settings-view">
    <div class="settings-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-user-gear"></i>
        <span>个人设置</span>
      </div>
      <a-tree
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/settings']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="settings-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const treeData = [
  {
    title: '待办',
    key: '/ops/settings/todo',
    isLeaf: true,
  },
  {
    title: '申请',
    key: '/ops/settings/apply',
    isLeaf: true,
  },
  {
    title: '个人设置',
    key: '/ops/settings/profile',
    isLeaf: true,
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
</script>

<style scoped>
.settings-view {
  display: flex;
  height: 100%;
  min-height: 0;
}
.settings-sidebar {
  width: 180px;
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
.settings-content {
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

@media (max-width: 768px) {
  .settings-view { flex-direction: column; }
  .settings-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  .settings-content { padding: 16px; }
}
</style>