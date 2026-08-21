<template>
  <div class="alarm-analysis-view">
    <!-- Header -->
    <div class="aa-header">
      <div class="aa-header-left">
        <button class="aa-back-btn" @click="goBack"><i class="fa-solid fa-arrow-left"></i></button>
        <div class="aa-header-info">
          <h1 class="aa-title">智能告警分析</h1>
          <div class="aa-subtitle">
            <span class="aa-incident-no">{{ incident?.incident_no }}</span>
            <a-tag :color="levelColor">{{ levelText }}</a-tag>
            <a-tag color="purple" v-if="incident?.handler === 'ai'"><i class="fa-solid fa-robot"></i> AI自动聚合</a-tag>
            <a-tag :color="statusTagColor">{{ statusText }}</a-tag>
          </div>
        </div>
      </div>
      <div class="aa-header-right">
        <a-button @click="continueInAI"><i class="fa-solid fa-comment-dots"></i> 在AI助手继续分析</a-button>
        <a-button type="primary" @click="triggerHeal" v-if="canHeal"><i class="fa-solid fa-bolt"></i> 一键自愈</a-button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="aa-tabs">
      <button :class="['aa-tab', { active: activeTab === 'analysis' }]" @click="activeTab = 'analysis'">
        <i class="fa-solid fa-magnifying-glass-chart"></i> 故障分析
      </button>
      <button :class="['aa-tab', { active: activeTab === 'postmortem' }]" @click="activeTab = 'postmortem'">
        <i class="fa-solid fa-file-lines"></i> 复盘沉淀
      </button>
    </div>

    <!-- Content -->
    <div v-if="loading" class="aa-loading"><a-spin tip="加载分析数据..." /></div>
    <template v-else-if="incident">
      <!-- Analysis Tab -->
      <div v-if="activeTab === 'analysis'" class="aa-layout">
        <!-- Left 70% -->
        <div class="aa-main-left">
          <!-- Row 1: RCA + Timeline -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-left">
              <div class="aa-section">
                <div class="aa-section-title"><i class="fa-solid fa-magnifying-glass"></i> 根因分析 (RCA)</div>
                <div class="aa-confidence">
                  <span>AI 置信度</span>
                  <div class="aa-conf-bar"><div class="aa-conf-fill" :style="{ width: incident.ai_confidence + '%' }"></div></div>
                  <span>{{ incident.ai_confidence }}%</span>
                </div>
                <div class="aa-root-cause">{{ incident.root_cause }}</div>
                <div class="aa-evidence">
                  <div class="aa-evidence-title">证据链</div>
                  <div v-for="(ev, i) in (incident.evidence || [])" :key="i" class="aa-evidence-item">
                    <i class="fa-solid fa-database" style="color:#722ED1"></i>
                    <span class="aa-ev-time">{{ ev.time }}</span>
                    <span class="aa-ev-type" :class="'aa-ev-' + ev.type">{{ ev.detail }}</span>
                  </div>
                  <div v-if="!incident.evidence?.length" class="aa-empty-text">暂无详细证据链</div>
                </div>
              </div>
            </div>
            <div class="aa-cell aa-cell-right">
              <div class="aa-section">
                <div class="aa-section-title"><i class="fa-solid fa-clock-rotate-left"></i> 告警时间线</div>
                <div class="aa-timeline">
                  <div v-for="(ev, i) in (incident.evidence || [])" :key="i" class="aa-timeline-item">
                    <div class="aa-tl-dot" :class="'aa-tl-' + ev.type"></div>
                    <div class="aa-tl-content">
                      <div class="aa-tl-time">{{ ev.time }}</div>
                      <div class="aa-tl-event">{{ ev.detail }}</div>
                    </div>
                  </div>
                  <div v-if="!incident.evidence?.length" class="aa-empty-text">暂无时间线数据</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Related Alerts -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-full">
              <div class="aa-section">
                <div class="aa-section-title">
                  <i class="fa-solid fa-bell"></i> 原始告警明细
                  <span class="aa-alert-count">({{ relatedAlerts.length }} 条关联)</span>
                </div>
                <a-table
                  :data-source="relatedAlerts"
                  :columns="alertDetailColumns"
                  :pagination="false"
                  size="small"
                  row-key="id"
                  class="aa-alert-table"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'level'">
                      <a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'" size="small">
                        {{ { critical: '紧急', warning: '重要', info: '提示' }[record.level] }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'status'">
                      <a-tag :color="record.status === 'firing' ? 'red' : record.status === 'resolved' ? 'green' : 'default'" size="small">
                        {{ { firing: '告警中', resolved: '已恢复', suppressed: '已屏蔽' }[record.status] }}
                      </a-tag>
                    </template>
                  </template>
                </a-table>
              </div>
            </div>
          </div>

          <!-- Row 3: AI Conclusion -->
          <div class="aa-row">
            <div class="aa-cell aa-cell-full">
              <div class="aa-section aa-conclusion">
                <div class="aa-section-title"><i class="fa-solid fa-robot"></i> AI 分析结论</div>
                <div class="aa-conclusion-text">
                  本 Incident 由 {{ relatedAlerts.length }} 条原始告警聚合而成，根因为{{ incident.root_cause }}。
                  <template v-if="incident.suggestions?.length">
                    建议处置步骤：
                    <ol class="aa-suggest-list">
                      <li v-for="(s, i) in incident.suggestions" :key="i">{{ s }}</li>
                    </ol>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 28% -->
        <div class="aa-main-right">
          <!-- AI Recommendations -->
          <div class="aa-section aa-rec-section">
            <div class="aa-section-title"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 处置建议</div>
            <div class="aa-rec-steps">
              <div v-for="(s, i) in (incident.suggestions || [])" :key="i" class="aa-rec-step">
                <span class="aa-step-num">{{ i + 1 }}</span>
                <span class="aa-step-text">{{ s }}</span>
              </div>
            </div>
            <div class="aa-rec-actions">
              <a-button size="small" type="primary" block @click="triggerHeal" v-if="canHeal">
                <i class="fa-solid fa-bolt"></i> 一键自愈
              </a-button>
              <a-button size="small" block @click="continueInAI">
                <i class="fa-solid fa-comment-dots"></i> 在AI助手中继续分析
              </a-button>
            </div>
          </div>

          <!-- Category Breakdown -->
          <div class="aa-section">
            <div class="aa-section-title"><i class="fa-solid fa-chart-pie"></i> 关联指标</div>
            <div class="aa-cat-breakdown">
              <div v-for="c in categoryBreakdown" :key="c.category" class="aa-cat-item">
                <span class="aa-cat-name">{{ c.category }}</span>
                <div class="aa-cat-track"><div class="aa-cat-fill" :style="{ width: (c.count / relatedAlerts.length * 100) + '%', background: catColor(c.category) }"></div></div>
                <span class="aa-cat-count">{{ c.count }}</span>
              </div>
              <div v-if="!categoryBreakdown.length" class="aa-empty-text" style="padding:8px">—</div>
            </div>
          </div>

          <!-- Jump Links -->
          <div class="aa-section">
            <div class="aa-section-title"><i class="fa-solid fa-link"></i> 跳转链接</div>
            <div class="aa-jump-links">
              <a class="aa-jump-link" @click="jumpTo('/monitor/dashboard')"><i class="fa-solid fa-chart-line"></i> 关联仪表盘</a>
              <a class="aa-jump-link" @click="jumpTo('/ops/logs/runtime/query')"><i class="fa-solid fa-file-lines"></i> 相关日志</a>
              <a class="aa-jump-link" @click="jumpTo('/monitor/resource')"><i class="fa-solid fa-server"></i> 主机详情</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Postmortem Tab -->
      <div v-if="activeTab === 'postmortem'" class="aa-postmortem">
        <a-empty description="暂无复盘报告" style="margin:60px 0" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Chart } from '@antv/g2'

