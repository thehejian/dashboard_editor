<template>
  <div>
    <h3 class="page-title">{{ breadcrumbTitle }}</h3>
    <div class="filter-bar">
      <a-select v-model:value="filters.sourceType" style="width:120px" placeholder="事件来源" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="0">运行日志</a-select-option>
        <a-select-option value="1">操作日志</a-select-option>
        <a-select-option value="2">告警</a-select-option>
        <a-select-option value="3">巡检</a-select-option>
      </a-select>
      <a-select v-model:value="filters.level" style="width:120px" placeholder="事件级别" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="major">重要</a-select-option>
        <a-select-option value="minor">次要</a-select-option>
        <a-select-option value="warning">提示</a-select-option>
        <a-select-option value="info">信息</a-select-option>
      </a-select>
      <a-select v-model:value="filters.status" style="width:120px" placeholder="处理状态" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="unprocessed">未处理</a-select-option>
        <a-select-option value="processed">已处理</a-select-option>
        <a-select-option value="ignored">已忽略</a-select-option>
      </a-select>
      <a-select v-model:value="filters.ciType" style="width:120px" placeholder="资源类型" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="SYS_DeployComponent">微服务</a-select-option>
        <a-select-option value="CLOUD_VM">虚拟机</a-select-option>
        <a-select-option value="CLOUD_GAUSSDB_INSTANCE">GaussDB 实例</a-select-option>
      </a-select>
      <a-input v-model:value="filters.keyword" placeholder="关键词搜索" style="width:200px" allowClear />
      <a-select v-model:value="filters.timeRange" style="width:130px" placeholder="时间范围" allowClear>
        <a-select-option value="1h">近 1 小时</a-select-option>
        <a-select-option value="6h">近 6 小时</a-select-option>
        <a-select-option value="24h">近 24 小时</a-select-option>
        <a-select-option value="7d">近 7 天</a-select-option>
        <a-select-option value="30d">近 30 天</a-select-option>
      </a-select>
      <a-button type="primary" style="margin-left:auto" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>
    <div class="table-toolbar">
      <div class="table-toolbar-right">
        <a-button :disabled="selectedRowKeys.length === 0" @click="handleBatchProcess">批量标记已处理</a-button>
        <a-button @click="handleExport">导出</a-button>
      </div>
    </div>
    <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" row-key="id" :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :scroll="{ x: 1200 }" @change="onTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'level'">
          <a-tag :color="EVENT_LEVEL_COLORS[record.level]">{{ EVENT_LEVELS[record.level] }}</a-tag>
        </template>
        <template v-if="column.key === 'sourceType'">
          {{ SOURCE_TYPES[record.sourceType] || record.sourceType }}
        </template>
        <template v-if="column.key === 'ruleName'">
          <a @click="showDetail(record)">{{ record.ruleName }}</a>
        </template>
        <template v-if="column.key === 'ciType'">
          {{ CI_TYPE_MAP[record.ciType] || record.ciType }}
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="STATUS_COLORS[record.status]">{{ STATUS_MAP[record.status] }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showDetail(record)">详情</a>
            <a @click="openCreateTrace(record)">追踪</a>
            <a @click="goAnalysis(record)">分析</a>
          </a-space>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="detailOpen" title="事件详情" :footer="null" width="640px" destroyOnClose>
      <template v-if="detailEvent">
        <div class="detail-section"><h4>基本信息</h4>
          <div class="detail-grid">
            <div><label>事件 ID</label><span>{{ detailEvent.id }}</span></div>
            <div><label>事件级别</label><a-tag :color="EVENT_LEVEL_COLORS[detailEvent.level]">{{ EVENT_LEVELS[detailEvent.level] }}</a-tag></div>
            <div><label>事件来源</label><span>{{ SOURCE_TYPES[detailEvent.sourceType] }}</span></div>
            <div><label>规则名称</label><span>{{ detailEvent.ruleName }}</span></div>
            <div><label>处理状态</label><a-tag :color="STATUS_COLORS[detailEvent.status]">{{ STATUS_MAP[detailEvent.status] }}</a-tag></div>
            <div><label>事件时间</label><span>{{ detailEvent.eventTime }}</span></div>
            <div><label>采集时间</label><span>{{ detailEvent.eventTime }}</span></div>
          </div>
        </div>
        <div class="detail-section"><h4>归属信息</h4>
          <div class="detail-grid">
            <div><label>资源类型</label><span>{{ CI_TYPE_MAP[detailEvent.ciType] }}</span></div>
            <div><label>资源子类型</label><span>{{ detailEvent.ciIndex }}</span></div>
            <div><label>资源名称</label><span>{{ detailEvent.ciName }}</span></div>
            <div><label>资源 ID</label><span>{{ detailEvent.ciName }}</span></div>
            <div><label>日志文件路径</label><span class="path-text">{{ detailEvent.logFile }}</span></div>
            <div><label>日志行号</label><span>{{ detailEvent.lineNum }}</span></div>
            <div><label>来源主机名</label><span>{{ detailEvent.sourceHost }}</span></div>
            <div><label>来源主机 IP</label><span>{{ detailEvent.sourceIp }}</span></div>
          </div>
        </div>
        <div class="detail-section"><h4>原始日志内容</h4><pre class="log-block">{{ detailEvent.rawLog }}</pre></div>
        <div class="detail-section"><h4>关联追踪任务</h4>
          <div v-if="relatedTasks.length" style="margin-top:8px">
            <a-table :columns="traceCols" :data-source="relatedTasks" row-key="id" :pagination="false" size="small">
              <template #bodyCell="{ column: col, record: r }">
                <template v-if="col.key === 'status'"><a-tag :color="TASK_STATUS_COLORS[r.status]">{{ TASK_STATUS[r.status] }}</a-tag></template>
                <template v-if="col.key === 'action'"><a @click="goTraceResult(r)">查看结果</a></template>
              </template>
            </a-table>
          </div>
          <div v-else class="empty-hint">暂无关联的追踪任务</div>
        </div>
        <div class="detail-actions">
          <a-button type="primary" @click="handleMarkStatus('processed')">标记已处理</a-button>
          <a-button @click="handleMarkStatus('ignored')">标记已忽略</a-button>
          <a-button @click="openCreateTrace(detailEvent)">日志追踪</a-button>
        </div>
      </template>
      <template #footer>
        <a-space>
          <a-button @click="detailOpen = false">关闭</a-button>
          <a-button type="primary" @click="detailOpen = false; detailEvent && openCreateTrace(detailEvent)">日志追踪</a-button>
        </a-space>
      </template>
    </a-modal>
    <a-modal v-model:open="traceModalOpen" title="创建追踪任务" :footer="null" width="520px" destroyOnClose>
      <a-form layout="vertical">
        <a-form-item label="追踪类型"><a-select v-model:value="traceForm.traceType" :disabled="!!traceForm.eventId"><a-select-option value="event">事件追踪</a-select-option><a-select-option value="realtime">实时追踪</a-select-option></a-select></a-form-item>
        <a-form-item v-if="traceForm.traceType === 'event'" label="关联事件 ID"><a-input v-model:value="traceForm.eventId" disabled /></a-form-item>
        <a-form-item v-if="traceForm.traceType === 'event'" label="事件前行数" required><a-input-number v-model:value="traceForm.beforeLines" :min="1" :max="1000" style="width:100%" /></a-form-item>
        <a-form-item v-if="traceForm.traceType === 'event'" label="事件后行数" required><a-input-number v-model:value="traceForm.afterLines" :min="1" :max="1000" style="width:100%" /></a-form-item>
        <a-form-item v-if="traceForm.traceType === 'realtime'" label="追踪时长（分钟）" required><a-input-number v-model:value="traceForm.duration" :min="1" :max="60" style="width:100%" /></a-form-item>
        <a-form-item label="资源类型"><a-input v-model:value="traceForm.ciType" /></a-form-item>
        <a-form-item label="资源子类型"><a-input v-model:value="traceForm.ciIndex" /></a-form-item>
        <a-form-item label="日志文件路径" required><a-input v-model:value="traceForm.logFilePath" /></a-form-item>
        <a-form-item label="来源主机名"><a-input v-model:value="traceForm.sourceHost" /></a-form-item>
        <a-form-item label="来源主机 IP"><a-input v-model:value="traceForm.sourceIp" /></a-form-item>
      </a-form>
      <template #footer>
        <a-space><a-button @click="traceModalOpen = false">取消</a-button><a-button type="primary" @click="handleCreateTrace">创建追踪任务</a-button></a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MOCK_EVENTS, MOCK_TRACE_TASKS, EVENT_LEVELS, EVENT_LEVEL_COLORS, SOURCE_TYPES, STATUS_MAP, STATUS_COLORS, TASK_STATUS, TASK_STATUS_COLORS } from './mockData.js'

