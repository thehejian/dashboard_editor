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
        <div class="obs-section-title">租户与企业项目监控</div>
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
            <div class="tc-card">
              <div class="tc-hdr">企业项目资源占比</div>
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
            <div class="tc-card">
              <div class="tc-hdr">租户使用量对比</div>
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

      <div class="obs-section-title" style="margin-bottom:8px;">区域解剖图</div>
      <div class="obs-section">
        <div class="anatomy-block" v-for="r in regions" :key="r.id" :class="{ collapsed: expandedRegions[r.id] === false }">
          <div class="anatomy-block-title" style="cursor:pointer" @click="expandedRegions[r.id] = expandedRegions[r.id] === undefined ? false : !expandedRegions[r.id]">
            <i class="fa-solid" :class="expandedRegions[r.id] !== false ? 'fa-chevron-down' : 'fa-chevron-right'" style="font-size:10px; color:#8c8c8c; margin-right:6px;"></i>
            <span>{{ r.name }}</span>
            <span class="health-tag" :class="r.health">{{ healthText(r.health) }}</span>
          </div>

          <div class="obs-section-title" style="font-size:14px; margin-top:12px;">业务集群</div>
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
              <div class="cdc-capacity">
                <div class="cdc-cap-row">
                  <span class="cdc-cap-label">逻辑</span>
                  <span class="cdc-cap-text">{{ c.metrics.logicUsed }}/{{ c.metrics.logicTotal }} TB</span>
                  <div class="cap-bar"><div class="cap-fill" :style="{ width: c.metrics.logicPercent + '%', background: percentColor(c.metrics.logicPercent) }"></div></div>
                  <span class="cdc-cap-pct">{{ c.metrics.logicPercent }}%</span>
                </div>
                <div class="cdc-cap-row">
                  <span class="cdc-cap-label">物理</span>
                  <span class="cdc-cap-text">{{ c.metrics.phyUsed }}/{{ c.metrics.phyTotal }} TB</span>
                  <div class="cap-bar"><div class="cap-fill" :style="{ width: c.metrics.phyPercent + '%', background: percentColor(c.metrics.phyPercent) }"></div></div>
                  <span class="cdc-cap-pct">{{ c.metrics.phyPercent }}%</span>
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
              <div class="honeycomb">
                <div class="hex-cell" v-for="b in getBucketsByCluster(c.id).slice(0, 12)" :key="b.name" :class="'hex-' + (b.health === 'ok' ? 'green' : b.health === 'warn' ? 'orange' : 'red')" @click.stop="openBucketDrawer(b)">
                  <div class="hex-inner">
                    <div class="hex-name">{{ b.name.replace('bucket-', '') }}</div>
                    <div class="hex-val">{{ b.metrics.usage }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="obs-section-title" style="font-size:14px; margin-top:12px;">存储集群</div>
          <div class="sc-detail-grid" v-for="sc in getStorageClustersByRegion(r.id)" :key="sc.id">
            <div class="sc-detail-card" @click="openSCDrawer(sc)">
              <div class="sdc-header">
                <div class="sdc-name">{{ sc.name }}</div>
                <div class="sdc-meta">
                  <span>控制节点: {{ sc.ctrlNodeCount }}</span>
                  <span>存储池: {{ sc.poolCount }}</span>
                  <span class="health-tag" :class="sc.health">{{ healthText(sc.health) }}</span>
                </div>
              </div>
              <div class="pool-waterfall">
                <div v-for="p in getPoolsBySC(sc.id)" :key="p.id" class="pool-wl-row">
                  <span class="pool-wl-name">{{ p.name }}</span>
                  <div class="pw-fill-track"><div class="pw-fill" :style="{ width: p.metrics.phyPercent + '%', background: percentColor(p.metrics.phyPercent) }"></div></div>
                  <span class="pool-wl-label">{{ p.metrics.phyUsed }}/{{ p.metrics.phyTotal }} TB</span>
                  <span class="pool-wl-val">{{ p.metrics.phyPercent }}%</span>
                </div>
              </div>
              <div :ref="el => { if (el) scChartRefs[sc.id] = el }" class="cdc-chart-box" style="height:100px;"></div>
            </div>
          </div>

          <div class="obs-section-title" style="font-size:14px; margin-top:12px;">存储节点</div>
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
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, nextTick, markRaw, reactive } from 'vue'
import { Chart } from '@antv/g2'

