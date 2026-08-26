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
            <a-button type="primary"><i class="fa-solid fa-volume-off"></i></a-button>
            <a-input-search v-model:value="searchText" placeholder="搜索告警名称、资源" class="search-input" />
          </div>

          <!-- AI 聚合推荐横幅 -->
          <div v-if="aggregationBanners.length" class="ai-aggregation-banners">
            <div v-for="banner in aggregationBanners" :key="banner.key" class="ai-agg-banner" :class="{ aggregated: banner.aggregated }">
              <div class="agg-banner-left">
                <i class="fa-solid fa-robot agg-icon"></i>
                <div class="agg-banner-info">
                  <span class="agg-banner-title">{{ banner.title }}</span>
                  <span class="agg-banner-meta">同类 {{ banner.count }} 条 · 近1小时内触发</span>
                </div>
                <div class="agg-banner-resources">
                  <span v-for="ra in banner.alerts.slice(0, 4)" :key="ra.id" class="agg-res-tag" @click="openDetail(ra)">
                    <a-tag :color="getLevelColor(ra.level)" size="small">{{ getLevelText(ra.level) }}</a-tag>
                    {{ ra.resource.length > 14 ? ra.resource.slice(0, 14) + '…' : ra.resource }}
                  </span>
                  <span v-if="banner.count > 4" class="agg-more">+{{ banner.count - 4 }}</span>
                </div>
              </div>
              <div class="agg-banner-right">
                <a-button v-if="!banner.aggregated" size="small" type="primary" :loading="aggregatingKeys[banner.key]" @click="aggregateAlerts(banner.key)">
                  <i class="fa-solid fa-filter"></i> AI 聚合降噪
                </a-button>
                <a-button v-else size="small" type="default" @click="expandGroup(banner.key)">
                  <i class="fa-solid" :class="banner.expanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                  {{ banner.expanded ? '收起' : '展开' }} ({{ banner.count }})
                </a-button>
              </div>
              <!-- 聚合详情面板 -->
              <div v-if="banner.aggregated && banner.expanded" class="agg-detail-panel">
                <div class="agg-detail-content">
                  <div v-if="banner.aiResult" class="agg-ai-result">
                    <div class="agg-ai-header">
                      <i class="fa-solid fa-robot"></i>
                      <span>AI 聚合分析结果</span>
                    </div>
                    <div class="agg-ai-section">
                      <strong>推测根因：</strong>{{ banner.aiResult.rootCause }}
                    </div>
                    <div class="agg-ai-section">
                      <strong>处置建议：</strong>
                      <ol><li v-for="(s, i) in banner.aiResult.suggestions" :key="i">{{ s }}</li></ol>
                    </div>
                  </div>
                  <div class="agg-alert-list">
                    <div v-for="ra in banner.alerts" :key="ra.id" class="agg-alert-row" :class="'level-' + ra.level" @click="openDetail(ra)">
                      <a-tag :color="getLevelColor(ra.level)" size="small">{{ getLevelText(ra.level) }}</a-tag>
                      <span class="agg-alert-resource">{{ ra.resource }}</span>
                      <span class="agg-alert-metric">{{ ra.metric }} {{ ra.currentValue }} / {{ ra.threshold }}</span>
                      <span class="agg-alert-time">{{ ra.triggerTime }}</span>
                    </div>
                  </div>
                  <div class="agg-detail-actions">
                    <a-button size="small" type="primary" @click.stop="createIncidentFromGroup(banner)">
                      <i class="fa-solid fa-file-circle-plus"></i> 一键生成故障单
                    </a-button>
                    <a-button size="small" @click.stop="muteGroup(banner)">
                      <i class="fa-solid fa-volume-off"></i> 屏蔽本组
                    </a-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a-table
            :columns="columns"
            :data-source="displayAlerts"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            :row-selection="{ selectedRowKeys: selectedKeys, onChange: function(keys) { selectedKeys = keys } }"
            row-key="id"
            :row-class-name="function(record) { return 'row-' + record.level }"
            :scroll="{ x: 1520, y: scrollY }"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="getLevelColor(record.level)">{{ getLevelText(record.level) }}</a-tag>
              </template>
              <template v-if="column.key === 'title'">
                <template v-if="record.aiSuggest">
                  <div class="ai-title-cell">
                    <a-tooltip placement="right" :overlay-style="{ maxWidth: '520px' }">
                      <template #title>
                        <div class="ai-tip-content">
                          <div class="ai-tip-header">
                            <i class="fa-solid fa-star ai-star-icon"></i>
                            发现重复告警模式
                          </div>
                          <div class="ai-tip-summary">
                            "<b>{{ record.title }}</b>" 在过去24小时里重复触发 <b>{{ record.aiSuggest.count }}</b> 次。
                          </div>
                          <div class="ai-tip-stats">
                            <div class="ai-tip-stat-item">
                              <span class="ai-tip-stat-label">建议抑制窗口</span>
                              <span class="ai-tip-stat-value">{{ Math.min(record.aiSuggest.count * 5, 60) }}分钟</span>
                            </div>
                            <div class="ai-tip-stat-item">
                              <span class="ai-tip-stat-label">预估降噪效果</span>
                              <span class="ai-tip-stat-value">{{ Math.round((record.aiSuggest.count - 1) / record.aiSuggest.count * 100) }}%</span>
                            </div>
                          </div>
                          <div class="ai-tip-divider"></div>
                          <div class="ai-tip-resources">
                            <div class="ai-tip-res-label">关联资源 ({{ record.aiSuggest.alerts.length }}个):</div>
                            <div v-for="ra in record.aiSuggest.alerts.slice(0, 3)" :key="ra.id" class="ai-tip-res-row" :class="'level-' + ra.level" @click.stop="openDetail(ra)">
                              <a-tag :color="getLevelColor(ra.level)" size="small">{{ getLevelText(ra.level) }}</a-tag>
                              <span class="ai-tip-res-name">{{ ra.resource }}</span>
                              <span class="ai-tip-res-metric">{{ ra.metric }} {{ ra.currentValue }}</span>
                              <span class="ai-tip-res-time">{{ ra.displayDuration }}前</span>
                            </div>
                            <div v-if="record.aiSuggest.alerts.length > 3" class="ai-tip-res-more">+ {{ record.aiSuggest.alerts.length - 3 }} more...</div>
                          </div>
                          <div class="ai-tip-actions">
                            <a-button size="small" type="primary" class="ai-action-btn" :loading="aggregatingKeys[record.aiSuggest.key]" @click.stop="aggregateAlerts(record.aiSuggest.key)">
                              应用推荐规则
                            </a-button>
                            <a-button size="small" class="ai-action-btn" @click.stop="openCustomAdjust(record)">
                              自定义调整
                            </a-button>
                            <a-button type="link" size="small" class="ai-detail-link" @click.stop="openDetail(record)">
                              查看详情
                            </a-button>
                          </div>
                        </div>
                      </template>
                      <span class="alert-link ai-title-link"><i class="fa-solid fa-star ai-badge-icon"></i>{{ record.title }}</span>
                      <span class="ai-badge">{{ record.aiSuggest.count }}</span>
                    </a-tooltip>
                  </div>
                </template>
                <template v-else>
                  <a class="alert-link" @click="openDetail(record)">{{ record.title }}</a>
                </template>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'firing' ? 'red' : record.status === 'resolved' ? 'green' : 'default'">
                  {{ record.status === 'firing' ? '待处理' : record.status === 'resolved' ? '已恢复' : '已屏蔽' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'incident'">
                <template v-if="record.incidentId">
                  <a-tag color="blue" class="incident-tag" @click.stop="gotoIncident(record.incidentId)">{{ record.incidentId }}</a-tag>
                </template>
                <template v-else>
                  <a-button type="link" size="small" class="create-incident-btn" @click.stop="createIncidentFromAlert(record)">
                    <i class="fa-solid fa-plus"></i> 一键建单
                  </a-button>
                </template>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-btns">
                  <a-tooltip title="AI 分析">
                    <button class="icon-btn ai-btn" @click="openAnalysis(record)"><i class="fa-solid fa-robot"></i></button>
                  </a-tooltip>
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

      <a-tab-pane key="intelligent" tab="智能检测">
        <div class="history-alerts">
          <div class="filter-bar">
            <a-select v-model:value="intelLevelFilter" placeholder="级别筛选" style="width:120px" allowClear>
              <a-select-option value="critical">严重</a-select-option>
              <a-select-option value="warning">警告</a-select-option>
              <a-select-option value="info">提示</a-select-option>
            </a-select>
            <a-input-search v-model:value="intelSearch" placeholder="搜索节点、指标" class="search-input" />
          </div>
          <a-table
            :columns="intelColumns"
            :data-source="intelFilteredData"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: function(t) { return '共 ' + t + ' 条' } }"
            row-key="id"
            :scroll="{ y: scrollY, x: 1100 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="record.level === 'critical' ? 'red' : record.level === 'warning' ? 'orange' : 'blue'">
                  {{ { critical: '紧急', warning: '重要', info: '次要' }[record.level] || record.level }}
                </a-tag>
              </template>
              <template v-if="column.key === 'score'">
                <a-progress :percent="Math.round(record.score * 100)" :stroke-color="record.score > 0.7 ? '#F5222D' : record.score > 0.3 ? '#FF7D00' : '#07C160'" size="small" />
              </template>
              <template v-if="column.key === 'type'">
                <a-tag>{{ { spike: '突增', drop: '骤降', trend: '趋势' }[record.type] || record.type }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <div class="action-btns">
                  <a-tooltip title="查看详情">
                    <button class="icon-btn" @click="openIntelDetail(record)"><i class="fa-solid fa-eye"></i></button>
                  </a-tooltip>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <div class="detail-panel" :class="{ open: detailVisible }">
      <div class="detail-mask" @click="closeDetail"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <div class="detail-title">
            <h3>{{ currentAlert ? currentAlert.title : '告警详情' }}</h3>
            <a-tag v-if="currentAlert" :color="getLevelColor(currentAlert.level)" class="detail-level-tag">{{ getLevelText(currentAlert.level) }}</a-tag>
          </div>
          <div class="detail-actions">
            <a-button v-if="!currentAlert?.incidentId" size="small" type="primary" class="drawer-create-incident-btn" @click="createIncidentFromAlert(currentAlert)">
              <i class="fa-solid fa-file-circle-plus"></i> 一键生成故障单
            </a-button>
            <a-button size="small" :type="alertConfirmed ? 'default' : 'primary'" :disabled="alertConfirmed" @click="onConfirmAlert">
              <i class="fa-solid fa-check"></i> {{ alertConfirmed ? '已确认' : '确认' }}
            </a-button>
            <a-button size="small" @click="onHandleAlert"><i class="fa-solid fa-hammer"></i> 处理</a-button>
            <button class="close-btn" @click="closeDetail"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div class="detail-scroll" v-if="currentAlert" ref="detailScrollRef">
          <div class="trend-card">
            <div class="trend-title">
              <span class="trend-name">指标趋势（{{ currentAlert.status === 'resolved' ? '触发至恢复' : '触发前24小时' }}）</span>
              <span class="trend-legend">
                <span class="legend-item"><i class="legend-dot current-dot"></i>当前值 <b>{{ currentAlert.currentValue }}</b></span>
                <span class="legend-item"><i class="legend-dot threshold-dot"></i>阈值 <b>{{ currentAlert.threshold }}</b></span>
                <span class="legend-item"><i class="legend-dot baseline-dot"></i>基线</span>
              </span>
            </div>
            <div ref="trendContainer" class="trend-chart"></div>
          </div>

          <div class="time-tags">
            <div class="trigger-time-tag">
              <i class="fa-solid fa-clock"></i> 触发时间：{{ formatTime(currentAlert.triggerTime) }}
            </div>
            <div v-if="currentAlert.status === 'resolved' && currentAlert.recoveryTime && currentAlert.recoveryTime !== '-'" class="recovery-time-tag">
              <i class="fa-solid fa-check"></i> 恢复时间：{{ formatTime(currentAlert.recoveryTime) }}
            </div>
          </div>

          <div class="info-cards">
            <div class="info-card">
              <div class="info-card-title">数据源信息</div>
              <div class="info-list">
                <div class="info-item"><span class="info-label">来源系统</span><span class="info-value">{{ currentAlert.sourceSystem || '运维监控平台' }}</span></div>
                <div class="info-item"><span class="info-label">云服务</span><span class="info-value">{{ currentAlert.cloudService || '-' }}</span></div>
                <div class="info-item"><span class="info-label">告警指标</span><span class="info-value">{{ currentAlert.metric || '-' }}</span></div>
                <div class="info-item"><span class="info-label">当前值</span><span class="info-value">{{ currentAlert.currentValue }}</span></div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-title">异常对象</div>
              <div class="info-list">
                <div class="info-item"><span class="info-label">告警源</span><span class="info-value clickable" title="点击筛选该资源" @click="filterByResource(currentAlert.resource)">{{ currentAlert.resource }}</span></div>
                <div class="info-item"><span class="info-label">IP地址</span><span class="info-value clickable" title="点击复制" @click="copyText(currentAlert.ip)">{{ currentAlert.ip || '-' }}</span></div>
                <div class="info-item"><span class="info-label">状态</span><span class="info-value">{{ currentAlert.status === 'firing' ? '待处理' : currentAlert.status === 'resolved' ? '已恢复' : '已屏蔽' }}</span></div>
              </div>
            </div>
          </div>

          <div class="impact-section">
            <div class="impact-block impact-red">
              <div class="impact-title"><i class="fa-solid fa-triangle-exclamation"></i> 告警影响</div>
              <div class="impact-body">{{ currentAlert.impact || '告警持续期间可能影响相关业务服务的稳定性与可用性，需尽快处理。' }}</div>
            </div>
            <div class="impact-block impact-green">
              <div class="impact-title"><i class="fa-solid fa-wrench"></i> 修复建议</div>
              <div class="impact-body">{{ currentAlert.suggestion }}</div>
            </div>
          </div>

          <div class="jump-links">
            <a class="jump-link" @click="jumpTo('dashboard')"><i class="fa-solid fa-chart-line"></i> 关联仪表盘</a>
            <a class="jump-link" @click="jumpTo('logs')"><i class="fa-solid fa-file-lines"></i> 相关日志</a>
            <a class="jump-link" @click="jumpTo('host')"><i class="fa-solid fa-server"></i> 主机详情</a>
          </div>

          <div class="expand-toggle" @click="detailExpanded = !detailExpanded">
            <span>{{ detailExpanded ? '收起完整信息' : '展开完整信息' }}</span>
            <i class="fa-solid fa-chevron-down" :class="{ 'is-rotated': detailExpanded }"></i>
          </div>

          <div v-show="detailExpanded" class="detail-tabs-wrap" ref="detailTabsWrapRef">
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
                        {{ currentAlert.status === 'firing' ? '待处理' : '已恢复' }}
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
            <a-tab-pane key="analysis" tab="AI 分析">
              <div class="tab-panel">
                <div v-if="aiLoading" class="ai-analysis-loading">
                  <div class="ai-thinking">
                    <i class="fa-solid fa-robot"></i>
                    <span>AI 正在分析该告警</span>
                    <span class="ai-dots"><i></i><i></i><i></i></span>
                  </div>
                  <div class="ai-loading-steps">
                    <div><i class="fa-solid fa-list-check"></i> 正在汇总告警上下文</div>
                    <div><i class="fa-solid fa-clock-rotate-left"></i> 正在关联历史告警与维护经验</div>
                    <div><i class="fa-solid fa-lightbulb"></i> 正在生成根因推测与处置建议</div>
                  </div>
                </div>
                <div v-else-if="aiResult" class="ai-analysis-result">
                  <div class="ai-result-header">
                    <i class="fa-solid fa-robot ai-result-icon"></i>
                    <span class="ai-result-title">AI 分析结果</span>
                    <a-tag color="blue" size="small">置信度 {{ aiResult.confidence }}%</a-tag>
                  </div>
                  <div class="ai-section">
                    <div class="ai-section-title"><i class="fa-solid fa-magnifying-glass"></i> 根因推测</div>
                    <div class="ai-section-body">{{ aiResult.rootCause }}</div>
                  </div>
                  <div class="ai-section">
                    <div class="ai-section-title"><i class="fa-solid fa-bullseye"></i> 影响面评估</div>
                    <div class="ai-section-body">{{ aiResult.impact }}</div>
                  </div>
                  <div class="ai-section">
                    <div class="ai-section-title"><i class="fa-solid fa-list-check"></i> 处置建议</div>
                    <ol class="ai-suggest-list">
                      <li v-for="(s, index) in aiResult.suggestions" :key="index">{{ s }}</li>
                    </ol>
                  </div>
                  <div v-if="aiResult.relatedAlerts.length" class="ai-section">
                    <div class="ai-section-title"><i class="fa-solid fa-link"></i> 关联告警</div>
                    <div class="ai-related-list">
                      <div v-for="ra in aiResult.relatedAlerts" :key="ra.id" class="ai-related-item">
                        <a-tag :color="getLevelColor(ra.level)" size="small">{{ getLevelText(ra.level) }}</a-tag>
                        <span class="ai-related-title">{{ ra.title }}</span>
                        <span class="ai-related-resource">{{ ra.resource }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ai-footer">
                    <a-button size="small" type="primary" @click="continueInAssistant">
                      <i class="fa-solid fa-comment-dots"></i> 在 AI 助手中继续分析
                    </a-button>
                  </div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="experience" tab="维护经验">
              <div class="tab-panel">
                <div v-if="relatedExperience.length" class="exp-list">
                  <div v-for="exp in relatedExperience" :key="exp.id" class="exp-item">
                    <div class="exp-title"><i class="fa-solid fa-book"></i> {{ exp.title }}</div>
                    <div class="exp-meta">{{ exp.category }} · {{ exp.author }} · {{ exp.time }} · 有帮助 {{ exp.helpful }}</div>
                    <div class="exp-content">{{ exp.content }}</div>
                  </div>
                </div>
                <div v-else class="tab-empty">
                  <i class="fa-solid fa-book"></i>
                  <p>暂无相关维护经验</p>
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

        <div class="detail-footer">
          <div class="timeline">
            <div class="timeline-title"><i class="fa-solid fa-clock-rotate-left"></i> 事件时间线</div>
            <div class="timeline-list">
              <div v-for="ev in detailTimeline.slice().reverse()" :key="ev.id" class="timeline-item">
                <i class="timeline-dot" :class="'tl-' + ev.type"></i>
                <div class="timeline-content">
                  <div class="timeline-head">
                    <span class="tl-tag" :class="'tl-tag-' + ev.type">{{ ev.label }}</span>
                    <span class="tl-meta">{{ ev.operator }} · {{ ev.time }}</span>
                  </div>
                  <div class="tl-text">{{ ev.content }}</div>
                </div>
              </div>
              <div v-if="!detailTimeline.length" class="note-empty">暂无事件记录</div>
            </div>
          </div>
          <div class="footer-actions">
            <a-button size="small" @click="onIgnoreAlert"><i class="fa-solid fa-ban"></i> 忽略</a-button>
            <a-button size="small" @click="assignVisible = !assignVisible"><i class="fa-solid fa-user-check"></i> 设置处理人</a-button>
            <a-button size="small" type="primary" @click="commentVisible = !commentVisible"><i class="fa-solid fa-comment"></i> 注释</a-button>
          </div>
          <div v-if="assignVisible" class="footer-row">
            <a-select v-model:value="assignTarget" size="small" style="width: 120px" placeholder="选择处理人">
              <a-select-option value="张工">张工</a-select-option>
              <a-select-option value="李工">李工</a-select-option>
              <a-select-option value="王工">王工</a-select-option>
              <a-select-option value="赵工">赵工</a-select-option>
            </a-select>
            <a-button size="small" type="primary" @click="onAssign">确定</a-button>
          </div>
          <div v-if="commentVisible" class="footer-row">
            <a-input v-model:value="commentText" size="small" placeholder="输入注释内容，回车提交" @pressEnter="onAddComment" />
            <a-button size="small" type="primary" @click="onAddComment">提交</a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { Chart } from '@antv/g2'

const route = useRoute()
const router = useRouter()

const activeTab = ref('current')
const searchText = ref('')
const selectedKeys = ref([])
const refreshInterval = ref(30)
const templateValue = ref(null)
const detailVisible = ref(false)
const currentAlert = ref(null)
const activeDetailTab = ref('info')
const detailExpanded = ref(true)
const alertConfirmed = ref(false)
const scrollY = ref(500)

const detailTimeline = ref([])
const commentVisible = ref(false)
const commentText = ref('')
const assignVisible = ref(false)
const assignTarget = ref(null)

const aiLoading = ref(false)
const aiResult = ref(null)
let aiAnalyzedAlertId = null
let aiTimer = null

// AI 聚合相关
const aggregatedGroups = ref({})   // key -> { alerts, rootCause, suggestions, incident }
const aggregatingKeys = ref({})   // key -> boolean loading state

const detailScrollRef = ref(null)
const detailTabsWrapRef = ref(null)

const trendContainer = ref(null)
let trendChart = null

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

const intelSearch = ref('')
const intelLevelFilter = ref(null)
const intelData = ref([])

const intelColumns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
  { title: '节点', dataIndex: 'nodeLabel', key: 'nodeLabel', width: 140 },
  { title: '指标', dataIndex: 'metric', key: 'metric', width: 100 },
  { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 80 },
  { title: '基线', dataIndex: 'baseline', key: 'baseline', width: 80 },
  { title: '偏离度', dataIndex: 'deviation', key: 'deviation', width: 90, sorter: (a, b) => Math.abs(a.deviation) - Math.abs(b.deviation) },
  { title: '得分', dataIndex: 'score', key: 'score', width: 120, sorter: (a, b) => a.score - b.score },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '操作', key: 'action', width: 60, fixed: 'right' },
]

const intelFilteredData = computed(() => {
  let list = intelData.value
  if (intelLevelFilter.value) list = list.filter(a => a.level === intelLevelFilter.value)
  if (intelSearch.value) {
    const kw = intelSearch.value.toLowerCase()
    list = list.filter(a => a.nodeLabel?.toLowerCase().includes(kw) || a.metric?.toLowerCase().includes(kw))
  }
  return list
})

async function fetchIntelData() {
  try {
    const res = await fetch('/api/intelligent/anomalies')
    const data = await res.json()
    intelData.value = data.data || []
  } catch {}
}

function openIntelDetail(record) {
  // TODO: open detail modal
}

const realtimeAlerts = ref([
  { id: 1, level: 'critical', title: 'CPU使用率超过90%', resource: 'server-001 (华北区域)', metric: 'CPU使用率', currentValue: '95%', threshold: '> 90%', duration: '5分钟', displayDuration: '5分钟', durationMinutes: 5, triggerTime: '2026-06-17 10:32:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查是否有异常进程占用CPU\n2. 查看应用日志定位慢查询\n3. 必要时重启相关服务', sourceSystem: 'Prometheus', cloudService: '云服务器ECS', ip: '10.0.1.15', impact: '服务器处理能力下降，业务接口响应变慢，可能影响高峰期用户体验。' },
  { id: 2, level: 'critical', title: '磁盘空间不足', resource: 'db-primary (华东区域)', metric: '磁盘使用率', currentValue: '92%', threshold: '> 90%', duration: '12分钟', displayDuration: '12分钟', durationMinutes: 12, triggerTime: '2026-06-17 10:28:00', recoveryTime: '-', status: 'firing', suggestion: '1. 清理过期日志文件\n2. 检查大表并归档历史数据\n3. 扩容磁盘或迁移数据', sourceSystem: 'Prometheus', cloudService: '云数据库RDS', ip: '10.0.2.31', impact: '磁盘写满将导致数据库写入失败，存在数据丢失风险。' },
  { id: 3, level: 'critical', title: '数据库主从延迟', resource: 'db-replica-02 (华东区域)', metric: '复制延迟', currentValue: '35s', threshold: '> 10s', duration: '37分钟', displayDuration: '37分钟', durationMinutes: 37, triggerTime: '2026-06-17 09:55:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查主库写入压力\n2. 检查从库IO/SQL线程状态\n3. 确认网络带宽是否充足', sourceSystem: 'Prometheus', cloudService: '云数据库RDS', ip: '10.0.2.32', impact: '读写分离场景下从库数据延迟，实时报表与查询结果滞后。' },
  { id: 4, level: 'warning', title: '内存使用率偏高', resource: 'app-server-03 (华南区域)', metric: '内存使用率', currentValue: '82%', threshold: '> 80%', duration: '20分钟', displayDuration: '20分钟', durationMinutes: 20, triggerTime: '2026-06-17 10:15:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查JVM堆内存使用情况\n2. 分析是否有内存泄漏\n3. 调整容器内存限制', sourceSystem: '自研Agent', cloudService: '云服务器ECS', ip: '10.0.1.45', impact: '应用响应变慢，内存耗尽可能导致容器OOM重启。' },
  { id: 5, level: 'warning', title: '响应时间超时', resource: 'api-gateway (华北区域)', metric: '响应时间', currentValue: '2500ms', threshold: '> 2000ms', duration: '1小时', displayDuration: '1小时', durationMinutes: 60, triggerTime: '2026-06-17 09:45:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查下游服务响应时间\n2. 分析慢请求链路\n3. 考虑增加限流或降级策略' },
  { id: 6, level: 'warning', title: 'HTTP 5xx错误率上升', resource: 'nginx-ingress (华北区域)', metric: '5xx错误率', currentValue: '3.2%', threshold: '> 1%', duration: '1.5小时', displayDuration: '1.5小时', durationMinutes: 90, triggerTime: '2026-06-17 09:30:00', recoveryTime: '-', status: 'suppressed', suggestion: '1. 检查后端服务健康状态\n2. 查看nginx错误日志\n3. 回滚最近变更', sourceSystem: 'Prometheus', cloudService: '负载均衡SLB', ip: '10.0.3.11', impact: '部分用户请求返回5xx错误，核心业务交易可能受影响。' },
  { id: 7, level: 'info', title: '连接数接近上限', resource: 'redis-cluster (华东区域)', metric: '连接数', currentValue: '85%', threshold: '> 80%', duration: '2小时', displayDuration: '2小时', durationMinutes: 120, triggerTime: '2026-06-17 09:20:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查连接池配置\n2. 排查是否有连接泄漏\n3. 考虑扩容Redis节点', sourceSystem: '云监控', cloudService: '云数据库Redis', ip: '10.0.4.20', impact: '连接数耗尽后新连接无法建立，业务高峰可能拒绝服务。' },
  { id: 8, level: 'info', title: '证书即将过期', resource: 'cdn-domain.example.com', metric: '证书剩余天数', currentValue: '15天', threshold: '< 30天', duration: '2.5小时', displayDuration: '2.5小时', durationMinutes: 150, triggerTime: '2026-06-17 08:00:00', recoveryTime: '-', status: 'firing', suggestion: '1. 申请新证书\n2. 更新证书配置\n3. 验证HTTPS访问正常', sourceSystem: '证书监控', cloudService: 'CDN域名服务', ip: '-', impact: '证书过期后HTTPS访问中断，影响全站安全访问。' },
  { id: 9, level: 'critical', title: 'K8s Pod频繁重启', resource: 'payment-service (prod)', metric: 'Pod重启率', currentValue: '5次/小时', threshold: '> 3次/小时', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-17 08:45:00', recoveryTime: '2026-06-17 10:00:00', status: 'resolved', suggestion: '1. 查看Pod事件和日志\n2. 检查OOMKilled情况\n3. 调整resources限制', sourceSystem: 'Prometheus', cloudService: '容器服务ACK', ip: '10.0.5.60', impact: '业务实例频繁重启，服务可用性显著下降。' },
  { id: 10, level: 'warning', title: '消息队列积压', resource: 'kafka-consumer-group order', metric: '积压量', currentValue: '50000条', threshold: '> 10000条', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-17 07:30:00', recoveryTime: '2026-06-17 10:30:00', status: 'resolved', suggestion: '1. 检查消费者处理逻辑\n2. 增加消费者实例数\n3. 检查生产者发送速率', sourceSystem: 'Prometheus', cloudService: '消息队列Kafka', ip: '10.0.6.70', impact: '消息处理延迟，下游数据同步滞后，影响数据时效。' },
  { id: 11, level: 'warning', title: '网络丢包率过高', resource: 'switch-01 (华北区域)', metric: '丢包率', currentValue: '2.1%', threshold: '> 1%', duration: '45分钟', displayDuration: '45分钟', durationMinutes: 45, triggerTime: '2026-06-17 06:30:00', recoveryTime: '-', status: 'firing', suggestion: '1. 检查网络链路质量\n2. 排查交换机端口错误\n3. 联系网络运维处理', sourceSystem: 'Zabbix', cloudService: '云服务器ECS', ip: '10.0.7.88', impact: '网络质量下降、重传增多，业务链路延迟增加。' },
  { id: 12, level: 'info', title: 'NTP同步偏移过大', resource: 'ntp-server', metric: '时间偏移', currentValue: '850ms', threshold: '> 500ms', duration: '已恢复', displayDuration: '已恢复', durationMinutes: 0, triggerTime: '2026-06-16 23:00:00', recoveryTime: '2026-06-17 01:00:00', status: 'resolved', suggestion: '1. 检查NTP服务状态\n2. 确认时间源可达\n3. 手动同步时间', sourceSystem: 'Zabbix', cloudService: '云服务器ECS', ip: '10.0.7.89', impact: '时间不同步可能导致日志错乱、证书校验与认证失败。' },
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

const relatedExperience = computed(function() {
  if (!currentAlert.value) return []
  var kw = String(currentAlert.value.metric || '').toLowerCase() + ' ' + String(currentAlert.value.title || '').toLowerCase()
  var rules = [
    { re: /cpu|处理器/, cat: 'CPU' },
    { re: /内存|redis|连接数|堆/, cat: '内存' },
    { re: /磁盘|inode/, cat: '磁盘' },
    { re: /复制延迟|主从|mysql|db|查询/, cat: '数据库' },
    { re: /丢包|网络|带宽/, cat: '网络' },
    { re: /pod|k8s|容器|重启/, cat: '其他' },
    { re: /5xx|响应/, cat: '其他' },
    { re: /证书|过期/, cat: '其他' },
  ]
  var cat = null
  for (var i = 0; i < rules.length; i++) {
    if (rules[i].re.test(kw)) { cat = rules[i].cat; break }
  }
  if (!cat) return []
  return expData.value.filter(function(e) { return e.category === cat }).slice(0, 3)
})
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  fetchIntelData()
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
          incidentId: item.incident_id || item.incidentId || '',
          suggestion: item.suggestion || '',
          sourceSystem: item.source_system || item.sourceSystem || '',
          cloudService: item.cloud_service || item.cloudService || '',
          ip: item.ip || item.ip_address || '',
          impact: item.impact || '',
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
    var qid = route.query.alertId
    if (qid) {
      var alert = realtimeAlerts.value.find(function(a) { return String(a.id) === String(qid) })
      if (alert) openDetail(alert)
    }
  }
  renderDonutChart()
  renderBarChart()
  renderDurationChart()
  renderTopnChart()
  // 标记高频告警
  groupFiringAlerts.value
})

watch(function() { return route.query.alertId }, function(id) {
  if (id == null) return
  if (currentAlert.value && detailVisible.value && String(currentAlert.value.id) === String(id)) return
  var alert = realtimeAlerts.value.find(function(a) { return String(a.id) === String(id) })
  if (alert) openDetail(alert)
})

watch(activeDetailTab, function(tab) {
  if (tab === 'analysis') {
    runAiAnalysis()
    setTimeout(scrollToAnalysis, 60)
  }
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
  { title: '关联故障', key: 'incident', width: 110 },
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

// 对 firing 告警按 title+metric 分组，标记高频告警
const groupFiringAlerts = computed(function() {
  var groups = {}
  var now = Date.now()
  realtimeAlerts.value.forEach(function(a) {
    if (a.status !== 'firing') return
    var key = (a.title || '') + '|' + (a.metric || '')
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  })
  Object.keys(groups).forEach(function(key) {
    var g = groups[key]
    var recent = g.filter(function(a) {
      var t = parseTime(a.triggerTime).getTime()
      return now - t < 3600000
    })
    g.forEach(function(a) {
      a.aiSuggest = recent.length >= 3 ? { key: key, count: recent.length, alerts: recent } : null
      a._groupKey = key
      a._isGroupFirst = recent.indexOf(a) === 0
    })
  })
  return groups
})

const displayAlerts = computed(function() {
  var list = filteredAlerts.value
  var seen = {}
  return list.filter(function(a) {
    var key = a._groupKey
    if (!key) return true
    if (!seen[key]) { seen[key] = true; return true }
    return false
  })
})

// AI 聚合横幅数据
const aggregationBannerState = ref({})  // key -> { aggregated, expanded }
const aggCandidates = ref({})          // key -> { title, allRecentAlerts }

// 扫描所有告警（含 suppressed），识别可聚合组并持久化
function scanAggCandidates() {
  var now = Date.now()
  var groups = {}
  realtimeAlerts.value.forEach(function(a) {
    var key = (a.title || '') + '|' + (a.metric || '')
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  })
  var newCandidates = {}
  Object.keys(groups).forEach(function(key) {
    var g = groups[key]
    var recent = g.filter(function(a) {
      var t = parseTime(a.triggerTime).getTime()
      return now - t < 3600000
    })
    if (recent.length >= 3) {
      newCandidates[key] = { title: g[0].title, recent: recent }
    }
  })
  aggCandidates.value = newCandidates
}

const aggregationBanners = computed(function() {
  scanAggCandidates()
  var banners = []
  Object.keys(aggCandidates.value).forEach(function(key) {
    var candidate = aggCandidates.value[key]
    var state = aggregationBannerState.value[key] || {}
    banners.push({
      key: key,
      title: candidate.title,
      count: candidate.recent.length,
      alerts: candidate.recent,
      aggregated: !!aggregatedGroups.value[key],
      expanded: !!state.expanded,
      aiResult: aggregatedGroups.value[key] ? aggregatedGroups.value[key].aiResult : null,
    })
  })
  banners.sort(function(a, b) { return b.count - a.count })
  return banners
})

function aggregateAlerts(key) {
  var banner = aggregationBanners.value.find(function(b) { return b.key === key })
  if (!banner || banner.aggregated) return
  aggregatingKeys.value[key] = true
  var alerts = banner.alerts.map(function(a) {
    return { id: a.id, title: a.title, metric: a.metric, resource: a.resource, level: a.level, currentValue: a.currentValue, threshold: a.threshold, triggerTime: a.triggerTime }
  })
  fetch('/api/alarm/ai-aggregate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alerts: alerts, groupKey: key }),
  })
    .then(function(res) { return res.json() })
    .then(function(json) {
      if (json.success) {
        var result = json.data || json
        aggregatedGroups.value[key] = { alerts: alerts, aiResult: result }
        // 将同组 firing 告警标记为已聚合（相当于静默）
        var alertIds = new Set(alerts.map(function(a) { return a.id }))
        realtimeAlerts.value = realtimeAlerts.value.map(function(a) {
          if (alertIds.has(a.id) && a.status === 'firing') {
            return Object.assign({}, a, { status: 'suppressed', muteReason: 'AI聚合降噪', mutedAt: new Date().toISOString() })
          }
          return a
        })
        message.success('AI 聚合分析完成，已生成 ' + (result.incidentId ? '故障单 ' + result.incidentId : '聚合组'))
      } else {
        message.error(json.message || 'AI 聚合分析失败')
      }
    })
    .catch(function(e) {
      console.error('AI 聚合失败:', e)
      message.error('AI 聚合分析失败，请稍后重试')
    })
    .finally(function() {
      aggregatingKeys.value[key] = false
    })
}

function expandGroup(key) {
  var state = aggregationBannerState.value[key] || {}
  aggregationBannerState.value = Object.assign({}, aggregationBannerState.value, {
    [key]: Object.assign({}, state, { expanded: !state.expanded })
  })
}

function openCustomAdjust(record) {
  if (!record || !record.aiSuggest) return
  Modal.confirm({
    title: '自定义抑制窗口',
    content: '请设置抑制时长（分钟）',
    okText: '确认',
    cancelText: '取消',
  })
}

function createIncidentFromGroup(banner) {
  if (!banner || !banner.aggregated) return
  var alertIds = banner.alerts.map(function(a) { return a.id })
  fetch('/api/sre/incidents/aggregate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertIds: alertIds }),
  })
    .then(function(res) { return res.json() })
    .then(function(json) {
      if (json.success) {
        message.success('故障单已创建：' + json.data.incident.id)
        router.push({ path: '/ops/incident/' + json.data.incident.id, query: { from: 'alarm-aggregate' } })
      } else {
        message.error(json.message || '创建故障单失败')
      }
    })
    .catch(function(e) {
      console.error('创建故障单失败:', e)
      message.error('创建故障单失败')
    })
}

function muteGroup(banner) {
  if (!banner) return
  var ids = banner.alerts.map(function(a) { return a.id })
  realtimeAlerts.value = realtimeAlerts.value.map(function(a) {
    if (ids.indexOf(a.id) >= 0 && a.status === 'firing') {
      return Object.assign({}, a, { status: 'suppressed', muteReason: 'AI聚合屏蔽', mutedAt: new Date().toISOString() })
    }
    return a
  })
  message.success('已屏蔽 ' + banner.count + ' 条同类告警')
}

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

const gotoIncident = function(incidentId) {
  if (!incidentId) return
  closeDetail()
  router.push({ path: '/ops/incident/' + incidentId, query: { from: 'alert' } })
}

const createIncidentFromAlert = async function(alert) {
  if (!alert) return
  try {
    const res = await fetch('/api/sre/incidents/aggregate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertIds: [alert.id] }),
    })
    const json = await res.json()
    if (json.success) {
      alert.incidentId = json.data.incident.id
      closeDetail()
      router.push({ path: '/ops/incident/' + json.data.incident.id, query: { from: 'alert' } })
    } else {
      message.error(json.message || '创建故障单失败')
    }
  } catch (e) {
    console.error('创建故障单失败:', e)
    message.error('创建故障单失败')
  }
}

const timelineSeq = { n: 1 }

function nowStr() {
  var d = new Date()
  function pad(n) { return n < 10 ? '0' + n : '' + n }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function formatTime(str) {
  if (!str || str === '-') return '-'
  var d = new Date(String(str).replace(/-/g, '/'))
  if (isNaN(d.getTime())) d = new Date(str)
  if (isNaN(d.getTime())) return str
  function pad(n) { return n < 10 ? '0' + n : '' + n }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function parseTime(str) {
  if (!str) return new Date()
  var d = new Date(String(str).replace(/-/g, '/'))
  if (isNaN(d.getTime())) d = new Date(str)
  return isNaN(d.getTime()) ? new Date() : d
}

const addTimeline = function(type, label, content, time) {
  detailTimeline.value.push({
    id: timelineSeq.n++,
    type: type,
    label: label,
    content: content,
    operator: '张工',
    time: time || nowStr(),
  })
}

const buildTimeline = function(alert) {
  detailTimeline.value = []
  addTimeline('trigger', '触发', alert.title + '（当前值 ' + (alert.currentValue || '-') + '，阈值 ' + (alert.threshold || '-') + '）', formatTime(alert.triggerTime))
  if (alert.status === 'resolved') {
    addTimeline('resolve', '恢复', '告警已恢复，指标回到安全区间', formatTime(alert.recoveryTime))
  }
  if (alert.status === 'suppressed' && alert.muteReason) {
    addTimeline('ignore', '屏蔽', '屏蔽原因：' + alert.muteReason + (alert.mutedBy ? '（' + alert.mutedBy + '）' : ''), formatTime(alert.mutedAt))
  }
}

const openDetail = function(alert) {
  currentAlert.value = alert
  alertConfirmed.value = false
  detailExpanded.value = true
  activeDetailTab.value = 'info'
  detailVisible.value = true
  buildTimeline(alert)
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null }
  aiResult.value = null
  aiAnalyzedAlertId = null
  aiLoading.value = false
  router.replace({ query: { ...route.query, alertId: alert.id } })
  nextTick(function() { renderTrendChart() })
}

const openAnalysis = function(alert) {
  openDetail(alert)
  activeDetailTab.value = 'analysis'
  runAiAnalysis()
  setTimeout(scrollToAnalysis, 400)
}

const scrollToAnalysis = function() {
  if (!detailExpanded.value) detailExpanded.value = true
  nextTick(function() {
    var wrap = detailTabsWrapRef.value
    var scroll = detailScrollRef.value
    if (!wrap || !scroll) return
    var rect = wrap.getBoundingClientRect()
    var srect = scroll.getBoundingClientRect()
    var target = rect.top - srect.top + scroll.scrollTop
    scroll.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' })
  })
}

const runAiAnalysis = function() {
  var alert = currentAlert.value
  if (!alert || activeDetailTab.value !== 'analysis') return
  if (aiAnalyzedAlertId === alert.id && aiResult.value) return
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null }
  aiLoading.value = true
  aiResult.value = null
  aiTimer = setTimeout(function() {
    aiResult.value = buildAiAnalysis(alert)
    aiAnalyzedAlertId = alert.id
    aiLoading.value = false
    aiTimer = null
    nextTick(scrollToAnalysis)
  }, 1200)
}

function buildAiAnalysis(alert) {
  var num = parseFloat(String(alert.currentValue).match(/[\d.]+/)) || 0
  var thresholdMatch = String(alert.threshold).match(/[\d.]+/)
  var threshold = thresholdMatch ? parseFloat(thresholdMatch[0]) : 0
  var isLess = String(alert.threshold).indexOf('<') >= 0
  var ratio = threshold ? Math.round((num / threshold) * 100) : 100
  var kw = String(alert.metric || '').toLowerCase() + ' ' + String(alert.title || '').toLowerCase()

  var category = '其他'
  var rules = [
    { re: /cpu|处理器/, cat: 'CPU' },
    { re: /内存|redis|堆|连接数/, cat: '内存' },
    { re: /磁盘|inode/, cat: '磁盘' },
    { re: /复制延迟|主从|mysql|db|查询|sql/, cat: '数据库' },
    { re: /丢包|网络|带宽|流量/, cat: '网络' },
  ]
  for (var i = 0; i < rules.length; i++) {
    if (rules[i].re.test(kw)) { category = rules[i].cat; break }
  }

  var expList = expData.value.filter(function(e) { return e.category === category })
  var expTitle = expList.length ? '《' + expList[0].title + '》' : '同类告警的维护经验'
  var causeMap = {
    CPU: '异常进程或集中任务抢占计算资源',
    内存: '内存泄漏或缓存未及时释放',
    磁盘: '日志与临时文件快速增长',
    数据库: '复制链路异常或大事务阻塞',
    网络: '链路抖动或出口带宽打满',
    其他: '业务量增长或资源配置不足',
  }

  var rootCause = '检测到 ' + alert.resource + ' 的 ' + alert.metric + ' 达到 ' + alert.currentValue +
    '，' + (isLess ? '低于阈值 ' : '超出阈值 ') + alert.threshold + '（约 ' + Math.min(ratio, 999) + '%）。' +
    '从趋势看，该指标在触发前持续' + (isLess ? '下行' : '抬升') + '，结合「' + category + '」类历史案例 ' + expTitle +
    '，初步推断为' + causeMap[category] + '，建议按上述经验逐项排查确认。'

  var impact = '当前告警' + (alert.status === 'firing' ? '处于待处理状态' : '已恢复') + '，影响范围主要集中在该资源承载的业务链路；' +
    (alert.level === 'critical' ? '级别为紧急，可能造成服务不可用或数据不一致，建议立即处理。' :
      alert.level === 'warning' ? '级别为重要，存在服务质量下降风险，建议尽快处理。' :
        '级别为提示，暂不影响核心功能，建议持续关注趋势变化。')

  var suggestions = []
  if (expList.length) {
    expList[0].content.split('\n').slice(0, 3).forEach(function(s) { suggestions.push(s) })
  }
  suggestions.push(isLess ? '复核阈值配置是否合理，必要时调整监控基线' : '持续观察 ' + alert.metric + ' 曲线，确认恢复正常后关闭告警')
  suggestions.push('将本次处理过程沉淀为维护经验，便于后续同类告警快速处置')

  var relatedAlerts = realtimeAlerts.value.filter(function(a) {
    return a.id !== alert.id && (a.resource === alert.resource || a.metric === alert.metric)
  }).slice(0, 2).map(function(a) {
    return { id: a.id, level: a.level, title: a.title, resource: a.resource }
  })

  var confidence = 55 + Math.min(Math.round((threshold ? Math.min(ratio, 200) : 100) / 10), 35) + (relatedAlerts.length ? 5 : 0)
  if (confidence > 95) confidence = 95

  return {
    rootCause: rootCause,
    impact: impact,
    suggestions: suggestions,
    relatedAlerts: relatedAlerts,
    confidence: confidence,
  }
}

const continueInAssistant = function() {
  var alert = currentAlert.value
  if (!alert) return
  var text = '请帮我分析这条告警：\n' +
    '- 告警名称：' + alert.title + '\n' +
    '- 级别：' + getLevelText(alert.level) + '\n' +
    '- 资源：' + alert.resource + '（IP ' + (alert.ip || '-') + '）\n' +
    '- 指标：' + alert.metric + '\n' +
    '- 当前值：' + alert.currentValue + '，阈值：' + alert.threshold + '\n' +
    '- 触发时间：' + formatTime(alert.triggerTime) + '\n' +
    '- 状态：' + (alert.status === 'firing' ? '待处理' : '已恢复') + '\n' +
    '- 系统建议：' + (alert.suggestion || '-')
  if (window.__openAIAssistant) {
    window.__openAIAssistant(text)
  }
}

const closeDetail = function() {
  detailVisible.value = false
  var q = { ...route.query }
  delete q.alertId
  router.replace({ query: q })
}

const onConfirmAlert = function() {
  alertConfirmed.value = true
  addTimeline('ack', '确认', '运维人员已确认收到该告警')
}

const onHandleAlert = function() {
  addTimeline('handle', '处理', '已标记为处理中，进入处理流程')
  closeDetail()
}

const onIgnoreAlert = function() {
  addTimeline('ignore', '忽略', '人工忽略该告警，暂不处理')
}

const onAssign = function() {
  if (!assignTarget.value) return
  addTimeline('assign', '设置处理人', '指定处理人：' + assignTarget.value)
  if (currentAlert.value) currentAlert.value.assignee = assignTarget.value
  assignTarget.value = null
  assignVisible.value = false
}

const onAddComment = function() {
  var text = (commentText.value || '').trim()
  if (!text) return
  addTimeline('comment', '注释', text)
  commentText.value = ''
  commentVisible.value = false
}

const filterByResource = function(res) {
  if (!res) return
  searchText.value = res
  closeDetail()
}

const copyText = function(text) {
  if (!text || !navigator.clipboard) return
  navigator.clipboard.writeText(text)
}

const jumpTo = function(target) {
  var map = { dashboard: '/monitor/dashboard', logs: '/ops/logs/runtime/query', host: '/monitor/resource' }
  var path = map[target]
  if (!path) return
  closeDetail()
  router.push(path)
}

function renderTrendChart() {
  if (trendChart) { trendChart.destroy(); trendChart = null }
  if (!trendContainer.value || !currentAlert.value) return
  var alert = currentAlert.value
  var num = parseFloat(alert.currentValue) || 50
  var thresholdMatch = String(alert.threshold).match(/[\d.]+/)
  var threshold = thresholdMatch ? parseFloat(thresholdMatch[0]) : num * 0.8
  var baseline = Math.round(threshold * 0.7 * 10) / 10
  var isLess = String(alert.threshold).indexOf('<') >= 0

  var trigger = parseTime(alert.triggerTime)
  var recovered = alert.status === 'resolved' && alert.recoveryTime && alert.recoveryTime !== '-'
  var recovery = recovered ? parseTime(alert.recoveryTime) : null

  function pad(n) { return n < 10 ? '0' + n : '' + n }
  function fmt(t) { return pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) }

  var seed = (Number(alert.id) || 1) * 7 + 13
  var rnd = (function() {
    var s = seed
    return function() { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  })()

  var points = 12
  var spanHours = recovered ? Math.min(Math.max((recovery.getTime() - trigger.getTime()) / 3600000, 4), 48) : 24
  var data = []
  var triggerLabel = ''
  for (var i = 0; i < points; i++) {
    var t = new Date(trigger.getTime() - (points - 1 - i) * spanHours / (points - 1) * 3600 * 1000)
    var label = fmt(t)
    if (i === points - 1) triggerLabel = label
    var progress = i / (points - 1)
    var value = isLess
      ? threshold * 1.3 - (threshold * 1.3 - num) * progress
      : threshold * (0.7 + (num / threshold - 0.7) * progress)
    var jitter = (rnd() - 0.5) * threshold * 0.03
    data.push({ time: label, type: '当前值', value: Math.max(Math.round((value + jitter) * 10) / 10, 0) })
    data.push({ time: label, type: '阈值', value: threshold })
    data.push({ time: label, type: '基线', value: baseline })
  }

  trendChart = new Chart({ container: trendContainer.value, autoFit: true, height: 180, padding: [10, 24, 26, 44] })
  trendChart.data(data)
  trendChart.line()
    .encode('x', 'time')
    .encode('y', 'value')
    .encode('color', 'type')
    .encode('shape', 'smooth')
    .scale('color', { range: ['#007DFF', '#F5222D', '#BFBFBF'] })
    .style('lineWidth', 2)
    .style('lineDash', function(d) { return d.type === '当前值' ? null : [4, 4] })
    .tooltip({ title: 'time', items: [{ channel: 'y', name: 'value' }] })
  trendChart.axis('x', { title: null, labelFontSize: 10, labelAutoHide: true })
  trendChart.axis('y', { title: null, labelFontSize: 10 })
  trendChart.lineX()
    .data([{ time: triggerLabel }])
    .encode('x', 'time')
    .style('stroke', '#F5222D')
    .style('lineDash', [4, 4])
    .style('lineWidth', 1)
    .label({ text: '触发', position: 'top', style: { fill: '#F5222D', fontSize: 10, fontWeight: 600 } })
  if (recovered) {
    trendChart.lineX()
      .data([{ time: fmt(recovery) }])
      .encode('x', 'time')
      .style('stroke', '#52C41A')
      .style('lineDash', [4, 4])
      .style('lineWidth', 1)
      .label({ text: '恢复', position: 'top', style: { fill: '#52C41A', fontSize: 10, fontWeight: 600 } })
  }
  trendChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  trendChart.render()
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
  var statuses = ['firing', 'resolved', 'suppressed']
  var labels = { firing: '待处理', resolved: '已恢复', suppressed: '已屏蔽' }
  var colors = { firing: '#F5222D', resolved: '#52C41A', suppressed: '#BFBFBF' }
  var data = statuses.map(function(s) {
    return { name: labels[s], value: Math.max(list.filter(function(a) { return a.status === s }).length, 1) }
  })

  barChart = new Chart({ container: barContainer.value, autoFit: true, height: 160, padding: [10, 5, 10, 5] })
  barChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })
  barChart.data(data)

  barChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: [colors.firing, colors.resolved, colors.suppressed] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '数量' }] })

  barChart.label({ text: function(d) { return d.name + '\n' + d.value }, position: 'outside', connector: true, fontSize: 11, connectorStroke: '#ccc' })
  barChart.legend('color', { position: 'right', layout: { justifyContent: 'center' }, itemSpacing: 8, itemLabelFontSize: 11 })
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

