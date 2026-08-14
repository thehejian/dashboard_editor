<template>
  <div class="obs-ops">
    <div class="obs-ops-header">
      <h3>OBS 运维监控</h3>
      <div class="obs-ops-actions">
        <div class="time-pills">
          <button class="time-pill" :class="{ active: period === '1h' }" @click="period = '1h'">1h</button>
          <button class="time-pill" :class="{ active: period === '6h' }" @click="period = '6h'">6h</button>
          <button class="time-pill" :class="{ active: period === '24h' }" @click="period = '24h'">24h</button>
          <button class="time-pill" :class="{ active: period === '7d' }" @click="period = '7d'">7d</button>
          <button class="time-pill" :class="{ active: period === '30d' }" @click="period = '30d'">30d</button>
        </div>
        <span class="last-refresh">最后更新: {{ lastRefresh }}</span>
      </div>
    </div>

    <div class="obs-ops-body">
      <div class="obs-section">
        <div class="obs-section-title">对象统计</div>
        <div class="stats-row">
          <a-card v-for="s in summaryCards" :key="s.label" size="small" hoverable class="stat-card" @click="openStatDrawer(s)">
            <div class="stat-icon" :style="{ background: s.iconBg }"><i :class="s.icon"></i></div>
            <div class="stat-info">
              <div class="stat-value"><span class="stat-num">{{ s.num }}</span><span class="stat-unit">{{ s.unit }}</span></div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </a-card>
        </div>
      </div>

      <div class="obs-section">
        <div class="alarm-row">
          <div class="alarm-overview-card">
            <div class="obs-section-title">告警总览</div>
            <div class="alarm-grid">
              <div class="alarm-stat-card" v-for="a in alarmStats" :key="a.label" :style="{ background: a.bg + '15' }">
                <div class="alarm-stat-value" :style="{ color: a.color }">{{ a.value }}</div>
                <div class="alarm-stat-label">{{ a.label }}</div>
              </div>
            </div>
          </div>
          <div class="alarm-list-card alarm-list-wrap">
            <div class="alarm-list-header">
              <span class="obs-section-title" style="margin-bottom:0">最近告警</span>
              <a-input-search
                v-model:value="alarmSearch"
                placeholder="搜索告警"
                size="small"
                allow-clear
                class="alarm-search"
                @search="onAlarmSearch"
              />
            </div>
            <a-table
              class="alarm-table"
              :columns="alarmColumns"
              :data-source="pagedAlarms"
              :pagination="false"
              size="small"
              row-key="id"
              :row-class-name="alarmRowClass"
              :custom-row="alarmCustomRow"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'level'">
                  <span class="alarm-level-tag" :style="{ background: alarmLevelColor(record.level) }">{{ alarmLevelText(record.level) }}</span>
                </template>
                <template v-else-if="column.key === 'title'">
                  <span style="color:#1890ff">{{ record.title }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>

      <div class="obs-section">
        <div class="tenant-ep-section">
          <div class="tenant-top5-table tenant-table">
            <div class="tenant-table-header">
              <span class="tenant-table-title">租户 Top5（按使用率）</span>
              <a-input-search
                v-model:value="tenantSearch"
                placeholder="搜索租户"
                size="small"
                allow-clear
                class="tenant-search"
                @search="onTenantSearch"
              />
            </div>
            <a-table
              :columns="tenantColumns"
              :data-source="filteredTenants"
              :pagination="false"
              size="small"
              row-key="name"
              :custom-row="tenantCustomRow"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'usage'">
                  <div class="cap-bar-sm"><div class="cap-fill" :style="{ width: record.usage + '%', background: percentColor(record.usage) }"></div></div>
                  <span class="cap-pct-sm">{{ record.usage }}%</span>
                </template>
                <template v-else-if="column.key === 'successRate'">
                  <span :style="{ color: record.successRate >= 99.9 ? '#52c41a' : '#fa8c16' }">{{ record.successRate }}%</span>
                </template>
                <template v-else-if="column.key === 'name'">
                  <span style="color:#1890ff">{{ record.name }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div class="tenant-charts">
            <div class="tc-wrap">
            <div class="tc-hdr">企业项目资源占比</div>
            <div class="tc-card">
              <div class="tc-chart">
                <svg :viewBox="'0 0 200 200'" class="donut-svg">
                  <g transform="translate(100,100)">
                    <path v-for="(seg, i) in donutSegments" :key="i" :d="seg.path" :fill="seg.color" />
                  </g>
                </svg>
                <div class="donut-legend">
                  <div v-for="(item, i) in donutData" :key="i" class="legend-item">
                    <span class="legend-dot" :style="{ background: donutColors[i] }"></span>
                    <span class="legend-label">{{ item.name.replace('企业项目-', '') }}</span>
                    <span class="legend-value">{{ (item.used / donutTotal * 100).toFixed(1) }}%</span>
</div>
                  </div>
</div>
            </div>
            </div>
            <div class="tc-wrap">
            <div class="tc-hdr">租户使用量对比</div>
            <div class="tc-card">
              <div class="tc-chart">
                <svg :viewBox="'0 0 320 160'" class="bar-svg">
                  <g v-for="(bar, i) in barData" :key="i">
                    <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :fill="bar.color" rx="2" />
                    <text :x="bar.x + bar.w / 2" :y="bar.y - 4" text-anchor="middle" class="bar-label">{{ bar.v }} TB</text>
                    <text :x="bar.x + bar.w / 2" :y="155" text-anchor="middle" class="bar-name">{{ bar.n }}</text>
                  </g>
                </svg>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div class="obs-section-title anatomy-section-title" style="margin-bottom:0;">区域解剖图</div>
      <div class="obs-section">
        <div class="anatomy-block" v-for="r in regions" :key="r.id" :class="{ collapsed: expandedRegions[r.id] === false }">
          <div class="anatomy-block-title" style="cursor:pointer" @click="expandedRegions[r.id] = expandedRegions[r.id] === undefined ? false : !expandedRegions[r.id]">
            <div class="abl-left">
              <i class="fa-solid" :class="expandedRegions[r.id] !== false ? 'fa-chevron-down' : 'fa-chevron-right'" style="font-size:10px; color:#8c8c8c;"></i>
              <span class="abl-name">{{ r.name }}</span>
              <span class="abl-sep">|</span>
              <span class="abl-endpoint">{{ r.domain }}</span>
              <span class="health-tag" :class="r.health">{{ healthText(r.health) }}</span>
            </div>
            <div class="abl-capacity">
              <div class="abl-cap-mod">
                <span class="abl-cap-label">逻辑容量</span>
                <div class="abl-cap-bar"><span class="abl-cap-fill" :style="{ width: r.metrics.logicPercent + '%', background: percentColor(r.metrics.logicPercent) }"></span></div>
                <span class="abl-cap-nums">{{ fmtCap(r.metrics.logicUsed) }}<em>/</em>{{ fmtCap(r.metrics.logicTotal) }}</span>
                <span class="abl-cap-pct">{{ r.metrics.logicPercent }}%</span>
              </div>
              <div class="abl-cap-mod">
                <span class="abl-cap-label">物理容量</span>
                <div class="abl-cap-bar"><span class="abl-cap-fill" :style="{ width: r.metrics.phyPercent + '%', background: percentColor(r.metrics.phyPercent) }"></span></div>
                <span class="abl-cap-nums">{{ fmtCap(r.metrics.phyUsed) }}<em>/</em>{{ fmtCap(r.metrics.phyTotal) }}</span>
                <span class="abl-cap-pct">{{ r.metrics.phyPercent }}%</span>
              </div>
            </div>
          </div>

          <div class="anatomy-part" :class="{ collapsed: expandedParts[r.id + ':cluster'] === false }">
          <div class="obs-section-title anatomy-dropdown" style="font-size:14px; margin-top:12px; cursor:pointer" @click="expandedParts[r.id + ':cluster'] = expandedParts[r.id + ':cluster'] === undefined ? false : !expandedParts[r.id + ':cluster']">
            <i class="fa-solid" :class="expandedParts[r.id + ':cluster'] !== false ? 'fa-chevron-down' : 'fa-chevron-right'" style="font-size:10px; color:#8c8c8c; margin-right:6px;"></i>
            业务集群
          </div>
          <div class="cluster-detail-grid" v-for="c in getClustersByRegion(r.id)" :key="c.id">
            <div class="cluster-detail-card" @click="openClusterDrawer(c)">
              <div class="cdc-header">
                <div class="cdc-name">{{ c.name }}<span class="health-tag-sm" :class="c.health" style="margin-left: 8px; vertical-align: middle;">{{ healthText(c.health) }}</span></div>
                <div class="cdc-meta">
                  <span class="cdc-domain">{{ c.domain }}</span>
                  <span class="cdc-az">{{ c.az }}</span>
                  <span class="cdc-redun">{{ redundancyText(c.redundancy) }}</span>
                </div>
              </div>
              <div class="cdc-body-row">
                <div class="cdc-capacity">
                <div class="cdc-cap-row">
                  <span class="cdc-cap-title">逻辑</span>
                  <div :ref="el => { if (el) capChartRefs[c.id + ':logic'] = el }" class="cdc-cap-chart"></div>
                </div>
                <div class="cdc-cap-row">
                  <span class="cdc-cap-title">物理</span>
                  <div :ref="el => { if (el) capChartRefs[c.id + ':phy'] = el }" class="cdc-cap-chart"></div>
                </div>
              </div>
              <div class="cdc-charts">
                <div class="cdc-chart-col">
                  <div class="cdc-chart-label">SLA 趋势</div>
                  <div :ref="el => { if (el) slaChartRefs[c.id] = el }" class="cdc-chart-box"></div>
                </div>
                <div class="cdc-chart-col">
                  <div class="cdc-chart-label">带宽趋势</div>
                  <div :ref="el => { if (el) bwChartRefs[c.id] = el }" class="cdc-chart-box"></div>
                </div>
              </div>
              <div class="cdc-kpis">
                <div class="cdc-kpi"><span class="cdc-kpi-label">TPS</span><span class="cdc-kpi-val">{{ (c.metrics.tps / 1000).toFixed(1) }}k</span></div>
                <div class="cdc-kpi"><span class="cdc-kpi-label">并发数</span><span class="cdc-kpi-val">{{ (c.metrics.concurrency / 1000).toFixed(1) }}k</span></div>
                <div class="cdc-kpi"><span class="cdc-kpi-label">对象数</span><span class="cdc-kpi-val">{{ (c.objCount / 100000000).toFixed(2) }}亿</span></div>
                <div class="cdc-kpi"><span class="cdc-kpi-label">连接数</span><span class="cdc-kpi-val">{{ (c.metrics.conns / 10000).toFixed(1) }}万</span></div>
              </div>
              </div>
              <div class="honeycomb">
                <div class="hex-cell" :class="hexHealth(b)" v-for="b in honeycombRow(c.id)" :key="b.name" :title="b.name" @click.stop="openBucketDrawer(b)"></div>
              </div>
            </div>
          </div>
          </div>

          <div class="anatomy-part" :class="{ collapsed: expandedParts[r.id + ':sc'] === false }">
          <div class="obs-section-title anatomy-dropdown" style="font-size:14px; margin-top:12px; cursor:pointer" @click="expandedParts[r.id + ':sc'] = expandedParts[r.id + ':sc'] === undefined ? false : !expandedParts[r.id + ':sc']">
            <i class="fa-solid" :class="expandedParts[r.id + ':sc'] !== false ? 'fa-chevron-down' : 'fa-chevron-right'" style="font-size:10px; color:#8c8c8c; margin-right:6px;"></i>
            存储集群
          </div>
          <div class="sc-detail-grid">
            <div class="sc-detail-card" v-for="sc in getStorageClustersByRegion(r.id)" :key="sc.id" @click="openSCDrawer(sc)">
              <div class="sdc-name">{{ sc.name }}</div>
              <div class="sdc-pool-list">
                <div class="sdc-pool" v-for="p in getPoolsBySC(sc.id)" :key="p.id">
                  <div class="sdp-title">{{ p.name }}</div>
                  <div class="sdp-body">
                    <div :ref="el => { if (el) scPoolBarRefs[sc.id + ':' + p.id] = el }" class="sdp-bar-chart"></div>
                    <div class="sdp-bar-cap"><span>已用 {{ p.metrics.phyUsed }} TB</span><span>总量 {{ p.metrics.phyTotal }} TB</span></div>
                  </div>
                  <div class="sdp-trend">
                    <div class="sdp-trend-label">使用率趋势</div>
                    <div :ref="el => { if (el) scPoolChartRefs[sc.id + ':' + p.id] = el }" class="sdp-trend-chart"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div class="anatomy-part" :class="{ collapsed: expandedParts[r.id + ':node'] === false }">
          <div class="obs-section-title anatomy-dropdown" style="font-size:14px; margin-top:12px; cursor:pointer" @click="expandedParts[r.id + ':node'] = expandedParts[r.id + ':node'] === undefined ? false : !expandedParts[r.id + ':node']">
            <i class="fa-solid" :class="expandedParts[r.id + ':node'] !== false ? 'fa-chevron-down' : 'fa-chevron-right'" style="font-size:10px; color:#8c8c8c; margin-right:6px;"></i>
            存储节点
          </div>
          <div class="node-grid">
            <div class="node-tile" v-for="n in getNodesByRegion(r.id)" :key="n.name" :class="n.health" @click="openNodeDrawer(n)">
              <div class="nt-header">
                <span class="nt-name">{{ n.name }}</span>
                <span class="role-tag" :class="'role-' + roleShort(n.role)">{{ roleShort(n.role) }}</span>
                <span class="health-tag-sm" :class="n.health">{{ healthText(n.health) }}</span>
              </div>
              <div class="nt-bars">
                <div class="nt-bar-row"><span class="nt-bar-label">CPU</span><div class="nt-bar"><div class="nt-bar-fill" :class="usageLevel(n.metrics.cpu)" :style="{ width: n.metrics.cpu + '%' }"></div></div><span class="nt-bar-val">{{ n.metrics.cpu }}%</span></div>
                <div class="nt-bar-row"><span class="nt-bar-label">MEM</span><div class="nt-bar"><div class="nt-bar-fill" :class="usageLevel(n.metrics.mem)" :style="{ width: n.metrics.mem + '%' }"></div></div><span class="nt-bar-val">{{ n.metrics.mem }}%</span></div>
                <div class="nt-bar-row"><span class="nt-bar-label">DISK</span><div class="nt-bar"><div class="nt-bar-fill" :class="usageLevel(n.metrics.disk)" :style="{ width: n.metrics.disk + '%' }"></div></div><span class="nt-bar-val">{{ n.metrics.disk }}%</span></div>
              </div>
              <div class="nt-kpis">
                <span>TPS {{ n.metrics.tps.toLocaleString() }}</span>
                <span>延迟 {{ n.metrics.lat }}ms</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    
    <div class="detail-panel" :class="{ open: drawerOpen }">
      <div class="detail-mask" @click="closeDrawer"></div>
      <div class="detail-panel-content">
        <div class="detail-header">
          <div class="detail-title">
            <button v-if="drawerStack.length > 1" class="back-btn" @click="drawerBack"><i class="fa-solid fa-arrow-left"></i></button>
            <h3 v-for="(cr, ci) in drawerBreadcrumb" :key="ci" v-show="ci === drawerBreadcrumb.length - 1">{{ cr }}</h3>
          </div>
          <button class="close-btn" @click="closeDrawer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="detail-scroll">
          <component :is="drawerComponent" v-bind="drawerProps" @navigate="handleDrawerNavigate" />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, nextTick, markRaw, reactive } from 'vue'
import { Chart } from '@antv/g2'

const period = ref('24h')
const lastRefresh = ref('')
const expandedRegions = reactive({})
const expandedParts = reactive({})

const summaryCards = [
  { label: '区域', num: '2', unit: '个', icon: 'fa-solid fa-globe', iconBg: '#e6f0ff' },
  { label: '业务集群', num: '3', unit: '个', icon: 'fa-solid fa-server', iconBg: '#e6f0ff' },
  { label: '存储集群', num: '5', unit: '个', icon: 'fa-solid fa-database', iconBg: '#e6f0ff' },
  { label: '存储池', num: '8', unit: '个', icon: 'fa-solid fa-cubes', iconBg: '#e6f0ff' },
  { label: '存储节点', num: '30', unit: '个', icon: 'fa-solid fa-microchip', iconBg: '#e6f0ff' },
  { label: '数据盘', num: '70', unit: '块', icon: 'fa-solid fa-hard-drive', iconBg: '#e6f0ff' },
  { label: '桶', num: '85', unit: '个', icon: 'fa-solid fa-bucket', iconBg: '#e6f0ff' },
  { label: '对象', num: '13', unit: '亿', icon: 'fa-solid fa-cube', iconBg: '#e6f0ff' },
  { label: '租户', num: '7', unit: '个', icon: 'fa-solid fa-users', iconBg: '#e6f0ff' },
  { label: '企业项目', num: '7', unit: '个', icon: 'fa-solid fa-building', iconBg: '#e6f0ff' },
]

const alarmStats = [
  { label: '紧急告警', value: '2', color: '#f5222d', bg: '#f5222d' },
  { label: '重要告警', value: '2', color: '#fa8c16', bg: '#fa8c16' },
  { label: '次要告警', value: '1', color: '#faad14', bg: '#faad14' },
  { label: '提示告警', value: '1', color: '#1890ff', bg: '#1890ff' },
]

const alarms = [
  { id: 1, level: 'crit', title: '存储池 obsData 容量使用率超过 85%', objType: '存储池', objId: 'pool-001', objName: 'obsData', desc: '存储池 obsData 当前使用率 87.3%，超过紧急阈值 85%。请及时扩容或清理数据。', time: '2026-08-13 10:23:45', status: 'active', diagSteps: ['检查存储池容量使用率', '查看数据分布情况', '检查是否有异常写入', '评估扩容需求'], recovery: '建议扩容存储池或清理不必要的数据。可删除临时文件或过期备份数据释放空间。' },
  { id: 2, level: 'crit', title: '节点 HN05 磁盘 I/O 延迟过高', objType: '节点', objId: 'node-005', objName: 'HN05', desc: '节点 HN05 数据盘 sdb 延迟达到 850ms，超过紧急阈值 500ms。', time: '2026-08-13 09:15:30', status: 'active', diagSteps: ['检查磁盘 I/O 状态', '检查磁盘健康状态', '查看系统负载', '检查磁盘队列深度'], recovery: '建议更换故障磁盘。如为临时负载高峰，可观察后恢复。' },
  { id: 3, level: 'warn', title: '存储桶 bucket01 对象数超规格 80%', objType: '桶', objId: 'bucket-001', objName: 'bucket01', desc: '桶 bucket01 对象数量已达配额的 83%。', time: '2026-08-12 15:47:22', status: 'active', diagSteps: ['检查桶对象数量', '查看对象增长趋势', '检查生命周期规则'], recovery: '建议设置生命周期规则自动清理过期对象，或申请增加配额。' },
  { id: 4, level: 'warn', title: '存储桶 bucket02 访问日志传输组无权限', objType: '桶', objId: 'bucket-002', objName: 'bucket02', desc: '桶 bucket02 的访问日志传输组缺少写入权限。', time: '2026-08-12 08:12:05', status: 'active', diagSteps: ['检查日志传输组配置', '检查桶策略', '检查IAM权限'], recovery: '请为日志传输组添加桶的写入权限。' },
  { id: 5, level: 'minor', title: '存储池 backupPool 空间使用率超过 70%', objType: '存储池', objId: 'pool-002', objName: 'backupPool', desc: '存储池 backupPool 使用率 72%。', time: '2026-08-11 22:05:18', status: 'active', diagSteps: ['检查存储池容量', '检查备份策略', '评估是否需要扩容'], recovery: '建议监控使用率趋势，达到 85% 前扩容。' },
  { id: 6, level: 'info', title: '集群 obs-cluster-01 完成例行巡检', objType: '集群', objId: 'cluster-001', objName: 'obs-cluster-01', desc: '集群 obs-cluster-01 例行巡检完成，所有节点健康。', time: '2026-08-11 06:00:00', status: 'cleared', diagSteps: [], recovery: '' },
]

const regions = [
  {
    id: 'region-001', name: '华北-北京四', domain: 'obs.cn-north-4a.myhuaweicloud.com', isDefault: true,
    metrics: { logicTotal: 500, logicUsed: 312, logicPercent: 62.4, phyTotal: 720, phyUsed: 445, phyPercent: 61.8 },
    objCount: 1250000, objCountTrend: genTrend(24, 1200000, 1300000),
    logicUsedTrend: genTrend(30, 280, 320), phyUsedTrend: genTrend(30, 400, 450),
    clusters: ['cluster-001', 'cluster-002'], health: 'ok'
  },
  {
    id: 'region-002', name: '华东-上海一', domain: 'obs.cn-east-3a.myhuaweicloud.com', isDefault: false,
    metrics: { logicTotal: 300, logicUsed: 198, logicPercent: 66, phyTotal: 450, phyUsed: 285, phyPercent: 63.3 },
    objCount: 860000, objCountTrend: genTrend(24, 800000, 900000),
    logicUsedTrend: genTrend(30, 170, 200), phyUsedTrend: genTrend(30, 250, 290),
    clusters: ['cluster-003'], health: 'warn'
  },
]

const clusters = [
  {
    id: 'cluster-001', name: 'obs-cluster-01', domain: 'obs-cluster-01.cn-north-4.myhuaweicloud.com', isDefault: true,
    redundancy: 'FUSION', az: 'AZ1', mgmtVip: '10.0.1.100', bizVip: '10.0.2.100', pubVip: '203.0.113.100',
    region: 'region-001', health: 'ok',
    metrics: { successRate: 99.99, successTrend: genTrend(30, 99.9, 100), effectiveRate: 99.95, effectiveTrend: genTrend(30, 99.8, 100), tps: 12500, tpsTrend: genTrend(24, 8000, 15000), bw: 2.8, bwTrend: genTrend(24, 1.5, 4), lat: 3.5, latTrend: genTrend(24, 2, 8), concurrency: 450, concurrencyTrend: genTrend(24, 300, 600), conns: 1200, connsTrend: genTrend(24, 800, 1600), logicTotal: 300, logicUsed: 185, logicPercent: 61.7, phyTotal: 430, phyUsed: 265, phyPercent: 61.6, logicUsedTrend: genTrend(30, 160, 190), phyUsedTrend: genTrend(30, 230, 270) },
    objCount: 750000, buckets: 5, nodes: 6, storageClusters: 2
  },
  {
    id: 'cluster-002', name: 'obs-cluster-02', domain: 'obs-cluster-02.cn-north-4.myhuaweicloud.com', isDefault: false,
    redundancy: 'THREE_AZ', az: 'AZ1-AZ3', mgmtVip: '10.0.1.200', bizVip: '10.0.2.200', pubVip: '203.0.113.200',
    region: 'region-001', health: 'ok',
    metrics: { successRate: 99.98, successTrend: genTrend(30, 99.85, 100), effectiveRate: 99.92, effectiveTrend: genTrend(30, 99.7, 100), tps: 8500, tpsTrend: genTrend(24, 5000, 12000), bw: 1.9, bwTrend: genTrend(24, 1, 3.5), lat: 4.2, latTrend: genTrend(24, 2.5, 9), concurrency: 320, concurrencyTrend: genTrend(24, 200, 450), conns: 900, connsTrend: genTrend(24, 600, 1300), logicTotal: 200, logicUsed: 127, logicPercent: 63.5, phyTotal: 290, phyUsed: 180, phyPercent: 62.1, logicUsedTrend: genTrend(30, 110, 130), phyUsedTrend: genTrend(30, 160, 185) },
    objCount: 500000, buckets: 3, nodes: 4, storageClusters: 1
  },
  {
    id: 'cluster-003', name: 'obs-cluster-03', domain: 'obs-cluster-03.cn-east-3.myhuaweicloud.com', isDefault: false,
    redundancy: 'ONE_AZ', az: 'AZ1', mgmtVip: '10.0.1.150', bizVip: '10.0.2.150', pubVip: '203.0.113.150',
    region: 'region-002', health: 'warn',
    metrics: { successRate: 99.95, successTrend: genTrend(30, 99.7, 100), effectiveRate: 99.88, effectiveTrend: genTrend(30, 99.6, 100), tps: 6200, tpsTrend: genTrend(24, 3000, 9000), bw: 1.2, bwTrend: genTrend(24, 0.5, 2.5), lat: 5.8, latTrend: genTrend(24, 3, 12), concurrency: 210, concurrencyTrend: genTrend(24, 100, 350), conns: 650, connsTrend: genTrend(24, 400, 1000), logicTotal: 300, logicUsed: 198, logicPercent: 66, phyTotal: 450, phyUsed: 285, phyPercent: 63.3, logicUsedTrend: genTrend(30, 170, 200), phyUsedTrend: genTrend(30, 250, 290) },
    objCount: 860000, buckets: 4, nodes: 2, storageClusters: 1
  },
]

const storageClusters = [
  { id: 'sc-001', name: '存储集群01', ctrlNodeCount: 3, poolCount: 2, cluster: 'cluster-001', health: 'ok' },
  { id: 'sc-002', name: '存储集群02', ctrlNodeCount: 2, poolCount: 1, cluster: 'cluster-001', health: 'ok' },
  { id: 'sc-003', name: '存储集群03', ctrlNodeCount: 3, poolCount: 1, cluster: 'cluster-002', health: 'warn' },
  { id: 'sc-004', name: '存储集群04', ctrlNodeCount: 2, poolCount: 1, cluster: 'cluster-003', health: 'ok' },
]

const storagePools = [
  { id: 'pool-001', name: 'EC性能池', safety: '节点级', ecRatio: '12+3', redundancy: 'FUSION', cacheDisk: 'NVMe SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-001', health: 'normal', metrics: { phyTotal: 186, phyUsed: 118, phyPercent: 63, objCount: 520000, readBw: 320, readBwTrend: genTrend(24, 200, 500), writeBw: 180, writeBwTrend: genTrend(24, 100, 300), iops: 4500, iopsTrend: genTrend(24, 2000, 7000), lat: 5.2, latTrend: genTrend(24, 3, 10) } },
  { id: 'pool-002', name: 'EC容量池', safety: '柜级', ecRatio: '8+2', redundancy: 'THREE_AZ', cacheDisk: 'SAS SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-001', health: 'degraded', metrics: { phyTotal: 372, phyUsed: 286, phyPercent: 77, objCount: 180000, readBw: 150, readBwTrend: genTrend(24, 80, 250), writeBw: 90, writeBwTrend: genTrend(24, 50, 180), iops: 2200, iopsTrend: genTrend(24, 1000, 4000), lat: 8.5, latTrend: genTrend(24, 4, 15) } },
  { id: 'pool-003', name: 'EC归档池', safety: '节点级', ecRatio: '12+3', redundancy: 'FUSION', cacheDisk: 'NVMe SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-002', health: 'migrating', metrics: { phyTotal: 496, phyUsed: 198, phyPercent: 40, objCount: 95000, readBw: 200, readBwTrend: genTrend(24, 100, 350), writeBw: 120, writeBwTrend: genTrend(24, 60, 220), iops: 3800, iopsTrend: genTrend(24, 1500, 6000), lat: 4.8, latTrend: genTrend(24, 2, 9) } },
  { id: 'pool-004', name: 'EC性能池02', safety: '节点级', ecRatio: '4+2', redundancy: 'ONE_AZ', cacheDisk: 'NVMe SSD', mainDisk: 'NVMe SSD', sc: 'sc-003', health: 'normal', metrics: { phyTotal: 186, phyUsed: 152, phyPercent: 82, objCount: 45000, readBw: 450, readBwTrend: genTrend(24, 300, 700), writeBw: 280, writeBwTrend: genTrend(24, 150, 450), iops: 8500, iopsTrend: genTrend(24, 5000, 12000), lat: 1.2, latTrend: genTrend(24, 0.5, 3) } },
  { id: 'pool-005', name: 'obsIndex', safety: '节点级', ecRatio: '6+3', redundancy: 'FUSION', cacheDisk: 'SAS SSD', mainDisk: 'SAS SSD', sc: 'sc-004', health: 'normal', metrics: { phyTotal: 15, phyUsed: 9.8, phyPercent: 65.3, objCount: 20000, readBw: 80, readBwTrend: genTrend(24, 40, 150), writeBw: 35, writeBwTrend: genTrend(24, 15, 70), iops: 1200, iopsTrend: genTrend(24, 600, 2200), lat: 3.8, latTrend: genTrend(24, 2, 7) } },
]

const buckets = [
  { name: 'bucket-data-01', createTime: '2025-03-15 10:30:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 50, used: 38.5, usage: 77, objCount: 285000, successRate: 99.99, tps: 3200, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 2000, 5000), readBw: 180, readBwTrend: genTrend(24, 100, 300), lat: 3.2, latTrend: genTrend(24, 1.5, 6), concurrency: 120, concurrencyTrend: genTrend(24, 60, 200) }, health: 'ok' },
  { name: 'bucket-log-01', createTime: '2025-04-20 14:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 100, used: 72.3, usage: 72.3, objCount: 420000, successRate: 99.97, tps: 4500, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 3000, 7000), readBw: 250, readBwTrend: genTrend(24, 150, 400), lat: 2.8, latTrend: genTrend(24, 1, 5), concurrency: 200, concurrencyTrend: genTrend(24, 100, 350) }, health: 'ok' },
  { name: 'bucket-backup-01', createTime: '2025-05-10 08:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-002', ep: 'ep-backup-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 200, used: 145.8, usage: 72.9, objCount: 18000, successRate: 99.95, tps: 800, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 400, 1400), readBw: 60, readBwTrend: genTrend(24, 30, 120), lat: 5.5, latTrend: genTrend(24, 3, 10), concurrency: 45, concurrencyTrend: genTrend(24, 20, 80) }, health: 'ok' },
  { name: 'bucket-obs-02', createTime: '2025-03-20 09:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 40, used: 33.2, usage: 83, objCount: 90000, successRate: 99.9, tps: 900, successTrend: genTrend(24, 99.5, 100), tpsTrend: genTrend(24, 500, 1500), readBw: 80, readBwTrend: genTrend(24, 40, 150), lat: 6.8, latTrend: genTrend(24, 3, 12), concurrency: 30, concurrencyTrend: genTrend(24, 15, 60) }, health: 'warn' },
  { name: 'bucket-trace-01', createTime: '2025-04-01 10:30:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 20, used: 19.4, usage: 97, objCount: 150000, successRate: 99.72, tps: 2100, successTrend: genTrend(24, 99.0, 100), tpsTrend: genTrend(24, 1500, 3500), readBw: 320, readBwTrend: genTrend(24, 200, 500), lat: 12.5, latTrend: genTrend(24, 6, 20), concurrency: 90, concurrencyTrend: genTrend(24, 40, 160) }, health: 'crit' },
  { name: 'bucket-log-02', createTime: '2025-05-15 11:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-002', ep: 'ep-backup-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 60, used: 30.6, usage: 51, objCount: 62000, successRate: 99.96, tps: 1300, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 800, 2200), readBw: 95, readBwTrend: genTrend(24, 50, 200), lat: 3.9, latTrend: genTrend(24, 2, 8), concurrency: 55, concurrencyTrend: genTrend(24, 25, 90) }, health: 'ok' },
  { name: 'bucket-media-02', createTime: '2025-06-10 15:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-002', ep: 'ep-backup-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 120, used: 91.5, usage: 76.3, objCount: 78000, successRate: 99.94, tps: 2400, successTrend: genTrend(24, 99.7, 100), tpsTrend: genTrend(24, 1500, 4000), readBw: 410, readBwTrend: genTrend(24, 250, 650), lat: 2.5, latTrend: genTrend(24, 1, 5), concurrency: 160, concurrencyTrend: genTrend(24, 80, 260) }, health: 'ok' },
  { name: 'bucket-temp-01', createTime: '2025-07-01 18:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 30, used: 29.1, usage: 97, objCount: 30000, successRate: 99.81, tps: 450, successTrend: genTrend(24, 99.2, 100), tpsTrend: genTrend(24, 200, 800), readBw: 60, readBwTrend: genTrend(24, 30, 120), lat: 9.3, latTrend: genTrend(24, 5, 18), concurrency: 20, concurrencyTrend: genTrend(24, 10, 45) }, health: 'crit' },
  { name: 'bucket-media-01', createTime: '2025-06-01 16:30:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-002', ep: 'ep-media-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 80, used: 52.1, usage: 65.1, objCount: 95000, successRate: 99.98, tps: 2800, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 1500, 4500), readBw: 350, readBwTrend: genTrend(24, 200, 600), lat: 2.1, latTrend: genTrend(24, 1, 4), concurrency: 180, concurrencyTrend: genTrend(24, 100, 300) }, health: 'ok' },
  { name: 'bucket-share-01', createTime: '2025-06-05 09:30:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-002', ep: 'ep-media-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 40, used: 35.8, usage: 89.5, objCount: 18000, successRate: 99.9, tps: 700, successTrend: genTrend(24, 99.4, 100), tpsTrend: genTrend(24, 300, 1200), readBw: 95, readBwTrend: genTrend(24, 40, 180), lat: 7.8, latTrend: genTrend(24, 4, 15), concurrency: 25, concurrencyTrend: genTrend(24, 10, 50) }, health: 'warn' },
  { name: 'bucket-ai-inf-01', createTime: '2025-06-12 13:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-003', ep: 'ep-media-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 200, used: 198.4, usage: 99.2, objCount: 240000, successRate: 99.61, tps: 5200, successTrend: genTrend(24, 98.8, 100), tpsTrend: genTrend(24, 3000, 8000), readBw: 640, readBwTrend: genTrend(24, 400, 900), lat: 18.2, latTrend: genTrend(24, 8, 30), concurrency: 320, concurrencyTrend: genTrend(24, 150, 500) }, health: 'crit' },
  { name: 'bucket-archive-01', createTime: '2025-07-05 09:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-001', ep: 'ep-archive-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 500, used: 286.5, usage: 57.3, objCount: 85000, successRate: 99.99, tps: 600, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 300, 1100), readBw: 40, readBwTrend: genTrend(24, 20, 80), lat: 6.8, latTrend: genTrend(24, 4, 12), concurrency: 30, concurrencyTrend: genTrend(24, 10, 60) }, health: 'ok' },
  { name: 'bucket-audit-01', createTime: '2025-07-10 10:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-001', ep: 'ep-archive-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 80, used: 45.2, usage: 56.5, objCount: 38000, successRate: 99.97, tps: 400, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 200, 900), readBw: 30, readBwTrend: genTrend(24, 15, 70), lat: 5.2, latTrend: genTrend(24, 2, 10), concurrency: 18, concurrencyTrend: genTrend(24, 8, 40) }, health: 'ok' },
  { name: 'bucket-hot-01', createTime: '2025-07-18 14:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-002', ep: 'ep-media-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 30, used: 25.6, usage: 85.3, objCount: 56000, successRate: 99.88, tps: 3100, successTrend: genTrend(24, 99.3, 100), tpsTrend: genTrend(24, 2000, 5200), readBw: 520, readBwTrend: genTrend(24, 300, 800), lat: 4.4, latTrend: genTrend(24, 2, 9), concurrency: 210, concurrencyTrend: genTrend(24, 100, 380) }, health: 'ok' },
  { name: 'bucket-cold-01', createTime: '2025-07-28 09:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-001', ep: 'ep-archive-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 80, used: 46.8, usage: 58.5, objCount: 32000, successRate: 99.95, tps: 220, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 100, 500), readBw: 18, readBwTrend: genTrend(24, 8, 40), lat: 6.1, latTrend: genTrend(24, 3, 12), concurrency: 12, concurrencyTrend: genTrend(24, 4, 28) }, health: 'ok' },
  { name: 'bucket-ai-01', createTime: '2025-08-12 11:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'POSIX', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 60, used: 42.8, usage: 71.3, objCount: 520000, successRate: 99.93, tps: 5600, successTrend: genTrend(24, 99.7, 100), tpsTrend: genTrend(24, 3000, 8000), readBw: 420, readBwTrend: genTrend(24, 250, 700), lat: 1.8, latTrend: genTrend(24, 0.8, 3.5), concurrency: 250, concurrencyTrend: genTrend(24, 150, 400) }, health: 'warn' },
  { name: 'bucket-backup-02', createTime: '2025-09-01 13:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'OBJECT', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 100, used: 58.3, usage: 58.3, objCount: 12000, successRate: 99.96, tps: 350, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 100, 700), readBw: 25, readBwTrend: genTrend(24, 10, 60), lat: 7.2, latTrend: genTrend(24, 4, 14), concurrency: 15, concurrencyTrend: genTrend(24, 5, 35) }, health: 'ok' },
  { name: 'bucket-cache-01', createTime: '2025-09-08 10:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 50, used: 33.5, usage: 67, objCount: 64000, successRate: 99.95, tps: 2100, successTrend: genTrend(24, 99.7, 100), tpsTrend: genTrend(24, 1200, 3600), readBw: 280, readBwTrend: genTrend(24, 150, 500), lat: 2.6, latTrend: genTrend(24, 1.2, 5), concurrency: 140, concurrencyTrend: genTrend(24, 70, 240) }, health: 'ok' },
  { name: 'bucket-model-01', createTime: '2025-09-15 11:30:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'POSIX', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 300, used: 245.7, usage: 81.9, objCount: 43000, successRate: 99.92, tps: 850, successTrend: genTrend(24, 99.5, 100), tpsTrend: genTrend(24, 400, 1500), readBw: 160, readBwTrend: genTrend(24, 80, 320), lat: 9.6, latTrend: genTrend(24, 4, 18), concurrency: 65, concurrencyTrend: genTrend(24, 30, 120) }, health: 'warn' },
  { name: 'bucket-label-01', createTime: '2025-09-20 09:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 40, used: 38.9, usage: 97.3, objCount: 86000, successRate: 99.7, tps: 3900, successTrend: genTrend(24, 98.9, 100), tpsTrend: genTrend(24, 2500, 6000), readBw: 480, readBwTrend: genTrend(24, 300, 750), lat: 14.3, latTrend: genTrend(24, 6, 25), concurrency: 280, concurrencyTrend: genTrend(24, 150, 420) }, health: 'crit' },
  { name: 'bucket-ckpt-01', createTime: '2025-09-25 15:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'POSIX', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 150, used: 96.4, usage: 64.3, objCount: 21000, successRate: 99.94, tps: 520, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 250, 1000), readBw: 88, readBwTrend: genTrend(24, 40, 180), lat: 4.1, latTrend: genTrend(24, 2, 8), concurrency: 40, concurrencyTrend: genTrend(24, 18, 80) }, health: 'ok' },
  { name: 'bucket-alias-01', createTime: '2025-10-01 10:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'ALIAS', redundancy: 'FUSION', aliasTarget: 'bucket-data-01', metrics: { quota: 0, used: 0, usage: 0, objCount: 0, successRate: 0, tps: 0, successTrend: [], tpsTrend: [], readBw: 0, readBwTrend: [], lat: 0, latTrend: [], concurrency: 0, concurrencyTrend: [] }, health: 'ok' },
]

const nodes = [
  { name: 'HN01', role: 'OAM', mgmtIp: '10.0.1.11', bizIp: '10.0.2.11', storIp: '10.0.3.11', ctrlIp: '10.0.4.11', rack: 'R01', slot: 'U01', cluster: 'cluster-001', pool: 'pool-001', health: 'ok', region: 'region-001', metrics: { successRate: 99.99, tps: 3200, bw: 1.2, lat: 3.2, concurrency: 180, conns: 450, cpu: 45, mem: 62, disk: 55 }, processes: [{ name: 'obs-oam', pid: 1024, status: 'normal', cpu: 2.5, mem: 8.2 }, { name: 'obs-monitor', pid: 1025, status: 'normal', cpu: 1.8, mem: 3.5 }, { name: 'obs-log', pid: 1026, status: 'normal', cpu: 0.5, mem: 1.2 }] },
  { name: 'HN02', role: 'FUSION', mgmtIp: '10.0.1.12', bizIp: '10.0.2.12', storIp: '10.0.3.12', ctrlIp: '10.0.4.12', rack: 'R01', slot: 'U02', cluster: 'cluster-001', pool: 'pool-001', health: 'ok', region: 'region-001', metrics: { successRate: 99.98, tps: 4100, bw: 1.8, lat: 2.8, concurrency: 220, conns: 520, cpu: 52, mem: 58, disk: 62 }, processes: [{ name: 'obs-fusion', pid: 2048, status: 'normal', cpu: 5.2, mem: 12.5 }, { name: 'obs-data', pid: 2049, status: 'normal', cpu: 8.5, mem: 15.8 }] },
  { name: 'HN03', role: 'INDEX', mgmtIp: '10.0.1.13', bizIp: '10.0.2.13', storIp: '10.0.3.13', ctrlIp: '10.0.4.13', rack: 'R01', slot: 'U03', cluster: 'cluster-001', pool: 'pool-001', health: 'ok', region: 'region-001', metrics: { successRate: 99.99, tps: 2800, bw: 0.9, lat: 3.5, concurrency: 150, conns: 380, cpu: 38, mem: 45, disk: 40 }, processes: [{ name: 'obs-index', pid: 3072, status: 'normal', cpu: 4.8, mem: 10.2 }] },
  { name: 'HN04', role: 'PERSISTANCE_PERFORMANCE', mgmtIp: '10.0.1.14', bizIp: '10.0.2.14', storIp: '10.0.3.14', ctrlIp: '10.0.4.14', rack: 'R02', slot: 'U01', cluster: 'cluster-001', pool: 'pool-001', health: 'ok', region: 'region-001', metrics: { successRate: 99.99, tps: 5200, bw: 2.1, lat: 1.8, concurrency: 280, conns: 650, cpu: 65, mem: 72, disk: 48 }, processes: [{ name: 'obs-perf', pid: 4096, status: 'normal', cpu: 12.5, mem: 22.5 }] },
  { name: 'HN05', role: 'PERSISTANCE_CAPACITY', mgmtIp: '10.0.1.15', bizIp: '10.0.2.15', storIp: '10.0.3.15', ctrlIp: '10.0.4.15', rack: 'R02', slot: 'U02', cluster: 'cluster-001', pool: 'pool-001', health: 'warn', region: 'region-001', metrics: { successRate: 99.92, tps: 2800, bw: 1.5, lat: 8.5, concurrency: 180, conns: 420, cpu: 78, mem: 85, disk: 92 }, processes: [{ name: 'obs-capacity', pid: 5120, status: 'warn', cpu: 18.5, mem: 28.5 }] },
  { name: 'HN06', role: 'FUSION', mgmtIp: '10.0.1.16', bizIp: '10.0.2.16', storIp: '10.0.3.16', ctrlIp: '10.0.4.16', rack: 'R02', slot: 'U03', cluster: 'cluster-001', pool: 'pool-002', health: 'ok', region: 'region-001', metrics: { successRate: 99.98, tps: 3500, bw: 1.4, lat: 4.5, concurrency: 190, conns: 480, cpu: 48, mem: 55, disk: 35 }, processes: [{ name: 'obs-fusion', pid: 6144, status: 'normal', cpu: 4.5, mem: 10.5 }] },
  { name: 'ES01', role: 'OAM', mgmtIp: '10.0.1.21', bizIp: '10.0.2.21', storIp: '10.0.3.21', ctrlIp: '10.0.4.21', rack: 'R03', slot: 'U01', cluster: 'cluster-002', pool: 'pool-003', health: 'ok', region: 'region-001', metrics: { successRate: 99.99, tps: 1800, bw: 0.6, lat: 4.8, concurrency: 95, conns: 280, cpu: 35, mem: 42, disk: 30 }, processes: [{ name: 'obs-oam', pid: 7168, status: 'normal', cpu: 2.8, mem: 6.5 }] },
  { name: 'ES02', role: 'FUSION', mgmtIp: '10.0.1.22', bizIp: '10.0.2.22', storIp: '10.0.3.22', ctrlIp: '10.0.4.22', rack: 'R03', slot: 'U02', cluster: 'cluster-002', pool: 'pool-003', health: 'warn', region: 'region-001', metrics: { successRate: 99.95, tps: 2200, bw: 0.8, lat: 6.2, concurrency: 120, conns: 320, cpu: 62, mem: 68, disk: 45 }, processes: [{ name: 'obs-fusion', pid: 8192, status: 'warn', cpu: 8.5, mem: 15.5 }] },
  { name: 'ES03', role: 'INDEX', mgmtIp: '10.0.1.23', bizIp: '10.0.2.23', storIp: '10.0.3.23', ctrlIp: '10.0.4.23', rack: 'R03', slot: 'U03', cluster: 'cluster-002', pool: 'pool-003', health: 'ok', region: 'region-001', metrics: { successRate: 99.98, tps: 1500, bw: 0.5, lat: 3.8, concurrency: 80, conns: 220, cpu: 32, mem: 38, disk: 25 }, processes: [{ name: 'obs-index', pid: 9216, status: 'normal', cpu: 3.8, mem: 7.5 }] },
  { name: 'SH01', role: 'FUSION', mgmtIp: '10.0.1.31', bizIp: '10.0.2.31', storIp: '10.0.3.31', ctrlIp: '10.0.4.31', rack: 'R04', slot: 'U01', cluster: 'cluster-003', pool: 'pool-005', health: 'ok', region: 'region-002', metrics: { successRate: 99.97, tps: 3800, bw: 1.1, lat: 3.5, concurrency: 160, conns: 380, cpu: 42, mem: 52, disk: 38 }, processes: [{ name: 'obs-fusion', pid: 10240, status: 'normal', cpu: 5.5, mem: 12.5 }] },
  { name: 'SH02', role: 'PERSISTANCE_CAPACITY', mgmtIp: '10.0.1.32', bizIp: '10.0.2.32', storIp: '10.0.3.32', ctrlIp: '10.0.4.32', rack: 'R04', slot: 'U02', cluster: 'cluster-003', pool: 'pool-005', health: 'ok', region: 'region-002', metrics: { successRate: 99.96, tps: 2400, bw: 0.7, lat: 4.2, concurrency: 110, conns: 280, cpu: 38, mem: 48, disk: 52 }, processes: [{ name: 'obs-capacity', pid: 11264, status: 'normal', cpu: 6.8, mem: 12.5 }] },
  { name: 'SH03', role: 'FUSION', mgmtIp: '10.0.1.33', bizIp: '10.0.2.33', storIp: '10.0.3.33', ctrlIp: '10.0.4.33', rack: 'R04', slot: 'U03', cluster: 'cluster-003', pool: 'pool-005', health: 'warn', region: 'region-002', metrics: { successRate: 99.92, tps: 3200, bw: 0.9, lat: 5.8, concurrency: 140, conns: 340, cpu: 55, mem: 62, disk: 58 }, processes: [{ name: 'obs-fusion', pid: 12288, status: 'normal', cpu: 6.5, mem: 14.5 }] },
]

const dataDisks = [
  { esn: 'D001', slot: 'Slot0', media: 'NVMe SSD', role: '缓存盘', node: 'HN01', metrics: { capacity: 3.84, used: 1.2, usage: 31.3, bw: 3200, iops: 450000 }, health: 'online' },
  { esn: 'D002', slot: 'Slot1', media: 'NVMe SSD', role: '缓存盘', node: 'HN01', metrics: { capacity: 3.84, used: 2.1, usage: 54.7, bw: 2800, iops: 380000 }, health: 'online' },
  { esn: 'D003', slot: 'Slot0', media: 'NL-SAS HDD', role: '主存盘', node: 'HN02', metrics: { capacity: 16.0, used: 11.5, usage: 71.9, bw: 250, iops: 8500 }, health: 'online' },
  { esn: 'D004', slot: 'Slot1', media: 'NL-SAS HDD', role: '主存盘', node: 'HN02', metrics: { capacity: 16.0, used: 12.8, usage: 80, bw: 220, iops: 7200 }, health: 'online' },
  { esn: 'D005', slot: 'Slot2', media: 'NL-SAS HDD', role: '主存盘', node: 'HN02', metrics: { capacity: 16.0, used: 14.2, usage: 88.8, bw: 180, iops: 5500 }, health: 'degraded' },
  { esn: 'D006', slot: 'Slot0', media: 'SAS SSD', role: '缓存盘', node: 'HN03', metrics: { capacity: 1.92, used: 0.8, usage: 41.7, bw: 1800, iops: 180000 }, health: 'online' },
  { esn: 'D007', slot: 'Slot0', media: 'NVMe SSD', role: '缓存盘', node: 'HN04', metrics: { capacity: 7.68, used: 3.5, usage: 45.6, bw: 4500, iops: 680000 }, health: 'online' },
  { esn: 'D008', slot: 'Slot0', media: 'NL-SAS HDD', role: '主存盘', node: 'HN05', metrics: { capacity: 16.0, used: 14.8, usage: 92.5, bw: 150, iops: 3200 }, health: 'offline' },
]

const tenants = [
  { name: 'tenant-001', ep: 'ep-data-01', type: '生产', bucketCount: 4, objCount: 808000, used: 257.1, quota: 400, usage: 64.3, health: 'ok' },
  { name: 'tenant-002', ep: 'ep-backup-01, ep-media-01', type: '备份', bucketCount: 2, objCount: 113000, used: 197.9, quota: 300, usage: 66, health: 'ok' },
  { name: 'tenant-003', ep: 'ep-ai-01', type: '大数据', bucketCount: 2, objCount: 532000, used: 101.1, quota: 200, usage: 50.6, health: 'warn' },
  { name: 'tenant-004', ep: 'ep-log-01', type: '日志', bucketCount: 2, objCount: 24000, used: 18.6, quota: 50, usage: 37.2, health: 'ok' },
  { name: 'tenant-005', ep: 'ep-warehouse-01', type: '数仓', bucketCount: 1, objCount: 32000, used: 42.3, quota: 80, usage: 52.9, health: 'ok' },
  { name: 'tenant-006', ep: 'ep-cdn-01', type: 'CDN', bucketCount: 3, objCount: 156000, used: 72.1, quota: 100, usage: 72.1, health: 'warn' },
  { name: 'tenant-007', ep: 'ep-audit-01', type: '审计', bucketCount: 2, objCount: 98000, used: 28.2, quota: 60, usage: 47, health: 'ok' },
]

const tenantTop5 = [
  { name: 'tenant-log', ep: '企业项目-日志', type: '日志', bucketCount: 3, quota: 30, used: 28.2, usage: 94, successRate: 99.85, effectiveRate: 99.78, tps: '18.2k', outBw: '4.1 Gbps', inBw: '3.8 Gbps', health: 'crit' },
  { name: 'tenant-mrs', ep: '企业项目-大数据', type: '大数据', bucketCount: 4, quota: 200, used: 156, usage: 78, successRate: 99.98, effectiveRate: 99.92, tps: '32.6k', outBw: '8.5 Gbps', inBw: '6.2 Gbps', health: 'warn' },
  { name: 'tenant-media', ep: '企业项目-媒体', type: '媒体', bucketCount: 3, quota: 100, used: 72.1, usage: 72.1, successRate: 99.96, effectiveRate: 99.91, tps: '15.8k', outBw: '6.5 Gbps', inBw: '4.2 Gbps', health: 'warn' },
  { name: 'tenant-backup', ep: '企业项目-备份', type: '备份', bucketCount: 2, quota: 150, used: 98.5, usage: 65.7, successRate: 99.97, effectiveRate: 99.93, tps: '5.6k', outBw: '1.2 Gbps', inBw: '2.8 Gbps', health: 'ok' },
  { name: 'tenant-ai', ep: '企业项目-AI', type: 'AI', bucketCount: 5, quota: 400, used: 257.1, usage: 64.3, successRate: 99.99, effectiveRate: 99.95, tps: '28.4k', outBw: '12.3 Gbps', inBw: '9.8 Gbps', health: 'ok' },
]

const enterpriseProjects = [
  { id: 'EPS-001', name: '企业项目-大数据', desc: '大数据业务项目，包含数据仓库与计算分析相关资源', tenantCount: 2, used: 156, total: 200, usage: 78 },
  { id: 'EPS-002', name: '企业项目-日志', desc: '日志采集、存储与分析项目', tenantCount: 2, used: 28.2, total: 30, usage: 94 },
  { id: 'EPS-003', name: '企业项目-AI', desc: 'AI 训练与推理业务项目', tenantCount: 1, used: 257.1, total: 400, usage: 64.3 },
  { id: 'EPS-004', name: '企业项目-备份', desc: '数据备份与容灾项目', tenantCount: 1, used: 98.5, total: 150, usage: 65.7 },
  { id: 'EPS-005', name: '企业项目-媒体', desc: '音视频媒体存储与分发项目', tenantCount: 1, used: 72.1, total: 100, usage: 72.1 },
  { id: 'EPS-006', name: '企业项目-测试', desc: '测试环境资源项目', tenantCount: 1, used: 18.6, total: 50, usage: 37.2 },
  { id: 'EPS-007', name: '企业项目-归档', desc: '冷数据归档存储项目', tenantCount: 1, used: 42.3, total: 80, usage: 52.9 },
]

const donutColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']
const donutTotal = enterpriseProjects.reduce((s, d) => s + d.used, 0)
const donutData = enterpriseProjects
const donutSegments = computed(() => {
  const cx = 0, cy = 0, r = 70, inner = 45
  let startAngle = -Math.PI / 2
  return donutData.map((d) => {
    const angle = (d.used / donutTotal) * Math.PI * 2
    const endAngle = startAngle + angle
    const largeArc = angle > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
    const ix1 = cx + inner * Math.cos(endAngle), iy1 = cy + inner * Math.sin(endAngle)
    const ix2 = cx + inner * Math.cos(startAngle), iy2 = cy + inner * Math.sin(startAngle)
    const path = `M${x1},${y1} A${r},${r},0,${largeArc},1,${x2},${y2} L${ix1},${iy1} A${inner},${inner},0,${largeArc},0,${ix2},${iy2} Z`
    const color = donutColors[donutData.indexOf(d) % donutColors.length]
    startAngle = endAngle
    return { path, color }
  })
})

const barMaxVal = Math.max(...tenantTop5.map(t => t.used))
const barColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
const sortedTenants = [...tenantTop5].sort((a, b) => b.used - a.used)
const barData = computed(() => {
  const chartW = 300, chartH = 130, barW = 36, gap = 10
  const totalW = sortedTenants.length * barW + (sortedTenants.length - 1) * gap
  const startX = (320 - totalW) / 2
  return sortedTenants.map((t, i) => {
    const x = startX + i * (barW + gap)
    const h = (t.used / barMaxVal) * chartH
    return { x, y: chartH - h + 8, w: barW, h, v: t.used, n: t.name.replace('tenant-', ''), color: barColors[i % barColors.length] }
  })
})

const epsEndpoints = [
  { name: 'ep-data-01', tps: 4500, successRate: 99.99, bw: 2.8, lat: 3.2 },
  { name: 'ep-backup-01', tps: 800, successRate: 99.95, bw: 0.6, lat: 5.5 },
  { name: 'ep-media-01', tps: 2800, successRate: 99.98, bw: 1.8, lat: 2.1 },
  { name: 'ep-archive-01', tps: 600, successRate: 99.99, bw: 0.4, lat: 6.8 },
  { name: 'ep-ai-01', tps: 5600, successRate: 99.93, bw: 3.2, lat: 1.8 },
]

function genTrend(n, min, max) {
  return Array.from({ length: n }, (_, i) => ({
    time: i + '',
    value: +(min + Math.random() * (max - min)).toFixed(1)
  }))
}

function getClustersByRegion(regionId) {
  return clusters.filter(c => c.region === regionId)
}

function getStorageClustersByRegion(regionId) {
  const clusterIds = regions.find(r => r.id === regionId)?.clusters || []
  return storageClusters.filter(sc => clusterIds.includes(sc.cluster))
}

function getBucketsByCluster(clusterId) {
  return buckets.filter(b => b.cluster === clusterId)
}

const HEX_RANK = { crit: 0, warn: 1, ok: 2 }

function hexHealth(b) {
  return b.health === 'ok' ? 'hcx-ok' : b.health === 'warn' ? 'hcx-warn' : 'hcx-crit'
}

const HONEY_TARGET = 120

function makeHoneyBucket(clusterId, i) {
  const cluster = clusters.find(c => c.id === clusterId)
  const region = cluster ? cluster.region : 'region-001'
  const usage = [97, 93, 88, 84, 79, 74, 68, 62, 55, 48, 41, 33, 27, 21, 16, 12][i % 16]
  const health = usage >= 90 ? 'crit' : usage >= 80 ? 'warn' : 'ok'
  const bucketCount = 60 + i * 7
  return {
    name: `bucket-honey-${String(i + 1).padStart(2, '0')}`,
    createTime: '2026-08-10 09:00:00',
    region, cluster: clusterId,
    tenant: region === 'region-001' ? (i % 2 ? 'tenant-002' : 'tenant-001') : 'tenant-003',
    ep: region === 'region-001' ? 'ep-data-01' : 'ep-ai-01',
    type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '',
    metrics: { quota: 100, used: usage, usage, objCount: bucketCount * 1000, successRate: health === 'crit' ? 99.6 : 99.9, tps: 500 + i * 30, successTrend: genTrend(24, 99, 100), tpsTrend: genTrend(24, 400, 900), readBw: 40 + i * 8, readBwTrend: genTrend(24, 30, 120), lat: health === 'crit' ? 15 : 4, latTrend: genTrend(24, 2, 8), concurrency: 30 + i * 5, concurrencyTrend: genTrend(24, 20, 80) },
    health
  }
}

function honeycombRow(clusterId) {
  const real = buckets.filter(b => b.cluster === clusterId)
  const list = real.slice()
  for (let i = real.length; i < HONEY_TARGET; i++) list.push(makeHoneyBucket(clusterId, i))
  list.sort((a, b) => (HEX_RANK[a.health] ?? 0) - (HEX_RANK[b.health] ?? 0))
  return list
}

function getNodesByCluster(clusterId) {
  return nodes.filter(n => n.cluster === clusterId)
}

function getNodesByRegion(regionId) {
  return nodes.filter(n => n.region === regionId)
}

function getPoolsBySC(scId) {
  return storagePools.filter(p => p.sc === scId)
}

function getBucketsByPool(poolId) {
  const p = storagePools.find(x => x.id === poolId)
  if (!p) return []
  const sc = storageClusters.find(x => x.id === p.sc)
  return buckets.filter(b => b.cluster === sc?.cluster)
}

function getNodesByPool(poolId) {
  return nodes.filter(n => n.pool === poolId)
}

function getDisksByNode(nodeName) {
  return dataDisks.filter(d => d.node === nodeName)
}

function healthText(h) {
  return h === 'ok' ? '正常' : h === 'warn' ? '警告' : '严重'
}

function alarmLevelText(l) {
  return l === 'crit' ? '紧急' : l === 'warn' ? '重要' : l === 'minor' ? '次要' : '提示'
}

function alarmLevelColor(l) {
  return l === 'crit' ? '#f5222d' : l === 'warn' ? '#fa8c16' : l === 'minor' ? '#faad14' : '#1890ff'
}

const alarmSearch = ref('')
const alarmPage = ref(1)
const pageSize = ref(5)

const filteredAlarms = computed(() => {
  const q = alarmSearch.value.trim().toLowerCase()
  if (!q) return alarms
  return alarms.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.objType.toLowerCase().includes(q) ||
    a.objName.toLowerCase().includes(q)
  )
})

const pagedAlarms = computed(() => {
  const start = (alarmPage.value - 1) * pageSize.value
  return filteredAlarms.value.slice(start, start + pageSize.value)
})

function onAlarmSearch() {
  alarmPage.value = 1
}

function alarmRowClass(record) {
  return 'alarm-row-' + record.level
}

function alarmCustomRow(record) {
  return { onClick: () => openAlarmDrawer(record) }
}

const alarmColumns = [
  { title: '级别', dataIndex: 'level', width: 80, key: 'level' },
  { title: '告警标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '对象类型', dataIndex: 'objType', key: 'objType' },
  { title: '对象名称', dataIndex: 'objName', key: 'objName' },
  { title: '时间', dataIndex: 'time', key: 'time' },
]

const tenantSearch = ref('')
const filteredTenants = computed(() => {
  const q = tenantSearch.value.trim().toLowerCase()
  if (!q) return tenantTop5
  return tenantTop5.filter(t =>
    t.name.toLowerCase().includes(q) || t.ep.toLowerCase().includes(q)
  )
})

function onTenantSearch() {
}

function tenantCustomRow(record) {
  return { onClick: () => openTenantDrawer(record) }
}

const tenantColumns = [
  { title: '租户名称', dataIndex: 'name', key: 'name', width: 130 },
  { title: '企业项目', dataIndex: 'ep', key: 'ep', ellipsis: true },
  { title: '桶数量', dataIndex: 'bucketCount', key: 'bucketCount', width: 70 },
  { title: '总容量', key: 'quota', width: 80, customRender: ({ record }) => record.quota + ' TB' },
  { title: '使用量', key: 'used', width: 80, customRender: ({ record }) => record.used + ' TB' },
  { title: '使用率', dataIndex: 'usage', key: 'usage', width: 110 },
  { title: '服务成功率', dataIndex: 'successRate', key: 'successRate', width: 95 },
  { title: '有效请求率', dataIndex: 'effectiveRate', key: 'effectiveRate', width: 95 },
  { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 70 },
  { title: '流出带宽', dataIndex: 'outBw', key: 'outBw', width: 85 },
  { title: '流入带宽', dataIndex: 'inBw', key: 'inBw', width: 85 },
]

function percentColor(p) {
  return p >= 85 ? '#f5222d' : p >= 70 ? '#fa8c16' : '#52c41a'
}

function fmtCap(tb) {
  return tb >= 1024 ? (tb / 1024).toFixed(2) + ' PB' : Math.round(tb) + ' TB'
}

function diskStatusColor(s) {
  return s === 'online' ? '#52c41a' : s === 'degraded' ? '#fa8c16' : s === 'offline' ? '#f5222d' : '#1890ff'
}

function diskStatusText(s) {
  return s === 'online' ? '在线' : s === 'degraded' ? '降级' : s === 'offline' ? '离线' : s
}

function redundancyText(r) {
  return r === 'FUSION' ? 'FUSION（两 AZ）' : r === 'ONE_AZ' ? 'ONE_AZ（单 AZ）' : 'THREE_AZ（多 AZ）'
}

function bucketTypeText(t) {
  return t === 'OBJECT' ? '对象桶' : t === 'POSIX' ? '并行文件系统' : '别名桶'
}

function roleText(r) {
  const map = { OAM: '运维管理节点', FUSION: '融合节点', INDEX: '索引节点', PERSISTANCE_PERFORMANCE: '持久层性能节点', PERSISTANCE_CAPACITY: '持久层容量节点' }
  return map[r] || r
}

function roleShort(r) {
  if (r === 'OAM') return 'OAM'
  if (r === 'FUSION') return 'FUSION'
  if (r === 'INDEX') return 'INDEX'
  if (r === 'PERSISTANCE_PERFORMANCE') return 'PERF'
  if (r === 'PERSISTANCE_CAPACITY') return 'CAP'
  return r
}

function usageLevel(u) {
  return u >= 85 ? 'hex-red' : u >= 70 ? 'hex-orange' : 'hex-green'
}

function poolStatusText(s) {
  return s === 'normal' ? '正常' : s === 'degraded' ? '降级' : '迁移中'
}

function useHelpers() {
  return { healthText, alarmLevelText, alarmLevelColor, percentColor, redundancyText, bucketTypeText, roleText, poolStatusText, diskStatusColor, diskStatusText, regions, storageClusters, dataDisks, getDisksByNode: (n) => dataDisks.filter(d => d.node === n) }
}

const drawerOpen = ref(false)
const drawerStack = ref([])
const drawerComponent = shallowRef(null)
const drawerProps = ref({})

const drawerBreadcrumb = computed(() => {
  return drawerStack.value.map(d => d.label)
})

function openDrawer(component, props, label) {
  drawerStack.value.push({ component, props, label })
  drawerComponent.value = markRaw(component)
  drawerProps.value = props
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  drawerStack.value = []
  drawerComponent.value = null
  drawerProps.value = {}
}

function drawerBack() {
  if (drawerStack.value.length <= 1) {
    closeDrawer()
    return
  }
  drawerStack.value.pop()
  const prev = drawerStack.value[drawerStack.value.length - 1]
  drawerComponent.value = markRaw(prev.component)
  drawerProps.value = prev.props
}

function handleDrawerNavigate({ component, props, label }) {
  openDrawer(component, props, label)
}

function openStatDrawer(s) {
  let items = []
  let label = s.label.split('(')[0].trim()
  let detailComponent = null
  let detailProps = null
  if (label.includes('区域')) {
    items = regions.map(r => ({
      id: r.id,
      regionId: r.domain.replace(/^obs\./, '').replace(/\.myhuaweicloud\.com$/, ''),
      name: r.name,
      domain: r.domain,
      usage: r.metrics.phyPercent,
      health: r.health
    }))
    label = '区域列表'
    detailComponent = RegionDetail
    detailProps = (item) => {
      const r = regions.find(x => x.id === item.id)
      return { region: r, getClustersByRegion, getStorageClustersByRegion, clusters, storageClusters, storagePools, buckets, nodes, dataDisks, alarms }
    }
  }
  else if (label.includes('业务集群')) {
    items = clusters.map(c => ({
      id: c.id,
      name: c.name,
      region: regions.find(r => r.id === c.region)?.name || c.region,
      redundancy: redundancyText(c.redundancy),
      health: c.health
    }))
    label = '集群列表'
    detailComponent = ClusterDetail
    detailProps = (item) => {
      const c = clusters.find(x => x.id === item.id)
      return { cluster: c, getBucketsByCluster, getNodesByCluster, buckets, nodes, dataDisks, alarms }
    }
  }
  else if (label.includes('存储集群')) {
    items = storageClusters.map(s => ({
      id: s.id,
      name: s.name,
      ctrlNodeCount: s.ctrlNodeCount,
      poolCount: s.poolCount,
      health: s.health
    }))
    label = '存储集群列表'
    detailComponent = SCDetail
    detailProps = (item) => {
      const s = storageClusters.find(x => x.id === item.id)
      return { sc: s, getPoolsBySC, storagePools, alarms }
    }
  }
  else if (label.includes('存储池')) {
    items = storagePools.map(p => ({
      id: p.id,
      name: p.name,
      safety: p.safety,
      usage: p.metrics.phyPercent,
      health: p.health
    }))
    label = '存储池列表'
    detailComponent = PoolDetail
    detailProps = (item) => {
      const p = storagePools.find(x => x.id === item.id)
      return { pool: p, buckets: getBucketsByPool(p.id), alarms }
    }
  }
  else if (label.includes('节点')) {
    items = nodes.map(n => ({
      id: n.name,
      name: n.name,
      role: roleShort(n.role),
      cluster: clusters.find(c => c.id === n.cluster)?.name || n.cluster,
      cpu: n.metrics.cpu,
      mem: n.metrics.mem,
      health: n.health
    }))
    label = '节点列表'
    detailComponent = NodeDetail
    detailProps = (item) => {
      const n = nodes.find(x => x.name === item.id)
      return { node: n, dataDisks, alarms }
    }
  }
  else if (label.includes('数据盘')) {
    items = dataDisks.map(d => ({
      id: d.esn,
      esn: d.esn,
      media: d.media,
      role: d.role,
      node: d.node,
      status: d.health
    }))
    label = '数据盘列表'
    detailComponent = DiskDetail
    detailProps = (item) => {
      const d = dataDisks.find(x => x.esn === item.id)
      const n = nodes.find(x => x.name === d.node)
      return { disk: d, node: n, alarms }
    }
  }
  else if (label.includes('桶')) {
    items = buckets.slice(0, 200).map(b => ({
      id: b.name,
      name: b.name,
      type: bucketTypeText(b.type),
      cluster: clusters.find(c => c.id === b.cluster)?.name || b.cluster,
      usage: b.metrics.usage,
      health: b.health
    }))
    label = '桶列表'
    detailComponent = BucketDetail
    detailProps = (item) => {
      const b = buckets.find(x => x.name === item.id)
      return { bucket: b, alarms }
    }
  }
  else if (label.includes('租户')) {
    items = tenants.map(t => ({
      id: t.name,
      name: t.name,
      ep: t.ep,
      type: t.type,
      bucketCount: t.bucketCount,
      usage: t.usage,
      health: t.health
    }))
    label = '租户列表'
    detailComponent = TenantDetail
    detailProps = (item) => {
      const t = tenants.find(x => x.name === item.id)
      return { tenant: t, buckets, tenantTop5 }
    }
  }
  else if (label.includes('企业项目')) {
    items = enterpriseProjects.map(ep => ({
      id: ep.id,
      name: ep.name,
      desc: ep.desc,
      tenantCount: ep.tenantCount,
      usage: ep.usage
    }))
    label = '企业项目列表'
    detailComponent = EnterpriseProjectDetail
    detailProps = (item) => {
      const ep = enterpriseProjects.find(x => x.id === item.id)
      return { ep, tenants, buckets }
    }
  }
  else if (label.includes('对象')) {
    items = buckets.slice(0, 200).map(b => ({
      id: b.name,
      name: b.name,
      type: bucketTypeText(b.type),
      cluster: clusters.find(c => c.id === b.cluster)?.name || b.cluster,
      usage: b.metrics.usage,
      health: b.health
    }))
    label = '桶列表'
    detailComponent = BucketDetail
    detailProps = (item) => {
      const b = buckets.find(x => x.name === item.id)
      return { bucket: b, alarms }
    }
  }
  if (label.includes('区域')) {
    openDrawer(RegionListDrawer, { items, type: label, detailComponent, detailProps }, label)
  } else {
    openDrawer(StatListDrawer, { items, type: label, detailComponent, detailProps }, label)
  }
}

function openRegionDrawer(r) {
  openDrawer(RegionDetail, { region: r, getClustersByRegion, getStorageClustersByRegion, clusters, storageClusters, storagePools, buckets, nodes, dataDisks, alarms }, r.name)
}

function openClusterDrawer(c) {
  openDrawer(ClusterDetail, { cluster: c, getBucketsByCluster, getNodesByCluster, buckets, nodes, dataDisks, alarms }, c.name)
}

function openSCDrawer(sc) {
  openDrawer(SCDetail, { sc, getPoolsBySC, storagePools, alarms }, sc.name)
}

function openAlarmDrawer(a) {
  openDrawer(AlarmDetail, { alarm: a }, a.title)
}

function openTenantDrawer(t) {
  openDrawer(TenantDetail, { tenant: t, buckets, tenantTop5 }, t.name)
}

function openNodeDrawer(n) {
  openDrawer(NodeDetail, { node: n, dataDisks, alarms }, n.name)
}

function openBucketDrawer(b) {
  openDrawer(BucketDetail, { bucket: b, alarms }, b.name)
}

const LIST_COLUMNS = {
  '集群列表': [
    { title: '集群ID', dataIndex: 'id', key: 'id', width: 110 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '区域', dataIndex: 'region', key: 'region', width: 120 },
    { title: '冗余', dataIndex: 'redundancy', key: 'redundancy', width: 150 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '存储集群列表': [
    { title: '集群ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '控制节点', dataIndex: 'ctrlNodeCount', key: 'ctrlNodeCount', width: 100 },
    { title: '存储池', dataIndex: 'poolCount', key: 'poolCount', width: 90 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '存储池列表': [
    { title: '池ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '安全级别', dataIndex: 'safety', key: 'safety', width: 100 },
    { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '节点列表': [
    { title: '节点名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
    { title: '集群', dataIndex: 'cluster', key: 'cluster' },
    { title: 'CPU', dataIndex: 'cpu', key: 'cpu', width: 90 },
    { title: '内存', dataIndex: 'mem', key: 'mem', width: 90 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '数据盘列表': [
    { title: 'ESN', dataIndex: 'esn', key: 'esn', width: 100 },
    { title: '介质', dataIndex: 'media', key: 'media' },
    { title: '角色', dataIndex: 'role', key: 'role', width: 90 },
    { title: '节点', dataIndex: 'node', key: 'node', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  ],
  '桶列表': [
    { title: '桶名', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 130 },
    { title: '集群', dataIndex: 'cluster', key: 'cluster' },
    { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '租户列表': [
    { title: '租户名', dataIndex: 'name', key: 'name' },
    { title: '企业项目', dataIndex: 'ep', key: 'ep', width: 200 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
    { title: '桶数', dataIndex: 'bucketCount', key: 'bucketCount', width: 80 },
    { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
    { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
  ],
  '企业项目列表': [
    { title: 'EPS ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true },
    { title: '租户数', dataIndex: 'tenantCount', key: 'tenantCount', width: 90 },
    { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
  ],
}

const StatListDrawer = {
  props: ['items', 'type', 'detailComponent', 'detailProps'],
  template: `<div class="drawer-content">
    <a-input v-model:value="keyword" placeholder="搜索..." allow-clear class="rld-input" style="width: 240px; margin-bottom: 12px;" />
    <a-table :data-source="filtered" :columns="columns" :pagination="false" :row-key="rowKey" size="middle" :custom-row="rowClick">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="handleClick(record)">{{ record.name }}</a></template>
        <template v-else-if="column.key === 'esn'"><a class="rld-link" @click.stop="handleClick(record)">{{ record.esn }}</a></template>
        <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        <template v-else-if="column.key === 'status'"><a-tag :color="diskStatusColor(record.status)">{{ diskStatusText(record.status) }}</a-tag></template>
        <template v-else-if="column.key === 'usage'"><span class="rld-usage"><span class="rld-usage-fill" :style="{ width: record.usage + '%' }"></span></span><span class="rld-usage-text">{{ record.usage }}%</span></template>
        <template v-else-if="column.key === 'cpu' || column.key === 'mem'">{{ record[column.key] }}%</template>
      </template>
    </a-table>
  </div>`,
  setup(props, { emit }) {
    const keyword = ref('')
    const columns = computed(() => LIST_COLUMNS[props.type] || [])
    const filtered = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return props.items
      return props.items.filter(it => JSON.stringify(it).toLowerCase().includes(kw))
    })
    function rowKey(record) {
      return record.id || record.esn || record.name || Math.random()
    }
    function handleClick(item) {
      if (props.detailComponent && props.detailProps) {
        emit('navigate', { component: props.detailComponent, props: props.detailProps(item), label: item.name || item.id })
      }
    }
    function rowClick(record) {
      return { onClick: () => handleClick(record) }
    }
    function healthColor(h) {
      return h === 'ok' ? 'green' : h === 'warn' ? 'orange' : 'red'
    }
    return { keyword, columns, filtered, rowKey, handleClick, rowClick, healthText, healthColor, diskStatusColor, diskStatusText }
  }
}

const RegionListDrawer = {
  props: ['items', 'type', 'detailComponent', 'detailProps'],
  template: `<div class="drawer-content">
    <a-input v-model:value="keyword" placeholder="搜索..." allow-clear class="rld-input" style="width: 240px; margin-bottom: 0px;" />
    <a-table :data-source="filtered" :columns="columns" :pagination="false" row-key="id" size="middle" :custom-row="rowClick">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'regionId'"><span class="rld-region-id">{{ record.regionId }}</span></template>
        <template v-else-if="column.key === 'name'"><a class="rld-link" @click.stop="handleClick(record)">{{ record.name }}</a></template>
        <template v-else-if="column.key === 'domain'"><span class="rld-domain">{{ record.domain }}</span></template>
        <template v-else-if="column.key === 'usage'"><span class="rld-usage"><span class="rld-usage-fill" :style="{ width: record.usage + '%' }"></span></span><span class="rld-usage-text">{{ record.usage }}%</span></template>
        <template v-else-if="column.key === 'health'"><a-tag :color="record.health === 'ok' ? 'green' : record.health === 'warn' ? 'orange' : 'red'">{{ healthText(record.health) }}</a-tag></template>
      </template>
    </a-table>
  </div>`,
  setup(props, { emit }) {
    const keyword = ref('')
    const columns = [
      { title: '区域ID', dataIndex: 'regionId', key: 'regionId', width: 150 },
      { title: '区域名称', dataIndex: 'name', key: 'name', width: 140 },
      { title: '域名', dataIndex: 'domain', key: 'domain' },
      { title: '容量使用', dataIndex: 'usage', key: 'usage', width: 160 },
      { title: '健康', dataIndex: 'health', key: 'health', width: 90 },
    ]
    const filtered = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return props.items
      return props.items.filter(it => (it.regionId + it.name + it.domain).toLowerCase().includes(kw))
    })
    function handleClick(item) {
      if (props.detailComponent && props.detailProps) {
        emit('navigate', { component: props.detailComponent, props: props.detailProps(item), label: item.name || item.id })
      }
    }
    function rowClick(record) {
      return { onClick: () => handleClick(record) }
    }
    return { keyword, columns, filtered, handleClick, rowClick, healthText }
  }
}

const RegionDetail = {
  props: ['region', 'getClustersByRegion', 'getStorageClustersByRegion', 'clusters', 'storageClusters', 'storagePools', 'buckets', 'nodes', 'dataDisks', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">区域名称</span><span class="dii-value">{{ region.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">域名</span><span class="dii-value">{{ region.domain }}</span></div>
        <div class="detail-info-item"><span class="dii-label">健康状态</span><span class="dii-value"><span class="health-tag" :class="region.health">{{ healthText(region.health) }}</span></span></div>
        <div class="detail-info-item"><span class="dii-label">默认区域</span><span class="dii-value">{{ region.isDefault ? '是' : '否' }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量统计</h4>
      <div class="detail-cap-row"><span>逻辑容量</span><span>{{ region.metrics.logicUsed }}/{{ region.metrics.logicTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: region.metrics.logicPercent + '%', background: percentColor(region.metrics.logicPercent) }"></div></div><span>{{ region.metrics.logicPercent }}%</span></div>
      <div class="detail-cap-row"><span>物理容量</span><span>{{ region.metrics.phyUsed }}/{{ region.metrics.phyTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: region.metrics.phyPercent + '%', background: percentColor(region.metrics.phyPercent) }"></div></div><span>{{ region.metrics.phyPercent }}%</span></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">业务集群（{{ clusters.length }}）</h4>
      <div class="cluster-card-list">
        <div class="cluster-card" v-for="c in clusters" :key="c.id" @click="emit('navigate', { component: ClusterDetail, props: { cluster: c, getBucketsByCluster, getNodesByCluster, buckets, nodes, dataDisks, alarms }, label: c.name })">
          <div class="cluster-card-hdr">{{ c.name }}<span class="health-tag-sm" :class="c.health">{{ healthText(c.health) }}</span></div>
          <div class="cluster-card-domain">{{ c.domain }}</div>
          <div class="cluster-card-info"><span>冗余: {{ redundancyText(c.redundancy) }}</span><span>桶: {{ c.buckets }}</span><span>节点: {{ c.nodes }}</span></div>
          <div class="cluster-card-cap"><span>逻辑: {{ c.metrics.logicUsed }}/{{ c.metrics.logicTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: c.metrics.logicPercent + '%', background: percentColor(c.metrics.logicPercent) }"></div></div></div>
          <div class="cluster-card-cap"><span>物理: {{ c.metrics.phyUsed }}/{{ c.metrics.phyTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: c.metrics.phyPercent + '%', background: percentColor(c.metrics.phyPercent) }"></div></div></div>
          <div class="cluster-card-metrics"><span>TPS: {{ c.metrics.tps }}</span><span>延迟: {{ c.metrics.lat }}ms</span><span>成功率: {{ c.metrics.successRate }}%</span></div>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">存储集群（{{ storageClusters.length }}）</h4>
      <div class="sc-card-list">
        <div class="sc-card" v-for="sc in storageClusters" :key="sc.id" @click="emit('navigate', { component: SCDetail, props: { sc, getPoolsBySC: getPoolsBySC, storagePools, alarms }, label: sc.name })">
          <div class="sc-card-hdr">{{ sc.name }}<span class="health-tag-sm" :class="sc.health">{{ healthText(sc.health) }}</span></div>
          <div class="sc-card-info"><span>控制节点: {{ sc.ctrlNodeCount }}</span><span>存储池: {{ sc.poolCount }}</span></div>
        </div>
      </div>
    </div>
  </div>`,
  setup(props, { emit }) {
    return { emit, ClusterDetail, SCDetail, ...useHelpers() }
  }
}

const ClusterDetail = {
  props: ['cluster', 'getBucketsByCluster', 'getNodesByCluster', 'buckets', 'nodes', 'dataDisks', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">集群名称</span><span class="dii-value">{{ cluster.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">域名</span><span class="dii-value">{{ cluster.domain }}</span></div>
        <div class="detail-info-item"><span class="dii-label">冗余策略</span><span class="dii-value">{{ redundancyText(cluster.redundancy) }}</span></div>
        <div class="detail-info-item"><span class="dii-label">可用区</span><span class="dii-value">{{ cluster.az }}</span></div>
        <div class="detail-info-item"><span class="dii-label">管理 VIP</span><span class="dii-value">{{ cluster.mgmtVip }}</span></div>
        <div class="detail-info-item"><span class="dii-label">业务 VIP</span><span class="dii-value">{{ cluster.bizVip }}</span></div>
        <div class="detail-info-item"><span class="dii-label">公网 VIP</span><span class="dii-value">{{ cluster.pubVip }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属区域</span><span class="dii-value">{{ regions.find(r => r.id === cluster.region)?.name || cluster.region }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量统计</h4>
      <div class="detail-cap-row"><span>逻辑容量</span><span>{{ cluster.metrics.logicUsed }}/{{ cluster.metrics.logicTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: cluster.metrics.logicPercent + '%', background: percentColor(cluster.metrics.logicPercent) }"></div></div><span>{{ cluster.metrics.logicPercent }}%</span></div>
      <div class="detail-cap-row"><span>物理容量</span><span>{{ cluster.metrics.phyUsed }}/{{ cluster.metrics.phyTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: cluster.metrics.phyPercent + '%', background: percentColor(cluster.metrics.phyPercent) }"></div></div><span>{{ cluster.metrics.phyPercent }}%</span></div>
      <div class="detail-cap-row"><span>对象数量</span><span>{{ cluster.objCount.toLocaleString() }}</span></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">性能指标</h4>
      <div class="perf-grid">
        <div class="perf-item"><span class="perf-label">成功率</span><span class="perf-value" :style="{ color: cluster.metrics.successRate >= 99.9 ? '#52c41a' : '#fa8c16' }">{{ cluster.metrics.successRate }}%</span></div>
        <div class="perf-item"><span class="perf-label">有效请求率</span><span class="perf-value">{{ cluster.metrics.effectiveRate }}%</span></div>
        <div class="perf-item"><span class="perf-label">TPS</span><span class="perf-value">{{ cluster.metrics.tps.toLocaleString() }}</span></div>
        <div class="perf-item"><span class="perf-label">带宽</span><span class="perf-value">{{ cluster.metrics.bw }} GB/s</span></div>
        <div class="perf-item"><span class="perf-label">延迟</span><span class="perf-value">{{ cluster.metrics.lat }} ms</span></div>
        <div class="perf-item"><span class="perf-label">并发数</span><span class="perf-value">{{ cluster.metrics.concurrency }}</span></div>
        <div class="perf-item"><span class="perf-label">连接数</span><span class="perf-value">{{ cluster.metrics.conns }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">桶列表（前 50）</h4>
      <a-table :data-source="bucketsOfCluster" :columns="bucketCols" :pagination="false" row-key="name" size="small" :custom-row="bucketRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="emit('navigate', { component: BucketDetail, props: { bucket: record, alarms }, label: record.name })">{{ record.name }}</a></template>
          <template v-else-if="column.key === 'type'">{{ bucketTypeText(record.type) }}</template>
          <template v-else-if="column.key === 'usage'"><span class="rld-usage"><span class="rld-usage-fill" :style="{ width: record.metrics.usage + '%' }"></span></span><span class="rld-usage-text">{{ record.metrics.usage }}%</span></template>
          <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        </template>
      </a-table>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">节点列表</h4>
      <a-table :data-source="nodesOfCluster" :columns="nodeCols" :pagination="false" row-key="name" size="small" :custom-row="nodeRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="emit('navigate', { component: NodeDetail, props: { node: record, dataDisks, alarms }, label: record.name })">{{ record.name }}</a></template>
          <template v-else-if="column.key === 'role'">{{ roleText(record.role) }}</template>
          <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        </template>
      </a-table>
    </div>
  </div>`,
  setup(props, { emit }) {
    const bucketsOfCluster = computed(() => props.getBucketsByCluster(props.cluster.id).slice(0, 50))
    const nodesOfCluster = computed(() => props.getNodesByCluster(props.cluster.id))
    const bucketCols = [
      { title: '桶名', dataIndex: 'name', key: 'name' },
      { title: '类型', dataIndex: 'type', key: 'type', width: 130 },
      { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
      { title: '健康状态', dataIndex: 'health', key: 'health', width: 90 },
    ]
    const nodeCols = [
      { title: '节点名', dataIndex: 'name', key: 'name' },
      { title: '角色', dataIndex: 'role', key: 'role' },
      { title: '健康状态', dataIndex: 'health', key: 'health', width: 100 },
    ]
    function bucketRowClick(record) {
      return { onClick: () => emit('navigate', { component: BucketDetail, props: { bucket: record, alarms: props.alarms }, label: record.name }) }
    }
    function nodeRowClick(record) {
      return { onClick: () => emit('navigate', { component: NodeDetail, props: { node: record, dataDisks: props.dataDisks, alarms: props.alarms }, label: record.name }) }
    }
    function healthColor(h) {
      return h === 'ok' ? 'green' : h === 'warn' ? 'orange' : 'red'
    }
    return { emit, bucketsOfCluster, nodesOfCluster, bucketCols, nodeCols, bucketRowClick, nodeRowClick, healthColor, BucketDetail, NodeDetail, ...useHelpers() }
  }
}

const NodeDetail = {
  props: ['node', 'dataDisks', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">节点名称</span><span class="dii-value">{{ node.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">节点角色</span><span class="dii-value">{{ roleText(node.role) }}</span></div>
        <div class="detail-info-item"><span class="dii-label">管理 IP</span><span class="dii-value">{{ node.mgmtIp }}</span></div>
        <div class="detail-info-item"><span class="dii-label">业务 IP</span><span class="dii-value">{{ node.bizIp }}</span></div>
        <div class="detail-info-item"><span class="dii-label">存储 IP</span><span class="dii-value">{{ node.storIp }}</span></div>
        <div class="detail-info-item"><span class="dii-label">控制 IP</span><span class="dii-value">{{ node.ctrlIp }}</span></div>
        <div class="detail-info-item"><span class="dii-label">机柜位置</span><span class="dii-value">{{ node.rack }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属集群</span><span class="dii-value">{{ node.cluster }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属存储池</span><span class="dii-value">{{ node.pool }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">资源使用率</h4>
      <div class="resource-bars">
        <div class="resource-bar-item"><span class="rb-label">CPU</span><div class="rb-bar"><div class="rb-fill" :style="{ width: node.metrics.cpu + '%', background: percentColor(node.metrics.cpu) }"></div></div><span class="rb-value">{{ node.metrics.cpu }}%</span></div>
        <div class="resource-bar-item"><span class="rb-label">内存</span><div class="rb-bar"><div class="rb-fill" :style="{ width: node.metrics.mem + '%', background: percentColor(node.metrics.mem) }"></div></div><span class="rb-value">{{ node.metrics.mem }}%</span></div>
        <div class="resource-bar-item"><span class="rb-label">磁盘</span><div class="rb-bar"><div class="rb-fill" :style="{ width: node.metrics.disk + '%', background: percentColor(node.metrics.disk) }"></div></div><span class="rb-value">{{ node.metrics.disk }}%</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">性能指标</h4>
      <div class="perf-grid">
        <div class="perf-item"><span class="perf-label">成功率</span><span class="perf-value">{{ node.metrics.successRate }}%</span></div>
        <div class="perf-item"><span class="perf-label">TPS</span><span class="perf-value">{{ node.metrics.tps.toLocaleString() }}</span></div>
        <div class="perf-item"><span class="perf-label">带宽</span><span class="perf-value">{{ node.metrics.bw }} GB/s</span></div>
        <div class="perf-item"><span class="perf-label">延迟</span><span class="perf-value">{{ node.metrics.lat }} ms</span></div>
        <div class="perf-item"><span class="perf-label">并发数</span><span class="perf-value">{{ node.metrics.concurrency }}</span></div>
        <div class="perf-item"><span class="perf-label">连接数</span><span class="perf-value">{{ node.metrics.conns }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">进程列表</h4>
      <a-table :data-source="node.processes" :columns="procCols" :pagination="false" row-key="pid" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'"><a-tag :color="record.status === 'normal' ? 'green' : 'orange'">{{ record.status === 'normal' ? '正常' : '告警' }}</a-tag></template>
          <template v-else-if="column.key === 'cpu'">{{ record.cpu }}%</template>
          <template v-else-if="column.key === 'mem'">{{ record.mem }}%</template>
        </template>
      </a-table>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">数据盘列表</h4>
      <div class="disk-card-grid">
        <div class="disk-card" v-for="d in getDisksByNode(node.name)" :key="d.esn" @click="emit('navigate', { component: DiskDetail, props: { disk: d, node, alarms }, label: d.esn })">
          <div class="disk-card-hdr">{{ d.slot }}<span class="disk-status" :style="{ background: diskStatusColor(d.health) }">{{ diskStatusText(d.health) }}</span></div>
          <div class="disk-card-info"><span>{{ d.media }}</span><span>{{ d.role }}</span></div>
          <div class="disk-card-cap"><span>{{ d.metrics.capacity }} TB</span><span>已用 {{ d.metrics.used }} TB</span><span>{{ d.metrics.usage }}%</span></div>
          <div class="disk-card-cap"><span>带宽 {{ d.metrics.bw }} MB/s</span><span>IOPS {{ d.metrics.iops.toLocaleString() }}</span></div>
        </div>
      </div>
    </div>
  </div>`,
  setup(props, { emit }) {
    const procCols = [
      { title: '进程名称', dataIndex: 'name', key: 'name' },
      { title: 'PID', dataIndex: 'pid', key: 'pid', width: 80 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
      { title: 'CPU%', dataIndex: 'cpu', key: 'cpu', width: 90 },
      { title: '内存%', dataIndex: 'mem', key: 'mem', width: 90 },
    ]
    return { emit, procCols, DiskDetail, ...useHelpers() }
  }
}

const SCDetail = {
  props: ['sc', 'getPoolsBySC', 'storagePools', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">存储集群名称</span><span class="dii-value">{{ sc.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">控制节点数</span><span class="dii-value">{{ sc.ctrlNodeCount }}</span></div>
        <div class="detail-info-item"><span class="dii-label">存储池数量</span><span class="dii-value">{{ sc.poolCount }}</span></div>
        <div class="detail-info-item"><span class="dii-label">健康状态</span><span class="dii-value"><span class="health-tag" :class="sc.health">{{ healthText(sc.health) }}</span></span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">存储池列表</h4>
      <div class="pool-card-list">
        <div class="pool-card" v-for="p in getPoolsBySC(sc.id)" :key="p.id" @click="emit('navigate', { component: PoolDetail, props: { pool: p, alarms }, label: p.name })">
          <div class="pool-card-hdr">{{ p.name }}<span class="pool-status" :class="p.health">{{ poolStatusText(p.health) }}</span></div>
          <div class="pool-card-info"><span>安全级别: {{ p.safety }}</span><span>EC: {{ p.ecRatio }}</span><span>{{ redundancyText(p.redundancy) }}</span></div>
          <div class="pool-card-info"><span>缓存: {{ p.cacheDisk }}</span><span>主存: {{ p.mainDisk }}</span></div>
          <div class="pool-card-cap"><span>物理: {{ p.metrics.phyUsed }}/{{ p.metrics.phyTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: p.metrics.phyPercent + '%', background: percentColor(p.metrics.phyPercent) }"></div></div><span>{{ p.metrics.phyPercent }}%</span></div>
          <div class="pool-card-metrics"><span>IOPS: {{ p.metrics.iops.toLocaleString() }}</span><span>延迟: {{ p.metrics.lat }}ms</span></div>
        </div>
      </div>
    </div>
  </div>`,
  setup(props, { emit }) {
    return { emit, PoolDetail, ...useHelpers() }
  }
}

const PoolDetail = {
  props: ['pool', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">存储池名称</span><span class="dii-value">{{ pool.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">安全级别</span><span class="dii-value">{{ pool.safety }}</span></div>
        <div class="detail-info-item"><span class="dii-label">EC 比例</span><span class="dii-value">{{ pool.ecRatio }}</span></div>
        <div class="detail-info-item"><span class="dii-label">冗余策略</span><span class="dii-value">{{ redundancyText(pool.redundancy) }}</span></div>
        <div class="detail-info-item"><span class="dii-label">缓存盘类型</span><span class="dii-value">{{ pool.cacheDisk }}</span></div>
        <div class="detail-info-item"><span class="dii-label">主存盘类型</span><span class="dii-value">{{ pool.mainDisk }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属存储集群</span><span class="dii-value">{{ storageClusters.find(s => s.id === pool.sc)?.name || pool.sc }}</span></div>
        <div class="detail-info-item"><span class="dii-label">状态</span><span class="dii-value"><span class="pool-status" :class="pool.health">{{ poolStatusText(pool.health) }}</span></span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量统计</h4>
      <div class="detail-cap-row"><span>物理容量</span><span>{{ pool.metrics.phyUsed }}/{{ pool.metrics.phyTotal }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: pool.metrics.phyPercent + '%', background: percentColor(pool.metrics.phyPercent) }"></div></div><span>{{ pool.metrics.phyPercent }}%</span></div>
      <div class="detail-cap-row"><span>对象数量</span><span>{{ pool.metrics.objCount }}</span></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">性能指标</h4>
      <div class="perf-grid">
        <div class="perf-item"><span class="perf-label">读取带宽</span><span class="perf-value">{{ pool.metrics.readBw }} MB/s</span></div>
        <div class="perf-item"><span class="perf-label">写入带宽</span><span class="perf-value">{{ pool.metrics.writeBw }} MB/s</span></div>
        <div class="perf-item"><span class="perf-label">IOPS</span><span class="perf-value">{{ pool.metrics.iops }}</span></div>
        <div class="perf-item"><span class="perf-label">延迟</span><span class="perf-value">{{ pool.metrics.lat }} ms</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">所属节点</h4>
      <a-table :data-source="poolNodes" :columns="nodeCols" :pagination="false" row-key="name" size="small" :custom-row="nodeRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="emit('navigate', { component: NodeDetail, props: { node: record, dataDisks, alarms }, label: record.name })">{{ record.name }}</a></template>
          <template v-else-if="column.key === 'role'">{{ roleText(record.role) }}</template>
          <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        </template>
      </a-table>
    </div>
  </div>`,
  setup(props, { emit }) {
    const poolNodes = computed(() => getNodesByPool(props.pool.id))
    const nodeCols = [
      { title: '节点名', dataIndex: 'name', key: 'name' },
      { title: '角色', dataIndex: 'role', key: 'role' },
      { title: '健康状态', dataIndex: 'health', key: 'health', width: 100 },
    ]
    function nodeRowClick(record) {
      return { onClick: () => emit('navigate', { component: NodeDetail, props: { node: record, dataDisks, alarms: props.alarms }, label: record.name }) }
    }
    function healthColor(h) {
      return h === 'ok' ? 'green' : h === 'warn' ? 'orange' : 'red'
    }
    return { emit, poolNodes, nodeCols, nodeRowClick, healthColor, NodeDetail, ...useHelpers() }
  }
}

const BucketDetail = {
  props: ['bucket', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">桶名称</span><span class="dii-value">{{ bucket.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">创建时间</span><span class="dii-value">{{ bucket.createTime }}</span></div>
        <div class="detail-info-item"><span class="dii-label">桶类型</span><span class="dii-value">{{ bucketTypeText(bucket.type) }}</span></div>
        <div class="detail-info-item"><span class="dii-label">冗余策略</span><span class="dii-value">{{ redundancyText(bucket.redundancy) }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属区域</span><span class="dii-value">{{ regions.find(r => r.id === bucket.region)?.name || bucket.region }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属集群</span><span class="dii-value">{{ bucket.cluster }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属租户</span><span class="dii-value">{{ bucket.tenant }}</span></div>
        <div class="detail-info-item"><span class="dii-label">EPS 端点</span><span class="dii-value">{{ bucket.ep }}</span></div>
        <div class="detail-info-item" v-if="bucket.aliasTarget"><span class="dii-label">别名目标</span><span class="dii-value">{{ bucket.aliasTarget }}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量统计</h4>
      <div class="detail-cap-row"><span>配额</span><span>{{ bucket.metrics.quota }} TB</span></div>
      <div class="detail-cap-row"><span>已用</span><span>{{ bucket.metrics.used }} TB</span></div>
      <div class="detail-cap-row"><span>使用率</span><span>{{ bucket.metrics.usage }}%</span><div class="cap-bar"><div class="cap-fill" :style="{ width: bucket.metrics.usage + '%', background: percentColor(bucket.metrics.usage) }"></div></div></div>
      <div class="detail-cap-row"><span>对象数量</span><span>{{ bucket.metrics.objCount.toLocaleString() }}</span></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">性能指标</h4>
      <div class="perf-grid">
        <div class="perf-item"><span class="perf-label">成功率</span><span class="perf-value">{{ bucket.metrics.successRate }}%</span></div>
        <div class="perf-item"><span class="perf-label">TPS</span><span class="perf-value">{{ bucket.metrics.tps }}</span></div>
        <div class="perf-item"><span class="perf-label">读取带宽</span><span class="perf-value">{{ bucket.metrics.readBw }} MB/s</span></div>
        <div class="perf-item"><span class="perf-label">延迟</span><span class="perf-value">{{ bucket.metrics.lat }} ms</span></div>
        <div class="perf-item"><span class="perf-label">并发数</span><span class="perf-value">{{ bucket.metrics.concurrency }}</span></div>
      </div>
    </div>
  </div>`,
  setup(props) {
    return { emit: () => {}, ...useHelpers() }
  }
}

const AlarmDetail = {
  props: ['alarm'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">告警信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">告警 ID</span><span class="dii-value">{{ alarm.id }}</span></div>
        <div class="detail-info-item"><span class="dii-label">告警级别</span><span class="dii-value"><span class="alarm-level-tag" :class="alarm.level" :style="{ background: alarmLevelColor(alarm.level), color: '#fff' }">{{ alarmLevelText(alarm.level) }}</span></span></div>
        <div class="detail-info-item"><span class="dii-label">告警标题</span><span class="dii-value">{{ alarm.title }}</span></div>
        <div class="detail-info-item"><span class="dii-label">告警描述</span><span class="dii-value">{{ alarm.desc }}</span></div>
        <div class="detail-info-item"><span class="dii-label">对象类型</span><span class="dii-value">{{ alarm.objType }}</span></div>
        <div class="detail-info-item"><span class="dii-label">对象名称</span><span class="dii-value">{{ alarm.objName }}</span></div>
        <div class="detail-info-item"><span class="dii-label">发生时间</span><span class="dii-value">{{ alarm.time }}</span></div>
        <div class="detail-info-item"><span class="dii-label">状态</span><span class="dii-value">{{ alarm.status === 'active' ? '未恢复' : '已恢复' }}</span></div>
      </div>
    </div>
    <div class="detail-section" v-if="alarm.diagSteps && alarm.diagSteps.length">
      <h4 class="detail-section-title">诊断步骤</h4>
      <ol class="diag-steps"><li v-for="(step, i) in alarm.diagSteps" :key="i">{{ step }}</li></ol>
    </div>
    <div class="detail-section" v-if="alarm.recovery">
      <h4 class="detail-section-title">恢复操作</h4>
      <p class="recovery-text">{{ alarm.recovery }}</p>
      <a-button type="primary" size="small" class="alarm-recover-btn" @click="execRecovery">{{ recovered ? '已执行' : '执行恢复' }}</a-button>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">关联对象</h4>
      <a-button size="small" class="alarm-link-btn" @click="openLinkedObject">查看关联对象详情</a-button>
    </div>
  </div>`,
  setup(props, { emit }) {
    const recovered = ref(false)
    function execRecovery() {
      recovered.value = true
    }
    function openLinkedObject() {
      emit('navigate', { component: resolveLinkedObject(), props: buildLinkedProps(), label: props.alarm.objName })
    }
    function resolveLinkedObject() {
      const t = props.alarm.objType
      const n = props.alarm.objName
      if (t.includes('节点') || t.includes('node')) return NodeDetail
      if (t.includes('存储池')) return PoolDetail
      if (t.includes('桶')) return BucketDetail
      if (t.includes('集群')) return ClusterDetail
      if (t.includes('存储集群')) return SCDetail
      return BucketDetail
    }
    function buildLinkedProps() {
      const t = props.alarm.objType
      const n = props.alarm.objName
      if (t.includes('节点') || t.includes('node')) {
        const node = nodes.find(x => x.name === n)
        return { node, dataDisks, alarms }
      }
      if (t.includes('存储池')) {
        const pool = storagePools.find(x => x.name === n)
        return { pool, buckets: getBucketsByPool(pool?.id), alarms }
      }
      if (t.includes('桶')) {
        const bucket = buckets.find(x => x.name === n)
        return { bucket, alarms }
      }
      if (t.includes('集群')) {
        const c = clusters.find(x => x.name === n)
        return { cluster: c, getBucketsByCluster, getNodesByCluster, buckets, nodes, dataDisks, alarms }
      }
      const bucket = buckets.find(x => x.name === n)
      return { bucket, alarms }
    }
    return { recovered, execRecovery, openLinkedObject, ...useHelpers() }
  }
}

const TenantDetail = {
  props: ['tenant', 'buckets'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">租户信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">租户名称</span><span class="dii-value">{{ tenant.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">企业项目</span><span class="dii-value">{{ tenant.ep }}</span></div>
        <div class="detail-info-item"><span class="dii-label">租户类型</span><span class="dii-value">{{ tenant.type || '生产' }}</span></div>
        <div class="detail-info-item"><span class="dii-label">桶数量</span><span class="dii-value">{{ tenant.bucketCount }}</span></div>
        <div class="detail-info-item"><span class="dii-label">总容量</span><span class="dii-value">{{ tenant.quota }} TB</span></div>
        <div class="detail-info-item"><span class="dii-label">使用量</span><span class="dii-value">{{ tenant.used }} TB</span></div>
        <div class="detail-info-item"><span class="dii-label">使用率</span><span class="dii-value">{{ tenant.usage }}%</span></div>
        <div class="detail-info-item"><span class="dii-label">服务成功率</span><span class="dii-value">{{ tenant.successRate }}%</span></div>
        <div class="detail-info-item"><span class="dii-label">有效请求率</span><span class="dii-value">{{ tenant.effectiveRate }}%</span></div>
        <div class="detail-info-item"><span class="dii-label">TPS</span><span class="dii-value">{{ tenant.tps }}</span></div>
        <div class="detail-info-item"><span class="dii-label">流出带宽</span><span class="dii-value">{{ tenant.outBw }}</span></div>
        <div class="detail-info-item"><span class="dii-label">流入带宽</span><span class="dii-value">{{ tenant.inBw }}</span></div>
        <div class="detail-info-item"><span class="dii-label">健康状态</span><span class="dii-value"><span class="health-tag" :class="tenant.health">{{ healthText(tenant.health) }}</span></span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">关联桶列表</h4>
      <a-table :data-source="tenantBuckets" :columns="bucketCols" :pagination="false" row-key="name" size="small" :custom-row="bucketRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="emit('navigate', { component: BucketDetail, props: { bucket: record, alarms }, label: record.name })">{{ record.name }}</a></template>
          <template v-else-if="column.key === 'type'">{{ bucketTypeText(record.type) }}</template>
          <template v-else-if="column.key === 'usage'"><span class="rld-usage"><span class="rld-usage-fill" :style="{ width: record.metrics.usage + '%' }"></span></span><span class="rld-usage-text">{{ record.metrics.usage }}%</span></template>
          <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        </template>
      </a-table>
    </div>
  </div>`,
  setup(props, { emit }) {
    const tenantBuckets = computed(() => (props.buckets || []).filter(b => b.tenant === props.tenant.name))
    const bucketCols = [
      { title: '桶名', dataIndex: 'name', key: 'name' },
      { title: '类型', dataIndex: 'type', key: 'type', width: 130 },
      { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
      { title: '健康状态', dataIndex: 'health', key: 'health', width: 90 },
    ]
    function bucketRowClick(record) {
      return { onClick: () => emit('navigate', { component: BucketDetail, props: { bucket: record, alarms: [] }, label: record.name }) }
    }
    function healthColor(h) {
      return h === 'ok' ? 'green' : h === 'warn' ? 'orange' : 'red'
    }
    return { emit, tenantBuckets, bucketCols, bucketRowClick, healthColor, BucketDetail, ...useHelpers() }
  }
}

const DiskDetail = {
  props: ['disk', 'node', 'alarms'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">基本信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">ESN</span><span class="dii-value">{{ disk.esn }}</span></div>
        <div class="detail-info-item"><span class="dii-label">槽位</span><span class="dii-value">{{ disk.slot }}</span></div>
        <div class="detail-info-item"><span class="dii-label">介质</span><span class="dii-value">{{ disk.media }}</span></div>
        <div class="detail-info-item"><span class="dii-label">角色</span><span class="dii-value">{{ disk.role }}</span></div>
        <div class="detail-info-item"><span class="dii-label">所属节点</span><span class="dii-value"><a class="rld-link" @click.stop="emit('navigate', { component: NodeDetail, props: { node, dataDisks, alarms }, label: node?.name })">{{ node?.name || disk.node }}</a></span></div>
        <div class="detail-info-item"><span class="dii-label">状态</span><span class="dii-value"><a-tag :color="diskStatusColor(disk.health)">{{ diskStatusText(disk.health) }}</a-tag></span></div>
        <div class="detail-info-item"><span class="dii-label">健康状态</span><span class="dii-value"><a-tag :color="healthColor(disk.health)">{{ diskStatusText(disk.health) }}</a-tag></span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量</h4>
      <div class="detail-cap-row"><span>物理总量</span><span>{{ disk.metrics.capacity }} TB</span></div>
      <div class="detail-cap-row"><span>物理使用</span><span>{{ disk.metrics.used }} TB</span></div>
      <div class="detail-cap-row"><span>物理剩余</span><span>{{ (disk.metrics.capacity - disk.metrics.used).toFixed(2) }} TB</span></div>
      <div class="detail-cap-row"><span>使用率</span><span>{{ disk.metrics.usage }}%</span><div class="cap-bar"><div class="cap-fill" :style="{ width: disk.metrics.usage + '%', background: percentColor(disk.metrics.usage) }"></div></div></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">性能指标</h4>
      <div class="perf-grid">
        <div class="perf-item"><span class="perf-label">带宽</span><span class="perf-value">{{ disk.metrics.bw }} MB/s</span></div>
        <div class="perf-item"><span class="perf-label">IOPS</span><span class="perf-value">{{ disk.metrics.iops.toLocaleString() }}</span></div>
      </div>
    </div>
  </div>`,
  setup(props, { emit }) {
    function healthColor(h) {
      return h === 'online' ? 'green' : h === 'degraded' ? 'orange' : 'red'
    }
    return { emit, healthColor, NodeDetail, ...useHelpers() }
  }
}

const EnterpriseProjectDetail = {
  props: ['ep', 'tenants', 'buckets'],
  template: `<div class="drawer-content">
    <div class="detail-section">
      <h4 class="detail-section-title">企业项目信息</h4>
      <div class="detail-info-grid">
        <div class="detail-info-item"><span class="dii-label">项目 ID</span><span class="dii-value">{{ ep.id }}</span></div>
        <div class="detail-info-item"><span class="dii-label">项目名称</span><span class="dii-value">{{ ep.name }}</span></div>
        <div class="detail-info-item"><span class="dii-label">项目描述</span><span class="dii-value">{{ ep.desc }}</span></div>
        <div class="detail-info-item"><span class="dii-label">租户数量</span><span class="dii-value">{{ ep.tenantCount }}</span></div>
        <div class="detail-info-item"><span class="dii-label">总容量</span><span class="dii-value">{{ ep.total }} TB</span></div>
        <div class="detail-info-item"><span class="dii-label">已使用</span><span class="dii-value">{{ ep.used }} TB</span></div>
        <div class="detail-info-item"><span class="dii-label">使用率</span><span class="dii-value">{{ ep.usage }}%</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">容量使用</h4>
      <div class="detail-cap-row"><span>容量使用</span><span>{{ ep.used }}/{{ ep.total }} TB</span><div class="cap-bar"><div class="cap-fill" :style="{ width: ep.usage + '%', background: percentColor(ep.usage) }"></div></div><span>{{ ep.usage }}%</span></div>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">关联租户列表</h4>
      <a-table :data-source="epTenants" :columns="tenantCols" :pagination="false" row-key="name" size="small" :custom-row="tenantRowClick">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'"><a class="rld-link" @click.stop="emit('navigate', { component: TenantDetail, props: { tenant: record, buckets }, label: record.name })">{{ record.name }}</a></template>
          <template v-else-if="column.key === 'type'">{{ record.type }}</template>
          <template v-else-if="column.key === 'usage'"><span class="rld-usage"><span class="rld-usage-fill" :style="{ width: record.usage + '%' }"></span></span><span class="rld-usage-text">{{ record.usage }}%</span></template>
          <template v-else-if="column.key === 'health'"><a-tag :color="healthColor(record.health)">{{ healthText(record.health) }}</a-tag></template>
        </template>
      </a-table>
    </div>
  </div>`,
  setup(props, { emit }) {
    const epTenants = computed(() => (props.tenants || []).filter(t => t.ep.includes(props.ep.name) || (props.ep.tenantCount && t.ep.startsWith('ep-'))).slice(0, 20))
    const tenantCols = [
      { title: '租户名', dataIndex: 'name', key: 'name' },
      { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
      { title: '容量', dataIndex: 'quota', key: 'quota', width: 100 },
      { title: '使用率', dataIndex: 'usage', key: 'usage', width: 170 },
      { title: '健康状态', dataIndex: 'health', key: 'health', width: 90 },
    ]
    function tenantRowClick(record) {
      return { onClick: () => emit('navigate', { component: TenantDetail, props: { tenant: record, buckets: props.buckets }, label: record.name }) }
    }
    function healthColor(h) {
      return h === 'ok' ? 'green' : h === 'warn' ? 'orange' : 'red'
    }
    return { emit, epTenants, tenantCols, tenantRowClick, healthColor, TenantDetail, ...useHelpers() }
  }
}

const slaChartRefs = reactive({})
const bwChartRefs = reactive({})
const capChartRefs = reactive({})
const scPoolChartRefs = reactive({})
const scPoolBarRefs = reactive({})
let chartInstances = []

function renderRegionCharts() {
  clusters.forEach((cl, i) => {
    [['logic', cl.metrics.logicUsed, cl.metrics.logicTotal, cl.metrics.logicPercent], ['phy', cl.metrics.phyUsed, cl.metrics.phyTotal, cl.metrics.phyPercent]].forEach(([kind, used, total, pct]) => {
      const key = cl.id + ':' + kind
      if (capChartRefs[key]) {
        const c = new Chart({ container: capChartRefs[key], autoFit: true, padding: [2, 2, 2, 2] })
        chartInstances.push(c)
        c.coordinate({ transform: [{ type: 'transpose' }] })
        c.interval().data([{ type: kind, value: used, total, pct }])
          .encode('x', 'type').encode('y', 'value')
          .style('maxWidth', 22).style('radiusTopLeft', 4).style('radiusTopRight', 4)
          .label({ text: (d) => d.value + '/' + d.total + ' TB · ' + d.pct + '%', position: 'right', style: { fontSize: 11, fill: '#1a1a1a', dy: 1, dx: 8, textAlign: 'left' } })
        c.scale('y', { domain: [0, total] })
        c.axis('x', false)
        c.axis('y', false)
        c.render()
      }
    })
    if (slaChartRefs[cl.id]) {
      const c = new Chart({ container: slaChartRefs[cl.id], autoFit: true, padding: [4, 4, 4, 4] })
      chartInstances.push(c)
      const sucData = cl.metrics.successTrend.map(d => ({ time: d.time, value: d.value, type: '成功率' }))
      const effData = cl.metrics.effectiveTrend.map(d => ({ time: d.time, value: d.value, type: '有效请求率' }))
      const allData = [...sucData, ...effData]
      c.line().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('lineWidth', 1.5).style('shape', 'smooth')
      c.scale('color', { range: ['#52c41a', '#1890ff'] })
      c.axis('x', false)
      c.axis('y', false)
      c.render()
    }
    if (bwChartRefs[cl.id]) {
      const c = new Chart({ container: bwChartRefs[cl.id], autoFit: true, padding: [4, 4, 4, 4] })
      chartInstances.push(c)
      const outData = cl.metrics.bwTrend ? cl.metrics.bwTrend.map(d => ({ time: d.time, value: d.value, type: '流出带宽' })) : genTrend(30, 1, 4).map(d => ({ ...d, type: '流出带宽' }))
      const inData = genTrend(30, 0.8, 3.5).map(d => ({ ...d, type: '流入带宽' }))
      const allData = [...outData, ...inData]
      c.line().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('lineWidth', 1.5).style('shape', 'smooth')
      c.scale('color', { range: ['#1890ff', '#722ed1'] })
      c.axis('x', false)
      c.axis('y', false)
      c.render()
    }
  })

  storageClusters.forEach((sc, i) => {
    getPoolsBySC(sc.id).forEach((p) => {
      const key = sc.id + ':' + p.id
      if (scPoolBarRefs[key]) {
        const c = new Chart({ container: scPoolBarRefs[key], autoFit: true, padding: [0, 0, 0, 0] })
        chartInstances.push(c)
        c.coordinate({ transform: [{ type: 'transpose' }] })
        c.interval()
          .data([{ value: p.metrics.phyUsed }])
          .encode('x', 'used').encode('y', 'value')
          .style('fill', '#1890ff')
          .style('minWidth', 24)
          .style('maxWidth', 24)
          .style('radiusTopLeft', 3).style('radiusTopRight', 3)
        c.scale('y', { domain: [0, p.metrics.phyTotal] })
        c.scale('x', { padding: 0 })
        c.axis('x', false)
        c.axis('y', false)
        c.render()
      }
      if (scPoolChartRefs[key]) {
        const c = new Chart({ container: scPoolChartRefs[key], autoFit: true, padding: [2, 2, 2, 2] })
        chartInstances.push(c)
        const trend = p.metrics.readBwTrend || genTrend(24, 20, 80)
        const vals = trend.map(d => d.value)
        const tMin = Math.min(...vals) * 0.85
        const tMax = Math.max(...vals) * 1.08
        c.line().data(trend).encode('x', 'time').encode('y', 'value')
          .style('lineWidth', 1.5).style('shape', 'smooth')
        c.scale('y', { domain: [tMin, tMax] })
        c.axis('x', false)
        c.axis('y', false)
        c.legend(false)
        c.render()
      }
    })
  })
}

onMounted(() => {
  lastRefresh.value = new Date().toLocaleString()
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderRegionCharts()
      })
    })
  })
})

onBeforeUnmount(() => {
  chartInstances.forEach(c => { try { c.destroy() } catch(e) {} })
  chartInstances = []
})
</script>

<script>
export default {
  name: 'OBSOpsView'
}
</script>

<style scoped>
.obs-ops { display: flex; flex-direction: column; height: 100%; background: #f5f5f5; }
.obs-ops-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.obs-ops-header h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; display: flex; align-items: center; gap: 8px; }
.obs-ops-actions { display: flex; align-items: center; gap: 12px; }
.obs-ops-body { flex: 1; overflow-y: auto; padding: 16px 24px 80px; display: flex; flex-direction: column; gap: 20px; }
.obs-section { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.obs-section-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 0; padding-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.obs-section-title.anatomy-dropdown { margin-bottom: 8px; padding-bottom: 0; }
.obs-section-title.anatomy-section-title { padding-bottom: 0; }
.obs-section-title.anatomy-section-title + .obs-section { margin-top: -12px; }

.stats-row { display: flex; gap: 10px; flex-wrap: wrap; }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon i { font-size: 18px; color: #1890ff; }
.stat-info { min-width: 0; }
.stat-value { line-height: 1.2; }
.stat-num { font-size: 26px; font-weight: 700; color: #182431; }
.stat-unit { font-size: 13px; color: #8c8c8c; margin-left: 2px; }
.stat-label { font-size: 12px; color: #8c8c8c; margin-top: 2px; white-space: nowrap; }

.alarm-row { display: flex; gap: 16px; }
.alarm-overview-card { width: 25%; display: flex; flex-direction: column; }
.alarm-list-card { width: 75%; }
.alarm-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; flex: 1; }
.alarm-stat-card { padding: 14px 16px; border-radius: 8px; cursor: pointer; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.alarm-stat-card:hover { opacity: 0.85; }
.alarm-stat-value { font-size: 28px; font-weight: 700; }
.alarm-stat-label { font-size: 13px; color: #595959; margin-top: 4px; }
.alarm-list-wrap { display: flex; flex-direction: column; }
.alarm-list-header { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
.alarm-search { width: 200px; }
.alarm-level-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; color: #fff; display: inline-block; }
.alarm-empty { padding: 20px; text-align: center; color: #8c8c8c; }
.alarm-list-wrap .ant-table { min-height: 220px; }
.alarm-table .ant-table-content table { table-layout: fixed; width: 100%; }
.alarm-table .ant-table-content table th,
.alarm-table .ant-table-content table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tenant-ep-section { display: flex; gap: 16px; }
.tenant-top5-table { width: 65%; overflow-x: auto; }
.tenant-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.tenant-table-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.tenant-search { width: 200px; }
.cap-bar-sm { display: inline-block; width: 60px; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; vertical-align: middle; }
.cap-pct-sm { font-size: 11px; color: #595959; margin-left: 4px; }

.tenant-charts { width: 35%; display: flex; flex-direction: row; gap: 12px; align-items: stretch; }
.tc-wrap { display: flex; flex-direction: column; flex: 1; }
.tc-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px; flex: 1; display: flex; align-items: center; justify-content: center; }
.tc-hdr { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; }
.tc-chart { width: 100%; display: flex; align-items: center; justify-content: center; }

.donut-svg { width: 160px; height: 160px; flex-shrink: 0; }
.donut-legend { display: flex; flex-direction: column; gap: 4px; margin-left: 12px; font-size: 11px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-label { color: #595959; }
.legend-value { color: #8c8c8c; margin-left: auto; }

.bar-svg { width: 100%; height: 100%; }
.bar-label { font-size: 9px; fill: #595959; }
.bar-name { font-size: 10px; fill: #8c8c8c; }

.anatomy-block { margin-bottom: 16px; }
.anatomy-block.collapsed .obs-section-title,
.anatomy-block.collapsed .cluster-detail-grid,
.anatomy-block.collapsed .sc-detail-grid,
.anatomy-block.collapsed .node-grid { display: none; }
.anatomy-part.collapsed .cluster-detail-grid,
.anatomy-part.collapsed .sc-detail-grid,
.anatomy-part.collapsed .node-grid { display: none; }
.anatomy-block-title { display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 600; color: #1a1a1a; padding: 0 0 16px; margin-bottom: 8px; }
.anatomy-block.collapsed .anatomy-block-title { border-bottom: 1px solid #e8e8e8; }
.abl-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.abl-name { font-size: 15px; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
.abl-sep { color: #d9d9d9; margin: 0; font-size: 10px; font-weight: 400; }
.abl-endpoint { font-size: 12px; color: #8c8c8c; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.abl-capacity { display: flex; align-items: center; gap: 24px; }
.abl-cap-mod { display: flex; align-items: center; gap: 8px; }
.abl-cap-label { font-size: 12px; color: #595959; flex-shrink: 0; }
.abl-cap-bar { width: 90px; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.abl-cap-fill { display: block; height: 100%; border-radius: 3px; transition: width 0.3s; }
.abl-cap-nums { font-size: 12px; color: #1a1a1a; font-weight: 500; white-space: nowrap; }
.abl-cap-nums em { font-style: normal; color: #8c8c8c; margin: 0 2px; }
.abl-cap-pct { font-size: 12px; color: #595959; width: 40px; text-align: right; font-weight: 500; }

.cluster-detail-grid { margin-bottom: 10px; }
.cluster-detail-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.cluster-detail-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.cdc-header { margin-bottom: 10px; }
.cdc-name { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.cdc-meta { display: flex; gap: 10px; font-size: 11px; color: #8c8c8c; flex-wrap: wrap; }
.cdc-capacity { flex: 1 1 25%; min-width: 0; display: flex; flex-direction: column; justify-content: space-evenly; gap: 8px; }
.cdc-cap-row { display: flex; align-items: center; gap: 8px; }
.cdc-cap-title { font-size: 12px; color: #595959; font-weight: 500; width: 34px; flex-shrink: 0; }
.cdc-cap-chart { flex: 1; height: 22px; min-width: 0; }
.cdc-body-row { display: flex; align-items: stretch; gap: 14px; zoom: 1; min-height: 110px; }
.cdc-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1 1 50%; min-width: 0; align-items: stretch; }
.cdc-chart-col { min-width: 0; display: flex; flex-direction: column; height: 100%; }
.cdc-chart-label { font-size: 11px; color: #8c8c8c; margin-bottom: 2px; flex-shrink: 0; }
.cdc-chart-box { width: 100%; height: 90px; min-height: 0; overflow: hidden; position: relative; }
.cdc-kpis { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 8px; flex: 1 1 25%; min-width: 0; }
.cdc-kpi { display: flex; flex-direction: column; gap: 0; padding: 4px 8px; background: #fafafa; border-radius: 6px; justify-content: center; align-items: center; text-align: center; }
.cdc-kpi-label { font-size: 11px; color: #8c8c8c; }
.cdc-kpi-val { font-size: 18px; font-weight: 700; color: #1a1a1a; }

.honeycomb { padding: 6px 0 2px; user-select: none; display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.hex-cell { width: 18px; height: 18px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); cursor: pointer; transition: transform 0.15s; flex-shrink: 0; }
.hex-cell:hover { transform: scale(1.15); }
.hcx-ok { background: #52c41a; }
.hcx-warn { background: #fa8c16; }
.hcx-crit { background: #f5222d; }

.sc-detail-grid { margin-bottom: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.sc-detail-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.sc-detail-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.sdc-name { font-size: 15px; font-weight: 600; color: #1890ff; margin-bottom: 12px; }
.sdc-pool-list { display: flex; gap: 10px; align-items: stretch; }
.sdc-pool { flex: 1; min-width: 0; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; background: #fafafa; }
.sdp-title { font-size: 12px; font-weight: 500; color: #1a1a1a; margin-bottom: 8px; }
.sdp-body { display: flex; flex-direction: column; gap: 6px; }
.sdp-bar-chart { width: 100%; height: 26px; border-radius: 3px; overflow: hidden; }
.sdp-bar-cap { display: flex; justify-content: space-between; font-size: 11px; color: #8c8c8c; }
.sdp-trend { margin-top: 10px; }
.sdp-trend-label { font-size: 11px; color: #8c8c8c; margin-bottom: 2px; }
.sdp-trend-chart { width: 100%; height: 60px; }

.node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.node-tile { padding: 12px; border: 1px solid #e8e8e8; border-left: 3px solid #52c41a; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.node-tile.warn { border-left-color: #fa8c16; }
.node-tile.crit { border-left-color: #f5222d; }
.node-tile:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.nt-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.nt-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.role-tag { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px; color: #fff; }
.role-OAM { background: #1890ff; }
.role-FUSION { background: #722ed1; }
.role-INDEX { background: #13c2c2; }
.role-PERF { background: #52c41a; }
.role-CAP { background: #fa8c16; }
.nt-bars { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
.nt-bar-row { display: flex; align-items: center; gap: 6px; }
.nt-bar-label { width: 30px; font-size: 10px; color: #8c8c8c; flex-shrink: 0; }
.nt-bar { flex: 1; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.nt-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.nt-bar-val { width: 30px; text-align: right; font-size: 10px; font-weight: 600; color: #1a1a1a; flex-shrink: 0; }
.nt-kpis { display: flex; gap: 8px; font-size: 10px; color: #8c8c8c; }

.detail-panel { position: fixed; top: 48px; right: 0; bottom: 0; left: 0; z-index: 1050; pointer-events: none; opacity: 0; transition: opacity 0.3s; }
.detail-panel.open { pointer-events: auto; opacity: 1; }
.detail-mask { position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.3); }
.detail-panel-content { position: absolute; top: 0; right: -80vw; width: 80vw; height: 100%; background: #fff; box-shadow: -2px 0 8px rgba(0,0,0,0.15); display: flex; flex-direction: column; transition: right 0.3s; }
.detail-panel.open .detail-panel-content { right: 0; }
.detail-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.detail-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.detail-title h3 { margin: 0; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.back-btn, .close-btn { font-size: 16px; color: #8c8c8c; border: none; background: transparent; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.back-btn:hover, .close-btn:hover { background: #f5f5f5; color: #1a1a1a; }
.detail-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; }
.detail-scroll::-webkit-scrollbar { width: 4px; }
.detail-scroll::-webkit-scrollbar-track { background: transparent; }
.detail-scroll::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 4px; }

.drawer-content { display: flex; flex-direction: column; gap: 24px; }
.drawer-content-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.detail-section { padding: 0; }
.detail-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.detail-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0 24px; }
.detail-info-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.dii-label { font-size: 13px; color: #8c8c8c; width: 100px; flex-shrink: 0; }
.dii-value { font-size: 13px; color: #1a1a1a; }
.detail-cap-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; }
.detail-cap-row:last-child { margin-bottom: 0; }
.detail-cap-row .cap-bar { flex: 1; max-width: 300px; }

.perf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.perf-item { display: flex; flex-direction: column; gap: 2px; padding: 10px; background: #fafafa; border-radius: 6px; }
.perf-label { font-size: 11px; color: #8c8c8c; }
.perf-value { font-size: 18px; font-weight: 700; color: #1a1a1a; }

.inner-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.inner-table th { text-align: left; padding: 8px 10px; font-weight: 600; color: #8c8c8c; border-bottom: 2px solid #e8e8e8; white-space: nowrap; }
.inner-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; }
.inner-table tbody tr { cursor: pointer; }
.inner-table tbody tr:hover { background: #fafafa; }

.node-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.node-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.node-card:hover { border-color: #1890ff; }
.node-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.node-card-info { font-size: 11px; color: #8c8c8c; margin-bottom: 8px; }
.node-card-metrics { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 6px; }
.node-card-bar { height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 2px; }

.resource-bars { display: flex; flex-direction: column; gap: 10px; }
.resource-bar-item { display: flex; align-items: center; gap: 10px; }
.rb-label { width: 40px; font-size: 12px; color: #595959; flex-shrink: 0; }
.rb-bar { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.rb-fill { height: 100%; border-radius: 4px; }
.rb-value { width: 40px; text-align: right; font-size: 12px; font-weight: 600; color: #1a1a1a; }

.proc-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
.proc-status.normal { background: #f6ffed; color: #52c41a; }
.proc-status.warn { background: #fff7e6; color: #fa8c16; }
.proc-status.crit { background: #fff1f0; color: #f5222d; }

.disk-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.disk-card { padding: 12px; border: 1px solid #e8e8e8; border-radius: 8px; }
.disk-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.disk-status { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; color: #fff; }
.disk-card-info { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; margin-bottom: 6px; }
.disk-card-cap { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 4px; }

.cluster-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; }
.cluster-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.cluster-card:hover { border-color: #1890ff; }
.cluster-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.cluster-card-domain { font-size: 11px; color: #8c8c8c; margin-bottom: 8px; }
.cluster-card-info { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 8px; }
.cluster-card-cap { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #595959; margin-bottom: 4px; }
.cluster-card-cap .cap-bar { flex: 1; max-width: 200px; }
.cluster-card-metrics { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; margin-top: 6px; }

.sc-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.sc-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.sc-card:hover { border-color: #1890ff; }
.sc-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.sc-card-info { font-size: 11px; color: #595959; }

.pool-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
.pool-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.pool-card:hover { border-color: #1890ff; }
.pool-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.pool-card-info { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 6px; }
.pool-card-cap { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #595959; margin-bottom: 4px; }
.pool-card-cap .cap-bar { flex: 1; max-width: 150px; }
.pool-card-metrics { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; margin-top: 4px; }

.health-tag { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 3px; }
.health-tag.ok { background: #f6ffed; color: #52c41a; }
.health-tag.warn { background: #fff7e6; color: #fa8c16; }
.health-tag.crit { background: #fff1f0; color: #f5222d; }
.health-tag-sm { font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 3px; }
.health-tag-sm.ok { background: #f6ffed; color: #52c41a; }
.health-tag-sm.warn { background: #fff7e6; color: #fa8c16; }
.health-tag-sm.crit { background: #fff1f0; color: #f5222d; }
.pool-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
.pool-status.normal { background: #f6ffed; color: #52c41a; }
.pool-status.degraded { background: #fff7e6; color: #fa8c16; }
.pool-status.migrating { background: #e6f7ff; color: #1890ff; }

.stat-list-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.stat-list-table th { text-align: left; padding: 8px 10px; font-weight: 600; color: #8c8c8c; border-bottom: 2px solid #e8e8e8; white-space: nowrap; }
.stat-list-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; }
.stat-list-table-wrap { overflow-x: auto; }

.diag-steps { padding-left: 20px; }
.diag-steps li { font-size: 13px; color: #595959; margin-bottom: 8px; line-height: 1.5; }
.recovery-text { font-size: 13px; color: #595959; line-height: 1.6; }

.time-pills { display: flex; gap: 2px; background: #fff; border-radius: 20px; padding: 2px; border: 1px solid #e8e8e8; }
.time-pill { padding: 4px 14px; font-size: 12px; font-weight: 500; border-radius: 18px; border: none; background: transparent; color: #8c8c8c; cursor: pointer; transition: all 0.15s; }
.time-pill:hover { color: #1a1a1a; }
.time-pill.active { background: #1890ff; color: #fff; }
.last-refresh { font-size: 11px; color: #8c8c8c; }

.region-list { display: flex; flex-direction: column; gap: 12px; }
.region-card { border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
.region-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.region-header { padding: 14px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.region-name-row { display: flex; align-items: center; justify-content: space-between; }
.region-name { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.region-domain { font-size: 11px; color: #8c8c8c; margin-top: 4px; }
.region-capacity { padding: 12px 16px; border-bottom: 1px solid #e8e8e8; }
.capacity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.capacity-row:last-child { margin-bottom: 0; }
.cap-label { width: 60px; color: #8c8c8c; flex-shrink: 0; }
.cap-text { width: 100px; color: #1a1a1a; flex-shrink: 0; }
.cap-bar { flex: 1; height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.cap-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.cap-pct { width: 40px; text-align: right; color: #595959; font-weight: 500; flex-shrink: 0; }
.region-clusters { padding: 10px 16px; border-bottom: 1px solid #e8e8e8; }
.cluster-scroll-wrap { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.cluster-mini-card { flex-shrink: 0; width: 180px; padding: 10px 12px; border: 1px solid #e8e8e8; border-radius: 6px; cursor: pointer; }
.cluster-mini-card:hover { border-color: #1890ff; }
.cmc-name { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.cmc-stat { display: flex; justify-content: space-between; font-size: 11px; color: #595959; margin-bottom: 2px; }
.cmc-health { font-size: 10px; font-weight: 600; margin-top: 4px; }
.region-sc { padding: 10px 16px; }
.sc-scroll-wrap { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.sc-mini-card { flex-shrink: 0; width: 160px; padding: 10px 12px; border: 1px solid #e8e8e8; border-radius: 6px; cursor: pointer; }
.sc-mini-card:hover { border-color: #1890ff; }
.smc-name { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.smc-stat { display: flex; justify-content: space-between; font-size: 11px; color: #595959; margin-bottom: 2px; }
.smc-health { font-size: 10px; font-weight: 600; margin-top: 4px; }

.tenant-eps { display: flex; gap: 16px; }
.eps-monitor { width: 40%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.eps-chart-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px; }
.eps-chart-hdr { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.eps-chart-box { width: 100%; height: 120px; }

@media (max-width: 1024px) {
  .alarm-row { flex-direction: column; }
  .alarm-overview-card { width: 100%; }
  .alarm-list-card { width: 100%; }
  .tenant-ep-section { flex-direction: column; }
  .tenant-top5-table { width: 100%; }
  .tenant-charts { width: 100%; }
}
@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .stat-card { flex: none; width: calc(50% - 5px); }
  .obs-ops-header { flex-direction: column; gap: 10px; align-items: flex-start; }
  .detail-panel-content { width: 100%; right: -100%; }
  .detail-panel.open .detail-panel-content { right: 0; }
}
</style>

<style>
.rld-region-id { color: #595959; font-family: monospace; }
.rld-link { color: #1890ff; cursor: pointer; }
.rld-link:hover { color: #40a9ff; }
.rld-domain { color: #595959; }
.rld-usage { display: inline-block; width: 100px; height: 8px; border-radius: 4px; background: #e9e9e9; vertical-align: middle; overflow: hidden; position: relative; }
.rld-usage-fill { display: block; height: 100%; border-radius: 4px; background: #1890ff; }
.rld-usage-text { margin-left: 6px; color: #1a1a1a; font-weight: 500; }
.detail-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0 24px; }
.detail-info-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.dii-label { font-size: 13px; color: #8c8c8c; width: 100px; flex-shrink: 0; }
.dii-value { font-size: 13px; color: #1a1a1a; }
.detail-cap-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; }
.detail-cap-row:last-child { margin-bottom: 0; }
.detail-cap-row .cap-bar { flex: 1; max-width: 300px; }
.perf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.perf-item { display: flex; flex-direction: column; gap: 2px; padding: 10px; background: #fafafa; border-radius: 6px; }
.perf-label { font-size: 11px; color: #8c8c8c; }
.perf-value { font-size: 18px; font-weight: 700; color: #1a1a1a; }
.inner-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.inner-table th { text-align: left; padding: 8px 10px; font-weight: 600; color: #8c8c8c; border-bottom: 2px solid #e8e8e8; white-space: nowrap; }
.inner-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; }
.inner-table tbody tr { cursor: pointer; }
.inner-table tbody tr:hover { background: #fafafa; }
.node-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.node-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.node-card:hover { border-color: #1890ff; }
.node-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.node-card-info { font-size: 11px; color: #8c8c8c; margin-bottom: 8px; }
.node-card-metrics { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 6px; }
.node-card-bar { height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 2px; }
.resource-bars { display: flex; flex-direction: column; gap: 10px; }
.resource-bar-item { display: flex; align-items: center; gap: 10px; }
.rb-label { width: 40px; font-size: 12px; color: #595959; flex-shrink: 0; }
.rb-bar { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.rb-fill { height: 100%; border-radius: 4px; }
.rb-value { width: 40px; text-align: right; font-size: 12px; font-weight: 600; color: #1a1a1a; }
.drawer-content { display: flex; flex-direction: column; gap: 24px; }
.drawer-content-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.detail-section { padding: 0; }
.detail-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.stat-list-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.stat-list-table th { text-align: left; padding: 8px 10px; font-weight: 600; color: #8c8c8c; border-bottom: 2px solid #e8e8e8; white-space: nowrap; }
.stat-list-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; }
.stat-list-table tbody tr { cursor: pointer; }
.stat-list-table tbody tr:hover { background: #fafafa; }
.stat-list-table-wrap { overflow-x: auto; }
.cluster-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.cluster-card:hover { border-color: #1890ff; }
.cluster-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.cluster-card-domain { font-size: 11px; color: #8c8c8c; margin-bottom: 8px; }
.cluster-card-info { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 8px; }
.cluster-card-cap { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #595959; margin-bottom: 4px; }
.cluster-card-cap .cap-bar { flex: 1; max-width: 200px; }
.cluster-card-metrics { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; margin-top: 6px; }
.sc-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.sc-card:hover { border-color: #1890ff; }
.sc-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.sc-card-info { font-size: 11px; color: #595959; }
.pool-card { padding: 14px; border: 1px solid #e8e8e8; border-radius: 8px; cursor: pointer; }
.pool-card:hover { border-color: #1890ff; }
.pool-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.pool-card-info { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 6px; }
.disk-card { padding: 12px; border: 1px solid #e8e8e8; border-radius: 8px; }
.disk-card-hdr { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
.disk-card-info { display: flex; gap: 12px; font-size: 11px; color: #8c8c8c; margin-bottom: 6px; }
.disk-card-cap { display: flex; gap: 12px; font-size: 11px; color: #595959; margin-bottom: 4px; }
.disk-status { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; color: #fff; }
.health-tag { font-size: 11px; font-weight: 600; padding: 2px 12px; border-radius: 4px; }
.health-tag.ok { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.health-tag.warn { background: #fff7e6; color: #fa8c16; border: 1px solid #ffd591; }
.health-tag.crit { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }
.health-tag-sm { font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 3px; }
.health-tag-sm.ok { background: #f6ffed; color: #52c41a; }
.health-tag-sm.warn { background: #fff7e6; color: #fa8c16; }
.health-tag-sm.crit { background: #fff1f0; color: #f5222d; }
.proc-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
.proc-status.normal { background: #f6ffed; color: #52c41a; }
.proc-status.warn { background: #fff7e6; color: #fa8c16; }
.proc-status.crit { background: #fff1f0; color: #f5222d; }
.alarm-level-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; }
.cap-bar { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.cap-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.cap-bar-sm { display: inline-block; width: 60px; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; vertical-align: middle; }
.cap-pct-sm { font-size: 11px; color: #595959; margin-left: 4px; }
.alarm-list-wrap .ant-table-tbody > tr > td { padding: 4px 8px !important; }
.stat-card { flex: 1; min-width: 0; }
.stat-card .ant-card-body { display: flex; align-items: center; gap: 12px; padding: 12px 16px !important; }
</style>
