<template>
  <div class="page-view">
    <a-tabs v-model:activeKey="activeTab" class="page-tabs">
      <a-tab-pane key="current" tab="当前告警">
        <div class="current-alerts">
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-card-title">级别统计</div>
              <div ref="donutContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">告警状态</div>
              <div ref="barContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">告警持续时长</div>
              <div ref="durationContainer" class="chart-container"></div>
            </div>
            <div class="stat-card">
              <div class="stat-card-title">TOP N 告警</div>
              <div ref="topnContainer" class="chart-container"></div>
            </div>
          </div>

          <div class="filter-bar">
            <a-select v-model:value="templateValue" placeholder="选择模板" style="width:320px" allowClear>
              <a-select-option value="default">默认模板</a-select-option>
              <a-select-option value="critical">仅紧急告警</a-select-option>
              <a-select-option value="warning">重要告警</a-select-option>
            </a-select>
            <a-select v-model:value="refreshInterval" placeholder="刷新频率" style="width:130px">
              <a-select-option :value="30">30秒刷新</a-select-option>
              <a-select-option :value="60">60秒刷新</a-select-option>
              <a-select-option :value="0">不刷新</a-select-option>
            </a-select>
            <a-input-search v-model:value="searchText" placeholder="搜索告警名称、资源" class="search-input" />
            <a-button type="primary"><i class="fa-solid fa-volume-off"></i></a-button>
          </div>

          <a-table
            :columns="columns"
            :data-source="filteredAlerts"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            :row-selection="{ selectedRowKeys: selectedKeys, onChange: function(keys) { selectedKeys = keys } }"
            row-key="id"
            :row-class-name="function(record) { return 'row-' + record.level }"
            :scroll="{ x: 1400, y: scrollY }"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
              </template>
              <template v-if="column.key === 'title'">
                <a class="alert-link" @click="openDetail(record)">{{ record.title }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'firing' ? 'red' : record.status === 'resolved' ? 'green' : 'default'">
                  {{ record.status === 'firing' ? '告警中' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-btns">
                  <a-tooltip title="查看详情">
                    <button class="icon-btn" @click="openDetail(record)"><i class="fa-solid fa-eye"></i></button>
                  </a-tooltip>
                  <a-tooltip title="处理告警">
                    <button class="icon-btn" @click="handleAlert(record.id)"><i class="fa-solid fa-check"></i></button>
                  </a-tooltip>
                </div>
              </template>
            </template>
          </a-table>


        </div>
      </a-tab-pane>

      <a-tab-pane key="history" tab="历史告警">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-range-picker v-model:value="historyTimeRange" style="width:260px" />
            <a-input-search v-model:value="historySearch" placeholder="搜索告警名称、资源" style="width:280px" />
            <a-select v-model:value="historyLevel" placeholder="告警级别" style="width:120px" allowClear>
              <a-select-option value="critical">紧急</a-select-option>
              <a-select-option value="warning">重要</a-select-option>
              <a-select-option value="info">次要</a-select-option>
            </a-select>
          </div>
          <a-table
            :columns="historyColumns"
            :data-source="historyFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 900 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
              <template v-if="column.key === 'status'"><a-tag :color="record.status === 'resolved' ? 'green' : 'default'">{{ record.status === 'resolved' ? '已恢复' : '处理中' }}</a-tag></template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="suppressed" tab="被屏蔽的告警">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-button type="primary"><i class="fa-solid fa-rotate"></i> 取消屏蔽</a-button>
          </div>
          <div class="filter-bar">
            <a-range-picker v-model:value="suppressedTimeRange" style="width:260px" />
            <a-select v-model:value="suppressedLevel" placeholder="告警级别" style="width:120px" allowClear>
              <a-select-option value="critical">紧急</a-select-option>
              <a-select-option value="warning">重要</a-select-option>
              <a-select-option value="info">次要</a-select-option>
            </a-select>
            <a-input-search v-model:value="suppressedSearch" placeholder="搜索告警名称、资源" class="search-input" />
          </div>
          <a-table
            :columns="suppressedColumns"
            :data-source="suppressedFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 1100 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
              <template v-if="column.key === 'status'"><a-tag color="default">已屏蔽</a-tag></template>
              <template v-if="column.key === 'action'">
                <div class="action-btns">
                  <a-tooltip title="查看详情"><button class="icon-btn" @click="openDetail(record)"><i class="fa-solid fa-eye"></i></button></a-tooltip>
                  <a-tooltip title="取消屏蔽"><button class="icon-btn" @click="unmuteAlert(record.id)"><i class="fa-solid fa-volume-off"></i></button></a-tooltip>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="logs" tab="告警日志">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-range-picker v-model:value="logsTimeRange" style="width:260px" />
            <a-select v-model:value="logsType" placeholder="日志类型" style="width:120px" allowClear>
              <a-select-option value="trigger">触发</a-select-option>
              <a-select-option value="resolve">恢复</a-select-option>
              <a-select-option value="mute">屏蔽</a-select-option>
              <a-select-option value="unmute">取消屏蔽</a-select-option>
              <a-select-option value="handle">处理</a-select-option>
            </a-select>
            <a-input-search v-model:value="logsSearch" placeholder="搜索操作人、告警" class="search-input" />
          </div>
          <a-table
            :columns="logsColumns"
            :data-source="logsFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 1000 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
              </template>
              <template v-if="column.key === 'level'"><a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag></template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="experience" tab="维护经验">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-button type="primary"><i class="fa-solid fa-plus"></i> 新增经验</a-button>
          </div>
          <div class="filter-bar">
            <a-select v-model:value="expCategory" placeholder="分类" style="width:120px" allowClear>
              <a-select-option value="cpu">CPU</a-select-option>
              <a-select-option value="memory">内存</a-select-option>
              <a-select-option value="disk">磁盘</a-select-option>
              <a-select-option value="network">网络</a-select-option>
              <a-select-option value="database">数据库</a-select-option>
              <a-select-option value="other">其他</a-select-option>
            </a-select>
            <a-input-search v-model:value="expSearch" placeholder="搜索经验标题、关键词" class="search-input" />
          </div>
          <a-table
            :columns="expColumns"
            :data-source="expFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 900 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'category'">
                <a-tag>{{ record.category }}</a-tag>
              </template>
              <template v-if="column.key === 'helpful'">
                <a-tooltip :title="'被采纳 ' + record.helpful + ' 次'">
                  <a-icon type="thumb-up" /><span style="margin-left:4px">{{ record.helpful }}</span>
                </a-tooltip>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <div class="detail-panel" :class="{ open: detailVisible }">
      <div class="detail-mask" @click="detailVisible = false"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ currentAlert ? currentAlert.title : '告警详情' }}</h3>
          <button class="close-btn" @click="detailVisible = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="detail-body" v-if="currentAlert">
          <a-tabs v-model:activeKey="activeDetailTab" class="detail-tabs-comp">
            <a-tab-pane key="info" tab="告警详情和处理建议">
              <div class="tab-panel">
                <div class="detail-kpi">
                  <div class="kpi-item">
                    <div class="kpi-label">告警级别</div>
                    <div class="kpi-value"><a-tag :color="getLevelColor(currentAlert.level)">{{ getLevelText(currentAlert.level) }}</a-tag></div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">告警状态</div>
                    <div class="kpi-value">
                      <a-tag :color="currentAlert.status === 'firing' ? 'red' : 'green'">
                        {{ currentAlert.status === 'firing' ? '告警中' : '已恢复' }}
                      </a-tag>
                    </div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">当前值</div>
                    <div class="kpi-value">{{ currentAlert.currentValue }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">阈值</div>
                    <div class="kpi-value">{{ currentAlert.threshold }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">持续时间</div>
                    <div class="kpi-value">{{ currentAlert.duration }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">触发时间</div>
                    <div class="kpi-value">{{ currentAlert.triggerTime }}</div>
                  </div>
                </div>
                <div class="section-block">
                  <div class="section-title">告警源</div>
                  <div class="section-body">{{ currentAlert.resource }}</div>
                </div>
                <div class="section-block">
                  <div class="section-title">处理建议</div>
                  <div class="section-body suggestion">{{ currentAlert.suggestion }}</div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="experience" tab="维护经验">
              <div class="tab-panel">
                <div class="tab-empty">
                  <i class="fa-solid fa-book"></i>
                  <p>暂无维护经验记录</p>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="history" tab="最近2个月处理记录">
              <div class="tab-panel">
                <a-table
                  :columns="historyRecordColumns"
                  :data-source="alertHistoryRecords"
                  :pagination="{ pageSize: 5, size: 'small' }"
                  row-key="id"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'level'">
                      <a-tag :color="getLevelColor(record.level)" size="small">{{ getLevelText(record.level) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'status'">
                      <a-tag :color="record.status === 'resolved' ? 'green' : 'default'" size="small">
                        {{ record.status === 'resolved' ? '已恢复' : '处理中' }}
                      </a-tag>
                    </template>
                  </template>
                </a-table>
              </div>
            </a-tab-pane>
            <a-tab-pane key="help" tab="告警处理与告警帮助">
              <div class="tab-panel">
                <div class="help-section">
                  <h4><i class="fa-solid fa-headset"></i> 告警处理流程</h4>
                  <ol class="help-steps">
                    <li>确认告警级别与影响范围</li>
                    <li>检查相关资源状态与日志</li>
                    <li>执行对应处理建议</li>
                    <li>验证告警是否恢复</li>
                    <li>记录处理过程与结果</li>
                  </ol>
                </div>
                <div class="help-section">
                  <h4><i class="fa-solid fa-phone"></i> 联系方式</h4>
                  <div class="help-info">
                    <p>运维值班：138-0000-0001</p>
                    <p>DBA值班：138-0000-0002</p>
                    <p>网络值班：138-0000-0003</p>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Chart } from '@antv/g2'

const activeTab = ref('current')
const searchText = ref('')
const selectedKeys = ref([])
const refreshInterval = ref(30)
const templateValue = ref(null)
const detailVisible = ref(false)
const currentAlert = ref(null)
const activeDetailTab = ref('info')
const scrollY = ref(500)

const historySearch = ref('')
const historyLevel = ref(null)
const historyTimeRange = ref(null)

const suppressedSearch = ref('')
const suppressedLevel = ref(null)
const suppressedTimeRange = ref(null)

const logsSearch = ref('')
const logsType = ref(null)
const logsTimeRange = ref(null)

const expSearch = ref('')
const expCategory = ref(null)

const realtimeAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', metric: 'CPU使用率', currentValue: '95%', threshold: '> 90%', duration: '5分钟', displayDuration: '5分钟', durationMinutes: 5, triggerTime: '2026-06-17 10:32:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务' },
  { id: 2, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', metric: '磁盘使用率', currentValue: '92%', threshold: '> 90%', duration: '12分钟', displayDuration: '12分钟', durationMinutes: 12, triggerTime: '2026-06-17 10:28:00', recoveryTime: '-', status: 'firing', suggestion: '1. 清理过期日志文件\n2. 检查大表并归档历史数据\n3. 扩容磁盘或迁移数据' },
  { id: 3, level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', metric: '复制延迟', currentValue: '35s', threshold: '> 10s', duration: '37分钟', displayDuration: '37分钟', durationMinutes: 37, triggerTime: '2026-06-17 09:55:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查主库写入压力\n2. 检查从库IO/SQL线程状态\n3. 确认网络带宽是否充足' },
  { id: 4, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', metric: '内存使用率', currentValue: '82%', threshold: '> 80%', duration: '20分钟', displayDuration: '20分钟', durationMinutes: 20, triggerTime: '2026-06-17 10:15:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查JVM堆内存使用情况\n2. 分析是否有内存泄漏\n3. 调整容器内存限制' },
  { id: 5, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', metric: '响应时间', currentValue: '2500ms', threshold: '> 2000ms', duration: '1小时', displayDuration: '1小时', durationMinutes: 60, triggerTime: '2026-06-17 09:45:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略' },
  { id: 6, level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', metric: '5xx错误率', currentValue: '3.2%', threshold: '> 1%', duration: '1.5小时', displayDuration: '1.5小时', durationMinutes: 90, triggerTime: '2026-06-17 09:30:00', recoveryTime: '-', status: 'suppressed', suggestion: '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更' },
  { id: 7, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', metric: '连接数', currentValue: '85%', threshold: '> 80%', duration: '2小时', displayDuration: '2小时', durationMinutes: 120, triggerTime: '2026-06-17 09:20:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点' },
  { id: 8, level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', metric: '证书剩余天数', currentValue: '15天', threshold: '< 30天', duration: '2.5小时', displayDuration: '2.5小时', durationMinutes: 150, triggerTime: '2026-06-17 08:00:00', recoveryTime: '-', status: 'firing', suggestion: '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常' },
  { id: 9, level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', metric: 'Pod重启率', currentValue: '5次/小时', threshold: '> 3次/小时', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-17 08:45:00', recoveryTime: '2026-06-17 10:00:00', status: 'resolved', suggestion: '1. 查看Pod事件和日志\n2. 检查OOMKilled情况\n3. 调整resources限制' },
  { id: 10, level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', metric: '积压量', currentValue: '50000条', threshold: '> 10000条', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-17 07:30:00', recoveryTime: '2026-06-17 10:30:00', status: 'resolved', suggestion: '1. 检查消费者处理逻辑\n2. 增加消费者实例数\n3. 检查生产者发送速率' },
  { id: 11, level: 'warning', title: '网络丢包率过高', resource: 'switch-01 (华北区域)', metric: '丢包率', currentValue: '2.1%', threshold: '> 1%', duration: '45分钟', displayDuration: '45分钟', durationMinutes: 45, triggerTime: '2026-06-17 06:30:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查网络链路质量\n2. 排查交换机端口错误\n3. 联系网络运维处理' },
  { id: 12, level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', metric: '时间偏移', currentValue: '850ms', threshold: '> 500ms', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-16 23:00:00', recoveryTime: '2026-06-17 01:00:00', status: 'resolved', suggestion: '1. 检查NTP服务状态\n2. 确认时间源可达\n3. 手动同步时间' },
])
const historyData = ref([
  { id: 101, level: 'critical', title: '网络延迟过高', resource: 'lb-001', time: '2026-06-16 08:30', duration: '15分钟', status: 'resolved' },
  { id: 102, level: 'warning', title: '数据库连接池满', resource: 'db-002', time: '2026-06-16 14:20', duration: '30分钟', status: 'resolved' },
  { id: 103, level: 'info', title: '磁盘IO等待过高', resource: 'vm-003', time: '2026-06-15 22:10', duration: '8分钟', status: 'resolved' },
  { id: 104, level: 'critical', title: '服务不可用', resource: 'api-gateway', time: '2026-06-15 18:45', duration: '5分钟', status: 'resolved' },
  { id: 105, level: 'warning', title: 'SSL证书即将过期', resource: '*.example.com', time: '2026-06-15 09:00', duration: '1小时', status: 'processing' },
  { id: 106, level: 'critical', title: 'K8s节点NotReady', resource: 'k8s-node-02', time: '2026-06-14 15:30', duration: '12分钟', status: 'resolved' },
  { id: 107, level: 'warning', title: 'MySQL慢查询增多', resource: 'db-master-01', time: '2026-06-14 11:20', duration: '40分钟', status: 'resolved' },
  { id: 108, level: 'info', title: '备份任务失败', resource: 'backup-srv', time: '2026-06-13 03:00', duration: '4小时', status: 'processing' },
  { id: 109, level: 'warning', title: 'Redis内存使用率过高', resource: 'redis-session', time: '2026-06-13 14:15', duration: '25分钟', status: 'resolved' },
  { id: 110, level: 'critical', title: '负载均衡后端离线', resource: 'slb-prod', time: '2026-06-12 09:30', duration: '10分钟', status: 'resolved' },
  { id: 111, level: 'info', title: '日志磁盘使用率超阈值', resource: 'log-collector', time: '2026-06-11 20:00', duration: '3小时', status: 'resolved' },
  { id: 112, level: 'warning', title: '容器OOMKilled', resource: 'order-service', time: '2026-06-11 10:45', duration: '6分钟', status: 'resolved' },
])
const alertHistoryRecords = ref([
  { id: 201, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001', time: '2026-06-15 09:15', duration: '20分钟', status: 'resolved', operator: '张工' },
  { id: 202, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03', time: '2026-06-15 14:30', duration: '45分钟', status: 'resolved', operator: '李工' },
  { id: 203, level: 'critical', title: '磁盘空间不足', resource: 'db-primary', time: '2026-06-14 11:20', duration: '1小时', status: 'resolved', operator: '王工' },
  { id: 204, level: 'info', title: '连接数接近上限', resource: 'redis-cluster', time: '2026-06-14 16:00', duration: '30分钟', status: 'resolved', operator: '张工' },
])
const suppressedData = ref([
  { id: 301, level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', metric: '5xx错误率', currentValue: '3.2%', threshold: '> 1%', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 90, triggerTime: '2026-06-17 09:30:00', recoveryTime: '-', status: 'suppressed', muteReason: '维护窗口期', mutedBy: '张工', mutedAt: '2026-06-17 09:35:00', suggestion: '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更' },
  { id: 302, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', metric: '连接数', currentValue: '85%', threshold: '> 80%', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 120, triggerTime: '2026-06-17 09:20:00', recoveryTime: '-', status: 'suppressed', muteReason: '计划升级', mutedBy: '李工', mutedAt: '2026-06-17 09:25:00', suggestion: '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点' },
  { id: 303, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', metric: '响应时间', currentValue: '2500ms', threshold: '> 2000ms', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 60, triggerTime: '2026-06-17 10:15:00', recoveryTime: '-', status: 'suppressed', muteReason: '已知问题', mutedBy: '王工', mutedAt: '2026-06-17 10:20:00', suggestion: '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略' },
  { id: 304, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-005 (华南区域)', metric: 'CPU使用率', currentValue: '93%', threshold: '> 90%', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 25, triggerTime: '2026-06-17 10:05:00', recoveryTime: '-', status: 'suppressed', muteReason: '故障排查中', mutedBy: '张工', mutedAt: '2026-06-17 10:10:00', suggestion: '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务' },
  { id: 305, level: 'info', title: '证书即将过期', resource: 'pay.example.com', metric: '证书剩余天数', currentValue: '10天', threshold: '< 30天', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 180, triggerTime: '2026-06-17 08:00:00', recoveryTime: '-', status: 'suppressed', muteReason: '证书续期流程中', mutedBy: '赵工', mutedAt: '2026-06-17 08:15:00', suggestion: '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常' },
  { id: 306, level: 'warning', title: '网络丢包率过高', resource: 'switch-03 (华南区域)', metric: '丢包率', currentValue: '1.8%', threshold: '> 1%', duration: '已屏蔽', displayDuration: '已屏蔽', durationMinutes: 35, triggerTime: '2026-06-17 10:25:00', recoveryTime: '-', status: 'suppressed', muteReason: '网络割接中', mutedBy: '李工', mutedAt: '2026-06-17 10:28:00', suggestion: '1. 检查网络链路质量\n2. 排查交换机端口错误\n3. 联系网络运维处理' },
])
const logsData = ref([
  { id: 401, type: 'trigger', level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', operator: '系统', time: '2026-06-17 10:32:00', detail: '告警触发，CPU使用率达到95%，超过阈值90%' },
  { id: 402, type: 'mute', level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', operator: '张工', time: '2026-06-17 09:35:00', detail: '屏蔽告警，原因：维护窗口期' },
  { id: 403, type: 'resolve', level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', operator: '系统', time: '2026-06-17 10:00:00', detail: '告警自动恢复，Pod重启率降至正常水平' },
  { id: 404, type: 'handle', level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', operator: '王工', time: '2026-06-17 10:15:00', detail: '处理告警：重启SQL线程，延迟降至2秒' },
  { id: 405, type: 'unmute', level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', operator: '李工', time: '2026-06-17 11:20:00', detail: '取消屏蔽，维护升级已完成' },
  { id: 406, type: 'trigger', level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', operator: '系统', time: '2026-06-17 10:15:00', detail: '告警触发，内存使用率达82%，超过阈值80%' },
  { id: 407, type: 'resolve', level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', operator: '系统', time: '2026-06-17 10:30:00', detail: '告警自动恢复，积压量降至1000条以下' },
  { id: 408, type: 'trigger', level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', operator: '系统', time: '2026-06-17 08:00:00', detail: '告警触发，证书剩余有效天数15天' },
  { id: 409, type: 'mute', level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', operator: '赵工', time: '2026-06-16 23:05:00', detail: '屏蔽告警，原因：计划校准时间' },
  { id: 410, type: 'resolve', level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', operator: '系统', time: '2026-06-17 01:00:00', detail: '告警自动恢复，时间偏移降至100ms以内' },
  { id: 411, type: 'trigger', level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', operator: '系统', time: '2026-06-17 09:45:00', detail: '告警触发，平均响应时间2500ms，超过阈值2000ms' },
  { id: 412, type: 'handle', level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', operator: '王工', time: '2026-06-17 10:00:00', detail: '处理告警：回滚至上一稳定版本，响应恢复正常' },
])
const expData = ref([
  { id: 501, title: 'CPU使用率持续过高的排查思路', category: 'CPU', author: '张工', time: '2026-06-15 14:30', helpful: 12, content: '1. 使用top/htop定位占用最高的进程\n2. 检查是否有死循环或异常线程\n3. 查看crontab是否有定时任务集中执行\n4. 分析系统调用栈perf top' },
  { id: 502, title: '数据库主从延迟快速恢复方法', category: '数据库', author: '王工', time: '2026-06-14 09:20', helpful: 18, content: '1. 检查SHOW SLAVE STATUS中的Seconds_Behind_Master\n2. 确认大事务是否正在执行\n3. 尝试STOP SLAVE后RESET SLAVE再START\n4. 调整slave_parallel_workers提升并发' },
  { id: 503, title: 'Redis内存泄漏排查与解决', category: '内存', author: '李工', time: '2026-06-13 16:45', helpful: 9, content: '1. 使用redis-cli --bigkeys扫描大key\n2. 检查是否有未设置过期时间的key\n3. 使用MEMORY USAGE命令分析具体key\n4. 清理无效数据并设置合理的maxmemory策略' },
  { id: 504, title: 'K8s Pod频繁重启的常见原因', category: '其他', author: '赵工', time: '2026-06-12 11:00', helpful: 15, content: '1. 查看kubectl describe pod检查RestartCount\n2. 检查OOMKilled：kubectl logs --previous\n3. 确认liveness probe配置是否合理\n4. 调整resources limits和request' },
  { id: 505, title: '网络丢包问题的分层排查法', category: '网络', author: '李工', time: '2026-06-11 08:30', helpful: 7, content: '1. 使用ping/traceroute定位断点\n2. 检查交换机端口错误计数器\n3. 使用tcpdump抓包分析重传\n4. 检查网卡驱动和固件版本' },
  { id: 506, title: '磁盘空间不足的应急处理', category: '磁盘', author: '张工', time: '2026-06-10 22:15', helpful: 21, content: '1. df -h查看各分区使用情况\n2. du -sh *定位大目录\n3. 清理journalctl --vacuum-time=7d\n4. 清理docker prune -a释放空间\n5. 永久方案：扩容或迁移数据' },
  { id: 507, title: 'HTTP 5xx错误率飙升的应急回滚', category: '其他', author: '王工', time: '2026-06-09 15:40', helpful: 14, content: '1. 查看错误码分布(502/503/504)\n2. 检查后端服务health endpoint\n3. 立即回滚最近一次部署\n4. 启用降级开关关闭非核心功能\n5. 验证后逐步灰度发布' },
  { id: 508, title: 'MySQL慢查询优化实战', category: '数据库', author: '王工', time: '2026-06-08 10:20', helpful: 16, content: '1. 开启slow_query_log定位慢SQL\n2. 使用EXPLAIN分析执行计划\n3. 检查是否命中索引，添加合适索引\n4. 避免SELECT *，减少回表\n5. 大表分页使用游标代替LIMIT offset' },
])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/alerts?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      realtimeAlerts.value = json.data.map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          metric: item.metric || item.Metric || '未知指标',
          currentValue: item.current_value || item.currentValue || '',
          threshold: item.threshold || '',
          duration: item.duration || '',
          displayDuration: item.display_duration || item.displayDuration || '',
          durationMinutes: item.duration_minutes != null ? item.duration_minutes : 0,
          triggerTime: item.trigger_time || item.triggerTime || '',
          recoveryTime: item.recovery_time || item.recoveryTime || '-',
          status: item.status || 'firing',
          suggestion: item.suggestion || '',
        }
      })
      historyData.value = json.data.filter(function(i) { return i.status === 'resolved' }).map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          time: item.trigger_time,
          duration: item.duration,
          status: item.status,
        }
      })
      alertHistoryRecords.value = json.data.filter(function(i) { return i.status === 'resolved' }).slice(0, 4).map(function(item) {
        return {
          id: item.id,
          level: item.level,
          title: item.title,
          resource: item.resource,
          time: item.trigger_time,
          duration: item.duration,
          status: item.status,
          operator: item.operator || '系统',
        }
      })
    }
  } catch (e) {
    console.error('加载告警数据失败:', e)
  } finally {
    loading.value = false
  }
  renderDonutChart()
  renderBarChart()
  renderDurationChart()
  renderTopnChart()
})

const columns = [
  { title: '告警级别', dataIndex: 'level', key: 'level', width: 100, sorter: function(a, b) { var order = { critical: 0, warning: 1, info: 2 }; return order[a.level] - order[b.level]; } },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 200 },
  { title: '告警指标', dataIndex: 'metric', key: 'metric', ellipsis: true, width: 120 },
  { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 100 },
  { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 110 },
  { title: '告警状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', width: 110 },
  { title: '触发时间', dataIndex: 'triggerTime', key: 'triggerTime', width: 180 },
  { title: '恢复时间', dataIndex: 'recoveryTime', key: 'recoveryTime', width: 180 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' },
]

const historyColumns = [
  { title: '告警标题', dataIndex: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', ellipsis: true },
  { title: '级别', key: 'level', width: 80 },
  { title: '触发时间', dataIndex: 'time', width: 170 },
  { title: '持续时间', dataIndex: 'duration', width: 100 },
  { title: '状态', key: 'status', width: 90 },
]

const historyRecordColumns = [
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '处理人', dataIndex: 'operator', key: 'operator', width: 70 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
]

const suppressedColumns = [
  { title: '告警标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 200 },
  { title: '级别', key: 'level', width: 80 },
  { title: '屏蔽原因', dataIndex: 'muteReason', key: 'muteReason', width: 130 },
  { title: '屏蔽人', dataIndex: 'mutedBy', key: 'mutedBy', width: 70 },
  { title: '触发时间', dataIndex: 'triggerTime', key: 'triggerTime', width: 180 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' },
]

const logsColumns = [
  { title: '类型', key: 'type', width: 80 },
  { title: '告警名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '资源', dataIndex: 'resource', key: 'resource', ellipsis: true, width: 200 },
  { title: '级别', key: 'level', width: 80 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 70 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true, width: 250 },
]

const expColumns = [
  { title: '经验标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '分类', key: 'category', width: 80 },
  { title: '作者', dataIndex: 'author', key: 'author', width: 70 },
  { title: '更新时间', dataIndex: 'time', key: 'time', width: 170 },
  { title: '帮助', key: 'helpful', width: 60 },
]

const firingAlerts = computed(function() {
  return realtimeAlerts.value.filter(function(a) { return a.status === 'firing' })
})

const filteredAlerts = computed(function() {
  var list = realtimeAlerts.value
  if (searchText.value) {
    var sk = searchText.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(sk) || a.resource.toLowerCase().includes(sk) })
  }
  return list
})

const historyFilteredData = computed(function() {
  var list = historyData.value
  if (historySearch.value) {
    var kw = historySearch.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) || a.resource.toLowerCase().includes(kw) })
  }
  if (historyLevel.value) {
    list = list.filter(function(a) { return a.level === historyLevel.value })
  }
  return list
})

const getLevelColor = function(level) {
  var map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}

const getLevelText = function(level) {
  var map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}

const getTypeColor = function(type) {
  var map = { trigger: 'red', resolve: 'green', mute: 'default', unmute: 'blue', handle: 'orange' }
  return map[type] || 'default'
}

const getTypeText = function(type) {
  var map = { trigger: '触发', resolve: '恢复', mute: '屏蔽', unmute: '取消屏蔽', handle: '处理' }
  return map[type] || type
}

const suppressedFilteredData = computed(function() {
  var list = suppressedData.value
  if (suppressedSearch.value) {
    var sk = suppressedSearch.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(sk) || a.resource.toLowerCase().includes(sk) })
  }
  if (suppressedLevel.value) {
    list = list.filter(function(a) { return a.level === suppressedLevel.value })
  }
  return list
})

const logsFilteredData = computed(function() {
  var list = logsData.value
  if (logsSearch.value) {
    var kw = logsSearch.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) || a.operator.toLowerCase().includes(kw) })
  }
  if (logsType.value) {
    list = list.filter(function(a) { return a.type === logsType.value })
  }
  return list
})

const expFilteredData = computed(function() {
  var list = expData.value
  if (expSearch.value) {
    var kw = expSearch.value.toLowerCase()
    list = list.filter(function(a) { return a.title.toLowerCase().includes(kw) })
  }
  if (expCategory.value) {
    list = list.filter(function(a) { return a.category === expCategory.value })
  }
  return list
})

const handleAlert = function(id) {
  realtimeAlerts.value = realtimeAlerts.value.filter(function(a) { return a.id !== id })
}

const openDetail = function(alert) {
  currentAlert.value = alert
  activeDetailTab.value = 'info'
  detailVisible.value = true
}

const unmuteAlert = function(id) {
  suppressedData.value = suppressedData.value.filter(function(a) { return a.id !== id })
}

// ---- G2 Charts ----
const donutContainer = ref(null)
const barContainer = ref(null)
const durationContainer = ref(null)
const topnContainer = ref(null)

let donutChart = null
let barChart = null
let durationChart = null
let topnChart = null

function renderDonutChart() {
  if (donutChart) { donutChart.destroy(); donutChart = null }
  if (!donutContainer.value) return

  var firing = firingAlerts.value
  var total = firing.length || 1
  var levels = ['critical', 'warning', 'info']
  var labels = { critical: '紧急', warning: '重要', info: '次要' }
  var colors = { critical: '#F5222D', warning: '#FA8C16', info: '#1890FF' }
  var data = levels.map(function(l) {
    return { name: labels[l], value: firing.filter(function(a) { return a.level === l }).length }
  })

  donutChart = new Chart({ container: donutContainer.value, autoFit: true, height: 160, padding: [10, 5, 10, 5] })
  donutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  donutChart.data(data)

  donutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: [colors.critical, colors.warning, colors.info] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '数量' }] })

  donutChart.label({ text: function(d) { return d.name + '\n' + d.value }, position: 'outside', connector: true, fontSize: 11, connectorStroke: '#ccc' })
  donutChart.legend('color', { position: 'right', layout: { justifyContent: 'center' }, itemSpacing: 8, itemLabelFontSize: 11 })
  donutChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  donutChart.render()
}

function renderBarChart() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (!barContainer.value) return

  var list = realtimeAlerts.value
  var data = [
    { status: '告警中', value: list.filter(function(a) { return a.status === 'firing' }).length },
    { status: '已恢复', value: list.filter(function(a) { return a.status === 'resolved' }).length },
    { status: '已屏蔽', value: list.filter(function(a) { return a.status === 'suppressed' }).length },
  ]

  barChart = new Chart({ container: barContainer.value, autoFit: true, height: 160, padding: [10, 20, 24, 20] })
  barChart.data(data)

  barChart.interval()
    .encode('x', 'status')
    .encode('y', 'value')
    .encode('color', 'status')
    .scale('color', { range: ['#F5222D', '#52C41A', '#BFBFBF'] })
    .style('radius', 4)
    .tooltip({ title: 'status', items: [{ channel: 'y', name: '数量' }] })

  barChart.label({ text: 'value', position: 'top', fontSize: 11, fontWeight: 'bold' })
  barChart.axis('x', { title: null, labelFontSize: 11 })
  barChart.axis('y', { title: null, labelFontSize: 10 })
  barChart.legend(false)
  barChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  barChart.render()
}

function renderDurationChart() {
  if (durationChart) { durationChart.destroy(); durationChart = null }
  if (!durationContainer.value) return

  var data = firingAlerts.value
    .filter(function(a) { return a.status === 'firing' })
    .sort(function(a, b) { return b.durationMinutes - a.durationMinutes })
    .slice(0, 4)
    .map(function(a) {
      return { name: a.title.length > 8 ? a.title.slice(0, 8) + '..' : a.title, duration: a.durationMinutes }
    })

  durationChart = new Chart({ container: durationContainer.value, autoFit: true, height: 160, padding: [10, 40, 20, 80] })
  durationChart.data(data)

  durationChart.interval()
    .encode('x', 'duration')
    .encode('y', 'name')
    .encode('color', 'name')
    .scale('color', { range: ['#007DFF', '#40A9FF', '#69C0FF', '#91D5FF'] })
    .style('radius', 3)
    .tooltip({ title: 'name', items: [{ channel: 'x', name: '持续(分钟)' }] })

  durationChart.label({ text: 'duration', position: 'right', fontSize: 10, fontWeight: 'bold' })
  durationChart.axis('y', { title: null, labelFontSize: 11 })
  durationChart.axis('x', { title: null, labelFontSize: 10 })
  durationChart.legend(false)
  durationChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  durationChart.render()
}

function renderTopnChart() {
  if (topnChart) { topnChart.destroy(); topnChart = null }
  if (!topnContainer.value) return

  var data = [
    { name: 'CPU使用率', count: 3 },
    { name: '磁盘使用率', count: 2 },
    { name: '内存使用率', count: 2 },
    { name: '响应时间', count: 2 },
    { name: '复制延迟', count: 2 },
  ]

  topnChart = new Chart({ container: topnContainer.value, autoFit: true, height: 160, padding: [10, 20, 24, 20] })
  topnChart.data(data)

  topnChart.interval()
    .encode('x', 'name')
    .encode('y', 'count')
    .encode('color', 'name')
    .scale('color', { range: ['#007DFF', '#40A9FF', '#69C0FF', '#91D5FF', '#BAE7FF'] })
    .style('radius', 4)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '次数' }] })

  topnChart.label({ text: 'count', position: 'top', fontSize: 11, fontWeight: 'bold' })
  topnChart.axis('x', { title: null, labelFontSize: 10, labelAutoRotate: false })
  topnChart.axis('y', { title: null, labelFontSize: 10 })
  topnChart.legend(false)
  topnChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  topnChart.render()
}

function renderCharts() {
  renderDonutChart()
  renderBarChart()
  renderDurationChart()
  renderTopnChart()
}

function updateScrollY() {
  scrollY.value = window.innerHeight - 310
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
})

onBeforeUnmount(function() {
  window.removeEventListener('resize', updateScrollY)
  if (donutChart) donutChart.destroy()
  if (barChart) barChart.destroy()
  if (durationChart) durationChart.destroy()
  if (topnChart) topnChart.destroy()
})
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; height: 100%; }
.page-view :deep(.ant-tabs) { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.page-view :deep(.ant-tabs-nav) { margin: 4px 0 16px 0 !important; }
.page-view :deep(.ant-tabs-content-holder) { flex: 1; min-height: 0; overflow: auto; padding: 0; }
.page-view :deep(.ant-tabs-content) { height: 100%; }
.page-view :deep(.ant-tabs-tabpane) { height: 100%; }

.current-alerts { display: flex; flex-direction: column; height: 100%; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.search-input { flex: 1; min-width: 200px; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-card { background: #fff; border-radius: 8px; padding: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
.stat-card-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; flex-shrink: 0; }
.chart-container { flex: 1; min-height: 0; }

:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
:deep(.ant-table-row) { cursor: pointer; }
:deep(.ant-table-row:hover td) { background: #e6f7ff !important; }
:deep(.row-critical) { background: #fff1f0; }
:deep(.row-warning) { background: #fff7e6; }
:deep(.row-critical:hover td) { background: #fff1f0 !important; }
:deep(.row-warning:hover td) { background: #fff7e6 !important; }

.alert-link { color: var(--brand); cursor: pointer; }
.alert-link:hover { text-decoration: underline; }

.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec); color: var(--brand); }

.history-alerts { display: flex; flex-direction: column; height: 100%; }
.history-alerts .filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.history-alerts .search-input { flex: 1; min-width: 200px; }
.history-alerts :deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.history-alerts :deep(.ant-table) { flex: 1; min-height: 0; }
.history-alerts :deep(.ant-table-container) { flex: 1; min-height: 0; }

.tab-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #8c8c8c; }
.tab-empty i { font-size: 48px; margin-bottom: 16px; }
.tab-empty p { margin: 0; font-size: 14px; }

.detail-panel {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.detail-panel.open { pointer-events: auto; opacity: 1; }
.detail-mask { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0, 0, 0, 0.3); }
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -560px;
  width: 560px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
}
.detail-panel.open .detail-panel-content { right: 0; }
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.close-btn { font-size: 16px; color: #8c8c8c; border: none; background: transparent; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: var(--brand); background: var(--bg-sec); }
.detail-body { flex: 1; overflow-y: auto; padding: 0 20px 20px; }
.detail-body :deep(.ant-tabs > .ant-tabs-nav) { margin-bottom: 16px; }
.tab-panel { min-height: 200px; }
.detail-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi-item { padding: 12px; background: #fafafa; border-radius: 6px; }
.kpi-label { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.kpi-value { font-size: 14px; font-weight: 500; }
.section-block { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.section-body { font-size: 13px; color: #595959; line-height: 1.8; white-space: pre-line; }
.section-body.suggestion { background: #f6ffed; padding: 12px; border-radius: 6px; border-left: 3px solid #52c41a; }
.help-section { margin-bottom: 20px; }
.help-section h4 { font-size: 14px; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.help-steps { margin: 0; padding-left: 20px; font-size: 13px; line-height: 2; }
.help-info { font-size: 13px; line-height: 1.8; }
.help-info p { margin: 4px 0; }

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .toolbar-row { flex-direction: column; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
  .detail-kpi { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