// test hook
window.__realtimeAlerts = realtimeAlerts
window.__triggerGrouping = function() { groupFiringAlerts.value }

onBeforeUnmount(function() {
  window.removeEventListener('resize', updateScrollY)
  if (aiTimer) clearTimeout(aiTimer)
  if (donutChart) donutChart.destroy()
  if (barChart) barChart.destroy()
  if (durationChart) durationChart.destroy()
  if (topnChart) topnChart.destroy()
  if (trendChart) trendChart.destroy()
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
.icon-btn.ai-btn { color: #722ed1; }
.icon-btn.ai-btn:hover { background: #f9f0ff; color: #531dab; }

.incident-tag { cursor: pointer; }
.incident-tag:hover { opacity: 0.8; }
.create-incident-btn { padding: 0 2px; }

/* AI 聚合横幅 */
.ai-aggregation-banners { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; flex-shrink: 0; }
.ai-agg-banner {
  background: #f9f0ff;
  border: 1px solid #d3adf7;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}
.ai-agg-banner.aggregated { background: #f0f5ff; border-color: #91caff; }
.agg-icon { font-size: 18px; color: #722ed1; flex-shrink: 0; margin-top: 2px; }
.agg-banner-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.agg-banner-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.agg-banner-title { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.agg-banner-meta { font-size: 12px; color: #8c8c8c; }
.agg-banner-resources { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.agg-res-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #595959;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 1px 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.agg-res-tag:hover { border-color: var(--brand); color: var(--brand); background: #e6f7ff; }
.agg-more { font-size: 11px; color: #8c8c8c; }
.agg-banner-right { flex-shrink: 0; }

.agg-detail-panel { flex: 1; min-width: 0; }
.agg-detail-content { padding-top: 10px; border-top: 1px dashed #d3adf7; margin-top: 8px; }
.ai-agg-banner.aggregated .agg-detail-content { border-top-color: #91caff; }
.agg-ai-result { background: #fff; border: 1px solid #f0f0f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
.agg-ai-header { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #722ed1; margin-bottom: 8px; }
.agg-ai-section { font-size: 12px; color: #595959; line-height: 1.8; margin-bottom: 6px; }
.agg-ai-section ol { margin: 4px 0 0 18px; padding: 0; }
.agg-alert-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.agg-alert-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.agg-alert-row:hover { border-color: var(--brand); background: #e6f7ff; }
.agg-alert-row.level-critical { border-left: 3px solid #f5222d; }
.agg-alert-row.level-warning { border-left: 3px solid #fa8c16; }
.agg-alert-row.level-info { border-left: 3px solid #1890ff; }
.agg-alert-resource { flex: 1; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.agg-alert-metric { color: #8c8c8c; flex-shrink: 0; }
.agg-alert-time { color: #8c8c8c; flex-shrink: 0; font-size: 11px; }
.agg-detail-actions { display: flex; gap: 8px; }

/* AI 提示 badge + tooltip */
.ai-title-cell { display: flex; align-items: center; gap: 4px; }
.ai-title-link { color: var(--brand); cursor: pointer; margin-right: 4px; }
.ai-title-link:hover { text-decoration: underline; }
.ai-badge-icon { color: #1890ff; font-size: 11px; margin-right: 2px; }
.ai-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 0;
}

.ai-tip-content { padding: 4px 0; }
.ai-tip-header { font-size: 14px; font-weight: 600; color: #1890ff; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.ai-star-icon { color: #1890ff; font-size: 14px; }
.ai-tip-summary { font-size: 13px; color: #1a1a1a; margin-bottom: 14px; line-height: 1.5; }
.ai-tip-summary b { color: #1a1a1a; }
.ai-tip-stats { display: flex; gap: 20px; margin-bottom: 12px; }
.ai-tip-stat-item { display: flex; flex-direction: column; gap: 2px; }
.ai-tip-stat-label { font-size: 11px; color: #8c8c8c; }
.ai-tip-stat-value { font-size: 18px; font-weight: 600; color: #1a1a1a; }
.ai-tip-divider { height: 1px; background: #f0f0f0; margin: 10px 0; }
.ai-tip-resources { margin-bottom: 10px; }
.ai-tip-res-label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; }
.ai-tip-res-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.ai-tip-res-row:hover { background: #f5f5f5; }
.ai-tip-res-row.level-critical { background: #fff1f0; }
.ai-tip-res-row.level-critical:hover { background: #ffccc7; }
.ai-tip-res-row.level-warning { background: #fff7e6; }
.ai-tip-res-row.level-warning:hover { background: #ffe7ba; }
.ai-tip-res-name { flex: 1; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.ai-tip-res-metric { color: #8c8c8c; font-size: 11px; flex-shrink: 0; }
.ai-tip-res-time { color: #bfbfbf; font-size: 11px; flex-shrink: 0; }
.ai-tip-res-more { font-size: 11px; color: #8c8c8c; padding: 4px 6px; }
.ai-tip-actions { display: flex; align-items: center; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px; }
.ai-action-btn { border-radius: 4px; }
.ai-detail-link { padding: 0; height: auto; }

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
  right: -80vw;
  width: 80vw;
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
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.detail-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.detail-title h3 { margin: 0; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-level-tag { flex-shrink: 0; }
.detail-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.close-btn { font-size: 16px; color: #8c8c8c; border: none; background: transparent; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.close-btn:hover { color: var(--brand); background: var(--bg-sec); }
.detail-scroll { flex: 1; overflow-y: auto; padding: 16px 20px 20px; }
.detail-scroll :deep(.ant-tabs > .ant-tabs-nav) { margin-bottom: 16px; }
.detail-tabs-wrap { border-top: 1px solid #f0f0f0; padding-top: 8px; }
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

.trend-card { margin-bottom: 12px; }
.trend-title { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.trend-legend { display: flex; gap: 12px; font-size: 12px; font-weight: 400; color: #595959; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-item b { font-weight: 600; color: #1a1a1a; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.current-dot { background: #007DFF; }
.threshold-dot { background: #F5222D; }
.baseline-dot { background: #BFBFBF; }
.trend-chart { width: 100%; height: 170px; }

.time-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.trigger-time-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  color: #d46b08;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
}
.recovery-time-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.info-card { background: #fafafa; border-radius: 6px; padding: 12px 14px; border: 1px solid #f0f0f0; }
.info-card-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #1a1a1a; }
.info-list { display: flex; flex-direction: column; gap: 8px; }
.info-item { display: flex; }
.info-label { width: 70px; flex-shrink: 0; color: #8c8c8c; font-size: 12px; }
.info-value { flex: 1; font-size: 13px; color: #1a1a1a; word-break: break-all; }
.info-value.clickable { color: var(--brand); cursor: pointer; }
.info-value.clickable:hover { text-decoration: underline; }

.impact-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.impact-block { padding: 12px 14px; border-radius: 6px; }
.impact-red { background: #fff1f0; border-left: 3px solid #f5222d; }
.impact-green { background: #f6ffed; border-left: 3px solid #52c41a; }
.impact-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #1a1a1a; }
.impact-title i { margin-right: 4px; }
.impact-red .impact-title i { color: #f5222d; }
.impact-green .impact-title i { color: #52c41a; }
.impact-body { font-size: 12px; line-height: 1.8; color: #595959; white-space: pre-line; }

.jump-links { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.jump-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--brand);
  background: #e6f7ff;
  border: 1px solid #91caff;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}
.jump-link:hover { background: #bae7ff; }

.exp-list { display: flex; flex-direction: column; gap: 10px; }
.exp-item { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; padding: 10px 12px; }
.exp-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.exp-title i { color: var(--brand); margin-right: 4px; }
.exp-meta { font-size: 12px; color: #8c8c8c; margin-bottom: 6px; }
.exp-content { font-size: 12px; color: #595959; line-height: 1.8; white-space: pre-line; }

.ai-analysis-loading { display: flex; flex-direction: column; align-items: center; padding: 48px 20px; gap: 24px; }
.ai-thinking { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #722ed1; }
.ai-thinking > i { font-size: 28px; animation: ai-breathe 1.6s ease-in-out infinite; }
@keyframes ai-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}
.ai-dots { display: inline-flex; gap: 3px; }
.ai-dots i { width: 5px; height: 5px; border-radius: 50%; background: #722ed1; animation: ai-blink 1.2s infinite; }
.ai-dots i:nth-child(2) { animation-delay: 0.2s; }
.ai-dots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-blink {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}
.ai-loading-steps { display: flex; flex-direction: column; gap: 10px; color: #8c8c8c; font-size: 12px; }
.ai-loading-steps i { margin-right: 6px; color: #722ed1; }

.ai-analysis-result { display: flex; flex-direction: column; gap: 14px; }
.ai-result-header { display: flex; align-items: center; gap: 8px; }
.ai-result-icon { color: #722ed1; font-size: 16px; }
.ai-result-title { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
.ai-section { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; padding: 10px 12px; }
.ai-section-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.ai-section-title i { color: #722ed1; margin-right: 4px; }
.ai-section-body { font-size: 12px; line-height: 1.8; color: #595959; }
.ai-suggest-list { margin: 0; padding-left: 18px; font-size: 12px; line-height: 2; color: #595959; }
.ai-related-list { display: flex; flex-direction: column; gap: 6px; }
.ai-related-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.ai-related-title { flex: 1; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-related-resource { color: #8c8c8c; flex-shrink: 0; }
.ai-footer { border-top: 1px dashed #f0f0f0; padding-top: 12px; display: flex; justify-content: center; }

.expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  margin-bottom: 12px;
  cursor: pointer;
  color: var(--brand);
  font-size: 13px;
  user-select: none;
}
.expand-toggle:hover { color: #40a9ff; }
.expand-toggle i { transition: transform 0.2s; }
.expand-toggle i.is-rotated { transform: rotate(180deg); }

.detail-footer { flex-shrink: 0; border-top: 1px solid #f0f0f0; padding: 12px 20px; background: #fafafa; }
.timeline-title { font-size: 12px; font-weight: 600; color: #595959; margin-bottom: 8px; }
.timeline-list { display: flex; flex-direction: column; gap: 10px; max-height: 108px; overflow-y: auto; margin-bottom: 10px; }
.timeline-item { display: flex; gap: 10px; }
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
  border: 2px solid #bfbfbf;
}
.timeline-dot.tl-trigger { background: #f5222d; border-color: #ffa39e; }
.timeline-dot.tl-resolve { background: #52c41a; border-color: #b7eb8f; }
.timeline-dot.tl-ack { background: #007dff; border-color: #91caff; }
.timeline-dot.tl-handle { background: #722ed1; border-color: #d3adf7; }
.timeline-dot.tl-ignore { background: #fa8c16; border-color: #ffc069; }
.timeline-dot.tl-comment { background: #8c8c8c; border-color: #d9d9d9; }
.timeline-dot.tl-assign { background: #13c2c2; border-color: #87e8de; }
.timeline-content { flex: 1; min-width: 0; }
.timeline-head { display: flex; align-items: center; gap: 8px; }
.tl-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}
.tl-tag-trigger { background: #f5222d; }
.tl-tag-resolve { background: #52c41a; }
.tl-tag-ack { background: #007dff; }
.tl-tag-handle { background: #722ed1; }
.tl-tag-ignore { background: #fa8c16; }
.tl-tag-comment { background: #8c8c8c; }
.tl-tag-assign { background: #13c2c2; }
.tl-meta { font-size: 11px; color: #8c8c8c; flex-shrink: 0; }
.tl-text { font-size: 12px; color: #595959; margin-top: 2px; line-height: 1.5; word-break: break-all; }
.note-empty { color: #8c8c8c; font-size: 12px; text-align: center; padding: 8px 0; }
.footer-actions { display: flex; gap: 8px; }
.footer-row { display: flex; gap: 8px; margin-top: 8px; }
.footer-row :deep(.ant-input) { flex: 1; }

@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr; }
  .toolbar-row { flex-direction: column; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
  .detail-kpi { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .info-cards, .impact-section { grid-template-columns: 1fr; }
}
</style>

<style>
/* Tooltip 白色背景覆盖（非 scoped，因 tooltip 渲染在 portal 中） */
.ant-tooltip .ant-tooltip-inner {
  background: #fff !important;
  color: #1a1a1a !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #f0f0f0 !important;
  border-radius: 8px !important;
}
.ant-tooltip .ant-tooltip-arrow::before,
.ant-tooltip .ant-tooltip-arrow::after {
  background: #fff !important;
}
</style>
