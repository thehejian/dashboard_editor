<template>
  <div class="create-page">
    <div class="create-header">
      <a-button type="text" @click="goBack"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="create-title">{{ createStep === 1 ? '选择协议类型' : '配置身份提供商' }}</span>
    </div>

    <div class="create-body">
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
      </template>
    </div>

    <div class="create-footer">
      <template v-if="createStep === 1">
        <a-button @click="goBack">取消</a-button>
        <a-button type="primary" :disabled="!selectedProtocol" @click="createStep = 2">下一步</a-button>
      </template>
      <template v-if="createStep === 2">
        <a-button @click="createStep = 1">上一步</a-button>
        <a-button type="primary" @click="confirmCreate">确定</a-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import IdpLdapForm from './IdpLdapForm.vue'

const router = useRouter()
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

function goBack() {
  router.push('/system/security/idp')
}

function confirmCreate() {
  if (selectedProtocol.value === 'LDAP' && ldapFormRef.value) {
    ldapFormRef.value.validate()
  }
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
  padding: 16px 24px;
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
.protocol-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 640px;
}
.protocol-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
}
.protocol-card:hover {
  border-color: var(--brand);
  box-shadow: 0 2px 8px rgba(0,125,255,0.08);
}
.protocol-card.selected {
  border-color: var(--brand);
  background: var(--brand-subtle);
  box-shadow: 0 0 0 2px var(--brand-subtle);
}
.protocol-icon {
  font-size: 32px;
  color: var(--brand);
  margin-bottom: 12px;
}
.protocol-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}
.protocol-desc {
  font-size: 13px;
  color: var(--text-sec);
  line-height: 1.6;
}
.step2-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.step2-badge {
  background: var(--brand);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.step2-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.form-hint {
  display: block;
  font-size: 12px;
  color: var(--text-ter);
  margin-top: 4px;
}
</style>
