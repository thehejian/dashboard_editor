<template>
  <div>
    <h3 class="page-title">告警转换规则</h3>
    <div class="filter-bar">
      <a-select v-model:value="filters.severity" style="width:120px" placeholder="告警级别" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="critical">紧急</a-select-option>
        <a-select-option value="major">重要</a-select-option>
        <a-select-option value="minor">次要</a-select-option>
        <a-select-option value="warning">提示</a-select-option>
      </a-select>
      <a-select v-model:value="filters.enabled" style="width:120px" placeholder="启用状态" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="true">已启用</a-select-option>
        <a-select-option value="false">未启用</a-select-option>
      </a-select>
      <a-select v-model:value="filters.source" style="width:130px" placeholder="规则来源" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="预置">预置规则</a-select-option>
        <a-select-option value="自定义">自定义规则</a-select-option>
      </a-select>
      <a-button type="primary" style="margin-left:auto" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>
    <div class="table-toolbar">
      <a-button type="primary" @click="createModalOpen = true">+ 新建告警转换规则</a-button>
    </div>
    <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" row-key="id" @change="onTableChange" :scroll="{ x: 1000 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'alarmName'"><a @click="showDetail(record)">{{ record.alarmName }}</a></template>
        <template v-if="column.key === 'severity'"><a-tag :color="EVENT_LEVEL_COLORS[record.severity]">{{ EVENT_LEVELS[record.severity] }}</a-tag></template>
        <template v-if="column.key === 'enabled'"><a-tag :color="record.enabled ? '#52c41a' : '#d9d9d9'">{{ record.enabled ? '已启用' : '未启用' }}</a-tag></template>
        <template v-if="column.key === 'source'"><a-tag :color="record.source === '预置' ? '#1890ff' : '#52c41a'">{{ record.source }}</a-tag></template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showDetail(record)">详情</a>
            <a @click="handleEdit(record)">编辑</a>
            <a @click="toggleEnabled(record)">{{ record.enabled ? '禁用' : '启用' }}</a>
          </a-space>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="detailOpen" title="告警规则详情" :footer="null" width="600px" destroyOnClose>
      <template v-if="detailRule">
        <div class="detail-grid"><div><label>告警名称</label><span>{{ detailRule.alarmName }}</span></div><div><label>关联检测规则</label><span>{{ detailRule.eventRuleName }}</span></div></div>
        <div class="detail-grid"><div><label>告警级别</label><a-tag :color="EVENT_LEVEL_COLORS[detailRule.severity]">{{ EVENT_LEVELS[detailRule.severity] }}</a-tag></div><div><label>告警 ID</label><span>{{ detailRule.alarmId }}</span></div></div>
        <div class="detail-grid"><div><label>触发次数</label><span>{{ detailRule.triggerTimes }} 次 / {{ detailRule.triggerPeriod }}s</span></div><div><label>启用状态</label><a-tag :color="detailRule.enabled ? '#52c41a' : '#d9d9d9'">{{ detailRule.enabled ? '已启用' : '未启用' }}</a-tag></div></div>
        <div class="detail-grid"><div><label>规则来源</label><a-tag :color="detailRule.source === '预置' ? '#1890ff' : '#52c41a'">{{ detailRule.source }}</a-tag></div></div>
        <div class="detail-section"><h4>告警描述</h4><p>{{ detailRule.description }}</p></div>
        <div class="detail-section"><h4>可能原因</h4><p>{{ detailRule.possibleCause }}</p></div>
        <div class="detail-section"><h4>修复建议</h4><p>{{ detailRule.fixSuggestion }}</p></div>
        <div class="detail-section"><h4>告警影响</h4><p>{{ detailRule.impact }}</p></div>
      </template>
      <template #footer><a-button @click="detailOpen = false">关闭</a-button></template>
    </a-modal>
    <a-modal v-model:open="createModalOpen" title="新建告警转换规则" :footer="null" width="600px" destroyOnClose>
      <a-form layout="vertical">
        <a-form-item label="关联检测规则 *"><a-select v-model:value="form.eventRuleName"><a-select-option v-for="r in rules" :key="r.name" :value="r.name">{{ r.name }}</a-select-option></a-select></a-form-item>
        <a-form-item label="告警名称 *"><a-input v-model:value="form.alarmName" placeholder="请输入告警名称" /></a-form-item>
        <a-form-item label="告警级别 *"><a-select v-model:value="form.severity"><a-select-option value="critical">紧急</a-select-option><a-select-option value="major">重要</a-select-option><a-select-option value="minor">次要</a-select-option><a-select-option value="warning">提示</a-select-option></a-select></a-form-item>
        <a-form-item label="告警 ID *"><a-input v-model:value="form.alarmId" placeholder="请输入数字格式的告警 ID" /></a-form-item>
        <a-form-item label="告警分组 ID *"><a-input v-model:value="form.groupId" placeholder="请输入告警分组 ID" /></a-form-item>
        <a-form-item label="触发次数阈值 *"><a-input-number v-model:value="form.triggerTimes" :min="1" style="width:100%" /></a-form-item>
        <a-form-item label="时间窗口（秒）*"><a-input-number v-model:value="form.triggerPeriod" :min="1" style="width:100%" /></a-form-item>
        <a-form-item label="清除类型"><a-select v-model:value="form.clearType"><a-select-option value="auto">自动清除</a-select-option><a-select-option value="manual">人工清除</a-select-option></a-select></a-form-item>
        <a-form-item label="是否启用"><a-select v-model:value="form.enabled"><a-select-option :value="true">启用</a-select-option><a-select-option :value="false">不启用</a-select-option></a-select></a-form-item>
        <a-form-item label="告警描述"><a-textarea v-model:value="form.description" rows="2" /></a-form-item>
        <a-form-item label="可能原因"><a-textarea v-model:value="form.possibleCause" rows="2" /></a-form-item>
        <a-form-item label="修复建议"><a-textarea v-model:value="form.fixSuggestion" rows="2" /></a-form-item>
        <a-form-item label="告警影响"><a-textarea v-model:value="form.impact" rows="2" /></a-form-item>
      </a-form>
      <template #footer><a-space><a-button @click="createModalOpen = false">取消</a-button><a-button type="primary" @click="handleSave">保存</a-button></a-space></template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { MOCK_ALERTS, MOCK_RULES, EVENT_LEVELS, EVENT_LEVEL_COLORS } from './mockData.js'

const rules = MOCK_RULES

const filters = reactive({ severity: '', enabled: '', source: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: t => `共 ${t} 条` })
const rawData = ref([...MOCK_ALERTS])

const filteredData = computed(() => {
  let data = [...rawData.value]
  if (filters.severity) data = data.filter(r => r.severity === filters.severity)
  if (filters.enabled !== '') data = data.filter(r => r.enabled === (filters.enabled === 'true'))
  if (filters.source) data = data.filter(r => r.source === filters.source)
  pagination.total = data.length
  return data
})

const columns = [
  { title: '序号', key: 'index', width: 50, customRender: ({ index }) => index + 1 },
  { title: '告警名称', key: 'alarmName', width: 220 },
  { title: '关联检测规则', dataIndex: 'eventRuleName', width: 180 },
  { title: '告警级别', key: 'severity', width: 100 },
  { title: '告警 ID', dataIndex: 'alarmId', width: 100 },
  { title: '触发次数', key: 'trigger', width: 100, customRender: ({ record }) => `${record.triggerTimes} 次 / ${record.triggerPeriod}s` },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '来源', key: 'source', width: 100 },
  { title: '操作', key: 'action', width: 160 },
]

