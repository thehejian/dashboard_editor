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
        <div v-show="basicOpen" class="collapse-content">
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
      </div>

      <div class="form-section">
        <div class="section-title collapsible" @click="scopeOpen = !scopeOpen">
          <span>采集范围</span>
          <i class="fa-solid" :class="scopeOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <div v-show="scopeOpen" class="collapse-content">
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
                    <template v-if="column.key === 'pathTags' && isCloudService">
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
                    <template v-if="column.key === 'logFormat' && form.resourceType === 'physical'">
                      <a-select :value="record.logFormat" @change="(v) => record.logFormat = v" size="small" style="width:110px">
                        <a-select-option value="RFC3164">RFC3164</a-select-option>
                        <a-select-option value="RFC5424">RFC5424</a-select-option>
                        <a-select-option value="自定义">自定义</a-select-option>
                      </a-select>
                    </template>
                    <template v-if="column.key === 'action'">
                      <template v-if="isCloudService">
                        <a-button type="link" size="small" @click="openPathModal(record)">添加路径</a-button>
                      </template>
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

            <a-form-item v-if="form.resourceType === 'cloud-resource' && selectedObjects.length" label="日志范围">
              <div style="font-size:12px;color:var(--text-ter);margin-bottom:8px">日志范围针对所选的全部云资源实例生效</div>
              <a-table
                :data-source="logScopes"
                :columns="logScopeColumns"
                row-key="id"
                size="small"
                :pagination="false"
                :scroll="{ x: 650 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'collectionScope'">
                    <a-select :value="record.collectionScope" @change="(v) => record.collectionScope = v" size="small" style="width:90px">
                      <a-select-option value="全量">全量</a-select-option>
                      <a-select-option value="异常">异常</a-select-option>
                    </a-select>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-button v-if="record.source === '自定义'" type="link" size="small" danger @click="deleteLogScope(record.id)">删除</a-button>
                  </template>
                </template>
              </a-table>
              <a-button type="dashed" block size="small" style="margin-top:8px" @click="showAddLogScope = true">
                <i class="fa-solid fa-plus"></i> 新增日志范围
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title collapsible" @click="destOpen = !destOpen">
          <span>转发目的地</span>
          <i class="fa-solid" :class="destOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </div>
        <div v-show="destOpen" class="collapse-content">
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
    </div>

    <div class="create-footer">
      <a-button @click="goBack">取消</a-button>
      <a-button type="primary" :loading="submitting" @click="handleSubmit">确定</a-button>
    </div>

    <a-modal v-model:visible="showObjectModal" title="选择采集对象" width="1100px" :cancelText="'取消'" :okText="'确定'" @ok="confirmObjects" @cancel="showObjectModal = false">
      <div class="transfer-layout">
        <div class="transfer-panel">
          <div class="transfer-panel-header">可选对象</div>
          <a-input-search v-model:value="srcSearch" placeholder="搜索" size="small" style="margin:8px 12px;width:calc(100% - 24px)" />
          <div class="transfer-tree-wrap">
            <a-table
              :columns="treeTableColumns"
              :data-source="filteredSrcTree"
              :rowSelection="treeRowSelection"
              row-key="key"
              :pagination="false"
              size="small"
              :scroll="{ y: 300 }"
              :customRow="(r) => ({ onClick: () => toggleTreeKey(r.key) })"
            />
          </div>
        </div>
        <div class="transfer-divider"></div>
        <div class="transfer-panel">
          <div class="transfer-panel-header">已选对象 ({{ checkedKeys.length }})</div>
          <a-input-search v-model:value="dstSearch" placeholder="搜索" size="small" style="margin:8px 12px;width:calc(100% - 24px)" />
          <div class="transfer-tree-wrap">
            <a-table
              :columns="treeTableColumns"
              :data-source="filteredDstTree"
              row-key="key"
              :pagination="false"
              size="small"
              :scroll="{ y: 300 }"
              :customRow="(r) => ({ onClick: () => toggleTreeKey(r.key) })"
            />
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:visible="showPathModal" :title="'配置日志路径 - ' + (currentPathObj?.title || '')" width="1200px" :cancelText="'取消'" :okText="'确定'" @ok="confirmPaths" @cancel="showPathModal = false">
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
                :customRow="(r) => ({ onClick: () => selectPath(r.id) })"
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
                :customRow="(r) => ({ onClick: () => removeSelectedPath(r.id) })"
              />
              <div v-else class="transfer-empty">暂无选择</div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:visible="showAddCustomPath" title="新增自定义路径" width="640px" :cancelText="'取消'" :okText="'确定'" @ok="saveCustomPath" @cancel="showAddCustomPath = false">
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

    <a-modal v-model:visible="showAddLogScope" title="新增日志范围" width="640px" :cancelText="'取消'" :okText="'确定'" @ok="saveLogScope" @cancel="showAddLogScope = false">
      <a-form layout="vertical">
        <a-form-item label="日志路径" required>
          <a-input v-model:value="logScopeForm.path" placeholder="/var/log/..." />
        </a-form-item>
        <a-form-item label="日志名称" required>
          <a-input v-model:value="logScopeForm.name" placeholder="如：应用运行日志" />
        </a-form-item>
        <a-form-item label="采集范围" required>
          <a-radio-group v-model:value="logScopeForm.collectionScope">
            <a-radio value="全量">全量</a-radio>
            <a-radio value="异常">异常</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()
