<template>
  <div class="multi-select">
    <div class="multi-select-trigger" :class="{ open }" @click="toggle">
      <template v-if="selected.length">
        <span v-for="s in selected" :key="s" class="ms-tag">
          {{ s }}
          <i class="fa-solid fa-xmark" @click.stop="remove(s)"></i>
        </span>
      </template>
      <span v-else class="ms-placeholder">{{ placeholder }}</span>
      <i class="fa-solid fa-chevron-down ms-arrow" :class="{ open }"></i>
    </div>
    <div class="multi-select-dropdown" :class="{ open }">
      <div class="ms-search">
        <i class="fa-solid fa-search"></i>
        <input type="text" :placeholder="'搜索' + label + '...'" v-model="query">
      </div>
      <div class="ms-list">
        <label
          v-for="item in filtered"
          :key="item"
          class="ms-item"
        >
          <input type="checkbox" :value="item" :checked="selected.includes(item)" @change="toggleItem(item)">
          {{ item }}
        </label>
        <div v-if="!filtered.length" class="ms-item" style="color:var(--text-ter);cursor:default;justify-content:center">
          {{ query ? '无匹配结果' : '暂无数据' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  placeholder: { type: String, default: '点击选择...' },
  label: { type: String, default: '' },
})

const emit = defineEmits(['toggle', 'remove'])

const open = ref(false)
const query = ref('')

const filtered = computed(() => {
  if (!query.value) return props.items
  return props.items.filter(i => i.includes(query.value))
})

function toggle() { open.value = !open.value }
function toggleItem(item) { emit('toggle', item) }
function remove(item) { emit('remove', item) }

function close() { open.value = false; query.value = '' }
</script>

<style scoped>
.multi-select { position: relative; z-index: 10; }
.multi-select-trigger { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; min-height: 36px; padding: 3px 8px; cursor: pointer; background: var(--bg-sec); border: 1px solid var(--border); border-radius: var(--rs); transition: border-color 0.15s; }
.multi-select-trigger:hover { border-color: var(--border-hover); }
.multi-select-trigger.open { border-color: var(--brand); }
.multi-select-trigger .ms-placeholder { font-size: 12px; color: var(--text-ter); padding: 2px 4px; }
.ms-arrow { margin-left: auto; font-size: 10px; color: var(--text-ter); transition: transform 0.2s; }
.ms-arrow.open { transform: rotate(180deg); }
.ms-tag { display: flex; align-items: center; gap: 3px; padding: 2px 8px; font-size: 11px; font-weight: 500; background: var(--brand-subtle); color: var(--brand); border-radius: 12px; }
.ms-tag i { font-size: 8px; cursor: pointer; opacity: 0.7; }
.ms-tag i:hover { opacity: 1; }
.multi-select-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg); border: 1px solid var(--border); border-radius: var(--rs); box-shadow: var(--shadow-lg); max-height: 220px; display: flex; flex-direction: column; opacity: 0; pointer-events: none; transform: translateY(-4px); transition: all 0.15s var(--ease); }
.multi-select-dropdown.open { opacity: 1; pointer-events: auto; transform: translateY(0); }
.multi-select-dropdown .ms-search { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--border); }
.multi-select-dropdown .ms-search i { font-size: 12px; color: var(--text-ter); }
.multi-select-dropdown .ms-search input { border: none; outline: none; font-size: 12px; font-family: var(--font); background: transparent; color: var(--text); width: 100%; }
.multi-select-dropdown .ms-list { overflow-y: auto; flex: 1; }
.multi-select-dropdown .ms-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; font-size: 12px; cursor: pointer; transition: background 0.1s; }
.multi-select-dropdown .ms-item:hover { background: var(--bg-sec); }
.multi-select-dropdown .ms-item input { accent-color: var(--brand); }
</style>
