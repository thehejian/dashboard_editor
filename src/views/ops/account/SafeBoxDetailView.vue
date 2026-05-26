<template>
  <div class="detail-page">
    <div class="detail-header">
      <a-button type="text" @click="$router.back()"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="detail-title">账号保管箱详情</span>
      <a-button class="edit-btn">修改</a-button>
    </div>

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

    <div class="filter-bar">
      <a-input-search v-model:value="search" placeholder="输入关键字搜索、过滤" style="width: 100%" />
      <div class="filter-icons">
        <i class="fa-regular fa-circle-question"></i>
        <i class="fa-solid fa-magnifying-glass"></i>
        <i class="fa-solid fa-gear"></i>
      </div>
    </div>

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
import { ref } from 'vue'

const search = ref('')
const activeTab = ref('scope')

const columns = [
  { title: '账号名', dataIndex: 'accountName', key: 'accountName', sorter: true },
  { title: '账号状态', dataIndex: 'accountStatusLabel', key: 'accountStatus', width: 110 },
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

const data = ref([
  { id: 1, accountName: 'root', accountStatus: 'checking', accountStatusLabel: '检测中', mgmtStatus: '已纳管', resourceIp: '152.212.146.235', resourceName: 'HelpCenter-System01', deviceType: '虚拟机', osType: 'Euler2.13', region: '华北一区', app: 'HCC Turnkey', changeStatus: '', changeStatusLabel: '--', lastLogin: '2023/03/14 12:34:51', description: '考虑到对系统安全的影响...' },
  { id: 2, accountName: 'sopuser', accountStatus: 'normal', accountStatusLabel: '● 正常', mgmtStatus: '已保存', resourceIp: '226.17.91.9', resourceName: 'HelpCenter-System02', deviceType: '--', osType: '--', region: '华北一区', app: 'ConsoleFramework', changeStatus: 'success', changeStatusLabel: '● 修改成功', lastLogin: '2023/03/14 12:34:51', description: '在安装HCC Turnkey过程中创...' },
  { id: 3, accountName: 'root', accountStatus: 'normal', accountStatusLabel: '● 正常', mgmtStatus: '第三方纳管', resourceIp: '252.80.153.155', resourceName: 'HelpCenter_DC1-System01', deviceType: '虚拟机', osType: 'Ubuntu 22.04', region: '华南二区', app: 'FusionCare', changeStatus: 'success', changeStatusLabel: '● 延期成功', lastLogin: '2023/04/16 17:01:37', description: '--' },
  { id: 4, accountName: 'opsadmin', accountStatus: 'normal', accountStatusLabel: '● 正常', mgmtStatus: '未纳管', resourceIp: '133.180.193.241', resourceName: 'HelpCenter_DC1-System02', deviceType: '虚拟机', osType: 'Ubuntu 22.04', region: '华南二区', app: 'APIGateway', changeStatus: 'fail', changeStatusLabel: '○ 失败', lastLogin: '2020/10/13 18:15:48', description: '--' },
  { id: 5, accountName: 'root', accountStatus: 'normal', accountStatusLabel: '● 正常', mgmtStatus: '已纳管', resourceIp: '98.47.116.124', resourceName: 'HelpCenter_DC2-System01', deviceType: '宿主机', osType: 'Ubuntu 22.04', region: '华北一区', app: 'OceanStor DJ', changeStatus: 'fail', changeStatusLabel: '● 失败', lastLogin: '2023/11/12 13:40:21', description: '--' },
])
</script>

<style scoped>
.detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}
.detail-header .ant-btn[type="text"] {
  color: var(--text);
  font-size: 16px;
}
.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}
.edit-btn {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}
.filter-icons {
  display: flex;
  gap: 12px;
  color: #8c8c8c;
  font-size: 14px;
  cursor: pointer;
}

:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 12px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }
:deep(.ant-pagination) { margin-top: 16px; }

@media (max-width: 768px) {
  .info-row { flex-direction: column; gap: 16px; }
  .detail-header { flex-wrap: wrap; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-icons { justify-content: flex-end; }
}
</style>