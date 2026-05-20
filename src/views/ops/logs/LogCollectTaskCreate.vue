<template>
  <div class="create-page">
    <div class="create-header">
      <a-button type="text" @click="goBack"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="create-title">创建日志采集任务</span>
    </div>

    <div class="create-body">
      <div class="form-section">
        <div class="section-title collapsible" @click="basicOpen = !basicOpen">
          <span>基本信息</span>
          <i class="fa-solid" :class="basicOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <a-collapse-transition :open="basicOpen">
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
        </a-collapse-transition>
      </div>

      <div class="form-section">
        <div class="section-title collapsible" @click="scopeOpen = !scopeOpen">
          <span>采集范围</span>
          <i class="fa-solid" :class="scopeOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <a-collapse-transition :open="scopeOpen">
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
              <a-button @click="openObjectModal"><i class="fa-solid fa-plus" style="margin-right:4px"></i>选择采集对象</a-button>
              <div v-if="selectedObjects.length" style="margin-top:12px">
                <div style="display:flex;gap:8px;margin-bottom:12px">
                  <a-input-search v-model:value="objectKeyword" placeholder="搜索" style="width:320px" />
                </div>
                <a-table
                  :data-source="pagedObjects"
                  :columns="objectColumns"
                  :pagination="false"
                  row-key="key"
                  size="small"
                  :scroll="{ x: 780 }"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'pathTags'">
                      <template v-if="record.selectedPathIds.length">
                        <a-tag
                          v-for="pid in record.selectedPathIds"
                          :key="pid"
                          style="cursor:pointer;margin-bottom:2px"
                          @click="showPathDetail(getPathObj(record.key, pid))"
                        >{{ getPathObj(record.key, pid)?.fileName }}</a-tag>
                      </template>
                      <span v-else style="color:var(--text-ter)">暂无</span>
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-button type="link" size="small" @click="openPathModal(record)">添加路径</a-button>
                      <a-button type="link" size="small" danger @click="removeObject(record)">删除</a-button>
                    </template>
                  </template>
                </a-table>
                <div style="display:flex;justify-content:flex-end;margin-top:12px">
                  <a-pagination
                    v-model:current="currentPage"
                    :page-size="pageSize"
                    :total="filteredObjects.length"
                    show-size-changer
                    show-total
                    size="small"
                  />
                </div>
              </div>
            </a-form-item>
          </a-form>
        </a-collapse-transition>
      </div>

      <div class="form-section">
        <div class="section-title collapsible" @click="destOpen = !destOpen">
          <span>转发目的地</span>
          <i class="fa-solid" :class="destOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <a-collapse-transition :open="destOpen">
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
        </a-collapse-transition>
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
            <a-tree v-model:checkedKeys="checkedKeys" :tree-data="filteredSrcTree" checkable :default-expand-all="true" />
          </div>
        </div>
        <div class="transfer-divider"></div>
        <div class="transfer-panel">
          <div class="transfer-panel-header">已选对象 ({{ checkedKeys.length }})</div>
          <a-input-search v-model:value="dstSearch" placeholder="搜索" size="small" style="margin:8px 12px;width:calc(100% - 24px)" />
          <div class="transfer-tree-wrap">
            <a-tree v-model:checkedKeys="checkedKeys" :tree-data="filteredDstTree" checkable :default-expand-all="true" />
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;padding:16px 0 0;border-top:1px solid var(--border);margin-top:8px">
        <a-button @click="showObjectModal = false">取消</a-button>
        <a-button type="primary" @click="confirmObjects">确定</a-button>
      </div>
    </a-modal>

    <a-modal v-model:visible="showPathModal" :title="'配置日志路径 - ' + (currentPathObj?.title || '')" width="1200px" :footer="null" @cancel="showPathModal = false">
      <div v-if="currentPathObj" class="path-transfer">
        <div class="transfer-layout">
          <div class="transfer-panel">
            <div class="transfer-panel-header">可选路径</div>
            <div style="padding:8px">
              <a-input-search v-model:value="availPathSearch" placeholder="搜索路径" size="small" style="margin-bottom:8px" />
              <a-table
                :data-source="filteredAvailablePaths"
                :columns="pathColumns"
                :pagination="false"
                size="small"
                row-key="id"
                :scroll="{ y: 260 }"
                @row-click="(r) => selectPath(r.id)"
              />
              <a-button type="dashed" block size="small" style="margin-top:8px" @click="openAddCustomPath">
                <i class="fa-solid fa-plus"></i> 新增自定义路径
              </a-button>
            </div>
          </div>
          <div class="transfer-divider"></div>
          <div class="transfer-panel">
            <div class="transfer-panel-header">已选路径 ({{ currentPathObj.selectedPathIds.length }})</div>
            <div style="padding:8px">
              <a-input-search v-model:value="selPathSearch" placeholder="搜索路径" size="small" style="margin-bottom:8px" />
              <a-table
                v-if="currentPathObj.selectedPathIds.length"
                :data-source="filteredSelectedPaths"
                :columns="pathColumns"
                :pagination="false"
                size="small"
                row-key="id"
                :scroll="{ y: 260 }"
                @row-click="(r) => removeSelectedPath(r.id)"
              />
              <div v-else class="transfer-empty">暂无选择</div>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:16px 0 0;border-top:1px solid var(--border);margin-top:8px">
          <a-button @click="showPathModal = false">取消</a-button>
          <a-button type="primary" @click="showPathModal = false">确定</a-button>
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

    <a-modal v-model:visible="showPathDetailModal" title="路径详情" width="500px" :footer="null">
      <a-descriptions v-if="detailPath" :column="1" bordered size="small">
        <a-descriptions-item label="日志路径">{{ detailPath.path }}</a-descriptions-item>
        <a-descriptions-item label="日志文件名称">{{ detailPath.fileName }}</a-descriptions-item>
        <a-descriptions-item label="日志类型">{{ detailPath.type }}</a-descriptions-item>
        <a-descriptions-item label="来源">{{ detailPath.source }}</a-descriptions-item>
      </a-descriptions>
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

