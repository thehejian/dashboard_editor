<template>
  <div class="page-view">
    <div class="page-header"><h2>个性化</h2></div>
    <a-tabs v-model:activeKey="activeTab" class="content-tabs">
      <a-tab-pane key="display" tab="显示设置">
        <div class="setting-section">
          <div class="setting-item">
            <div class="setting-label">
              <span>告警行高亮</span>
              <span class="setting-desc">紧急告警行红色背景、重要告警行橙色背景</span>
            </div>
            <a-switch v-model:checked="settings.highlightRows" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>自动刷新</span>
              <span class="setting-desc">当前告警列表自动刷新间隔</span>
            </div>
            <a-select v-model:value="settings.refreshInterval" style="width:140px">
              <a-select-option :value="10">10秒</a-select-option>
              <a-select-option :value="30">30秒</a-select-option>
              <a-select-option :value="60">60秒</a-select-option>
              <a-select-option :value="0">关闭</a-select-option>
            </a-select>
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>表格列宽度自适应</span>
              <span class="setting-desc">告警列表列宽根据内容自动调整</span>
            </div>
            <a-switch v-model:checked="settings.autoWidth" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>显示资源详情</span>
              <span class="setting-desc">在列表中显示资源的完整区域信息</span>
            </div>
            <a-switch v-model:checked="settings.showRegion" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>数字格式化</span>
              <span class="setting-desc">数值型字段使用千分位分隔符</span>
            </div>
            <a-switch v-model:checked="settings.formatNumbers" />
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="notification" tab="通知偏好">
        <div class="setting-section">
          <div class="setting-item">
            <div class="setting-label">
              <span>声音提醒</span>
              <span class="setting-desc">收到紧急告警时播放提示音</span>
            </div>
            <a-switch v-model:checked="settings.soundAlert" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>浏览器通知</span>
              <span class="setting-desc">使用浏览器桌面通知推送告警</span>
            </div>
            <a-switch v-model:checked="settings.browserNotify" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>仅通知紧急告警</span>
              <span class="setting-desc">桌面通知只针对紧急级别告警</span>
            </div>
            <a-switch v-model:checked="settings.urgentOnly" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>通知免打扰时段</span>
              <span class="setting-desc">设定时间段内不发送桌面通知</span>
            </div>
            <a-time-picker v-model:value="settings.dndStart" style="width:140px" />
            <span style="margin:0 8px;color:#8c8c8c">至</span>
            <a-time-picker v-model:value="settings.dndEnd" style="width:140px" />
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>告警聚合</span>
              <span class="setting-desc">相同类型的告警合并为一条通知</span>
            </div>
            <a-switch v-model:checked="settings.aggregation" />
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="theme" tab="主题设置">
        <div class="theme-grid">
          <div class="theme-card" :class="{ active: settings.theme === 'light' }" @click="settings.theme = 'light'">
            <div class="theme-preview light-preview"></div>
            <div class="theme-name">明亮模式</div>
          </div>
          <div class="theme-card" :class="{ active: settings.theme === 'dark' }" @click="settings.theme = 'dark'">
            <div class="theme-preview dark-preview"></div>
            <div class="theme-name">暗黑模式</div>
          </div>
          <div class="theme-card" :class="{ active: settings.theme === 'system' }" @click="settings.theme = 'system'">
            <div class="theme-preview system-preview"></div>
            <div class="theme-name">跟随系统</div>
          </div>
        </div>
        <div class="setting-section" style="margin-top:24px">
          <div class="setting-item">
            <div class="setting-label">
              <span>品牌色</span>
              <span class="setting-desc">选择告警系统的主题色</span>
            </div>
            <a-radio-group v-model:value="settings.brandColor">
              <a-radio value="#007DFF">蓝色</a-radio>
              <a-radio value="#52C41A">绿色</a-radio>
              <a-radio value="#722ED1">紫色</a-radio>
              <a-radio value="#FA8C16">橙色</a-radio>
            </a-radio-group>
          </div>
          <div class="setting-item">
            <div class="setting-label">
              <span>告警颜色映射</span>
              <span class="setting-desc">自定义各级别告警的颜色</span>
            </div>
            <div class="color-mapping">
              <span class="mapping-item"><span class="dot" style="background:#F5222D"></span>紧急</span>
              <a-color-picker v-model:value="settings.colors.critical" show-text />
            </div>
            <div class="color-mapping">
              <span class="mapping-item"><span class="dot" style="background:#FA8C16"></span>重要</span>
              <a-color-picker v-model:value="settings.colors.warning" show-text />
            </div>
            <div class="color-mapping">
              <span class="mapping-item"><span class="dot" style="background:#1890FF"></span>次要</span>
              <a-color-picker v-model:value="settings.colors.info" show-text />
            </div>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="columns" tab="列显示">
        <div class="setting-section">
          <div class="setting-item" v-for="col in columnSettings" :key="col.key">
            <div class="setting-label"><span>{{ col.title }}</span><span class="setting-desc">{{ col.desc }}</span></div>
            <a-switch v-model:checked="col.visible" />
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeTab = ref('display')

