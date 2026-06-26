<template>
  <a-modal
    :open="true"
    :footer="null"
    :closable="false"
    :width="960"
    :body-style="{ padding: 0 }"
    class="create-modal"
  >
    <template #title><span>创建账号保管箱</span></template>
    <div style="padding: 0 24px 24px">
      <a-steps :current="step" size="small" style="margin-bottom: 24px">
        <a-step v-for="(s, i) in steps" :key="i" :title="s" />
      </a-steps>
    </div>

    <div class="modal-body">
      <!-- Step 1: 基本信息 -->
      <template v-if="step === 0">
        <div class="form-item">
          <label class="form-label">名称</label>
          <a-input v-model:value="form.name" placeholder="请输入" />
        </div>
        <div class="form-item">
          <label class="form-label">状态</label>
          <a-switch v-model:checked="form.enabled" />
        </div>
        <div class="form-item">
          <label class="form-label">描述（可选）</label>
          <a-textarea v-model:value="form.description" placeholder="请输入" :rows="4" :maxlength="1000" :show-count="true" />
        </div>
      </template>

      <!-- Step 2: 关联应用 -->
      <template v-if="step === 1">
        <div class="error-banner" v-if="showError">
          <span class="error-icon">⛔</span>
          <div class="error-text">
            <strong>应用无法关联</strong>
            <span>应用的授权范围未选择/mo/api/uam/v1/safebox，无法被关联。请修改应用的授权范围或者重新创建应用 <a class="link-blue">APP01 ↗</a></span>
          </div>
        </div>
        <div class="dual-panel">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">可选项</span>
              <span class="panel-count">{{ leftSelected.length }}/10</span>
            </div>
            <div class="panel-toolbar">
              <a-input v-model:value="leftSearch" placeholder="请输入关键字搜索" size="small" class="panel-search">
                <template #prefix><i class="fa-solid fa-magnifying-glass"></i></template>
              </a-input>
              <a-button size="small" @click="selectAll">全选</a-button>
            </div>
            <a-table
              :columns="appColumns"
              :data-source="leftApps"
              :pagination="{ pageSize: 10, total: leftApps.length, showSizeChanger: false, showQuickJumper: true }"
              row-key="id"
              size="small"
              class="panel-table"
              :row-selection="{ type: 'checkbox', selectedRowKeys: leftSelected, onChange: onLeftSelect }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <span class="status-cell"><span class="status-dot dot-green"></span>{{ record.statusLabel }}</span>
                </template>
              </template>
            </a-table>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">已选项</span>
              <span class="panel-count">{{ rightSelected.length }}/10</span>
            </div>
            <div class="panel-toolbar">
              <a-input v-model:value="rightSearch" placeholder="关键字" size="small" class="panel-search">
                <template #prefix><i class="fa-solid fa-magnifying-glass"></i></template>
              </a-input>
              <a-button size="small" @click="deselectAll">全部取消选择</a-button>
            </div>
            <div class="panel-empty" v-if="!rightSelected.length">
              <span>暂无数据</span>
            </div>
            <a-table
              v-else
              :columns="appColumns"
              :data-source="rightApps"
              :pagination="{ pageSize: 10, showSizeChanger: false, showQuickJumper: true }"
              row-key="id"
              size="small"
              class="panel-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <span class="status-cell"><span class="status-dot dot-green"></span>{{ record.statusLabel }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </template>

      <!-- Step 3: 选择账号 -->
      <template v-if="step === 2">
        <div class="scope-label">账号范围</div>
        <div class="card-group">
          <div class="scope-card" :class="{ selected: form.scope === 'all' }" @click="form.scope = 'all'">
            <div class="card-title">全部账号</div>
            <div class="card-desc">账号管理当前已经管理的全部账号</div>
          </div>
          <div class="scope-card" :class="{ selected: form.scope === 'human' }" @click="form.scope = 'human'">
            <div class="card-title">全部人机账号</div>
            <div class="card-desc">账号管理当前已经管理的全部人机账号</div>
          </div>
          <div class="scope-card" :class="{ selected: form.scope === 'os-human' }" @click="form.scope = 'os-human'">
            <div class="card-title">全部操作系统人机账号</div>
            <div class="card-desc">账号管理当前已经管理的全部操作系统的人机账号</div>
          </div>
        </div>
      </template>

      <!-- Step 4: 选择权限 -->
      <template v-if="step === 3">
        <div class="perm-section">
          <label class="perm-label">权限</label>
          <div class="perm-content">
            <div class="perm-radio-group">
              <label class="perm-radio">
                <input type="radio" name="permType" value="readonly" v-model="form.permType" />
                <span>只读</span>
              </label>
              <label class="perm-radio">
                <input type="radio" name="permType" value="not-readonly" v-model="form.permType" />
                <span>非只读</span>
              </label>
            </div>
            <div class="perm-checkbox-group">
              <label class="perm-checkbox">
                <a-checkbox v-model:checked="form.queryPerm" disabled />
                <span>查询</span>
              </label>
              <label class="perm-checkbox">
                <a-checkbox v-model:checked="form.fixPerm" />
                <span>修正</span>
              </label>
              <label class="perm-checkbox">
                <a-checkbox v-model:checked="form.modifyPerm" />
                <span>修改</span>
              </label>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="modal-footer">
      <a-button @click="$emit('close')">取消</a-button>
      <a-button :disabled="step === 0" @click="prevStep">上一步</a-button>
      <a-button v-if="step < 3" type="primary" @click="nextStep">下一步</a-button>
      <a-button v-else type="primary" :loading="submitting" @click="handleDone">完成</a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const emit = defineEmits(['close'])

