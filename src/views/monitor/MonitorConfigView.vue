<template>
  <div class="page-view">
    <div class="page-header"><h2>监控配置</h2></div>
    <div class="config-card">
      <h3>采集配置</h3>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="采集间隔">
              <a-select default-value="1m">
                <a-select-option value="10s">10秒</a-select-option>
                <a-select-option value="30s">30秒</a-select-option>
                <a-select-option value="1m">1分钟</a-select-option>
                <a-select-option value="5m">5分钟</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="数据保留">
              <a-select default-value="7d">
                <a-select-option value="3d">3天</a-select-option>
                <a-select-option value="7d">7天</a-select-option>
                <a-select-option value="30d">30天</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="采集方式">
              <a-select default-value="pull">
                <a-select-option value="pull">拉取</a-select-option>
                <a-select-option value="push">推送</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>
    <div class="config-card">
      <h3>指标配置</h3>
      <a-table :columns="columns" :data-source="metrics" :pagination="false" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'"><a-switch v-model:checked="record.enabled" /></template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const metrics = ref([
  { id: 1, name: 'CPU使用率', type: '系统指标', enabled: true },
  { id: 2, name: '内存使用率', type: '系统指标', enabled: true },
  { id: 3, name: '磁盘使用率', type: '系统指标', enabled: true },
  { id: 4, name: '网络吞吐', type: '网络指标', enabled: true },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/monitor_metrics?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      metrics.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
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
const columns = [
  { title: '指标名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' },
  { title: '启用', key: 'enabled', width: 80 },
]
</script>

<style scoped>
.page-view { padding: 0 24px; height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.config-card { background: var(--bg-card); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.config-card h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }

@media (max-width: 768px) {
  .page-view { padding: 0 16px; }
  .config-card { padding: 16px; }
}
</style>