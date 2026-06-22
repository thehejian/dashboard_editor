<template>
  <div class="page-view">
    <div class="filter-actions-bar">
      <a-button type="primary"><i class="fa-solid fa-plus"></i> 新增扩展</a-button>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="content-tabs">
      <a-tab-pane key="integrations" tab="集成配置">
        <a-table
          :columns="integrationColumns"
          :data-source="integrations"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : record.status === 'testing' ? 'orange' : 'default'">
                {{ record.status === 'active' ? '已启用' : record.status === 'testing' ? '测试中' : '未启用' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <div class="action-btns">
                <a-tooltip title="测试连接"><button class="icon-btn"><i class="fa-solid fa-plug"></i></button></a-tooltip>
                <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="webhooks" tab="Webhook">
        <a-table
          :columns="webhookColumns"
          :data-source="webhooks"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1100 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'method'">
              <a-tag :color="record.method === 'POST' ? 'blue' : 'default'">{{ record.method }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" />
            </template>
            <template v-if="column.key === 'action'">
              <div class="action-btns">
                <a-tooltip title="测试"><button class="icon-btn"><i class="fa-solid fa-paper-plane"></i></button></a-tooltip>
                <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
                <a-tooltip title="删除"><button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button></a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="enrichment" tab="告警 enrich 规则">
        <a-table
          :columns="enrichColumns"
          :data-source="enrichRules"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" />
            </template>
            <template v-if="column.key === 'action'">
              <div class="action-btns">
                <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
                <a-tooltip title="删除"><button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button></a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const activeTab = ref('integrations')
const scrollY = ref(500)

const integrations = ref([
  { id: 1, name: 'Prometheus', type: '监控系统', config: 'http://prometheus:9090', status: 'active', description: '对接Prometheus告警规则', lastSync: '2026-06-17 10:30' },
  { id: 2, name: 'Grafana', type: '可视化', config: 'http://grafana:3000', status: 'active', description: '告警Dashboard联动', lastSync: '2026-06-17 10:28' },
  { id: 3, name: 'Jira', type: '工单系统', config: 'https://jira.example.com', status: 'testing', description: '告警自动创建Jira工单', lastSync: '2026-06-17 09:00' },
  { id: 4, name: 'ServiceNow', type: 'ITSM', config: 'https://servicenow.example.com', status: 'inactive', description: '企业级服务管理对接', lastSync: '-' },
  { id: 5, name: 'Zabbix', type: '监控系统', config: 'http://zabbix:8080', status: 'active', description: 'Zabbix告警同步', lastSync: '2026-06-17 10:25' },
  { id: 6, name: 'GitHub', type: '代码管理', config: 'https://api.github.com', status: 'inactive', description: '告警关联Issue/PR', lastSync: '-' },
])

const webhooks = ref([
  { id: 1, name: '企业微信群机器人', url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc123', method: 'POST', events: ['trigger', 'resolve'], enabled: true, description: '所有告警状态变更通知到企微群' },
  { id: 2, name: '飞书告警群', url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xyz789', method: 'POST', events: ['trigger', 'escalate'], enabled: true, description: '仅紧急告警和升级通知到飞书群' },
  { id: 3, name: '钉钉运维机器人', url: 'https://oapi.dingtalk.com/robot/send?token=def456', method: 'POST', events: ['trigger', 'resolve', 'mute'], enabled: true, description: '全部告警事件通知到钉钉' },
  { id: 4, name: '自研CMDB', url: 'http://cmdb.internal/api/v1/alerts/webhook', method: 'POST', events: ['trigger'], enabled: false, description: '告警触发时更新CMDB CI状态' },
  { id: 5, name: 'Slack告警频道', url: 'https://hooks.slack.com/services/T00/B00/xxx', method: 'POST', events: ['trigger', 'resolve'], enabled: false, description: '海外团队Slack告警通知' },
])

const enrichRules = ref([
  { id: 1, name: '自动添加业务线标签', type: '标签', rule: 'resource LIKE %db-% → business_line = "数据库"', enabled: true, description: '数据库相关资源自动标记业务线' },
  { id: 2, name: '自动添加团队标签', type: '标签', rule: 'resource LIKE %app-% → team = "应用组"', enabled: true, description: '应用服务器自动标记所属团队' },
  { id: 3, name: '静默重复告警', type: '去重', rule: '同一规则+同一资源 1小时内 → 合并', enabled: true, description: '相同告警在短时间内去重合并' },
  { id: 4, name: '告警升级规则', type: '升级', rule: '告警持续2小时未处理 → 自动升级至管理层', enabled: false, description: '长时间未处理的告警自动升级' },
  { id: 5, name: '维护窗口忽略', type: '过滤', rule: '资源在维护窗口期 → 屏蔽告警', enabled: true, description: '维护中的资源自动屏蔽告警' },
  { id: 6, name: 'IP到主机名解析', type: '字段', rule: 'source_ip → 查询DNS → 添加hostname字段', enabled: true, description: '告警中IP地址自动解析为主机名' },
])

const integrationColumns = [
  { title: '集成名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
  { title: '配置地址', dataIndex: 'config', key: 'config', ellipsis: true, width: 250 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 200 },
  { title: '状态', key: 'status', width: 90 },
  { title: '最后同步', dataIndex: 'lastSync', key: 'lastSync', width: 160 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' },
]

const webhookColumns = [
  { title: 'Webhook名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true, width: 300 },
  { title: '方法', key: 'method', width: 70 },
  { title: '事件', dataIndex: 'events', key: 'events', ellipsis: true, width: 180 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 200 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

const enrichColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '规则表达式', dataIndex: 'rule', key: 'rule', ellipsis: true, width: 300 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 200 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})

onUnmounted(function() {
  window.removeEventListener('resize', updateScrollY)
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 0 0; height: 100%; }
.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-shrink: 0; justify-content: flex-end; }
.content-tabs { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.content-tabs :deep(.ant-tabs-nav) { margin: 0 0 16px 0 !important; }
.content-tabs :deep(.ant-tabs-content-holder) { flex: 1; min-height: 0; overflow: auto; }
.content-tabs :deep(.ant-tabs-content) { height: 100%; }
.content-tabs :deep(.ant-tabs-tabpane) { height: 100%; }
:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }
.icon-btn.danger:hover { color: #f5222d; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
