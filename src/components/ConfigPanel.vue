<template>
  <aside class="config-panel" :class="{ open: state.configOpen }">
    <div class="config-header">
      <h2>配置 · {{ currentChart?.title || '图表' }}</h2>
      <a-button type="text" size="small" @click="closeConfig"><i class="fa-solid fa-xmark"></i></a-button>
    </div>
    <div class="config-tabs">
      <a-button type="text" :class="{ active: state.configTab === 'data' }" @click="switchTab('data')" style="flex:1;border-radius:0;height:40px;font-size:13px;font-weight:500">数据</a-button>
      <a-button type="text" :class="{ active: state.configTab === 'style' }" @click="switchTab('style')" style="flex:1;border-radius:0;height:40px;font-size:13px;font-weight:500">样式</a-button>
    </div>
    <div class="config-scroll">

      <!-- ═══ DATA TAB ═══ -->
      <template v-if="state.configTab === 'data'">
        <div class="config-section">
          <span class="config-label">数据集</span>
          <a-radio-group v-model:value="state.dsType" button-style="solid" size="small" @change="e => switchDSType(e.target.value)">
            <a-radio-button value="group">按分组</a-radio-button>
            <a-radio-button value="resource">按资源类型</a-radio-button>
          </a-radio-group>
          <a-cascader
            v-model:value="state.dsValue"
            style="width:100%"
            :options="cascaderOptions"
            :show-search="{ filter }"
            placeholder="搜索或选择数据集..."
            @change="onCascaderChange"
          />
        </div>
        <div class="config-section">
          <span class="config-label">统计周期</span>
          <a-select v-model:value="state.period" style="width:100%">
            <a-select-option value="now">实时当前值</a-select-option>
            <a-select-option value="1h">最近 1 小时</a-select-option>
            <a-select-option value="6h">最近 6 小时</a-select-option>
            <a-select-option value="24h">最近 24 小时</a-select-option>
            <a-select-option value="7d">最近 7 天</a-select-option>
            <a-select-option value="30d">最近 30 天</a-select-option>
          </a-select>
        </div>
        <div class="config-section">
          <span class="config-label">采集周期</span>
          <a-select v-model:value="state.interval" style="width:100%">
            <a-select-option value="10s">10 秒</a-select-option>
            <a-select-option value="30s">30 秒</a-select-option>
            <a-select-option value="1m">1 分钟</a-select-option>
            <a-select-option value="5m">5 分钟</a-select-option>
            <a-select-option value="15m">15 分钟</a-select-option>
            <a-select-option value="1h">1 小时</a-select-option>
          </a-select>
        </div>

        <div class="group-header">监控</div>

        <div class="config-section">
          <span class="config-label">监控指标</span>
          <a-select
            mode="multiple"
            v-model:value="state.selectedMetrics"
            style="width:100%"
            placeholder="点击选择指标"
            :options="availableMetrics.map(m => ({value:m, label:m}))"
          />
        </div>

        <div class="config-section">
          <span class="config-label">监控对象</span>
          <a-radio-group v-model:value="state.objType" button-style="solid" size="small" style="width:100%">
            <a-radio-button value="all" style="flex:1;text-align:center">全部资源</a-radio-button>
            <a-radio-button value="group" style="flex:1;text-align:center">资源分组</a-radio-button>
            <a-radio-button value="spec" style="flex:1;text-align:center">指定资源</a-radio-button>
          </a-radio-group>

          <div v-if="state.objType === 'all'" class="obj-content">
            <span class="config-label" style="text-transform:none;letter-spacing:0">聚合方式</span>
            <a-radio-group v-model:value="state.aggType" size="small">
              <a-radio value="avg">平均值</a-radio>
              <a-radio value="max">最大值</a-radio>
              <a-radio value="min">最小值</a-radio>
            </a-radio-group>
            <div class="obj-row" style="margin-top:4px">
              <span class="config-label" style="text-transform:none;letter-spacing:0;white-space:nowrap">展示规则</span>
              <span class="spinner-group">
                <a-button size="small" @click="spinTop(-1)">−</a-button>
                <span class="spinner-value">{{ state.topN }}</span>
                <a-button size="small" @click="spinTop(1)">+</a-button>
              </span>
            </div>
            <div class="obj-hint">{{ objHint }}</div>
          </div>
          <div v-if="state.objType === 'group'" class="obj-content">
            <a-select style="width:100%">
              <a-select-option value="prod">生产环境</a-select-option>
              <a-select-option value="test">测试环境</a-select-option>
              <a-select-option value="pre">预发布</a-select-option>
              <a-select-option value="dr">容灾环境</a-select-option>
            </a-select>
          </div>
          <div v-if="state.objType === 'spec'" class="obj-content">
            <a-select
              mode="multiple"
              v-model:value="state.selectedResources"
              style="width:100%"
              placeholder="选择资源实例..."
              :options="ALL_RESOURCES.map(r => ({value:r, label:r}))"
            />
          </div>
        </div>

        <div class="config-section">
          <span class="config-label">推荐图表</span>
          <div class="rec-charts" v-if="state.selectedMetrics.length">
            <a-button
              v-for="chart in recommendedCharts.items"
              :key="chart.t"
              size="small"
              :type="chart.t === recommendedCharts.cur ? 'primary' : 'default'"
              @click="pickRec(chart.t)"
              :style="{ opacity: recommendedCharts.types.includes(chart.t) ? 1 : 0.4 }"
            >
              <i :class="chart.i"></i> {{ chart.l }}
            </a-button>
          </div>
          <div v-else style="font-size:12px;color:var(--text-ter)">选择指标后将自动推荐图表类型</div>
        </div>
      </template>

      <!-- ═══ STYLE TAB ═══ -->
      <template v-if="state.configTab === 'style' && currentChart">
        <div class="group-header first">基础信息</div>
        <div class="config-section">
          <span class="config-label">图表名称</span>
          <a-input v-model:value="currentChart.title" placeholder="输入图表名称..." />
        </div>
        <div class="config-section">
          <span class="config-label">所属分组</span>
          <a-select v-model:value="currentChart.group" style="width:100%">
            <a-select-option v-for="g in GROUPS" :key="g" :value="g">{{ g }}</a-select-option>
          </a-select>
        </div>
        <div class="config-section">
          <span class="config-label">备注</span>
          <a-textarea v-model:value="currentChart.notes" placeholder="添加备注..." :rows="3" />
        </div>

        <div class="group-header">图例</div>
        <div class="config-section">
          <span class="config-label">图例位置</span>
          <a-radio-group v-model:value="currentChart.legendPosition" size="small">
            <a-radio value="none">不显示</a-radio>
            <a-radio value="top">顶部</a-radio>
            <a-radio value="bottom">底部</a-radio>
            <a-radio value="right">右侧</a-radio>
          </a-radio-group>
        </div>

        <div class="group-header">阈值</div>
        <div class="config-section">
          <div v-for="(t, i) in currentChart.thresholds" :key="i" class="threshold-row">
            <a-button size="small" type="text" danger @click="removeThreshold(i)" :style="{ visibility: currentChart.thresholds.length === 1 && !currentChart.thresholds[0].value ? 'hidden' : 'visible' }">
              <i class="fa-solid fa-xmark"></i>
            </a-button>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <label v-for="l in TH_COLORS" :key="l.key" style="display:inline-flex;align-items:center;gap:3px;font-size:11px;cursor:pointer;">
                {{ l.label }}
                <span :style="{ width:'10px',height:'10px',borderRadius:'50%',background:l.color,display:'inline-block' }"></span>
                <input type="radio" :name="'thLevel_' + i" :value="l.key" :checked="t.level === l.key" @change="updateThLevel(i, l.key)" style="margin:0">
              </label>
            </div>
            <a-input-number
              v-model:value="t.value"
              placeholder="阈值"
              style="width:80px"
              size="small"
              @change="updateThValue(i, $event)"
            />
          </div>
          <a-button type="dashed" size="small" @click="addThreshold" style="margin-top:4px">
            <i class="fa-solid fa-plus"></i> 添加阈值
          </a-button>
        </div>

        <div class="group-header">链接</div>
        <div class="config-section">
          <div class="config-toggle">
            <span class="config-label">开启链接</span>
            <a-switch v-model:checked="currentChart.linkEnabled" />
          </div>
        </div>
        <div class="config-section" v-if="currentChart.linkEnabled">
          <span class="config-label">链接 URL</span>
          <a-input v-model:value="currentChart.linkUrl" placeholder="https://..." />
        </div>
      </template>

    </div>
    <div class="config-footer">
      <a-button @click="closeConfig">取消</a-button>
      <a-button type="primary" @click="handleApply">更新预览</a-button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorState } from '../composables/useEditorState'

