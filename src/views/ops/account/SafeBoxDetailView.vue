<template>
  <div class="detail-page">
    <div class="info-card">
      <div class="info-row">
        <div class="info-col">
          <div class="info-item">
            <span class="info-label">名称</span>
            <span class="info-value">safebox01</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">2023/03/14 12:34:51</span>
          </div>
        </div>
        <div class="info-col">
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value"><span class="status-dot dot-green"></span>已启用</span>
          </div>
          <div class="info-item">
            <span class="info-label">描述</span>
            <span class="info-value">--</span>
          </div>
        </div>
        <div class="info-col">
          <div class="info-item">
            <span class="info-label">关联应用</span>
            <span class="info-value"><a class="link-blue">Turnkey <i class="fa-solid fa-arrow-up-right-from-square"></i></a></span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">2023/03/14 12:34:51</span>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <a-radio-group v-model:value="activeTab" button-style="solid">
        <a-radio-button value="scope">账号范围</a-radio-button>
        <a-radio-button value="permission">权限</a-radio-button>
        <a-radio-button value="access">访问控制</a-radio-button>
      </a-radio-group>
    </div>

    <a-input-search v-model:value="search" placeholder="输入关键字搜索、过滤" style="width: 100%; margin-bottom: 12px" />

    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, total: 153, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `总条数：${total}` }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'accountName'">
          <a class="link-blue">{{ record.accountName }}</a>
        </template>
        <template v-if="column.key === 'accountStatus'">
          <span class="status-text" :class="'status-' + record.accountStatus">{{ record.accountStatusLabel }}</span>
        </template>
        <template v-if="column.key === 'changeStatus'">
          <span class="status-text" :class="'status-' + record.changeStatus">{{ record.changeStatusLabel }}</span>
        </template>
        <template v-if="column.key === 'resourceIp'">
          <a class="link-blue">{{ record.resourceIp }}</a>
        </template>
        <template v-if="column.key === 'resourceName'">
          <a class="link-blue">{{ record.resourceName }}</a>
        </template>
        <template v-if="column.key === 'app'">
          <a class="link-blue">{{ record.app }}</a>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const search = ref('')
const activeTab = ref('scope')

const columns = [
  { title: '账号名', dataIndex: 'accountName', key: 'accountName', sorter: true },
  { title: '账号状态', dataIndex: 'accountStatusLabel', key: 'accountStatus', width: 110, filters: [{ text: '检测中', value: 'checking' }, { text: '正常', value: 'normal' }], onFilter: (value, record) => record.accountStatus === value },
  { title: '管理状态', dataIndex: 'mgmtStatus', key: 'mgmtStatus', width: 100 },
  { title: '资源IP', dataIndex: 'resourceIp', key: 'resourceIp', sorter: true },
  { title: '资源名称', dataIndex: 'resourceName', key: 'resourceName', sorter: true },
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 90 },
  { title: '操作系统', dataIndex: 'osType', key: 'osType', width: 100 },
  { title: '所属区域', dataIndex: 'region', key: 'region', width: 90 },
  { title: '应用/云服务', dataIndex: 'app', key: 'app', width: 120 },
  { title: '变更状态', dataIndex: 'changeStatusLabel', key: 'changeStatus', width: 100, sorter: true },
  { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin', sorter: true },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
]

const data = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/safebox_accounts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      data.value = json.data.map(function(item) {
        return {
          id: item.id,
          accountName: item.account_name,
          accountStatus: item.account_status,
          accountStatusLabel: item.account_status === 'normal' ? '● 正常' : item.account_status === 'checking' ? '● 检测中' : item.account_status,
          mgmtStatus: item.mgmt_status,
          resourceIp: item.resource_ip,
          resourceName: item.resource_name,
          deviceType: item.device_type,
          osType: item.os_type,
          region: item.region,
          app: item.app,
          changeStatus: '',
          changeStatusLabel: '--',
          lastLogin: item.last_login,
          description: item.description,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.info-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}
.info-row {
  display: flex;
  gap: 48px;
}
.info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.info-label {
  font-size: 13px;
  color: #8c8c8c;
  min-width: 60px;
}
.info-value {
  font-size: 13px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}
.link-blue {
  color: var(--brand);
  cursor: pointer;
  font-size: 13px;
}
.link-blue:hover { opacity: 0.8; }
.link-blue i { font-size: 11px; }

.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }

.status-text { font-size: 13px; }
.status-text.status-checking { color: #1890ff; }
.status-text.status-normal { color: #52c41a; }
.status-text.status-success { color: #52c41a; }
.status-text.status-fail { color: #f5222d; }

.tab-bar {
  margin-bottom: 12px;
}
</style>