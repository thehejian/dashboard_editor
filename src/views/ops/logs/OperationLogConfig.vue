<template>
  <div>
    <div class="page-header">
      <h3>参数配置</h3>
      <div v-if="showSuccess" class="success-banner">
        <i class="fa-solid fa-circle-check" style="color: #52c41a; font-size: 16px;"></i>
        <span>修改租户操作日志存储时长成功</span>
        <i class="fa-solid fa-xmark" style="cursor: pointer; margin-left: 8px; color: #999;" @click="showSuccess = false"></i>
      </div>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="log-tabs">
      <a-tab-pane key="forward" tab="转发配置">
        <a-table :columns="forwardColumns" :data-source="forwardData" :pagination="false" row-key="id" :scroll="{ x: 800 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'protocol'">
              <span v-if="record.protocol" style="color: #007DFF; cursor: pointer;">{{ record.protocol }}</span>
              <span v-else style="color: #999;">--</span>
            </template>
            <template v-if="column.key === 'enabled'">
              <span v-if="record.enabled === '停用'" style="color: #999;">停用</span>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" style="padding: 0 4px;">修改</a-button>
              <a-button type="link" size="small" style="padding: 0 4px;">详情</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="storage" tab="存储配置">
        <div class="config-section">
          <a-form layout="vertical" style="max-width: 600px;">
            <a-form-item>
              <template #label><span style="color: red;">*</span>日志类型</template>
              <span style="line-height: 32px; color: #333;">管理操作日志</span>
            </a-form-item>
            <a-form-item>
              <template #label><span style="color: red;">*</span>存储时长</template>
              <a-select v-model:value="storageForm1.duration" style="width: 200px">
                <a-select-option value="30">30 天</a-select-option>
                <a-select-option value="90">90 天</a-select-option>
                <a-select-option value="180">180 天</a-select-option>
                <a-select-option value="365">365 天</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
          <p class="helper-text">管理操作日志主要用于转发云平台各管理系统或设备的操作日志，本地存储能力有限。如果接入的管理系统或设备过多或存储时间过长，可能导致日志信息自动转储。</p>
        </div>
        <a-divider dashed />
        <div class="config-section">
          <a-form layout="vertical" style="max-width: 600px;">
            <a-form-item>
              <template #label><span style="color: red;">*</span>日志类型</template>
              <span style="line-height: 32px; color: #333;">租户操作日志</span>
            </a-form-item>
            <a-form-item>
              <template #label><span style="color: red;">*</span>存储时长</template>
              <a-select v-model:value="storageForm2.duration" style="width: 200px">
                <a-select-option value="30">30 天</a-select-option>
                <a-select-option value="90">90 天</a-select-option>
                <a-select-option value="180">180 天</a-select-option>
                <a-select-option value="365">365 天</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </div>
        <div style="margin-top: 24px;">
          <a-button type="primary">确定</a-button>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const activeTab = ref('forward')
const showSuccess = ref(true)

const storageForm1 = ref({ duration: '180' })
const storageForm2 = ref({ duration: '180' })

const forwardData = ref([
  { id: 1, logType: '系统日志', ip: '192.168.1.100', port: '514', serverType: 'Syslog', protocol: 'TCP', enabled: true },
  { id: 2, logType: '应用日志', ip: '192.168.1.101', port: '9200', serverType: 'Elasticsearch', protocol: 'HTTP', enabled: true },
  { id: 3, logType: '安全日志', ip: '192.168.1.102', port: '5044', serverType: 'Logstash', protocol: 'TLS', enabled: false },
  { id: 4, logType: '审计日志', ip: '192.168.1.103', port: '24224', serverType: 'Fluentd', protocol: 'TCP', enabled: true },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/log_forward_tasks?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      forwardData.value = json.data.map(function(item) {
        return {
          id: item.id,
          logType: item.forward_content ? JSON.parse(item.forward_content).join(',') : '--',
          ip: (item.target_addr || '').split(':')[0],
          port: (item.target_addr || '').split(':')[1],
          serverType: item.target_type,
          protocol: item.target_type,
          enabled: item.enabled,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const forwardColumns = [
  { title: '日志类型', dataIndex: 'logType', width: 140 },
  { title: 'IP地址', dataIndex: 'ip', width: 100 },
  { title: '端口', dataIndex: 'port', width: 80 },
  { title: '服务器类型', dataIndex: 'serverType', width: 90 },
  { title: '协议类型', key: 'protocol', width: 90 },
  { title: '启用状态', key: 'enabled', width: 90 },
  { title: '操作', key: 'action', width: 110 },
]
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.success-banner { display: inline-flex; align-items: center; gap: 8px; background: #e8f5e9; border-radius: 6px; padding: 6px 16px; font-size: 13px; color: #333; margin-left: auto; white-space: nowrap; }
.config-section { max-width: 720px; }
.helper-text { font-size: 12px; color: #999; margin: 4px 0 0 0; font-style: italic; line-height: 1.6; }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .success-banner { margin-left: 0; white-space: normal; width: 100%; }
  .page-header h3 { font-size: 15px; }
  .helper-text { padding-left: 0; }
}
</style>