const {
  state, currentChart, CASCADE, ALL_RESOURCES, GROUPS, TH_COLORS,
  currentCategory, availableMetrics, recommendedCharts,
  closeConfig, switchTab, switchDSType,
  spinTop, pickRec,
  addThreshold, removeThreshold, updateThValue, updateThLevel,
  toast, refreshChart,
} = useEditorState()

const cascaderOptions = computed(() =>
  CASCADE[state.dsType].map((cat, i) => ({
    value: i,
    label: cat.name,
    children: cat.items.length ? cat.items.map((sub, j) => ({
      value: j,
      label: sub.name,
    })) : undefined,
  }))
)

function filter(inputValue, path) {
  return path.some(o => o.label.toLowerCase().includes(inputValue.toLowerCase()))
}

function onCascaderChange() {
  state.selectedMetrics = []
}

function handleApply() {
  const ch = currentChart.value
  if (ch && state.selectedMetrics.length) {
    ch.metrics = [...state.selectedMetrics]
  }
  refreshChart(state.selectedId)
  toast('图表已更新')
}

const objHint = computed(() => {
  const m = state.selectedMetrics[0] || 'CPU使用率'
  const aggMap = { avg: '平均值', max: '最大值', min: '最小值' }
  const agg = aggMap[state.aggType] || '最大值'
  return `${m}${agg}的 降序 Top ${state.topN}`
})
</script>

