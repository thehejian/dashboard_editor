<template>
  <div class="home-view">
    <div class="home-tabs">
      <button class="home-tab-btn" :class="{ active: homeTab === 'home' }" @click="switchTab('home')">
        <i class="fa-solid fa-house"></i> 概览
      </button>
      <button class="home-tab-btn" :class="{ active: homeTab === 'aiops' }" @click="switchTab('aiops')">
        <i class="fa-solid fa-wand-magic-sparkles"></i> AI运维
      </button>
    </div>

    <template v-if="homeTab === 'home'">
    <a-row :gutter="[16, 16]">
      <a-col :xs="12" :sm="12" :md="6" v-for="card in kpiCards" :key="card.title">
        <div class="kpi-card" :class="card.bgClass" :style="card.link ? 'cursor:pointer' : ''" @click="navigateCard(card)">
          <div class="card-header">
            <div class="card-icon" :style="{ background: card.iconBg }">
              <i :class="card.icon" :style="{ color: card.iconColor }"></i>
            </div>
            <span class="card-title">{{ card.title }}</span>
            <div class="card-actions">
              <a-button type="text" size="small" class="action-btn" @click.stop="refreshCard(card)" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" @click.stop="openDetailPanel(card)" title="查看详情">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu @click="({key}) => handleCardAction(card, key)">
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
          <div class="card-value">
            <span class="value">{{ card.value }}</span>
            <span class="trend" :class="card.trend > 0 ? 'up' : 'down'" v-if="card.trend !== undefined">
              <i :class="card.trend > 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              {{ card.trendText }}
            </span>
          </div>
          <div class="card-sub" v-if="card.sub">{{ card.sub }}</div>
        </div>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card class="chart-card donut-card">
          <template #title>
            <span>资源分类分布</span>
          </template>
          <template #extra>
            <div class="chart-actions">
              <a-button type="text" size="small" class="action-btn" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" title="查看详情" @click="openDetailPanel({title: '资源分类分布'})">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
          <div ref="mainDonutContainer" class="main-donut-chart"></div>
        </a-card>
      </a-col>

      <a-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
        <a-card class="chart-card line-card">
          <template #title>
            <span>告警趋势</span>
          </template>
          <template #extra>
            <div class="chart-actions">
              <a-button type="text" size="small" class="action-btn" title="刷新">
                <i class="fa-solid fa-rotate-right"></i>
              </a-button>
              <a-button type="text" size="small" class="action-btn" title="查看详情" @click="openDetailPanel({title: '告警趋势'})">
                <i class="fa-solid fa-eye"></i>
              </a-button>
              <a-dropdown :trigger="['click']">
                <a-button type="text" size="small" class="action-btn">
                  <i class="fa-solid fa-ellipsis"></i>
                </a-button>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="export"><i class="fa-solid fa-download"></i> 导出数据</a-menu-item>
                    <a-menu-item key="history"><i class="fa-solid fa-clock-rotate-left"></i> 历史趋势</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
          <div class="line-chart" ref="alertTrendContainer"></div>
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card class="table-card">
          <template #title>
            <span>最近告警事件</span>
          </template>
          <template #extra>
            <a-button type="link">查看全部</a-button>
          </template>
          <a-table :columns="alertColumns" :dataSource="alertEvents" :pagination="false" size="small" rowKey="id" :scroll="{ x: 700 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="record.level === '严重' ? 'pink' : 'orange'">{{ record.level }}</a-tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <span :class="'status-' + record.status">{{ record.status }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openAlertEventDetail(record)">查看详情</a-button>
                <a-button type="link" size="small" style="color:#722ED1" @click="analyzeAlert(record)"><i class="fa-solid fa-wand-magic-sparkles"></i> AI分析</a-button>
              </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <template v-if="homeTab === 'aiops'">
      <div class="aiops-intent-bar">
        <div class="aiops-intent-wrapper">
          <textarea v-model="aiopsIntent" class="aiops-intent-input" rows="1" placeholder="描述你想要分析的问题..." @keydown.enter.prevent="sendAiopsIntent" @input="autoResizeInput"></textarea>
          <button class="aiops-intent-send" @click="sendAiopsIntent" :disabled="!aiopsIntent.trim() || aiopsLoading"><i class="fa-solid fa-arrow-up"></i></button>
        </div>
        <div class="aiops-suggestions" v-if="!aiopsIntent">
          <span class="suggestion-chip" @click="aiopsIntent = '分析当前系统运行状态'; sendAiopsIntent()"><i class="fa-solid fa-magnifying-glass-chart"></i> 智能诊断</span>
          <span class="suggestion-chip" @click="aiopsIntent = '查看所有异常告警并分析根因'; sendAiopsIntent()"><i class="fa-solid fa-bell"></i> 异常概览</span>
          <span class="suggestion-chip" @click="aiopsIntent = '检查关键指标基线偏离'; sendAiopsIntent()"><i class="fa-solid fa-chart-line"></i> 基线检查</span>
        </div>
      </div>

      <div class="aiops-kpi-row">
        <div class="aiops-kpi-card" v-for="kpi in aiopsKpiCards" :key="kpi.label">
          <div class="aiops-kpi-icon" :style="{ background: kpi.iconBg }"><i :class="kpi.icon" :style="{ color: kpi.iconColor }"></i></div>
          <div class="aiops-kpi-info">
            <div class="aiops-kpi-val" :class="kpi.valClass">{{ kpi.value }}</div>
            <div class="aiops-kpi-label">{{ kpi.label }}</div>
          </div>
          <div class="aiops-kpi-trend" :class="kpi.trendDir">{{ kpi.trendText }}</div>
          <svg class="kpi-sparkline" width="60" height="24" viewBox="0 0 60 24">
            <path :d="kpi.sparklinePath" fill="none" :stroke="kpi.iconColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <div class="aiops-heatmap" v-if="aiopsServiceHealth.length">
        <div class="aiops-section-title"><i class="fa-solid fa-heart-pulse"></i> 服务健康度</div>
        <div class="heatmap-grid">
          <div v-for="group in aiopsServiceHealth" :key="group.name" class="heatmap-group">
            <div class="heatmap-group-name">{{ group.name }}</div>
            <div class="heatmap-cells">
              <div v-for="svc in group.services" :key="svc.name" class="heatmap-cell" :class="'hm-' + svc.status" :title="svc.name + ': ' + svc.score + '%'">
                <span class="hm-name">{{ svc.name }}</span>
                <span class="hm-score">{{ svc.score }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a-row :gutter="[16, 16]" class="aiops-body">
        <a-col :xs="24" :lg="8">
          <a-card class="aiops-card">
            <template #title><i class="fa-solid fa-bolt" style="color:#F5222D;margin-right:6px"></i> 异常时间线</template>
            <div class="anomaly-timeline">
              <div v-for="a in aiopsAnomalies" :key="a.id" class="ani-item" :class="'ani-' + a.level">
                <div class="ani-axis">
                  <span class="ani-dot"></span>
                  <span class="ani-line"></span>
                </div>
                <div class="ani-body">
                  <div class="ani-header">
                    <span class="ani-time">{{ a.time ? a.time.split(' ')[1] : '' }}</span>
                    <a-tag :color="a.level === 'critical' ? 'red' : a.level === 'warning' ? 'orange' : 'blue'" size="small">
                      {{ { critical: '严重', warning: '警告', info: '提示' }[a.level] }}
                    </a-tag>
                  </div>
                  <div class="ani-node">{{ a.nodeLabel }}</div>
                  <div class="ani-detail">{{ a.metric }}: {{ a.currentValue }} (基线{{ a.baseline }}) {{ a.deviation > 0 ? '+' : '' }}{{ a.deviation }}%</div>
                  <div class="ani-score-bar"><span class="ani-score-fill" :style="{ width: (a.score * 100) + '%' }"></span></div>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card class="aiops-card">
            <template #title><i class="fa-solid fa-magnifying-glass-chart" style="color:#722ED1;margin-right:6px"></i> 根因分析</template>
            <div class="root-cause" v-if="aiopsRootCause">
              <div class="rc-node">
                <span class="rc-label">根因节点</span>
                <span class="rc-value">{{ aiopsRootCause.nodeLabel }}</span>
              </div>
              <div class="rc-metric">
                <span class="rc-label">异常指标</span>
                <span class="rc-value">{{ aiopsRootCause.metric }} = {{ aiopsRootCause.currentValue }}</span>
              </div>
              <div class="rc-score">
                <span class="rc-label">异常得分</span>
                <a-progress :percent="Math.round(aiopsRootCause.score * 100)" :stroke-color="'#F5222D'" size="small" />
              </div>
              <div class="rc-path" v-if="aiopsPropagationPath.length">
                <span class="rc-label">传播路径</span>
                <div class="rc-path-flow">
                  <div v-for="(n, i) in aiopsPropagationPath" :key="n" class="rc-flow-node" :class="getNodeStatus(n)">
                    <span class="rc-flow-dot"></span>
                    <span class="rc-flow-name">{{ getNodeLabel(n) }}</span>
                    <i v-if="i < aiopsPropagationPath.length - 1" class="fa-solid fa-chevron-right rc-flow-arrow"></i>
                  </div>
                </div>
              </div>
              <div class="rc-desc">{{ aiopsRootCause.detail }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="8">
          <a-card class="aiops-card">
            <template #title><i class="fa-solid fa-lightbulb" style="color:#FF7D00;margin-right:6px"></i> AI推荐操作</template>
            <div class="rec-list">
              <div v-for="rec in aiopsRecommendations" :key="rec.id" class="rec-item" :class="'rec-' + rec.priority">
                <div class="rec-icon"><i :class="rec.icon"></i></div>
                <div class="rec-info">
                  <div class="rec-label">{{ rec.label }}</div>
                  <div class="rec-desc">{{ rec.desc }}</div>
                </div>
                <span class="rec-confidence" :style="{ color: '#fff', background: confidenceColor(rec.confidence) }">{{ rec.confidence }}%</span>
                <a-button size="small" :type="rec.priority === 'urgent' ? 'primary' : 'default'" :danger="rec.priority === 'urgent'" @click="executeRec(rec)">执行</a-button>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-card class="aiops-card aiops-trend-card" style="margin-top:16px">
        <template #title><i class="fa-solid fa-chart-line" style="color:#007DFF;margin-right:6px"></i> 24小时告警趋势 <span class="trend-legend">严重 · 警告 · 提示</span></template>
        <div ref="aiopsTrendContainer" class="aiops-trend-chart"></div>
      </a-card>
    </template>

    <div class="detail-panel" :class="{ open: detailPanelOpen }">
      <div class="detail-mask" @click="closeDetailPanel"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <h3>{{ alertEventRecord ? '告警事件详情' : currentCardTitle + ' - 历史详情' }}</h3>
          <a-button type="text" class="close-btn" @click="closeDetailPanel">
            <i class="fa-solid fa-xmark"></i>
          </a-button>
        </div>
        <div class="detail-body">
          <template v-if="!alertEventRecord">
          <div class="time-tabs">
            <a-radio-group v-model:value="detailPeriod" button-style="solid" size="small">
              <a-radio-button value="today">今日</a-radio-button>
              <a-radio-button value="week">本周</a-radio-button>
              <a-radio-button value="month">本月</a-radio-button>
              <a-radio-button value="quarter">本季度</a-radio-button>
            </a-radio-group>
          </div>
          <div class="detail-chart">
            <div v-if="detailType === 'resource'" ref="resourceTrendContainer"></div>
            <div v-else-if="detailType === 'health'" class="health-trend-chart" ref="healthTrendContainer"></div>
            <div v-else-if="detailType === 'alert'" class="alert-trend-chart" ref="alertDetailContainer"></div>
            <div v-else-if="detailType === 'event'" class="event-trend-chart" ref="eventDetailContainer"></div>
            <div v-else-if="detailType === 'distribution'" class="dist-donut-chart" ref="distDonutContainer"></div>
            <div v-else-if="detailType === 'trend'" class="trend-single-chart" ref="trendSingleContainer"></div>
          </div>
          <div v-if="detailType === 'resource'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前资源总数</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">1,235,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">1,229,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+15%</span>
            </div>
          </div>
          <div v-if="detailType === 'health'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前健康资源</span>
              <span class="dk-value">{{ healthData.kpi.current }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值数量</span>
              <span class="dk-value">{{ healthData.kpi.peak }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">{{ healthData.kpi.avg }}</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">{{ healthData.kpi.change }}</span>
            </div>
          </div>
          <div v-else-if="detailType === 'alert'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前告警</span>
              <span class="dk-value">54,333</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">58,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">55,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value down">-10%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'event'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">128</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">128</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">100</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+8%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'distribution'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">1,234,567</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">1,229,000</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value up">+5%</span>
            </div>
          </div>
          <div v-else-if="detailType === 'trend'" class="detail-kpi">
            <div class="detail-kpi-item">
              <span class="dk-label">当前值</span>
              <span class="dk-value">42</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">峰值</span>
              <span class="dk-value">65</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">平均值</span>
              <span class="dk-value">46</span>
            </div>
            <div class="detail-kpi-item">
              <span class="dk-label">同比变化</span>
              <span class="dk-value down">-12%</span>
            </div>
          </div>
          <div v-if="detailType === 'resource'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="detailSearch" placeholder="搜索资源类型" class="detail-search" />
            </div>
            <a-table
              :columns="detailColumns"
              :dataSource="filteredDetailData"
              :pagination="{ current: detailPage, pageSize: 5, total: filteredDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="type"
              @change="handleDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'added'">
                  <span :class="record.added > 0 ? 'num-up' : 'num-down'">+{{ record.added }}</span>
                </template>
                <template v-else-if="column.key === 'removed'">
                  <span :class="record.removed > 0 ? 'num-down' : 'num-up'">-{{ record.removed }}</span>
                </template>
                <template v-else-if="column.key === 'net'">
                  <span :class="record.net > 0 ? 'num-up' : 'num-down'">
                    {{ record.net > 0 ? '+' : '' }}{{ record.net }}
                  </span>
                </template>
              </template>
            </a-table>
          </div>
          <div v-if="detailType === 'health'" class="detail-table">
            <h4>详细数据</h4>
            <a-table
              :columns="healthColumns"
              :dataSource="healthData.tableData"
              :pagination="false"
              size="small"
              rowKey="range"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'percent'">
                  <div class="bar-cell">
                    <div class="bar-bg">
                      <div class="bar-fill" :style="{ width: record.percent + '%' }"></div>
                    </div>
                    <span>{{ record.percent }}%</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'status'">
                  <span :class="'health-' + (record.range === '100%' ? 'good' : record.range === '<80%' ? 'bad' : 'warn')">{{ record.status }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'alert'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="alertDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="alertDetailColumns"
              :dataSource="filteredAlertDetailData"
              :pagination="{ current: alertDetailPage, pageSize: 10, total: filteredAlertDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="alertId"
              @change="handleAlertDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <a-tag :color="record.level === '严重' ? '#f5222d' : '#fa8c16'" style="color:#fff;border:none;">{{ record.level }}</a-tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="record.status === '处理中' ? '#fa8c16' : '#52C41A'" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'event'" class="detail-table">
            <h4>详细数据</h4>
            <a-table
              :columns="eventDetailColumns"
              :dataSource="eventDetailData"
              :pagination="false"
              size="small"
              rowKey="level"
              :scroll="{ x: 600 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <a-tag :color="record.level === '严重' ? '#f5222d' : record.level === '警告' ? '#fa8c16' : '#8c8c8c'" style="color:#fff;border:none;">{{ record.level }}</a-tag>
                </template>
                <template v-else-if="column.key === 'percent'">
                  <div class="bar-cell bar-cell-inline">
                    <div class="bar-bg bar-bg-sm">
                      <div class="bar-fill" :style="{ width: record.percent + '%', background: record.level === '严重' ? '#f5222d' : record.level === '警告' ? '#fa8c16' : '#8c8c8c' }"></div>
                    </div>
                    <span>{{ record.percent }}%</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'trend'">
                  <span :class="'trend-' + (record.trend === '下降' ? 'down' : record.trend === '上升' ? 'up' : 'stable')">{{ record.trend }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'distribution'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="distDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="distDetailColumns"
              :dataSource="filteredDistDetailData"
              :pagination="{ current: distDetailPage, pageSize: 10, total: filteredDistDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="name"
              @change="handleDistDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag color="#52C41A" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          <div v-else-if="detailType === 'trend'" class="detail-table">
            <h4>详细数据</h4>
            <div class="table-toolbar">
              <a-input-search v-model:value="trendDetailSearch" placeholder="搜索..." class="detail-search" />
            </div>
            <a-table
              :columns="trendDetailColumns"
              :dataSource="filteredTrendDetailData"
              :pagination="{ current: trendDetailPage, pageSize: 10, total: filteredTrendDetailData.length, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }"
              size="small"
              rowKey="name"
              @change="handleTrendDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === '警告' ? '#fa8c16' : '#f5222d'" style="color:#fff;border:none;">{{ record.status }}</a-tag>
                </template>
              </template>
            </a-table>
          </div>
          </template>
          <template v-else>
          <div class="alert-summary-card">
            <a-tag color="#f5222d" style="color:#fff;border:none;font-size:13px;padding:2px 10px;border-radius:4px;">{{ alertEventRecord.level }}</a-tag>
            <span class="alert-event-name">{{ alertEventRecord.event }}</span>
            <span class="alert-event-time">{{ alertEventRecord.time }}</span>
          </div>
          <div class="ci-info-table">
            <div class="ci-row">
              <span class="ci-label">CI名称</span>
              <span class="ci-value">{{ alertEventRecord.ciName }}</span>
              <span class="ci-label">CI类型</span>
              <span class="ci-value">{{ alertEventRecord.ciType }}</span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警级别</span>
              <span class="ci-value"><a-tag color="#f5222d" style="color:#fff;border:none;">{{ alertEventRecord.level }}</a-tag></span>
              <span class="ci-label">当前状态</span>
              <span class="ci-value"><a-tag color="#fa8c16" style="color:#fff;border:none;">{{ alertEventRecord.status }}</a-tag></span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警时间</span>
              <span class="ci-value">{{ alertEventRecord.time }}</span>
              <span class="ci-label"></span>
              <span class="ci-value"></span>
            </div>
            <div class="ci-row">
              <span class="ci-label">告警事件</span>
              <span class="ci-value">{{ alertEventRecord.event }}</span>
              <span class="ci-label"></span>
              <span class="ci-value"></span>
            </div>
          </div>
          <div class="timeline-section">
            <h4>处理历史</h4>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-dot red"></div>
                <div class="timeline-line"></div>
                <div class="timeline-content">
                  <span class="timeline-time">2024-01-15 10:23:00</span>
                  <span class="timeline-title">告警触发</span>
                  <span class="timeline-operator">操作人：系统</span>
                  <span class="timeline-note">{{ alertEventRecord.ciName }} 触发 {{ alertEventRecord.event }} 告警</span>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot yellow"></div>
                <div class="timeline-content">
                  <span class="timeline-time">2024-01-15 10:25:00</span>
                  <span class="timeline-title">开始处理</span>
                  <span class="timeline-operator">操作人：运维工程师</span>
                  <span class="timeline-note">正在排查问题原因</span>
                </div>
              </div>
            </div>
          </div>
          </template>
        </div>
        <div class="detail-footer">
          <template v-if="alertEventRecord">
            <div></div>
            <div class="footer-actions">
              <a-button @click="closeDetailPanel">关闭</a-button>
              <a-button type="primary">处理告警</a-button>
            </div>
          </template>
          <template v-else>
          <div></div>
          <div class="footer-actions">
            <a-button type="primary" class="export-btn">
              <i class="fa-solid fa-download"></i> 导出数据
            </a-button>
            <a-button @click="closeDetailPanel">关闭</a-button>
          </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { Chart } from '@antv/g2'
import { setTopoHighlight } from '../composables/useEditorState.js'

const router = useRouter()
const route = useRoute()

const homeTab = ref(route.path === '/aiops' ? 'aiops' : 'home')

function switchTab(tab) {
  homeTab.value = tab
  router.replace(tab === 'aiops' ? '/aiops' : '/overview')
}
const aiopsIntent = ref('订单服务为什么告警？')
const aiopsLoading = ref(false)
const aiopsKpiCards = ref([])
const aiopsServiceHealth = ref([])
const aiopsAnomalies = ref([])
const aiopsRootCause = ref(null)
const aiopsPropagationPath = ref([])
const aiopsRecommendations = ref([])
const aiopsTrendContainer = ref(null)
let aiopsTrendChart = null

const detailPanelOpen = ref(false)
const currentCardTitle = ref('')
const detailPeriod = ref('week')
const detailType = ref('resource')
const alertEventRecord = ref(null)

const healthData = reactive({
  kpi: { current: '1,180,234', peak: '1,185,000', avg: '1,175,000', change: '+8%' },
  trendData: [
    { day: '5月16', healthy100: 800000, healthy95: 250000, healthy90: 80000, healthy80: 30000, healthyBelow: 20000 },
    { day: '5月17', healthy100: 820000, healthy95: 240000, healthy90: 75000, healthy80: 28000, healthyBelow: 18000 },
    { day: '5月18', healthy100: 810000, healthy95: 260000, healthy90: 70000, healthy80: 35000, healthyBelow: 15000 },
    { day: '5月19', healthy100: 830000, healthy95: 230000, healthy90: 80000, healthy80: 25000, healthyBelow: 20000 },
    { day: '5月20', healthy100: 840000, healthy95: 220000, healthy90: 75000, healthy80: 30000, healthyBelow: 15000 },
    { day: '5月21', healthy100: 850000, healthy95: 210000, healthy90: 70000, healthy80: 28000, healthyBelow: 20000 },
    { day: '5月22', healthy100: 860000, healthy95: 200000, healthy90: 75000, healthy80: 25000, healthyBelow: 20000 },
  ],
  tableData: [
    { range: '100%', count: 860000, percent: 69.7, status: '健康' },
    { range: '95%~99%', count: 200000, percent: 16.2, status: '良好' },
    { range: '90%~94%', count: 75000, percent: 6.1, status: '警告' },
    { range: '80%~89%', count: 25000, percent: 2.0, status: '异常' },
    { range: '<80%', count: 20000, percent: 1.6, status: '严重' },
  ],
})

const healthColumns = [
  { title: '健康率范围', dataIndex: 'range', key: 'range' },
  { title: '资源数量', dataIndex: 'count', key: 'count', align: 'right', sorter: (a, b) => a.count - b.count },
  { title: '占比', dataIndex: 'percent', key: 'percent', align: 'right' },
  { title: '状态', dataIndex: 'status', key: 'status' },
]

const healthTrendContainer = ref(null)
let healthTrendChart = null

function renderHealthTrendChart() {
  if (healthTrendChart) { healthTrendChart.destroy(); healthTrendChart = null }
  if (!healthTrendContainer.value) return

  healthTrendChart = new Chart({
    container: healthTrendContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 16, 20],
  })

  const chartData = healthData.trendData.flatMap(d => [
    { day: d.day, type: '100%', value: d.healthy100 },
    { day: d.day, type: '95%~99%', value: d.healthy95 },
    { day: d.day, type: '90%~94%', value: d.healthy90 },
    { day: d.day, type: '80%~89%', value: d.healthy80 },
    { day: d.day, type: '<80%', value: d.healthyBelow },
  ])

  healthTrendChart.data(chartData)

  healthTrendChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')
    .tooltip({ title: 'day', items: [{ channel: 'y', name: '资源数', valueFormatter: (v) => v.toLocaleString() }] })

  healthTrendChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)
    .tooltip(false)

  healthTrendChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  healthTrendChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  healthTrendChart.render()
}
const detailSearch = ref('')
const detailPage = ref(1)

const detailData = reactive([
  { type: 'ECS', added: 320, removed: 85, net: 235, total: '555,555' },
  { type: 'MySQL', added: 45, removed: 12, net: 33, total: '1,850' },
  { type: 'Redis', added: 28, removed: 8, net: 20, total: '1,200' },
  { type: 'K8s Pod', added: 580, removed: 165, net: 415, total: '370,370' },
  { type: 'SLB', added: 18, removed: 5, net: 13, total: '850' },
  { type: 'RDS', added: 35, removed: 10, net: 25, total: '920' },
  { type: 'OSS', added: 95, removed: 38, net: 67, total: '12,500' },
])

const detailColumns = [
  { title: '资源类型', dataIndex: 'type', key: 'type', filters: detailData.map(d => ({ text: d.type, value: d.type })), onFilter: (value, record) => record.type === value },
  { title: '新增', dataIndex: 'added', key: 'added', align: 'right', sorter: (a, b) => a.added - b.added },
  { title: '退出', dataIndex: 'removed', key: 'removed', align: 'right', sorter: (a, b) => a.removed - b.removed },
  { title: '净变化', dataIndex: 'net', key: 'net', align: 'right', sorter: (a, b) => a.net - b.net },
  { title: '当前总数', dataIndex: 'total', key: 'total', align: 'right' },
]

const filteredDetailData = computed(() => {
  if (!detailSearch.value) return detailData
  return detailData.filter(item => item.type.toLowerCase().includes(detailSearch.value.toLowerCase()))
})

const handleDetailTableChange = (pag) => {
  detailPage.value = pag.current
}

const alertDetailContainer = ref(null)
let alertDetailChart = null
const alertDetailSearch = ref('')
const alertDetailPage = ref(1)

const alertDetailTrendData = [
  { day: '5月15', critical: 9500, warning: 38000, info: 4500 },
  { day: '5月16', critical: 10000, warning: 40000, info: 5000 },
  { day: '5月17', critical: 9500, warning: 41000, info: 4800 },
  { day: '5月18', critical: 9000, warning: 39000, info: 4500 },
  { day: '5月19', critical: 8500, warning: 40000, info: 4200 },
  { day: '5月20', critical: 8000, warning: 38000, info: 4000 },
  { day: '5月21', critical: 8800, warning: 40000, info: 4500 },
  { day: '5月22', critical: 10000, warning: 42000, info: 4800 },
]

const alertDetailColumns = [
  { title: '告警ID', dataIndex: 'alertId', key: 'alertId', width: 130, fixed: 'left' },
  { title: '资源名称', dataIndex: 'resourceName', key: 'resourceName', width: 120, fixed: 'left' },
  { title: '资源类型', dataIndex: 'resourceType', key: 'resourceType', width: 80 },
  { title: '告警级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '告警类型', dataIndex: 'alertType', key: 'alertType', width: 120 },
  { title: '告警时间', dataIndex: 'alertTime', key: 'alertTime', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
]

const alertDetailData = [
  { alertId: 'ALT-2024011501', resourceName: 'ecs-prod-01', resourceType: 'ECS', level: '严重', alertType: 'CPU使用率过高', alertTime: '2024-01-15 10:23', status: '处理中' },
  { alertId: 'ALT-2024011502', resourceName: 'mysql-01', resourceType: 'MySQL', level: '严重', alertType: '连接数超限', alertTime: '2024-01-15 10:15', status: '处理中' },
  { alertId: 'ALT-2024011503', resourceName: 'redis-01', resourceType: 'Redis', level: '警告', alertType: '内存使用率过高', alertTime: '2024-01-15 09:58', status: '处理中' },
  { alertId: 'ALT-2024011504', resourceName: 'k8s-node-03', resourceType: 'K8s', level: '严重', alertType: '节点离线', alertTime: '2024-01-15 09:45', status: '已处理' },
  { alertId: 'ALT-2024011505', resourceName: 'slb-prod-01', resourceType: 'SLB', level: '警告', alertType: '后端健康检查失败', alertTime: '2024-01-15 09:30', status: '已恢复' },
]

const filteredAlertDetailData = computed(() => {
  if (!alertDetailSearch.value) return alertDetailData
  const q = alertDetailSearch.value.toLowerCase()
  return alertDetailData.filter(item =>
    item.resourceName.toLowerCase().includes(q) ||
    item.alertId.toLowerCase().includes(q)
  )
})

const handleAlertDetailTableChange = (pag) => {
  alertDetailPage.value = pag.current
}

function renderAlertDetailChart() {
  if (alertDetailChart) { alertDetailChart.destroy(); alertDetailChart = null }
  if (!alertDetailContainer.value) return

  alertDetailChart = new Chart({
    container: alertDetailContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 16, 20],
  })

  const chartData = alertDetailTrendData.flatMap(d => [
    { day: d.day, type: '严重', value: d.critical },
    { day: d.day, type: '警告', value: d.warning },
    { day: d.day, type: '信息', value: d.info },
  ])

  alertDetailChart.data(chartData)
  alertDetailChart.scale('color', { range: ['#f5222d', '#fa8c16', '#8c8c8c'] })

  alertDetailChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fillOpacity', 0.08)
    .style('shape', 'smooth')
    .tooltip(false)

  alertDetailChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')
    .tooltip({ title: 'day', items: [{ channel: 'y', name: '告警数', valueFormatter: (v) => v.toLocaleString() }] })

  alertDetailChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)
    .tooltip(false)

  alertDetailChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  alertDetailChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  alertDetailChart.render()
}

const eventDetailContainer = ref(null)
let eventDetailChart = null

const eventDetailTrendData = [
  { day: '5月15', critical: 45, warning: 60, info: 20 },
  { day: '5月16', critical: 40, warning: 65, info: 22 },
  { day: '5月17', critical: 35, warning: 55, info: 18 },
  { day: '5月18', critical: 50, warning: 70, info: 25 },
  { day: '5月19', critical: 42, warning: 58, info: 20 },
  { day: '5月20', critical: 38, warning: 62, info: 24 },
  { day: '5月21', critical: 48, warning: 60, info: 26 },
]

const eventDetailColumns = [
  { title: '事件级别', dataIndex: 'level', key: 'level', width: 100 },
  { title: '事件数量', dataIndex: 'count', key: 'count', align: 'right' },
  { title: '占比', dataIndex: 'percent', key: 'percent' },
  { title: '趋势', dataIndex: 'trend', key: 'trend', width: 80 },
]

const eventDetailData = [
  { level: '严重', count: 32, percent: 25, trend: '下降' },
  { level: '警告', count: 70, percent: 54.7, trend: '稳定' },
  { level: '信息', count: 26, percent: 20.3, trend: '上升' },
]

function renderEventDetailChart() {
  if (eventDetailChart) { eventDetailChart.destroy(); eventDetailChart = null }
  if (!eventDetailContainer.value) return

  eventDetailChart = new Chart({
    container: eventDetailContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 16, 20],
  })

  const chartData = eventDetailTrendData.flatMap(d => [
    { day: d.day, type: '严重', value: d.critical },
    { day: d.day, type: '警告', value: d.warning },
    { day: d.day, type: '信息', value: d.info },
  ])

  eventDetailChart.data(chartData)
  eventDetailChart.scale('color', { range: ['#f5222d', '#fa8c16', '#8c8c8c'] })

  eventDetailChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fillOpacity', 0.08)
    .style('shape', 'smooth')
    .tooltip(false)

  eventDetailChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('lineWidth', 2)
    .style('shape', 'smooth')
    .tooltip({ title: 'day', items: [{ channel: 'y', name: '事件数', valueFormatter: (v) => v.toLocaleString() }] })

  eventDetailChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .encode('color', 'type')
    .style('fill', '#fff')
    .style('lineWidth', 1.5)
    .style('size', 4)
    .tooltip(false)

  eventDetailChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16 })

  eventDetailChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  eventDetailChart.render()
}

const distDonutContainer = ref(null)
let distDonutChart = null
const distDetailSearch = ref('')
const distDetailPage = ref(1)

const distDonutData = [
  { name: '业务应用', value: 555555, color: '#007BFF' },
  { name: '云服务', value: 370370, color: '#69C0FF' },
  { name: '云资源', value: 185185, color: '#52C41A' },
  { name: '物理资源', value: 123457, color: '#FA8C16' },
]

const distDetailColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
]