let customIdCounter = 100
let scopeIdCounter = 10
let objIdCounter = 1

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

const isCloudService = computed(() => form.resourceType === 'cloud-service')

const objectTrees = {
  'cloud-service': [
    {
      title: '统一云管（云服务类别）',
      key: 'root',
      isLeaf: false,
      children: [
        {
          title: 'ManageOne（云服务）',
          key: 'manageone',
          isLeaf: false,
          children: [
            { title: '微服务01', key: 'ms-01', isLeaf: true, parentTitle: 'ManageOne' },
            { title: '微服务02', key: 'ms-02', isLeaf: true, parentTitle: 'ManageOne' },
            { title: '微服务03', key: 'ms-03', isLeaf: true, parentTitle: 'ManageOne' },
            { title: '微服务04', key: 'ms-04', isLeaf: true, parentTitle: 'ManageOne' },
            { title: '微服务05', key: 'ms-05', isLeaf: true, parentTitle: 'ManageOne' },
          ],
        },
      ],
    },
  ],
  'cloud-resource': [
    {
      title: '计算',
      key: 'compute',
      isLeaf: false,
      children: [
        {
          title: '弹性云服务器',
          key: 'ecs',
          isLeaf: false,
          children: [
            { title: '弹性云服务器01', key: 'ecs-01', isLeaf: true, id: 'ecs-001', ip: '192.168.1.10' },
          ],
        },
        {
          title: '管理虚拟机',
          key: 'vm-mgmt',
          isLeaf: false,
          children: [
            { title: '管理虚拟机01', key: 'vm-mgmt-01', isLeaf: true, id: 'vm-001', ip: '192.168.2.10' },
          ],
        },
      ],
    },
    {
      title: '存储',
      key: 'storage',
      isLeaf: false,
      children: [
        { title: '存储节点01', key: 'stor-01', isLeaf: true, id: 'stor-001', ip: '192.168.3.10' },
      ],
    },
    {
      title: '网络',
      key: 'network',
      isLeaf: false,
      children: [
        { title: '网络节点01', key: 'net-01', isLeaf: true, id: 'net-001', ip: '192.168.4.10' },
      ],
    },
  ],
  'physical': [
    {
      title: '服务器',
      key: 'phy-server',
      isLeaf: false,
      children: [
        { title: '服务器01', key: 'phy-svr-01', isLeaf: true, id: 'phy-001', managementIp: '10.0.1.10', deviceModel: 'RH2288H' },
        { title: '服务器02', key: 'phy-svr-02', isLeaf: true, id: 'phy-002', managementIp: '10.0.1.11', deviceModel: 'TaiShan 200' },
      ],
    },
    {
      title: '存储设备',
      key: 'phy-storage',
      isLeaf: false,
      children: [
        { title: '存储设备01', key: 'phy-sto-01', isLeaf: true, id: 'phy-003', managementIp: '10.0.2.10', deviceModel: 'OceanStor 5500' },
        { title: '存储设备02', key: 'phy-sto-02', isLeaf: true, id: 'phy-004', managementIp: '10.0.2.11', deviceModel: 'OceanStor 5500' },
      ],
    },
    {
      title: '网络设备',
      key: 'phy-net',
      isLeaf: false,
      children: [
        {
          title: '交换机',
          key: 'phy-switch',
          isLeaf: false,
          children: [
            { title: '交换机01', key: 'phy-sw-01', isLeaf: true, id: 'phy-005', managementIp: '10.0.3.10', deviceModel: 'CE6850' },
          ],
        },
      ],
    },
  ],
}

