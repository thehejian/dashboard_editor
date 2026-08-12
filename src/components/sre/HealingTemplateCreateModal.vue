<template>
  <a-modal
    :open="open"
    title="新建自愈策略模板"
    width="800px"
    centered
    @cancel="emit('close')"
    :footer="null"
  >
    <div class="tmpl-form">
      <div class="tmpl-section">
        <div class="tmpl-section-title">① 基本信息</div>
        <div class="tmpl-field-row">
          <div class="tmpl-field" style="flex:3">
            <label>模板名称 *</label>
            <a-input v-model:value="form.name" placeholder="例：数据库连接池耗尽自愈" />
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>模板类型</label>
            <a-select v-model:value="form.type" style="width:100%">
              <a-select-option value="static">静态规则策略</a-select-option>
              <a-select-option value="ai">AI 智能推荐</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="tmpl-field">
          <label>模板描述</label>
          <a-textarea v-model:value="form.description" placeholder="描述模板的作用场景..." :rows="2" />
        </div>
        <div class="tmpl-field-row">
          <div class="tmpl-field" style="flex:1">
            <label>所属应用 *</label>
            <a-select v-model:value="form.app" style="width:100%" placeholder="选择应用">
              <a-select-option value="订单服务">订单服务</a-select-option>
              <a-select-option value="用户服务">用户服务</a-select-option>
              <a-select-option value="支付服务">支付服务</a-select-option>
              <a-select-option value="库存服务">库存服务</a-select-option>
              <a-select-option value="消息服务">消息服务</a-select-option>
            </a-select>
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>目标节点 *</label>
            <a-select v-model:value="form.targetNode" style="width:100%" placeholder="选择节点" mode="multiple">
              <a-select-option value="mysql-master">mysql-master</a-select-option>
              <a-select-option value="redis-cache">redis-cache</a-select-option>
              <a-select-option value="prod-order-01">prod-order-01</a-select-option>
              <a-select-option value="lb-api">lb-api</a-select-option>
              <a-select-option value="mq-order">mq-order</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="tmpl-field">
          <label>标签</label>
          <div class="tmpl-tags">
            <a-tag v-for="(t, i) in form.tags" :key="i" closable @close="form.tags.splice(i, 1)">{{ t }}</a-tag>
            <a-input v-if="tagInputVisible" v-model:value="tagInput" ref="tagInputRef" size="small" style="width:80px" @press-enter="addTag" @blur="addTag" />
            <a-button v-else size="small" @click="showTagInput">+ 添加标签</a-button>
          </div>
        </div>
      </div>

      <div class="tmpl-section">
        <div class="tmpl-section-title">② 触发条件</div>
        <div class="tmpl-field">
          <label>触发来源</label>
          <a-radio-group v-model:value="form.triggerSource">
            <a-radio value="alert">告警触发</a-radio>
            <a-radio value="schedule">定时触发</a-radio>
            <a-radio value="api">API 手动调用</a-radio>
          </a-radio-group>
        </div>
        <div v-for="(group, gi) in form.conditionGroups" :key="gi" class="tmpl-condition-group">
          <div class="tmpl-cg-label">{{ gi === 0 ? '条件组 1' : `条件组 ${gi+1}` }} (全部满足时触发)</div>
          <div v-for="(cond, ci) in group" :key="ci" class="tmpl-condition-row">
            <a-select v-model:value="cond.metric" style="width:140px" placeholder="指标">
              <a-select-option value="errorRate">errorRate</a-select-option>
              <a-select-option value="p99">p99</a-select-option>
              <a-select-option value="cpu">CPU</a-select-option>
              <a-select-option value="memory">memory</a-select-option>
              <a-select-option value="cacheMiss">cacheMiss</a-select-option>
            </a-select>
            <a-select v-model:value="cond.op" style="width:80px">
              <a-select-option value=">">&gt;</a-select-option>
              <a-select-option value="<">&lt;</a-select-option>
              <a-select-option value=">=">&gt;=</a-select-option>
              <a-select-option value="<=">&lt;=</a-select-option>
            </a-select>
            <a-input-number v-model:value="cond.value" style="width:80px" />
            <a-select v-model:value="cond.unit" style="width:80px">
              <a-select-option value="%">%</a-select-option>
              <a-select-option value="ms">ms</a-select-option>
              <a-select-option value="s">s</a-select-option>
            </a-select>
            <a-select v-model:value="cond.duration" style="width:100px" placeholder="持续">
              <a-select-option value="1m">1 分钟</a-select-option>
              <a-select-option value="3m">3 分钟</a-select-option>
              <a-select-option value="5m">5 分钟</a-select-option>
              <a-select-option value="10m">10 分钟</a-select-option>
            </a-select>
            <a-button type="text" danger size="small" @click="group.splice(ci, 1)"><i class="fa-solid fa-xmark"></i></a-button>
          </div>
          <a-button size="small" type="dashed" @click="group.push({ metric: '', op: '>', value: null, unit: '%', duration: '3m' })" style="margin-top:4px"><i class="fa-solid fa-plus"></i> 添加条件</a-button>
        </div>
        <a-button size="small" type="dashed" @click="form.conditionGroups.push([{ metric: '', op: '>', value: null, unit: '%', duration: '3m' }])" style="margin-top:8px"><i class="fa-solid fa-plus"></i> 添加条件组 (OR 逻辑)</a-button>
      </div>

      <div class="tmpl-section">
        <div class="tmpl-section-title">③ 执行步骤编排</div>
        <div class="tmpl-step-list">
          <div v-for="(step, si) in form.steps" :key="si" class="tmpl-step-item">
            <div class="tmpl-step-head">
              <span class="tmpl-step-handle"><i class="fa-solid fa-grip-lines"></i></span>
              <span class="tmpl-step-num">{{ si + 1 }}.</span>
              <a-input v-model:value="step.name" placeholder="步骤名称" style="flex:1" />
              <a-select v-model:value="step.mode" style="width:90px">
                <a-select-option value="auto">自动</a-select-option>
                <a-select-option value="confirm">需确认</a-select-option>
                <a-select-option value="manual">手动</a-select-option>
              </a-select>
              <a-checkbox v-model:checked="step.skippable">可跳过</a-checkbox>
              <a-button type="text" danger size="small" @click="form.steps.splice(si, 1)"><i class="fa-solid fa-trash-can"></i></a-button>
            </div>
            <div class="tmpl-step-body">
              <div class="tmpl-step-field-row">
                <a-select v-model:value="step.executor" style="width:120px" placeholder="执行器">
                  <a-select-option value="K8s">K8s</a-select-option>
                  <a-select-option value="MySQL">MySQL</a-select-option>
                  <a-select-option value="ConfigMap">ConfigMap</a-select-option>
                  <a-select-option value="Synthetic">Synthetic</a-select-option>
                  <a-select-option value="Redis">Redis</a-select-option>
                  <a-select-option value="Script">Script</a-select-option>
                </a-select>
                <a-select v-model:value="step.operation" style="width:140px" placeholder="操作">
                  <a-select-option value="cordernode">cordernode</a-select-option>
                  <a-select-option value="update">update</a-select-option>
                  <a-select-option value="flush_hosts">flush_hosts</a-select-option>
                  <a-select-option value="healthcheck">healthcheck</a-select-option>
                  <a-select-option value="restart">restart</a-select-option>
                  <a-select-option value="scale">scale</a-select-option>
                </a-select>
                <a-input v-model:value="step.params" placeholder="参数: {key: val}" style="flex:1" />
              </div>
              <div class="tmpl-step-flow">
                <span class="tmpl-flow-label">成功 →</span>
                <a-select v-model:value="step.onSuccess" style="width:120px" placeholder="下一步">
                  <a-select-option v-for="(s, si2) in form.steps" :key="si2" :value="`step-${si2+1}`" v-if="si2 > si">{{ `步骤 ${si2+1}` }}</a-select-option>
                  <a-select-option value="complete">完成</a-select-option>
                </a-select>
                <span class="tmpl-flow-label">失败 →</span>
                <a-select v-model:value="step.onFailure" style="width:140px" placeholder="失败处理">
                  <a-select-option value="retry">重试 3 次</a-select-option>
                  <a-select-option value="rollback">回滚上一步</a-select-option>
                  <a-select-option value="notify">通知值班</a-select-option>
                  <a-select-option value="abort">停止并标记失败</a-select-option>
                </a-select>
              </div>
            </div>
          </div>
        </div>
        <a-button size="small" type="dashed" @click="addStep" style="margin-top:8px;width:100%"><i class="fa-solid fa-plus"></i> 添加步骤</a-button>
      </div>

      <div class="tmpl-section">
        <div class="tmpl-section-title">④ 执行策略</div>
        <div class="tmpl-field-row">
          <div class="tmpl-field" style="flex:1">
            <label>最大并发</label>
            <a-input-number v-model:value="form.maxConcurrent" :min="1" :max="10" style="width:100%" />
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>超时 (分钟)</label>
            <a-input-number v-model:value="form.timeout" :min="1" :max="120" style="width:100%" />
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>失败时行为</label>
            <a-select v-model:value="form.onFailure" style="width:100%">
              <a-select-option value="rollback">停止并回滚</a-select-option>
              <a-select-option value="continue">跳过继续</a-select-option>
              <a-select-option value="abort">停止标记失败</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="tmpl-field-row">
          <div class="tmpl-field" style="flex:1">
            <label>重试次数</label>
            <a-input-number v-model:value="form.retryCount" :min="0" :max="10" style="width:100%" />
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>重试间隔 (秒)</label>
            <a-input-number v-model:value="form.retryInterval" :min="5" :max="300" :step="5" style="width:100%" />
          </div>
          <div class="tmpl-field" style="flex:1">
            <label>执行窗口</label>
            <a-select v-model:value="form.execWindow" style="width:100%">
              <a-select-option value="all">全天</a-select-option>
              <a-select-option value="workday">仅工作日</a-select-option>
              <a-select-option value="business">仅业务时段</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="tmpl-field">
          <a-checkbox v-model:checked="form.idempotent">同一故障只执行一次 (幂等保护)</a-checkbox>
        </div>
      </div>

      <div class="tmpl-actions">
        <a-button @click="emit('close')">取消</a-button>
        <a-button @click="emit('close')">保存草稿</a-button>
        <a-button type="primary" @click="handleSave">保存启用</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'saved'])

