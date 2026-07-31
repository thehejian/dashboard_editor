<template>
  <div class="rdp" :class="{ open: state.open }">
    <div class="rdp-mask" @click="closeDetail"></div>
    <div class="rdp-content" v-if="state.currentResource">
      <div class="rdp-header">
        <div class="rdp-header-left">
          <span class="rdp-status-dot" :class="'dot-' + (state.currentResource.alertStatus === '紧急' ? 'error' : 'normal')"></span>
          <h3>{{ state.currentResource.name }}</h3>
          <a-tag :color="state.currentResource.alertStatus === '紧急' ? 'red' : 'green'" size="small">
            {{ state.currentResource.alertStatus }}
          </a-tag>
          <a-tag v-for="tag in resourceTags" :key="tag" size="small" color="default">{{ tag }}</a-tag>
        </div>
        <button class="rdp-close" @click="closeDetail"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="rdp-tabs-wrap">
        <a-tabs v-model:activeKey="state.activeTab" class="rdp-tabs">
          <a-tab-pane key="overview" tab="概览" />
          <a-tab-pane key="topology" tab="依赖关系" />
          <a-tab-pane key="alarm" tab="告警" />
          <a-tab-pane key="trace" tab="调用链" />
          <a-tab-pane key="log" tab="日志" />
          <a-tab-pane key="ops" tab="运维操作" />
        </a-tabs>
        <span ref="opsTriggerRef" class="ops-chevron" @click.stop="opsDropdownOpen = !opsDropdownOpen">
          <i class="fa-solid fa-chevron-down"></i>
        </span>
        <teleport to="body">
          <div v-if="opsDropdownOpen" class="ops-dropdown" :style="opsDropdownStyle" @click.stop>
            <div v-for="item in OPS_OPTIONS" :key="item.key" class="ops-dropdown-item" :class="{ active: state.opsGroupKey === item.key }" @click="onOpsSelect(item.key)">
              <i :class="item.icon" class="ops-dropdown-icon"></i>
              {{ item.label }}
            </div>
          </div>
        </teleport>
      </div>

      <div class="rdp-tab-content" v-show="state.activeTab === 'overview'"><OverviewPanel /></div>
      <div class="rdp-tab-content" v-show="state.activeTab === 'topology'"><MiniTopology v-if="state.activeTab === 'topology'" :data="topoData" :currentId="'current'" /></div>
      <div class="rdp-tab-content" v-show="state.activeTab === 'alarm'"><AlarmTable :data="alarmData" /></div>
      <div class="rdp-tab-content" v-show="state.activeTab === 'trace'"><TraceWaterfall v-if="state.activeTab === 'trace'" :data="traceData" /></div>
      <div class="rdp-tab-content" v-show="state.activeTab === 'log'"><LogList :data="logData" /></div>
      <div class="rdp-tab-content" v-show="state.activeTab === 'ops'"><OperationsPanel :data="operationsData" :groupKey="state.opsGroupKey" /></div>

      <div class="rdp-footer">
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-chart-line"></i> 关联仪表盘</a>
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-bell"></i> 告警规则</a>
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-file-lines"></i> 变更记录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useResourceDetail } from '../../composables/useResourceDetail'
import MiniTopology from '../../components/resource-detail/MiniTopology.vue'
import AlarmTable from '../../components/resource-detail/AlarmTable.vue'
import TraceWaterfall from '../../components/resource-detail/TraceWaterfall.vue'
import LogList from '../../components/resource-detail/LogList.vue'
import OperationsPanel from '../../components/resource-detail/OperationsPanel.vue'
import OverviewPanel from '../../components/resource-detail/OverviewPanel.vue'

const { state, closeDetail, setOpsGroup, topoData, alarmData, traceData, logData, operationsData } = useResourceDetail()

const OPS_OPTIONS = [
  { key: 'auto-job', label: '自动作业', icon: 'fa-solid fa-robot' },
  { key: 'net-probe', label: '网络探测', icon: 'fa-solid fa-network-wired' },
  { key: 'dial-test', label: '拨测任务', icon: 'fa-solid fa-tower-broadcast' },
  { key: 'host-locate', label: '异常主机定位', icon: 'fa-solid fa-crosshairs' },
]