const router = useRouter()
const props = defineProps({ filter: { type: String, default: 'all' } })
const defaultFilter = props.filter

const CI_TYPE_MAP = { SYS_DeployComponent: '微服务', CLOUD_VM: '虚拟机', CLOUD_GAUSSDB_INSTANCE: 'GaussDB 实例', CLOUD_PM: '物理机' }

const breadcrumbTitle = computed(() => {
  const map = { all: '全部事件', unprocessed: '未处理事件', emergency: '紧急事件' }
  return map[defaultFilter] || '全部事件'
})

const filters = reactive({ sourceType: '', level: '', status: '', ciType: '', keyword: '', timeRange: '' })
const selectedRowKeys = ref([])
const pagination = reactive({ current: 1, pageSize: 6, total: 0, showTotal: t => `显示 ${Math.min((pagination.current - 1) * pagination.pageSize + 1, t)}-${Math.min(pagination.current * pagination.pageSize, t)} 条，共 ${t} 条` })

const rawData = ref([...MOCK_EVENTS])

const filteredData = computed(() => {
  let data = [...rawData.value]
  if (defaultFilter === 'unprocessed') data = data.filter(e => e.status === 'unprocessed')
  if (defaultFilter === 'emergency') data = data.filter(e => e.level === 'critical')
  if (filters.sourceType) data = data.filter(e => e.sourceType === filters.sourceType)
  if (filters.level) data = data.filter(e => e.level === filters.level)
  if (filters.status) data = data.filter(e => e.status === filters.status)
  if (filters.ciType) data = data.filter(e => e.ciType === filters.ciType)
  if (filters.keyword) data = data.filter(e => e.ruleName.includes(filters.keyword) || e.rawLog.includes(filters.keyword) || e.ciName.includes(filters.keyword))
  if (filters.timeRange) {
    const now = new Date('2026-08-12 23:59:59')
    const ranges = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 }
    const hours = ranges[filters.timeRange] || 0
    if (hours) data = data.filter(e => (now - new Date(e.eventTime)) / 3600000 <= hours)
  }
  pagination.total = data.length
  const start = (pagination.current - 1) * pagination.pageSize
  return data.slice(start, start + pagination.pageSize)
})

