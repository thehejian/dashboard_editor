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
                  <a-tag v-if="obj.selectedPathIds.length">{{ obj.selectedPathIds.length }} 条路径</a-tag>
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

    <a-modal v-model:visible="showObjectModal" title="选择采集对象" width="720px" @cancel="showObjectModal = false" :footer="null">
      <div class="transfer-layout">
        <div class="transfer-panel">
          <div class="transfer-panel-header">可选对象</div>
          <a-input-search v-model:value="srcSearch" placeholder="搜索" size="small" style="margin:8px 12px;width:calc(100% - 24px)" />
          <div class="transfer-tree-wrap">
            <a-tree
              v-model:checkedKeys="checkedKeys"
              :tree-data="filteredSrcTree"
              checkable
              :default-expand-all="true"
            />
          </div>
        </div>
        <div class="transfer-divider"></div>
        <div class="transfer-panel">
          <div class="transfer-panel-header">已选对象 ({{ checkedKeys.length }})</div>
          <a-input-search v-model:value="dstSearch" placeholder="搜索" size="small" style="margin:8px 12px;width:calc(100% - 24px)" />
          <div class="transfer-tree-wrap">
            <a-tree
              v-model:checkedKeys="checkedKeys"
              :tree-data="filteredDstTree"
              checkable
              :default-expand-all="true"
            />
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:16px 0 0;border-top:1px solid var(--border);margin-top:8px">
        <a-button @click="showObjectModal = false">取消</a-button>
        <a-button type="primary" @click="confirmObjects">确定</a-button>
      </div>
    </a-modal>

    <a-modal v-model:visible="showPathModal" :title="'配置日志路径 - ' + (currentPathObj?.title || '')" width="800px" :footer="null" @cancel="showPathModal = false">
      <div v-if="currentPathObj" class="path-transfer">
        <div class="transfer-layout">
          <div class="transfer-panel">
            <div class="transfer-panel-header">可选路径</div>
            <div class="path-available-list">
              <div
                v-for="p in availablePaths"
                :key="p.id"
                class="path-item"
                :class="{ selected: pathSelectedIds.has(p.id) }"
                @click="togglePathSelect(p.id)"
              >
                <div class="path-item-main">
                  <span class="path-dir">{{ p.path }}</span>
                  <span class="path-file">{{ p.fileName }}</span>
                  <a-tag :color="p.type === '运行日志' ? 'blue' : 'orange'" style="font-size:11px;line-height:18px">{{ p.type }}</a-tag>
                  <a-tag v-if="p.source === '自定义'" style="font-size:11px;line-height:18px;border-color:var(--brand);color:var(--brand)">{{ p.source }}</a-tag>
                  <a-tag v-else style="font-size:11px;line-height:18px">{{ p.source }}</a-tag>
                </div>
                <div class="path-item-actions" v-if="p.source === '自定义'" @click.stop>
                  <a-button type="link" size="small" @click="editCustomPath(p)">编辑</a-button>
                  <a-button type="link" size="small" danger @click="deleteCustomPath(p.id)">删除</a-button>
                </div>
              </div>
            </div>
            <a-button type="dashed" block size="small" style="margin-top:8px" @click="showAddCustomPath = true">
              <i class="fa-solid fa-plus"></i> 新增自定义路径
            </a-button>
          </div>
          <div class="transfer-divider"></div>
          <div class="transfer-panel">
            <div class="transfer-panel-header">已选路径 ({{ currentPathObj.selectedPathIds.length }})</div>
            <div class="path-available-list">
              <div
                v-for="p in selectedPaths"
                :key="p.id"
                class="path-item selected"
                @click="removeSelectedPath(p.id)"
              >
                <div class="path-item-main">
                  <span class="path-dir">{{ p.path }}</span>
                  <span class="path-file">{{ p.fileName }}</span>
                  <a-tag :color="p.type === '运行日志' ? 'blue' : 'orange'" style="font-size:11px;line-height:18px">{{ p.type }}</a-tag>
                  <a-tag v-if="p.source === '自定义'" style="font-size:11px;line-height:18px;border-color:var(--brand);color:var(--brand)">{{ p.source }}</a-tag>
                  <a-tag v-else style="font-size:11px;line-height:18px">{{ p.source }}</a-tag>
                </div>
                <span style="font-size:11px;color:var(--text-ter);margin-left:auto">点击移除</span>
              </div>
              <div v-if="!currentPathObj.selectedPathIds.length" class="transfer-empty">暂无选择</div>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:16px 0 0;border-top:1px solid var(--border);margin-top:8px">
          <a-button @click="showPathModal = false">取消</a-button>
          <a-button type="primary" @click="confirmPaths">确定</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:visible="showAddCustomPath" title="新增自定义路径" width="640px" @ok="saveCustomPath" @cancel="showAddCustomPath = false">
      <a-form layout="vertical">
        <a-form-item label="日志路径" required>
          <a-input v-model:value="customForm.path" placeholder="/var/log/..." />
        </a-form-item>
        <a-form-item label="日志文件名称" required>
          <a-input v-model:value="customForm.fileName" placeholder="app.log" />
        </a-form-item>
        <a-form-item label="日志类型" required>
          <a-select v-model:value="customForm.type">
            <a-select-option value="运行日志">运行日志</a-select-option>
            <a-select-option value="系统日志">系统日志</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let customIdCounter = 100

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

