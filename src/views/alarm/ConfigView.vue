<template>
  <div class="page-view">
    <div class="page-header">
      <h3>汇聚规则 <span class="ai-badge">AI辅助配置</span></h3>
      <a-button @click="activeTab = 'ai'"><i class="fa-solid fa-robot"></i> AI分析</a-button>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="config-tabs">
      <!-- Tab 1: 检测规则 -->
      <a-tab-pane key="detect" tab="检测规则 (16)">
        <div class="filter-actions-bar">
          <a-button type="primary"><i class="fa-solid fa-plus"></i> 新建规则</a-button>
        </div>
        <div class="filter-bar">
          <a-select v-model:value="filterLevel" placeholder="告警级别" style="width:120px" allowClear>
            <a-select-option value="critical">紧急</a-select-option>
            <a-select-option value="warning">重要</a-select-option>
            <a-select-option value="info">次要</a-select-option>
          </a-select>
          <a-input-search v-model:value="filterSearch" placeholder="搜索规则名称" class="search-input" />
        </div>
        <a-table
          :columns="detectColumns"
          :data-source="filteredRules"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1100 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" />
            </template>
            <template v-if="column.key === 'detectionMode'">
              <a-tag :color="record.detectionMode === 'baseline' ? 'purple' : 'default'">
                {{ record.detectionMode === 'baseline' ? '智能基线' : '传统阈值' }}
              </a-tag>
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

      <!-- Tab 2: 汇聚规则 -->
      <a-tab-pane key="aggregation" tab="汇聚规则 (399)">
        <div class="filter-actions-bar">
          <a-button type="primary" @click="drawerVisible = true"><i class="fa-solid fa-plus"></i> 新建汇聚规则</a-button>
          <a-button style="border-color:var(--brand);color:var(--brand);"><i class="fa-solid fa-robot"></i> AI批量生成</a-button>
        </div>
        <div class="filter-bar">
          <a-select v-model:value="aggFilterStatus" placeholder="全部状态" style="width:120px" allowClear>
            <a-select-option value="enabled">启用</a-select-option>
            <a-select-option value="disabled">停用</a-select-option>
          </a-select>
          <a-input-search v-model:value="aggFilterSearch" placeholder="搜索汇聚规则" class="search-input" />
        </div>
        <a-table
          :columns="aggColumns"
          :data-source="filteredAggRules"
          :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
          row-key="id"
          :scroll="{ y: scrollY, x: 1000 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'scope'">
              <a-tag :color="record.scope === 'intra' ? 'blue' : 'green'">
                {{ record.scope === 'intra' ? '网元内' : '网元间' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'trigger'">
              <span>{{ record.triggerWindow }}秒内 {{ record.triggerOp }} {{ record.triggerThreshold }}条</span>
            </template>
            <template v-if="column.key === 'endCondition'">
              <span>{{ record.endWindow }}秒内 {{ record.endOp }} {{ record.endThreshold }}条</span>
            </template>
            <template v-if="column.key === 'actionType'">
              <a-tag>{{ record.actionType }}</a-tag>
            </template>
            <template v-if="column.key === 'enabled'">
              <a-switch v-model:checked="record.enabled" />
            </template>
            <template v-if="column.key === 'op'">
              <div class="action-btns">
                <a-tooltip title="编辑"><button class="icon-btn" @click="editAggRule(record)"><i class="fa-solid fa-pen"></i></button></a-tooltip>
                <a-tooltip title="删除"><button class="icon-btn danger"><i class="fa-solid fa-trash"></i></button></a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </a-tab-pane>

      <!-- Tab 3: AI优化建议 -->
      <a-tab-pane key="ai" tab="AI优化建议 (3)">
        <!-- AI分析概览 -->
        <div class="ai-overview">
          <div class="ai-overview-header">
            <span class="ai-avatar">🤖</span>
            <span>AI已分析最近 <strong>30天</strong> 告警数据 + 现有 <strong>399条</strong> 汇聚规则</span>
          </div>
          <a-progress :percent="100" :show-info="false" stroke-color="linear-gradient(90deg, #007DFF, #7c3aed)" />
          <div class="ai-result-tags">
            <a-tag color="success">已识别 3 条优化建议</a-tag>
            <a-tag color="warning">2条规则触发阈值过敏感</a-tag>
            <a-tag color="processing">1条建议新增汇聚</a-tag>
          </div>
        </div>

        <!-- 建议1: 规则优化 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议1: 规则#3 触发阈值过敏感</span>
            <a-tag color="orange">过度汇聚</a-tag>
          </div>
          <div class="suggestion-desc">
            "Bond slave状态异常告警"规则触发条件为 <code>1800秒内 ≥ 2条</code>，导致正常告警被过度汇聚。
            AI建议：调整为 <code>3600秒内 ≥ 3条</code>
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(1)">✓ 采纳</a-button>
            <a-button size="small" @click="showAdjustPanel = !showAdjustPanel">✎ 调整</a-button>
            <a-button size="small">✗ 忽略</a-button>
          </div>
          <div v-if="showAdjustPanel" class="adjust-panel">
            <span>周期</span>
            <a-input-number v-model:value="adjustWindow" :min="600" :step="600" size="small" style="width:100px" />
            <span>秒内</span>
            <a-select v-model:value="adjustOp" size="small" style="width:80px">
              <a-select-option value=">=">≥</a-select-option>
              <a-select-option value=">">></a-select-option>
            </a-select>
            <a-input-number v-model:value="adjustThreshold" :min="1" size="small" style="width:70px" />
            <span>条</span>
            <a-button type="primary" size="small" @click="adoptSuggestion(1)">确认</a-button>
          </div>
        </div>

        <!-- 建议2: 规则合并 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议2: 规则#1 与 #2 可合并</span>
            <a-tag color="blue">可合并</a-tag>
          </div>
          <div class="suggestion-desc">
            两条"OpenStack OM时间同步失败"汇聚规则条件相似，合并后可减少维护成本并避免重复汇聚。
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(2)">✓ 合并</a-button>
            <a-button size="small">✗ 忽略</a-button>
          </div>
        </div>

        <!-- 建议3: 新增规则 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议3: 新增"主机CPU使用率高"汇聚规则</span>
            <a-tag color="green">AI推荐</a-tag>
          </div>
          <div class="suggestion-desc">
            检测到"主机CPU使用率超过阈值"告警近7天上报 <strong>86次</strong>，存在短时重复爆发模式，AI建议新建汇聚规则。
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(3)">✓ 使用AI推荐配置</a-button>
            <a-button size="small">✗ 忽略</a-button>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 新建汇聚规则 Drawer -->
    <a-drawer
      v-model:open="drawerVisible"
      title="🤖 新建汇聚规则"
      :width="720"
      placement="right"
    >
      <a-tabs v-model:activeKey="drawerTab" class="drawer-tabs">
        <a-tab-pane key="alert" tab="告警汇聚规则" />
        <a-tab-pane key="event" tab="事件汇聚规则" />
        <a-tab-pane key="batch" tab="批量创建" />
      </a-tabs>

      <!-- 面板1: 基本信息 -->
      <div class="form-panel">
        <div class="form-panel-header">面板1：基本信息 <a-tag color="blue" size="small">AI可辅助</a-tag></div>
        <div class="form-panel-body">
          <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
            <a-form-item label="规则名称" required>
              <a-input v-model:value="formData.name" placeholder="输入规则名称" />
              <div class="ai-hint">🤖 AI根据告警名称+汇聚模式自动生成规范名称</div>
            </a-form-item>
            <a-form-item label="描述">
              <a-textarea v-model:value="formData.description" :rows="2" placeholder="规则描述" />
              <div class="ai-hint">🤖 AI根据历史告警模式自动生成描述</div>
            </a-form-item>
            <a-form-item label="启用">
              <a-switch v-model:checked="formData.enabled" />
              <span class="ai-hint-inline">AI建议：立即启用</span>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <!-- 面板2: 条件 -->
      <div class="form-panel">
        <div class="form-panel-header">面板2：条件 <a-tag color="blue" size="small">AI可辅助</a-tag></div>
        <div class="form-panel-body">
          <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
            <a-form-item label="告警名称" required>
              <a-input v-model:value="formData.alertName" placeholder="告警名称关键词" />
              <div class="ai-hint">🤖 AI从历史告警中匹配频次最高的告警名称</div>
            </a-form-item>
            <a-form-item label="告警源" required>
              <a-select v-model:value="formData.sourceMode" style="width:100%">
                <a-select-option value="all">所有告警源</a-select-option>
                <a-select-option value="custom">自定义告警源</a-select-option>
              </a-select>
              <div class="ai-hint">🤖 AI匹配重复告警频发主机，自动填充到自定义告警源</div>
            </a-form-item>
            <a-form-item label="高级条件">
              <div class="condition-block">
                <div class="condition-row" v-for="(c, i) in formData.conditions" :key="i">
                  <a-select v-model:value="c.field" style="width:120px" size="small">
                    <a-select-option value="level">告警级别</a-select-option>
                    <a-select-option value="source_ip">来源IP</a-select-option>
                    <a-select-option value="tag">标签</a-select-option>
                  </a-select>
                  <a-select v-model:value="c.op" style="width:80px" size="small">
                    <a-select-option value="=">=</a-select-option>
                    <a-select-option value="!=">!=</a-select-option>
                    <a-select-option value="like">包含</a-select-option>
                  </a-select>
                  <a-input v-model:value="c.value" placeholder="值" size="small" style="flex:1" />
                  <a-button size="small" danger @click="formData.conditions.splice(i, 1)">删除</a-button>
                </div>
                <a-button size="small" type="dashed" @click="formData.conditions.push({ field: 'level', op: '=', value: '' })">+ 添加条件</a-button>
              </div>
              <div class="ai-hint">🤖 AI推荐排除维护态等常用条件，<a>一键采纳</a></div>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <!-- 面板3: 汇聚参数 -->
      <div class="form-panel">
        <div class="form-panel-header">面板3：汇聚参数 <a-tag color="purple" size="small">AI核心推荐</a-tag></div>
        <div class="form-panel-body">
          <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
            <a-form-item label="汇聚范围" required>
              <a-select v-model:value="formData.scope" style="width:100%">
                <a-select-option value="intra">网元内</a-select-option>
                <a-select-option value="inter">网元间</a-select-option>
              </a-select>
              <div class="ai-hint">🤖 AI根据告警源分布判断网元内/网元间汇聚</div>
            </a-form-item>
            <a-form-item label="触发条件" required>
              <div class="condition-row">
                <span>周期</span>
                <a-input-number v-model:value="formData.triggerWindow" :min="60" :step="60" size="small" style="width:100px" />
                <span>秒内</span>
                <a-select v-model:value="formData.triggerOp" size="small" style="width:80px">
                  <a-select-option value=">=">≥</a-select-option>
                  <a-select-option value=">">></a-select-option>
                </a-select>
                <a-input-number v-model:value="formData.triggerThreshold" :min="1" size="small" style="width:70px" />
                <span>条</span>
              </div>
              <div class="ai-hint">🤖 AI分析历史告警爆发间隔，推荐最优周期+阈值组合</div>
            </a-form-item>
            <a-form-item label="结束条件">
              <div class="condition-row">
                <span>周期</span>
                <a-input-number v-model:value="formData.endWindow" :min="60" :step="60" size="small" style="width:100px" />
                <span>秒内</span>
                <a-select v-model:value="formData.endOp" size="small" style="width:80px">
                  <a-select-option value="<"><</a-select-option>
                  <a-select-option value="<=">≤</a-select-option>
                </a-select>
                <a-input-number v-model:value="formData.endThreshold" :min="0" size="small" style="width:70px" />
                <span>条</span>
              </div>
              <div class="ai-hint">🤖 AI根据告警持续时间分布推荐结束周期</div>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <!-- 面板4: 汇聚动作 -->
      <div class="form-panel">
        <div class="form-panel-header">面板4：汇聚动作</div>
        <div class="form-panel-body">
          <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
            <a-form-item label="汇聚动作" required>
              <a-radio-group v-model:value="formData.actionType" class="action-radio-group">
                <a-radio value="生成一条汇聚告警">生成一条汇聚告警</a-radio>
                <a-radio value="汇聚+衍生">生成汇聚告警，并将所有源告警置为衍生告警</a-radio>
                <a-radio value="汇聚+屏蔽">生成汇聚告警，并北向屏蔽所有源告警</a-radio>
                <a-radio value="汇聚+被屏蔽">生成汇聚告警，并将所有源告警显示在"被屏蔽告警"中</a-radio>
                <a-radio value="汇聚+丢弃">生成汇聚告警，并丢弃所有源告警</a-radio>
                <a-radio value="直接上报">直接上报源告警，不生成汇聚告警</a-radio>
              </a-radio-group>
              <div class="ai-hint">🤖 AI建议"生成汇聚告警"以保留源告警可追溯性</div>
            </a-form-item>
            <a-form-item label="汇聚告警设置">
              <div style="display:flex;gap:12px;">
                <div style="flex:1">
                  <div class="field-label">告警源</div>
                  <a-input v-model:value="formData.aggAlertSource" placeholder="AI建议：与源告警一致" />
                </div>
                <div style="flex:1">
                  <div class="field-label">级别</div>
                  <a-select v-model:value="formData.aggAlertLevel" style="width:100%">
                    <a-select-option value="ai_suggest">AI建议：次要（与源告警一致）</a-select-option>
                    <a-select-option value="critical">紧急</a-select-option>
                    <a-select-option value="warning">重要</a-select-option>
                    <a-select-option value="info">次要</a-select-option>
                  </a-select>
                </div>
              </div>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <!-- AI影响预估 -->
      <div class="impact-card">
        <div class="impact-title">📊 AI影响预估</div>
        <div class="impact-stats">
          <div class="impact-stat">
            <div class="impact-num">86→8</div>
            <div class="impact-label">日均告警<br>86条→汇聚后8条</div>
          </div>
          <div class="impact-stat">
            <div class="impact-num green">0</div>
            <div class="impact-label">预计漏汇聚</div>
          </div>
          <div class="impact-stat">
            <div class="impact-num green">-91%</div>
            <div class="impact-label">告警噪音降低</div>
          </div>
        </div>
        <a-alert type="warning" show-icon>
          <template #message>
            <strong>AI风险提示：</strong>该规则将汇聚2台主机的CPU告警。其中 host-192.168.1.53 的CPU告警曾关联过业务影响，建议将其从汇聚范围中排除或单独配置更高阈值。
          </template>
          <template #action>
            <a-button size="small" @click="excludeHost">一键排除</a-button>
          </template>
        </a-alert>
      </div>

      <template #footer>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" @click="saveAggRule">🤖 AI校验并保存</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref('detect')
const scrollY = ref(500)
const drawerVisible = ref(false)
const drawerTab = ref('alert')
const showAdjustPanel = ref(false)
const adjustWindow = ref(3600)
const adjustOp = ref('>=')
const adjustThreshold = ref(3)

// 检测规则相关
const filterSearch = ref('')
const filterLevel = ref(null)
const rules = ref([
  { id: 1, name: 'CPU使用率过高', level: 'critical', target: '所有服务器', metric: 'cpu_usage', condition: '> 90%', duration: '5分钟', enabled: true, detectionMode: 'threshold', description: '当服务器CPU使用率持续超过90%时触发告警' },
  { id: 2, name: '磁盘空间不足', level: 'critical', target: '数据库服务器', metric: 'disk_usage', condition: '> 90%', duration: '10分钟', enabled: true, detectionMode: 'threshold', description: '磁盘使用率超过90%时触发，防止磁盘写满' },
  { id: 3, name: '数据库主从延迟', level: 'critical', target: '所有数据库', metric: 'replication_delay', condition: '> 10s', duration: '5分钟', enabled: true, detectionMode: 'baseline', description: '主从复制延迟超过10秒时触发' },
  { id: 4, name: '内存使用率偏高', level: 'warning', target: '应用服务器', metric: 'mem_usage', condition: '> 80%', duration: '15分钟', enabled: true, detectionMode: 'baseline', description: '内存使用率超过80%持续15分钟时触发' },
  { id: 5, name: '响应时间超时', level: 'warning', target: 'API网关', metric: 'response_time', condition: '> 2000ms', duration: '5分钟', enabled: true, detectionMode: 'threshold', description: 'API平均响应时间超过2秒时触发' },
  { id: 6, name: 'HTTP 5xx错误率上升', level: 'warning', target: '所有负载均衡', metric: 'error_rate_5xx', condition: '> 1%', duration: '5分钟', enabled: false, detectionMode: 'threshold', description: '5xx错误率超过1%时触发' },
  { id: 7, name: 'Redis连接数接近上限', level: 'info', target: 'Redis集群', metric: 'redis_connections', condition: '> 80%', duration: '10分钟', enabled: true, detectionMode: 'baseline', description: 'Redis连接数使用率超过80%时触发' },
  { id: 8, name: 'SSL证书即将过期', level: 'info', target: '所有域名', metric: 'cert_days_left', condition: '< 30天', duration: '1天', enabled: true, detectionMode: 'threshold', description: 'SSL证书剩余有效期少于30天时提醒' },
  { id: 9, name: 'K8s Pod频繁重启', level: 'critical', target: '生产环境', metric: 'pod_restart_rate', condition: '> 3次/小时', duration: '1小时', enabled: true, detectionMode: 'threshold', description: 'Pod每小时重启超过3次时触发' },
  { id: 10, name: '消息队列积压', level: 'warning', target: 'Kafka消费者', metric: 'queue_backlog', condition: '> 10000条', duration: '15分钟', enabled: true, detectionMode: 'baseline', description: '消息队列积压超过1万条时触发' },
  { id: 11, name: '网络丢包率过高', level: 'warning', target: '所有网络设备', metric: 'packet_loss', condition: '> 1%', duration: '10分钟', enabled: false, detectionMode: 'threshold', description: '网络丢包率超过1%时触发' },
  { id: 12, name: 'NTP时间偏移', level: 'info', target: '所有服务器', metric: 'ntp_offset', condition: '> 500ms', duration: '30分钟', enabled: true, detectionMode: 'threshold', description: 'NTP时间偏移超过500ms时触发' },
  { id: 13, name: 'MySQL慢查询增多', level: 'warning', target: '数据库主库', metric: 'slow_queries', condition: '> 50/分钟', duration: '10分钟', enabled: true, detectionMode: 'baseline', description: '慢查询数量超过50条/分钟时触发' },
  { id: 14, name: '容器OOMKilled', level: 'critical', target: '所有容器', metric: 'oom_killed', condition: '> 0次', duration: '实时', enabled: true, detectionMode: 'threshold', description: '容器被OOM Kill时立即触发' },
  { id: 15, name: '备份任务失败', level: 'info', target: '备份服务器', metric: 'backup_status', condition: 'failed', duration: '实时', enabled: true, detectionMode: 'threshold', description: '备份任务执行失败时触发' },
  { id: 16, name: '负载均衡后端离线', level: 'critical', target: '所有SLB', metric: 'backend_health', condition: 'offline', duration: '实时', enabled: true, detectionMode: 'threshold', description: '负载均衡后端服务器不可用时触发' },
])

const detectColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '级别', key: 'level', width: 80 },
  { title: '目标资源', dataIndex: 'target', key: 'target', width: 140 },
  { title: '指标', dataIndex: 'metric', key: 'metric', width: 130 },
  { title: '条件', dataIndex: 'condition', key: 'condition', width: 100 },
  { title: '检测模式', key: 'detectionMode', width: 100 },
  { title: '持续时长', dataIndex: 'duration', key: 'duration', width: 100 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
]

const filteredRules = computed(function() {
  var list = rules.value
  if (filterSearch.value) {
    var kw = filterSearch.value.toLowerCase()
    list = list.filter(function(r) { return r.name.toLowerCase().includes(kw) || r.description.toLowerCase().includes(kw) })
  }
  if (filterLevel.value) {
    list = list.filter(function(r) { return r.level === filterLevel.value })
  }
  return list
})

// 汇聚规则相关
const aggFilterSearch = ref('')
const aggFilterStatus = ref(null)
const aggRules = ref([
  { id: 1, name: 'CPU重复告警聚合', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 3, endWindow: 1800, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '同title+metric的CPU告警在1小时内≥3条时聚合' },
  { id: 2, name: '磁盘告警过滤', scope: 'inter', triggerWindow: 1800, triggerOp: '>=', triggerThreshold: 5, endWindow: 900, endOp: '<=', endThreshold: 2, actionType: '汇聚+屏蔽', enabled: true, description: '跨网元磁盘告警30分钟内≥5条时聚合屏蔽' },
  { id: 3, name: '网络抖动去重', scope: 'intra', triggerWindow: 600, triggerOp: '>=', triggerThreshold: 10, endWindow: 300, endOp: '<=', endThreshold: 1, actionType: '汇聚+丢弃', enabled: false, description: '网络抖动告警10分钟内≥10条时去重丢弃' },
  { id: 4, name: '数据库慢查询聚合', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 3, endWindow: 1800, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '同数据库实例慢查询告警1小时内聚合' },
  { id: 5, name: 'Pod重启风暴聚合', scope: 'intra', triggerWindow: 1800, triggerOp: '>=', triggerThreshold: 5, endWindow: 600, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '同namespace Pod重启告警30分钟内聚合' },
  { id: 6, name: '证书批量过期聚合', scope: 'inter', triggerWindow: 86400, triggerOp: '>=', triggerThreshold: 3, endWindow: 43200, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '多域名证书过期告警24小时内聚合' },
  { id: 7, name: '负载均衡后端异常', scope: 'intra', triggerWindow: 900, triggerOp: '>=', triggerThreshold: 3, endWindow: 600, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '同SLB后端异常告警15分钟内聚合' },
  { id: 8, name: 'Redis连接数告警', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 2, endWindow: 1800, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: false, description: 'Redis连接数告警1小时内聚合' },
  { id: 9, name: 'HTTP错误率聚合', scope: 'inter', triggerWindow: 1800, triggerOp: '>=', triggerThreshold: 5, endWindow: 900, endOp: '<=', endThreshold: 2, actionType: '汇聚+被屏蔽', enabled: true, description: '跨网元HTTP错误率告警30分钟内聚合' },
  { id: 10, name: 'NTP偏移批量聚合', scope: 'inter', triggerWindow: 7200, triggerOp: '>=', triggerThreshold: 5, endWindow: 3600, endOp: '<=', endThreshold: 1, actionType: '生成一条汇聚告警', enabled: true, description: '多服务器NTP偏移告警2小时内聚合' },
])

const aggColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '范围', key: 'scope', width: 80 },
  { title: '触发条件', key: 'trigger', width: 180 },
  { title: '结束条件', key: 'endCondition', width: 180 },
  { title: '动作', key: 'actionType', width: 150 },
  { title: '状态', key: 'enabled', width: 70 },
  { title: '操作', key: 'op', width: 80, fixed: 'right' },
]

