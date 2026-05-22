<template>
  <div>
    <div class="page-header">
      <h3>操作系统账号</h3>
    </div>
    <div class="button-row">
      <a-button>创建</a-button>
      <a-button>删除</a-button>
    </div>
    <div class="search-row">
      <a-input-search v-model:value="search" placeholder="请输入关键字搜索" />
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }"
      row-key="id"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="link-blue">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'status'">
          <span class="status-cell"><span class="status-dot" :class="'dot-' + record.status"></span>{{ record.statusLabel }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a class="link-blue" style="margin-right: 12px">修改</a>
          <a class="link-blue">删除</a>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const search = ref('')
const selectedRowKeys = ref([])

function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

const columns = [
  { title: '账号名', dataIndex: 'name', key: 'name', sorter: true },
  { title: '主机IP', dataIndex: 'ip', key: 'ip' },
  { title: '系统类型', dataIndex: 'osType', key: 'osType' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', sorter: true },
  { title: '关联用户', dataIndex: 'user', key: 'user' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: true },
  { title: '操作', key: 'action', width: 120 },
]

const data = ref([
  { id: 1, name: 'root', ip: '192.168.1.101', osType: 'CentOS 7.9', status: 'green', statusLabel: '正常', lastLogin: '2026/05/21 14:32:10', user: '张运维', createdAt: '2024/01/15 09:00:00' },
  { id: 2, name: 'admin', ip: '192.168.1.102', osType: 'Ubuntu 22.04', status: 'green', statusLabel: '正常', lastLogin: '2026/05/20 18:12:05', user: '李运维', createdAt: '2024/03/20 10:30:00' },
  { id: 3, name: 'deploy', ip: '192.168.1.103', osType: 'Windows Server 2022', status: 'red', statusLabel: '异常', lastLogin: '2026/04/28 09:15:00', user: '王运维', createdAt: '2024/06/10 14:00:00' },
  { id: 4, name: 'oracle', ip: '192.168.2.201', osType: 'Rocky Linux 9', status: 'green', statusLabel: '正常', lastLogin: '2026/05/21 08:45:30', user: '赵运维', createdAt: '2024/08/05 11:20:00' },
  { id: 5, name: 'backup', ip: '192.168.1.105', osType: 'Debian 12', status: 'yellow', statusLabel: '警告', lastLogin: '2026/05/19 22:00:00', user: '张运维', createdAt: '2024/02/28 16:45:00' },
])
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
.button-row { display: flex; gap: 8px; margin-bottom: 12px; }
.search-row { margin-bottom: 16px; }
.link-blue { color: var(--brand); cursor: pointer; font-size: 13px; }
.link-blue:hover { opacity: 0.8; }
.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-yellow { background: #fa8c16; }
.dot-red { background: #f5222d; }
:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
</style>