const basicOpen = ref(true)
const scopeOpen = ref(true)
const destOpen = ref(true)

const objectKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const objectColumns = [
  { title: '对象名称', dataIndex: 'title', key: 'name', width: 140 },
  { title: '所属云服务', dataIndex: 'parentTitle', key: 'service', width: 140 },
  { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
  { title: '关联日志路径数量', key: 'pathTags', width: 220 },
  { title: '操作', key: 'action', width: 180 },
]

const pathColumns = [
  { title: '日志路径', dataIndex: 'path', key: 'path', width: 180 },
  { title: '日志文件名称', dataIndex: 'fileName', key: 'fileName', width: 140 },
  { title: '日志类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
]

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

function getAllPathsFor(key) {
  const presets = presetPaths[key] || []
  return [...presets, ...customPaths.value]
}

function getPathObj(key, pid) {
  return getAllPathsFor(key).find(p => p.id === pid)
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

const selectedObjects = ref([])

function confirmObjects() {
  const existingKeys = new Set(selectedObjects.value.map(o => o.key))
  for (const key of checkedKeys.value) {
    if (!existingKeys.has(key)) {
      selectedObjects.value.push({
        key,
        title: getNodeTitle(key),
        parentTitle: 'ManageOne',
        description: '',
        selectedPathIds: [],
      })
      existingKeys.add(key)
    }
  }
  selectedObjects.value = selectedObjects.value.filter(o => checkedKeys.value.includes(o.key))
  showObjectModal.value = false
  currentPage.value = 1
}

function removeObject(obj) {
  selectedObjects.value = selectedObjects.value.filter(o => o.key !== obj.key)
  currentPage.value = 1
}

const filteredObjects = computed(() => {
  if (!objectKeyword.value) return selectedObjects.value
  const kw = objectKeyword.value.toLowerCase()
  return selectedObjects.value.filter(o =>
    o.title.toLowerCase().includes(kw) || o.parentTitle.toLowerCase().includes(kw)
  )
})

const pagedObjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredObjects.value.slice(start, start + pageSize.value)
})

const showPathModal = ref(false)
const currentPathObj = ref(null)
const availPathSearch = ref('')
const selPathSearch = ref('')

function openPathModal(obj) {
  currentPathObj.value = obj
  availPathSearch.value = ''
  selPathSearch.value = ''
  showPathModal.value = true
}

function currentObjPaths() {
  if (!currentPathObj.value) return []
  const obj = selectedObjects.value.find(o => o.key === currentPathObj.value.key)
  return obj ? obj.selectedPathIds : []
}

const availablePaths = computed(() => {
  if (!currentPathObj.value) return []
  const ids = currentObjPaths()
  const all = getAllPathsFor(currentPathObj.value.key)
  return all.filter(p => !ids.includes(p.id))
})

const filteredAvailablePaths = computed(() => {
  if (!availPathSearch.value) return availablePaths.value
  const kw = availPathSearch.value.toLowerCase()
  return availablePaths.value.filter(p =>
    p.path.toLowerCase().includes(kw) || p.fileName.toLowerCase().includes(kw)
  )
})

const selectedPaths = computed(() => {
  if (!currentPathObj.value) return []
  const ids = currentObjPaths()
  const all = getAllPathsFor(currentPathObj.value.key)
  return all.filter(p => ids.includes(p.id))
})

const filteredSelectedPaths = computed(() => {
  if (!selPathSearch.value) return selectedPaths.value
  const kw = selPathSearch.value.toLowerCase()
  return selectedPaths.value.filter(p =>
    p.path.toLowerCase().includes(kw) || p.fileName.toLowerCase().includes(kw)
  )
})

function selectPath(id) {
  if (!currentPathObj.value) return
  const obj = selectedObjects.value.find(o => o.key === currentPathObj.value.key)
  if (obj && !obj.selectedPathIds.includes(id)) {
    obj.selectedPathIds = [...obj.selectedPathIds, id]
  }
}

function removeSelectedPath(id) {
  if (!currentPathObj.value) return
  const obj = selectedObjects.value.find(o => o.key === currentPathObj.value.key)
  if (obj) {
    obj.selectedPathIds = obj.selectedPathIds.filter(i => i !== id)
  }
}

const showAddCustomPath = ref(false)
const editingCustomPathId = ref(null)
const customForm = reactive({ path: '', fileName: '', type: '运行日志' })

function openAddCustomPath() {
  editingCustomPathId.value = null
  customForm.path = ''
  customForm.fileName = ''
  customForm.type = '运行日志'
  showAddCustomPath.value = true
}

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
  showAddCustomPath.value = false
}

function deleteCustomPath(id) {
  customPaths.value = customPaths.value.filter(p => p.id !== id)
  for (const obj of selectedObjects.value) {
    obj.selectedPathIds = obj.selectedPathIds.filter(i => i !== id)
  }
}

const showPathDetailModal = ref(false)
const detailPath = ref(null)

function showPathDetail(pathObj) {
  if (!pathObj) return
  detailPath.value = pathObj
  showPathDetailModal.value = true
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
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.section-title.collapsible {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}
.section-title.collapsible i {
  font-size: 13px;
  color: var(--text-ter);
}
.section-title.collapsible + div {
  margin-top: 16px;
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
:deep(.ant-table-row) {
  cursor: pointer;
}
</style>