const distDetailData = [
  { name: '弹性服务器', type: 'ECS', status: '正常', updateTime: '2024-01-15 10:30', desc: 'ECS实例总数: 555,555' },
  { name: '容器', type: '容器', status: '正常', updateTime: '2024-01-15 10:30', desc: 'Pod总数: 370,370' },
  { name: '业务服务', type: '服务', status: '正常', updateTime: '2024-01-15 10:30', desc: '服务实例数: 185,185' },
  { name: '物理设备', type: '物理', status: '正常', updateTime: '2024-01-15 10:30', desc: '物理机数量: 123,457' },
]

const filteredDistDetailData = computed(() => {
  if (!distDetailSearch.value) return distDetailData
  const q = distDetailSearch.value.toLowerCase()
  return distDetailData.filter(item =>
    item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  )
})

const handleDistDetailTableChange = (pag) => {
  distDetailPage.value = pag.current
}

function renderDistDonutChart() {
  if (distDonutChart) { distDonutChart.destroy(); distDonutChart = null }
  if (!distDonutContainer.value) return

  distDonutChart = new Chart({
    container: distDonutContainer.value,
    autoFit: true,
    height: 220,
    padding: [10, 10, 28, 10],
  })

  distDonutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })

  distDonutChart.data(distDonutData)

  distDonutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: ['#007BFF', '#69C0FF', '#52C41A', '#FA8C16'] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '数量', valueFormatter: (v) => v.toLocaleString() }] })

  distDonutChart.label({
    text: (d) => `${d.name}\n${d.value.toLocaleString()}`,
    position: 'outside',
    connector: true,
    connectorStroke: '#ccc',
    connectorLineWidth: 1,
    fontSize: 11,
    labelLine: true,
  })

  distDonutChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })

  distDonutChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  distDonutChart.render()
}

