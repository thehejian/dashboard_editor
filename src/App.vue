<template>
  <div class="app">
    <header class="header">
      <div class="header-left">
        <div class="header-logo"><img :src="logoUrl" alt="Logo" class="logo-img"><span class="badge">Dashboard</span></div>
        <div class="breadcrumb"><a href="#">仪表盘</a><i class="fa-solid fa-chevron-right" style="font-size:8px"></i><span>生产环境监控</span></div>
      </div>
      <div class="header-actions">
        <button class="header-btn" @click="toast('已退出编辑')">退出编辑</button>
        <a-dropdown :trigger="['click']">
          <button class="header-btn"><i class="fa-solid fa-bars"></i></button>
          <template #overlay>
            <a-menu>
              <a-menu-item v-for="(chart, idx) in state.charts" :key="idx" @click="scrollToChart(chart.id)">
                {{ chart.title }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <button class="header-btn" @click="toast('已复制分享链接')"><i class="fa-regular fa-share-from-square"></i></button>
        <button class="header-btn primary" @click="toast('仪表盘已保存')"><i class="fa-regular fa-floppy-disk"></i><span>保存</span></button>
        <div class="avatar">A</div>
      </div>
    </header>

    <div class="main">
      <main class="canvas">
        <div class="canvas-toolbar">
          <div class="canvas-title">
            <h1>生产环境 · 核心监控</h1>
          </div>
          <div class="canvas-controls">
            <div class="time-pills">
              <button class="time-pill">1h</button>
              <button class="time-pill active">6h</button>
              <button class="time-pill">24h</button>
              <button class="time-pill">7d</button>
            </div>
          </div>
        </div>
        <div class="canvas-scroll">
          <ChartGrid />
        </div>
        <button class="fab-add" @click="addChart()" title="添加图表">
          <i class="fa-solid fa-plus"></i>
        </button>
      </main>

      <div class="config-overlay" :class="{ visible: state.configOpen }" @click="closeConfig"></div>

      <ConfigPanel />
    </div>


    <div class="toast" :class="{ visible: state.toast }">{{ state.toast }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useEditorState } from './composables/useEditorState'
import ChartGrid from './components/ChartGrid.vue'
import ConfigPanel from './components/ConfigPanel.vue'

const logoUrl = new URL('../logo/huawei-logo.png', import.meta.url).href

const { state, toast, addChart, closeConfig } = useEditorState()

function scrollToChart(chartId) {
  const el = document.querySelector(`[data-chart-id="${chartId}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const isMobile = ref(window.innerWidth <= 768)
let resizeTimer = null

onMounted(() => {
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      isMobile.value = window.innerWidth <= 768
    }, 100)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {})
})

watch(() => state.configOpen, (open) => {
  // Mobile: don't block scroll, just let it work naturally
})
</script>

<style>
:root {
  --brand: #007DFF; --brand-hover: #0066D6; --brand-subtle: #EBF4FF;
  --bg: #FFFFFF; --bg-sec: #F2F2F7; --bg-ter: #E8E8ED;
  --text: #182431; --text-sec: #6B7280; --text-ter: #9CA3AF;
  --border: #E5E5EA; --border-hover: #D1D5DB;
  --danger: #F5222D; --warn: #FF7D00; --yellow: #FADB14; --info: #007DFF;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.08);
  --rs: 6px; --rm: 10px; --rl: 12px; --capsule: 20px;
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { font-family: var(--font); background: var(--bg-sec); color: var(--text); -webkit-font-smoothing: antialiased; font-size: 14px; }
#app { display: flex; flex-direction: column; height: 100vh; min-height: 0; padding-top: 48px; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.header { position: fixed; top: 0; left: 0; right: 0; height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--bg); border-bottom: 1px solid var(--border); flex-shrink: 0; z-index: 100; }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-logo { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--text); user-select: none; }
.header-logo .logo-img { height: 20px; width: auto; }
.header-logo .badge { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; background: var(--brand-subtle); color: var(--brand); padding: 2px 6px; border-radius: 4px; }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-ter); }
.breadcrumb a { color: var(--text-sec); text-decoration: none; }
.breadcrumb a:hover { color: var(--text); }
.breadcrumb span { color: var(--text); font-weight: 500; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.header-btn { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 16px; font-size: 12px; font-weight: 500; border-radius: var(--capsule); border: 1px solid var(--border); background: var(--bg); color: var(--text-sec); cursor: pointer; transition: all 0.15s; }
.header-btn:hover { border-color: var(--border-hover); color: var(--text); }
.header-btn.primary { background: var(--brand); border-color: var(--brand); color: #FFF; }
.header-btn.primary:hover { background: var(--brand-hover); }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--brand); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #FFF; cursor: pointer; margin-left: 4px; }

.main { display: flex; flex: 1; overflow: hidden; position: relative; min-height: 0; }

.canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; min-height: 0; background: radial-gradient(ellipse at 25% 20%, rgba(0,125,255,0.02) 0%, transparent 55%), var(--bg-sec); }
.canvas-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; flex-shrink: 0; }
.canvas-title { display: flex; align-items: center; gap: 10px; }
.canvas-title h1 { font-size: 20px; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
.canvas-title .edit-hint { font-size: 12px; color: var(--text-ter); cursor: pointer; opacity: 0; transition: opacity 0.2s; }
.canvas-title:hover .edit-hint { opacity: 1; }
.canvas-title .dots { font-size: 13px; color: var(--text-ter); padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.canvas-title .dots:hover { background: var(--bg-ter); }
.canvas-controls { display: flex; align-items: center; gap: 8px; }
.time-pills { display: flex; gap: 2px; background: var(--bg); border-radius: var(--capsule); padding: 2px; border: 1px solid var(--border); }
.time-pill { padding: 4px 14px; font-size: 12px; font-weight: 500; border-radius: 18px; border: none; background: transparent; color: var(--text-ter); cursor: pointer; transition: all 0.15s; }
.time-pill:hover { color: var(--text); }
.time-pill.active { background: var(--brand); color: #FFF; }
.canvas-scroll { flex: 1 1 0%; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0 32px 60px; display: flex; flex-direction: column; -webkit-overflow-scrolling: touch; touch-action: pan-y; }

.config-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); z-index: 40; opacity: 0; pointer-events: none; transition: opacity 0.25s var(--ease); }
.config-overlay.visible { opacity: 1; pointer-events: none; }

.chart-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); overflow: hidden; cursor: pointer; transition: all 0.2s var(--ease); position: relative; min-height: 200px; display: flex; flex-direction: column; box-shadow: var(--shadow-sm); touch-action: pan-y; }
.chart-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-md); }
.chart-card.selected { border-color: var(--brand); box-shadow: 0 0 0 2px var(--brand-subtle), var(--shadow-md); }
.chart-card-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 4px; flex-shrink: 0; }
.chart-card-header .drag-handle { color: var(--text-ter); font-size: 11px; cursor: grab; opacity: 0; transition: opacity 0.15s; margin-right: 6px; }
.chart-card:hover .drag-handle { opacity: 1; }
.chart-card-header .chart-label { display: flex; align-items: center; gap: 6px; overflow: hidden; min-width: 0; }
.chart-card-header .chart-label h3 { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chart-card-header .chart-label .link-icon { font-size: 10px; color: var(--brand); flex-shrink: 0; opacity: 0.7; }
.chart-card.selected .chart-card-actions { opacity: 1; }
.chart-card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
.chart-card:hover .chart-card-actions { opacity: 1; }
.chart-card-action { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: none; background: transparent; color: var(--text-ter); font-size: 12px; cursor: pointer; transition: all 0.12s; }
.chart-card-action:hover { background: var(--bg-sec); color: var(--text); }
.chart-card-action.danger:hover { background: #FEF2F2; color: var(--danger); }
.chart-body { flex: 1; padding: 2px 14px 14px; display: flex; align-items: stretch; }
.chart-body svg { width: 100%; height: 100%; min-height: 155px; }

.fab-add { display: flex; position: absolute; bottom: 24px; right: 24px; width: 52px; height: 52px; border-radius: 50%; background: var(--brand); color: #FFF; border: none; box-shadow: 0 4px 16px rgba(0,125,255,0.35); align-items: center; justify-content: center; cursor: pointer; z-index: 30; transition: transform 0.2s var(--ease), box-shadow 0.2s; }
.fab-add:active { transform: scale(0.92); }
.fab-add:hover { box-shadow: 0 6px 20px rgba(0,125,255,0.45); }

.toast { position: fixed; bottom: 48px; left: 50%; transform: translateX(-50%) translateY(16px); padding: 10px 24px; border-radius: var(--capsule); font-size: 13px; font-weight: 500; color: #FFF; background: #182431; z-index: 200; opacity: 0; pointer-events: none; transition: all 0.3s var(--ease); }
.toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.chart-card { animation: fadeUp 0.35s var(--ease) both; }
.chart-card:nth-child(1) { animation-delay: 0.03s; }
.chart-card:nth-child(2) { animation-delay: 0.07s; }
.chart-card:nth-child(3) { animation-delay: 0.11s; }
.chart-card:nth-child(4) { animation-delay: 0.15s; }
.chart-card:nth-child(5) { animation-delay: 0.19s; }
.chart-card:nth-child(6) { animation-delay: 0.23s; }

@media (max-width: 1024px) { .canvas-toolbar { padding: 16px 20px; } .canvas-scroll { padding: 0 20px 12px; } }
@media (max-width: 768px) { .breadcrumb { display: none; } .header { padding: 0 12px; } .header-btn { padding: 0 10px; } .header-btn span { display: none; } .canvas-title h1 { font-size: 16px; } .canvas-toolbar { padding: 12px 16px; } .canvas { height: calc(100dvh - 48px); } .canvas-scroll { flex: 1; min-height: 0; padding: 0 16px 80px; overflow-y: auto; -webkit-overflow-scrolling: touch; } .time-pills { overflow-x: auto; -webkit-overflow-scrolling: touch; } .time-pill { white-space: nowrap; } .chart-card { min-height: 180px; } .chart-card-options { opacity: 1; } .chart-card-header .drag-handle { display: none; } }
@media (max-width: 640px) { .canvas-toolbar { flex-direction: column; align-items: flex-start; gap: 6px; } .header { height: 44px; } .canvas { height: calc(100dvh - 44px); } .canvas-scroll { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; } .header-logo { font-size: 14px; } .avatar { width: 26px; height: 26px; font-size: 10px; } .canvas-title h1 { font-size: 15px; } .chart-card { min-height: 160px; } .chart-card-header { padding: 8px 10px 2px; } .chart-card-header .chart-label h3 { font-size: 11px; } .chart-card-action { width: 32px; height: 32px; } .toast { font-size: 12px; padding: 8px 18px; bottom: 40px; } .fab-add { bottom: 24px; right: 20px; width: 48px; height: 48px; font-size: 18px; } }
@media (max-width: 420px) { .canvas-toolbar { padding: 10px 12px; } .canvas { height: calc(100dvh - 40px); } .canvas-scroll { flex: 1; min-height: 0; padding: 0 12px 70px; overflow-y: auto; -webkit-overflow-scrolling: touch; } .chart-card { min-height: 140px; border-radius: var(--rm); } .chart-body svg { min-height: 120px; } .header { height: 40px; padding: 0 8px; } .header-logo { font-size: 13px; } .header-logo span.badge { display: none; } .header-btn { height: 28px; padding: 0 8px; font-size: 11px; } .avatar { width: 24px; height: 24px; font-size: 9px; } .canvas-controls { width: 100%; } .time-pills { width: 100%; } .time-pill { flex: 1; text-align: center; } .chart-card-action { width: 30px; height: 30px; } .fab-add { bottom: 16px; right: 16px; width: 44px; height: 44px; font-size: 16px; } }
</style>
