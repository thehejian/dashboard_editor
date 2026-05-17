<template>
  <div class="alarm-view">
    <div class="view-header">
      <h1>告警中心</h1>
    </div>

    <div class="alarm-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'realtime' }" @click="activeTab = 'realtime'">
        <i class="fa-solid fa-bell"></i> 实时告警
        <span class="tab-badge" v-if="realtimeAlerts.length">{{ realtimeAlerts.length }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
        <i class="fa-solid fa-clock-rotate-left"></i> 历史告警
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'config' }" @click="activeTab = 'config'">
        <i class="fa-solid fa-gear"></i> 告警配置
      </button>
    </div>

    <!-- 实时告警 -->
    <div class="tab-content" v-if="activeTab === 'realtime'">
      <div class="alert-stats">
        <div class="stat-item critical" @click="filterLevel = 'critical'">
          <span class="stat-value">{{ getCountByLevel('critical') }}</span>
          <span class="stat-label">紧急</span>
        </div>
        <div class="stat-item warning" @click="filterLevel = 'warning'">
          <span class="stat-value">{{ getCountByLevel('warning') }}</span>
          <span class="stat-label">重要</span>
        </div>
        <div class="stat-item info" @click="filterLevel = 'info'">
          <span class="stat-value">{{ getCountByLevel('info') }}</span>
          <span class="stat-label">次要</span>
        </div>
        <div class="stat-item all" @click="filterLevel = ''">
          <span class="stat-value">{{ realtimeAlerts.length }}</span>
          <span class="stat-label">全部</span>
        </div>
      </div>

      <div class="alert-list">
        <div class="alert-item" v-for="alert in filteredAlerts" :key="alert.id" :class="alert.level">
          <div class="alert-icon">
            <i class="fa-solid" :class="{
              'fa-circle-exclamation': alert.level === 'critical',
              'fa-triangle-exclamation': alert.level === 'warning',
              'fa-circle-info': alert.level === 'info'
            }"></i>
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-meta">
              <span class="alert-resource">{{ alert.resource }}</span>
              <span class="alert-time">触发于 {{ alert.triggerTime }}</span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="action-btn" @click="handleAlert(alert.id)" title="处理">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="action-btn" @click="viewDetail(alert)" title="详情">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
        <div v-if="filteredAlerts.length === 0" class="empty-tip">
          <i class="fa-solid fa-check-circle"></i>
          <span>当前无活跃告警</span>
        </div>
      </div>
    </div>

    <!-- 历史告警 -->
    <div class="tab-content" v-if="activeTab === 'history'">
      <div class="filter-bar">
        <a-input-search v-model:value="historySearch" placeholder="搜索告警、资源" style="width: 280px" />
        <a-select v-model:value="historyLevel" placeholder="告警级别" style="width: 120px" allowClear>
          <a-select-option value="critical">紧急</a-select-option>
          <a-select-option value="warning">重要</a-select-option>
          <a-select-option value="info">次要</a-select-option>
        </a-select>
        <a-range-picker v-model:value="historyRange" style="width: 240px" />
      </div>

      <a-table :columns="historyColumns" :data-source="historyData" :pagination="{ pageSize: 10 }" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'resolved' ? 'green' : 'default'">
              {{ record.status === 'resolved' ? '已恢复' : '处理中' }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 告警配置 -->
    <div class="tab-content" v-if="activeTab === 'config'">
      <div class="config-header">
        <a-button type="primary" @click="showRuleModal">
          <i class="fa-solid fa-plus"></i> 新建规则
        </a-button>
      </div>

      <div class="rules-list">
        <div class="rule-item" v-for="rule in rules" :key="rule.id">
          <div class="rule-info">
            <div class="rule-name">{{ rule.name }}</div>
            <div class="rule-desc">{{ rule.description }}</div>
            <div class="rule-meta">
              <a-tag :color="getLevelColor(rule.level)">{{ getLevelText(rule.level) }}</a-tag>
              <span>{{ rule.target }}</span>
            </div>
          </div>
          <div class="rule-actions">
            <a-switch v-model:checked="rule.enabled" />
            <button class="icon-btn" @click="editRule(rule)"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn danger" @click="deleteRule(rule.id)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 告警详情抽屉 -->
    <a-drawer v-model:open="detailVisible" title="告警详情" width="480">
      <div class="detail-content" v-if="currentAlert">
        <div class="detail-row">
          <span class="label">告警标题</span>
          <span class="value">{{ currentAlert.title }}</span>
        </div>
        <div class="detail-row">
          <span class="label">告警级别</span>
          <a-tag :color="getLevelColor(currentAlert.level)">{{ getLevelText(currentAlert.level) }}</a-tag>
        </div>
        <div class="detail-row">
          <span class="label">监控资源</span>
          <span class="value">{{ currentAlert.resource }}</span>
        </div>
        <div class="detail-row">
          <span class="label">触发时间</span>
          <span class="value">{{ currentAlert.triggerTime }}</span>
        </div>
        <div class="detail-row">
          <span class="label">当前值</span>
          <span class="value">{{ currentAlert.currentValue }}</span>
        </div>
        <div class="detail-row">
          <span class="label">阈值</span>
          <span class="value">{{ currentAlert.threshold }}</span>
        </div>
        <div class="detail-row">
          <span class="label">持续时间</span>
          <span class="value">{{ currentAlert.duration }}</span>
        </div>
      </div>
    </a-drawer>

    <!-- 新建规则弹窗 -->
    <a-modal v-model:open="ruleModalVisible" title="新建告警规则" @ok="saveRule" :confirmLoading="saving">
      <a-form :model="ruleForm" layout="vertical">
        <a-form-item label="规则名称" required>
          <a-input v-model:value="ruleForm.name" placeholder="请输入规则名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="ruleForm.description" placeholder="请输入描述" :rows="2" />
        </a-form-item>
        <a-form-item label="告警级别" required>
          <a-select v-model:value="ruleForm.level" placeholder="选择级别">
            <a-select-option value="critical">紧急</a-select-option>
            <a-select-option value="warning">重要</a-select-option>
            <a-select-option value="info">次要</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="监控对象">
          <a-input v-model:value="ruleForm.target" placeholder="如: CPU使用率" />
        </a-form-item>
        <a-form-item label="阈值条件">
          <a-input v-model:value="ruleForm.condition" placeholder="如: > 90%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('realtime')
const filterLevel = ref('')
const detailVisible = ref(false)
const currentAlert = ref(null)
const ruleModalVisible = ref(false)
const saving = ref(false)

const historySearch = ref('')
const historyLevel = ref(null)
const historyRange = ref(null)

const realtimeAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', triggerTime: '10:32', currentValue: '95%', threshold: '> 90%', duration: '5分钟' },
  { id: 2, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', triggerTime: '10:28', currentValue: '92%', threshold: '> 90%', duration: '12分钟' },
  { id: 3, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', triggerTime: '10:15', currentValue: '82%', threshold: '> 80%', duration: '20分钟' },
  { id: 4, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', triggerTime: '09:45', currentValue: '2500ms', threshold: '> 2000ms', duration: '1小时' },
  { id: 5, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', triggerTime: '09:20', currentValue: '85%', threshold: '> 80%', duration: '2小时' },
])

const historyData = ref([
  { id: 101, level: 'critical', title: '网络延迟过高', resource: 'lb-001', time: '2026-05-17 08:30', duration: '15分钟', status: 'resolved' },
  { id: 102, level: 'warning', title: '数据库连接池满', resource: 'db-002', time: '2026-05-16 14:20', duration: '30分钟', status: 'resolved' },
  { id: 103, level: 'info', title: '证书即将过期', resource: 'ingress-001', time: '2026-05-15 10:00', duration: '2天', status: 'resolved' },
  { id: 104, level: 'critical', title: '服务不可用', resource: 'payment-svc', time: '2026-05-14 16:45', duration: '45分钟', status: 'resolved' },
])

const rules = ref([
  { id: 1, name: 'CPU告警', description: 'CPU使用率超过阈值时触发', level: 'critical', target: 'CPU使用率', condition: '> 90%', enabled: true },
  { id: 2, name: '内存告警', description: '内存使用率超过阈值时触发', level: 'warning', target: '内存使用率', condition: '> 80%', enabled: true },
  { id: 3, name: '磁盘告警', description: '磁盘空间不足时触发', level: 'critical', target: '磁盘使用率', condition: '> 90%', enabled: true },
  { id: 4, name: '网络延迟告警', description: '网络延迟超过阈值时触发', level: 'warning', target: '延迟', condition: '> 200ms', enabled: false },
])

const ruleForm = ref({ name: '', description: '', level: '', target: '', condition: '' })

const historyColumns = [
  { title: '告警标题', dataIndex: 'title', key: 'title' },
  { title: '资源', dataIndex: 'resource', key: 'resource' },
  { title: '级别', dataIndex: 'level', key: 'level' },
  { title: '触发时间', dataIndex: 'time', key: 'time' },
  { title: '持续时间', dataIndex: 'duration', key: 'duration' },
  { title: '状态', dataIndex: 'status', key: 'status' },
]

const getCountByLevel = (level) => {
  if (!level) return realtimeAlerts.value.length
  return realtimeAlerts.value.filter(a => a.level === level).length
}

const filteredAlerts = computed(() => {
  if (!filterLevel.value) return realtimeAlerts.value
  return realtimeAlerts.value.filter(a => a.level === filterLevel.value)
})

const getLevelColor = (level) => {
  const map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}

const getLevelText = (level) => {
  const map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}

const handleAlert = (id) => {
  realtimeAlerts.value = realtimeAlerts.value.filter(a => a.id !== id)
}

const viewDetail = (alert) => {
  currentAlert.value = alert
  detailVisible.value = true
}

const showRuleModal = () => {
  ruleForm.value = { name: '', description: '', level: '', target: '', condition: '' }
  ruleModalVisible.value = true
}

const editRule = (rule) => {
  ruleForm.value = { ...rule }
  ruleModalVisible.value = true
}

const saveRule = () => {
  saving.value = true
  setTimeout(() => {
    if (ruleForm.value.id) {
      const idx = rules.value.findIndex(r => r.id === ruleForm.value.id)
      if (idx > -1) rules.value[idx] = { ...ruleForm.value }
    } else {
      rules.value.push({ ...ruleForm.value, id: Date.now(), enabled: true })
    }
    saving.value = false
    ruleModalVisible.value = false
  }, 500)
}

const deleteRule = (id) => {
  rules.value = rules.value.filter(r => r.id !== id)
}
</script>

<style scoped>
.alarm-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.view-header { margin-bottom: 20px; }
.view-header h1 { font-size: 24px; font-weight: 600; margin: 0; }

.alarm-tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
.tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: none; background: transparent; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-radius: 6px; transition: all 0.15s; }
.tab-btn:hover { background: var(--bg-sec); color: var(--text); }
.tab-btn.active { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
.tab-badge { background: var(--danger); color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 10px; }

.alert-stats { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item { flex: 1; padding: 16px; background: var(--bg-card); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.15s; border: 2px solid transparent; }
.stat-item:hover { border-color: var(--brand); }
.stat-item.critical { border-left: 3px solid #f5222d; }
.stat-item.warning { border-left: 3px solid #fa8c16; }
.stat-item.info { border-left: 3px solid #1890ff; }
.stat-value { display: block; font-size: 28px; font-weight: 600; }
.stat-label { font-size: 12px; color: var(--text-secondary); }

.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-card); border-radius: 8px; border-left: 4px solid; }
.alert-item.critical { border-left-color: #f5222d; }
.alert-item.warning { border-left-color: #fa8c16; }
.alert-item.info { border-left-color: #1890ff; }
.alert-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.alert-item.critical .alert-icon { background: #fff1f0; color: #f5222d; }
.alert-item.warning .alert-icon { background: #fff7e6; color: #fa8c16; }
.alert-item.info .alert-icon { background: #e6f7ff; color: #1890ff; }
.alert-content { flex: 1; }
.alert-title { font-weight: 500; margin-bottom: 4px; }
.alert-meta { font-size: 12px; color: var(--text-secondary); display: flex; gap: 16px; }
.alert-actions { display: flex; gap: 8px; }
.action-btn { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; cursor: pointer; color: var(--text-secondary); }
.action-btn:hover { border-color: var(--brand); color: var(--brand); }

.empty-tip { text-align: center; padding: 40px; color: var(--text-secondary); }
.empty-tip i { font-size: 32px; margin-bottom: 8px; display: block; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 20px; }

.config-header { margin-bottom: 20px; }

.rules-list { display: flex; flex-direction: column; gap: 12px; }
.rule-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.rule-name { font-weight: 500; margin-bottom: 4px; }
.rule-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.rule-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--text-secondary); }
.rule-actions { display: flex; gap: 12px; align-items: center; }
.icon-btn { width: 32px; height: 32px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
.icon-btn:hover { background: var(--bg-sec); color: var(--text); }
.icon-btn.danger:hover { background: #fff1f0; color: #f5222d; }

.detail-content { display: flex; flex-direction: column; gap: 16px; }
.detail-row { display: flex; gap: 12px; }
.detail-row .label { width: 80px; color: var(--text-secondary); flex-shrink: 0; }
.detail-row .value { flex: 1; }
</style>