const presetPaths = {
  'ms-01': [
    { id: 'p1', path: '/var/log/app1', fileName: 'app.log', type: '运行日志', source: '系统预制' },
    { id: 'p2', path: '/var/log/app1/error', fileName: 'error.log', type: '系统日志', source: '系统预制' },
  ],
  'ms-02': [
    { id: 'p3', path: '/var/log/app2', fileName: 'service.log', type: '运行日志', source: '系统预制' },
    { id: 'p4', path: '/var/log/app2/debug', fileName: 'debug.log', type: '系统日志', source: '系统预制' },
  ],
  'ms-03': [
    { id: 'p5', path: '/var/log/app3', fileName: 'gateway.log', type: '运行日志', source: '系统预制' },
  ],
  'ms-04': [
    { id: 'p6', path: '/var/log/app4', fileName: 'auth.log', type: '系统日志', source: '系统预制' },
    { id: 'p7', path: '/var/log/app4/audit', fileName: 'audit.log', type: '运行日志', source: '系统预制' },
  ],
  'ms-05': [
    { id: 'p8', path: '/var/log/app5', fileName: 'scheduler.log', type: '运行日志', source: '系统预制' },
  ],
}

const customPaths = ref([])

const allPaths = computed(() => {
  if (!currentPathObj.value) return []
  const presets = presetPaths[currentPathObj.value.key] || []
  return [...presets, ...customPaths.value]
})

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

function findNode(key, nodes) {
  for (const n of nodes) {
    if (n.key === key) return n
    if (n.children) {
      const found = findNode(key, n.children)
      if (found) return found
    }
  }
  return null
}

function filterTree(nodes, keyword) {
  if (!keyword) return nodes
  return nodes.reduce((acc, n) => {
    const node = { ...n }
    const match = node.title.includes(keyword)
    let children
    if (node.children) {
      children = filterTree(node.children, keyword)
    }
    if (match || (children && children.length)) {
      if (children) node.children = children
      acc.push(node)
    }
    return acc
  }, [])
}

const showObjectModal = ref(false)
const checkedKeys = ref([])
const srcSearch = ref('')
const dstSearch = ref('')

const filteredSrcTree = computed(() => filterTree(objectTree, srcSearch.value))

const filteredDstTree = computed(() => {
  const selectedKeys = new Set(checkedKeys.value)
  function prune(nodes) {
    return nodes.reduce((acc, n) => {
      const node = { ...n }
      if (node.children) {
        const children = prune(node.children)
        if (children.length) {
          node.children = children
          acc.push(node)
          return acc
        }
      }
      if (selectedKeys.has(node.key)) {
        acc.push(node)
      }
      return acc
    }, [])
  }
  if (!dstSearch.value) return prune(objectTree)
  return prune(filterTree(objectTree, dstSearch.value))
})