const currentTree = computed(() => objectTrees[form.resourceType] || [])

function getLeafKeys(nodes) {
  const keys = []
  for (const n of nodes) {
    if (n.children && n.children.length) {
      keys.push(...getLeafKeys(n.children))
    } else {
      keys.push(n.key)
    }
  }
  return keys
}

const allLeafKeys = computed(() => getLeafKeys(currentTree.value))

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

const treeTableColumns = computed(() => {
  if (isCloudService.value) {
    return [
      { title: '名称', dataIndex: 'title', key: 'name', ellipsis: true },
      { title: '所属云服务', dataIndex: 'parentTitle', key: 'parent', ellipsis: true },
    ]
  }
  if (form.resourceType === 'cloud-resource') {
    return [
      { title: '名称', dataIndex: 'title', key: 'name', ellipsis: true },
      { title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true },
      { title: 'IP地址', dataIndex: 'ip', key: 'ip', ellipsis: true },
    ]
  }
  return [
    { title: '名称', dataIndex: 'title', key: 'name', ellipsis: true },
    { title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true },
    { title: '管理IP', dataIndex: 'managementIp', key: 'managementIp', ellipsis: true },
    { title: '设备型号', dataIndex: 'deviceModel', key: 'deviceModel', ellipsis: true },
  ]
})

const showObjectModal = ref(false)
const checkedKeys = ref([])
const srcSearch = ref('')
const dstSearch = ref('')

const filteredSrcTree = computed(() => filterTree(currentTree.value, srcSearch.value))

const treeRowSelection = computed(() => ({
  selectedRowKeys: checkedKeys.value,
  onChange: (keys) => { checkedKeys.value = keys },
  getCheckboxProps: (record) => ({
    disabled: !record.isLeaf,
  }),
}))

function toggleTreeKey(key) {
  if (!allLeafKeys.value.includes(key)) return
  const idx = checkedKeys.value.indexOf(key)
  if (idx >= 0) {
    checkedKeys.value = checkedKeys.value.filter(k => k !== key)
  } else {
    checkedKeys.value = [...checkedKeys.value, key]
  }
}

function getSelectedTreeData() {
  const selectedSet = new Set(checkedKeys.value)
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
      if (selectedSet.has(node.key)) {
        acc.push(node)
      }
      return acc
    }, [])
  }
  return prune(currentTree.value)
}

const filteredDstTree = computed(() => {
  const data = getSelectedTreeData()
  if (!dstSearch.value) return data
  return filterTree(data, dstSearch.value)
})

function openObjectModal() {
  checkedKeys.value = selectedObjects.value.map(o => o.key)
  srcSearch.value = ''
  dstSearch.value = ''
  showObjectModal.value = true
}

const selectedObjects = ref([])

function confirmObjects() {
  const selectedKeys = checkedKeys.value.filter(k => allLeafKeys.value.includes(k))
  const existingKeys = new Set(selectedObjects.value.map(o => o.key))
  const tree = currentTree.value

  for (const key of selectedKeys) {
    if (!existingKeys.has(key)) {
      const info = getNodeInfo(key, tree)
      const parent = getParentTitle(key, tree)
      if (isCloudService.value) {
        selectedObjects.value.push({
          key,
          title: info?.title || key,
          parentTitle: parent,
          description: '',
          selectedPathIds: [],
        })
      } else if (form.resourceType === 'cloud-resource') {
        const num = objIdCounter++
        selectedObjects.value.push({
          key,
          title: info?.title || key,
          parentTitle: parent,
          id: `res-${String(num).padStart(3, '0')}`,
          ip: `192.168.${(num % 255) + 1}.${(num * 7) % 255 + 1}`,
        })
      } else {
        const num = objIdCounter++
        const models = ['RH2288H', 'TaiShan 200', 'FusionServer Pro']
        selectedObjects.value.push({
          key,
          title: info?.title || key,
          parentTitle: parent,
          id: `phy-${String(num).padStart(3, '0')}`,
          managementIp: `10.0.${(num % 255) + 1}.${(num * 3) % 255 + 1}`,
          deviceModel: models[(num - 1) % models.length],
          logFormat: 'RFC3164',
        })
      }
      existingKeys.add(key)
    }
  }
  selectedObjects.value = selectedObjects.value.filter(o => selectedKeys.includes(o.key))
  showObjectModal.value = false
  currentPage.value = 1
}

