<template>
  <div class="create-page">
    <div class="create-header">
      <a-button type="text" @click="goBack"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="create-title">创建日志采集任务</span>
    </div>

    <div class="create-body">
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <a-form layout="vertical">
          <a-form-item label="任务名称" required>
            <a-input v-model:value="form.name" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="状态" required>
            <a-switch v-model:checked="form.status" />
            <span style="margin-left:8px;font-size:13px;color:var(--text-sec)">{{ form.status ? '启用' : '停用' }}</span>
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="form.description" placeholder="请输入" :maxlength="1000" :show-count="true" />
          </a-form-item>
        </a-form>
      </div>

      <div class="form-section">
        <div class="section-title">采集范围</div>
        <a-form layout="vertical">
          <a-form-item label="区域" required>
            <a-select v-model:value="form.region" placeholder="请选择区域" style="width:240px">
              <a-select-option value="华北2">华北2</a-select-option>
              <a-select-option value="华东1">华东1</a-select-option>
              <a-select-option value="华南1">华南1</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="资源类别" required>
            <a-radio-group v-model:value="form.resourceType" button-style="solid">
              <a-radio-button value="cloud-service">云服务</a-radio-button>
              <a-radio-button value="cloud-resource">云资源</a-radio-button>
              <a-radio-button value="physical">物理资源</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="采集对象">
            <a-button @click="openObjectModal">
              <i class="fa-solid fa-plus" style="margin-right:4px"></i>选择采集对象
            </a-button>
            <div v-if="selectedObjects.length" class="selected-objects">
              <div v-for="obj in selectedObjects" :key="obj.key" class="object-card">
                <div class="object-info">
                  <span class="object-name">{{ obj.title }}</span>
                  <span class="object-parent">{{ obj.parentTitle }}</span>
                </div>
                <div class="object-actions">
                  <a-button type="link" size="small" @click="openPathModal(obj)">
                    <i class="fa-solid fa-gear" style="margin-right:4px"></i>配置路径
                  </a-button>
                  <a-tag v-if="obj.logPaths.length">{{ obj.logPaths.length }} 条路径</a-tag>
                  <a-button type="link" size="small" danger @click="removeObject(obj)">删除</a-button>
                </div>
              </div>
            </div>
          </a-form-item>
        </a-form>
      </div>

      <div class="form-section">
        <div class="section-title">转发目的地</div>
        <a-form layout="vertical">
          <a-form-item label="转发通道">
            <a-space>
              <a-select v-model:value="form.destination" placeholder="请选择" style="width:240px">
                <a-select-option value="kafka-01">Kafka-日志集群</a-select-option>
                <a-select-option value="es-01">ES-日志存储</a-select-option>
                <a-select-option value="syslog-01">Syslog-审计中心</a-select-option>
              </a-select>
              <a-button>新建通道</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <div class="create-footer">
      <a-button @click="goBack">取消</a-button>
      <a-button type="primary" @click="handleSubmit">确定</a-button>
    </div>

    <a-modal v-model:visible="showObjectModal" title="选择采集对象" width="680px" @ok="confirmObjects">
      <div class="transfer-layout">
        <div class="transfer-panel">
          <div class="transfer-panel-header">可选对象</div>
          <div class="transfer-tree-wrap">
            <a-tree
              v-model:checkedKeys="checkedKeys"
              :tree-data="objectTree"
              checkable
              :default-expand-all="true"
            />
          </div>
        </div>
        <div class="transfer-divider"></div>
        <div class="transfer-panel">
          <div class="transfer-panel-header">已选对象 ({{ checkedKeys.length }})</div>
          <div class="transfer-selected-list">
            <div v-for="key in checkedKeys" :key="key" class="transfer-selected-item">
              <span>{{ getNodeTitle(key) }}</span>
              <a-button type="link" size="small" danger @click="removeChecked(key)">×</a-button>
            </div>
            <div v-if="!checkedKeys.length" class="transfer-empty">暂无选择</div>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:visible="showPathModal" :title="'配置日志路径 - ' + (currentPathObj?.title || '')" width="760px" @ok="showPathModal = false">
      <div v-if="currentPathObj">
        <div v-for="(path, pi) in currentPathObj.logPaths" :key="pi" class="path-row">
          <div class="path-fields">
            <a-input v-model:value="path.path" placeholder="日志路径" style="width:200px" />
            <a-input v-model:value="path.fileName" placeholder="日志文件名称" style="width:160px" />
            <a-select v-model:value="path.type" style="width:120px">
              <a-select-option value="运行日志">运行日志</a-select-option>
              <a-select-option value="系统日志">系统日志</a-select-option>
            </a-select>
            <a-select v-model:value="path.source" style="width:120px">
              <a-select-option value="系统预制">系统预制</a-select-option>
              <a-select-option value="自定义">自定义</a-select-option>
            </a-select>
          </div>
          <a-button type="link" danger size="small" @click="currentPathObj.logPaths.splice(pi, 1)">
            <i class="fa-solid fa-trash-can"></i>
          </a-button>
        </div>
        <a-button type="dashed" block style="margin-top:12px" @click="addPath(currentPathObj)">
          <i class="fa-solid fa-plus"></i> 添加日志路径
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
  name: '',
  status: true,
  description: '',
  region: null,
  resourceType: 'cloud-service',
  destination: null,
})

