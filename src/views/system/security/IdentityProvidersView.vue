<template>
  <div>
    <div class="page-header">
      <h3>身份提供商</h3>
      <a-button type="primary" @click="openCreate">创建身份提供商</a-button>
    </div>
    <div class="filter-bar">
      <a-select v-model:value="filterType" placeholder="协议类型" allowClear style="width:140px">
        <a-select-option value="SAML">SAML 2.0</a-select-option>
        <a-select-option value="CAS">CAS 2.0</a-select-option>
        <a-select-option value="LDAP">LDAP</a-select-option>
        <a-select-option value="OAuth">OAuth 2.0</a-select-option>
      </a-select>
      <a-input-search v-model:value="search" placeholder="搜索提供商名称" style="width:240px" />
    </div>
    <a-table :columns="columns" :data-source="data" :pagination="{ pageSize: 10 }" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'protocol'">
          <a-tag>{{ record.protocol }}</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-switch :checked="record.status === 'active'" @change="toggleStatus(record)" size="small" />
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="toggleStatus(record)">{{ record.status === 'active' ? '停用' : '启用' }}</a-button>
          <a-button type="link" size="small" danger @click="remove(record)">删除</a-button>
          <a-button type="link" size="small" @click="exportProvider(record)">导出</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:visible="showCreate"
      :title="createStep === 1 ? '选择协议类型' : '配置身份提供商'"
      :width="createStep === 1 ? 640 : 800"
      :footer="null"
      :destroy-on-close="true"
      @cancel="resetCreate"
    >
      <template v-if="createStep === 1">
        <div class="protocol-grid">
          <div
            v-for="p in protocols"
            :key="p.value"
            class="protocol-card"
            :class="{ selected: selectedProtocol === p.value }"
            @click="selectedProtocol = p.value"
          >
            <div class="protocol-icon"><i :class="p.icon"></i></div>
            <div class="protocol-name">{{ p.label }}</div>
            <div class="protocol-desc">{{ p.desc }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <a-button @click="resetCreate">取消</a-button>
          <a-button type="primary" :disabled="!selectedProtocol" @click="createStep = 2">下一步</a-button>
        </div>
      </template>

      <template v-if="createStep === 2">
        <div class="step2-header">
          <span class="step2-badge">{{ selectedProtocol }}</span>
          <span class="step2-title">配置身份提供商</span>
        </div>
        <IdpLdapForm v-if="selectedProtocol === 'LDAP'" ref="ldapFormRef" />
        <a-form v-else layout="vertical">
          <a-form-item label="* 名称">
            <a-input v-model:value="simpleForm.name" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="simpleForm.desc" placeholder="请输入" :maxlength="1000" :show-count="true" />
          </a-form-item>
          <template v-if="selectedProtocol === 'SAML'">
            <a-form-item label="Metadata URL">
              <a-input v-model:value="samlForm.metadataUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="Entity ID">
              <a-input v-model:value="samlForm.entityId" placeholder="请输入" />
            </a-form-item>
            <a-form-item label="Assertion Consumer URL">
              <a-input v-model:value="samlForm.acsUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="Name ID Format">
              <a-select v-model:value="samlForm.nameIdFormat" placeholder="请选择">
                <a-select-option value="email">emailAddress</a-select-option>
                <a-select-option value="unspecified">unspecified</a-select-option>
                <a-select-option value="persistent">persistent</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="签名证书">
              <a-button>添加文件</a-button>
              <span class="form-hint">证书格式为 .cer 或 .pem</span>
            </a-form-item>
          </template>
          <template v-if="selectedProtocol === 'CAS'">
            <a-form-item label="登录 URL">
              <a-input v-model:value="casForm.loginUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="登出 URL">
              <a-input v-model:value="casForm.logoutUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="Service Ticket 验证 URL">
              <a-input v-model:value="casForm.ticketUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="证书">
              <a-button>添加文件</a-button>
              <span class="form-hint">证书格式为 .cer 或 .pem</span>
            </a-form-item>
          </template>
          <template v-if="selectedProtocol === 'OAuth'">
            <a-form-item label="Client ID">
              <a-input v-model:value="oauthForm.clientId" placeholder="请输入" />
            </a-form-item>
            <a-form-item label="Client Secret">
              <a-input-password v-model:value="oauthForm.clientSecret" placeholder="请输入" />
            </a-form-item>
            <a-form-item label="Authorization URL">
              <a-input v-model:value="oauthForm.authUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="Token URL">
              <a-input v-model:value="oauthForm.tokenUrl" placeholder="https://..." />
            </a-form-item>
            <a-form-item label="Scope">
              <a-input v-model:value="oauthForm.scope" placeholder="openid profile email" />
            </a-form-item>
            <a-form-item label="Redirect URI">
              <a-input v-model:value="oauthForm.redirectUri" placeholder="https://..." />
            </a-form-item>
          </template>
        </a-form>
        <div class="modal-footer step2-footer">
          <a-button @click="createStep = 1">上一步</a-button>
          <a-button type="primary" @click="confirmCreate">确定</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import IdpLdapForm from './IdpLdapForm.vue'

const search = ref('')
const filterType = ref(null)
const showCreate = ref(false)
const createStep = ref(1)
const selectedProtocol = ref(null)
const ldapFormRef = ref(null)

const protocols = [
  { value: 'SAML', label: 'SAML 2.0', desc: '基于断言的安全标记语言协议，支持跨域单点登录，适用于企业级应用集成', icon: 'fa-solid fa-shield-halved' },
  { value: 'CAS', label: 'CAS 2.0', desc: '中央认证服务协议，提供统一的身份认证入口，适用于 Web 单点登录场景', icon: 'fa-solid fa-id-card' },
  { value: 'LDAP', label: 'LDAP', desc: '轻量目录访问协议，支持从企业目录服务中同步用户和用户组信息', icon: 'fa-solid fa-address-book' },
  { value: 'OAuth', label: 'OAuth 2.0', desc: '开放授权协议，支持第三方应用通过令牌获取用户身份信息', icon: 'fa-solid fa-key' },
]

const simpleForm = reactive({ name: '', desc: '' })
const samlForm = reactive({ metadataUrl: '', entityId: '', acsUrl: '', nameIdFormat: null })
const casForm = reactive({ loginUrl: '', logoutUrl: '', ticketUrl: '' })
const oauthForm = reactive({ clientId: '', clientSecret: '', authUrl: '', tokenUrl: '', scope: '', redirectUri: '' })

const data = ref([
  { id: 1, name: '企业微信', protocol: 'OAuth', status: 'active', created: '2024-01-15', updated: '2025-05-19 10:30', desc: '企业微信 OAuth 身份认证' },
  { id: 2, name: '阿里云 RAM', protocol: 'SAML', status: 'active', created: '2024-03-20', updated: '2025-05-18 14:20', desc: '阿里云 RAM SAML 2.0 联邦认证' },
  { id: 3, name: 'LDAP 目录服务', protocol: 'LDAP', status: 'disabled', created: '2024-06-01', updated: '2025-04-15 09:00', desc: '企业内部 LDAP 目录同步' },
  { id: 4, name: '统一认证平台', protocol: 'CAS', status: 'active', created: '2024-08-10', updated: '2025-05-17 16:45', desc: 'CAS 2.0 单点登录认证' },
])

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '协议类型', key: 'protocol', width: 110 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created' },
  { title: '最后更新时间', dataIndex: 'updated' },
  { title: '描述', dataIndex: 'desc' },
  { title: '操作', key: 'action', width: 200 },
]

