<template>
  <div class="app-detail">
    <div class="tabs">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="config" tab="配置信息" />
        <a-tab-pane key="keys" tab="访问密钥" />
      </a-tabs>
    </div>

    <div v-show="activeTab === 'config'" class="config-section">
      <div class="info-card">
        <div class="card-title" @click="toggleCard('basic')">
          <span>基本信息</span>
          <i class="fa-solid" :class="cardOpen.basic ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <div v-show="cardOpen.basic" class="info-grid no-border">
          <div class="info-row">
            <span class="info-label">所属租户</span>
            <span class="info-value">租户01</span>
          </div>
          <div class="info-row">
            <span class="info-label">协议类型</span>
            <span class="info-value">OAuth2.0</span>
          </div>
          <div class="info-row">
            <span class="info-label">图标</span>
            <span class="info-value">
              <span class="icon-box"><i class="fa-solid fa-cubes"></i></span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Client ID</span>
            <span class="info-value code">d378556d-52a8-4f5d-9d71c2s56ac1e <i class="fa-regular fa-copy copy-icon"></i></span>
          </div>
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">应用</span>
          </div>
          <div class="info-row">
            <span class="info-label">名称</span>
            <span class="info-value">兴业银行</span>
          </div>
          <div class="info-row">
            <span class="info-label">显示名称</span>
            <span class="info-value">兴业银行</span>
          </div>
          <div class="info-row">
            <span class="info-label">状态</span>
            <span class="info-value"><span class="status-cell"><span class="status-dot dot-green"></span>已启用</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">应用类型</span>
            <span class="info-value">Server应用</span>
          </div>
          <div class="info-row">
            <span class="info-label">访问令牌有效期</span>
            <span class="info-value">3600秒</span>
          </div>
          <div class="info-row">
            <span class="info-label">刷新令牌有效期</span>
            <span class="info-value">2952600秒</span>
          </div>
          <div class="info-row">
            <span class="info-label">授权范围</span>
            <span class="info-value">/mo/api/uam/v1/safebox</span>
          </div>
          <div class="info-row">
            <span class="info-label">创建时间</span>
            <span class="info-value">2023/04/12 08:40</span>
          </div>
          <div class="info-row">
            <span class="info-label">描述</span>
            <span class="info-value dim">--</span>
          </div>
        </div>
      </div>
      <div class="info-card">
        <div class="card-title" @click="toggleCard('protocol')">
          <span>协议信息</span>
          <i class="fa-solid" :class="cardOpen.protocol ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <div v-show="cardOpen.protocol" class="info-grid no-border">
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'keys'" class="keys-section">
      <div class="warning-banner">
        <span class="warning-icon"><i class="fa-solid fa-circle-exclamation"></i></span>
        <span class="warning-text">如果访问密钥泄露，会带来数据泄露风险，且每个访问密钥仅能在创建时下载一次。为了安全性，建议您定期更换并妥善保存访问密钥。若您的访问密钥已丢失，您可创建新的访问密钥并停用原有的访问密钥</span>
      </div>

      <div class="reset-bar">
        <a-button type="primary" class="reset-btn">重置</a-button>
        <span class="reset-note">每个应用最多只能创建1个访问密钥</span>
      </div>

      <a-table
        :columns="keyColumns"
        :data-source="keyData"
        :pagination="{ pageSize: 10, total: 1, showSizeChanger: false, hideOnSinglePage: true }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <span class="status-cell"><span class="status-dot dot-green"></span>{{ record.statusLabel }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a class="link-blue" style="margin-right: 8px">停用</a>
            <a class="link-blue" style="margin-right: 8px">重置</a>
            <a class="link-blue">删除</a>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeTab = ref('keys')
const cardOpen = reactive({ basic: true, protocol: true })
function toggleCard(key) {
  cardOpen[key] = !cardOpen[key]
}

const keyColumns = [
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', sorter: true },
  { title: '最近使用时间', dataIndex: 'lastUsed', key: 'lastUsed', sorter: true },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', sorter: true },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', sorter: true },
  { title: '剩余时间', dataIndex: 'remaining', key: 'remaining' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '操作', key: 'action', width: 180 },
]

const keyData = ref([
  { id: 1, createTime: '2023-05-12 15:32:46', lastUsed: '2023-04-15 14:23', startTime: '2023-04-15 14:23', endTime: '9999-12-31 23:59', remaining: '长期有效', status: 'green', statusLabel: '启用', description: '--' },
])
</script>

<style scoped>
.app-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: #f5f5f5;
}
.tabs {
  margin-bottom: 0;
}
.config-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.card-title i {
  font-size: 12px;
  color: #8c8c8c;
}
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-grid.no-border .info-row {
  border-bottom: none;
}
.info-grid.no-border .info-row:last-child {
  padding-bottom: 0;
}
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f5f5f5;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-size: 13px;
  color: #8c8c8c;
  min-width: 100px;
  flex-shrink: 0;
}
.info-value {
  font-size: 13px;
  color: var(--text);
}
.info-value.dim {
  color: #d9d9d9;
}
.info-value.code {
  font-family: monospace;
  color: var(--text);
}
.copy-icon {
  font-size: 12px;
  color: #8c8c8c;
  cursor: pointer;
  margin-left: 4px;
}
.copy-icon:hover {
  color: var(--brand);
}
.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--brand);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}
.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-green {
  background: #52c41a;
}
.link-blue {
  color: var(--brand);
  cursor: pointer;
  font-size: 13px;
}
.link-blue:hover {
  opacity: 0.8;
}
.keys-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  margin-bottom: 16px;
}
.warning-icon {
  color: #1890ff;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}
.warning-text {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
}
.reset-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.reset-note {
  font-size: 12px;
  color: #8c8c8c;
}

@media (max-width: 768px) {
  .app-detail { padding: 16px; }
  .info-card { padding: 16px; }
  .info-row { flex-direction: column; gap: 4px; }
  .info-label { min-width: auto; }
  .warning-banner { flex-direction: column; }
  .reset-bar { flex-wrap: wrap; }
}
</style>