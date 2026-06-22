<template>
  <div class="page-view">
    <div class="filter-actions-bar">
      <a-button type="primary"><i class="fa-solid fa-plus"></i> 新建通知</a-button>
    </div>
    <a-tabs v-model:activeKey="activeTab" class="content-tabs">
      <a-tab-pane key="channels" tab="通知渠道">
        <a-table
          :columns="channelColumns"
          :data-source="channels"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <a-tag :color="getChannelColor(record.type)">{{ getChannelText(record.type) }}</a-tag>
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

      <a-tab-pane key="receivers" tab="接收人组">
        <a-table
          :columns="receiverColumns"
          :data-source="receivers"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'methods'">
              <a-tag v-for="m in record.methods" :key="m" :color="getChannelColor(m)" style="margin:2px">{{ getChannelText(m) }}</a-tag>
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

      <a-tab-pane key="templates" tab="通知模板">
        <a-table
          :columns="templateColumns"
          :data-source="templates"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" />
            </template>
            <template v-if="column.key === 'action'">
              <div class="action-btns">
                <a-tooltip title="预览"><button class="icon-btn"><i class="fa-solid fa-eye"></i></button></a-tooltip>
                <a-tooltip title="编辑"><button class="icon-btn"><i class="fa-solid fa-pen"></i></button></a-tooltip>
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

const activeTab = ref('channels')
const scrollY = ref(500)

const channels = ref([
  { id: 1, name: '企业微信机器人', type: 'wechat', url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx', enabled: true, description: '运维企业微信群机器人 webhook', createdAt: '2026-01-15' },
  { id: 2, name: '钉钉机器人', type: 'dingtalk', url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx', enabled: true, description: '运维钉钉告警群', createdAt: '2026-01-15' },
  { id: 3, name: '邮件通知', type: 'email', url: 'smtp://mail.example.com:465', enabled: true, description: '运维团队邮箱告警通知', createdAt: '2026-01-20' },
  { id: 4, name: '短信网关', type: 'sms', url: 'https://sms.api.example.com/send', enabled: false, description: '紧急告警短信通道', createdAt: '2026-02-01' },
  { id: 5, name: '电话语音', type: 'voice', url: 'https://voice.api.example.com/call', enabled: false, description: '紧急告警电话通知', createdAt: '2026-02-10' },
  { id: 6, name: '飞书机器人', type: 'lark', url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx', enabled: true, description: '运维飞书群告警', createdAt: '2026-03-01' },
  { id: 7, name: 'Prometheus Alertmanager', type: 'webhook', url: 'http://alertmanager:9093', enabled: true, description: '对接外部Alertmanager', createdAt: '2026-03-15' },
])

const receivers = ref([
  { id: 1, name: '运维值班组', members: '张工, 李工, 王工', methods: ['wechat', 'sms'], enabled: true, description: '7x24运维值班人员' },
  { id: 2, name: 'DBA组', members: '王工, 赵工', methods: ['email', 'wechat'], enabled: true, description: '数据库管理员组' },
  { id: 3, name: '网络组', members: '李工', methods: ['email', 'dingtalk'], enabled: true, description: '网络运维工程师' },
  { id: 4, name: '开发组', members: '陈工, 刘工, 孙工', methods: ['wechat', 'dingtalk'], enabled: true, description: '应用开发团队' },
  { id: 5, name: '管理层', members: '周总监', methods: ['sms', 'voice'], enabled: false, description: '紧急告警升级至管理层' },
])

const templates = ref([
  { id: 1, name: '默认告警通知', channel: '企业微信', enabled: true, preview: '【告警】CPU使用率超过90%\n资源: server-001\n当前值: 95%\n阈值: > 90%\n时间: 2026-06-17 10:32' },
  { id: 2, name: '紧急告警短信', channel: '短信', enabled: true, preview: '[紧急告警] CPU使用率超过90%，资源: server-001，请立即处理。' },
  { id: 3, name: '邮件详细报告', channel: '邮件', enabled: true, preview: '主题: [告警] CPU使用率超过90%\n正文包含告警详情、处理建议、关联资源信息等' },
  { id: 4, name: '告警恢复通知', channel: '企业微信', enabled: true, preview: '【恢复】CPU使用率超过90%\n资源: server-001\n当前值: 45%\n阈值: > 90%\n恢复时间: 2026-06-17 11:00' },
  { id: 5, name: '告警升级通知', channel: '短信+电话', enabled: false, preview: '[告警升级] 告警已持续2小时未处理，升级至管理层。' },
])

const channelColumns = [
  { title: '渠道名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '类型', key: 'type', width: 90 },
  { title: '地址/配置', dataIndex: 'url', key: 'url', ellipsis: true, width: 280 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 180 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

const receiverColumns = [
  { title: '组名', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '成员', dataIndex: 'members', key: 'members', ellipsis: true, width: 180 },
  { title: '通知方式', key: 'methods', width: 200 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 180 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

const templateColumns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '渠道', dataIndex: 'channel', key: 'channel', width: 90 },
  { title: '预览', dataIndex: 'preview', key: 'preview', ellipsis: true, width: 300 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

const getChannelColor = function(type) {
  var map = { wechat: 'blue', dingtalk: 'blue', email: 'green', sms: 'orange', voice: 'red', lark: 'blue', webhook: 'default' }
  return map[type] || 'default'
}

const getChannelText = function(type) {
  var map = { wechat: '企微', dingtalk: '钉钉', email: '邮件', sms: '短信', voice: '电话', lark: '飞书', webhook: 'Webhook' }
  return map[type] || type
}

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
