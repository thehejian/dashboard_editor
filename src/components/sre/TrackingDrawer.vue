<template>
  <a-drawer
    :open="visible"
    title="工单跟踪"
    :width="width"
    @close="$emit('close')"
    :bodyStyle="{ padding: '0', background: '#f5f5f5' }"
    :headerStyle="{ borderBottom: '1px solid #e8e8e8' }"
  >
    <template #extra>
      <span class="td-assignee" v-if="tracking.assignee">
        <i class="fa-solid fa-user" style="margin-right:4px"></i>
        {{ tracking.assignee }}
      </span>
      <span class="td-sla-badge" :class="'sla-' + (tracking.sla_status || 'normal')" v-if="tracking.sla_deadline">
        SLA: {{ formatSlaDeadline(tracking.sla_deadline) }}
        <span class="td-sla-status">{{ slaLabel }}</span>
      </span>
    </template>
    <div class="td-body" v-if="!loading">
      <!-- Checklist -->
      <div class="td-section">
        <div class="td-section-title"><i class="fa-solid fa-list-check"></i> 处理步骤</div>
        <div class="td-checklist">
          <div v-for="item in tracking.checklist" :key="item.step" class="td-step" :class="'step-' + item.status">
            <span class="td-step-icon">
              <i v-if="item.status === 'done'" class="fa-solid fa-circle-check"></i>
              <i v-else-if="item.status === 'running'" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-regular fa-circle"></i>
            </span>
            <span class="td-step-content">
              <span class="td-step-title">{{ item.title }}</span>
              <span class="td-step-meta">{{ item.handler }} · {{ item.started_at || '—' }}{{ item.finished_at ? ' → ' + item.finished_at : '' }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="td-section">
        <div class="td-section-title"><i class="fa-solid fa-timeline"></i> 操作时间线</div>
        <div class="td-timeline">
          <div v-for="(item, idx) in tracking.tracking_timeline" :key="idx" class="td-tl-item">
            <div class="td-tl-dot" :class="'tl-' + (idx === 0 ? 'start' : idx === tracking.tracking_timeline.length - 1 ? 'end' : 'mid')"></div>
            <div class="td-tl-content">
              <div class="td-tl-header">
                <span class="td-tl-phase">{{ item.phase }}</span>
                <span class="td-tl-time">{{ item.time }}</span>
              </div>
              <div class="td-tl-actor">{{ item.actor }}</div>
              <div class="td-tl-action">{{ item.action }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="td-section">
        <div class="td-section-title"><i class="fa-solid fa-comments"></i> 沟通记录</div>
        <div class="td-comments">
          <div v-for="(c, idx) in tracking.tracking_comments" :key="idx" class="td-comment">
            <div class="td-comment-header">
              <span class="td-comment-actor">{{ c.actor }}</span>
              <span class="td-comment-time">{{ c.time }}</span>
            </div>
            <div class="td-comment-content">{{ c.content }}</div>
          </div>
          <a-empty v-if="!tracking.tracking_comments?.length" description="暂无沟通记录" :image-style="{ height: '30px' }" />
        </div>
      </div>
    </div>
    <div v-else class="td-loading">
      <a-spin />
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  incidentId: String,
})

defineEmits(['close'])

const loading = ref(false)
const tracking = ref({
  assignee: null,
  sla_deadline: null,
  sla_status: 'normal',
  checklist: [],
  tracking_timeline: [],
  tracking_comments: [],
})

const width = computed(() => Math.round(window.innerWidth * 0.8))
const slaLabel = computed(() => {
  const map = { normal: '正常', warning: '即将到期', overdue: '已超时' }
  return map[tracking.value.sla_status] || tracking.value.sla_status
})

function formatSlaDeadline(deadline) {
  if (!deadline) return ''
  return deadline.slice(11, 16)
}

watch(() => props.visible, (v) => {
  if (v && props.incidentId) fetchTracking()
})

async function fetchTracking() {
  loading.value = true
  try {
    const res = await fetch(`/api/sre/incidents/${props.incidentId}/tracking`)
    const data = await res.json()
    if (data.success) tracking.value = data.data
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.td-body { padding: 16px 24px; overflow-y: auto; height: 100%; }
.td-section { margin-bottom: 20px; }
.td-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.td-section-title i { color: #722ED1; }

/* Assignee & SLA */
.td-assignee { font-size: 12px; color: #666; margin-right: 12px; background: #f5f5f5; padding: 2px 8px; border-radius: 4px; }
.td-sla-badge { font-size: 12px; color: #fff; padding: 2px 10px; border-radius: 4px; margin-left: 8px; }
.sla-normal { background: #52c41a; }
.sla-warning { background: #faad14; }
.sla-overdue { background: #ff4d4f; }
.td-sla-status { margin-left: 4px; font-weight: 600; }

/* Checklist */
.td-checklist { display: flex; flex-direction: column; gap: 0; }
.td-step { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-left: 2px solid #e8e8e8; margin-left: 8px; position: relative; }
.td-step::before { content: ''; position: absolute; left: -5px; top: 14px; width: 8px; height: 8px; border-radius: 50%; border: 2px solid #e8e8e8; background: #fff; }
.td-step.step-done::before { background: #52c41a; border-color: #52c41a; }
.td-step.step-running::before { background: #1890ff; border-color: #1890ff; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); } 50% { box-shadow: 0 0 0 6px rgba(24,144,255,0); } }
.td-step.step-pending { opacity: 0.5; }
.td-step-icon { font-size: 14px; color: #52c41a; margin-top: 2px; flex-shrink: 0; }
.td-step.step-running .td-step-icon { color: #1890ff; }
.td-step.step-pending .td-step-icon { color: #d9d9d9; }
.td-step-content { flex: 1; min-width: 0; }
.td-step-title { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.td-step-meta { font-size: 11px; color: #999; margin-top: 2px; display: block; }

/* Timeline */
.td-timeline { display: flex; flex-direction: column; gap: 0; }
.td-tl-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
.td-tl-item::before { content: ''; position: absolute; left: 5px; top: 16px; bottom: 0; width: 2px; background: #e8e8e8; }
.td-tl-item:last-child::before { display: none; }
.td-tl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; position: relative; z-index: 1; }
.tl-start { background: #722ED1; }
.tl-mid { background: #1890ff; }
.tl-end { background: #faad14; }
.td-tl-content { flex: 1; min-width: 0; }
.td-tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.td-tl-phase { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.td-tl-time { font-size: 11px; color: #999; }
.td-tl-actor { font-size: 11px; color: #722ED1; font-weight: 500; }
.td-tl-action { font-size: 12px; color: #666; margin-top: 2px; }

/* Comments */
.td-comments { display: flex; flex-direction: column; gap: 12px; }
.td-comment { background: #fff; border-radius: 6px; padding: 10px 14px; border: 1px solid #f0f0f0; }
.td-comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.td-comment-actor { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.td-comment-time { font-size: 11px; color: #999; }
.td-comment-content { font-size: 13px; color: #333; line-height: 1.6; }

.td-loading { display: flex; justify-content: center; align-items: center; height: 200px; }
</style>
