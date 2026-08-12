<template>
  <div class="rca-evidence-panel">
    <div class="rca-head">
      <span class="rca-title"><i class="fa-solid fa-microscope"></i> 根因定位证据链</span>
      <span v-if="rca" class="rca-meta">
        <span class="rca-conf">置信度: <b>{{ confidenceLabel }}</b></span>
        <span class="rca-sep">|</span>
        <span>检测方式: AI 异常检测</span>
        <span class="rca-sep">|</span>
        <span>自动确认: 8 分钟</span>
      </span>
    </div>

    <template v-if="rca">
      <div class="rca-cause-banner">
        <span class="rca-cause-label">根因</span>
        <span class="rca-cause-text">{{ rca.rootCause }}</span>
      </div>

      <div class="rca-evidence-list">
        <div
          v-for="(e, i) in rca.evidence"
          :key="i"
          class="rca-evidence-card"
          :class="{ 'lv-critical': e.level === 'critical', 'lv-warning': e.level === 'warning' }"
        >
          <div class="rca-ev-top">
            <span class="rca-ev-level"><i :class="e.level === 'critical' ? 'fa-solid fa-circle' : 'fa-solid fa-circle-dot'"></i></span>
            <div class="rca-ev-main">
              <span class="rca-ev-key">{{ e.key }}</span>
              <span class="rca-ev-change">{{ changeText(e) }}</span>
            </div>
          </div>
          <div class="rca-ev-node">{{ e.nodeLabel }} · {{ e.time }}</div>
          <button class="rca-ev-detail-btn" @click="openDetail(e, i)"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看详情</button>
        </div>
      </div>
    </template>
    <div v-else class="rca-empty">暂无根因分析数据</div>

    <a-modal
      :open="modalOpen"
      :title="modalTitle"
      :footer="null"
      width="640px"
      centered
      @cancel="modalOpen = false"
    >
      <template v-if="currentEvidence">
        <div class="modal-overview">
          <span class="modal-ov-label">指标</span>
          <span class="modal-ov-value">{{ currentEvidence.key }}</span>
          <span class="modal-ov-label">当前</span>
          <span class="modal-ov-value">{{ currentEvidence.value }}{{ currentEvidence.unit }}</span>
          <span class="modal-ov-label">基线</span>
          <span class="modal-ov-value">{{ currentEvidence.baseline }}{{ currentEvidence.unit }}</span>
          <span class="modal-ov-label">节点</span>
          <span class="modal-ov-value">{{ currentEvidence.nodeLabel }}</span>
        </div>

        <div class="modal-section">
          <div class="modal-section-title"><i class="fa-solid fa-chart-line"></i> AI 检测评分</div>
          <div class="modal-metric-grid">
            <div class="modal-metric-item"><span class="mm-label">Z-Score</span><span class="mm-value">{{ currentEvidence.aiScore?.zScore ?? '-' }}</span></div>
            <div class="modal-metric-item"><span class="mm-label">EWMA 斜率</span><span class="mm-value">{{ currentEvidence.aiScore?.ewmaSlope ?? '-' }}</span></div>
            <div class="modal-metric-item"><span class="mm-label">偏离度</span><span class="mm-value">{{ currentEvidence.aiScore?.deviation ?? '-' }}%</span></div>
            <div class="modal-metric-item"><span class="mm-label">历史相似度</span><span class="mm-value">{{ currentEvidence.aiScore?.historicalSimilarity ? Math.round(currentEvidence.aiScore.historicalSimilarity * 100) + '%' : '-' }}</span></div>
            <div class="modal-metric-item"><span class="mm-label">置信度</span><span class="mm-value">{{ currentEvidence.aiScore?.confidence ?? '-' }}</span></div>
            <div class="modal-metric-item"><span class="mm-label">持续时间</span><span class="mm-value">{{ currentEvidence.aiScore?.duration ?? '-' }}</span></div>
          </div>
        </div>

        <div class="modal-section">
          <div class="modal-section-title"><i class="fa-solid fa-scroll"></i> 关联日志</div>
          <div v-if="currentLogs.length" class="modal-log-list">
            <div v-for="(log, li) in currentLogs" :key="li" class="modal-log-line">
              <span class="modal-log-time">{{ log.time }}</span>
              <span class="modal-log-level" :class="'lv-' + log.level">{{ log.level }}</span>
              <span class="modal-log-msg">{{ log.message }}</span>
            </div>
          </div>
          <div v-else class="modal-log-empty">暂无关联日志</div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  rca: { type: Object, default: null },
  logs: { type: Array, default: () => [] },
})