function openObjectModal() {
  checkedKeys.value = selectedObjects.value.map(o => o.key)
  srcSearch.value = ''
  dstSearch.value = ''
  showObjectModal.value = true
}

function confirmObjects() {
  const existingKeys = new Set(selectedObjects.value.map(o => o.key))
  for (const key of checkedKeys.value) {
    if (!existingKeys.has(key)) {
      selectedObjects.value.push({
        key,
        title: getNodeTitle(key),
        parentTitle: 'ManageOne',
        selectedPathIds: [],
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
const pathSelectedIds = ref(new Set())

function openPathModal(obj) {
  currentPathObj.value = obj
  pathSelectedIds.value = new Set(obj.selectedPathIds)
  showPathModal.value = true
}

const availablePaths = computed(() => {
  if (!currentPathObj.value) return []
  const presets = presetPaths[currentPathObj.value.key] || []
  const all = [...presets, ...customPaths.value]
  return all.filter(p => !currentPathObj.value.selectedPathIds.includes(p.id))
})

const selectedPaths = computed(() => {
  if (!currentPathObj.value) return []
  const presets = presetPaths[currentPathObj.value.key] || []
  const all = [...presets, ...customPaths.value]
  return all.filter(p => currentPathObj.value.selectedPathIds.includes(p.id))
})

function togglePathSelect(id) {
  if (pathSelectedIds.value.has(id)) {
    pathSelectedIds.value.delete(id)
  } else {
    pathSelectedIds.value.add(id)
  }
}

function removeSelectedPath(id) {
  if (currentPathObj.value) {
    currentPathObj.value.selectedPathIds = currentPathObj.value.selectedPathIds.filter(i => i !== id)
    pathSelectedIds.value = new Set(currentPathObj.value.selectedPathIds)
  }
}

function confirmPaths() {
  if (currentPathObj.value) {
    currentPathObj.value.selectedPathIds = [...pathSelectedIds.value]
  }
  showPathModal.value = false
}

const showAddCustomPath = ref(false)
const editingCustomPathId = ref(null)
const customForm = reactive({ path: '', fileName: '', type: '运行日志' })

function saveCustomPath() {
  if (!customForm.path || !customForm.fileName) return
  if (editingCustomPathId.value) {
    const item = customPaths.value.find(p => p.id === editingCustomPathId.value)
    if (item) {
      item.path = customForm.path
      item.fileName = customForm.fileName
      item.type = customForm.type
    }
  } else {
    customPaths.value.push({
      id: 'c' + (customIdCounter++),
      path: customForm.path,
      fileName: customForm.fileName,
      type: customForm.type,
      source: '自定义',
    })
  }
  customForm.path = ''
  customForm.fileName = ''
  customForm.type = '运行日志'
  editingCustomPathId.value = null
  showAddCustomPath.value = false
}

function editCustomPath(p) {
  editingCustomPathId.value = p.id
  customForm.path = p.path
  customForm.fileName = p.fileName
  customForm.type = p.type
  showAddCustomPath.value = true
}

function deleteCustomPath(id) {
  customPaths.value = customPaths.value.filter(p => p.id !== id)
  for (const obj of selectedObjects.value) {
    obj.selectedPathIds = obj.selectedPathIds.filter(i => i !== id)
  }
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
  min-width: 0;
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
.transfer-empty {
  font-size: 13px;
  color: var(--text-ter);
  text-align: center;
  padding: 40px 0;
}
.transfer-divider {
  width: 1px;
  background: var(--border);
  margin: 0 8px;
}
.path-available-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
  min-height: 220px;
  max-height: 360px;
}
.path-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
  gap: 8px;
}
.path-item:hover {
  border-color: var(--brand);
  background: var(--brand-subtle);
}
.path-item.selected {
  border-color: var(--brand);
  background: var(--brand-subtle);
}
.path-item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}
.path-dir {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  font-family: monospace;
}
.path-file {
  font-size: 12px;
  color: var(--text-sec);
  font-family: monospace;
}
.path-item-actions {
  flex-shrink: 0;
}
</style>