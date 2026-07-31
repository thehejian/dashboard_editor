<template>
  <div class="alarm-table-wrap">
    <div class="at-toolbar">
      <a-input-search v-model:value="searchText" placeholder="搜索告警名称、指标" style="width: 220px" size="small" allowClear />
      <a-select v-model:value="levelFilter" placeholder="级别" style="width: 100px" size="small" allowClear>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="warning">重要</a-select-option>
        <a-select-option value="info">次要</a-select-option>
      </a-select>
      <a-select v-model:value="statusFilter" placeholder="状态" style="width: 100px" size="small" allowClear>
        <a-select-option value="firing">告警中</a-select-option>
        <a-select-option value="resolved">已恢复</a-select-option>
      </a-select>
    </div>
    <a-table :columns="columns" :dataSource="filteredData" :pagination="{ pageSize: 10, size: 'small', showTotal: t => '共 ' + t + ' 条' }" row-key="id" size="small" :scroll="{ y: 400 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <a-tag :color="getLevelColor(record.level)" size="small">{{ getLevelText(record.level) }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'firing' ? 'red' : 'green'" size="small">
            {{ record.status === 'firing' ? '告警中' : '已恢复' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-tooltip title="查看详情">
            <button class="at-action" @click="showDetail(record)"><i class="fa-solid fa-eye"></i></button>
          </a-tooltip>
        </template>
      </template>
    </a-table>

    <a-drawer :open="detailOpen" title="告警详情" :width="480" @close="detailOpen = false" placement="right">
      <template v-if="selectedAlert">
        <div class="at-detail">
          <div class="at-detail-row"><span class="at-dl">告警名称</span><span class="at-dv">{{ selectedAlert.title }}</span></div>
          <div class="at-detail-row"><span class="at-dl">级别</span><span class="at-dv"><a-tag :color="getLevelColor(selectedAlert.level)" size="small">{{ getLevelText(selectedAlert.level) }}</a-tag></span></div>
          <div class="at-detail-row"><span class="at-dl">资源</span><span class="at-dv">{{ selectedAlert.resource }}</span></div>
          <div class="at-detail-row"><span class="at-dl">指标</span><span class="at-dv">{{ selectedAlert.metric }}</span></div>
          <div class="at-detail-row"><span class="at-dl">当前值</span><span class="at-dv at-dv-bold">{{ selectedAlert.currentValue }}</span></div>
          <div class="at-detail-row"><span class="at-dl">阈值</span><span class="at-dv">{{ selectedAlert.threshold }}</span></div>
          <div class="at-detail-row"><span class="at-dl">持续时间</span><span class="at-dv">{{ selectedAlert.duration }}</span></div>
          <div class="at-detail-row"><span class="at-dl">触发时间</span><span class="at-dv">{{ selectedAlert.triggerTime }}</span></div>
          <div class="at-detail-row"><span class="at-dl">状态</span><span class="at-dv"><a-tag :color="selectedAlert.status === 'firing' ? 'red' : 'green'" size="small">{{ selectedAlert.status === 'firing' ? '告警中' : '已恢复' }}</a-tag></span></div>
          <a-divider style="margin: 12px 0" />
          <div class="at-detail-section">
            <h4>处理建议</h4>
            <pre class="at-suggestion">{{ selectedAlert.suggestion }}</pre>
          </div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ data: { type: Array, default: () => [] } })

const searchText = ref('')
const levelFilter = ref(null)
const statusFilter = ref(null)
const detailOpen = ref(false)
const selectedAlert = ref(null)

const columns = [
  { title: '级别', key: 'level', width: 70 },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '指标', dataIndex: 'metric', key: 'metric', width: 100 },
  { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 80 },
  { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 90 },
  { title: '触发时间', dataIndex: 'triggerTime', key: 'triggerTime', width: 150 },
  { title: '操作', key: 'action', width: 50, fixed: 'right' },
]

const filteredData = computed(() => {
  let list = props.data
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(a => a.title.toLowerCase().includes(kw) || a.metric?.toLowerCase().includes(kw))
  }
  if (levelFilter.value) list = list.filter(a => a.level === levelFilter.value)
  if (statusFilter.value) list = list.filter(a => a.status === statusFilter.value)
  return list
})

function getLevelColor(level) {
  return { critical: 'red', warning: 'orange', info: 'blue' }[level] || 'default'
}
function getLevelText(level) {
  return { critical: '紧急', warning: '重要', info: '次要' }[level] || level
}
function showDetail(record) {
  selectedAlert.value = record
  detailOpen.value = true
}
</script>

<style scoped>
.alarm-table-wrap { padding: 12px 16px; }
.at-toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.at-action { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 4px; cursor: pointer; color: #8c8c8c; font-size: 12px; transition: all 0.15s; }
.at-action:hover { background: #f0f0f0; color: #1890ff; }
.at-detail { display: flex; flex-direction: column; gap: 10px; }
.at-detail-row { display: flex; align-items: center; gap: 12px; }
.at-dl { font-size: 12px; color: #8c8c8c; min-width: 70px; flex-shrink: 0; }
.at-dv { font-size: 13px; color: #1a1a1a; }
.at-dv-bold { font-weight: 600; font-size: 15px; }
.at-detail-section h4 { font-size: 13px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px; }
.at-suggestion { font-size: 12px; color: #595959; white-space: pre-wrap; line-height: 1.6; background: #fafafa; padding: 10px 12px; border-radius: 6px; margin: 0; }
</style>