const tagInputVisible = ref(false)
const tagInput = ref('')
const tagInputRef = ref(null)

const form = reactive({
  name: '',
  description: '',
  type: 'static',
  app: '',
  targetNode: [],
  tags: [],
  triggerSource: 'alert',
  conditionGroups: [
    [{ metric: 'errorRate', op: '>', value: 85, unit: '%', duration: '3m' }],
  ],
  steps: [
    { name: '故障节点网络隔离', mode: 'auto', skippable: false, executor: 'K8s', operation: 'cordernode', params: '{node: $target}', onSuccess: 'step-2', onFailure: 'retry' },
    { name: '连接池容量扩容', mode: 'confirm', skippable: true, executor: 'ConfigMap', operation: 'update', params: '{pool: 250}', onSuccess: 'step-3', onFailure: 'rollback' },
    { name: 'MySQL 连接刷新与备库倒换', mode: 'manual', skippable: false, executor: 'MySQL', operation: 'flush_hosts', params: '', onSuccess: 'step-4', onFailure: 'notify' },
    { name: '全链路监控与健康拨测', mode: 'auto', skippable: false, executor: 'Synthetic', operation: 'healthcheck', params: '{ep: /api/health}', onSuccess: 'complete', onFailure: 'rollback' },
  ],
  maxConcurrent: 1,
  timeout: 30,
  onFailure: 'rollback',
  retryCount: 3,
  retryInterval: 30,
  execWindow: 'all',
  idempotent: true,
})