const period = ref('24h')
const lastRefresh = ref('')
const expandedRegions = reactive({})

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
  { id: 'sc-001', name: 'sc-data-01', ctrlNodeCount: 3, poolCount: 2, cluster: 'cluster-001', health: 'ok' },
  { id: 'sc-002', name: 'sc-cache-01', ctrlNodeCount: 2, poolCount: 1, cluster: 'cluster-001', health: 'ok' },
  { id: 'sc-003', name: 'sc-data-02', ctrlNodeCount: 3, poolCount: 2, cluster: 'cluster-002', health: 'warn' },
  { id: 'sc-004', name: 'sc-data-03', ctrlNodeCount: 2, poolCount: 1, cluster: 'cluster-003', health: 'ok' },
]

const storagePools = [
  { id: 'pool-001', name: 'obsData', safety: '节点级', ecRatio: '12+3', redundancy: 'FUSION', cacheDisk: 'NVMe SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-001', health: 'normal', metrics: { phyTotal: 100, phyUsed: 87.3, phyPercent: 87.3, objCount: 520000, readBw: 320, readBwTrend: genTrend(24, 200, 500), writeBw: 180, writeBwTrend: genTrend(24, 100, 300), iops: 4500, iopsTrend: genTrend(24, 2000, 7000), lat: 5.2, latTrend: genTrend(24, 3, 10) } },
  { id: 'pool-002', name: 'backupPool', safety: '柜级', ecRatio: '8+2', redundancy: 'THREE_AZ', cacheDisk: 'SAS SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-001', health: 'degraded', metrics: { phyTotal: 60, phyUsed: 43.2, phyPercent: 72, objCount: 180000, readBw: 150, readBwTrend: genTrend(24, 80, 250), writeBw: 90, writeBwTrend: genTrend(24, 50, 180), iops: 2200, iopsTrend: genTrend(24, 1000, 4000), lat: 8.5, latTrend: genTrend(24, 4, 15) } },
  { id: 'pool-003', name: 'test_ec', safety: '节点级', ecRatio: '12+3', redundancy: 'FUSION', cacheDisk: 'NVMe SSD', mainDisk: 'NL-SAS HDD', sc: 'sc-003', health: 'migrating', metrics: { phyTotal: 50, phyUsed: 32.5, phyPercent: 65, objCount: 95000, readBw: 200, readBwTrend: genTrend(24, 100, 350), writeBw: 120, writeBwTrend: genTrend(24, 60, 220), iops: 3800, iopsTrend: genTrend(24, 1500, 6000), lat: 4.8, latTrend: genTrend(24, 2, 9) } },
  { id: 'pool-004', name: 'cachePool', safety: '节点级', ecRatio: '4+2', redundancy: 'ONE_AZ', cacheDisk: 'NVMe SSD', mainDisk: 'NVMe SSD', sc: 'sc-002', health: 'normal', metrics: { phyTotal: 20, phyUsed: 8.6, phyPercent: 43, objCount: 45000, readBw: 450, readBwTrend: genTrend(24, 300, 700), writeBw: 280, writeBwTrend: genTrend(24, 150, 450), iops: 8500, iopsTrend: genTrend(24, 5000, 12000), lat: 1.2, latTrend: genTrend(24, 0.5, 3) } },
  { id: 'pool-005', name: 'obsIndex', safety: '节点级', ecRatio: '6+3', redundancy: 'FUSION', cacheDisk: 'SAS SSD', mainDisk: 'SAS SSD', sc: 'sc-004', health: 'normal', metrics: { phyTotal: 15, phyUsed: 9.8, phyPercent: 65.3, objCount: 20000, readBw: 80, readBwTrend: genTrend(24, 40, 150), writeBw: 35, writeBwTrend: genTrend(24, 15, 70), iops: 1200, iopsTrend: genTrend(24, 600, 2200), lat: 3.8, latTrend: genTrend(24, 2, 7) } },
]