function getNodeInfo(key, nodes) {
  for (const n of nodes) {
    if (n.key === key) return { title: n.title, isLeaf: n.isLeaf }
    if (n.children) {
      const r = getNodeInfo(key, n.children)
      if (r) return r
    }
  }
  return null
}

function getParentTitle(key, nodes) {
  for (const n of nodes) {
    if (n.children) {
      const allChildKeys = new Set()
      function collectKeys(nn) {
        if (nn.children) nn.children.forEach(collectKeys)
        else allChildKeys.add(nn.key)
      }
      n.children.forEach(collectKeys)
      if (allChildKeys.has(key)) return n.title
      const r = getParentTitle(key, n.children)
      if (r) return r
    }
  }
  return ''
}

function removeObject(obj) {
  selectedObjects.value = selectedObjects.value.filter(o => o.key !== obj.key)
  currentPage.value = 1
}

const filteredObjects = computed(() => {
  if (!objectKeyword.value) return selectedObjects.value
  const kw = objectKeyword.value.toLowerCase()
  return selectedObjects.value.filter(o =>
    o.title.toLowerCase().includes(kw) || (o.parentTitle && o.parentTitle.toLowerCase().includes(kw))
  )
})

const pagedObjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredObjects.value.slice(start, start + pageSize.value)
})