const mainDonutContainer = ref(null)
let mainDonutChart = null

const trendSingleContainer = ref(null)
let trendSingleChart = null
const trendDetailSearch = ref('')
const trendDetailPage = ref(1)

const trendSingleData = [
  { day: '5月15', value: 45 },
  { day: '5月16', value: 52 },
  { day: '5月17', value: 38 },
  { day: '5月18', value: 65 },
  { day: '5月19', value: 48 },
  { day: '5月20', value: 35 },
  { day: '5月21', value: 42 },
]

const resourceTrendData = [
  { day: '5月15', value: 1210000 },
  { day: '5月16', value: 1218000 },
  { day: '5月17', value: 1225000 },
  { day: '5月18', value: 1222000 },
  { day: '5月19', value: 1230000 },
  { day: '5月20', value: 1234000 },
  { day: '5月21', value: 1234567 },
]
const resourceTrendContainer = ref(null)
let resourceTrendChart = null

const trendDetailColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 150 },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
]

const trendDetailData = [
  { name: 'mysql-01', type: 'MySQL', status: '警告', updateTime: '2024-01-15 10:15', desc: '连接数超限' },
  { name: 'redis-01', type: 'Redis', status: '警告', updateTime: '2024-01-15 09:58', desc: '内存使用率过高' },
  { name: 'k8s-node-03', type: 'K8s', status: '严重', updateTime: '2024-01-15 09:45', desc: '节点离线' },
]

