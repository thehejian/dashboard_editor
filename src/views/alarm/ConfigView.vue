<template>
  <div class="page-view">
    <div class="page-header">
      <h3>汇聚规则 <span class="ai-badge">AI辅助配置</span></h3>
      <a-button @click="activeTab = 'ai'"><i class="fa-solid fa-robot"></i> AI分析</a-button>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="config-tabs">
      <!-- Tab 1: 汇聚规则 -->
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

      <!-- Tab 2: AI优化建议 -->
      <a-tab-pane key="ai" tab="AI优化建议 (4)">
        <!-- AI分析概览 -->
        <div class="ai-overview">
          <div class="ai-overview-header">
            <span class="ai-avatar">🤖</span>
            <span>AI已分析最近 <strong>30天</strong> 告警数据 + 现有 <strong>399条</strong> 汇聚规则</span>
          </div>
          <a-progress :percent="100" :show-info="false" stroke-color="linear-gradient(90deg, #007DFF, #7c3aed)" />
          <div class="ai-result-tags">
            <a-tag color="success">已识别 4 条优化建议</a-tag>
            <a-tag color="warning">2条聚合窗口需调优</a-tag>
            <a-tag color="processing">1条规则可合并</a-tag>
            <a-tag color="blue">1条建议新增汇聚</a-tag>
          </div>
        </div>

        <!-- 建议1: 聚合窗口调优 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议1: "CPU重复告警聚合"窗口太短</span>
            <a-tag color="orange">窗口调优</a-tag>
          </div>
          <div class="suggestion-desc">
            当前触发条件 <code>1800秒内 ≥ 2条</code>，误汇聚率高，正常间隔5分钟的CPU告警被错误合并。
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
            <span class="suggestion-title">建议2: "磁盘告警过滤"与"磁盘空间聚合"可合并</span>
            <a-tag color="blue">可合并</a-tag>
          </div>
          <div class="suggestion-desc">
            两条磁盘类汇聚规则条件重叠，合并后可减少维护成本并避免重复汇聚。
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(2)">✓ 合并</a-button>
            <a-button size="small">✗ 忽略</a-button>
          </div>
        </div>

        <!-- 建议3: 新增规则 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议3: 新增"Redis连接数"汇聚规则</span>
            <a-tag color="green">AI推荐</a-tag>
          </div>
          <div class="suggestion-desc">
            检测到"Redis连接数接近上限"告警近7天上报 <strong>42次</strong>，存在短时重复爆发模式，AI建议新建汇聚规则。
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(3)">✓ 使用AI推荐配置</a-button>
            <a-button size="small">✗ 忽略</a-button>
          </div>
        </div>

        <!-- 建议4: 阈值调优 -->
        <div class="suggestion-card">
          <div class="suggestion-header">
            <span class="suggestion-title">建议4: "网络抖动去重"阈值过高</span>
            <a-tag color="orange">阈值调优</a-tag>
          </div>
          <div class="suggestion-desc">
            当前 <code>600秒内 ≥ 10条</code> 才触发去重，实际8条重复告警未被聚合。AI建议：调整为 <code>600秒内 ≥ 5条</code>
          </div>
          <div class="suggestion-actions">
            <a-button type="primary" size="small" @click="adoptSuggestion(4)">✓ 采纳</a-button>
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

      <!-- ==================== Tab1: 告警汇聚规则 ==================== -->
      <div v-if="drawerTab === 'alert'">
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
      </div>

      <!-- ==================== Tab2: 事件汇聚规则 ==================== -->
      <div v-if="drawerTab === 'event'">
        <!-- 面板1: 基本信息 -->
        <div class="form-panel">
          <div class="form-panel-header">面板1：基本信息 <a-tag color="blue" size="small">AI可辅助</a-tag></div>
          <div class="form-panel-body">
            <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
              <a-form-item label="规则名称" required>
                <a-input v-model:value="eventFormData.name" placeholder="输入事件汇聚规则名称" />
                <div class="ai-hint">🤖 AI根据事件类型+汇聚模式自动生成规范名称</div>
              </a-form-item>
              <a-form-item label="描述">
                <a-textarea v-model:value="eventFormData.description" :rows="2" placeholder="规则描述" />
                <div class="ai-hint">🤖 AI根据历史事件模式自动生成描述</div>
              </a-form-item>
              <a-form-item label="启用">
                <a-switch v-model:checked="eventFormData.enabled" />
                <span class="ai-hint-inline">AI建议：立即启用</span>
              </a-form-item>
            </a-form>
          </div>
        </div>

        <!-- 面板2: 事件条件 -->
        <div class="form-panel">
          <div class="form-panel-header">面板2：事件条件 <a-tag color="blue" size="small">AI可辅助</a-tag></div>
          <div class="form-panel-body">
            <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
              <a-form-item label="事件类型" required>
                <a-checkbox-group v-model:value="eventFormData.eventTypes" :options="eventTypeOptions" />
                <div class="ai-hint">🤖 AI推荐选择低级别事件类型，避免遗漏关键安全事件</div>
              </a-form-item>
              <a-form-item label="事件来源" required>
                <a-select v-model:value="eventFormData.sourceMode" style="width:100%">
                  <a-select-option value="all">所有来源</a-select-option>
                  <a-select-option value="system">系统事件</a-select-option>
                  <a-select-option value="audit">审计事件</a-select-option>
                  <a-select-option value="security">安全事件</a-select-option>
                  <a-select-option value="custom">自定义来源</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="严重程度">
                <a-select v-model:value="eventFormData.severity" style="width:100%">
                  <a-select-option value="below_warning">低于 警告（只聚合信息级）</a-select-option>
                  <a-select-option value="below_error">低于 错误（聚合信息+警告）</a-select-option>
                  <a-select-option value="all">所有级别</a-select-option>
                </a-select>
                <div class="ai-hint">🤖 建议只聚合低级别事件，保留高级别事件独立上报</div>
              </a-form-item>
              <a-form-item label="事件名称">
                <a-input v-model:value="eventFormData.eventName" placeholder="事件名称关键词（可选）" />
              </a-form-item>
              <a-form-item label="高级条件">
                <div class="condition-block">
                  <div class="condition-row" v-for="(c, i) in eventFormData.conditions" :key="i">
                    <a-select v-model:value="c.field" style="width:120px" size="small">
                      <a-select-option value="source_ip">来源IP</a-select-option>
                      <a-select-option value="user">操作用户</a-select-option>
                      <a-select-option value="tag">标签</a-select-option>
                    </a-select>
                    <a-select v-model:value="c.op" style="width:80px" size="small">
                      <a-select-option value="=">=</a-select-option>
                      <a-select-option value="!=">!=</a-select-option>
                      <a-select-option value="like">包含</a-select-option>
                    </a-select>
                    <a-input v-model:value="c.value" placeholder="值" size="small" style="flex:1" />
                    <a-button size="small" danger @click="eventFormData.conditions.splice(i, 1)">删除</a-button>
                  </div>
                  <a-button size="small" type="dashed" @click="eventFormData.conditions.push({ field: 'source_ip', op: '=', value: '' })">+ 添加条件</a-button>
                </div>
                <div class="ai-hint">🤖 AI推荐排除"计划变更"等已知低风险事件，<a>一键采纳</a></div>
              </a-form-item>
            </a-form>
          </div>
        </div>

        <!-- 面板3: 事件汇聚参数 -->
        <div class="form-panel">
          <div class="form-panel-header">面板3：事件汇聚参数 <a-tag color="purple" size="small">AI核心推荐</a-tag></div>
          <div class="form-panel-body">
            <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
              <a-form-item label="汇聚范围" required>
                <a-select v-model:value="eventFormData.scope" style="width:100%">
                  <a-select-option value="intra">网元内</a-select-option>
                  <a-select-option value="inter">网元间</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="时间窗口" required>
                <a-radio-group v-model:value="eventFormData.windowMode" class="action-radio-group">
                  <a-radio value="fixed">固定窗口（每 N 分钟聚合一次）</a-radio>
                  <a-radio value="sliding">滑动窗口（每 N 分钟滑动，窗口大小 M 分钟）</a-radio>
                  <a-radio value="session">会话窗口（静默 N 分钟后关闭会话）</a-radio>
                </a-radio-group>
                <div v-if="eventFormData.windowMode === 'fixed'" class="condition-row" style="margin-top:8px;">
                  <span>每</span>
                  <a-input-number v-model:value="eventFormData.fixedInterval" :min="5" :step="5" size="small" style="width:80px" />
                  <span>分钟聚合一次</span>
                </div>
                <div v-if="eventFormData.windowMode === 'sliding'" class="condition-row" style="margin-top:8px;">
                  <span>每</span>
                  <a-input-number v-model:value="eventFormData.slidingStep" :min="1" :step="1" size="small" style="width:70px" />
                  <span>分钟滑动，窗口大小</span>
                  <a-input-number v-model:value="eventFormData.slidingWindow" :min="5" :step="5" size="small" style="width:70px" />
                  <span>分钟</span>
                </div>
                <div v-if="eventFormData.windowMode === 'session'" class="condition-row" style="margin-top:8px;">
                  <span>静默</span>
                  <a-input-number v-model:value="eventFormData.sessionTimeout" :min="5" :step="5" size="small" style="width:80px" />
                  <span>分钟后关闭会话</span>
                </div>
                <div class="ai-hint">🤖 AI分析：事件窗口建议30分钟，比告警窗口更大</div>
              </a-form-item>
              <a-form-item label="触发条件" required>
                <div class="condition-row">
                  <span>周期</span>
                  <a-input-number v-model:value="eventFormData.triggerWindow" :min="60" :step="60" size="small" style="width:100px" />
                  <span>秒内</span>
                  <a-select v-model:value="eventFormData.triggerOp" size="small" style="width:80px">
                    <a-select-option value=">=">≥</a-select-option>
                    <a-select-option value=">">></a-select-option>
                  </a-select>
                  <a-input-number v-model:value="eventFormData.triggerThreshold" :min="1" size="small" style="width:70px" />
                  <span>条</span>
                </div>
              </a-form-item>
              <a-form-item label="结束条件">
                <div class="condition-row">
                  <span>周期</span>
                  <a-input-number v-model:value="eventFormData.endWindow" :min="60" :step="60" size="small" style="width:100px" />
                  <span>秒内</span>
                  <a-select v-model:value="eventFormData.endOp" size="small" style="width:80px">
                    <a-select-option value="<"><</a-select-option>
                    <a-select-option value="<=">≤</a-select-option>
                  </a-select>
                  <a-input-number v-model:value="eventFormData.endThreshold" :min="0" size="small" style="width:70px" />
                  <span>条</span>
                </div>
              </a-form-item>
            </a-form>
          </div>
        </div>

        <!-- 面板4: 事件动作 -->
        <div class="form-panel">
          <div class="form-panel-header">面板4：事件动作</div>
          <div class="form-panel-body">
            <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
              <a-form-item label="汇聚动作" required>
                <a-radio-group v-model:value="eventFormData.actionType" class="action-radio-group">
                  <a-radio value="生成一条汇聚事件">生成一条汇聚事件</a-radio>
                  <a-radio value="汇聚+衍生">生成汇聚事件，并将所有源事件标记为已处理</a-radio>
                  <a-radio value="汇聚+归档">生成汇聚事件，并将源事件移入归档库</a-radio>
                  <a-radio value="汇聚+丢弃">生成汇聚事件，并丢弃所有源事件</a-radio>
                  <a-radio value="直接转发">直接转发源事件，不生成汇聚事件</a-radio>
                </a-radio-group>
                <div class="ai-hint">🤖 AI建议"生成汇聚事件"以保留事件可追溯性</div>
              </a-form-item>
              <a-form-item label="汇聚事件设置">
                <div style="display:flex;gap:12px;">
                  <div style="flex:1">
                    <div class="field-label">事件来源</div>
                    <a-input v-model:value="eventFormData.aggEventSource" placeholder="AI建议：与源事件一致" />
                  </div>
                  <div style="flex:1">
                    <div class="field-label">事件类型</div>
                    <a-select v-model:value="eventFormData.aggEventType" style="width:100%">
                      <a-select-option value="ai_suggest">AI建议：系统事件</a-select-option>
                      <a-select-option value="system">系统事件</a-select-option>
                      <a-select-option value="audit">审计事件</a-select-option>
                      <a-select-option value="security">安全事件</a-select-option>
                    </a-select>
                  </div>
                  <div style="flex:1">
                    <div class="field-label">严重程度</div>
                    <a-select v-model:value="eventFormData.aggSeverity" style="width:100%">
                      <a-select-option value="ai_suggest">AI建议：信息</a-select-option>
                      <a-select-option value="info">信息</a-select-option>
                      <a-select-option value="warning">警告</a-select-option>
                      <a-select-option value="error">错误</a-select-option>
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
              <div class="impact-num">320→28</div>
              <div class="impact-label">日均事件<br>320条→汇聚后28条</div>
            </div>
            <div class="impact-stat">
              <div class="impact-num green">0</div>
              <div class="impact-label">预计漏汇聚</div>
            </div>
            <div class="impact-stat">
              <div class="impact-num green">-91%</div>
              <div class="impact-label">事件噪音降低</div>
            </div>
          </div>
          <a-alert type="warning" show-icon>
            <template #message>
              <strong>AI风险提示：</strong>安全事件类型建议排除，避免遗漏潜在入侵行为。可单独配置安全事件汇聚规则，设置更高触发阈值。
            </template>
            <template #action>
              <a-button size="small" @click="excludeSecurityEvents">一键排除安全事件</a-button>
            </template>
          </a-alert>
        </div>
      </div>

      <!-- ==================== Tab3: 批量创建 ==================== -->
      <div v-if="drawerTab === 'batch'">
        <!-- 创建方式选择 -->
        <div class="batch-method-tabs">
          <div :class="['batch-method-tab', { active: batchMode === 'csv' }]" @click="batchMode = 'csv'">
            <i class="fa-solid fa-file-import"></i> CSV导入
          </div>
          <div :class="['batch-method-tab', { active: batchMode === 'ai' }]" @click="batchMode = 'ai'">
            <i class="fa-solid fa-robot"></i> AI批量生成
          </div>
          <div :class="['batch-method-tab', { active: batchMode === 'clone' }]" @click="batchMode = 'clone'">
            <i class="fa-solid fa-copy"></i> 模板克隆
          </div>
          <div :class="['batch-method-tab', { active: batchMode === 'manual' }]" @click="batchMode = 'manual'">
            <i class="fa-solid fa-table"></i> 手动批量
          </div>
        </div>

        <!-- 方式1: CSV导入 -->
        <template v-if="batchMode === 'csv'">
          <div class="form-panel">
            <div class="form-panel-header">CSV / Excel 导入</div>
            <div class="form-panel-body">
              <div class="csv-upload-zone">
                <div class="csv-upload-inner">
                  <i class="fa-solid fa-cloud-arrow-up" style="font-size:32px;color:var(--brand,#007DFF);margin-bottom:8px;"></i>
                  <div>拖拽 CSV/Excel 文件到此处，或 <a style="color:var(--brand,#007DFF);cursor:pointer;">点击上传</a></div>
                  <div style="font-size:12px;color:#999;margin-top:4px;">支持 .csv / .xlsx 格式，单次最多 500 条规则</div>
                </div>
              </div>
              <div style="margin-top:12px;">
                <span style="font-size:13px;color:#666;">📥 下载模板：</span>
                <a style="color:var(--brand,#007DFF);cursor:pointer;margin-right:12px;">告警汇聚规则模板.xlsx</a>
                <a style="color:var(--brand,#007DFF);cursor:pointer;">事件汇聚规则模板.xlsx</a>
              </div>
              <div class="csv-fields-hint">
                <div class="csv-fields-title">模板字段说明</div>
                <div>规则名称 | 范围(网元内/网元间) | 告警名称关键词 | 触发周期(秒) | 触发操作(≥/>) | 触发阈值 | 结束周期 | 结束阈值 | 动作类型 | 启用(是/否)</div>
              </div>
              <!-- 预览表格 -->
              <div v-if="csvPreviewData.length" style="margin-top:16px;">
                <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📋 导入预览（{{ csvPreviewData.length }} 条）</div>
                <a-table :columns="csvPreviewColumns" :data-source="csvPreviewData" :pagination="false" size="small" :scroll="{ y: 200 }" />
              </div>
            </div>
          </div>
        </template>

        <!-- 方式2: AI批量生成 -->
        <template v-if="batchMode === 'ai'">
          <div class="form-panel">
            <div class="form-panel-header">🤖 AI 批量生成 <a-tag color="purple" size="small">智能推荐</a-tag></div>
            <div class="form-panel-body">
              <div class="ai-prompt-box">
                <a-textarea v-model:value="aiBatchPrompt" :rows="3" placeholder="描述你想要的汇聚规则，AI 自动生成多条规则&#10;&#10;例: 为所有数据库相关告警创建聚合规则，包括MySQL、Redis、MongoDB，触发条件: 1小时内≥3条，动作: 生成汇聚告警" />
                <div style="display:flex;justify-content:flex-end;margin-top:8px;">
                  <a-button type="primary" @click="generateAiRules"><i class="fa-solid fa-wand-magic-sparkles"></i> AI生成</a-button>
                </div>
              </div>
              <div style="margin-top:12px;">
                <span style="font-size:13px;color:#666;">💡 快捷模板：</span>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                  <a-button v-for="tpl in aiQuickTemplates" :key="tpl" size="small" @click="aiBatchPrompt = tpl.desc">{{ tpl.label }}</a-button>
                </div>
              </div>
              <!-- AI生成预览 -->
              <div v-if="aiGeneratedRules.length" style="margin-top:16px;">
                <div style="font-size:13px;font-weight:600;margin-bottom:8px;">🤖 AI 生成预览（{{ aiGeneratedRules.length }} 条规则）</div>
                <div v-for="(rule, idx) in aiGeneratedRules" :key="idx" class="ai-rule-preview-card">
                  <div class="ai-rule-preview-header">
                    <span class="ai-rule-preview-status">✅</span>
                    <span style="font-weight:600;">{{ rule.name }}</span>
                    <div style="margin-left:auto;display:flex;gap:4px;">
                      <a-button size="small" @click="editAiRule(idx)">编辑</a-button>
                      <a-button size="small" danger @click="aiGeneratedRules.splice(idx, 1)">删除</a-button>
                    </div>
                  </div>
                  <div class="ai-rule-preview-meta">
                    <a-tag size="small">{{ rule.scope === 'intra' ? '网元内' : '网元间' }}</a-tag>
                    <span>{{ rule.triggerWindow }}秒内 {{ rule.triggerOp }} {{ rule.triggerThreshold }}条</span>
                    <a-tag size="small">{{ rule.actionType }}</a-tag>
                  </div>
                </div>
                <div class="ai-impact-summary">
                  📊 预估：日均告警 {{ aiImpactStats.before }}条 → {{ aiImpactStats.after }}条 &nbsp; 降噪 <span style="color:#52c41a;">-{{ aiImpactStats.reduction }}%</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 方式3: 模板克隆 -->
        <template v-if="batchMode === 'clone'">
          <div class="form-panel">
            <div class="form-panel-header">📋 从已有规则克隆</div>
            <div class="form-panel-body">
              <a-form layout="horizontal" label-col="{ span: 5 }" wrapper-col="{ span: 18 }">
                <a-form-item label="源规则" required>
                  <a-select v-model:value="cloneSourceId" placeholder="选择要克隆的规则" style="width:100%">
                    <a-select-option v-for="r in aggRules" :key="r.id" :value="r.id">{{ r.name }}</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="克隆数量">
                  <a-input-number v-model:value="cloneCount" :min="1" :max="50" style="width:100px" />
                  <span style="margin-left:8px;color:#999;">条</span>
                </a-form-item>
              </a-form>
              <div class="clone-batch-modify">
                <div class="clone-batch-title">批量修改</div>
                <div class="clone-modify-row" v-for="(m, i) in cloneModifications" :key="i">
                  <a-checkbox v-model:checked="m.enabled">{{ m.label }}</a-checkbox>
                  <template v-if="m.type === 'suffix'">
                    <span style="color:#999;">→</span>
                    <a-input v-model:value="m.value" size="small" style="width:200px;" placeholder="追加后缀: _副本1, _副本2..." />
                  </template>
                  <template v-if="m.type === 'multiply'">
                    <span style="color:#999;">→</span>
                    <span>原始值 ×</span>
                    <a-input-number v-model:value="m.value" :min="0.1" :step="0.1" size="small" style="width:80px;" />
                  </template>
                  <template v-if="m.type === 'select'">
                    <span style="color:#999;">→</span>
                    <a-select v-model:value="m.value" size="small" style="width:120px;">
                      <a-select-option value="keep">不修改</a-select-option>
                      <a-select-option value="intra">网元内</a-select-option>
                      <a-select-option value="inter">网元间</a-select-option>
                    </a-select>
                  </template>
                  <template v-if="m.type === 'switch'">
                    <span style="color:#999;">→</span>
                    <a-select v-model:value="m.value" size="small" style="width:120px;">
                      <a-select-option value="keep">不修改</a-select-option>
                      <a-select-option value="enabled">全部启用</a-select-option>
                      <a-select-option value="disabled">全部停用</a-select-option>
                    </a-select>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 方式4: 手动批量 -->
        <template v-if="batchMode === 'manual'">
          <div class="form-panel">
            <div class="form-panel-header">✏️ 手动批量添加</div>
            <div class="form-panel-body">
              <div class="manual-batch-table">
                <table class="manual-table">
                  <thead>
                    <tr>
                      <th style="width:25%;">规则名称</th>
                      <th style="width:12%;">范围</th>
                      <th style="width:25%;">触发条件</th>
                      <th style="width:20%;">动作</th>
                      <th style="width:8%;">启用</th>
                      <th style="width:10%;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in manualBatchRows" :key="i">
                      <td><a-input v-model:value="row.name" size="small" placeholder="规则名称" /></td>
                      <td>
                        <a-select v-model:value="row.scope" size="small" style="width:100%;">
                          <a-select-option value="intra">网元内</a-select-option>
                          <a-select-option value="inter">网元间</a-select-option>
                        </a-select>
                      </td>
                      <td>
                        <div class="condition-row" style="margin:0;">
                          <a-input-number v-model:value="row.triggerWindow" :min="60" size="small" style="width:60px;" />
                          <span>秒</span>
                          <a-select v-model:value="row.triggerOp" size="small" style="width:50px;">
                            <a-select-option value=">=">≥</a-select-option>
                            <a-select-option value=">">></a-select-option>
                          </a-select>
                          <a-input-number v-model:value="row.triggerThreshold" :min="1" size="small" style="width:50px;" />
                          <span>条</span>
                        </div>
                      </td>
                      <td>
                        <a-select v-model:value="row.actionType" size="small" style="width:100%;">
                          <a-select-option value="生成一条汇聚告警">生成汇聚告警</a-select-option>
                          <a-select-option value="汇聚+屏蔽">汇聚+屏蔽</a-select-option>
                          <a-select-option value="汇聚+丢弃">汇聚+丢弃</a-select-option>
                          <a-select-option value="直接上报">直接上报</a-select-option>
                        </a-select>
                      </td>
                      <td style="text-align:center;"><a-switch v-model:checked="row.enabled" size="small" /></td>
                      <td style="text-align:center;">
                        <a-button size="small" danger @click="manualBatchRows.splice(i, 1)"><i class="fa-solid fa-trash"></i></a-button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <a-button type="dashed" style="width:100%;margin-top:8px;" @click="addManualBatchRow"><i class="fa-solid fa-plus"></i> 添加一行</a-button>
              <div class="manual-batch-summary">
                已添加: <strong>{{ manualBatchRows.length }}</strong> 条规则 &nbsp;|&nbsp; 预估降噪: <span style="color:#52c41a;">-{{ manualBatchReduction }}%</span>
              </div>
            </div>
          </div>
        </template>
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
const activeTab = ref('aggregation')
const scrollY = ref(500)
const drawerVisible = ref(false)
const drawerTab = ref('alert')
const showAdjustPanel = ref(false)
const adjustWindow = ref(3600)
const adjustOp = ref('>=')
const adjustThreshold = ref(3)

