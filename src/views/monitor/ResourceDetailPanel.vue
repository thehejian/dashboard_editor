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

      <a-tabs v-model:activeKey="state.activeTab" class="rdp-tabs" @change="switchTab">
        <a-tab-pane key="overview" tab="概览">
          <div class="rdp-tab-content">
            <OverviewPanel />
          </div>
        </a-tab-pane>
        <a-tab-pane key="topology" tab="依赖关系">
          <div class="rdp-tab-content">
            <MiniTopology v-if="state.activeTab === 'topology'" :data="topoData" :currentId="'current'" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="alarm" tab="告警">
          <div class="rdp-tab-content">
            <AlarmTable :data="alarmData" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="trace" tab="调用链">
          <div class="rdp-tab-content">
            <TraceWaterfall v-if="state.activeTab === 'trace'" :data="traceData" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="log" tab="日志">
          <div class="rdp-tab-content">
            <LogList :data="logData" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="ops" tab="运维操作">
          <div class="rdp-tab-content">
            <OperationsPanel :data="operationsData" />
          </div>
        </a-tab-pane>
      </a-tabs>

      <div class="rdp-footer">
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-chart-line"></i> 关联仪表盘</a>
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-bell"></i> 告警规则</a>
        <a class="rdp-footer-link" href="javascript:;"><i class="fa-solid fa-file-lines"></i> 变更记录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useResourceDetail } from '../../composables/useResourceDetail'
import MiniTopology from '../../components/resource-detail/MiniTopology.vue'
import AlarmTable from '../../components/resource-detail/AlarmTable.vue'
import TraceWaterfall from '../../components/resource-detail/TraceWaterfall.vue'
import LogList from '../../components/resource-detail/LogList.vue'
import OperationsPanel from '../../components/resource-detail/OperationsPanel.vue'
import OverviewPanel from '../../components/resource-detail/OverviewPanel.vue'

const { state, closeDetail, switchTab, topoData, alarmData, traceData, logData, operationsData } = useResourceDetail()

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

.rdp-tabs { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.rdp-tabs .ant-tabs-nav) { margin: 0; padding: 0 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
:deep(.rdp-tabs .ant-tabs-content-holder) { flex: 1; min-height: 0; overflow: hidden; }
:deep(.rdp-tabs .ant-tabs-content) { height: 100%; }
:deep(.rdp-tabs .ant-tabs-tabpane) { height: 100%; }
.rdp-tab-content { height: 100%; overflow-y: auto; }

.rdp-footer { display: flex; gap: 20px; padding: 10px 20px; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
.rdp-footer-link { font-size: 12px; color: #8c8c8c; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.15s; }
.rdp-footer-link:hover { color: #1890ff; }

@media (max-width: 768px) {
  .rdp { width: 100vw; right: -100vw; max-width: none; }
  .rdp-header-left h3 { font-size: 14px; }
}
</style>
