<template>
  <div>
    <h3 class="page-title">规则管理</h3>
    <div class="filter-bar">
      <a-select v-model:value="filters.template" style="width:200px" placeholder="采集模板" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="GaussDB 日志采集模板">GaussDB 日志采集模板</a-select-option>
        <a-select-option value="RDS 微服务日志模板">RDS 微服务日志模板</a-select-option>
        <a-select-option value="ECS 主机日志模板">ECS 主机日志模板</a-select-option>
      </a-select>
      <a-select v-model:value="filters.source" style="width:130px" placeholder="规则来源" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="预置">预置规则</a-select-option>
        <a-select-option value="自定义">自定义规则</a-select-option>
      </a-select>
      <a-select v-model:value="filters.sourceType" style="width:130px" placeholder="事件来源" allowClear>
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="0">运行日志</a-select-option>
        <a-select-option value="1">操作日志</a-select-option>
        <a-select-option value="3">巡检</a-select-option>
      </a-select>
      <a-button type="primary" style="margin-left:auto" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>
    <div class="table-toolbar">
      <a-button type="primary" @click="createModalOpen = true">+ 新建规则</a-button>
    </div>
    <a-input-search
      v-model:value="searchKeyword"
      placeholder="搜索..."
      style="width:100%;margin-bottom:12px"
      allow-clear
    />
    <a-table :columns="columns" :data-source="filteredData" :pagination="pagination" row-key="id" @change="onTableChange" :scroll="{ x: 900 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'"><a @click="showDetail(record)">{{ record.name }}</a></template>
        <template v-if="column.key === 'level'"><a-tag :color="EVENT_LEVEL_COLORS[record.level]">{{ EVENT_LEVELS[record.level] }}</a-tag></template>
        <template v-if="column.key === 'sourceType'">{{ SOURCE_TYPES[record.sourceType] || record.sourceType }}</template>
        <template v-if="column.key === 'source'"><a-tag :color="record.source === '预置' ? '#1890ff' : '#52c41a'">{{ record.source }}</a-tag></template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a @click="showDetail(record)">详情</a>
            <template v-if="record.source === '预置'"><a @click="handleCopy(record)">复制为自定义</a></template>
            <template v-else><a @click="handleEdit(record)">编辑</a><a @click="handleDelete(record)">删除</a></template>
          </a-space>
        </template>
      </template>
    </a-table>
    <a-modal v-model:open="detailOpen" title="规则详情" :footer="null" width="600px" destroyOnClose>
      <template v-if="detailRule">
        <div class="detail-grid"><div><label>规则名称</label><span>{{ detailRule.name }}</span></div><div><label>采集模板</label><span>{{ detailRule.template }}</span></div></div>
        <div class="detail-grid"><div><label>事件级别</label><a-tag :color="EVENT_LEVEL_COLORS[detailRule.level]">{{ EVENT_LEVELS[detailRule.level] }}</a-tag></div><div><label>事件来源</label><span>{{ SOURCE_TYPES[detailRule.sourceType] }}</span></div></div>
        <div class="detail-grid"><div><label>规则来源</label><a-tag :color="detailRule.source === '预置' ? '#1890ff' : '#52c41a'">{{ detailRule.source }}</a-tag></div><div><label>更新时间</label><span>{{ detailRule.updateTime }}</span></div></div>
        <div class="detail-section"><h4>检测条件</h4><pre class="json-block">{{ JSON.stringify(detailRule.checkRules, null, 2) }}</pre></div>
      </template>
      <template #footer><a-button @click="detailOpen = false">关闭</a-button></template>
    </a-modal>
    <a-modal v-model:open="createModalOpen" title="新建检测规则" :footer="null" width="640px" destroyOnClose>
      <a-form layout="vertical">
        <a-form-item label="事件来源 *"><a-select v-model:value="form.sourceType"><a-select-option value="0">运行日志</a-select-option><a-select-option value="1">操作日志</a-select-option><a-select-option value="2">告警</a-select-option><a-select-option value="3">巡检</a-select-option></a-select></a-form-item>
        <a-form-item v-if="form.sourceType === '0'" label="采集模板 *"><a-select v-model:value="form.template"><a-select-option value="GaussDB 日志采集模板">GaussDB 日志采集模板</a-select-option><a-select-option value="RDS 微服务日志模板">RDS 微服务日志模板</a-select-option><a-select-option value="ECS 主机日志模板">ECS 主机日志模板</a-select-option></a-select></a-form-item>
        <a-form-item v-if="form.sourceType === '1'" label="归属服务 *"><a-select v-model:value="form.service"><a-select-option value="ECS">ECS</a-select-option><a-select-option value="RDS">RDS</a-select-option><a-select-option value="GaussDB">GaussDB</a-select-option></a-select></a-form-item>
        <a-form-item label="规则名称 *"><a-input v-model:value="form.name" placeholder="请输入规则名称" /></a-form-item>
        <a-form-item label="事件级别 *"><a-select v-model:value="form.level"><a-select-option value="critical">紧急</a-select-option><a-select-option value="major">重要</a-select-option><a-select-option value="minor">次要</a-select-option><a-select-option value="warning">提示</a-select-option><a-select-option value="info">信息</a-select-option></a-select></a-form-item>
        <a-form-item v-if="form.sourceType === '0' || form.sourceType === '1'" label="检测条件 *">
          <div class="condition-editor">
            <div v-for="(cond, i) in form.conditions" :key="i" class="condition-row">
              <a-select v-model:value="cond.field" style="width:120px"><a-select-option value="logContent">日志内容</a-select-option><a-select-option value="level">日志级别</a-select-option><a-select-option value="logFile">日志文件</a-select-option><a-select-option value="lineNum">行号</a-select-option><a-select-option value="sourceHost">来源主机</a-select-option><a-select-option value="actionType">操作类型</a-select-option><a-select-option value="user">操作用户</a-select-option><a-select-option value="object">操作对象</a-select-option></a-select>
              <a-select v-model:value="cond.op" style="width:110px"><a-select-option value="equals">等于</a-select-option><a-select-option value="contains">包含</a-select-option><a-select-option value="startsWith">开头为</a-select-option><a-select-option value="endsWith">结尾为</a-select-option><a-select-option value="in">属于</a-select-option><a-select-option value="lessThan">小于</a-select-option><a-select-option value="greaterThan">大于</a-select-option></a-select>
              <a-input v-model:value="cond.value" placeholder="值" style="width:140px" />
              <a-checkbox v-model:checked="cond.caseSensitive">Aa</a-checkbox>
              <a-button type="text" danger @click="form.conditions.splice(i, 1)"><i class="fa-solid fa-xmark"></i></a-button>
            </div>
            <a-button type="dashed" block @click="form.conditions.push({ field: 'logContent', op: 'contains', value: '', caseSensitive: false })" style="margin-top:8px">+ 添加条件</a-button>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <span style="font-size:12px;color:#666">连接符：</span>
              <a-radio-group v-model:value="form.connector" size="small">
                <a-radio-button value="AND">AND</a-radio-button>
                <a-radio-button value="OR">OR</a-radio-button>
              </a-radio-group>
            </div>
            <div class="json-preview"><pre>{{ JSON.stringify({ logic: form.connector, rules: form.conditions }, null, 2) }}</pre></div>
          </div>
        </a-form-item>
        <a-form-item v-if="form.sourceType === '3'" label="巡检说明"><a-alert message="检测逻辑：系统将自动巡检指定资源，检测异常并生成事件" type="info" showIcon /></a-form-item>
        <a-form-item label="描述"><a-textarea v-model:value="form.description" rows="3" placeholder="请输入描述信息" /></a-form-item>
      </a-form>
      <template #footer><a-space><a-button @click="createModalOpen = false">取消</a-button><a-button type="primary" @click="handleSave">保存</a-button></a-space></template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { MOCK_RULES, EVENT_LEVELS, EVENT_LEVEL_COLORS, SOURCE_TYPES } from './mockData.js'