// 汇聚规则
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

function updateScrollY() { scrollY.value = window.innerHeight - 380 }

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

// ====== 事件汇聚规则表单 ======
const eventTypeOptions = [
  { label: '系统事件', value: 'system' },
  { label: '审计事件', value: 'audit' },
  { label: '安全事件', value: 'security' },
  { label: '变更事件', value: 'change' },
  { label: '性能事件', value: 'performance' },
  { label: '自定义', value: 'custom' },
]
const eventFormData = reactive({
  name: '',
  description: '',
  enabled: true,
  eventTypes: ['system', 'audit', 'performance'],
  sourceMode: 'all',
  severity: 'below_warning',
  eventName: '',
  conditions: [],
  scope: 'intra',
  windowMode: 'fixed',
  fixedInterval: 30,
  slidingStep: 5,
  slidingWindow: 30,
  sessionTimeout: 10,
  triggerWindow: 3600,
  triggerOp: '>=',
  triggerThreshold: 3,
  endWindow: 1800,
  endOp: '<=',
  endThreshold: 1,
  actionType: '生成一条汇聚事件',
  aggEventSource: '',
  aggEventType: 'ai_suggest',
  aggSeverity: 'ai_suggest',
})
function excludeSecurityEvents() {
  eventFormData.eventTypes = eventFormData.eventTypes.filter(function(t) { return t !== 'security' })
}