const buckets = [
  { name: 'bucket-data-01', createTime: '2025-03-15 10:30:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 50, used: 38.5, usage: 77, objCount: 285000, successRate: 99.99, tps: 3200, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 2000, 5000), readBw: 180, readBwTrend: genTrend(24, 100, 300), lat: 3.2, latTrend: genTrend(24, 1.5, 6), concurrency: 120, concurrencyTrend: genTrend(24, 60, 200) }, health: 'ok' },
  { name: 'bucket-log-01', createTime: '2025-04-20 14:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-001', ep: 'ep-data-01', type: 'OBJECT', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 100, used: 72.3, usage: 72.3, objCount: 420000, successRate: 99.97, tps: 4500, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 3000, 7000), readBw: 250, readBwTrend: genTrend(24, 150, 400), lat: 2.8, latTrend: genTrend(24, 1, 5), concurrency: 200, concurrencyTrend: genTrend(24, 100, 350) }, health: 'ok' },
  { name: 'bucket-backup-01', createTime: '2025-05-10 08:00:00', region: 'region-001', cluster: 'cluster-001', tenant: 'tenant-002', ep: 'ep-backup-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 200, used: 145.8, usage: 72.9, objCount: 18000, successRate: 99.95, tps: 800, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 400, 1400), readBw: 60, readBwTrend: genTrend(24, 30, 120), lat: 5.5, latTrend: genTrend(24, 3, 10), concurrency: 45, concurrencyTrend: genTrend(24, 20, 80) }, health: 'ok' },
  { name: 'bucket-media-01', createTime: '2025-06-01 16:30:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-002', ep: 'ep-media-01', type: 'POSIX', redundancy: 'FUSION', aliasTarget: '', metrics: { quota: 80, used: 52.1, usage: 65.1, objCount: 95000, successRate: 99.98, tps: 2800, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 1500, 4500), readBw: 350, readBwTrend: genTrend(24, 200, 600), lat: 2.1, latTrend: genTrend(24, 1, 4), concurrency: 180, concurrencyTrend: genTrend(24, 100, 300) }, health: 'ok' },
  { name: 'bucket-archive-01', createTime: '2025-07-05 09:00:00', region: 'region-001', cluster: 'cluster-002', tenant: 'tenant-001', ep: 'ep-archive-01', type: 'OBJECT', redundancy: 'THREE_AZ', aliasTarget: '', metrics: { quota: 500, used: 286.5, usage: 57.3, objCount: 85000, successRate: 99.99, tps: 600, successTrend: genTrend(24, 99.9, 100), tpsTrend: genTrend(24, 300, 1100), readBw: 40, readBwTrend: genTrend(24, 20, 80), lat: 6.8, latTrend: genTrend(24, 4, 12), concurrency: 30, concurrencyTrend: genTrend(24, 10, 60) }, health: 'ok' },
  { name: 'bucket-ai-01', createTime: '2025-08-12 11:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'POSIX', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 60, used: 42.8, usage: 71.3, objCount: 520000, successRate: 99.93, tps: 5600, successTrend: genTrend(24, 99.7, 100), tpsTrend: genTrend(24, 3000, 8000), readBw: 420, readBwTrend: genTrend(24, 250, 700), lat: 1.8, latTrend: genTrend(24, 0.8, 3.5), concurrency: 250, concurrencyTrend: genTrend(24, 150, 400) }, health: 'warn' },
  { name: 'bucket-backup-02', createTime: '2025-09-01 13:00:00', region: 'region-002', cluster: 'cluster-003', tenant: 'tenant-003', ep: 'ep-ai-01', type: 'OBJECT', redundancy: 'ONE_AZ', aliasTarget: '', metrics: { quota: 100, used: 58.3, usage: 58.3, objCount: 12000, successRate: 99.96, tps: 350, successTrend: genTrend(24, 99.8, 100), tpsTrend: genTrend(24, 100, 700), readBw: 25, readBwTrend: genTrend(24, 10, 60), lat: 7.2, latTrend: genTrend(24, 4, 14), concurrency: 15, concurrencyTrend: genTrend(24, 5, 35) }, health: 'ok' },
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
  { name: 'tenant-001', ep: 'ep-data-01', bucketCount: 4, objCount: 808000, used: 257.1, quota: 400, usage: 64.3, health: 'ok' },
  { name: 'tenant-002', ep: 'ep-backup-01, ep-media-01', bucketCount: 2, objCount: 113000, used: 197.9, quota: 300, usage: 66, health: 'ok' },
  { name: 'tenant-003', ep: 'ep-ai-01', bucketCount: 2, objCount: 532000, used: 101.1, quota: 200, usage: 50.6, health: 'warn' },
]

