<template>
  <div class="create-page">
    <div class="create-header">
      <a-button type="text" @click="goBack"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="create-title">账号申请</span>
    </div>

    <div class="create-body">
      <div class="collapsible-section open">
        <div class="collapsible-header" @click="sections.basic = !sections.basic">
          <i class="fa-solid" :class="sections.basic ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          <span>基本信息</span>
        </div>
        <div class="collapsible-body">
          <a-form layout="vertical">
            <a-form-item label="是否为他人申请">
              <a-switch v-model:checked="form.forOther" />
            </a-form-item>

            <a-form-item label="使用人">
              <a-select v-model:value="form.users" mode="multiple" placeholder="请选择使用人" :max-tag-count="1">
                <a-select-option v-for="u in userOptions" :key="u" :value="u">{{ u }}</a-select-option>
              </a-select>
              <span class="form-hint">已选 {{ form.users.length }} 人，最多可添加 10 人</span>
            </a-form-item>

            <a-form-item>
              <template #label><span class="red">*</span> 账号类型</template>
              <a-radio-group v-model:value="form.accountType" button-style="solid">
                <a-radio-button value="os">操作系统账号</a-radio-button>
                <a-radio-button value="db">数据库账号</a-radio-button>
                <a-radio-button value="op">OP账号</a-radio-button>
                <a-radio-button value="mw">中间件及应用账号</a-radio-button>
                <a-radio-button value="device">设备及其他账号</a-radio-button>
              </a-radio-group>
              <span class="form-hint">【提示】只有操作系统账号才有一键登录能力</span>
            </a-form-item>

            <a-form-item>
              <template #label><span class="red">*</span> 申请类型</template>
              <a-radio-group v-model:value="form.applyType" button-style="solid">
                <a-radio-button value="password">账号密码</a-radio-button>
                <a-radio-button value="login">OP账号登录</a-radio-button>
              </a-radio-group>
              <span class="form-hint">仅支持申请账号名前缀为"op_svc"，管理状态为已纳管或仅保存，账号类型为人机或混用，且账号状态为正常，检测中或无法访问的账号</span>
            </a-form-item>

            <a-form-item>
              <template #label><span class="red">*</span> 授权期限</template>
              <a-range-picker v-model:value="form.dateRange" style="width: 320px" />
            </a-form-item>

            <a-form-item label="到期提醒">
              <a-switch v-model:checked="form.expireRemind" />
              <span class="form-hint">账号有效期小于24小时会提醒</span>
            </a-form-item>

            <a-form-item label="提醒方式">
              <a-checkbox-group v-model:value="form.remindMethods">
                <a-checkbox value="site">站内信</a-checkbox>
                <a-checkbox value="email">邮件</a-checkbox>
              </a-checkbox-group>
              <span class="form-hint">可通过 <a class="link-blue">系统->系统设置->远程通知</a> 进行邮箱设置 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px"></i></span>
            </a-form-item>

            <a-form-item label="申请原因">
              <a-textarea v-model:value="form.reason" placeholder="请输入" :maxlength="1000" :show-count="true" :rows="4" />
            </a-form-item>
          </a-form>
        </div>
      </div>

      <div class="collapsible-section open">
        <div class="collapsible-header" @click="sections.accounts = !sections.accounts">
          <i class="fa-solid" :class="sections.accounts ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
          <span>选择账号</span>
        </div>
        <div class="collapsible-body">
          <div class="select-account-area">
            <div class="select-account-top">
              <a-button type="primary" ghost @click="showTransfer = true">选择</a-button>
              <div class="select-info">
                <span>当前已选择数 {{ selectedAccounts.length }}</span>
                <span class="select-divider">|</span>
                <span>最多可选择数 {{ maxSelect }}</span>
              </div>
              <a-button type="link" class="clear-btn" @click="selectedAccounts = []; targetKeys = []">清空</a-button>
            </div>
            <a-table
              :columns="accountColumns"
              :data-source="selectedAccounts"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a class="link-blue">{{ record.name }}</a>
                </template>
                <template v-if="column.key === 'status'">
                  <span class="status-cell"><span class="status-dot dot-green"></span>{{ record.statusLabel }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <a class="link-blue" @click="removeAccount(record)">移除</a>
                </template>
              </template>
            </a-table>
            <div class="table-footer">总条数：{{ selectedAccounts.length }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="create-footer">
      <a-button @click="goBack">取消</a-button>
      <a-button type="primary" @click="submit">提交</a-button>
    </div>

    <a-modal v-model:open="showTransfer" title="选择账号" :footer="null" :width="860" :destroy-on-close="true">
      <a-transfer
        v-model:target-keys="targetKeys"
        :data-source="transferData"
        :titles="['可选账号', '已选账号']"
        :list-style="{ width: '380px', height: '440px' }"
        :show-search="true"
        :filter-option="filterTransfer"
        :disabled="selectedAccounts.length >= maxSelect"
        @change="onTransferChange"
        :locale="{ itemsUnit: '', notFoundContent: '暂无数据', searchPlaceholder: '搜索' }"
      >
        <template #children="{ filteredItems, direction, selectedKeys, onItemSelect }">
          <div class="custom-transfer-list">
            <div class="ctl-header">
              <span class="ctl-h-name">账号名称</span>
              <span class="ctl-h-desc">描述</span>
              <span class="ctl-h-region">所属Region</span>
            </div>
            <div class="ctl-body">
              <div
                v-for="item in filteredItems"
                :key="item.key"
                class="ctl-row"
                :class="{ active: selectedKeys.includes(item.key) }"
                @click="onItemSelect(item.key)"
              >
                <span class="ctl-name">{{ item.title }}</span>
                <span class="ctl-desc">{{ item.desc }}</span>
                <span class="ctl-region">{{ item.region }}</span>
              </div>
              <div v-if="!filteredItems.length" class="ctl-empty">暂无数据</div>
            </div>
          </div>
        </template>
      </a-transfer>
      <div style="margin-top: 16px; text-align: right">
        <a-button style="margin-right: 8px" @click="showTransfer = false">取消</a-button>
        <a-button type="primary" @click="confirmTransfer">确定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const maxSelect = 4

const sections = reactive({
  basic: true,
  accounts: true,
})

const form = reactive({
  forOther: true,
  users: [],
  accountType: 'op',
  applyType: 'login',
  dateRange: [],
  expireRemind: true,
  remindMethods: ['site', 'email'],
  reason: '',
})

const userOptions = ['zhangsan', 'lisi', 'wangwu', 'zhaoliu', 'sunqi']

const showTransfer = ref(false)
const targetKeys = ref([])
const transferData = ref([
  { key: '1', title: 'op_svc_sdr', region: 'Region-A', desc: '--', mgmtStatus: '仅保存', acctType: '混用', tenant: 'op_svc_sdr', app: 'FusionSphere', subApp: 'APICOM', statusLabel: '正常' },
  { key: '2', title: 'op_svc_ecs', region: 'Region-A', desc: '--', mgmtStatus: '仅保存', acctType: '混用', tenant: 'op_svc_ecs', app: 'FusionSphere', subApp: 'APICOM', statusLabel: '正常' },
  { key: '3', title: 'op_svc_obs', region: 'Region-B', desc: '对象存储服务', mgmtStatus: '已纳管', acctType: '人机', tenant: 'op_svc_obs', app: 'FusionSphere', subApp: 'OBS', statusLabel: '正常' },
  { key: '4', title: 'op_svc_vpc', region: 'Region-A', desc: '--', mgmtStatus: '仅保存', acctType: '混用', tenant: 'op_svc_vpc', app: 'FusionSphere', subApp: 'VPC', statusLabel: '正常' },
  { key: '5', title: 'op_svc_iam', region: 'Region-B', desc: '身份认证服务', mgmtStatus: '已纳管', acctType: '人机', tenant: 'op_svc_iam', app: 'FusionSphere', subApp: 'IAM', statusLabel: '检测中' },
  { key: '6', title: 'op_svc_dns', region: 'Region-C', desc: '--', mgmtStatus: '仅保存', acctType: '混用', tenant: 'op_svc_dns', app: 'FusionSphere', subApp: 'DNS', statusLabel: '无法访问' },
  { key: '7', title: 'op_svc_lb', region: 'Region-A', desc: '负载均衡服务', mgmtStatus: '已纳管', acctType: '人机', tenant: 'op_svc_lb', app: 'FusionSphere', subApp: 'ELB', statusLabel: '正常' },
  { key: '8', title: 'op_svc_cdn', region: 'Region-C', desc: '--', mgmtStatus: '仅保存', acctType: '混用', tenant: 'op_svc_cdn', app: 'FusionSphere', subApp: 'CDN', statusLabel: '正常' },
])

const selectedAccounts = ref([])

function filterTransfer(inputValue, item) {
  return item.title.indexOf(inputValue) !== -1 || item.desc.indexOf(inputValue) !== -1 || item.region.indexOf(inputValue) !== -1
}

function onTransferChange(nextTargetKeys, direction, moveKeys) {
  targetKeys.value = nextTargetKeys
}

function confirmTransfer() {
  const newItems = transferData.value.filter(d => targetKeys.value.includes(d.key))
  const existingIds = new Set(selectedAccounts.value.map(a => a.id))
  selectedAccounts.value = newItems.map(d => ({
    id: d.key,
    name: d.title,
    region: d.region,
    mgmtStatus: d.mgmtStatus,
    acctType: d.acctType,
    tenant: d.tenant,
    app: d.app,
    subApp: d.subApp,
    desc: d.desc,
    statusLabel: d.statusLabel,
  }))
  showTransfer.value = false
}

function removeAccount(record) {
  const idx = selectedAccounts.value.findIndex(a => a.id === record.id)
  if (idx !== -1) selectedAccounts.value.splice(idx, 1)
  targetKeys.value = selectedAccounts.value.map(a => String(a.id))
}

const accountColumns = [
  { title: '账号名', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'statusLabel', key: 'status', width: 80 },
  { title: '管理状态', dataIndex: 'mgmtStatus', key: 'mgmtStatus' },
  { title: '账号类型', dataIndex: 'acctType', key: 'acctType' },
  { title: '所属租户', dataIndex: 'tenant', key: 'tenant' },
  { title: '应用/云服务', dataIndex: 'app', key: 'app' },
  { title: '子应用/云服务', dataIndex: 'subApp', key: 'subApp' },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
  { title: '操作', key: 'action', width: 60 },
]

function goBack() {
  router.push('/ops/account/apply/history')
}

function submit() {
  goBack()
}
</script>

<style scoped>
.create-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.create-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 11px 24px;
  border-bottom: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}
.create-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.create-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-sec);
}