// ====== 批量创建 ======
const batchMode = ref('csv')

// CSV导入
const csvPreviewData = ref([])
const csvPreviewColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '范围', dataIndex: 'scope', key: 'scope' },
  { title: '触发条件', dataIndex: 'trigger', key: 'trigger' },
  { title: '动作', dataIndex: 'actionType', key: 'actionType' },
  { title: '状态', dataIndex: 'enabled', key: 'enabled' },
]

// AI批量生成
const aiBatchPrompt = ref('')
const aiGeneratedRules = ref([])
const aiQuickTemplates = [
  { label: '数据库类', desc: '为所有数据库相关告警创建聚合规则，包括MySQL、Redis、MongoDB、PostgreSQL，触发条件: 1小时内≥3条，动作: 生成汇聚告警' },
  { label: '网络类', desc: '为网络相关告警创建聚合规则，包括网络抖动、丢包、延迟，触发条件: 10分钟内≥5条，动作: 汇聚+屏蔽' },
  { label: '服务器类', desc: '为服务器基础告警创建聚合规则，包括CPU、内存、磁盘、负载，触发条件: 30分钟内≥3条，动作: 生成汇聚告警' },
  { label: '容器类', desc: '为容器/K8s告警创建聚合规则，包括Pod重启、CrashLoop、OOM，触发条件: 1小时内≥5条，动作: 生成汇聚告警' },
  { label: '证书类', desc: '为SSL证书过期告警创建聚合规则，触发条件: 24小时内≥3条，动作: 生成汇聚告警' },
]
const aiImpactStats = reactive({ before: 0, after: 0, reduction: 0 })
function generateAiRules() {
  aiGeneratedRules.value = [
    { name: 'MySQL慢查询聚合', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 3, actionType: '生成一条汇聚告警' },
    { name: 'Redis连接数告警聚合', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 2, actionType: '生成一条汇聚告警' },
    { name: 'MongoDB副本集延迟聚合', scope: 'inter', triggerWindow: 1800, triggerOp: '>=', triggerThreshold: 5, actionType: '汇聚+屏蔽' },
  ]
  aiImpactStats.before = 45
  aiImpactStats.after = 5
  aiImpactStats.reduction = 89
}
function editAiRule(idx) {
  formData.name = aiGeneratedRules.value[idx].name
  formData.scope = aiGeneratedRules.value[idx].scope
  formData.triggerWindow = aiGeneratedRules.value[idx].triggerWindow
  formData.triggerOp = aiGeneratedRules.value[idx].triggerOp
  formData.triggerThreshold = aiGeneratedRules.value[idx].triggerThreshold
  formData.actionType = aiGeneratedRules.value[idx].actionType
  drawerTab.value = 'alert'
}

