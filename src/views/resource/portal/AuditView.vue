<template>
  <div>
    <div class="page-header"><h3>配置审计与合规</h3></div>

    <div class="kpi-bar">
      <div class="kpi-card red"><div class="kpi-number">{{ auditKpi.critical }}</div><div class="kpi-label">极高风险</div></div>
      <div class="kpi-card orange"><div class="kpi-number">{{ auditKpi.high }}</div><div class="kpi-label">高风险</div></div>
      <div class="kpi-card yellow"><div class="kpi-number">{{ auditKpi.mid }}</div><div class="kpi-label">中风险</div></div>
      <div class="kpi-card blue"><div class="kpi-number">{{ auditKpi.low }}</div><div class="kpi-label">低风险</div></div>
      <div class="kpi-card green"><div class="kpi-number">{{ auditKpi.autoFixRate }}%</div><div class="kpi-label">自动修正率</div></div>
    </div>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="rules" tab="审计规则配置">
        <div class="tab-toolbar">
          <a-button type="primary" @click="showRuleDrawer()"><i class="fa-solid fa-plus"></i> 创建审计规则</a-button>
          <a-button><i class="fa-solid fa-bolt"></i> 触发全量巡检</a-button>
          <a-button><i class="fa-solid fa-download"></i> 导出审计报告</a-button>
          <a-select v-model:value="ruleFilter" placeholder="触发类型" style="width: 130px" allowClear>
            <a-select-option value="定时">定时</a-select-option>
            <a-select-option value="事件触发">事件触发</a-select-option>
          </a-select>
        </div>
        <a-table :columns="ruleColumns" :data-source="rules" :pagination="{ pageSize: 10 }" row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'riskLevel'">
              <a-tag :color="riskColor(record.riskLevel)">{{ record.riskLevel }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" size="small" />
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="showRuleDrawer(record)">编辑</a-button>
              <a-button type="link" size="small" danger>删除</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="violations" tab="审计历史与违规列表">
        <div class="tab-toolbar">
          <a-select v-model:value="violationRisk" placeholder="风险等级" style="width: 130px" allowClear>
            <a-select-option value="极高">极高</a-select-option>
            <a-select-option value="高">高</a-select-option>
            <a-select-option value="中">中</a-select-option>
            <a-select-option value="低">低</a-select-option>
          </a-select>
          <a-select v-model:value="violationStatus" placeholder="状态" style="width: 130px" allowClear>
            <a-select-option value="待修复">待修复</a-select-option>
            <a-select-option value="已修复">已修复</a-select-option>
            <a-select-option value="已忽略">已忽略</a-select-option>
          </a-select>
        </div>
        <a-table :columns="violationColumns" :data-source="violations" :pagination="{ pageSize: 10 }" row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'riskLevel'">
              <a-tag :color="riskColor(record.riskLevel)">{{ record.riskLevel }}</a-tag>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === '待修复' ? 'error' : record.status === '已修复' ? 'success' : 'default'">{{ record.status }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="primary" size="small" danger v-if="record.status === '待修复'" @click="fixViolation(record)">一键修正</a-button>
              <a-button type="link" size="small" v-if="record.status === '待修复'">忽略</a-button>
              <a-button type="link" size="small" @click="showViolationDetail(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="fixRecords" tab="自动修正执行记录">
        <a-table :columns="fixColumns" :data-source="fixRecords" :pagination="{ pageSize: 10 }" row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'result'">
              <a-tag :color="record.result === '成功' ? 'success' : record.result === '失败' ? 'error' : 'warning'">{{ record.result }}</a-tag>
            </template>
            <template v-if="column.key === 'mode'">
              <a-tag :color="record.mode === '测试模式' ? 'processing' : 'success'">{{ record.mode }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <a-drawer v-model:open="ruleDrawerOpen" :title="editingRule ? '编辑审计规则' : '创建审计规则'" :width="600" @close="onRuleDrawerClose">
      <a-form layout="vertical">
        <a-divider orientation="left">基本信息</a-divider>
        <a-form-item label="规则名称"><a-input v-model:value="ruleForm.name" placeholder="输入规则名称" /></a-form-item>
        <a-form-item label="规则描述"><a-textarea v-model:value="ruleForm.desc" :rows="2" placeholder="输入规则描述" /></a-form-item>
        <a-form-item label="风险等级">
          <a-select v-model:value="ruleForm.riskLevel" placeholder="选择风险等级">
            <a-select-option value="极高">极高</a-select-option>
            <a-select-option value="高">高</a-select-option>
            <a-select-option value="中">中</a-select-option>
            <a-select-option value="低">低</a-select-option>
          </a-select>
        </a-form-item>
        <a-divider orientation="left">触发机制</a-divider>
        <a-form-item label="触发类型">
          <a-select v-model:value="ruleForm.triggerType" placeholder="选择触发类型">
            <a-select-option value="定时">定时</a-select-option>
            <a-select-option value="事件触发">事件触发</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Cron表达式"><a-input v-model:value="ruleForm.cron" placeholder="0 0 * * *" /></a-form-item>
        <a-divider orientation="left">策略与逻辑参数</a-divider>
        <a-form-item label="策略类型">
          <a-select v-model:value="ruleForm.strategyType" placeholder="选择策略类型">
            <a-select-option value="合规基线">合规基线</a-select-option>
            <a-select-option value="安全扫描">安全扫描</a-select-option>
            <a-select-option value="配置检查">配置检查</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="规则参数JSON"><a-textarea v-model:value="ruleForm.params" :rows="3" placeholder='{"key":"value"}' /></a-form-item>
        <a-divider orientation="left">处理与修正策略</a-divider>
        <a-form-item label="修正方式">
          <a-select v-model:value="ruleForm.fixMethod" placeholder="选择修正方式">
            <a-select-option value="自动修正">自动修正</a-select-option>
            <a-select-option value="人工审核">人工审核</a-select-option>
            <a-select-option value="仅告警">仅告警</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Dry-Run测试模式"><a-switch v-model:checked="ruleForm.dryRun" /></a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="ruleDrawerOpen = false">取消</a-button>
        <a-button type="primary" @click="saveRule">保存</a-button>
      </template>
    </a-drawer>

    <a-drawer v-model:open="violationDrawerOpen" title="违规详情" :width="500">
      <a-descriptions :column="1" bordered size="small" v-if="currentViolation">
        <a-descriptions-item label="资源名称">{{ currentViolation.resource }}</a-descriptions-item>
        <a-descriptions-item label="资源IP">{{ currentViolation.ip }}</a-descriptions-item>
        <a-descriptions-item label="触发规则">{{ currentViolation.rule }}</a-descriptions-item>
        <a-descriptions-item label="风险等级"><a-tag :color="riskColor(currentViolation.riskLevel)">{{ currentViolation.riskLevel }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="审计时间">{{ currentViolation.time }}</a-descriptions-item>
        <a-descriptions-item label="状态"><a-tag :color="currentViolation.status === '待修复' ? 'error' : 'success'">{{ currentViolation.status }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="违规详情">{{ currentViolation.detail || '密码不符合安全策略要求，长度不足8位且未包含特殊字符' }}</a-descriptions-item>
      </a-descriptions>
      <template #footer>
        <a-button type="primary" danger v-if="currentViolation?.status === '待修复'">一键修正</a-button>
        <a-button v-if="currentViolation?.status === '待修复'">忽略</a-button>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('rules')
const ruleDrawerOpen = ref(false)
const violationDrawerOpen = ref(false)
const editingRule = ref(null)
const currentViolation = ref(null)
const ruleFilter = ref(null)
const violationRisk = ref(null)
const violationStatus = ref(null)

const auditKpi = ref({ critical: 2, high: 5, mid: 12, low: 45, autoFixRate: 72 })

const rules = ref([
  { id: 1, name: '密码强度检查', riskLevel: '高', triggerType: '定时', strategyType: '合规基线', fixMethod: '自动修正', violations: 5, enabled: true },
  { id: 2, name: 'SSH端口暴露检测', riskLevel: '极高', triggerType: '事件触发', strategyType: '安全扫描', fixMethod: '人工审核', violations: 2, enabled: true },
  { id: 3, name: '磁盘加密检查', riskLevel: '中', triggerType: '定时', strategyType: '配置检查', fixMethod: '仅告警', violations: 8, enabled: true },
  { id: 4, name: '防火墙规则审计', riskLevel: '高', triggerType: '定时', strategyType: '合规基线', fixMethod: '自动修正', violations: 3, enabled: false },
  { id: 5, name: '证书过期检查', riskLevel: '低', triggerType: '定时', strategyType: '配置检查', fixMethod: '仅告警', violations: 15, enabled: true },
])

const violations = ref([
  { id: 1, resource: 'web-server-003', ip: '10.0.2.13', rule: '密码强度检查', riskLevel: '高', time: '2026-06-15 10:00', status: '待修复', detail: '密码长度不足8位' },
  { id: 2, resource: 'db-replica-02', ip: '10.0.3.22', rule: 'SSH端口暴露检测', riskLevel: '极高', time: '2026-06-15 09:30', status: '待修复', detail: 'SSH端口22对公网开放' },
  { id: 3, resource: 'api-gw-01', ip: '10.0.1.50', rule: '磁盘加密检查', riskLevel: '中', time: '2026-06-14 18:00', status: '已修复', detail: '系统盘未启用加密' },
  { id: 4, resource: 'k8s-node-05', ip: '10.0.4.15', rule: '密码强度检查', riskLevel: '高', time: '2026-06-14 14:30', status: '已忽略' },
])

const fixRecords = ref([
  { id: 1, time: '2026-06-15 10:30', rule: '密码强度检查', resource: 'web-server-001', action: '强制重置密码', result: '成功', mode: '正式执行' },
  { id: 2, time: '2026-06-15 10:28', rule: '证书过期检查', resource: 'api-gw-01', action: '自动续期证书', result: '成功', mode: '正式执行' },
  { id: 3, time: '2026-06-14 16:00', rule: '防火墙规则审计', resource: 'db-primary', action: '关闭高危端口', result: 'Dry-Run', mode: '测试模式' },
  { id: 4, time: '2026-06-14 15:30', rule: '磁盘加密检查', resource: 'k8s-node-03', action: '启用磁盘加密', result: '失败', mode: '正式执行' },
])

const ruleForm = ref({ name: '', desc: '', riskLevel: '中', triggerType: '定时', cron: '', strategyType: '合规基线', params: '', fixMethod: '自动修正', dryRun: false })

const ruleColumns = [
  { title: '规则名称', dataIndex: 'name' },
  { title: '风险等级', key: 'riskLevel', width: 100 },
  { title: '触发类型', dataIndex: 'triggerType', width: 100 },
  { title: '策略类型', dataIndex: 'strategyType', width: 110 },
  { title: '修正方式', dataIndex: 'fixMethod', width: 100 },
  { title: '违规数', dataIndex: 'violations', width: 80 },
  { title: '启用', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 120 },
]

const violationColumns = [
  { title: '资源名称', dataIndex: 'resource' },
  { title: 'IP', dataIndex: 'ip', width: 130 },
  { title: '触发规则', dataIndex: 'rule' },
  { title: '风险等级', key: 'riskLevel', width: 90 },
  { title: '审计时间', dataIndex: 'time', width: 160 },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 180 },
]

const fixColumns = [
  { title: '时间', dataIndex: 'time', width: 160 },
  { title: '规则', dataIndex: 'rule' },
  { title: '资源', dataIndex: 'resource' },
  { title: '修正动作', dataIndex: 'action' },
  { title: '执行结果', key: 'result', width: 100 },
  { title: '执行模式', key: 'mode', width: 100 },
]

const riskColor = (level) => ({ '极高': 'error', '高': 'error', '中': 'warning', '低': 'processing' }[level] || 'default')

function showRuleDrawer(rule = null) {
  editingRule.value = rule
  if (rule) {
    ruleForm.value = { name: rule.name, desc: '', riskLevel: rule.riskLevel, triggerType: rule.triggerType, cron: '', strategyType: rule.strategyType, params: '', fixMethod: rule.fixMethod, dryRun: false }
  } else {
    ruleForm.value = { name: '', desc: '', riskLevel: '中', triggerType: '定时', cron: '', strategyType: '合规基线', params: '', fixMethod: '自动修正', dryRun: false }
  }
  ruleDrawerOpen.value = true
}

function onRuleDrawerClose() { editingRule.value = null }

function saveRule() {
  if (editingRule.value) {
    Object.assign(editingRule.value, { name: ruleForm.value.name, riskLevel: ruleForm.value.riskLevel, triggerType: ruleForm.value.triggerType, strategyType: ruleForm.value.strategyType, fixMethod: ruleForm.value.fixMethod })
  } else {
    rules.value.push({ id: Date.now(), name: ruleForm.value.name, riskLevel: ruleForm.value.riskLevel, triggerType: ruleForm.value.triggerType, strategyType: ruleForm.value.strategyType, fixMethod: ruleForm.value.fixMethod, violations: 0, enabled: true })
  }
  ruleDrawerOpen.value = false
}

function showViolationDetail(record) {
  currentViolation.value = record
  violationDrawerOpen.value = true
}

function fixViolation(record) {
  record.status = '已修复'
  fixRecords.value.unshift({ id: Date.now(), time: new Date().toLocaleString(), rule: record.rule, resource: record.resource, action: '自动修正', result: '成功', mode: '正式执行' })
}
</script>

<style scoped>
.kpi-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.kpi-card { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: var(--rl); padding: 14px 16px; text-align: center; }
.kpi-card.red { border-top: 3px solid #f5222d; }
.kpi-card.orange { border-top: 3px solid #fa8c16; }
.kpi-card.yellow { border-top: 3px solid #fadb14; }
.kpi-card.blue { border-top: 3px solid #1890ff; }
.kpi-card.green { border-top: 3px solid #52c41a; }
.kpi-number { font-size: 24px; font-weight: 700; color: var(--text); }
.kpi-card.red .kpi-number { color: #f5222d; }
.kpi-card.orange .kpi-number { color: #fa8c16; }
.kpi-card.green .kpi-number { color: #52c41a; }
.kpi-label { font-size: 12px; color: var(--text-sec); margin-top: 2px; }

.tab-toolbar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
</style>
