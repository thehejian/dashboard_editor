<template>
  <div class="incident-timeline" v-if="stages.length">
    <div class="tl-controls">
      <button class="tl-play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
        <i class="fa-solid" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
      </button>
      <span class="tl-time-label">{{ currentStage?.time || '' }}</span>
      <span class="tl-progress">第{{ currentIdx + 1 }}/{{ stages.length }}阶段</span>
      <span class="tl-title">{{ title }}</span>
    </div>
    <div class="tl-track" ref="trackRef">
      <div class="tl-slider" :style="{ left: sliderPos + '%' }" v-if="stages.length > 1"></div>
      <div v-for="(stage, i) in stages" :key="stage.id" class="tl-stage" :class="['tl-' + stage.type, { active: currentIdx === i }]" @click="selectStage(i)" @mouseenter="hoveredIdx = i" @mouseleave="hoveredIdx = -1">
        <div class="tl-dot-wrap">
          <span class="tl-dot"></span>
          <div class="tl-tooltip" v-if="hoveredIdx === i">
            <div class="tt-type" :class="'tt-' + stage.severity">{{ stage.label }}</div>
            <div class="tt-time">{{ stage.time }}</div>
            <div class="tt-desc">{{ stage.desc.length > 30 ? stage.desc.slice(0, 30) + '...' : stage.desc }}</div>
          </div>
        </div>
        <span class="tl-label">{{ stage.label }}</span>
        <span class="tl-time">{{ stage.time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  stages: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  current: { type: String, default: '' },
})

const emit = defineEmits(['stage-change'])

const isPlaying = ref(false)
const hoveredIdx = ref(-1)
const currentIdx = ref(0)
let playTimer = null

const currentStage = computed(() => props.stages[currentIdx.value] || null)
const sliderPos = computed(() => props.stages.length > 1 ? (currentIdx.value / (props.stages.length - 1)) * 100 : 0)

function selectStage(i) {
  if (i < 0 || i >= props.stages.length) return
  currentIdx.value = i
  emit('stage-change', props.stages[i])
}

function togglePlay() {
  if (isPlaying.value) {
    isPlaying.value = false
    clearInterval(playTimer)
  } else {
    if (currentIdx.value >= props.stages.length - 1) currentIdx.value = 0
    isPlaying.value = true
    playTimer = setInterval(() => {
      if (currentIdx.value >= props.stages.length - 1) {
        isPlaying.value = false
        clearInterval(playTimer)
        return
      }
      selectStage(currentIdx.value + 1)
    }, 2000)
  }
}

watch(() => props.current, (val) => {
  if (val) {
    const idx = props.stages.findIndex(s => s.id === val)
    if (idx >= 0) currentIdx.value = idx
  }
})

onBeforeUnmount(() => {
  if (playTimer) clearInterval(playTimer)
})
</script>

<style scoped>
.incident-timeline { background: #fff; border-radius: 8px; padding: 10px 16px 8px; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); flex-shrink: 0; }
.tl-controls { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.tl-play-btn { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--brand, #007DFF); background: #fff; color: var(--brand, #007DFF); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.tl-play-btn:hover { background: var(--brand, #007DFF); color: #fff; }
.tl-time-label { font-size: 12px; font-weight: 600; font-family: monospace; color: var(--intelligent, #722ED1); min-width: 60px; }
.tl-progress { font-size: 11px; color: var(--text-sec, #6B7280); }
.tl-title { font-size: 11px; color: var(--text-ter, #9CA3AF); margin-left: auto; }
.tl-track { display: flex; align-items: flex-start; gap: 0; position: relative; padding: 4px 0; }
.tl-slider { position: absolute; top: 10px; height: 2px; background: var(--intelligent, #722ED1); transition: left 0.4s; z-index: 1; width: 0; }
.tl-stage { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; flex: 1; position: relative; min-width: 0; }
.tl-dot-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #d9d9d9; background: #fff; transition: all 0.2s; z-index: 2; }
.tl-stage.active .tl-dot { transform: scale(1.3); border-width: 3px; }
.tl-cause .tl-dot { border-color: #F5222D; } .tl-cause.active .tl-dot { background: #F5222D; box-shadow: 0 0 0 3px rgba(245,34,45,0.2); }
.tl-impact .tl-dot { border-color: #FF7D00; } .tl-impact.active .tl-dot { background: #FF7D00; box-shadow: 0 0 0 3px rgba(255,125,0,0.2); }
.tl-business .tl-dot { border-color: #F5222D; } .tl-business.active .tl-dot { background: #F5222D; box-shadow: 0 0 0 3px rgba(245,34,45,0.2); }
.tl-detection .tl-dot { border-color: #007DFF; } .tl-detection.active .tl-dot { background: #007DFF; box-shadow: 0 0 0 3px rgba(0,125,255,0.2); }
.tl-diagnosis .tl-dot { border-color: #722ED1; } .tl-diagnosis.active .tl-dot { background: #722ED1; box-shadow: 0 0 0 3px rgba(114,46,209,0.2); }
.tl-action .tl-dot { border-color: #FAAD14; } .tl-action.active .tl-dot { background: #FAAD14; box-shadow: 0 0 0 3px rgba(250,173,20,0.2); }
.tl-recovery .tl-dot { border-color: #07C160; } .tl-recovery.active .tl-dot { background: #07C160; box-shadow: 0 0 0 3px rgba(7,193,96,0.2); }
.tl-label { font-size: 10px; color: var(--text-sec, #6B7280); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.tl-stage.active .tl-label { color: var(--text, #1F2937); font-weight: 600; }
.tl-time { font-size: 9px; color: var(--text-ter, #9CA3AF); font-family: monospace; }
.tl-stage.active .tl-time { color: var(--intelligent, #722ED1); font-weight: 600; }
.tl-tooltip { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; padding: 6px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); white-space: nowrap; z-index: 100; font-size: 11px; }
.tt-type { font-weight: 600; margin-bottom: 2px; }
.tt-critical { color: #F5222D; } .tt-warning { color: #FF7D00; } .tt-info { color: #007DFF; } .tt-success { color: #07C160; }
.tt-time { color: var(--text-sec, #6B7280); font-family: monospace; }
.tt-desc { color: var(--text-ter, #9CA3AF); font-size: 10px; margin-top: 2px; }
</style>