const logScopeColumns = [
  { title: '日志路径', dataIndex: 'path', key: 'path', width: 200 },
  { title: '日志名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '采集范围', key: 'collectionScope', width: 120 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
  { title: '操作', key: 'action', width: 80 },
]

const presetLogScopes = [
  { id: 'ls-1', path: '/var/log/*.log', name: '应用运行日志', collectionScope: '全量', source: '系统预制' },
  { id: 'ls-2', path: '/var/log/*.err', name: '异常日志', collectionScope: '异常', source: '系统预制' },
]

const logScopes = ref([...presetLogScopes])

const objectColumns = computed(() => {
  if (isCloudService.value) {
    return [
      { title: '对象名称', dataIndex: 'title', key: 'name', width: 140 },
      { title: '所属云服务', dataIndex: 'parentTitle', key: 'service', width: 140 },
      { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
      { title: '关联日志路径数量', key: 'pathTags', width: 220 },
      { title: '操作', key: 'action', width: 180 },
    ]
  }
  if (form.resourceType === 'cloud-resource') {
    return [
      { title: '名称', dataIndex: 'title', key: 'name', width: 140 },
      { title: 'ID', dataIndex: 'id', key: 'id', width: 160 },
      { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 },
      { title: '操作', key: 'action', width: 100 },
    ]
  }
  return [
    { title: '名称', dataIndex: 'title', key: 'name', width: 140 },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 160 },
    { title: '管理IP地址', dataIndex: 'managementIp', key: 'managementIp', width: 140 },
    { title: '设备型号', dataIndex: 'deviceModel', key: 'deviceModel', width: 130 },
    { title: '日志格式', key: 'logFormat', width: 120 },
    { title: '操作', key: 'action', width: 100 },
  ]
})

const pathColumns = [
  { title: '日志路径', dataIndex: 'path', key: 'path', width: 180 },
  { title: '日志文件名称', dataIndex: 'fileName', key: 'fileName', width: 140 },
  { title: '日志类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
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

function getAllPathsFor(key) {
  const presets = presetPaths[key] || []
  return [...presets, ...customPaths.value]
}

function getPathObj(key, pid) {
  return getAllPathsFor(key).find(p => p.id === pid)
}

const showPathModal = ref(false)
const currentPathObj = ref(null)
const availPathSearch = ref('')
const selPathSearch = ref('')
const pathSelectedIds = ref({})

function openPathModal(obj) {
  currentPathObj.value = obj
  const key = obj.key
  pathSelectedIds.value = { ...pathSelectedIds.value, [key]: [...(obj.selectedPathIds || [])] }
  availPathSearch.value = ''
  selPathSearch.value = ''
  showPathModal.value = true
}

function currentSelectedIds() {
  if (!currentPathObj.value) return []
  return pathSelectedIds.value[currentPathObj.value.key] || []
}

const availablePaths = computed(() => {
  const ids = currentSelectedIds()
  if (!currentPathObj.value) return []
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
  const ids = currentSelectedIds()
  if (!currentPathObj.value) return []
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
  const key = currentPathObj.value.key
  const ids = pathSelectedIds.value[key] || []
  if (!ids.includes(id)) {
    pathSelectedIds.value = { ...pathSelectedIds.value, [key]: [...ids, id] }
    const obj = selectedObjects.value.find(o => o.key === key)
    if (obj) obj.selectedPathIds = [...(obj.selectedPathIds || []), id]
  }
}

function removeSelectedPath(id) {
  if (!currentPathObj.value) return
  const key = currentPathObj.value.key
  const ids = pathSelectedIds.value[key] || []
  const next = ids.filter(i => i !== id)
  pathSelectedIds.value = { ...pathSelectedIds.value, [key]: next }
  const obj = selectedObjects.value.find(o => o.key === key)
  if (obj) obj.selectedPathIds = next
}

function confirmPaths() {
  if (currentPathObj.value) {
    const key = currentPathObj.value.key
    const ids = pathSelectedIds.value[key] || []
    const obj = selectedObjects.value.find(o => o.key === key)
    if (obj) obj.selectedPathIds = [...ids]
  }
  showPathModal.value = false
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

const showAddLogScope = ref(false)
const logScopeForm = reactive({ path: '', name: '', collectionScope: '全量' })

function saveLogScope() {
  if (!logScopeForm.path || !logScopeForm.name) {
    showAddLogScope.value = false
    return
  }
  logScopes.value.push({
    id: 'ls-c' + (scopeIdCounter++),
    path: logScopeForm.path,
    name: logScopeForm.name,
    collectionScope: logScopeForm.collectionScope,
    source: '自定义',
  })
  logScopeForm.path = ''
  logScopeForm.name = ''
  logScopeForm.collectionScope = '全量'
  showAddLogScope.value = false
}

function deleteLogScope(id) {
  logScopes.value = logScopes.value.filter(s => s.id !== id)
}

function goBack() {
  router.push('/ops/logs/config/tasks')
}

const submitting = ref(false)

async function handleSubmit() {
  if (!form.name) {
    message.warning('请输入任务名称')
    return
  }
  if (!form.region) {
    message.warning('请选择区域')
    return
  }
  submitting.value = true
  try {
    const body = {
      name: form.name,
      scene: form.resourceType,
      enabled: form.status,
      target: form.destination || '',
      region: form.region,
    }
    const res = await fetch('/api/cmdb/log_collect_tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (json.success) {
      message.success('采集任务创建成功')
      goBack()
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
  margin-bottom: 16px;
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
@media (max-width: 768px) {
  .create-header { padding: 11px 12px; }
  .create-title { font-size: 14px; }
  .create-body { padding: 12px; }
  .create-footer { padding: 12px; }
  .form-section { padding: 16px; margin-bottom: 12px; }
  .section-title { font-size: 14px; margin-bottom: 12px; }
  .transfer-layout { flex-direction: column; }
  .transfer-divider { width: 100%; height: 1px; margin: 8px 0; }
  .transfer-panel { min-height: 200px; }
  :deep(.ant-modal) { width: 95% !important; max-width: 1100px; margin: 0 auto; }
  :deep(.ant-modal-body) { padding: 12px; }
  :deep(.ant-radio-group) { display: flex; flex-wrap: wrap; gap: 8px; }
  :deep(.ant-radio-group .ant-radio-button-wrapper) { flex: 1; text-align: center; }
  :deep(.ant-form-item .ant-select),
  :deep(.ant-form-item .ant-input-search) { width: 100% !important; }
}
</style>