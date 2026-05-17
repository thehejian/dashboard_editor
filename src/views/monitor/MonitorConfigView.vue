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
import { ref } from 'vue'

const metrics = ref([
  { id: 1, name: 'CPU使用率', type: 'Gauge', enabled: true },
  { id: 2, name: '内存使用率', type: 'Gauge', enabled: true },
  { id: 3, name: '磁盘IO', type: 'Counter', enabled: true },
  { id: 4, name: '网络流量', type: 'Counter', enabled: false },
])
const columns = [
  { title: '指标名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'type' },
  { title: '启用', key: 'enabled', width: 80 },
]
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.config-card { background: var(--bg-card); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.config-card h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
</style>