const filteredTrendDetailData = computed(() => {
  if (!trendDetailSearch.value) return trendDetailData
  const q = trendDetailSearch.value.toLowerCase()
  return trendDetailData.filter(item =>
    item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
  )
})

const handleTrendDetailTableChange = (pag) => {
  trendDetailPage.value = pag.current
}

function renderTrendSingleChart() {
  if (trendSingleChart) { trendSingleChart.destroy(); trendSingleChart = null }
  if (!trendSingleContainer.value) return

  trendSingleChart = new Chart({
    container: trendSingleContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 32, 20],
  })

  trendSingleChart.data(trendSingleData)

  trendSingleChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')
    .tooltip(false)

  trendSingleChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')
    .tooltip({ title: 'day', items: [{ channel: 'y', name: '趋势值' }] })

  trendSingleChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .tooltip(false)

  trendSingleChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  trendSingleChart.render()
}

function renderResourceTrendChart() {
  if (resourceTrendChart) { resourceTrendChart.destroy(); resourceTrendChart = null }
  if (!resourceTrendContainer.value) return

  resourceTrendChart = new Chart({
    container: resourceTrendContainer.value,
    autoFit: true,
    height: 180,
    padding: [20, 20, 20, 20],
  })

  resourceTrendChart.data(resourceTrendData)

  resourceTrendChart.area()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')
    .tooltip(false)

  resourceTrendChart.line()
    .encode('x', 'day')
    .encode('y', 'value')
    .style('shape', 'smooth')
    .tooltip({ title: 'day', items: [{ channel: 'y', name: '资源总数', valueFormatter: (v) => v.toLocaleString() }] })

  resourceTrendChart.point()
    .encode('x', 'day')
    .encode('y', 'value')
    .tooltip(false)

  resourceTrendChart.interaction('tooltip', { mount: 'body', css: { '.g2-tooltip': { 'z-index': '9999' } } })
  resourceTrendChart.render()
}