const modalOpen = ref(false)
const currentEvidence = ref(null)
const currentLogs = ref([])

const confidenceLabel = computed(() => {
  const c = props.rca?.evidence?.[0]?.aiScore?.confidence
  return c || '高'
})

const modalTitle = computed(() => {
  if (!currentEvidence.value) return ''
  return `${currentEvidence.value.key} 异常检测详情`
})

function openDetail(e, i) {
  currentEvidence.value = e
  currentLogs.value = props.logs.filter(l => l.nodeId === e.node)
  modalOpen.value = true
}

function changeText(e) {
  const { value, baseline, unit } = e
  if (value == null || baseline == null) return e.detail
  const ratio = ((value - baseline) / baseline) * 100
  const dir = ratio >= 0 ? '↑' : '↓'
  return `${value}${unit} (基线 ${baseline}${unit}) ${dir}${Math.abs(Math.round(ratio))}%`
}

watch(() => props.rca, () => {
  currentEvidence.value = null
  modalOpen.value = false
}, { immediate: true })
</script>

<style scoped>
.rca-evidence-panel {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.rca-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.rca-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}
.rca-title i { color: #722ED1; margin-right: 6px; }
.rca-meta { font-size: 11px; color: #8c8c8c; display: flex; align-items: center; gap: 6px; }
.rca-conf b { color: #722ED1; }
.rca-sep { color: #e5e5e5; }

.rca-cause-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9f0ff;
  border: 1px solid #efdbff;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 10px;
}
.rca-cause-label {
  font-size: 11px;
  font-weight: 600;
  color: #722ED1;
  background: #fff;
  border: 1px solid #d3adf7;
  border-radius: 3px;
  padding: 1px 6px;
  flex-shrink: 0;
}
.rca-cause-text { font-size: 13px; font-weight: 500; color: #1a1a1a; }

.rca-evidence-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.rca-evidence-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s;
  position: relative;
  border-top: 3px solid #FAAD14;
}
.rca-evidence-card.lv-critical { border-top-color: #F5222D; }
.rca-evidence-card.lv-warning { border-top-color: #FF7D00; }
.rca-evidence-card:hover { border-color: #722ED1; box-shadow: 0 1px 6px rgba(114,46,209,0.15); }

.rca-ev-top { display: flex; align-items: center; gap: 8px; }
.rca-ev-level { color: #F5222D; font-size: 10px; }
.rca-evidence-card.lv-warning .rca-ev-level { color: #FF7D00; }
.rca-ev-main { display: flex; flex-direction: column; min-width: 0; }
.rca-ev-key { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.rca-ev-change { font-size: 11px; color: #F5222D; font-weight: 500; }
.rca-evidence-card.lv-warning .rca-ev-change { color: #FF7D00; }
.rca-ev-node { font-size: 11px; color: #8c8c8c; }
.rca-ev-detail-btn {
  margin-top: auto;
  align-self: flex-start;
  font-size: 11px;
  color: #722ED1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.rca-ev-detail-btn i { font-size: 10px; margin-right: 3px; }
.rca-ev-detail-btn:hover { text-decoration: underline; }
.rca-empty { font-size: 12px; color: #8c8c8c; text-align: center; padding: 20px 0; }

/* Modal styles */
.modal-overview {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.modal-ov-label { font-size: 11px; color: #8c8c8c; }
.modal-ov-value { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-right: 8px; }

.modal-section { margin-bottom: 14px; }
.modal-section-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.modal-section-title i { color: #722ED1; margin-right: 4px; }

.modal-metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.modal-metric-item {
  display: flex;
  flex-direction: column;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px 10px;
}
.mm-label { font-size: 10px; color: #8c8c8c; }
.mm-value { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }

.modal-log-list { max-height: 200px; overflow-y: auto; }
.modal-log-line {
  display: flex;
  gap: 8px;
  font-size: 12px;
  padding: 5px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.modal-log-time { color: #8c8c8c; flex-shrink: 0; font-family: monospace; }
.modal-log-level { font-weight: 700; flex-shrink: 0; }
.modal-log-level.lv-error { color: #F5222D; }
.modal-log-level.lv-warn { color: #FAAD14; }
.modal-log-level.lv-info { color: #1890ff; }
.modal-log-msg { color: #333; }
.modal-log-empty { font-size: 12px; color: #8c8c8c; }
</style>