const route = useRoute()
const router = useRouter()
const incidentId = route.params.id

const loading = ref(true)
const incident = ref(null)
const relatedAlerts = ref([])
const categoryBreakdown = ref([])
const activeTab = ref('analysis')

const alertDetailColumns = [
  { title: '#', dataIndex: 'id', key: 'id', width: 40 },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 160 },
  { title: '级别', key: 'level', width: 70 },
  { title: '当前值', dataIndex: 'current_value', key: 'current_value', width: 100 },
  { title: '状态', key: 'status', width: 80 },
  { title: '触发时间', dataIndex: 'trigger_time', key: 'trigger_time', width: 160 },
]

const levelColor = computed(() => {
  const l = incident.value?.level
  return l === 'critical' ? 'red' : l === 'warning' ? 'orange' : 'blue'
})
const levelText = computed(() => {
  const l = incident.value?.level
  return { critical: 'P1 紧急', warning: 'P2 重要', info: 'P3 提示' }[l] || l
})
const statusText = computed(() => {
  const s = incident.value?.status
  return { investigating: '进行中', resolved: '已闭环', suppressed: '已屏蔽' }[s] || s
})
const statusTagColor = computed(() => {
  const s = incident.value?.status
  return { investigating: 'processing', resolved: 'green', suppressed: 'default' }[s] || 'default'
})
const canHeal = computed(() => incident.value?.category === '容量类')

