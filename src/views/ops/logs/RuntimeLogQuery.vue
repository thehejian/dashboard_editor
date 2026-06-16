<template>
  <div>
    <div class="page-header">
      <h3>日志查询<small style="font-size: 13px; color: #999; font-weight: normal; margin-left: 8px;">(870版本暂不开发)</small></h3>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="log-tabs">
      <a-tab-pane key="cloud" tab="云平台日志">
        <div class="filter-item">
          <label>区域</label>
          <a-select placeholder="请选择" style="width: 200px" allowClear>
            <a-select-option value="cn-hangzhou">cn-hangzhou</a-select-option>
            <a-select-option value="cn-shanghai">cn-shanghai</a-select-option>
            <a-select-option value="cn-beijing">cn-beijing</a-select-option>
          </a-select>
        </div>
        <div class="filter-item">
          <label>筛选类型</label>
          <div class="btn-group">
            <a-button v-for="t in filterTypes" :key="t.value" :type="cloudForm.filterType === t.value ? 'primary' : 'default'" @click="cloudForm.filterType = t.value">{{ t.label }}</a-button>
          </div>
        </div>
        <div class="filter-item">
          <label>子类型</label>
          <div class="btn-group">
            <a-button v-for="t in subTypes" :key="t.value" :type="cloudForm.subType === t.value ? 'primary' : 'default'" @click="cloudForm.subType = t.value">{{ t.label }}</a-button>
            <a-button type="link" size="small" style="color: #007DFF; padding: 0 8px;">更多 <i class="fa-solid fa-chevron-up" style="font-size: 10px;"></i></a-button>
          </div>
        </div>

        <a-table :columns="logColumns" :data-source="cloudData" :pagination="cloudPagination" row-key="id" :scroll="{ x: 600 }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'time'">
              <span>{{ index + 1 }}. {{ record.time }}</span>
            </template>
            <template v-if="column.key === 'content'">
              <span style="font-size: 12px; font-family: monospace; word-break: break-all;">{{ record.content }}</span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="tenant" tab="租户日志">
        <a-row :gutter="16" style="margin-bottom: 16px;">
          <a-col :span="12">
            <div class="filter-field"><label>区域</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="cn-hangzhou">cn-hangzhou</a-select-option><a-select-option value="cn-shanghai">cn-shanghai</a-select-option></a-select></div>
          </a-col>
          <a-col :span="12">
            <div class="filter-field"><label>租户</label><a-select placeholder="请选择" style="width: 100%" allowClear><a-select-option value="tenant-001">tenant-001</a-select-option><a-select-option value="tenant-002">tenant-002</a-select-option></a-select></div>
          </a-col>
        </a-row>
        <a-row :gutter="16" style="margin-bottom: 16px;">
          <a-col :span="12">
            <div class="filter-field"><label>日志组</label><a-select v-model:value="tenantForm.logGroup" style="width: 100%"><a-select-option value="Lts-group">Lts-group</a-select-option><a-select-option value="app-group">app-group</a-select-option></a-select></div>
          </a-col>
          <a-col :span="12">
            <div class="filter-field"><label>日志流</label><a-select v-model:value="tenantForm.logStream" style="width: 100%"><a-select-option value="Lts-stream">Lts-stream</a-select-option><a-select-option value="app-stream">app-stream</a-select-option></a-select></div>
          </a-col>
        </a-row>
        <div class="search-bar-wrapper" style="margin-bottom: 16px;">
          <div class="search-bar-inner">
            <a-tag closable style="margin: 2px;">hostIp/001</a-tag>
            <a-tag closable style="margin: 2px;">hostIdIP: 192.168.0.161</a-tag>
            <a-tag closable style="margin: 2px;">resource_id: iZbp1hwwt3nzf8ej1322c1Z</a-tag>
            <a-input placeholder="输入关键字搜索、过滤" :bordered="false" style="flex: 1; min-width: 150px;" />
            <div class="search-icons">
              <i class="fa-solid fa-magnifying-glass" style="color: #999; cursor: pointer; padding: 0 6px;"></i>
              <i class="fa-solid fa-rotate" style="color: #999; cursor: pointer; padding: 0 6px;"></i>
              <i class="fa-solid fa-gear" style="color: #999; cursor: pointer; padding: 0 6px;"></i>
            </div>
          </div>
        </div>
        <a-table :columns="logColumns" :data-source="tenantLogData" :pagination="tenantPagination" row-key="id" :scroll="{ x: 600 }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'time'">
              <span>{{ index + 1 }}. {{ record.time }}</span>
            </template>
            <template v-if="column.key === 'content'">
              <span style="font-size: 12px; font-family: monospace; word-break: break-all;">{{ record.content }}</span>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeTab = ref('cloud')

const filterTypes = [
  { label: '云服务', value: 'cloud' },
  { label: '云资源', value: 'resource' },
  { label: '物理资源', value: 'physical' },
]

const subTypes = [
  { label: 'ECS', value: 'ecs' },
  { label: 'IMS', value: 'ims' },
  { label: '选项3', value: 'opt3' },
  { label: '选项4', value: 'opt4' },
  { label: '选项5', value: 'opt5' },
  { label: '选项6', value: 'opt6' },
  { label: '选项7', value: 'opt7' },
  { label: '选项8', value: 'opt8' },
]

