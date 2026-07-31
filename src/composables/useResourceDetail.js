import { reactive, computed } from 'vue'
import { TOPO_MOCK, ALARM_MOCK, TRACE_MOCK, LOG_MOCK, OPERATIONS_MOCK } from '../mock/resourceDetailMock'

const state = reactive({
  open: false,
  activeTab: 'overview',
  currentResource: null,
})

function openDetail(resource) {
  state.currentResource = resource
  state.activeTab = 'overview'
  state.open = true
}

function closeDetail() {
  state.open = false
  state.currentResource = null
}

function switchTab(tab) {
  state.activeTab = tab
}

const topoData = computed(() => TOPO_MOCK)

const alarmData = computed(() => {
  if (!state.currentResource) return ALARM_MOCK
  return ALARM_MOCK.filter(a => a.resource === state.currentResource.name || a.resource === '订单服务中心')
})

const traceData = computed(() => TRACE_MOCK)

const logData = computed(() => {
  if (!state.currentResource) return LOG_MOCK
  return LOG_MOCK
})

const operationsData = computed(() => OPERATIONS_MOCK)

function getLevelColor(level) {
  return { critical: 'red', warning: 'orange', info: 'blue' }[level] || 'default'
}

function getLevelText(level) {
  return { critical: '紧急', warning: '重要', info: '次要' }[level] || level
}

function getStatusColor(status) {
  return { normal: 'green', warning: 'orange', error: 'red' }[status] || 'default'
}

function getStatusText(status) {
  return { normal: '正常', warning: '警告', error: '异常' }[status] || status
}

export function useResourceDetail() {
  return {
    state,
    openDetail,
    closeDetail,
    switchTab,
    topoData,
    alarmData,
    traceData,
    logData,
    operationsData,
    getLevelColor,
    getLevelText,
    getStatusColor,
    getStatusText,
  }
}