const opsDropdownOpen = ref(false)
const opsTriggerRef = ref(null)
const opsDropdownStyle = ref({})

function updateDropdownPos() {
  if (!opsTriggerRef.value) return
  const r = opsTriggerRef.value.getBoundingClientRect()
  opsDropdownStyle.value = { position: 'fixed', top: r.bottom + 4 + 'px', left: r.left + 'px', zIndex: 1100 }
}

function onOpsSelect(key) {
  setOpsGroup(key)
  opsDropdownOpen.value = false
}

function onClickOutside(e) {
  if (opsDropdownOpen.value && opsTriggerRef.value && !opsTriggerRef.value.contains(e.target)) {
    opsDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside, true))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside, true))

const resourceTags = computed(() => {
  const r = state.currentResource
  if (!r) return []
  const tags = []
  if (r.vdc) tags.push(r.vdc)
  if (r.appLevel) tags.push(r.appLevel)
  if (r.owner && r.owner !== '--') tags.push(r.owner)
  return tags
})
</script>

<style scoped>
.rdp { position: fixed; top: 48px; right: -80vw; width: 80vw; max-width: 1200px; height: calc(100vh - 48px); z-index: 1060; pointer-events: none; opacity: 0; transition: right 0.3s var(--ease, cubic-bezier(0.16,1,0.3,1)), opacity 0.3s; display: flex; flex-direction: column; }
.rdp.open { pointer-events: auto; opacity: 1; right: 0; }
.rdp-mask { position: fixed; inset: 0; top: 48px; background: rgba(0,0,0,0.3); z-index: -1; }
.rdp-content { flex: 1; display: flex; flex-direction: column; background: #fff; box-shadow: -4px 0 24px rgba(0,0,0,0.1); min-height: 0; }

.rdp-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; gap: 12px; }
.rdp-header-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.rdp-header-left h3 { font-size: 15px; font-weight: 600; color: #1a1a1a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rdp-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.rdp-status-dot.dot-normal { background: #52c41a; }
.rdp-status-dot.dot-warning { background: #fa8c16; }
.rdp-status-dot.dot-error { background: #f5222d; }
.rdp-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 16px; color: #8c8c8c; flex-shrink: 0; transition: all 0.15s; }
.rdp-close:hover { background: #f0f0f0; color: #1a1a1a; }

.rdp-tabs-wrap { position: relative; flex-shrink: 0; }
.rdp-tabs { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.rdp-tabs .ant-tabs-nav) { margin: 0; padding: 0 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
:deep(.rdp-tabs .ant-tabs-content-holder) { display: none; }
.rdp-tab-content { flex: 1; min-height: 0; overflow-y: auto; }

.ops-chevron { position: absolute; right: 20px; bottom: 8px; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; cursor: pointer; font-size: 9px; color: #8c8c8c; transition: all 0.15s; z-index: 10; }
.ops-chevron:hover { background: rgba(0,0,0,0.06); color: #1890ff; }

.rdp-footer { display: flex; gap: 20px; padding: 10px 20px; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
.rdp-footer-link { font-size: 12px; color: #8c8c8c; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
.rdp-footer-link:hover { color: #1890ff; }

@media (max-width: 768px) {
  .rdp { width: 100vw; right: -100vw; max-width: none; }
  .rdp-header-left h3 { font-size: 14px; }
}
</style>

<style>
.ops-dropdown { background: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); border: 1px solid #f0f0f0; padding: 4px; min-width: 160px; }
.ops-dropdown-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #1a1a1a; transition: background 0.12s; }
.ops-dropdown-item:hover { background: #f0f5ff; }
.ops-dropdown-item.active { background: #e6f4ff; color: #1890ff; font-weight: 500; }
.ops-dropdown-icon { width: 16px; text-align: center; color: #1890ff; font-size: 12px; }
</style>
