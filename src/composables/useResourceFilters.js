import { reactive, computed } from 'vue'

const LS_FOCUSED = 'rmon:focused'
const LS_FOCUSED_GROUPS = 'rmon:focusedGroups'
const LS_RECENT = 'rmon:recent'
const MAX_RECENT = 10

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}
function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) {
    /* ignore quota errors */
  }
}

function snapshot(resource) {
  return {
    id: resource.id,
    name: resource.name,
    groupKey: resource.type || 'app',
    subType: resource.subType || resource.appLevel || '',
    alertStatus: resource.alertStatus || '正常',
  }
}

const state = reactive({
  panelCollapsed: false,
  scope: 'all',
  modules: [],
  alerts: [],
  runs: [],
  focused: load(LS_FOCUSED, []),
  focusedGroups: load(LS_FOCUSED_GROUPS, []),
  recent: load(LS_RECENT, []),
})

const hasActiveFilters = computed(() => state.modules.length > 0 || state.alerts.length > 0 || state.runs.length > 0)

function persist() {
  save(LS_FOCUSED, state.focused)
  save(LS_FOCUSED_GROUPS, state.focusedGroups)
  save(LS_RECENT, state.recent)
}

function setScope(scope) {
  state.scope = scope
}

function toggleModule(key) {
  const i = state.modules.indexOf(key)
  if (i >= 0) state.modules.splice(i, 1)
  else state.modules.push(key)
}

function toggleAlert(val) {
  const i = state.alerts.indexOf(val)
  if (i >= 0) state.alerts.splice(i, 1)
  else state.alerts.push(val)
}

function toggleRun(val) {
  const i = state.runs.indexOf(val)
  if (i >= 0) state.runs.splice(i, 1)
  else state.runs.push(val)
}

function isFocused(id) {
  return state.focused.some(f => f.id === id)
}

function toggleFocus(resource) {
  const i = state.focused.findIndex(f => f.id === resource.id)
  if (i >= 0) state.focused.splice(i, 1)
  else state.focused.unshift(snapshot(resource))
  persist()
}

function isGroupFocused(key) {
  return state.focusedGroups.some(g => g.key === key)
}

function toggleGroupFocus(group) {
  const i = state.focusedGroups.findIndex(g => g.key === group.key)
  if (i >= 0) state.focusedGroups.splice(i, 1)
  else state.focusedGroups.unshift({ key: group.key, label: group.label })
  persist()
}

function recordVisit(resource) {
  const entry = { ...snapshot(resource), time: Date.now() }
  state.recent = [entry, ...state.recent.filter(r => r.id !== resource.id)].slice(0, MAX_RECENT)
  persist()
}

function clearRecent() {
  state.recent = []
  persist()
}

function resetFilters() {
  state.scope = 'all'
  state.modules = []
  state.alerts = []
  state.runs = []
}

function clearAll() {
  state.focused = []
  state.focusedGroups = []
  persist()
}

export function useResourceFilters() {
  return {
    state,
    hasActiveFilters,
    setScope,
    toggleModule,
    toggleAlert,
    toggleRun,
    isFocused,
    toggleFocus,
    isGroupFocused,
    toggleGroupFocus,
    recordVisit,
    clearRecent,
    resetFilters,
    clearAll,
  }
}
