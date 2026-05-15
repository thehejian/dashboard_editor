<template>
  <div class="chart-wrapper">
    <draggable
      v-model="chartList"
      class="chart-grid"
      :class="{ 'edit-mode': state.editMode }"
      item-key="id"
      :disabled="!state.editMode"
      ghost-class="ghost"
      @end="onDragEnd"
    >
      <template #item="{ element: ch }">
        <div
          class="chart-card"
          :class="{ selected: state.selectedId === ch.id }"
          :data-chart-id="ch.id"
          @click="handleChartClick(ch)"
        >
          <div class="chart-card-header">
            <div class="chart-label">
              <span v-if="state.editMode" class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
              <h3>{{ ch.title }}</h3>
              <i v-if="ch.linkEnabled" class="fa-solid fa-arrow-up-right-from-square link-icon"></i>
            </div>
            <div class="chart-card-actions">
              <button class="chart-card-action" @click.stop="toggleFullscreen(ch)" title="全屏"><i class="fa-solid fa-expand"></i></button>
              <button v-if="state.editMode" class="chart-card-action" @click.stop="dupChart(ch.id)"><i class="fa-regular fa-copy"></i></button>
              <button v-if="state.editMode" class="chart-card-action danger" @click.stop="delChart(ch.id)"><i class="fa-regular fa-trash-can"></i></button>
            </div>
          </div>
          <div class="chart-body">
            <ChartRenderer :type="ch.type" :color="ch.color" :data="chartData[ch.id]" />
          </div>
        </div>
      </template>
    </draggable>
    <div class="add-card" @click="addChart()">
      <i class="fa-solid fa-plus"></i>
      <span>添加图表</span>
    </div>

    <Teleport to="body">
      <div v-if="fullscreenChart" class="fullscreen-overlay" @click="closeFullscreen">
        <div class="fullscreen-card" @click.stop>
          <div class="fullscreen-header">
            <h3>{{ fullscreenChart.title }}</h3>
            <button class="fullscreen-close" @click="closeFullscreen"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="fullscreen-body">
            <ChartRenderer :type="fullscreenChart.type" :color="fullscreenChart.color" :data="chartData[fullscreenChart.id]" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import { useEditorState } from '../composables/useEditorState'
import ChartRenderer from './ChartRenderer.vue'

const { state, chartData, selectChart, addChart, delChart, dupChart, refreshAllCharts, reorderCharts } = useEditorState()

const fullscreenChart = ref(null)

const chartList = computed({
  get: () => state.charts,
  set: (val) => reorderCharts(val)
})

function onDragEnd() {}

function toggleFullscreen(ch) {
  fullscreenChart.value = ch
}

function closeFullscreen() {
  fullscreenChart.value = null
}

function handleChartClick(ch) {
  if (state.editMode) {
    selectChart(ch.id)
  } else if (ch.drillDownUrl) {
    window.location.href = ch.drillDownUrl
  }
}

onMounted(() => { refreshAllCharts() })

watch(() => state.period, () => { refreshAllCharts() })
</script>

<style scoped>
.chart-wrapper { display: flex; flex-wrap: wrap; gap: 16px; flex: 1 1 0%; min-height: 0; }
.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; flex: 1 1 0%; min-height: 0; grid-auto-rows: minmax(280px, 1fr); }
.chart-grid.edit-mode .chart-card { cursor: grab; }
.chart-grid.edit-mode .chart-card:active { cursor: grabbing; }
.chart-grid.edit-mode .drag-handle { opacity: 1; }
.chart-grid.edit-mode .chart-card:hover { border-color: var(--border-hover); }
.chart-grid.ghost { opacity: 0.5; background: var(--brand-subtle); }
.add-card { border: 1px dashed var(--border-hover); border-radius: var(--rl); min-height: 120px; width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.2s var(--ease); background: var(--bg); color: var(--text-ter); box-shadow: var(--shadow-sm); }
.add-card:hover { border-color: var(--brand); background: var(--brand-subtle); color: var(--brand); }
.add-card i { font-size: 24px; }
.add-card span { font-size: 13px; font-weight: 500; }
.chart-body { flex: 1; padding: 2px 14px 14px; display: flex; align-items: stretch; touch-action: pan-y; }
.chart-body > * { width: 100%; min-height: 155px; touch-action: pan-y; }
@media (max-width: 1024px) { .chart-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); } }
@media (max-width: 768px) { .add-card i { font-size: 20px; } }
@media (max-width: 640px) { .chart-grid { grid-template-columns: 1fr; } .add-card i { font-size: 18px; } }
@media (max-width: 420px) { .add-card { border-radius: var(--rm); } .add-card i { font-size: 16px; } .add-card span { font-size: 12px; } }

.fullscreen-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.fullscreen-card { background: var(--bg); border-radius: 12px; width: 100%; max-width: 1200px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.fullscreen-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.fullscreen-header h3 { font-size: 16px; font-weight: 600; }
.fullscreen-close { width: 32px; height: 32px; border: none; background: var(--bg-sec); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--text-sec); }
.fullscreen-close:hover { background: var(--bg-ter); color: var(--text); }
.fullscreen-body { flex: 1; padding: 20px; min-height: 400px; }
.fullscreen-body svg { width: 100%; height: 100%; }
</style>