const objectTree = [
  {
    title: '统一云管（云服务类别）',
    key: 'root',
    children: [
      {
        title: 'ManageOne（云服务）',
        key: 'manageone',
        children: [
          { title: '微服务01', key: 'ms-01' },
          { title: '微服务02', key: 'ms-02' },
          { title: '微服务03', key: 'ms-03' },
          { title: '微服务04', key: 'ms-04' },
          { title: '微服务05', key: 'ms-05' },
        ],
      },
    ],
  },
]

function getNodeTitle(key) {
  for (const n of objectTree) {
    for (const c of n.children || []) {
      for (const g of c.children || []) {
        if (g.key === key) return g.title
      }
      if (c.key === key) return c.title
    }
    if (n.key === key) return n.title
  }
  return key
}

const showObjectModal = ref(false)
const checkedKeys = ref([])

function openObjectModal() {
  checkedKeys.value = selectedObjects.value.map(o => o.key)
  showObjectModal.value = true
}

function removeChecked(key) {
  checkedKeys.value = checkedKeys.value.filter(k => k !== key)
}

function confirmObjects() {
  const existingKeys = new Set(selectedObjects.value.map(o => o.key))
  for (const key of checkedKeys.value) {
    if (!existingKeys.has(key)) {
      selectedObjects.value.push({
        key,
        title: getNodeTitle(key),
        parentTitle: 'ManageOne',
        logPaths: [],
      })
      existingKeys.add(key)
    }
  }
  selectedObjects.value = selectedObjects.value.filter(o => checkedKeys.value.includes(o.key))
  showObjectModal.value = false
}

const selectedObjects = ref([])

function removeObject(obj) {
  selectedObjects.value = selectedObjects.value.filter(o => o.key !== obj.key)
}

const showPathModal = ref(false)
const currentPathObj = ref(null)

function openPathModal(obj) {
  currentPathObj.value = obj
  showPathModal.value = true
}

function addPath(obj) {
  obj.logPaths.push({ path: '', fileName: '', type: '运行日志', source: '系统预制' })
}

function goBack() {
  router.push('/ops/logs/config/tasks')
}

function handleSubmit() {
  goBack()
}
</script>

<style scoped>
.create-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.create-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}
.create-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.create-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-sec);
}
.create-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}
.form-section {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.selected-objects {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.object-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
}
.object-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.object-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}
.object-parent {
  font-size: 12px;
  color: var(--text-ter);
  background: var(--bg-sec);
  padding: 1px 8px;
  border-radius: 4px;
}
.object-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.transfer-layout {
  display: flex;
  gap: 0;
  min-height: 300px;
}
.transfer-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.transfer-panel-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-sec);
}
.transfer-tree-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  min-height: 200px;
}
.transfer-selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  min-height: 200px;
}
.transfer-selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}
.transfer-empty {
  font-size: 13px;
  color: var(--text-ter);
  text-align: center;
  padding: 40px 0;
}
.transfer-divider {
  width: 1px;
  background: var(--border);
  margin: 0;
}
.path-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.path-fields {
  flex: 1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>