const columns = [
  { title: '事件级别', key: 'level', width: 80 },
  { title: '来源', key: 'sourceType', width: 80 },
  { title: '名称', key: 'ruleName', width: 180, ellipsis: true },
  { title: '资源类型', key: 'ciType', width: 100 },
  { title: '资源子类型', dataIndex: 'ciIndex', width: 180 },
  { title: '资源名称', dataIndex: 'ciName', width: 150 },
  { title: '来源主机名', dataIndex: 'sourceHost', width: 100 },
  { title: '来源主机 IP', dataIndex: 'sourceIp', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '事件时间', dataIndex: 'eventTime', width: 140 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
]

const detailOpen = ref(false)
const detailEvent = ref(null)
const traceModalOpen = ref(false)
const traceForm = reactive({ traceType: 'event', eventId: '', beforeLines: 5, afterLines: 5, duration: 10, ciType: '', ciIndex: '', logFilePath: '', sourceHost: '', sourceIp: '' })

const relatedTasks = computed(() => detailEvent.value ? MOCK_TRACE_TASKS.filter(t => t.eventId === detailEvent.value.id) : [])

const traceCols = [
  { title: '任务类型', dataIndex: 'traceType', width: 80 },
  { title: '状态', key: 'status', width: 80 },
  { title: '结果行数', dataIndex: 'resultCount', width: 80 },
  { title: '创建时间', dataIndex: 'createAt', width: 140 },
  { title: '操作', key: 'action', width: 80 },
]

function showDetail(event) { detailEvent.value = event; detailOpen.value = true }
function onSelectChange(keys) { selectedRowKeys.value = keys }
function onTableChange(pag) { pagination.current = pag.current }
function handleSearch() { pagination.current = 1 }
function handleReset() { Object.keys(filters).forEach(k => filters[k] = ''); pagination.current = 1 }
function handleBatchProcess() { selectedRowKeys.value = []; rawData.value = rawData.value.map(e => selectedRowKeys.value.includes(e.id) ? { ...e, status: 'processed' } : e) }
function handleExport() { }
function handleMarkStatus(status) { if (detailEvent.value) { detailEvent.value.status = status; detailOpen.value = false } }
function openCreateTrace(event) {
  traceForm.traceType = 'event'
  traceForm.eventId = event.id
  traceForm.ciType = event.ciType
  traceForm.ciIndex = event.ciIndex
  traceForm.logFilePath = event.logFile
  traceForm.sourceHost = event.sourceHost
  traceForm.sourceIp = event.sourceIp
  traceModalOpen.value = true
}
function handleCreateTrace() { traceModalOpen.value = false }
function goTraceResult(task) { router.push({ path: '/ops/events/trace/result', query: { taskId: task.id } }) }
function goAnalysis(event) { router.push({ path: '/ops/events/analysis', query: { eventId: event.id } }) }

onMounted(() => { pagination.total = filteredData.value.length })
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; background: #fff; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px; }
.table-toolbar { display: flex; justify-content: flex-start; align-items: center; margin-bottom: 12px; }
.table-toolbar-right { display: flex; gap: 8px; }
.detail-section { margin-bottom: 20px; }
.detail-section h4 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-grid div { display: flex; gap: 8px; font-size: 12px; }
.detail-grid label { color: #999; flex-shrink: 0; min-width: 70px; }
.detail-grid span { color: #333; }
.path-text { font-family: monospace; font-size: 11px; word-break: break-all; }
.log-block { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
.empty-hint { color: #999; font-size: 12px; padding: 12px 0; }
.detail-actions { display: flex; gap: 8px; margin-bottom: 16px; }

@media (max-width: 768px) {
  .filter-bar :deep(.ant-select), .filter-bar .ant-input { width: 100% !important; }
  .table-toolbar { flex-wrap: wrap; gap: 8px; }
  .table-toolbar-right { flex-wrap: wrap; gap: 8px; }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-actions { flex-wrap: wrap; }
}
</style>