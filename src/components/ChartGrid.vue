<template>
  <div class="chart-grid">
    <template v-for="(groupName, gIdx) in groupedCharts" :key="groupName">
      <div v-if="groupName" class="chart-group-label" :data-group="groupName">{{ groupName }}</div>
      <div
        v-for="ch in getChartsByGroup(groupName)"
        :key="ch.id"
        class="chart-card"
        :class="{ selected: state.selectedId === ch.id }"
        @click="selectChart(ch.id)"
      >
        <div class="chart-card-header">
          <div class="chart-label">
            <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
            <h3>{{ ch.title }}</h3>
            <i v-if="ch.linkEnabled" class="fa-solid fa-arrow-up-right-from-square link-icon"></i>
          </div>
          <div class="chart-card-actions">
            <button class="chart-card-action" @click.stop="dupChart(ch.id)"><i class="fa-regular fa-copy"></i></button>
            <button class="chart-card-action danger" @click.stop="delChart(ch.id)"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
        <div class="chart-body">
          <ChartRenderer :type="ch.type" :color="ch.color" :data="chartData[ch.id]" />
        </div>
      </div>
    </template>
    <div class="add-card" @click="addChart()">
      <i class="fa-solid fa-plus"></i>
      <span>添加图表</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import ChartRenderer from './ChartRenderer.vue'

const { state, chartData, selectChart, addChart, delChart, dupChart, refreshAllCharts } = useEditorState()

const groupedCharts = computed(() => {
  const groups = []
  state.charts.forEach(ch => {
    const group = ch.group || '默认分组'
    if (!groups.includes(group)) {
      groups.push(group)
    }
  })
  return groups
})

function getChartsByGroup(groupName) {
  return state.charts.filter(ch => (ch.group || '默认分组') === groupName)
}

onMounted(() => { refreshAllCharts() })

watch(() => state.period, () => { refreshAllCharts() })
</script>

<style scoped>
.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; flex: 1 1 0%; min-height: 0; grid-auto-rows: minmax(280px, 1fr); }
.chart-group-label { grid-column: 1 / -1; font-size: 13px; font-weight: 600; color: var(--text-ter); padding: 16px 0 8px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.add-card { border: 1px dashed var(--border-hover); border-radius: var(--rl); min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.2s var(--ease); background: var(--bg); color: var(--text-ter); box-shadow: var(--shadow-sm); }
.add-card:hover { border-color: var(--brand); background: var(--brand-subtle); color: var(--brand); }
.add-card i { font-size: 24px; }
.add-card span { font-size: 13px; font-weight: 500; }
.chart-body { flex: 1; padding: 2px 14px 14px; display: flex; align-items: stretch; touch-action: pan-y; }
.chart-body > * { width: 100%; min-height: 155px; touch-action: pan-y; }
@media (max-width: 1024px) { .chart-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; } }
@media (max-width: 768px) { .chart-grid { gap: 16px; } .add-card i { font-size: 20px; } }
@media (max-width: 640px) { .chart-grid { grid-template-columns: 1fr; gap: 16px; } .add-card i { font-size: 18px; } }
@media (max-width: 420px) { .chart-grid { gap: 16px; } .add-card { border-radius: var(--rm); } .add-card i { font-size: 16px; } .add-card span { font-size: 12px; } }
</style>