.collapsible-section {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  margin-bottom: 16px;
  overflow: hidden;
}
.collapsible-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  background: var(--bg);
  border-bottom: 1px solid transparent;
}
.collapsible-header i {
  font-size: 12px;
  color: #8c8c8c;
  width: 12px;
}
.collapsible-section.open .collapsible-header {
  border-bottom-color: var(--border);
}
.collapsible-body {
  display: none;
  padding: 16px 24px;
}
.collapsible-section.open .collapsible-body {
  display: block;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.5;
}
.link-blue {
  color: var(--brand);
  cursor: pointer;
  font-size: 13px;
}
.link-blue:hover { opacity: 0.8; }

.select-account-area {
  padding: 4px 0;
}
.select-account-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.select-info {
  font-size: 13px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 8px;
}
.select-divider {
  color: var(--border);
}
.clear-btn {
  margin-left: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 0 12px;
  height: 28px;
  font-size: 12px;
  color: #8c8c8c;
}
.table-footer {
  font-size: 12px;
  color: #8c8c8c;
  padding: 8px 0;
  text-align: right;
}

.status-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #52c41a; }
.dot-yellow { background: #fa8c16; }
.dot-red { background: #f5222d; }
.dot-blue { background: #1890ff; }

.create-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}

.red { color: red; }

:deep(.custom-transfer-list) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
:deep(.ctl-header) {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  gap: 12px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}
:deep(.ctl-body) {
  flex: 1;
  overflow-y: auto;
}
:deep(.ctl-row) {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}
:deep(.ctl-row:hover) { background: #fafafa; }
:deep(.ctl-row.active) { background: var(--brand-subtle); }
:deep(.ctl-name) { font-weight: 600; color: var(--text); }
:deep(.ctl-desc) { color: #8c8c8c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.ctl-region) { color: var(--text); font-size: 13px; }
:deep(.ctl-empty) {
  padding: 24px;
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
}
:deep(.ant-transfer-list) { display: flex; flex-direction: column; }
:deep(.ant-transfer-list-body) { flex: 1; display: flex; flex-direction: column; }
:deep(.ant-transfer-list-body-search-wrapper) { flex-shrink: 0; }
:deep(.ant-transfer-list-content) { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
:deep(.ant-transfer-list-content-item) { padding: 0 !important; min-height: auto !important; border: none !important; }
:deep(.ant-transfer-list-content-item:not(:last-child)) { border: none !important; }
:deep(.ant-transfer-list-header) { flex-shrink: 0; }
:deep(.ant-transfer-list-header-selected) { display: none; }
:deep(.ant-transfer-list-body-customize-wrapper) { flex: 1; min-height: 0; }

:deep(.ant-table-thead > tr > th) { background: var(--bg); font-size: 13px; font-weight: 500; color: var(--text); border-bottom: 1px solid var(--border); }
:deep(.ant-table-tbody > tr > td) { font-size: 13px; }
:deep(.ant-table-tbody > tr:nth-child(even) > td) { background: #fafafa; }
:deep(.ant-table-tbody > tr:hover > td) { background: var(--brand-subtle) !important; }

@media (max-width: 768px) {
  .create-header { padding: 11px 16px; }
  .create-body { padding: 16px; }
  .create-footer { padding: 12px 16px; }
  .create-footer .ant-btn { flex: 1; }
  .collapsible-body { padding: 12px 16px; }
  .select-account-top { flex-wrap: wrap; }
  .clear-btn { margin-left: 0; }
}
</style>