const filteredAggRules = computed(function() {
  var list = aggRules.value
  if (aggFilterSearch.value) {
    var kw = aggFilterSearch.value.toLowerCase()
    list = list.filter(function(r) { return r.name.toLowerCase().includes(kw) || (r.description || '').toLowerCase().includes(kw) })
  }
  if (aggFilterStatus.value) {
    list = list.filter(function(r) { return aggFilterStatus.value === 'enabled' ? r.enabled : !r.enabled })
  }
  return list
})

// Drawer表单
const formData = reactive({
  name: '',
  description: '',
  enabled: true,
  alertName: '',
  sourceMode: 'all',
  conditions: [{ field: 'level', op: '=', value: '' }],
  scope: 'intra',
  triggerWindow: 3600,
  triggerOp: '>=',
  triggerThreshold: 3,
  endWindow: 1800,
  endOp: '<=',
  endThreshold: 1,
  actionType: '生成一条汇聚告警',
  aggAlertSource: '',
  aggAlertLevel: 'ai_suggest',
})

// 通用方法
function getLevelColor(level) {
  var map = { critical: 'red', warning: 'orange', info: 'blue' }
  return map[level] || 'default'
}
function getLevelText(level) {
  var map = { critical: '紧急', warning: '重要', info: '次要' }
  return map[level] || level
}
function updateScrollY() { scrollY.value = window.innerHeight - 380 }