const filters = reactive({ template: '', source: '', sourceType: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showTotal: t => `共 ${t} 条` })
const rawData = ref([...MOCK_RULES])
const searchKeyword = ref("")

const filteredData = computed(() => {
  let data = [...rawData.value]
  if (filters.template) data = data.filter(r => r.template === filters.template)
  if (filters.source) data = data.filter(r => r.source === filters.source)
  if (filters.sourceType) data = data.filter(r => r.sourceType === filters.sourceType)
  pagination.total = data.length
  return data
})

const columns = [
  { title: '序号', key: 'index', width: 50, customRender: ({ index }) => index + 1 },
  { title: '规则名称', key: 'name', width: 200 },
  { title: '采集模板', dataIndex: 'template', width: 160 },
  { title: '事件级别', key: 'level', width: 100 },
  { title: '事件来源', key: 'sourceType', width: 100 },
  { title: '规则来源', key: 'source', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', width: 160 },
  { title: '操作', key: 'action', width: 180 },
]

const detailOpen = ref(false)
const detailRule = ref(null)
const createModalOpen = ref(false)
const form = reactive({ sourceType: '0', template: '', service: '', name: '', level: 'critical', conditions: [{ field: 'logContent', op: 'contains', value: '', caseSensitive: false }], connector: 'AND', description: '' })

function showDetail(rule) { detailRule.value = rule; detailOpen.value = true }
function handleSearch() { }
function handleReset() { Object.keys(filters).forEach(k => filters[k] = '') }
function handleCopy(rule) { rawData.value.push({ ...rule, id: Date.now(), name: rule.name + ' (副本)', source: '自定义', updateTime: new Date().toISOString().slice(0, 19).replace('T', ' ') }) }
function handleEdit(rule) { detailRule.value = rule; detailOpen.value = true }
function handleDelete(rule) { rawData.value = rawData.value.filter(r => r.id !== rule.id) }
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
.detail-section h4 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
.json-block { background: #1e1e1e; color: #6a9955; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; line-height: 1.5; overflow-x: auto; }
.condition-editor { border: 1px solid #d9d9d9; border-radius: 6px; padding: 12px; background: #fafafa; }
.condition-row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.json-preview { margin-top: 8px; }
.json-preview pre { background: #1e1e1e; color: #6a9955; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; max-height: 120px; overflow: auto; }

@media (max-width: 768px) {
  .filter-bar :deep(.ant-select) { width: 100% !important; }
  .detail-grid { grid-template-columns: 1fr; }
  .condition-row { flex-wrap: wrap; }
  .condition-row :deep(.ant-select), .condition-row .ant-input { width: 100% !important; }
}
</style>