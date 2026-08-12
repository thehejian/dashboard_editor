<template>
  <div class="incident-center-view">
    <div class="ic-sidebar">
      <div class="sidebar-title">
        <i class="fa-solid fa-shield-halved"></i>
        <span>故障中心</span>
      </div>
      <a-tree
        :selected-keys="selectedKeys"
        :tree-data="treeData"
        :default-expanded-keys="['/ops/incidents', '/ops/incidents/config', '/ops/incidents/analysis']"
        @select="onSelect"
        block-node
      />
    </div>
    <div class="ic-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const selectedKeys = ref([route.path])

const treeData = [
  {
    title: '故障管理',
    key: '/ops/incidents',
    selectable: false,
    children: [
      { title: '故障列表', key: '/ops/incidents/list', isLeaf: true },
      { title: '复盘记录', key: '/ops/incidents/postmortems', isLeaf: true },
    ],
  },
  {
    title: '自愈配置',
    key: '/ops/incidents/config',
    selectable: false,
    children: [
      { title: '自愈策略模板', key: '/ops/incidents/config/templates', isLeaf: true },
      { title: '自愈执行记录', key: '/ops/incidents/config/records', isLeaf: true },
    ],
  },
  {
    title: '故障分析',
    key: '/ops/incidents/analysis',
    selectable: false,
    children: [
      { title: '故障趋势', key: '/ops/incidents/analysis/trend', isLeaf: true },
      { title: '根因分析报告', key: '/ops/incidents/analysis/rca', isLeaf: true },
    ],
  },
]

function onSelect(keys) {
  if (keys.length) {
    selectedKeys.value = keys
    router.push(keys[0])
  }
}

watch(() => route.path, (v) => {
  selectedKeys.value = [v]
})
</script>

<style scoped>
.incident-center-view {
  display: flex;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.ic-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  padding: 16px 0;
  overflow-y: auto;
}
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}
.sidebar-title i { color: #1890ff; font-size: 16px; }
.ic-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
.ic-content :deep(.incident-list-view),
.ic-content :deep(.page-view) {
  padding: 24px;
}
</style>