const step = ref(0)
const steps = ['基本信息', '关联应用', '选择账号', '选择权限']

const form = reactive({
  name: '',
  enabled: true,
  description: '',
  scope: 'all',
  permType: 'not-readonly',
  queryPerm: true,
  fixPerm: true,
  modifyPerm: false,
})

const showError = ref(true)

const leftSearch = ref('')
const rightSearch = ref('')
const leftSelected = ref([])
const rightSelected = ref([])

const leftApps = ref([])
const rightApps = ref([])
const loading = ref(false)
const submitting = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/cmdb/app_list?sort=id&order=ASC')
    const json = await res.json()
    if (json.success) {
      leftApps.value = json.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          status: item.status,
          statusLabel: item.status === 'active' ? '已启用' : '已停用',
          description: item.description || '--',
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})

const appColumns = [
  { title: '应用名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '状态', key: 'status' },
  { title: '描述', dataIndex: 'description', key: 'description' },
]

function onLeftSelect(keys) {
  leftSelected.value = keys
  rightSelected.value = keys
  rightApps.value = leftApps.value.filter(a => keys.includes(a.id))
}

function selectAll() {
  const ids = leftApps.value.map(a => a.id)
  leftSelected.value = ids
  rightSelected.value = ids
  rightApps.value = [...leftApps.value]
}

function deselectAll() {
  leftSelected.value = []
  rightSelected.value = []
  rightApps.value = []
}

function nextStep() {
  if (step.value < 3) step.value++
}

function prevStep() {
  if (step.value > 0) step.value--
}

async function handleDone() {
  submitting.value = true
  try {
    const body = {
      name: form.name,
      status: form.enabled ? 'active' : 'disabled',
      scope: form.scope,
      permissions: form.permType === 'readonly' ? 'readonly' : 'query,fix,modify',
      description: form.description,
    }
    const res = await fetch('/api/cmdb/safeboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (json.success) {
      message.success('保管箱创建成功')
      emit('close')
    } else {
      message.error(json.error || '创建失败')
    }
  } catch (e) {
    message.error('网络错误')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-modal :deep(.ant-modal-header) {
  padding: 16px 24px;
}
.modal-body {
  padding: 0 24px 24px;
  max-height: 520px;
  overflow-y: auto;
}
.form-item {
  margin-bottom: 20px;
}
.form-label {
  display: block;
  font-size: 13px;
  color: var(--text);
  margin-bottom: 6px;
  font-weight: 500;
}

.error-banner {
  display: flex;
  gap: 10px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.error-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}
.error-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}
.error-text strong {
  display: block;
  font-weight: 600;
}
.link-blue {
  color: var(--brand);
  cursor: pointer;
}

.dual-panel {
  display: flex;
  gap: 16px;
  min-height: 480px;
}
.panel {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.panel-title {
  font-size: 13px;
  font-weight: 500;
}
.panel-count {
  font-size: 12px;
  color: #8c8c8c;
}
.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.panel-search {
  flex: 1;
}
.panel-table {
  flex: 1;
  min-height: 0;
}
.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  font-size: 13px;
}
.panel-table :deep(.ant-table-thead > tr > th) {
  background: var(--bg);
  font-size: 12px;
  padding: 6px 8px;
}
.panel-table :deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  padding: 6px 8px;
}

.scope-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
}
.card-group {
  display: flex;
  gap: 12px;
}
.scope-card {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
}
.scope-card.selected {
  border-color: var(--brand);
  background: #fff;
}
.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 6px;
}
.card-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}

.perm-section {
  display: flex;
  gap: 40px;
  padding: 24px 0;
}
.perm-label {
  font-size: 12px;
  color: #8c8c8c;
  flex-shrink: 0;
  width: 40px;
}
.perm-content {
  flex: 1;
}
.perm-radio-group {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}
.perm-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
.perm-radio input[type="radio"] {
  accent-color: var(--brand);
}
.perm-checkbox-group {
  display: flex;
  gap: 16px;
  background: #fafafa;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
}
.perm-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

@media (max-width: 768px) {
  .dual-panel { flex-direction: column; min-height: auto; }
  .card-group { flex-direction: column; }
  .perm-section { flex-direction: column; gap: 16px; }
  .perm-checkbox-group { flex-wrap: wrap; }
  .error-banner { flex-direction: column; }
}
</style>