function renderMainDonutChart() {
  if (mainDonutChart) { mainDonutChart.destroy(); mainDonutChart = null }
  if (!mainDonutContainer.value) return

  mainDonutChart = new Chart({
    container: mainDonutContainer.value,
    autoFit: true,
    height: 220,
    padding: [10, 10, 28, 10],
  })

  mainDonutChart.coordinate({ type: 'theta', innerRadius: 0.6, outerRadius: 0.9 })

  mainDonutChart.data(resourceDist.map(d => ({ name: d.name, value: d.percent })))

  mainDonutChart.interval()
    .encode('y', 'value')
    .encode('color', 'name')
    .scale('color', { range: ['#007BFF', '#69C0FF', '#52C41A', '#FA8C16'] })
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .tooltip({ title: 'name', items: [{ channel: 'y', name: '占比', valueFormatter: (v) => v + '%' }] })

  mainDonutChart.legend('color', { position: 'bottom', layout: { justifyContent: 'center' }, itemSpacing: 16, itemLabelFontSize: 12 })

  mainDonutChart.render()
}

watch(detailPanelOpen, (val) => {
  if (val) {
    detailPeriod.value = 'week'
    detailSearch.value = ''
    detailPage.value = 1
    alertDetailSearch.value = ''
    alertDetailPage.value = 1
    nextTick(() => {
      if (detailType.value === 'resource') renderResourceTrendChart()
      else if (detailType.value === 'health') renderHealthTrendChart()
      else if (detailType.value === 'alert') renderAlertDetailChart()
      else if (detailType.value === 'event') renderEventDetailChart()
      else if (detailType.value === 'distribution') renderDistDonutChart()
      else if (detailType.value === 'trend') renderTrendSingleChart()
    })
  }
})

const openDetailPanel = (card) => {
  currentCardTitle.value = card.title
  if (card.title === '健康资源') {
    detailType.value = 'health'
  } else if (card.title === '资源总数') {
    detailType.value = 'resource'
  } else if (card.title === '当日告警') {
    detailType.value = 'alert'
  } else if (card.title === '资源分类分布') {
    detailType.value = 'distribution'
  } else if (card.title === '告警趋势') {
    detailType.value = 'trend'
  } else if (card.title === '今日事件') {
    detailType.value = 'event'
  }
  detailPanelOpen.value = true
}

const closeDetailPanel = () => {
  detailPanelOpen.value = false
  alertEventRecord.value = null
}

const openAlertEventDetail = (record) => {
  alertEventRecord.value = record
  detailPanelOpen.value = true
}

const handleCardAction = (card, key) => {
  if (key === 'detail') {
    openDetailPanel(card)
    return
  }
  const actions = {
    export: '导出数据',
    history: '历史趋势',
  }
  message.info(`${card.title} - ${actions[key]}`)
}

const kpiCards = reactive([
  {
    title: '资源总数',
    value: '1,234,567',
    trend: 12,
    trendText: '较上月 +12%',
    icon: 'fa-solid fa-layer-group',
    iconBg: '#e6f7ff',
    iconColor: '#007BFF',
    sub: ' ',
  },
  {
    title: '健康资源',
    value: '1,180,234',
    trend: undefined,
    trendText: '',
    icon: 'fa-solid fa-circle-check',
    iconBg: '#f6ffed',
    iconColor: '#52C41A',
    sub: '健康率 95.6%',
  },
  {
    title: '当日告警',
    value: '54,333',
    trend: -8,
    trendText: '较上周 -8%',
    icon: 'fa-solid fa-triangle-exclamation',
    iconBg: '#fff7e6',
    iconColor: '#FA8C16',
    sub: ' ',
    link: '/alarm/current',
  },
  {
    title: '今日事件',
    value: '128',
    trend: 5,
    trendText: '较昨日 +5%',
    icon: 'fa-solid fa-bell',
    iconBg: '#fff0f6',
    iconColor: '#EB2F96',
    sub: ' ',
  },
])

const resourceDist = reactive([
  { name: '业务应用', percent: 45, color: '#007BFF' },
  { name: '云服务', percent: 30, color: '#69C0FF' },
  { name: '云资源', percent: 15, color: '#52C41A' },
  { name: '物理资源', percent: 10, color: '#FA8C16' },
])

const alertColumns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 80 },
  { title: 'CI名称', dataIndex: 'ciName', key: 'ciName' },
  { title: 'CI类型', dataIndex: 'ciType', key: 'ciType', width: 80 },
  { title: '事件', dataIndex: 'event', key: 'event' },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 100 },
]

const alertEvents = reactive([
  { id: 1, time: '10:23', ciName: 'prod-order-01', ciType: 'Service', event: 'CPU使用率过高', level: '严重', status: '处理中' },
  { id: 2, time: '10:15', ciName: 'mysql-master', ciType: 'MySQL', event: '连接数超限', level: '警告', status: '已恢复' },
  { id: 3, time: '09:58', ciName: 'redis-cache', ciType: 'Redis', event: '内存使用率过高', level: '警告', status: '处理中' },
  { id: 4, time: '09:45', ciName: 'prod-order-02', ciType: 'Service', event: '服务响应超时', level: '严重', status: '已处理' },
  { id: 5, time: '09:30', ciName: 'lb-api', ciType: 'Gateway', event: '后端健康检查失败', level: '警告', status: '已恢复' },
])

function navigateCard(card) {
  if (card.link) router.push(card.link)
}

function analyzeAlert(record) {
  setTopoHighlight({ nodes: [record.ciName] })
  const win = window
  if (win.__openAIAssistant) {
    win.__openAIAssistant(`分析告警：${record.event}（${record.level}，${record.ciName}），定位根因并给出排查建议`)
  }
}