const tenantTop5 = [
  { name: 'tenant-log', ep: '企业项目-日志', bucketCount: 3, quota: 30, used: 28.2, usage: 94, successRate: 99.85, effectiveRate: 99.78, tps: '18.2k', outBw: '4.1 Gbps', inBw: '3.8 Gbps', health: 'crit' },
  { name: 'tenant-mrs', ep: '企业项目-大数据', bucketCount: 4, quota: 200, used: 156, usage: 78, successRate: 99.98, effectiveRate: 99.92, tps: '32.6k', outBw: '8.5 Gbps', inBw: '6.2 Gbps', health: 'warn' },
  { name: 'tenant-media', ep: '企业项目-媒体', bucketCount: 3, quota: 100, used: 72.1, usage: 72.1, successRate: 99.96, effectiveRate: 99.91, tps: '15.8k', outBw: '6.5 Gbps', inBw: '4.2 Gbps', health: 'warn' },
  { name: 'tenant-backup', ep: '企业项目-备份', bucketCount: 2, quota: 150, used: 98.5, usage: 65.7, successRate: 99.97, effectiveRate: 99.93, tps: '5.6k', outBw: '1.2 Gbps', inBw: '2.8 Gbps', health: 'ok' },
  { name: 'tenant-ai', ep: '企业项目-AI', bucketCount: 5, quota: 400, used: 257.1, usage: 64.3, successRate: 99.99, effectiveRate: 99.95, tps: '28.4k', outBw: '12.3 Gbps', inBw: '9.8 Gbps', health: 'ok' },
]