function addStep() {
  form.steps.push({ name: '', mode: 'auto', skippable: false, executor: '', operation: '', params: '', onSuccess: '', onFailure: 'retry' })
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => tagInputRef.value?.focus())
}

function addTag() {
  if (tagInput.value.trim()) {
    form.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
  tagInputVisible.value = false
}

function handleSave() {
  if (!form.name) { message.warning('请输入模板名称'); return }
  if (!form.app) { message.warning('请选择所属应用'); return }
  if (!form.targetNode.length) { message.warning('请选择目标节点'); return }
  message.success('模板「' + form.name + '」已保存并启用')
  emit('saved', { ...form })
  emit('close')
}
</script>

<style scoped>
.tmpl-form { max-height: 600px; overflow-y: auto; }
.tmpl-section { margin-bottom: 20px; }
.tmpl-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
.tmpl-field { margin-bottom: 10px; }
.tmpl-field label { display: block; font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
.tmpl-field-row { display: flex; gap: 12px; }
.tmpl-tags { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.tmpl-condition-group { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
.tmpl-cg-label { font-size: 11px; font-weight: 600; color: #8c8c8c; margin-bottom: 6px; }
.tmpl-condition-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.tmpl-step-list { display: flex; flex-direction: column; gap: 8px; }
.tmpl-step-item { border: 1px solid #f0f0f0; border-radius: 6px; padding: 10px 12px; background: #fafafa; }
.tmpl-step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tmpl-step-handle { color: #d9d9d9; cursor: grab; }
.tmpl-step-num { font-size: 12px; font-weight: 600; color: #8c8c8c; }
.tmpl-step-body { padding-left: 28px; }
.tmpl-step-field-row { display: flex; gap: 6px; margin-bottom: 6px; }
.tmpl-step-flow { display: flex; align-items: center; gap: 6px; }
.tmpl-flow-label { font-size: 11px; color: #8c8c8c; }
.tmpl-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
</style>