<style scoped>
.config-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; height: 100%; background: var(--bg); border-left: 1px solid var(--border); z-index: 50; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s var(--ease); box-shadow: -8px 0 24px rgba(0,0,0,0.04); }
.config-panel.open { transform: translateX(0); }
.config-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.config-header h2 { font-size: 14px; font-weight: 600; color: var(--text); }
.config-tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.config-tabs .active { color: var(--brand); border-bottom: 2px solid var(--brand); }
.config-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding: 24px 20px 20px; display: flex; flex-direction: column; gap: 24px; min-height: 0; }
.config-section { display: flex; flex-direction: column; gap: 8px; }
.config-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-ter); }
.group-header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-sec); padding: 8px 0 4px; border-top: 1px solid var(--border); margin-top: 4px; }
.group-header.first { border-top: none; margin-top: 0; padding-top: 0; }
.obj-content { margin-top: 4px; display: flex; flex-direction: column; gap: 8px; }
.obj-row { display: flex; align-items: center; gap: 8px; }
.obj-hint { font-size: 11px; color: var(--text-sec); padding: 4px 0; }
.spinner-group { display: flex; align-items: center; gap: 4px; }
.spinner-group .spinner-value { width: 40px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); }
.rec-charts { display: flex; gap: 6px; flex-wrap: wrap; }
.threshold-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.config-toggle { display: flex; align-items: center; justify-content: space-between; }
.config-footer { display: flex; gap: 8px; padding: 10px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }
.config-footer button { flex: 1; }

@media (max-width: 1024px) { .config-panel { width: 360px; } }
@media (max-width: 768px) { 
  .config-panel { width: 100%; height: 100%; }
  .config-scroll { padding: 16px; }
  .config-footer { padding: 16px; flex-shrink: 0; }
}
@media (max-width: 420px) { 
  .config-scroll { padding: 12px; }
  .config-footer { padding: 12px; }
}
</style>