const cloudForm = reactive({ filterType: 'cloud', subType: 'ecs', timeRange: '1h' })
const tenantForm = reactive({ logGroup: 'Lts-group', logStream: 'Lts-stream' })

const logColumns = [
  { title: '时间', key: 'time', width: 220, sorter: true },
  { title: '日志内容', key: 'content', ellipsis: true },
]

const cloudData = ref([
  { id: 1, time: '2024/12/28 17:56:19.507', content: 'hostId: 001  hostIdIP: 192.168.0.161  resource_id: iZbp1hww13nzf8ej1322c1Z  pathFile: cn-hangzhou.192.168.0.161  attribute:{}  content:http://auth:8080/auth/checkLogin  flags:1  host:mall-auth-c7559575b-rtszq  otel.name:com.aliyun.sls.filter.AccessLogAspect  otel.version:Type=resumable  attribute:{}  content:http://auth:8080/auth/checkLogin  flags:1  host:mall-auth-c7559575b-rtszq ...展开' },
  { id: 2, time: '2024/12/28 17:56:19.507', content: 'hostId: 002  hostIdIP: 192.168.0.162  resource_id: iZbp1hww13nzf8ej1322c2Z  pathFile: cn-hangzhou.192.168.0.162  attribute:{}  content:http://order:8080/order/list  flags:1  host:mall-order-c7559575b-abcd  otel.name:com.aliyun.sls.filter.AccessLogAspect  otel.version:Type=resumable ...展开' },
  { id: 3, time: '2024/12/28 17:56:19.507', content: 'hostId: 003  hostIdIP: 192.168.0.163  resource_id: iZbp1hww13nzf8ej1322c3Z  pathFile: cn-hangzhou.192.168.0.163  attribute:{}  content:http://user:8080/user/info  flags:1  host:mall-user-c7559575b-efgh  otel.name:com.aliyun.sls.filter.AccessLogAspect  otel.version:Type=resumable ...展开' },
  { id: 4, time: '2024/12/28 17:56:19.507', content: 'hostId: 004  hostIdIP: 192.168.0.164  resource_id: iZbp1hww13nzf8ej1322c4Z  pathFile: cn-hangzhou.192.168.0.164  attribute:{}  content:http://pay:8080/pay/callback  flags:1  host:mall-pay-c7559575b-ijkl  otel.name:com.aliyun.sls.filter.AccessLogAspect  otel.version:Type=resumable ...展开' },
])

const tenantLogData = ref([
  { id: 1, time: '2024/12/28 17:56:19.507', content: 'hostId: 001  hostIdIP: 192.168.0.161  resource_id: iZbp1hwwt3nzf8ej1322c1Z  pathFile: cn-hangzhou.192.168.0.161  attribute:{}  content:http://auth:8080/auth/checkLogin  flags:1  host:mall-auth-c7559575b-rtszq  otlp.name:com.aliyun.sls.filter.AccessLogAspect  otlp.version:Type=resumable ...展开' },
  { id: 2, time: '2024/12/28 17:56:19.507', content: 'hostId: 001  hostIdIP: 192.168.0.161  resource_id: iZbp1hwwt3nzf8ej1322c1Z  pathFile: cn-hangzhou.192.168.0.161  attribute:{}  content:http://auth:8080/auth/logout  flags:1  host:mall-auth-c7559575b-rtszq  otlp.name:com.aliyun.sls.filter.AccessLogAspect  otlp.version:Type=resumable ...展开' },
  { id: 3, time: '2024/12/28 17:56:19.507', content: 'hostId: 001  hostIdIP: 192.168.0.161  resource_id: iZbp1hwwt3nzf8ej1322c1Z  pathFile: cn-hangzhou.192.168.0.161  attribute:{}  content:http://order:8080/order/create  flags:1  host:mall-order-c7559575b-rtszq  otlp.name:com.aliyun.sls.filter.AccessLogAspect  otlp.version:Type=resumable ...展开' },
  { id: 4, time: '2024/12/28 17:56:19.507', content: 'hostId: 001  hostIdIP: 192.168.0.161  resource_id: iZbp1hwwt3nzf8ej1322c1Z  pathFile: cn-hangzhou.192.168.0.161  attribute:{}  content:http://user:8080/user/register  flags:1  host:mall-user-c7559575b-rtszq  otlp.name:com.aliyun.sls.filter.AccessLogAspect  otlp.version:Type=resumable ...展开' },
])

const cloudPagination = { pageSize: 10, total: 153, showTotal: total => `总条数：${total}`, showSizeChanger: true, current: 14 }
const tenantPagination = { pageSize: 10, total: 153, showTotal: total => `总条数：${total}`, showSizeChanger: true, current: 14 }
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { color: #007DFF; }
.filter-item { margin-bottom: 12px; }
.filter-item label { display: block; margin-bottom: 4px; font-size: 14px; color: #333; }
.btn-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.filter-field label { display: block; margin-bottom: 4px; font-size: 14px; color: #333; }

@media (max-width: 768px) {
  .filter-item { flex-direction: column; align-items: flex-start; }
  .filter-item label { width: auto; text-align: left; }
  .page-header h3 { font-size: 15px; }
  .filter-field { margin-bottom: 8px; }
}
</style>
