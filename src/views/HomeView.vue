<template>
  <div class="home-view">
    <div class="home-tabs">
      <button class="home-tab-btn" :class="{ active: homeTab === 'aiops' }" @click="switchTab('aiops')">
 AI运维
      </button>
      <button class="home-tab-btn" :class="{ active: homeTab === 'home' }" @click="switchTab('home')">
 概览
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
                <template v-if="column.key === 'node'">
                  <span class="smart-node-link">{{ record.nodeLabel }}</span>
                </template>
                <template v-else-if="column.key === 'level'">
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
    <a-skeleton v-if="aiopsLoading" active :paragraph="{ rows: 6 }" style="padding: 24px" />
    <template v-else>
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

      <div class="aiops-active-faults" v-if="aiopsActiveFaults.length">
        <div class="aiops-fault-card">
          <div class="aiops-section-title">
            <span class="title-text"><i class="fa-solid fa-circle-exclamation" style="color:#F5222D"></i> 当前活动故障</span>
            <router-link to="/ops/incidents" class="title-link">前往故障中心 <i class="fa-solid fa-arrow-right"></i></router-link>
          </div>
          <div class="active-fault-list">
            <div v-for="fault in aiopsActiveFaults" :key="fault.id" class="active-fault-item" @click="router.push('/ops/incident/' + fault.id)">
              <span class="af-severity" :class="'sev-' + fault.severity">{{ fault.severity }}</span>
              <span class="af-title">{{ fault.title }}</span>
              <span class="af-app">{{ fault.appName }}</span>
              <a-tag :color="fault.status === 'healing' ? 'processing' : 'warning'">{{ fault.status === 'healing' ? '自愈中' : '排查中' }}</a-tag>
              <span class="af-actions">
                <a-button size="small" class="af-btn" @click.stop="router.push('/ops/incident/' + fault.id)">分析</a-button>
                <a-button size="small" class="af-btn" @click.stop="router.push('/ops/incident/' + fault.id + '?tab=postmortem')">复盘</a-button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="aiops-heatmap" v-if="aiopsApps.length">
        <div class="aiops-section-title">
          <span class="title-text"><i class="fa-solid fa-heart-pulse"></i> 需关注的应用 / 云服务</span>
          <span class="title-badges">
            <span class="ab-badge ab-critical">严重 {{ abnormalAppCounts.critical }}</span>
            <span class="ab-badge ab-warning">警告 {{ abnormalAppCounts.warning }}</span>
          </span>
          <a-radio-group v-model:value="appFilter" size="small" button-style="solid" class="title-toggle">
            <a-radio-button value="abnormal">仅异常</a-radio-button>
            <a-radio-button value="all">全部</a-radio-button>
          </a-radio-group>
        </div>
        <div class="app-grid">
          <div v-for="app in visibleApps" :key="app.name" class="app-card" :class="'app-' + app.status" @click="openAppDrawer(app)">
            <div class="app-card-head">
              <div class="app-card-head-left">
                <span class="app-card-name">{{ app.name }}</span>
                <span v-if="isRootApp(app)" class="app-root-badge"><i class="fa-solid fa-circle-exclamation"></i> 根因</span>
              </div>
              <span class="app-card-type">{{ app.type }}</span>
            </div>
            <div class="app-card-main">
              <span class="app-card-score">{{ app.score }}</span>
              <span class="app-card-status">
                {{ { critical: '严重异常', warning: '需要关注', normal: '运行正常' }[app.status] }}
              </span>
            </div>
            <div class="app-card-faults" v-if="getAppFaultLabels(app).length">
              <span v-for="f in getAppFaultLabels(app)" :key="f.nodeId" class="app-fault-chip">{{ f.nodeLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="aiops-smart" v-if="aiopsAnomalies.length || aiopsPredictions.length || aiopsRemediationRecords.length">
        <div class="aiops-section-title"><i class="fa-solid fa-microchip"></i> 智能诊断与自动修复</div>
        <div class="smart-grid">
          <div class="smart-left">
            <div class="smart-card-head">
              <span class="smart-title">当前异常</span>
              <a-radio-group v-model:value="anomalyFilter" size="small" button-style="solid">
                <a-radio-button value="all">全部 {{ aiopsAnomalies.length }}</a-radio-button>
                <a-radio-button value="critical">严重 {{ anomalyCountByLevel.critical }}</a-radio-button>
                <a-radio-button value="warning">警告 {{ anomalyCountByLevel.warning }}</a-radio-button>
              </a-radio-group>
            </div>
            <a-table
              class="smart-table"
              :data-source="filteredAnomalies"
              :columns="anomalyColumns"
              :pagination="false"
              size="small"
              row-key="id"
              :scroll="{ y: 360 }"
              :custom-row="record => ({ onClick: () => openAppFromNode(record.nodeId) })"
              :row-class-name="() => 'smart-table-row'"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'node'">
                  <span class="smart-node-link">{{ record.nodeLabel }}</span>
                </template>
                <template v-else-if="column.key === 'level'">
                  <span class="smart-level-tag" :class="'lv-' + record.level">
                    {{ { critical: '严重', warning: '警告', info: '提示' }[record.level] }}
                  </span>
                </template>
                <template v-else-if="column.key === 'score'">
                  <div class="smart-score">
                    <div class="smart-score-bar">
                      <i :style="{ width: Math.round(record.score * 100) + '%' }" :class="'bar-' + record.level"></i>
                    </div>
                    <span class="smart-score-num">{{ Math.round(record.score * 100) }}</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'value'">
                  <span class="smart-value" :class="'lv-' + record.level">{{ record.currentValue }}{{ record.metric.includes('率') || record.metric.includes('比') ? '%' : '' }}</span>
                </template>
                <template v-else-if="column.key === 'time'">
                  <span class="smart-time">{{ (record.time || '').slice(11) }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div class="smart-right">
            <div class="smart-panel">
              <div class="smart-card-head"><span class="smart-title"><i class="fa-solid fa-clock-rotate-left" style="color: #FF7D00"></i> 未来30分钟预测</span></div>
              <div class="smart-pred-list">
                <div v-for="(p, i) in sortedPredictions" :key="i" class="smart-pred-item" @click="openAppFromNode(p.nodeId)">
                  <span class="smart-pred-node">{{ p.nodeLabel }}</span>
                  <div class="smart-pred-metric">{{ p.metric }} → <b>{{ p.predicted }}%</b></div>
                  <div class="smart-pred-bar"><i :style="{ width: p.predicted + '%' }" :class="'bar-' + p.level"></i></div>
                  <div class="smart-pred-meta">
                    <span class="smart-pred-eta"><i class="fa-solid fa-hourglass-half"></i> {{ p.eta }}</span>
                    <span class="smart-pred-conf">{{ Math.round(p.confidence * 100) }}% 置信度</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="smart-remed-row" v-if="aiopsRemediationRecords.length">
          <div class="smart-card-head"><span class="smart-title"><i class="fa-solid fa-rotate-right" style="color: #007DFF"></i> 自动修复记录</span></div>
          <div class="smart-remed-list">
            <div v-for="(r, i) in aiopsRemediationRecords" :key="i" class="smart-remed-item" @click="openAppFromNode(r.nodeId)">
              <span class="smart-remed-result" :class="'res-' + r.result">
                <i class="fa-solid" :class="r.result === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
              </span>
              <div class="smart-remed-body">
                <div class="smart-remed-line1">
                  <span class="smart-remed-node">{{ r.nodeLabel }}</span>
                  <span class="smart-remed-action">{{ r.action }}</span>
                  <span class="smart-remed-time">{{ r.time }}</span>
                </div>
                <div class="smart-remed-line2">{{ r.detail }}</div>
              </div>
              <span class="smart-item-arrow"><i class="fa-solid fa-angle-right"></i></span>
            </div>
          </div>
        </div>
      </div>
    </template>
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

    <div class="detail-panel app-drawer" :class="{ open: appDrawerOpen }">
      <div class="detail-mask" @click="closeAppDrawer"></div>
      <div class="detail-panel-content app-drawer-content">
        <div class="detail-header">
          <h3><i class="fa-solid fa-heart-pulse" style="color:#007DFF;margin-right:6px"></i> {{ activeApp?.name || '' }} — 故障详情</h3>
          <a-button type="text" class="close-btn" @click="closeAppDrawer">
            <i class="fa-solid fa-xmark"></i>
          </a-button>
        </div>

        <div class="app-drawer-body">
          <div class="app-drawer-tabs">
            <button class="app-drawer-tab" :class="{ active: appDrawerTab === 'fault-detail' }" @click="appDrawerTab = 'fault-detail'">
              <i class="fa-solid fa-magnifying-glass-chart"></i> 故障详情
            </button>
            <button class="app-drawer-tab" :class="{ active: appDrawerTab === 'fault-list' }" @click="appDrawerTab = 'fault-list'">
              <i class="fa-solid fa-list"></i> 故障列表
              <span v-if="appIncidents.length" class="app-drawer-tab-badge">{{ appIncidents.length }}</span>
            </button>
          </div>

          <template v-if="appDrawerTab === 'fault-detail'">
          <div class="app-summary" v-if="activeApp" :class="'app-' + activeApp.status">
            <div class="app-summary-score-block">
              <span class="app-summary-score">{{ activeApp.score }}</span>
              <span class="app-summary-status-pill">{{ { critical: '严重异常', warning: '需要关注', normal: '运行正常' }[activeApp.status] }}</span>
            </div>
            <div class="app-summary-meta-grid">
              <div class="app-meta-chip">
                <span class="am-chip-icon"><i class="fa-solid fa-bug" style="color:#722ED1"></i></span>
                <div class="am-chip-body">
                  <span class="am-label">根因</span>
                  <span class="am-value" v-if="activeAppIsRoot">{{ aiopsRootCause.metric }}</span>
                  <span class="am-value" v-else>非根因</span>
                </div>
              </div>
              <div class="app-meta-chip">
                <span class="am-chip-icon"><i class="fa-solid fa-triangle-exclamation" :style="{ color: activeAppAnomalies.length ? '#F5222D' : '#6B7280' }"></i></span>
                <div class="am-chip-body">
                  <span class="am-label">异常数</span>
                  <span class="am-value" :class="{ 'am-danger': activeAppAnomalies.length }">{{ activeAppAnomalies.length }} 条</span>
                </div>
              </div>
              <div class="app-meta-chip" v-if="activeAppSevereAnomaly">
                <span class="am-chip-icon"><i class="fa-solid fa-gauge-high" style="color:#FF7D00"></i></span>
                <div class="am-chip-body">
                  <span class="am-label">严重指标</span>
                  <span class="am-value">{{ activeAppSevereAnomaly.metric }} {{ activeAppSevereAnomaly.currentValue }}{{ activeAppSevereAnomaly.metric.includes('率') || activeAppSevereAnomaly.metric.includes('比') ? '%' : '' }}</span>
                </div>
              </div>
              <div class="app-meta-chip" v-if="activeAppDuration">
                <span class="am-chip-icon"><i class="fa-solid fa-clock" style="color:#007DFF"></i></span>
                <div class="am-chip-body">
                  <span class="am-label">影响时长</span>
                  <span class="am-value">{{ activeAppDuration }}</span>
                </div>
              </div>
              <div class="app-meta-chip" v-if="activeApp?.affectedUsers">
                <span class="am-chip-icon"><i class="fa-solid fa-users" style="color:#FF7D00"></i></span>
                <div class="am-chip-body">
                  <span class="am-label">受影响用户</span>
                  <span class="am-value">{{ activeApp.affectedUsers.toLocaleString() }} 人</span>
                </div>
              </div>
            </div>
            <div class="app-summary-foot">
              <div class="app-summary-trend" v-if="activeAppTrend">
                <svg class="kpi-sparkline" width="76" height="26" viewBox="0 0 76 26">
                  <path :d="activeAppTrend.path" fill="none" :stroke="activeApp.status === 'critical' ? '#F5222D' : activeApp.status === 'warning' ? '#FF7D00' : '#07C160'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="app-summary-trend-text" :class="activeAppTrend.diff < 0 ? 'trend-down' : 'trend-up'">
                  {{ activeAppTrend.diff < 0 ? '↓' : '↑' }} {{ Math.abs(activeAppTrend.diff) }} / 采样点
                </span>
              </div>
              <div class="app-summary-badges">
                <span class="ab-badge ab-critical" v-if="activeAppFaultCounts.critical">严重 {{ activeAppFaultCounts.critical }}</span>
                <span class="ab-badge ab-warning" v-if="activeAppFaultCounts.warning">警告 {{ activeAppFaultCounts.warning }}</span>
                <span class="ab-badge ab-normal" v-if="activeAppFaultCounts.normal">正常 {{ activeAppFaultCounts.normal }}</span>
              </div>
            </div>
          </div>
          <div class="app-summary-tip" v-if="activeAppSummaryText">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:#722ED1;margin-right:6px"></i>
            {{ activeAppSummaryText }}
          </div>

          <template v-if="activeAppFaultNodes.length">
            <a-tabs v-model:activeKey="activeFaultNode" class="fault-tabs" size="small" animated>
              <a-tab-pane v-for="node in activeAppFaultNodes" :key="node.nodeId">
                <template #tab>
                  <span class="fault-tab-label" :class="{ 'is-root': aiopsRootCause?.nodeId === node.nodeId }">
                    {{ node.nodeLabel }}
                    <span v-if="aiopsRootCause?.nodeId === node.nodeId" class="root-badge">根因</span>
                  </span>
                </template>
              </a-tab-pane>
            </a-tabs>

            <div class="golden-signals" v-if="faultGoldenSignals.length">
              <div class="gs-grid">
                <div v-for="sig in faultGoldenSignals" :key="sig.key" class="gs-card" :class="'gs-' + sig.status">
                  <div class="gs-body">
                    <div class="gs-left">
                      <div class="gs-label"><i :class="sig.icon"></i> {{ sig.label }}</div>
                      <div class="gs-value">{{ sig.value }}<span class="gs-unit">{{ sig.unit }}</span></div>
                    </div>
                    <div class="gs-info">
                      <div class="gs-baseline">基线 {{ sig.baseline }}{{ sig.unit }}</div>
                      <div class="gs-deviation" :class="sig.deviation > 100 ? 'gs-danger' : 'gs-warn'">+{{ sig.deviation }}%</div>
                      <svg class="gs-sparkline" width="80" height="24" viewBox="0 0 80 24">
                        <rect v-for="(bar, i) in calcSparkbarRects(sig.history, 24, 80)" :key="i" :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" fill="currentColor" rx="1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <a-row :gutter="[16, 16]" class="aiops-body drawer-3col">
              <a-col :xs="24" :md="12" :lg="8">
                <div class="anomaly-timeline">
                  <div class="app-sub-title"><i class="fa-solid fa-bolt" style="color:#F5222D;margin-right:6px"></i> 异常时间线</div>
                  <a-empty v-if="!faultAnomalies.length" description="当前无异常" style="margin:16px 0" />
                  <div v-for="a in faultAnomalies" :key="a.id" class="ani-item" :class="'ani-' + a.level">
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
              </a-col>

              <a-col :xs="24" :md="12" :lg="8">
                <div class="root-cause" v-if="faultNodeAnalysis">
                  <div class="app-sub-title"><i class="fa-solid fa-magnifying-glass-chart" style="color:#722ED1;margin-right:6px"></i> {{ faultNodeAnalysis.isRoot ? '根因分析' : '节点分析' }}</div>
                  <div class="rc-node">
                    <span class="rc-label">{{ faultNodeAnalysis.isRoot ? '根因节点' : '故障节点' }}</span>
                    <span class="rc-value">{{ faultNodeAnalysis.nodeLabel }}</span>
                  </div>
                  <div class="rc-metric">
                    <span class="rc-label">异常指标</span>
                    <span class="rc-value">{{ faultNodeAnalysis.metric }} = {{ faultNodeAnalysis.currentValue }}</span>
                  </div>
                  <div class="rc-score">
                    <span class="rc-label">异常得分</span>
                    <a-progress :percent="Math.round(faultNodeAnalysis.score * 100)" :stroke-color="faultNodeAnalysis.isRoot ? '#F5222D' : '#FF7D00'" size="small" />
                  </div>
                  <div class="rc-path" v-if="faultNodeAnalysis.path.length">
                    <span class="rc-label">传播路径</span>
                    <div class="rc-path-flow">
                      <div v-for="(n, i) in faultNodeAnalysis.path" :key="n" class="rc-flow-node" :class="getNodeStatus(n)">
                        <span class="rc-flow-dot"></span>
                        <span class="rc-flow-name">{{ getNodeLabel(n) }}</span>
                        <i v-if="i < faultNodeAnalysis.path.length - 1" class="fa-solid fa-chevron-right rc-flow-arrow"></i>
                      </div>
                    </div>
                  </div>
                  <div class="rc-desc">{{ faultNodeAnalysis.detail }}</div>
                  <div class="rc-evidence" v-if="faultNodeAnalysis.evidence">
                    <div class="rc-evidence-toggle" @click="evidenceOpen = !evidenceOpen">
                      <i class="fa-solid" :class="evidenceOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                      {{ evidenceOpen ? '收起证据详情' : '查看证据详情' }}
                    </div>
                    <div class="rc-evidence-body" v-if="evidenceOpen">
                      <div class="ev-item"><span class="ev-label">Z-Score</span><span class="ev-value">{{ faultNodeAnalysis.evidence.zScore }}</span><span class="ev-note">> 2.0 异常</span></div>
                      <div class="ev-item"><span class="ev-label">EWMA 斜率</span><span class="ev-value">{{ faultNodeAnalysis.evidence.ewmaSlope }}/min</span><span class="ev-note">{{ faultNodeAnalysis.evidence.ewmaSlope > 0 ? '正向趋势' : '负向趋势' }}</span></div>
                      <div class="ev-item"><span class="ev-label">偏离度</span><span class="ev-value">{{ faultNodeAnalysis.evidence.deviation }}%</span><span class="ev-note">远超基线</span></div>
                      <div class="ev-item"><span class="ev-label">历史相似</span><span class="ev-value">{{ Math.round(faultNodeAnalysis.evidence.historicalSimilarity * 100) }}%</span><span class="ev-note">7天前类似故障</span></div>
                      <div class="ev-item"><span class="ev-label">置信度</span><span class="ev-value">{{ faultNodeAnalysis.evidence.confidence }}</span><span class="ev-note">依据量化分析</span></div>
                    </div>
                  </div>
                </div>
              </a-col>

              <a-col :xs="24" :md="24" :lg="8">
                <div class="rec-list">
                  <div class="app-sub-title"><i class="fa-solid fa-lightbulb" style="color:#FF7D00;margin-right:6px"></i> AI推荐操作</div>
                  <a-empty v-if="!faultRecommendations.length" description="暂无推荐操作" style="margin:16px 0" />
                  <div v-for="(rec, i) in faultRecommendations" :key="rec.id" class="rec-item" :class="'rec-' + rec.priority">
                    <div class="rec-icon"><i :class="rec.icon"></i></div>
                    <div class="rec-info">
                      <div class="rec-label">{{ rec.label }}</div>
                      <div class="rec-desc">{{ rec.desc }}</div>
                    </div>
                    <span class="rec-confidence">{{ rec.confidence }}%</span>
                    <a-button size="small" type="primary" :ghost="i >= 4" @click="executeRec(rec)">执行</a-button>
                  </div>
                </div>
              </a-col>
            </a-row>
          </template>

          <a-empty v-else description="该应用/云服务当前无故障节点" style="margin:40px 0" />
          <div class="app-drawer-footer">
            <a-button type="primary" block @click="goToIncidentCenter" :disabled="!appIncidents.length">
              <i class="fa-solid fa-magnifying-glass-chart"></i> 进入故障中心分析
            </a-button>
          </div>
          </template>

          <template v-if="appDrawerTab === 'fault-list'">
            <div class="fault-list-tab">
              <div class="fault-list-header">
                <span class="fault-list-title"><i class="fa-solid fa-triangle-exclamation" style="color:#FF7D00;margin-right:6px"></i> 关联故障记录</span>
                <span class="fault-list-count">共 {{ appIncidents.length }} 条</span>
              </div>
              <a-empty v-if="!appIncidents.length" description="该应用暂无故障记录" style="margin:40px 0" />
              <div v-else class="fault-list-items">
                <div v-for="inc in appIncidents" :key="inc.id" class="fault-list-item" :class="'fli-' + inc.status" @click="router.push('/ops/incident/' + inc.id)">
                  <div class="fli-head">
                    <span class="fli-severity" :class="'sev-' + inc.severity">{{ inc.severity }}</span>
                    <span class="fli-id">{{ inc.id }}</span>
                    <a-tag :color="getIncidentStatusTag(inc.status).color" size="small" class="fli-status-tag">{{ getIncidentStatusTag(inc.status).text }}</a-tag>
                  </div>
                  <div class="fli-title">{{ inc.title }}</div>
                  <div class="fli-meta">
                    <span><i class="fa-solid fa-clock"></i> {{ inc.duration }}</span>
                    <span><i class="fa-solid fa-chart-line"></i> P99: {{ inc.metrics.p99.current }}ms</span>
                    <span><i class="fa-solid fa-bolt"></i> 失败率: {{ inc.metrics.failureRate.current }}%</span>
                  </div>
                </div>
              </div>
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
const aiopsLoading = ref(true)
const aiopsKpiCards = ref([])
const aiopsServiceHealth = ref([])
const aiopsApps = ref([])
const activeApp = ref(null)
const appDrawerOpen = ref(false)
const appDrawerTab = ref('fault-detail')
const appFilter = ref('abnormal')
const allIncidents = ref([])

const aiopsActiveFaults = computed(() => {
  return allIncidents.value.filter(i => i.status === 'healing' || i.status === 'investigating')
})

const visibleApps = computed(() => {
  if (appFilter.value === 'all') return aiopsApps.value
  return aiopsApps.value.filter(a => a.status !== 'normal')
})
function isRootApp(app) {
  return !!(aiopsRootCause.value && app.nodes && app.nodes.includes(aiopsRootCause.value.nodeId))
}
const abnormalAppCounts = computed(() => {
  const c = { critical: 0, warning: 0 }
  aiopsApps.value.forEach(a => { if (c[a.status] != null) c[a.status]++ })
  return c
})
const aiopsAnomalies = ref([])
const aiopsRootCause = ref(null)
const aiopsPropagationPath = ref([])
const aiopsRecommendations = ref([])
const aiopsGoldenSignals = ref([])
const aiopsGoldenSignalsByNode = ref({})
const activeFaultNode = ref('')
const evidenceOpen = ref(false)
const aiopsPredictions = ref([])
const aiopsRemediationRecords = ref([])
const anomalyFilter = ref('all')

const anomalyColumns = [
  { title: '异常指标', dataIndex: 'metric', key: 'metric', width: 90 },
  { title: '节点', dataIndex: 'nodeLabel', key: 'node', width: 110, ellipsis: true },
  { title: '级别', key: 'level', width: 68 },
  { title: '当前值', key: 'value', width: 74 },
  { title: '得分', key: 'score', width: 110 },
  { title: '时间', key: 'time', width: 78 },
]

const sortedPredictions = computed(() =>
  [...aiopsPredictions.value].sort((a, b) => (b.time || '').localeCompare(a.time || ''))
)

const filteredAnomalies = computed(() => {
  if (anomalyFilter.value === 'all') return aiopsAnomalies.value
  return aiopsAnomalies.value.filter(a => a.level === anomalyFilter.value)
})
const anomalyCountByLevel = computed(() => {
  const c = { critical: 0, warning: 0 }
  aiopsAnomalies.value.forEach(a => { if (c[a.level] != null) c[a.level]++ })
  return c
})
function openAppFromNode(nodeId) {
  const app = aiopsApps.value.find(a => (a.nodes || []).includes(nodeId))
  if (app) {
    activeApp.value = app
    activeFaultNode.value = (app.nodes || []).includes(nodeId) ? nodeId : (app.nodes || [])[0] || ''
    appDrawerOpen.value = true
  }
}

const faultNodes = computed(() => {
  const nodes = new Map()
  aiopsAnomalies.value.forEach(a => {
    if (!nodes.has(a.nodeId)) nodes.set(a.nodeId, { nodeId: a.nodeId, nodeLabel: a.nodeLabel, maxScore: a.score })
    else nodes.get(a.nodeId).maxScore = Math.max(nodes.get(a.nodeId).maxScore, a.score)
  })
  const root = aiopsRootCause.value
  const arr = [...nodes.values()].sort((a, b) => b.maxScore - a.maxScore)
  if (root) {
    const idx = arr.findIndex(n => n.nodeId === root.nodeId)
    if (idx > 0) { arr.splice(idx, 1); arr.unshift({ nodeId: root.nodeId, nodeLabel: root.nodeLabel, maxScore: root.score }) }
  }
  return arr
})

const activeAppFaultNodes = computed(() => {
  if (!activeApp.value?.nodes?.length) return []
  return faultNodes.value.filter(n => activeApp.value.nodes.includes(n.nodeId))
})

const activeAppAnomalies = computed(() => {
  const ids = new Set(activeAppFaultNodes.value.map(n => n.nodeId))
  return aiopsAnomalies.value.filter(a => ids.has(a.nodeId))
})
const activeAppIsRoot = computed(() => {
  const ids = new Set(activeAppFaultNodes.value.map(n => n.nodeId))
  return aiopsRootCause.value && ids.has(aiopsRootCause.value.nodeId)
})
const activeAppFaultCounts = computed(() => {
  const c = { critical: 0, warning: 0, normal: 0 }
  activeAppAnomalies.value.forEach(a => { if (c[a.level] != null) c[a.level]++ })
  return c
})
const activeAppSevereAnomaly = computed(() => {
  return activeAppAnomalies.value.reduce((max, a) => a.score > max.score ? a : max, activeAppAnomalies.value[0] || null)
})
const activeAppDuration = computed(() => {
  const times = activeAppAnomalies.value.map(a => a.time).filter(Boolean).sort()
  if (!times.length) return null
  const start = new Date(times[0].replace(' ', 'T')).getTime()
  const now = Date.now()
  const mins = Math.max(1, Math.round((now - start) / 60000))
  if (mins >= 60) return `${Math.floor(mins / 60)}小时${mins % 60}分`
  return `${mins}分钟`
})
const activeAppTrend = computed(() => {
  const h = activeApp.value?.history || []
  if (h.length < 2) return null
  const prev = h[h.length - 2]
  const cur = h[h.length - 1]
  const diff = cur - prev
  return { diff, path: calcSparklinePath(h) }
})
const activeAppSummaryText = computed(() => {
  if (!activeAppIsRoot.value) return null
  const root = aiopsRootCause.value
  const rec = faultRecommendations.value[0]
  let text = `${root.nodeLabel} ${root.metric} ${root.currentValue}，偏离基线 ${root.evidence?.deviation}%`
  if (rec) text += `，建议：${rec.label}`
  return text
})

const faultGoldenSignals = computed(() => aiopsGoldenSignalsByNode.value[activeFaultNode.value] || [])
const faultAnomalies = computed(() => aiopsAnomalies.value.filter(a => a.nodeId === activeFaultNode.value))
const faultRecommendations = computed(() => aiopsRecommendations.value.filter(r => !r.targetNode || r.targetNode === activeFaultNode.value))

const faultNodeAnalysis = computed(() => {
  if (!activeFaultNode.value) return null
  const isRoot = aiopsRootCause.value && aiopsRootCause.value.nodeId === activeFaultNode.value
  const topAnomaly = faultAnomalies.value.reduce((max, a) => a.score > max.score ? a : max, faultAnomalies.value[0] || null)
  const nodeLabel = faultNodes.value.find(n => n.nodeId === activeFaultNode.value)?.nodeLabel || activeFaultNode.value
  if (isRoot) {
    return { isRoot, nodeLabel, metric: aiopsRootCause.value.metric, currentValue: aiopsRootCause.value.currentValue, score: aiopsRootCause.value.score, detail: aiopsRootCause.value.detail, evidence: aiopsRootCause.value.evidence, path: aiopsPropagationPath.value, topAnomaly }
  }
  if (!topAnomaly) return null
  return { isRoot: false, nodeLabel, metric: topAnomaly.metric, currentValue: topAnomaly.currentValue, score: topAnomaly.score, detail: topAnomaly.detail, evidence: topAnomaly.evidence, path: [], topAnomaly }
})

function getAppFaultLabels(app) {
  const nodes = app?.nodes || []
  const rootId = aiopsRootCause.value?.nodeId
  if (rootId && nodes.includes(rootId)) {
    const f = faultNodes.value.find(n => n.nodeId === rootId)
    return [{ nodeId: rootId, nodeLabel: f?.nodeLabel || rootId }]
  }
  return []
}
function openAppDrawer(app) {
  activeApp.value = app
  appDrawerTab.value = 'fault-detail'
  const nodes = (app.nodes || [])
  if (nodes.length) {
    const root = faultNodes.value.find(n => n.nodeId === aiopsRootCause.value?.nodeId)
    activeFaultNode.value = (root && nodes.includes(root.nodeId)) ? root.nodeId : nodes[0]
  } else {
    activeFaultNode.value = ''
  }
  appDrawerOpen.value = true
}

const appIncidents = computed(() => {
  if (!activeApp.value) return []
  return allIncidents.value.filter(i => i.appName === activeApp.value.name)
})

function getIncidentStatusTag(status) {
  return { healing: { color: 'processing', text: '自愈中' }, resolved: { color: 'success', text: '已恢复' }, investigating: { color: 'warning', text: '排查中' } }[status] || { color: 'default', text: status }
}
function closeAppDrawer() {
  appDrawerOpen.value = false
}

function goToIncidentCenter() {
  const inc = appIncidents.value[0]
  if (inc) {
    appDrawerOpen.value = false
    router.push('/ops/incident/' + inc.id)
  }
}

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

const win = window
win.__openDrawerFromIncident = () => {
  if (activeApp.value) {
    appDrawerOpen.value = true
    appDrawerTab.value = 'fault-list'
  }
}

async function fetchAiopsData() {
  try {
    aiopsLoading.value = true
    const [anomalyRes, healthRes, predRes, remedRes, topoRes, recRes, goldenRes, incidentsRes] = await Promise.all([
      fetch('/api/intelligent/anomalies').then(r => r.json()),
      fetch('/api/intelligent/health').then(r => r.json()),
      fetch('/api/intelligent/predictions').then(r => r.json()),
      fetch('/api/intelligent/remediation').then(r => r.json()),
      fetch('/api/mock/topology').then(r => r.json()),
      fetch('/api/intelligent/recommendations').then(r => r.json()),
      fetch('/api/intelligent/golden-signals').then(r => r.json()),
      fetch('/api/sre/incidents').then(r => r.json()),
    ])
    const anomalies = anomalyRes.data || []
    const summary = anomalyRes.summary || {}
    const health = healthRes.data || {}
    const pred = predRes.data || {}
    const remed = remedRes.data || {}
    const topo = topoRes.data || {}
    const recData = recRes.data || []
    const goldenData = goldenRes.data || {}

    if (goldenData.nodes) {
      const byNode = {}
      goldenData.nodes.forEach(n => { byNode[n.nodeId] = n.signals })
      aiopsGoldenSignalsByNode.value = byNode
    } else {
      aiopsGoldenSignals.value = goldenData.signals || []
    }

    aiopsTopoNodes.value = topo.nodes || []
    const kpiHistory = health.kpiHistory || {}
    aiopsKpiCards.value = [
      { key: 'anomalyCount', label: '异常检测', value: summary.total || 0, icon: 'fa-solid fa-triangle-exclamation', iconBg: '#FFF1F0', iconColor: '#F5222D', valClass: 'kpi-danger', trendText: '较昨日 +60%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.anomalyCount || []) },
      { key: 'healthScore', label: '健康度', value: (health.score || 0), icon: 'fa-solid fa-heart-pulse', iconBg: '#F6FFED', iconColor: '#07C160', valClass: health.score < 90 ? 'kpi-warn' : 'kpi-ok', trendText: '较昨日 -5.4%', trendDir: 'down', sparklinePath: calcSparklinePath(kpiHistory.healthScore || []) },
      { key: 'predictedAlerts', label: '预测告警', value: pred.items?.length || 0, icon: 'fa-solid fa-clock-rotate-left', iconBg: '#FFF7E6', iconColor: '#FF7D00', valClass: 'kpi-warn', trendText: '较昨日 +50%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.predictedAlerts || []) },
      { key: 'autoRemediationRate', label: '自动修复率', value: (remed.rate || 0) + '%', icon: 'fa-solid fa-rotate-right', iconBg: '#F0F5FF', iconColor: '#007DFF', valClass: 'kpi-ok', trendText: '较昨日 +8.2%', trendDir: 'up', sparklinePath: calcSparklinePath(kpiHistory.autoRemediationRate || []) },
      { key: 'affectedUsers', label: '受影响用户', value: (health.businessImpact?.affectedUsers || 0).toLocaleString(), icon: 'fa-solid fa-users', iconBg: '#FFF7E6', iconColor: '#FF7D00', valClass: 'kpi-warn', trendText: '', trendDir: '', sparklinePath: '' },
    ]

    aiopsApps.value = health.apps || []
    aiopsServiceHealth.value = health.services || []
    aiopsAnomalies.value = anomalies
    aiopsPredictions.value = pred.items || []
    aiopsRemediationRecords.value = remed.records || []
    allIncidents.value = incidentsRes.data || []

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

    if (!activeFaultNode.value && faultNodes.value.length) {
      activeFaultNode.value = faultNodes.value[0].nodeId
    }

  } catch {}
  aiopsLoading.value = false
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
function calcSparkbarRects(values, h = 24, w = 80) {
  const max = Math.max(...values, 1)
  const count = values.length
  const barW = Math.max(2, w / count - 2)
  return values.map((v, i) => {
    const x = i * (w / count) + 1
    const barH = (v / max) * (h - 4)
    const y = h - 2 - barH
    return { x: x.toFixed(1), y: y.toFixed(1), width: barW.toFixed(1), height: Math.max(barH, 1).toFixed(1) }
  })
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
  } else if (tab === 'home') {
    nextTick(() => {
      renderAlertTrendChart()
      renderMainDonutChart()
    })
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
})

const refreshCard = (card) => {
  message.success(`刷新 ${card.title} 数据`)
}
</script>

<style scoped>
.home-view { padding: 16px 24px 16px; min-height: 100%; }
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

@media (max-width: 768px) {
  .detail-panel-content {
    width: 85%;
    right: -85%;
  }
}

@media (max-width: 480px) {
  .detail-panel-content {
    width: 100%;
    right: -100%;
  }
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

.aiops-intent-bar { margin-bottom: 16px; }

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
  background: var(--brand, #007DFF);
  color: #fff; font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
}
.aiops-intent-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,125,255,0.35); }
.aiops-intent-send:disabled { opacity: 0.4; cursor: not-allowed; }
.aiops-suggestions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.suggestion-chip {
  padding: 5px 12px; border-radius: 20px; background: var(--bg-sec, #F2F2F7);
  color: var(--text-sec, #6B7280); font-size: 12px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent; display: flex; align-items: center; gap: 4px;
}
.suggestion-chip:hover { border-color: var(--intelligent, #722ED1); color: var(--intelligent, #722ED1); background: rgba(114,46,209,0.05); }

.aiops-kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 16px; }
.aiops-active-faults { margin-bottom: 16px; }
.aiops-fault-card { background: #fff; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.title-link { font-size: 12px; color: #1890ff; font-weight: 400; margin-left: auto; text-decoration: none; }
.title-link i { font-size: 10px; margin-left: 4px; }
.active-fault-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.active-fault-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fff; border: 1px solid #f0f0f0; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.active-fault-item:hover { border-color: #1890ff; box-shadow: 0 1px 4px rgba(24,144,255,0.1); }
.af-severity { font-size: 11px; font-weight: 700; padding: 1px 5px; border-radius: 3px; color: #fff; flex-shrink: 0; }
.af-severity.sev-P1 { background: #F5222D; }
.af-severity.sev-P2 { background: #FF7D00; }
.af-severity.sev-P3 { background: #FAAD14; }
.af-title { flex: none; font-size: 13px; font-weight: 500; color: #1a1a1a; }
.af-app { font-size: 11px; color: #8c8c8c; background: #f5f5f5; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.af-actions { display: flex; gap: 4px; margin-left: auto; flex-shrink: 0; }
.af-btn { font-size: 11px; height: 24px; padding: 0 8px; flex-shrink: 0; }
.aiops-kpi-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: #fff; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
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
.aiops-section-title { font-size: 13px; font-weight: 600; margin-bottom: 16px; color: var(--text, #182431); display: flex; align-items: center; gap: 10px; }
.title-text { display: inline-flex; align-items: center; gap: 6px; }
.title-badges { display: inline-flex; gap: 6px; }
.ab-badge { font-size: 11px; padding: 1px 8px; border-radius: 8px; font-weight: 500; }
.ab-badge.ab-critical { color: #F5222D; background: #FFF1F0; }
.ab-badge.ab-warning { color: #FF7D00; background: #FFF7E6; }
.title-toggle { margin-left: auto; }
.app-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
.app-card {
  border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px;
  cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 5px;
  background: #fff; position: relative; overflow: hidden;
}
.app-card:hover { border-color: #007DFF; box-shadow: 0 4px 12px rgba(0,125,255,0.12); transform: translateY(-2px); }
.app-card-head { display: flex; justify-content: space-between; align-items: center; }
.app-card-head-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.app-card-name { font-size: 13px; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.app-card-type { font-size: 10px; color: #6B7280; background: #F5F5F5; padding: 1px 6px; border-radius: 8px; flex-shrink: 0; }
.app-root-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: #fff; background: #F5222D; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.app-root-badge i { font-size: 9px; }
.app-card-main { display: flex; align-items: baseline; gap: 8px; }
.app-card-score { font-size: 22px; font-weight: 700; line-height: 1; }
.app-card-status { font-size: 11px; }
.app-card-faults { display: flex; flex-wrap: wrap; gap: 4px; min-height: 0; }
.app-fault-chip { font-size: 10px; color: #F5222D; background: #FFF1F0; padding: 1px 6px; border-radius: 8px; white-space: nowrap; }
.app-normal .app-card-score { color: #07C160; }
.app-normal .app-card-status { color: #07C160; }
.app-warning .app-card-score { color: #FF7D00; }
.app-warning .app-card-status { color: #FF7D00; }
.app-critical .app-card-score { color: #F5222D; }
.app-critical .app-card-status { color: #F5222D; }

.aiops-smart { background: #fff; border-radius: 10px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.smart-grid { display: grid; grid-template-columns: 7fr 3fr; gap: 16px; }
.smart-left, .smart-right { min-width: 0; }
.smart-right { display: flex; flex-direction: column; gap: 12px; }
.smart-remed-row { margin-top: 16px; background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 8px; padding: 12px; }
.smart-remed-row .smart-remed-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.smart-remed-row .smart-card-head { margin-bottom: 10px; }
.smart-panel { background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 8px; padding: 12px; flex: 1; }
.smart-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.smart-title { font-size: 13px; font-weight: 600; color: #1A1A1A; display: inline-flex; align-items: center; gap: 6px; }
.smart-table :deep(.ant-table) { background: #fff; border: 1px solid #F0F0F0; border-radius: 8px; overflow: hidden; }
.smart-table :deep(.ant-table-thead > tr > th) { background: #FAFAFA; font-size: 12px; color: #6B7280; font-weight: 600; padding: 8px 12px; }
.smart-table :deep(.ant-table-tbody > tr > td) { padding: 8px 12px; font-size: 12px; color: #1A1A1A; }
.smart-table :deep(.ant-table-tbody > tr:hover > td) { background: #F0F7FF !important; }
.smart-node-link { color: #007DFF; font-weight: 600; cursor: pointer; transition: color 0.2s; }
.smart-node-link:hover { color: #005EB8; }
.smart-table-row { cursor: pointer; }
.smart-level-tag { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 11px; font-weight: 500; }
.smart-level-tag.lv-critical { color: #F5222D; background: #FFF1F0; }
.smart-level-tag.lv-warning { color: #FF7D00; background: #FFF7E6; }
.smart-level-tag.lv-info { color: #007DFF; background: #F0F5FF; }
.smart-score { display: flex; align-items: center; gap: 6px; }
.smart-score-bar { flex: 1; height: 5px; background: #F0F0F0; border-radius: 3px; overflow: hidden; min-width: 40px; }
.smart-score-bar i { display: block; height: 100%; border-radius: 3px; }
.smart-score-bar .bar-critical { background: #F5222D; }
.smart-score-bar .bar-warning { background: #FF7D00; }
.smart-score-num { font-size: 11px; font-weight: 700; color: #1A1A1A; width: 24px; text-align: right; }
.smart-value { font-weight: 700; }
.smart-value.lv-critical { color: #F5222D; }
.smart-value.lv-warning { color: #FF7D00; }
.smart-value.lv-info { color: #007DFF; }
.smart-time { color: #6B7280; }

.smart-pred-list { display: flex; flex-direction: column; gap: 12px; }
.smart-pred-item { background: #fff; border: 1px solid #F0F0F0; border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.2s; }
.smart-pred-item:hover { border-color: #007DFF; box-shadow: 0 4px 12px rgba(0,125,255,0.12); }
.smart-pred-node { font-size: 12px; font-weight: 600; color: #007DFF; }
.smart-pred-metric { font-size: 12px; color: #6B7280; margin-top: 4px; }
.smart-pred-metric b { color: #FF7D00; }
.smart-pred-bar { height: 5px; background: #F0F0F0; border-radius: 3px; margin-top: 6px; overflow: hidden; }
.smart-pred-bar i { display: block; height: 100%; border-radius: 3px; }
.smart-pred-bar .bar-critical { background: #F5222D; }
.smart-pred-bar .bar-warning { background: #FF7D00; }
.smart-pred-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11px; color: #6B7280; }
.smart-pred-eta i { margin-right: 3px; }

.smart-remed-list { display: flex; flex-direction: column; gap: 8px; }
.smart-remed-item { display: flex; gap: 8px; align-items: flex-start; background: #fff; border: 1px solid #F0F0F0; border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s; }
.smart-remed-item:hover { border-color: #007DFF; box-shadow: 0 4px 12px rgba(0,125,255,0.12); }
.smart-remed-result { font-size: 14px; margin-top: 1px; flex-shrink: 0; }
.smart-remed-result.res-success { color: #07C160; }
.smart-remed-result.res-failed { color: #F5222D; }
.smart-remed-body { flex: 1; min-width: 0; }
.smart-remed-line1 { display: flex; align-items: center; gap: 8px; }
.smart-remed-node { font-size: 12px; font-weight: 600; color: #007DFF; }
.smart-remed-action { font-size: 11px; color: #007DFF; background: #F0F5FF; padding: 1px 6px; border-radius: 8px; }
.smart-remed-time { font-size: 11px; color: #BFBFBF; margin-left: auto; }
.smart-remed-line2 { font-size: 11px; color: #6B7280; margin-top: 3px; }

.app-drawer .detail-panel-content { width: 80%; right: -80%; }
.app-drawer-body { flex: 1; overflow-y: auto; padding: 4px 20px 20px; }
.app-summary {
  display: grid; grid-template-columns: 120px 1fr; gap: 8px 24px; align-items: center;
  padding: 16px 18px;
  background: #fff; border-radius: 10px; margin-bottom: 12px; border: 1px solid #F0F0F0;
  border-left-width: 4px;
}
.app-summary.app-critical { border-left-color: #F5222D; }
.app-summary.app-warning { border-left-color: #FF7D00; }
.app-summary.app-normal { border-left-color: #07C160; }
.app-summary-score-block { display: flex; flex-direction: column; align-items: center; gap: 6px; grid-row: span 2; }
.app-summary-score { font-size: 38px; font-weight: 700; line-height: 1; }
.app-critical .app-summary-score { color: #F5222D; }
.app-warning .app-summary-score { color: #FF7D00; }
.app-normal .app-summary-score { color: #07C160; }
.app-summary-status-pill { font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 10px; }
.app-critical .app-summary-status-pill { color: #F5222D; background: #FFF1F0; }
.app-warning .app-summary-status-pill { color: #FF7D00; background: #FFF7E6; }
.app-normal .app-summary-status-pill { color: #07C160; background: #F6FFED; }
.app-summary-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.app-meta-chip {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 8px; min-width: 0;
}
.am-chip-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; background: #fff; border: 1px solid #F0F0F0; flex-shrink: 0; }
.am-chip-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.am-label { font-size: 11px; color: #6B7280; }
.am-value { font-size: 13px; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.am-danger { color: #F5222D; }
.app-summary-foot { grid-column: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.app-summary-trend { display: flex; align-items: center; gap: 8px; }
.app-summary-trend-text { font-size: 11px; }
.app-summary-trend-text.trend-down { color: #F5222D; }
.app-summary-trend-text.trend-up { color: #07C160; }
.app-summary-badges { display: flex; gap: 6px; }
.ab-badge.ab-normal { color: #07C160; background: #F6FFED; }
.app-summary-tip {
  display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #4B5563; line-height: 1.7;
  background: linear-gradient(90deg, rgba(114,46,209,0.07), rgba(0,125,255,0.05));
  border-left: 3px solid #722ED1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px;
}
.app-summary-tip i { margin-top: 3px; }
.app-sub-title { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px; }
.app-drawer-body .anomaly-timeline,
.app-drawer-body .root-cause,
.app-drawer-body .rec-list { margin-top: 0; }
.drawer-3col .anomaly-timeline,
.drawer-3col .root-cause,
.drawer-3col .rec-list { height: 100%; }
.drawer-3col .rec-list { max-height: 340px; overflow-y: auto; }

.app-drawer-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}
.app-drawer-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.app-drawer-tab:hover { color: #1a1a1a; }
.app-drawer-tab.active {
  color: #007DFF;
  border-bottom-color: #007DFF;
  font-weight: 600;
}
.app-drawer-tab i { font-size: 12px; }
.app-drawer-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #F5222D;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

.fault-list-tab { padding: 0; }
.fault-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.fault-list-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.fault-list-count { font-size: 12px; color: #8c8c8c; }
.fault-list-items { display: flex; flex-direction: column; gap: 8px; }
.app-drawer-footer { padding: 12px 0; }
.fault-list-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.fault-list-item:hover {
  border-color: #007DFF;
  box-shadow: 0 2px 8px rgba(0,125,255,0.1);
}
.fault-list-item.fli-healing { border-left: 3px solid #722ED1; }
.fault-list-item.fli-resolved { border-left: 3px solid #52c41a; }
.fault-list-item.fli-investigating { border-left: 3px solid #FF7D00; }
.fli-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.fli-severity {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
}
.sev-P1 { background: #F5222D; }
.sev-P2 { background: #FF7D00; }
.fli-id { font-size: 11px; color: #8c8c8c; font-family: monospace; }
.fli-status-tag { margin-left: auto; }
.fli-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.fli-meta {
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: #8c8c8c;
}
.fli-meta i { margin-right: 3px; }

.aiops-fault-card { border: 1px solid #E8E8E8; }
.aiops-fault-card :deep(.ant-card-head) { border-bottom: 1px solid #F0F0F0; margin-bottom: 0; }
.aiops-fault-card .golden-signals { margin-bottom: 16px; }
.aiops-fault-card .gs-grid { gap: 16px; }
.aiops-fault-card .aiops-body { margin-top: 0; }

.fault-tabs { margin-bottom: 16px; }
.fault-tabs :deep(.ant-tabs-nav) { margin-bottom: 12px; }
.fault-tabs :deep(.ant-tabs-tab) { padding: 6px 12px; font-size: 13px; }
.fault-tab-label { display: inline-flex; align-items: center; gap: 6px; }
.root-badge { font-size: 10px; background: #F5222D; color: #fff; padding: 1px 6px; border-radius: 8px; font-weight: 500; }

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
.rc-evidence { margin-top: 10px; }
.rc-evidence-toggle { font-size: 12px; color: var(--intelligent, #722ED1); cursor: pointer; padding: 4px 0; display: flex; align-items: center; gap: 4px; }
.rc-evidence-toggle:hover { opacity: 0.8; }
.rc-evidence-body { margin-top: 6px; padding: 8px; background: var(--bg-sec, #F2F2F7); border-radius: 6px; }
.ev-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; }
.ev-label { color: var(--text-sec, #6B7280); min-width: 70px; }
.ev-value { font-weight: 600; min-width: 50px; }
.ev-note { font-size: 10px; color: var(--text-ter, #9CA3AF); }

.rec-list { max-height: 400px; overflow-y: auto; flex: 1; }
.rec-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border, #E5E5EA); }
.rec-item:last-child { border-bottom: none; }
.rec-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; background: var(--bg-sec, #F2F2F7); }
.rec-urgent .rec-icon { background: #FFF1F0; color: var(--danger, #F5222D); }
.rec-diagnostic .rec-icon { background: #F0F5FF; color: var(--brand, #007DFF); }
.rec-info { flex: 1; }
.rec-label { font-size: 13px; font-weight: 500; }
.rec-desc { font-size: 11px; color: var(--text-sec, #6B7280); }
.rec-confidence { font-size: 12px; font-weight: 600; font-family: monospace; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; background: var(--bg-sec, #F2F2F7); color: var(--text-sec, #6B7280); }

.gs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.gs-card { padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #E8E8E8; }
.gs-body { display: flex; justify-content: space-between; align-items: center; }
.gs-left { display: flex; flex-direction: column; }
.gs-label { font-size: 12px; color: var(--text-sec, #6B7280); margin-bottom: 4px; }
.gs-label i { margin-right: 4px; color: var(--brand); }
.gs-value { font-size: 26px; font-weight: 700; white-space: nowrap; line-height: 1; }
.gs-unit { font-size: 12px; font-weight: 400; color: var(--text-sec, #6B7280); margin-left: 2px; }
.gs-info { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
.gs-baseline { font-size: 11px; color: var(--text-ter, #9CA3AF); }
.gs-deviation { font-size: 12px; font-weight: 600; }
.gs-danger { color: #F5222D; }
.gs-warn { color: #FF7D00; }
.gs-sparkline { margin-top: 2px; color: #F5222D; }

@media (max-width: 480px) {
  .aiops-kpi-row { grid-template-columns: 1fr; }
  .gs-grid { grid-template-columns: 1fr; }
  .home-tab-btn { padding: 6px 10px; font-size: 12px; }
}

@media (max-width: 768px) {
  .aiops-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .aiops-kpi-card { padding: 10px 12px; gap: 8px; }
  .aiops-kpi-icon { width: 32px; height: 32px; font-size: 14px; }
  .aiops-kpi-val { font-size: 18px; }
  .kpi-sparkline { display: none; }
  .heatmap-grid { flex-direction: column; }
  .app-grid { grid-template-columns: repeat(3, 1fr); }
  .aiops-section-title { flex-wrap: wrap; row-gap: 8px; }
  .title-toggle { margin-left: 0; }
  .smart-grid { grid-template-columns: 1fr; }
  .smart-remed-row .smart-remed-list { grid-template-columns: 1fr; }
  .gs-grid { grid-template-columns: repeat(2, 1fr); }
  .anomaly-timeline { max-height: 300px; }
  .rec-list { max-height: 300px; }
  .aiops-intent-wrapper { padding: 8px 10px 8px 12px; }
  .aiops-intent-input { font-size: 14px; }
}

@media (max-width: 576px) {
  .app-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>