function goBack() { router.push('/overview') }

function jumpTo(path) { router.push(path) }

function continueInAI() {
  const text = `请分析这条告警：\n- 事件: ${incident.value?.incident_no}\n- 根因: ${incident.value?.root_cause}\n- 级别: ${levelText.value}\n- 关联告警: ${relatedAlerts.value.length} 条\n- 涉及资源: ${relatedAlerts.value.map(a => a.resource).join(', ')}`
  if (window.__openAIAssistant) window.__openAIAssistant(text)
}

function triggerHeal() {
  if (!confirm('确认执行自愈操作？\n将自动清理临时文件并扩容云盘 20%。')) return
  // Mock: mark as resolved after delay
  setTimeout(() => {
    message.success('自愈成功！磁盘使用率已降至 68%')
  }, 1500)
}

function catColor(cat) {
  const map = { '容量类': '#007DFF', '阈值类': '#FA8C16', '证书类': '#722ED1', '网络类': '#13C2C2', '服务类': '#F5222D', '硬件类': '#EB2F96', '合规类': '#8C8C8C' }
  return map[cat] || '#BFBFBF'
}

onMounted(async () => {
  try {
    const res = await fetch('/api/alarm/incidents/' + incidentId)
    const json = await res.json()
    if (json.success) {
      incident.value = json.data.incident
      relatedAlerts.value = json.data.relatedAlerts
      categoryBreakdown.value = json.data.categoryBreakdown
    }
  } catch (e) {
    console.error('加载Incident失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.alarm-analysis-view { display: flex; flex-direction: column; height: calc(100vh - 48px); overflow: hidden; background: var(--bg, #F5F7FA); }
.aa-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #fff; border-bottom: 1px solid var(--border, #E8E8E8); flex-shrink: 0; }
.aa-header-left { display: flex; align-items: center; gap: 12px; }
.aa-back-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #595959; }
.aa-back-btn:hover { border-color: var(--brand, #007DFF); color: var(--brand, #007DFF); }
.aa-header-info { display: flex; flex-direction: column; gap: 4px; }
.aa-title { font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0; }
.aa-subtitle { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #595959; flex-wrap: wrap; }
.aa-incident-no { font-weight: 600; color: #1A1A1A; font-family: monospace; }
.aa-header-right { display: flex; gap: 8px; }
.aa-tabs { display: flex; gap: 0; padding: 0 24px; background: #fff; border-bottom: 1px solid var(--border, #E8E8E8); flex-shrink: 0; }
.aa-tab { padding: 10px 20px; border: none; background: transparent; font-size: 14px; color: #595959; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: flex; align-items: center; gap: 6px; }
.aa-tab.active { color: var(--brand, #007DFF); border-bottom-color: var(--brand, #007DFF); }
.aa-tab:hover { color: var(--brand, #007DFF); }
.aa-body { flex: 1; overflow: auto; padding: 16px 24px; }
.aa-layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
.aa-main-left { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.aa-main-right { display: flex; flex-direction: column; gap: 12px; }
.aa-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.aa-cell-full { grid-column: 1 / -1; }
.aa-cell-left {}
.aa-cell-right {}
.aa-section { background: #fff; border: 1px solid var(--border, #E8E8E8); border-radius: 10px; padding: 14px; }
.aa-section-title { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.aa-section-title .aa-alert-count { font-size: 11px; color: #8C8C8C; font-weight: 400; }
.aa-confidence { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; color: #595959; }
.aa-conf-bar { flex: 1; height: 6px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
.aa-conf-fill { height: 100%; background: linear-gradient(90deg, #722ED1, #007DFF); border-radius: 3px; }
.aa-root-cause { font-size: 13px; color: #1A1A1A; line-height: 1.6; background: #F9F9F9; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
.aa-evidence {}
.aa-evidence-title { font-size: 11px; color: #8C8C8C; margin-bottom: 6px; }
.aa-evidence-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; margin-bottom: 4px; }
.aa-ev-time { color: #8C8C8C; flex-shrink: 0; width: 80px; }
.aa-ev-type { color: #595959; }
.aa-timeline { display: flex; flex-direction: column; gap: 0; }
.aa-timeline-item { display: flex; gap: 10px; padding-bottom: 12px; position: relative; }
.aa-tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.aa-tl-alert { background: #F5222D; }
.aa-tl-ai { background: #722ED1; }
.aa-tl-action { background: #007DFF; }
.aa-tl-recovery { background: #52C41A; }
.aa-tl-content { flex: 1; }
.aa-tl-time { font-size: 11px; color: #8C8C8C; }
.aa-tl-event { font-size: 12px; color: #595959; }
.aa-alert-table { font-size: 12px; }
.aa-alert-table :deep(.ant-table) { font-size: 12px; }
.aa-alert-table :deep(.ant-table-thead > tr > th) { background: #FAFAFA; font-size: 12px; padding: 8px 10px; }
.aa-alert-table :deep(.ant-table-tbody > tr > td) { padding: 6px 10px; font-size: 12px; }
.aa-conclusion {}
.aa-conclusion-text { font-size: 13px; color: #595959; line-height: 1.8; }
.aa-suggest-list { margin: 6px 0 0 18px; padding: 0; font-size: 12px; color: #595959; }
.aa-suggest-list li { margin-bottom: 4px; }
/* Right panel */
.aa-rec-section {}
.aa-rec-steps { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.aa-rec-step { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: #595959; }
.aa-step-num { width: 18px; height: 18px; border-radius: 50%; background: #722ED1; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
.aa-step-text { flex: 1; padding-top: 2px; }
.aa-rec-actions { display: flex; flex-direction: column; gap: 6px; }
.aa-cat-breakdown { display: flex; flex-direction: column; gap: 6px; }
.aa-cat-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.aa-cat-name { width: 50px; color: #595959; flex-shrink: 0; }
.aa-cat-track { flex: 1; height: 8px; background: #F0F0F0; border-radius: 4px; overflow: hidden; }
.aa-cat-fill { height: 100%; border-radius: 4px; }
.aa-cat-count { width: 24px; text-align: right; color: #8C8C8C; flex-shrink: 0; }
.aa-jump-links { display: flex; flex-direction: column; gap: 6px; }
.aa-jump-link { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--brand, #007DFF); padding: 6px 10px; border: 1px solid #BAE7FF; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.aa-jump-link:hover { background: #E6F7FF; }
.aa-loading { display: flex; align-items: center; justify-content: center; height: 200px; }
.aa-empty-text { font-size: 12px; color: #8C8C8C; text-align: center; padding: 16px; }
.aa-postmortem { display: flex; align-items: center; justify-content: center; height: 300px; }
@media (max-width: 1200px) { .aa-layout { grid-template-columns: 1fr; } .aa-row { grid-template-columns: 1fr; } }
</style>