const detailOpen = ref(false)
const detailRule = ref(null)
const createModalOpen = ref(false)
const form = reactive({ eventRuleName: '', alarmName: '', severity: 'major', alarmId: '', groupId: '', triggerTimes: 3, triggerPeriod: 60, clearType: 'auto', enabled: true, description: '', possibleCause: '', fixSuggestion: '', impact: '' })

function showDetail(rule) { detailRule.value = rule; detailOpen.value = true }
function handleSearch() { }
function handleReset() { Object.keys(filters).forEach(k => filters[k] = '') }
function handleEdit(rule) { detailRule.value = rule; detailOpen.value = true }
function toggleEnabled(rule) { rule.enabled = !rule.enabled }
function handleSave() { createModalOpen.value = false }
function onTableChange(pag) { pagination.current = pag.current }
onMounted(() => { pagination.total = filteredData.value.length })
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: flex-start; align-items: center; margin-bottom: 12px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; background: #fff; padding: 12px; border: 1px solid #e8e8e8; border-radius: 6px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.detail-grid div { display: flex; gap: 8px; font-size: 12px; }
.detail-grid label { color: #999; flex-shrink: 0; min-width: 70px; }
.detail-grid span { color: #333; }
.detail-section { margin-bottom: 16px; }
.detail-section h4 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
.detail-section p { font-size: 12px; color: #555; line-height: 1.5; }

@media (max-width: 768px) {
  .filter-bar :deep(.ant-select) { width: 100% !important; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>