const enterpriseProjects = [
  { name: '企业项目-大数据', used: 156, total: 200 },
  { name: '企业项目-日志', used: 28.2, total: 30 },
  { name: '企业项目-AI', used: 257.1, total: 400 },
  { name: '企业项目-备份', used: 98.5, total: 150 },
  { name: '企业项目-媒体', used: 72.1, total: 100 },
  { name: '企业项目-测试', used: 18.6, total: 50 },
  { name: '企业项目-归档', used: 42.3, total: 80 },
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

function getNodesByCluster(clusterId) {
  return nodes.filter(n => n.cluster === clusterId)
}

function getNodesByRegion(regionId) {
  return nodes.filter(n => n.region === regionId)
}

function getPoolsBySC(scId) {
  return storagePools.filter(p => p.sc === scId)
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
  { title: '对象类型', dataIndex: 'objType', width: 80, key: 'objType' },
  { title: '对象名称', dataIndex: 'objName', width: 90, key: 'objName' },
  { title: '时间', dataIndex: 'time', width: 150, key: 'time' },
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
  { title: '租户名称', dataIndex: 'name', key: 'name', width: 100 },
  { title: '企业项目', dataIndex: 'ep', key: 'ep', ellipsis: true },
  { title: '桶数量', dataIndex: 'bucketCount', key: 'bucketCount', width: 70 },
  { title: '总容量', key: 'quota', width: 80, customRender: ({ record }) => record.quota + ' TB' },
  { title: '使用量', key: 'used', width: 80, customRender: ({ record }) => record.used + ' TB' },
  { title: '使用率', dataIndex: 'usage', key: 'usage', width: 120 },
  { title: '服务成功率', dataIndex: 'successRate', key: 'successRate', width: 100 },
  { title: '有效请求率', dataIndex: 'effectiveRate', key: 'effectiveRate', width: 100 },
  { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 70 },
  { title: '流出带宽', dataIndex: 'outBw', key: 'outBw', width: 90 },
  { title: '流入带宽', dataIndex: 'inBw', key: 'inBw', width: 90 },
]

function percentColor(p) {
  return p >= 85 ? '#f5222d' : p >= 70 ? '#fa8c16' : '#52c41a'
}

function diskStatusColor(s) {
  return s === 'online' ? '#52c41a' : s === 'degraded' ? '#fa8c16' : s === 'offline' ? '#f5222d' : '#1890ff'
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
  return { healthText, alarmLevelText, alarmLevelColor, percentColor, redundancyText, bucketTypeText, roleText, poolStatusText, diskStatusColor, regions, getDisksByNode: (n) => dataDisks.filter(d => d.node === n) }
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
    items = regions.map(r => ({ id: r.id, name: r.name, 域名: r.domain, 逻辑TB: r.metrics.logicUsed + '/' + r.metrics.logicTotal, 物理TB: r.metrics.phyUsed + '/' + r.metrics.phyTotal, 状态: r.health }))
    label = '区域列表'
    detailComponent = RegionDetail
    detailProps = (item) => {
      const r = regions.find(x => x.id === item.id)
      return { region: r, getClustersByRegion, getStorageClustersByRegion, clusters, storageClusters, storagePools, buckets, nodes, dataDisks, alarms }
    }
  }
  else if (label.includes('业务集群')) {
    items = clusters.map(c => ({ id: c.id, name: c.name, 区域: regions.find(r => r.id === c.region)?.name, 冗余: redundancyText(c.redundancy), 桶数: c.buckets, 节点数: c.nodes }))
    label = '集群列表'
    detailComponent = ClusterDetail
    detailProps = (item) => {
      const c = clusters.find(x => x.id === item.id)
      return { cluster: c, getBucketsByCluster, getNodesByCluster, buckets, nodes, dataDisks, alarms }
    }
  }
  else if (label.includes('存储集群')) {
    items = storageClusters.map(s => ({ id: s.id, name: s.name, 区域: regions.find(r => r.id === s.region)?.name, 池数: s.pools }))
    label = '存储集群列表'
    detailComponent = SCDetail
    detailProps = (item) => {
      const s = storageClusters.find(x => x.id === item.id)
      return { sc: s, getPoolsBySC, storagePools, alarms }
    }
  }
  else if (label.includes('存储池')) {
    items = storagePools.map(p => ({ id: p.id, name: p.name, 类型: p.type, 总量TB: p.metrics.total, 已用TB: p.metrics.used, 使用率: p.metrics.usedPercent + '%' }))
    label = '存储池列表'
    detailComponent = PoolDetail
    detailProps = (item) => {
      const p = storagePools.find(x => x.id === item.id)
      return { pool: p, buckets: getBucketsByPool(p.id), alarms }
    }
  }
  else if (label.includes('节点')) {
    items = nodes.map(n => ({ id: n.id, name: n.name, 角色: roleText(n.role), CPU: n.metrics.cpu + '%', 内存: n.metrics.mem + '%', 磁盘: n.metrics.disk + '%', 状态: n.health }))
    label = '节点列表'
    detailComponent = NodeDetail
    detailProps = (item) => {
      const n = nodes.find(x => x.id === item.id)
      return { node: n, dataDisks, alarms }
    }
  }
  else if (label.includes('数据盘')) { items = dataDisks; label = '数据盘列表' }
  else if (label.includes('桶')) { items = buckets; label = '桶列表' }
  else if (label.includes('租户')) { items = tenants; label = '租户列表' }
  else if (label.includes('企业项目')) { items = enterpriseProjects; label = '企业项目列表' }
  openDrawer(StatListDrawer, { items, type: label, detailComponent, detailProps }, label)
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

const StatListDrawer = {
  props: ['items', 'type', 'detailComponent', 'detailProps'],
  template: `<div class="drawer-content">
    <h3 class="drawer-content-title">{{ type }}</h3>
    <div class="stat-list-table-wrap"><table class="stat-list-table"><thead><tr><th v-for="h in headers" :key="h">{{ h }}</th></tr></thead>
    <tbody><tr v-for="(item, i) in items" :key="i" @click="handleClick(item)"><td v-for="(v, k) in item" :key="k" v-if="showKey(k)">{{ formatValue(v) }}</td></tr></tbody></table></div>
  </div>`,
  setup(props, { emit }) {
    const headers = computed(() => props.items.length ? Object.keys(props.items[0]).filter(k => showKey(k)) : [])
    function showKey(k) { return !['id', 'metrics', 'desc', 'diagSteps', 'recovery', 'status', 'objId', 'objType', 'processes', 'aliasTarget', 'createTime', 'ep', 'time', 'successTrend', 'tpsTrend', 'readBwTrend', 'latTrend', 'concurrencyTrend', 'bwTrend', 'connsTrend', 'logicUsedTrend', 'phyUsedTrend', 'objCountTrend', 'effectiveTrend', 'inBw', 'outBw', 'effectiveRate', 'successRate', 'tps'].includes(k) && k !== 'level' && k !== 'esn' }
    function formatValue(v) { return typeof v === 'object' ? JSON.stringify(v) : v }
    function handleClick(item) {
      if (props.detailComponent && props.detailProps) {
        emit('navigate', { component: props.detailComponent, props: props.detailProps(item), label: item.name || item.id })
      }
    }
    return { headers, showKey, formatValue, handleClick }
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
    return { emit, ...useHelpers() }
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
      <h4 class="detail-section-title">桶列表</h4>
      <table class="inner-table"><thead><tr><th>桶名称</th><th>类型</th><th>冗余策略</th><th>配额(TB)</th><th>已用(TB)</th><th>对象数</th><th>成功率</th><th>TPS</th><th>健康状态</th></tr></thead>
      <tbody><tr v-for="b in getBucketsByCluster(cluster.id)" :key="b.name" @click="emit('navigate', { component: BucketDetail, props: { bucket: b, alarms }, label: b.name })">
        <td>{{ b.name }}</td><td>{{ bucketTypeText(b.type) }}</td><td>{{ redundancyText(b.redundancy) }}</td><td>{{ b.metrics.quota }}</td><td>{{ b.metrics.used }}</td><td>{{ b.metrics.objCount.toLocaleString() }}</td><td>{{ b.metrics.successRate }}%</td><td>{{ b.metrics.tps }}</td><td><span class="health-tag" :class="b.health">{{ healthText(b.health) }}</span></td>
      </tr></tbody></table>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">节点列表</h4>
      <div class="node-card-grid">
        <div class="node-card" v-for="n in getNodesByCluster(cluster.id)" :key="n.name" @click="emit('navigate', { component: NodeDetail, props: { node: n, dataDisks, alarms }, label: n.name })">
          <div class="node-card-hdr">{{ n.name }}<span class="health-tag-sm" :class="n.health">{{ healthText(n.health) }}</span></div>
          <div class="node-card-info"><span>{{ roleText(n.role) }}</span></div>
          <div class="node-card-metrics"><span>CPU: {{ n.metrics.cpu }}%</span><span>内存: {{ n.metrics.mem }}%</span><span>磁盘: {{ n.metrics.disk }}%</span></div>
          <div class="node-card-bar"><div class="bar-fill" :style="{ width: n.metrics.cpu + '%', background: percentColor(n.metrics.cpu) }"></div></div>
        </div>
      </div>
    </div>
  </div>`,
  setup(props, { emit }) {
    return { emit, ...useHelpers() }
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
      <table class="inner-table"><thead><tr><th>进程名称</th><th>PID</th><th>状态</th><th>CPU%</th><th>内存%</th></tr></thead>
      <tbody><tr v-for="p in node.processes" :key="p.pid">
        <td>{{ p.name }}</td><td>{{ p.pid }}</td><td><span class="proc-status" :class="p.status">{{ p.status === 'normal' ? '正常' : p.status === 'warn' ? '警告' : '异常' }}</span></td><td>{{ p.cpu }}%</td><td>{{ p.mem }}%</td>
      </tr></tbody></table>
    </div>
    <div class="detail-section">
      <h4 class="detail-section-title">数据盘列表</h4>
      <div class="disk-card-grid">
        <div class="disk-card" v-for="d in getDisksByNode(node.name)" :key="d.esn">
          <div class="disk-card-hdr">{{ d.slot }}<span class="disk-status" :style="{ background: diskStatusColor(d.health) }">{{ d.health === 'online' ? '在线' : d.health === 'degraded' ? '降级' : '离线' }}</span></div>
          <div class="disk-card-info"><span>{{ d.media }}</span><span>{{ d.role }}</span></div>
          <div class="disk-card-cap"><span>{{ d.metrics.capacity }} TB</span><span>已用 {{ d.metrics.used }} TB</span><span>{{ d.metrics.usage }}%</span></div>
          <div class="disk-card-cap"><span>带宽 {{ d.metrics.bw }} MB/s</span><span>IOPS {{ d.metrics.iops.toLocaleString() }}</span></div>
        </div>
      </div>
    </div>
  </div>`,
  setup(props) {
    return { ...useHelpers() }
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
    return { emit, ...useHelpers() }
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
  </div>`,
  setup(props) {
    return { emit: () => {}, ...useHelpers() }
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
        <div class="detail-info-item"><span class="dii-label">状态</span><span class="dii-value">{{ alarm.status === 'active' ? '活动' : alarm.status === 'cleared' ? '已清除' : '已确认' }}</span></div>
      </div>
    </div>
    <div class="detail-section" v-if="alarm.diagSteps && alarm.diagSteps.length">
      <h4 class="detail-section-title">诊断步骤</h4>
      <ol class="diag-steps"><li v-for="(step, i) in alarm.diagSteps" :key="i">{{ step }}</li></ol>
    </div>
    <div class="detail-section" v-if="alarm.recovery">
      <h4 class="detail-section-title">修复建议</h4>
      <p class="recovery-text">{{ alarm.recovery }}</p>
    </div>
  </div>`,
  setup(props) {
    return { ...useHelpers() }
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
  </div>`,
  setup(props) {
    return { ...useHelpers() }
  }
}

const slaChartRefs = reactive({})
const bwChartRefs = reactive({})
const scChartRefs = reactive({})
let chartInstances = []

function renderRegionCharts() {
  clusters.forEach((cl, i) => {
    if (slaChartRefs[cl.id]) {
      const c = new Chart({ container: slaChartRefs[cl.id], autoFit: true, padding: [4, 4, 16, 20] })
      chartInstances.push(c)
      const sucData = cl.metrics.successTrend.map(d => ({ time: d.time, value: d.value, type: '成功率' }))
      const effData = cl.metrics.effectiveTrend.map(d => ({ time: d.time, value: d.value, type: '有效请求率' }))
      const allData = [...sucData, ...effData]
      c.area().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('fillOpacity', 0.15).style('shape', 'smooth')
      c.line().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('lineWidth', 1.5).style('shape', 'smooth')
      c.scale('color', { range: ['#52c41a', '#1890ff'] })
      c.render()
    }
    if (bwChartRefs[cl.id]) {
      const c = new Chart({ container: bwChartRefs[cl.id], autoFit: true, padding: [4, 4, 16, 20] })
      chartInstances.push(c)
      const outData = cl.metrics.bwTrend ? cl.metrics.bwTrend.map(d => ({ time: d.time, value: d.value, type: '流出带宽' })) : genTrend(30, 1, 4).map(d => ({ ...d, type: '流出带宽' }))
      const inData = genTrend(30, 0.8, 3.5).map(d => ({ ...d, type: '流入带宽' }))
      const allData = [...outData, ...inData]
      c.area().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('fillOpacity', 0.15).style('shape', 'smooth')
      c.line().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'type')
        .style('lineWidth', 1.5).style('shape', 'smooth')
      c.scale('color', { range: ['#1890ff', '#722ed1'] })
      c.render()
    }
  })

  storageClusters.forEach((sc, i) => {
    if (scChartRefs[sc.id]) {
      const c = new Chart({ container: scChartRefs[sc.id], autoFit: true, padding: [4, 4, 16, 20] })
      chartInstances.push(c)
      const pools = getPoolsBySC(sc.id)
      const allData = []
      pools.forEach((p, pi) => {
        p.metrics.readBwTrend.forEach((d, di) => {
          allData.push({ time: d.time, value: d.value, pool: p.name })
        })
      })
      c.area().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'pool')
        .style('fillOpacity', 0.15).style('shape', 'smooth')
      c.line().data(allData).encode('x', 'time').encode('y', 'value').encode('color', 'pool')
        .style('lineWidth', 1.5).style('shape', 'smooth')
      c.render()
    }
  })
}

onMounted(() => {
  lastRefresh.value = new Date().toLocaleString()
  nextTick(() => {
    renderRegionCharts()
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
.obs-section-title { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

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

.tenant-ep-section { display: flex; gap: 16px; }
.tenant-top5-table { width: 60%; overflow-x: auto; }
.tenant-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tenant-table-title { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.tenant-search { width: 200px; }
.cap-bar-sm { display: inline-block; width: 60px; height: 5px; background: #f0f0f0; border-radius: 3px; overflow: hidden; vertical-align: middle; }
.cap-pct-sm { font-size: 11px; color: #595959; margin-left: 4px; }

.tenant-charts { width: 40%; display: flex; flex-direction: row; gap: 12px; }
.tc-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px; flex: 1; }
.tc-hdr { font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
.tc-chart { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; }

.donut-svg { width: 160px; height: 160px; flex-shrink: 0; margin-top: 40px; }
.donut-legend { display: flex; flex-direction: column; gap: 4px; margin-left: 12px; margin-top: 40px; font-size: 11px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-label { color: #595959; }
.legend-value { color: #8c8c8c; margin-left: auto; }

.bar-svg { width: 100%; height: 100%; margin-top: 40px; }
.bar-label { font-size: 9px; fill: #595959; }
.bar-name { font-size: 10px; fill: #8c8c8c; }

.anatomy-block { margin-bottom: 16px; }
.anatomy-block.collapsed .obs-section-title,
.anatomy-block.collapsed .cluster-detail-grid,
.anatomy-block.collapsed .sc-detail-grid,
.anatomy-block.collapsed .node-grid { display: none; }
.anatomy-block-title { display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 600; color: #1a1a1a; padding: 10px 0; border-bottom: 1px solid #e8e8e8; margin-bottom: 8px; }

.cluster-detail-grid { margin-bottom: 10px; }
.cluster-detail-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.cluster-detail-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.cdc-header { margin-bottom: 10px; }
.cdc-name { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.cdc-meta { display: flex; gap: 10px; font-size: 11px; color: #8c8c8c; flex-wrap: wrap; }
.cdc-capacity { margin-bottom: 10px; }
.cdc-cap-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; }
.cdc-cap-label { width: 30px; color: #8c8c8c; flex-shrink: 0; }
.cdc-cap-text { width: 100px; color: #1a1a1a; flex-shrink: 0; }
.cdc-cap-pct { width: 40px; text-align: right; color: #595959; font-weight: 500; flex-shrink: 0; }
.cdc-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.cdc-chart-col { }
.cdc-chart-label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; }
.cdc-chart-box { width: 100%; height: 120px; }
.cdc-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
.cdc-kpi { display: flex; flex-direction: column; gap: 2px; padding: 8px; background: #fafafa; border-radius: 6px; }
.cdc-kpi-label { font-size: 11px; color: #8c8c8c; }
.cdc-kpi-val { font-size: 16px; font-weight: 700; color: #1a1a1a; }

.honeycomb { display: flex; flex-wrap: wrap; gap: 6px; }
.hex-cell { width: 72px; height: 64px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s; }
.hex-cell:hover { transform: scale(1.08); }
.hex-green { background: #f6ffed; }
.hex-orange { background: #fff7e6; }
.hex-red { background: #fff1f0; }
.hex-inner { text-align: center; }
.hex-name { font-size: 9px; color: #595959; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60px; }
.hex-val { font-size: 12px; font-weight: 700; color: #1a1a1a; }

.sc-detail-grid { margin-bottom: 10px; }
.sc-detail-card { border: 1px solid #e8e8e8; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.sc-detail-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.1); }
.sdc-header { margin-bottom: 10px; }
.sdc-name { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.sdc-meta { display: flex; gap: 10px; font-size: 11px; color: #8c8c8c; align-items: center; }

.pool-waterfall { margin-bottom: 8px; }
.pool-wl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.pool-wl-name { width: 80px; color: #595959; flex-shrink: 0; font-size: 11px; }
.pw-fill-track { flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.pw-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.pool-wl-label { width: 100px; color: #595959; flex-shrink: 0; font-size: 11px; }
.pool-wl-val { width: 40px; text-align: right; color: #1a1a1a; font-weight: 500; flex-shrink: 0; font-size: 11px; }

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