// 模板克隆
const cloneSourceId = ref(null)
const cloneCount = ref(5)
const cloneModifications = reactive([
  { label: '规则名称', type: 'suffix', value: '_副本', enabled: true },
  { label: '触发阈值', type: 'multiply', value: 1.5, enabled: true },
  { label: '汇聚范围', type: 'select', value: 'keep', enabled: false },
  { label: '启用状态', type: 'switch', value: 'enabled', enabled: true },
])

// 手动批量
const manualBatchRows = ref([
  { name: '', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 3, actionType: '生成一条汇聚告警', enabled: true },
])
const manualBatchReduction = computed(function() {
  if (manualBatchRows.value.length === 0) return 0
  return Math.min(90, manualBatchRows.value.length * 15)
})
function addManualBatchRow() {
  manualBatchRows.value.push({ name: '', scope: 'intra', triggerWindow: 3600, triggerOp: '>=', triggerThreshold: 3, actionType: '生成一条汇聚告警', enabled: true })
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

.ai-overview { background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%); border: 1px solid #d6e8f7; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
.ai-overview-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; }
.ai-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #007DFF); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0; }
.ai-result-tags { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

.suggestion-card { background: #fff; border: 1px solid #e5e5ea; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: box-shadow 0.2s; }
.suggestion-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.suggestion-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.suggestion-title { font-size: 14px; font-weight: 600; }
.suggestion-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 12px; }
.suggestion-desc code { background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 12px; color: #f5222d; }
.suggestion-actions { display: flex; gap: 8px; }
.adjust-panel { margin-top: 12px; padding: 12px; background: #f9f9fb; border: 1px dashed var(--brand, #007DFF); border-radius: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

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

.impact-card { background: linear-gradient(135deg, #f6ffed 0%, #f0f7ff 100%); border: 1px solid #d9f7be; border-radius: 8px; padding: 16px; margin-top: 16px; }
.impact-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
.impact-stats { display: flex; gap: 24px; margin-bottom: 12px; }
.impact-stat { text-align: center; }
.impact-num { font-size: 24px; font-weight: 700; color: var(--brand, #007DFF); }
.impact-num.green { color: #52c41a; }
.impact-label { font-size: 12px; color: #666; margin-top: 2px; }

/* ====== 批量创建样式 ====== */
.batch-method-tabs { display:flex; gap:0; margin-bottom:16px; border:1px solid #e5e5ea; border-radius:8px; overflow:hidden; }
.batch-method-tab { flex:1; padding:10px 12px; text-align:center; font-size:13px; cursor:pointer; background:#fafafa; border-right:1px solid #e5e5ea; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:6px; }
.batch-method-tab:last-child { border-right:none; }
.batch-method-tab:hover { background:#f0f7ff; color:var(--brand,#007DFF); }
.batch-method-tab.active { background:var(--brand,#007DFF); color:#fff; font-weight:600; }

.csv-upload-zone { border:2px dashed #d9d9d9; border-radius:8px; padding:32px; text-align:center; cursor:pointer; transition:border-color 0.2s; }
.csv-upload-zone:hover { border-color:var(--brand,#007DFF); }
.csv-upload-inner { display:flex; flex-direction:column; align-items:center; }
.csv-fields-hint { margin-top:12px; padding:10px 12px; background:#f7f8fa; border-radius:6px; font-size:12px; color:#666; line-height:1.8; }
.csv-fields-title { font-weight:600; margin-bottom:4px; }

.ai-prompt-box { border:1px solid #e5e5ea; border-radius:8px; padding:12px; background:#fafafa; }
.ai-rule-preview-card { background:#f7f8fa; border:1px solid #e5e5ea; border-radius:6px; padding:10px 12px; margin-bottom:8px; }
.ai-rule-preview-header { display:flex; align-items:center; gap:6px; }
.ai-rule-preview-status { color:#52c41a; }
.ai-rule-preview-meta { display:flex; align-items:center; gap:8px; margin-top:6px; font-size:12px; color:#666; }
.ai-impact-summary { margin-top:12px; padding:10px 12px; background:linear-gradient(135deg, #f6ffed 0%, #f0f7ff 100%); border:1px solid #d9f7be; border-radius:6px; font-size:13px; }

.clone-batch-modify { margin-top:16px; border:1px solid #e5e5ea; border-radius:8px; overflow:hidden; }
.clone-batch-title { background:#f7f8fa; padding:8px 12px; font-weight:600; font-size:13px; border-bottom:1px solid #e5e5ea; }
.clone-modify-row { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #f0f0f0; }
.clone-modify-row:last-child { border-bottom:none; }

.manual-batch-table { overflow-x:auto; }
.manual-table { width:100%; border-collapse:collapse; font-size:13px; }
.manual-table th { background:#fafafa; padding:8px; text-align:left; font-weight:600; border-bottom:1px solid #e5e5ea; }
.manual-table td { padding:4px; border-bottom:1px solid #f0f0f0; }
.manual-batch-summary { margin-top:12px; padding:8px 12px; background:#f7f8fa; border-radius:6px; font-size:13px; color:#666; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; }
  .filter-bar .ant-select,
  .filter-bar input { width: 100% !important; }
  .batch-method-tabs { flex-wrap:wrap; }
  .batch-method-tab { flex:1 1 45%; }
}
</style>
