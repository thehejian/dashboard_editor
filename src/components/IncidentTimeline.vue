<template>
  <div class="incident-timeline" v-if="stages.length">
    <div class="tl-controls">
      <span class="tl-progress" v-if="currentStage">第{{ currentIdx + 1 }}/{{ stages.length }}阶段</span>
      <span class="tl-title">{{ title }}</span>
    </div>
    <div class="tl-track" ref="trackRef">
      <div class="tl-stage" v-for="(stage, i) in stages" :key="stage.id" :class="[stageCss(i)]" @click="selectStage(i)">
        <div class="tl-dot-wrap">
          <span class="tl-dot"></span>
        </div>
        <span class="tl-label">{{ stage.label }}</span>
        <span class="tl-time">{{ stage.time }}</span>
        <span class="tl-badge">{{ stageBadge(i) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  stages: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  current: { type: String, default: '' },
})

const emit = defineEmits(['stage-change'])

const currentIdx = ref(0)
const currentStage = computed(() => props.stages[currentIdx.value] || null)

function stageCss(i) {
  const s = props.stages[i]
  if (s.status) {
    if (s.status === 'completed') return 'tl-completed'
    if (s.status === 'active') return 'tl-active'
    return 'tl-pending'
  }
  return 'tl-' + s.type
}

function stageBadge(i) {
  const s = props.stages[i]
  if (!s.status) return ''
  if (s.status === 'completed') return '✅ 已完成'
  if (s.status === 'active') return '● 进行中'
  return '○ 待执行'
}

function selectStage(i) {
  if (i < 0 || i >= props.stages.length) return
  currentIdx.value = i
  emit('stage-change', props.stages[i])
}
</script>

<style scoped>
.incident-timeline {
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.tl-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.tl-progress {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
}
.tl-title {
  font-size: 11px;
  color: #9CA3AF;
  margin-left: auto;
}
.tl-track {
  display: flex;
  align-items: flex-start;
  gap: 0;
  position: relative;
  padding: 4px 0;
}
.tl-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  flex: 1;
  position: relative;
  min-width: 0;
}
.tl-dot-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 2;
}
.tl-completed .tl-dot {
  background: #52C41A;
  border: 2px solid #52C41A;
}
.tl-active .tl-dot {
  background: #1890ff;
  border: 2px solid #1890ff;
  box-shadow: 0 0 0 4px rgba(24,144,255,0.2);
  animation: tl-pulse 1.5s infinite;
}
.tl-pending .tl-dot {
  background: #fff;
  border: 2px solid #d9d9d9;
}

.tl-cause .tl-dot { border-color: #F5222D; } .tl-cause.active .tl-dot { background: #F5222D; }
.tl-impact .tl-dot { border-color: #FF7D00; } .tl-impact.active .tl-dot { background: #FF7D00; }
.tl-business .tl-dot { border-color: #F5222D; } .tl-business.active .tl-dot { background: #F5222D; }
.tl-detection .tl-dot { border-color: #007DFF; } .tl-detection.active .tl-dot { background: #007DFF; }
.tl-diagnosis .tl-dot { border-color: #722ED1; } .tl-diagnosis.active .tl-dot { background: #722ED1; }
.tl-action .tl-dot { border-color: #FAAD14; } .tl-action.active .tl-dot { background: #FAAD14; }
.tl-recovery .tl-dot { border-color: #07C160; } .tl-recovery.active .tl-dot { background: #07C160; }

@keyframes tl-pulse {
  0% { box-shadow: 0 0 0 0 rgba(24,144,255,0.4); }
  70% { box-shadow: 0 0 0 6px rgba(24,144,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(24,144,255,0); }
}

.tl-label {
  font-size: 11px;
  font-weight: 500;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.tl-completed .tl-label { color: #389e0d; font-weight: 600; }
.tl-active .tl-label { color: #1890ff; font-weight: 600; }
.tl-time {
  font-size: 9px;
  color: #9CA3AF;
  font-family: monospace;
}
.tl-completed .tl-time { color: #389e0d; }
.tl-active .tl-time { color: #1890ff; font-weight: 600; }
.tl-badge {
  font-size: 9px;
  color: #9CA3AF;
  white-space: nowrap;
}
.tl-completed .tl-badge { color: #52C41A; }
.tl-active .tl-badge { color: #1890ff; font-weight: 600; }
</style>