async function fetchAiopsData() {
  try {
    const [anomalyRes, healthRes, predRes, remedRes, trendRes, topoRes, recRes] = await Promise.all([
      fetch('/api/intelligent/anomalies').then(r => r.json()),
      fetch('/api/intelligent/health').then(r => r.json()),
      fetch('/api/intelligent/predictions').then(r => r.json()),
      fetch('/api/intelligent/remediation').then(r => r.json()),
      fetch('/api/intelligent/trend').then(r => r.json()),
      fetch('/api/mock/topology').then(r => r.json()),
      fetch('/api/intelligent/recommendations').then(r => r.json()),
    ])
    const anomalies = anomalyRes.data || []
    const summary = anomalyRes.summary || {}
    const health = healthRes.data || {}
    const pred = predRes.data || {}
    const remed = remedRes.data || {}
    const trend = trendRes.data || []
    const topo = topoRes.data || {}
    const recData = recRes.data || []

    aiopsTopoNodes.value = topo.nodes || []
    const kpiHistory = health.kpiHistory || {}
    aiopsKpiCards.value = [
      { key: 'anomalyCount', label: '异常检测', value: summary.total || 0, icon: 'fa-solid fa-triangle-exclamation', iconBg: '#FFF1F0', iconColor: '#F5222D', valClass: 'kpi-danger', trendText: '较昨日 +60%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.anomalyCount || []) },
      { key: 'healthScore', label: '健康度', value: (health.score || 0) + '%', icon: 'fa-solid fa-heart-pulse', iconBg: '#F6FFED', iconColor: '#07C160', valClass: health.score < 90 ? 'kpi-warn' : 'kpi-ok', trendText: '较昨日 -5.4%', trendDir: 'down', sparklinePath: calcSparklinePath(kpiHistory.healthScore || []) },
      { key: 'predictedAlerts', label: '预测告警', value: pred.items?.length || 0, icon: 'fa-solid fa-clock-rotate-left', iconBg: '#FFF7E6', iconColor: '#FF7D00', valClass: 'kpi-warn', trendText: '较昨日 +50%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.predictedAlerts || []) },
      { key: 'autoRemediationRate', label: '自动修复率', value: (remed.rate || 0) + '%', icon: 'fa-solid fa-rotate-right', iconBg: '#F0F5FF', iconColor: '#007DFF', valClass: 'kpi-ok', trendText: '较昨日 +8.2%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.autoRemediationRate || []) },
    ]

    aiopsServiceHealth.value = health.services || []
    aiopsAnomalies.value = anomalies

    if (anomalies.length) {
      const root = anomalies.reduce((max, a) => a.score > max.score ? a : max, anomalies[0])
      aiopsRootCause.value = root
      const edges = topo.edges || []
      const upstreamMap = {}
      edges.forEach(e => {
        if (!upstreamMap[e.target]) upstreamMap[e.target] = []
        upstreamMap[e.target].push(e.source)
      })
      const path = []
      const visited = new Set()
      function bfs(nodeId) {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        path.unshift(nodeId)
        const parents = upstreamMap[nodeId] || []
        parents.forEach(p => bfs(p))
      }
      bfs(root.nodeId)
      aiopsPropagationPath.value = path
    }

    aiopsRecommendations.value = recData.map(r => ({
      ...r, icon: { restart: 'fa-solid fa-rotate-right', scale: 'fa-solid fa-expand', 'view-topology': 'fa-solid fa-diagram-project', report: 'fa-solid fa-file-lines', 'flush-cache': 'fa-solid fa-broom' }[r.action] || 'fa-solid fa-wrench'
    }))

    renderAiopsTrend(trend)
  } catch {}
}

function renderAiopsTrend(data) {
  if (!aiopsTrendContainer.value || !data?.length) return
  if (aiopsTrendChart) { aiopsTrendChart.destroy(); aiopsTrendChart = null }

  const longData = data.flatMap(d => [
    { hour: d.hour, type: '严重', value: d.critical },
    { hour: d.hour, type: '警告', value: d.warning },
    { hour: d.hour, type: '提示', value: d.info },
  ])

  aiopsTrendChart = new Chart({ container: aiopsTrendContainer.value, autoFit: true, padding: [10, 10, 30, 40] })
  aiopsTrendChart.interval()
    .data(longData)
    .encode('x', 'hour')
    .encode('y', 'value')
    .encode('color', 'type')
    .scale('color', { range: ['#F5222D', '#FF7D00', '#007DFF'] })
    .transform({ type: 'stackY' })
    .style('radius', [2, 2, 0, 0])
    .tooltip({ channel: 'y', valueFormatter: (v) => v + '条' })
  aiopsTrendChart.render()
}

function sendAiopsIntent() {
  if (!aiopsIntent.value.trim()) return
  const win = window
  if (win.__openAIAssistant) {
    win.__openAIAssistant(aiopsIntent.value)
    aiopsIntent.value = ''
  }
}

function autoResizeInput(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const NODE_LABELS = { cdn: 'CDN', waf: 'WAF', slb: 'SLB', 'lb-api': 'API GW', 'prod-order-01': '订单-01', 'prod-order-02': '订单-02', 'prod-order-03': '订单-03', 'prod-user-01': '用户-01', 'prod-user-02': '用户-02', 'prod-pay-01': '支付-01', 'prod-pay-02': '支付-02', 'prod-inventory-01': '库存-01', 'redis-cache': 'Redis', 'mysql-master': 'MySQL主', 'mysql-slave': 'MySQL从', nacos: 'Nacos', 'mq-order': 'MQ', 'es-cluster': 'ES', 'k8s-master': 'K8s-M', 'k8s-node-1': 'K8s-N1', 'k8s-node-2': 'K8s-N2', 'k8s-node-3': 'K8s-N3', mongodb: 'Mongo' }
const aiopsTopoNodes = ref([])

function getNodeLabel(id) { return NODE_LABELS[id] || id }
function getNodeStatus(id) {
  const node = aiopsTopoNodes.value.find(n => n.id === id)
  return node?.status || 'normal'
}
function getElapsed(timeStr) {
  if (!timeStr) return '持续中'
  const t = new Date(timeStr)
  const now = new Date()
  const diff = Math.round((now - t) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return diff + '分钟前'
  return Math.round(diff / 60) + '小时前'
}
function calcSparklinePath(values, h = 24, w = 60) {
  const max = Math.max(...values, 1)
  const stepX = w / (values.length - 1)
  return values.map((v, i) => {
    const x = i * stepX
    const y = h - (v / max) * (h - 4) - 2
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
}
function confidenceColor(score) {
  if (score >= 90) return '#07C160'
  if (score >= 75) return '#FF7D00'
  return '#9CA3AF'
}

function executeRec(rec) {
  if (rec.targetNode) {
    setTopoHighlight({ nodes: [rec.targetNode] })
    router.push('/monitor/topology?tab=application&appTab=all')
  } else {
    const win = window
    if (win.__openAIAssistant) {
      win.__openAIAssistant(`执行推荐操作：${rec.label} - ${rec.desc}`)
    }
  }
}

watch(homeTab, (tab) => {
  if (tab === 'aiops') {
    fetchAiopsData()
  }
}, { immediate: true })

const alertTrendContainer = ref(null)
let alertTrendChart = null

const alertTrendData = [
  { date: '5月16', value: 45 },
  { date: '5月17', value: 52 },
  { date: '5月18', value: 38 },
  { date: '5月19', value: 65 },
  { date: '5月20', value: 48 },
  { date: '5月21', value: 35 },
  { date: '5月22', value: 42 },
]

function renderAlertTrendChart() {
  if (alertTrendChart) { alertTrendChart.destroy(); alertTrendChart = null }
  if (!alertTrendContainer.value) return

  alertTrendChart = new Chart({
    container: alertTrendContainer.value,
    autoFit: true,
    height: 220,
    padding: [20, 20, 20, 20],
  })

  alertTrendChart.data(alertTrendData)

  alertTrendChart.area()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('fill', 'l(0) 0:#ff4d4f30 1:#ff4d4f05')
    .style('shape', 'smooth')
    .tooltip(false)

  alertTrendChart.line()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('stroke', '#ff4d4f')
    .style('lineWidth', 2.5)
    .style('shape', 'smooth')
    .tooltip({ title: 'date', items: [{ channel: 'y', name: '告警数量' }] })

  alertTrendChart.point()
    .encode('x', 'date')
    .encode('y', 'value')
    .style('fill', '#ff4d4f')
    .style('stroke', '#fff')
    .style('lineWidth', 2)
    .style('size', 5)
    .tooltip(false)

  alertTrendChart.render()
}

onMounted(() => {
  renderAlertTrendChart()
  renderMainDonutChart()
})

onMounted(async function() {
  try {
    const alertsRes = await fetch('/api/cmdb/alerts?sort=id&order=DESC&pageSize=5')
    const alerts = await alertsRes.json()

    if (alerts.success) {
      alertEvents.splice(0, alertEvents.length,
        ...alerts.data.map(function(item) {
          return {
            id: item.id,
            time: item.trigger_time,
            ciName: (item.resource || '').split('(')[0].trim(),
            ciType: item.level,
            event: item.title,
            level: item.level,
            status: item.status,
          }
        })
      )
    }
  } catch (e) {
    console.error('加载仪表盘数据失败:', e)
  }
})

onBeforeUnmount(() => {
  if (alertTrendChart) { alertTrendChart.destroy(); alertTrendChart = null }
  if (healthTrendChart) { healthTrendChart.destroy(); healthTrendChart = null }
  if (alertDetailChart) { alertDetailChart.destroy(); alertDetailChart = null }
  if (eventDetailChart) { eventDetailChart.destroy(); eventDetailChart = null }
  if (distDonutChart) { distDonutChart.destroy(); distDonutChart = null }
  if (trendSingleChart) { trendSingleChart.destroy(); trendSingleChart = null }
  if (resourceTrendChart) { resourceTrendChart.destroy(); resourceTrendChart = null }
  if (mainDonutChart) { mainDonutChart.destroy(); mainDonutChart = null }
  if (aiopsTrendChart) { aiopsTrendChart.destroy(); aiopsTrendChart = null }
})

const refreshCard = (card) => {
  message.success(`刷新 ${card.title} 数据`)
}
</script>

<style scoped>
.home-view { padding: 8px 24px 24px; min-height: 100%; }
.kpi-card {
  padding: 16px 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s;
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}
.kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.kpi-card:hover .card-actions { opacity: 1; }

.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.card-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.card-title { font-size: 14px; color: var(--text-secondary); flex: 1; }
.card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.action-btn { padding: 2px 6px; color: var(--text-secondary); }
.action-btn:hover { color: #1890ff; }

.card-value { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
.card-value .value { font-size: 28px; font-weight: 600; color: #1a1a1a; }
.trend { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.trend.up { color: #52C41A; }
.trend.down { color: #f5222d; }
.card-sub { font-size: 12px; color: var(--text-secondary); min-height: 16px; }

.chart-card :deep(.ant-card-head) { border-bottom: 1px solid #f0f0f0; }
.chart-card :deep(.ant-card-body) { padding: 20px; }
.chart-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
.chart-card:hover .chart-actions { opacity: 1; }
.chart-actions .action-btn { padding: 2px 6px; color: var(--text-secondary); }
.chart-actions .action-btn:hover { color: #1890ff; }

.donut-chart { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 16px 0; }
.donut-ring { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
.donut-ring svg { width: 100%; height: 100%; }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.donut-center .total { display: block; font-size: 20px; font-weight: 600; color: #1a1a1a; }
.donut-center .label { font-size: 12px; color: var(--text-secondary); }
.donut-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.legend-name { flex: 1; min-width: 60px; }
.legend-percent { color: var(--text-secondary); min-width: 35px; text-align: right; }

.line-chart { position: relative; height: 220px; min-height: 220px; }
.health-trend-chart { height: 180px; min-height: 180px; }
.alert-trend-chart { height: 180px; min-height: 180px; }
.event-trend-chart { height: 180px; min-height: 180px; }
.dist-donut-chart { height: 220px; min-height: 220px; }
.main-donut-chart { height: 220px; min-height: 220px; }
.trend-single-chart { height: 180px; min-height: 180px; }
.alert-summary-card { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 20px; }
.alert-event-name { font-size: 18px; font-weight: 600; color: #1a1a1a; flex: 1; }
.alert-event-time { font-size: 13px; color: #8c8c8c; }
.ci-info-table { border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.ci-row { display: grid; grid-template-columns: 80px 1fr 80px 1fr; border-bottom: 1px solid #f5f5f5; }
.ci-row:last-child { border-bottom: none; }
.ci-label { padding: 10px 12px; font-size: 12px; color: #8c8c8c; background: #fafafa; }
.ci-value { padding: 10px 12px; font-size: 13px; color: #1a1a1a; }
.timeline-section { margin-bottom: 20px; }
.timeline-section h4 { margin: 0 0 16px; font-size: 14px; font-weight: 600; }
.timeline { position: relative; padding-left: 24px; }
.timeline-item { position: relative; padding-bottom: 24px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { position: absolute; left: -24px; top: 2px; width: 12px; height: 12px; border-radius: 50%; z-index: 1; }
.timeline-dot.red { background: #f5222d; }
.timeline-dot.yellow { background: #fa8c16; }
.timeline-line { position: absolute; left: -19px; top: 14px; bottom: 0; width: 2px; background: #e8e8e8; }
.timeline-item:last-child .timeline-line { display: none; }
.timeline-content { display: flex; flex-direction: column; gap: 4px; }
.timeline-time { font-size: 12px; color: #8c8c8c; }
.timeline-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.timeline-operator { font-size: 12px; color: #8c8c8c; }
.timeline-note { font-size: 13px; color: #595959; }
.line-labels { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

.chart-card { min-height: 270px; }
.chart-card :deep(.ant-card-body) { height: calc(100% - 57px); display: flex; flex-direction: column; justify-content: center; }
.table-card :deep(.ant-card-head-title) { font-weight: 600; }
.table-card :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.status-处理中 { color: #8c8c8c; }
.status-已恢复, .status-已处理 { color: #52C41A; }

@media (max-width: 768px) {
  .home-view { padding: 12px; }
  .welcome-bar { margin-bottom: 16px; }
  .welcome-text h2 { font-size: 16px; }
  .welcome-text p { font-size: 12px; }
  .kpi-card { padding: 12px 14px; min-height: 80px; }
  .card-header { margin-bottom: 8px; }
  .card-icon { width: 28px; height: 28px; font-size: 13px; }
  .card-title { font-size: 12px; }
  .card-actions { opacity: 1; }
  .card-value .value { font-size: 20px; }
  .trend { font-size: 11px; }
  .card-sub { font-size: 11px; min-height: 14px; }
  .chart-card { min-height: 220px; }
  .chart-card :deep(.ant-card-body) { padding: 12px; }
  .chart-actions { opacity: 1; }
  .donut-chart { flex-direction: column; }
  .donut-legend { flex-direction: row; flex-wrap: wrap; }
  .donut-ring { width: 120px; height: 120px; }
  .donut-center .total { font-size: 16px; }
  .line-chart { height: 160px; min-height: 160px; }
  .health-trend-chart { height: 140px; min-height: 140px; }
  .alert-trend-chart { height: 140px; min-height: 140px; }
  .event-trend-chart { height: 140px; min-height: 140px; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-body { padding: 12px; }
  .detail-header { padding: 12px 14px; }
  .detail-header h3 { font-size: 14px; }
  .detail-header .close-btn { padding: 8px 12px; font-size: 18px; }
  .detail-kpi { padding: 12px; gap: 8px; }
  .dk-value { font-size: 16px; }
  .time-tabs :deep(.ant-radio-button-wrapper) { font-size: 11px; padding: 0 4px; }
  .ci-row { grid-template-columns: 70px 1fr 70px 1fr; }
  .ci-label { font-size: 11px; padding: 8px 10px; }
  .ci-value { font-size: 12px; padding: 8px 10px; }
  .alert-summary-card { flex-wrap: wrap; gap: 6px; }
  .alert-summary-card .alert-event-name { flex: 0 0 100%; order: 1; }
  .alert-summary-card .alert-event-time { flex: 0 0 100%; order: 2; }
  .timeline-content { font-size: 12px; }
  .timeline-title { font-size: 13px; }
  .detail-footer { flex-direction: column; gap: 8px; padding: 12px 14px; }
  .detail-footer > div:first-child { display: none; }
  .footer-actions { width: 100%; }
  .footer-actions button { flex: 1; }
}

@media (max-width: 576px) {
  .home-view { padding: 8px; }
  .kpi-card { padding: 10px 12px; min-height: 70px; }
  .card-value .value { font-size: 18px; }
  .card-icon { width: 24px; height: 24px; font-size: 11px; }
  .detail-search { width: 100% !important; }
  .detail-panel-content { right: -100%; }
  .detail-table :deep(.ant-table) { overflow-x: auto; }
  .detail-table :deep(.ant-table-body) { overflow-x: auto !important; }
  .ci-row { grid-template-columns: 1fr; gap: 0; }
  .ci-label { padding: 8px 10px 2px; }
  .ci-value { padding: 2px 10px 8px; }
  .ci-label:empty, .ci-value:empty { display: none; }
}

@media (max-width: 768px) {
  .detail-panel-content {
    width: 85%;
    right: -85%;
  }
  .detail-panel.open .detail-panel-content {
    right: 0;
  }
  .detail-header {
    padding: 12px 16px;
  }
  .detail-header h3 {
    font-size: 15px;
  }
  .detail-body {
    padding: 16px;
  }
  .time-tabs { margin-bottom: 16px; }
  .time-tabs :deep(.ant-radio-group) {
    flex-wrap: wrap;
  }
  .time-tabs :deep(.ant-radio-button-wrapper) {
    flex: 1 1 45%;
    min-width: 45%;
    text-align: center;
    font-size: 12px;
  }
  .detail-chart {
    margin-bottom: 16px;
  }
  .detail-kpi {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .detail-kpi { grid-template-columns: 1fr; }
  .detail-panel-content {
    width: 100%;
    right: -100%;
  }
}

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
.detail-panel.open {
  pointer-events: auto;
  opacity: 1;
}
.detail-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.3);
}
.detail-panel-content {
  position: absolute;
  top: 0;
  right: -500px;
  width: 500px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transition: right 0.3s;
}
.detail-panel.open .detail-panel-content {
  right: 0;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.detail-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.close-btn { font-size: 16px; color: #8c8c8c; }
.close-btn:hover { color: #1890ff; }

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.time-tabs { margin-bottom: 20px; }
.time-tabs :deep(.ant-radio-group) { width: 100%; display: flex; }
.time-tabs :deep(.ant-radio-button-wrapper) { flex: 1; text-align: center; position: relative; z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper:hover) { z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper-checked) { background: #1890ff; border-color: #1890ff; color: #fff; z-index: 1; }
.time-tabs :deep(.ant-radio-button-wrapper::before) { z-index: 0; }

.detail-chart { position: relative; margin-bottom: 24px; }
.detail-line-svg { width: 100%; height: 180px; }
.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}
.detail-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.detail-kpi {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}
.detail-kpi-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dk-label { font-size: 12px; color: var(--text-secondary); }
.dk-value { font-size: 20px; font-weight: 600; color: #1a1a1a; }
.dk-value.up { color: #52C41A; }
.dk-value.down { color: #f5222d; }

.detail-table h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.table-toolbar { margin-bottom: 12px; }
.detail-search { width: 200px; }
.detail-table :deep(.ant-table-thead > tr > th) { background: #fafafa; font-weight: 600; }
.detail-table :deep(.ant-pagination) { margin-top: 12px; }
.bar-cell { display: flex; align-items: center; gap: 6px; }
.bar-cell-inline { gap: 8px; }
.bar-bg { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; min-width: 100px; }
.bar-bg-sm { height: 14px; min-width: 80px; border-radius: 7px; }
.bar-fill { height: 100%; background: #1890ff; border-radius: 5px; }
.bar-bg-sm .bar-fill { border-radius: 7px; }
.health-good { color: #52C41A; }
.health-warn { color: #fa8c16; }
.health-bad { color: #f5222d; }
.num-up { color: #52C41A; }
.num-down { color: #f5222d; }
.trend-up { color: #f5222d; font-weight: 500; }
.trend-down { color: #52C41A; font-weight: 500; }
.trend-stable { color: #fa8c16; font-weight: 500; }

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}
.footer-actions { display: flex; gap: 16px; }
.export-btn { display: flex; align-items: center; gap: 6px; }

/* AI Ops Tab */
.home-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid var(--border, #E5E5EA); padding-bottom: 0; }
.home-tab-btn { padding: 8px 20px; border: none; background: transparent; color: var(--text-sec, #6B7280); font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
.home-tab-btn.active { color: var(--brand, #007DFF); border-bottom-color: var(--brand, #007DFF); }
.home-tab-btn:hover { color: var(--brand, #007DFF); }

.aiops-intent-bar { margin-bottom: 20px; }

.aiops-intent-wrapper {
  display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px 10px 16px;
  background: #fff; border: 2px solid var(--border, #E5E5EA); border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.aiops-intent-wrapper:focus-within {
  border-color: var(--intelligent, #722ED1);
  box-shadow: 0 0 0 4px rgba(114,46,209,0.1), 0 4px 16px rgba(114,46,209,0.08);
}
.aiops-intent-input {
  flex: 1; border: none; outline: none; font-size: 15px; line-height: 1.5;
  color: var(--text, #1F2937); background: transparent; resize: none;
  font-family: inherit; min-height: 22px; max-height: 120px; padding: 8px 0;
}
.aiops-intent-input::placeholder { color: #9CA3AF; }
.aiops-intent-send {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--intelligent, #722ED1), var(--brand, #007DFF));
  color: #fff; font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
}
.aiops-intent-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 12px rgba(114,46,209,0.3); }
.aiops-intent-send:disabled { opacity: 0.4; cursor: not-allowed; }
.aiops-suggestions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.suggestion-chip {
  padding: 5px 12px; border-radius: 20px; background: var(--bg-sec, #F2F2F7);
  color: var(--text-sec, #6B7280); font-size: 12px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent; display: flex; align-items: center; gap: 4px;
}
.suggestion-chip:hover { border-color: var(--intelligent, #722ED1); color: var(--intelligent, #722ED1); background: rgba(114,46,209,0.05); }

.aiops-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.aiops-kpi-card { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.aiops-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.aiops-kpi-info { flex: 1; }
.aiops-kpi-val { font-size: 22px; font-weight: 700; line-height: 1.2; }
.aiops-kpi-label { font-size: 12px; color: var(--text-sec, #6B7280); }
.aiops-kpi-trend { font-size: 11px; font-weight: 500; }
.aiops-kpi-trend.up { color: var(--danger, #F5222D); }
.aiops-kpi-trend.down { color: #07C160; }
.kpi-sparkline { flex-shrink: 0; margin-left: 4px; }
.kpi-danger { color: var(--danger, #F5222D); }
.kpi-warn { color: var(--warn, #FF7D00); }
.kpi-ok { color: #07C160; }

.aiops-heatmap { background: #fff; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.aiops-section-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; color: var(--text, #182431); }
.heatmap-grid { display: flex; gap: 16px; flex-wrap: wrap; }
.heatmap-group { flex: 1; min-width: 140px; }
.heatmap-group-name { font-size: 11px; color: var(--text-sec, #6B7280); margin-bottom: 6px; font-weight: 500; }
.heatmap-cells { display: flex; gap: 4px; }
.heatmap-cell { flex: 1; padding: 6px 4px; border-radius: 6px; text-align: center; font-size: 10px; }
.hm-normal { background: #F6FFED; color: #07C160; }
.hm-warning { background: #FFF7E6; color: #FF7D00; }
.hm-critical { background: #FFF1F0; color: #F5222D; }
.hm-name { display: block; font-weight: 500; margin-bottom: 2px; }
.hm-score { display: block; font-weight: 700; font-size: 12px; }

.aiops-body { margin-bottom: 0; }
.aiops-body :deep(.ant-col) { display: flex; }
.aiops-body :deep(.aiops-card) { flex: 1; display: flex; flex-direction: column; }
.aiops-body :deep(.aiops-card .ant-card-body) { flex: 1; display: flex; flex-direction: column; }
.aiops-card { border-radius: 10px; }
.aiops-card :deep(.ant-card-head) { min-height: 40px; padding: 0 16px; }
.aiops-card :deep(.ant-card-head-title) { font-size: 13px; font-weight: 600; padding: 8px 0; }
.aiops-card :deep(.ant-card-body) { padding: 12px 16px; }

.anomaly-timeline { max-height: 400px; overflow-y: auto; flex: 1; padding-left: 4px; }
.ani-item { display: flex; gap: 12px; padding-bottom: 4px; }
.ani-axis { display: flex; flex-direction: column; align-items: center; width: 12px; flex-shrink: 0; }
.ani-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; z-index: 1; flex-shrink: 0; }
.ani-critical .ani-dot { background: #F5222D; box-shadow: 0 0 0 3px rgba(245,34,45,0.15); }
.ani-warning .ani-dot { background: #FF7D00; box-shadow: 0 0 0 3px rgba(255,125,0,0.15); }
.ani-info .ani-dot { background: #007DFF; box-shadow: 0 0 0 3px rgba(0,125,255,0.15); }
.ani-line { width: 2px; flex: 1; background: var(--border, #E5E5EA); margin-top: 2px; min-height: 20px; }
.ani-item:last-child .ani-line { display: none; }
.ani-body { flex: 1; padding-bottom: 10px; }
.ani-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.ani-time { font-size: 12px; color: var(--text-sec, #6B7280); font-family: monospace; }
.ani-node { font-size: 13px; font-weight: 600; }
.ani-detail { font-size: 11px; color: var(--text-sec, #6B7280); margin-top: 2px; }
.ani-score-bar { height: 3px; background: #f0f0f0; border-radius: 2px; margin-top: 4px; overflow: hidden; }
.ani-score-fill { display: block; height: 100%; border-radius: 2px; transition: width 0.3s; }
.ani-critical .ani-score-fill { background: #F5222D; }
.ani-warning .ani-score-fill { background: #FF7D00; }

.root-cause { font-size: 13px; flex: 1; }
.rc-node, .rc-metric, .rc-score, .rc-path { margin-bottom: 10px; }
.rc-label { display: block; font-size: 11px; color: var(--text-sec, #6B7280); margin-bottom: 2px; }
.rc-value { font-weight: 600; }
.rc-path-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; margin-top: 6px; }
.rc-flow-node { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 11px; background: var(--bg-sec, #F2F2F7); }
.rc-flow-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.rc-flow-node.normal .rc-flow-dot { background: #07C160; }
.rc-flow-node.warning .rc-flow-dot { background: #FF7D00; }
.rc-flow-node.critical .rc-flow-dot { background: #F5222D; }
.rc-flow-name { font-family: monospace; font-size: 11px; }
.rc-flow-arrow { font-size: 10px; color: var(--text-ter, #9CA3AF); margin: 0 2px; }
.rc-desc { margin-top: 10px; padding: 8px; background: var(--bg-sec, #F2F2F7); border-radius: 6px; font-size: 12px; color: var(--text-sec, #6B7280); line-height: 1.5; }

.rec-list { max-height: 400px; overflow-y: auto; flex: 1; }
.rec-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border, #E5E5EA); }
.rec-item:last-child { border-bottom: none; }
.rec-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; background: var(--bg-sec, #F2F2F7); }
.rec-urgent .rec-icon { background: #FFF1F0; color: var(--danger, #F5222D); }
.rec-diagnostic .rec-icon { background: #F0F5FF; color: var(--brand, #007DFF); }
.rec-info { flex: 1; }
.rec-label { font-size: 13px; font-weight: 500; }
.rec-desc { font-size: 11px; color: var(--text-sec, #6B7280); }
.rec-confidence { font-size: 10px; font-weight: 600; font-family: monospace; padding: 2px 6px; border-radius: 10px; flex-shrink: 0; }

.aiops-trend-card { margin-top: 16px; }
.aiops-trend-chart { height: 200px; }
.trend-legend { font-size: 11px; font-weight: 400; color: var(--text-sec, #6B7280); margin-left: 8px; }

@media (max-width: 768px) {
  .aiops-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .heatmap-grid { flex-direction: column; }
}
</style>