function openCreate() {
  selectedProtocol.value = null
  createStep.value = 1
  showCreate.value = true
}

function resetCreate() {
  showCreate.value = false
  selectedProtocol.value = null
  createStep.value = 1
}

function confirmCreate() {
  if (selectedProtocol.value === 'LDAP' && ldapFormRef.value) {
    ldapFormRef.value.validate()
  }
  data.value.push({
    id: Date.now(),
    name: simpleForm.name || (selectedProtocol.value === 'LDAP' ? ldapFormRef.value?.form?.name : '') || '新建提供商',
    protocol: selectedProtocol.value,
    status: 'active',
    created: new Date().toISOString().slice(0, 10),
    updated: new Date().toLocaleString(),
    desc: simpleForm.desc || '',
  })
  resetCreate()
}

function toggleStatus(r) {
  r.status = r.status === 'active' ? 'disabled' : 'active'
}

function remove(r) {
  data.value = data.value.filter(d => d.id !== r.id)
}

function exportProvider(r) {
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${r.name}-config.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.protocol-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px 0 24px; }
.protocol-card { border: 1px solid var(--border); border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; }
.protocol-card:hover { border-color: var(--brand); box-shadow: 0 2px 8px rgba(0,125,255,0.08); }
.protocol-card.selected { border-color: var(--brand); background: var(--brand-subtle); box-shadow: 0 0 0 2px var(--brand-subtle); }
.protocol-icon { font-size: 28px; color: var(--brand); margin-bottom: 8px; }
.protocol-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.protocol-desc { font-size: 12px; color: var(--text-sec); line-height: 1.5; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.step2-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.step2-badge { background: var(--brand); color: #fff; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.step2-title { font-size: 16px; font-weight: 600; color: var(--text); }
.step2-footer { border-top: 1px solid var(--border); padding-top: 16px; }
.form-hint { display: block; font-size: 12px; color: var(--text-ter); margin-top: 4px; }
</style>