const settings = reactive({
  highlightRows: true,
  refreshInterval: 30,
  autoWidth: false,
  showRegion: true,
  formatNumbers: true,
  soundAlert: false,
  browserNotify: true,
  urgentOnly: true,
  dndStart: null,
  dndEnd: null,
  aggregation: true,
  theme: 'light',
  brandColor: '#007DFF',
  colors: { critical: '#F5222D', warning: '#FA8C16', info: '#1890FF' },
})

const columnSettings = ref([
  { key: 'title', title: '告警名称', desc: '显示告警标题', visible: true },
  { key: 'resource', title: '资源', desc: '显示告警资源', visible: true },
  { key: 'level', title: '告警级别', desc: '显示紧急/重要/次要标签', visible: true },
  { key: 'metric', title: '告警指标', desc: '显示触发的指标名称', visible: true },
  { key: 'currentValue', title: '当前值', desc: '显示指标当前值', visible: true },
  { key: 'threshold', title: '阈值', desc: '显示触发阈值', visible: true },
  { key: 'status', title: '告警状态', desc: '显示告警中/已恢复/已屏蔽', visible: true },
  { key: 'duration', title: '持续时间', desc: '显示告警持续时间', visible: true },
  { key: 'triggerTime', title: '触发时间', desc: '显示告警触发时间', visible: true },
  { key: 'recoveryTime', title: '恢复时间', desc: '显示告警恢复时间', visible: false },
  { key: 'action', title: '操作', desc: '显示操作按钮', visible: true },
])
</script>

<style scoped>
.page-view { display: flex; flex-direction: column; padding: 16px 0 0; height: 100%; }
.page-header { margin-bottom: 16px; flex-shrink: 0; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.content-tabs { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.content-tabs :deep(.ant-tabs-nav) { margin: 0 0 16px 0 !important; }
.content-tabs :deep(.ant-tabs-content-holder) { flex: 1; min-height: 0; overflow: auto; }
.content-tabs :deep(.ant-tabs-content) { height: 100%; }
.content-tabs :deep(.ant-tabs-tabpane) { height: 100%; }

.setting-section { padding: 0 8px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
.setting-item:last-child { border-bottom: none; }
.setting-label { display: flex; flex-direction: column; gap: 4px; }
.setting-label span:first-child { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.setting-desc { font-size: 12px; color: #8c8c8c; }

.theme-grid { display: flex; gap: 16px; padding: 0 8px; margin-bottom: 24px; }
.theme-card { width: 160px; border: 2px solid #f0f0f0; border-radius: 8px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.theme-card.active { border-color: var(--brand); }
.theme-card:hover { border-color: #d9d9d9; }
.theme-card.active:hover { border-color: var(--brand); }
.theme-preview { height: 100px; }
.light-preview { background: #fff; border-bottom: 1px solid #f0f0f0; }
.dark-preview { background: #141414; }
.system-preview { background: linear-gradient(to right, #fff 50%, #141414 50%); }
.theme-name { padding: 8px; text-align: center; font-size: 13px; color: #595959; }

.color-mapping { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.mapping-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #595959; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }

@media (max-width: 768px) {
  .theme-grid { flex-direction: column; }
  .setting-item { flex-direction: column; align-items: flex-start; gap: 12px; }
  .setting-item .ant-switch,
  .setting-item .ant-select,
  .setting-item .ant-time-picker { width: 100% !important; }
}
</style>