// AI建议操作
function adoptSuggestion(id) {
  console.log('采纳建议:', id)
}
function editAggRule(record) {
  Object.assign(formData, {
    name: record.name,
    description: record.description || '',
    enabled: record.enabled,
    scope: record.scope,
    triggerWindow: record.triggerWindow,
    triggerOp: record.triggerOp,
    triggerThreshold: record.triggerThreshold,
    endWindow: record.endWindow,
    endOp: record.endOp,
    endThreshold: record.endThreshold,
    actionType: record.actionType,
  })
  drawerVisible.value = true
}
function saveAggRule() {
  drawerVisible.value = false
}
function excludeHost() {
  console.log('排除host-192.168.1.53')
}

onMounted(function() {
  updateScrollY()
  window.addEventListener('resize', updateScrollY)
  if (route.query.tab === 'aggregation') activeTab.value = 'aggregation'
})
onUnmounted(function() { window.removeEventListener('resize', updateScrollY) })
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 0 0; height: 100%; }
.page-header { margin-bottom: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; }
.page-header h3 { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ai-badge { background: linear-gradient(135deg, #7c3aed, #007DFF); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.config-tabs { flex: 1; display: flex; flex-direction: column; }
.config-tabs :deep(.ant-tabs-content-holder) { flex: 1; overflow: auto; }
.config-tabs :deep(.ant-tabs-tab) { font-size: 14px; }

.filter-actions-bar { display: flex; gap: 8px; margin-bottom: 8px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-shrink: 0; align-items: center; }
.filter-bar :deep(.ant-input-search) { flex: 1; }
.search-input { flex: 1; min-width: 200px; }
:deep(.ant-table-wrapper) { flex: 1; display: flex; flex-direction: column; min-height: 0; }
:deep(.ant-table) { flex: 1; min-height: 0; }
:deep(.ant-table-container) { flex: 1; min-height: 0; }
:deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.action-btns { display: flex; gap: 4px; }
.icon-btn { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-secondary, #999); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--bg-sec, #f5f5f5); color: var(--brand, #007DFF); }
.icon-btn.danger:hover { color: #f5222d; }

/* AI分析概览 */
.ai-overview { background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%); border: 1px solid #d6e8f7; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
.ai-overview-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; }
.ai-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #007DFF); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0; }
.ai-result-tags { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

/* 建议卡片 */
.suggestion-card { background: #fff; border: 1px solid #e5e5ea; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: box-shadow 0.2s; }
.suggestion-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.suggestion-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.suggestion-title { font-size: 14px; font-weight: 600; }
.suggestion-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 12px; }
.suggestion-desc code { background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 12px; color: #f5222d; }
.suggestion-actions { display: flex; gap: 8px; }
.adjust-panel { margin-top: 12px; padding: 12px; background: #f9f9fb; border: 1px dashed var(--brand, #007DFF); border-radius: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* Drawer */
.drawer-tabs { margin-bottom: 16px; }
.form-panel { border: 1px solid #e5e5ea; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
.form-panel-header { background: #f7f8fa; padding: 10px 16px; font-weight: 600; font-size: 13px; border-bottom: 1px solid #e5e5ea; display: flex; align-items: center; gap: 8px; }
.form-panel-body { padding: 16px; }
.ai-hint { font-size: 12px; color: var(--brand, #007DFF); margin-top: 4px; }
.ai-hint a { text-decoration: underline; cursor: pointer; }
.ai-hint-inline { font-size: 12px; color: var(--text-secondary, #999); margin-left: 8px; }
.field-label { font-size: 12px; color: #666; margin-bottom: 4px; }
.condition-block { border: 1px dashed #e5e5ea; border-radius: 6px; padding: 12px; background: #f7f8fa; }
.condition-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.condition-row:last-child { margin-bottom: 0; }
.action-radio-group { display: flex; flex-direction: column; gap: 8px; }

/* 影响预估 */
.impact-card { background: linear-gradient(135deg, #f6ffed 0%, #f0f7ff 100%); border: 1px solid #d9f7be; border-radius: 8px; padding: 16px; margin-top: 16px; }
.impact-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.impact-stats { display: flex; gap: 24px; margin-bottom: 12px; }
.impact-stat { text-align: center; }
.impact-num { font-size: 24px; font-weight: 700; color: var(--brand, #007DFF); }
.impact-num.green { color: #52c41a; }
.impact-label { font-size: 12px; color: #666; margin-top: 2px; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; }
  .filter-bar .ant-select,
  .filter-bar input { width: 100% !important; }
}
</style>
