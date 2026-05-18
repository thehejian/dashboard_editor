<template>
  <div>
    <div class="tree-node" :class="{ selected: selected === node.name }" @click="handleClick">
      <i v-if="hasChildren" class="fa-solid" :class="isOpen ? 'fa-chevron-down' : 'fa-chevron-right'" style="width:12px;font-size:10px;margin-right:4px;color:var(--text-sec)"></i>
      <span v-else style="display:inline-block;width:16px"></span>
      <i :class="'fa-solid ' + (node.icon || 'fa-server')" style="width:16px;font-size:12px;margin-right:6px;color:var(--text-sec)"></i>
      <span style="font-size:13px;color:var(--text)">{{ node.name }}</span>
      <span class="tree-status" :class="'tree-' + node.status" style="margin-left:auto">{{ statusLabel }}</span>
    </div>
    <div v-if="hasChildren && isOpen" style="padding-left:12px">
      <TreeNode v-for="child in node.children" :key="child.name" :node="child" :selected="selected" @select="e => $emit('select', e)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ node: Object, selected: String })
const emit = defineEmits(['select'])
const isOpen = ref(true)
const hasChildren = computed(() => props.node.children && props.node.children.length)
const statusLabel = computed(() => ({ normal: '正常', warning: '警告', error: '异常' }[props.node.status] || '正常'))

function handleClick() {
  emit('select', props.node.name)
  if (hasChildren.value) isOpen.value = !isOpen.value
}
</script>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  user-select: none;
  cursor: pointer;
}
.tree-node:hover { background: #f0f5ff; }
.tree-node.selected { background: #e6f7ff; font-weight: 500; }
.tree-status { font-size: 11px; padding: 1px 8px; border-radius: 10px; font-weight: 500; }
.tree-normal { background: #f6ffed; color: #52c41a; }
.tree-warning { background: #fff7e6; color: #fa8c16; }
.tree-error { background: #fff1f0; color: #f5222d; }
</style>
