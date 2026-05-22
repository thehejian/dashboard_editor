<template>
  <div class="create-page">
    <div class="create-header">
      <a-button type="text" @click="goBack"><i class="fa-solid fa-arrow-left"></i></a-button>
      <span class="header-sep">|</span>
      <span class="create-title">创建应用</span>
    </div>

    <div class="step-bar">
      <div class="step-item" :class="{ active: step === 1, done: step > 1 }">
        <div class="step-circle" :class="{ active: step === 1, done: step > 1 }">1</div>
        <span class="step-label" :class="{ active: step === 1, done: step > 1 }">选择应用协议模板</span>
      </div>
      <div class="step-connector" :class="{ active: step > 1 }"></div>
      <div class="step-item" :class="{ active: step === 2 }">
        <div class="step-circle" :class="{ active: step === 2 }">2</div>
        <span class="step-label" :class="{ active: step === 2 }">编辑应用信息</span>
      </div>
    </div>

    <div class="create-body">
      <template v-if="step === 1">
        <div class="protocol-list">
          <div
            v-for="p in protocols"
            :key="p.value"
            class="protocol-card"
            :class="{ selected: selectedProtocol === p.value }"
            @click="selectedProtocol = p.value"
          >
            <div class="protocol-name">{{ p.label }}</div>
            <div class="protocol-desc">{{ p.desc }}</div>
          </div>
        </div>
      </template>

      <template v-if="step === 2">
        <div class="step2-header">
          <span class="step2-title">基本信息</span>
        </div>

        <a-form layout="vertical">
          <a-form-item label="* 所属租户">
            <a-select v-model:value="form.tenant" placeholder="请选择">
              <a-select-option value="租户01">租户01</a-select-option>
              <a-select-option value="租户02">租户02</a-select-option>
              <a-select-option value="租户03">租户03</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="图标">
            <div class="icon-field">
              <div class="icon-box">
                <i class="fa-solid fa-hexagon-nodes"></i>
              </div>
              <a-button type="link" class="icon-change">更换图标</a-button>
            </div>
          </a-form-item>

          <a-form-item label="* 名称">
            <a-input v-model:value="form.name" placeholder="app01" />
            <span class="form-hint">同一租户下，名称不允许重复；只能由英文字母(不区分大小写)、数字组成</span>
          </a-form-item>

          <a-form-item label="显示名称">
            <a-input v-model:value="form.displayName" placeholder="app01" />
          </a-form-item>

          <a-form-item label="* 应用类型">
            <div class="app-type-group">
              <label class="app-type-radio" :class="{ selected: form.appType === 'web' }" @click="form.appType = 'web'">
                <a-radio :checked="form.appType === 'web'" @click.stop />
                <div class="app-type-content">
                  <span class="app-type-label">Web应用</span>
                  <span class="app-type-desc">建立SSO关系：指基于浏览器交互的网络应用。应用通过浏览器交互，获得用户授权访问用户的资源。用户资源可以是应用本身管理的用户资源，也可以是其他服务通过 API 暴露的用户资源</span>
                </div>
              </label>
              <label class="app-type-radio" :class="{ selected: form.appType === 'server' }" @click="form.appType = 'server'">
                <a-radio :checked="form.appType === 'server'" @click.stop />
                <div class="app-type-content">
                  <span class="app-type-label">Server应用</span>
                  <span class="app-type-desc">指非用户授权的请求方与接收放数据交换场景。通过标准协议 API 等形式进行帐号等基础数据的交换。当前主要用来支持基于 SCIM 的数据同步场景</span>
                </div>
              </label>
            </div>
          </a-form-item>

          <a-form-item label="* 状态">
            <a-switch v-model:checked="form.enabled" />
          </a-form-item>

          <a-form-item label="* 访问令牌有效期">
            <a-input-number v-model:value="form.tokenExpire" :min="900" :max="10800" :step="1" :formatter="v => `${v} 秒`" :parser="v => v.replace(/[^\d]/g, '')" style="width: 200px" />
            <span class="form-hint">可设置 900 秒 ~ 10800 秒</span>
          </a-form-item>

          <a-form-item label="* 刷新令牌有效期">
            <a-input-number v-model:value="form.refreshTokenExpire" :min="7200" :max="31536000" :step="1" :formatter="v => `${v} 秒`" :parser="v => v.replace(/[^\d]/g, '')" style="width: 200px" />
            <span class="form-hint">可设置 7200 秒 ~ 31536000 秒</span>
          </a-form-item>
        </a-form>

        <div class="section">
          <div class="section-title">* 授权范围</div>
          <div class="scope-list">
            <label class="scope-item" v-for="s in scopes" :key="s.value">
              <a-checkbox v-model:checked="s.checked" />
              <div class="scope-content">
                <span class="scope-value">{{ s.value }}</span>
                <span class="scope-desc">{{ s.desc }}</span>
              </div>
            </label>
          </div>
          <a class="collapse-btn" @click="scopesExpanded = !scopesExpanded">{{ scopesExpanded ? '∧ 收起' : '∨ 展开' }}</a>
        </div>

        <div class="section">
          <div class="section-title">* 回调地址</div>
          <div class="callback-list">
            <div class="callback-row">
              <span class="callback-col-label">访问地址</span>
              <span class="callback-col-label">所属区域</span>
            </div>
            <div class="callback-row callback-input-row">
              <a-input v-model:value="form.callbackUrl" placeholder="http://wenote.com" />
              <a-select v-model:value="form.callbackRegion" style="width: 160px">
                <a-select-option value="Region01">Region01</a-select-option>
                <a-select-option value="Region02">Region02</a-select-option>
              </a-select>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">* 创建快捷入口 <a-tooltip title="创建后在门户首页快捷入口处显示"><i class="fa-regular fa-circle-question" style="color: #8c8c8c; font-size: 14px; cursor: help;"></i></a-tooltip></div>
          <a-radio-group v-model:value="form.quickEntry">
            <a-radio value="yes">是</a-radio>
            <a-radio value="no">否</a-radio>
          </a-radio-group>
        </div>

        <div class="section">
          <div class="section-title">* 创建快捷入口场景分组 <a-tooltip title="选择快捷入口所属分组"><i class="fa-regular fa-circle-question" style="color: #8c8c8c; font-size: 14px; cursor: help;"></i></a-tooltip></div>
          <a-radio-group v-model:value="form.shortcutGroup">
            <a-radio value="服务中心">服务中心</a-radio>
            <a-radio value="运维中心">运维中心</a-radio>
            <a-radio value="运营指挥中心">运营指挥中心</a-radio>
          </a-radio-group>
        </div>

        <div class="section">
          <div class="section-title">描述</div>
          <a-textarea v-model:value="form.description" placeholder="请输入" :maxlength="1000" :show-count="true" :rows="4" />
        </div>
      </template>
    </div>

    <div class="create-footer">
      <template v-if="step === 1">
        <a-button @click="goBack">取消</a-button>
        <a-button type="primary" :disabled="!selectedProtocol" @click="step = 2">下一步</a-button>
      </template>
      <template v-if="step === 2">
        <a-button @click="step = 1">上一步</a-button>
        <a-button type="primary" @click="confirmCreate">完成</a-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const selectedProtocol = ref('SAML')
const scopesExpanded = ref(true)

const protocols = [
  { value: 'SAML', label: 'SAML', desc: 'SAML（Security Assertion Markup Language，安全断言标记语言，版本2.0）基于XML协议，使用包含断言（Assertion）的安全令牌，在授权方（本系统）和消费方（应用）之前传递身份信息，实现基于网络跨域的单点登录。SAML协议是成熟的认证协议，在国内外的公有云和私有云中有非常广泛的运用。' },
  { value: 'CAS', label: 'CAS', desc: 'CAS（Central Authentication Service，集中式认证服务，版本2.0）是一种基于挑战，应答的开源单点登录协议。在集成客户端和服务域之间网络顺畅的情况下广泛在企业中使用，有集成简便，扩展性强的优点。' },
  { value: 'OAuth', label: 'OAuth2/OIDC', desc: 'OAuth2/OIDC是一种标准授权协议，系统支持通过OAuth2/OIDC + OpenID Connect完成集成应用的身份完成认证与单点登录。' },
]

const form = reactive({
  tenant: '租户01',
  name: 'app01',
  displayName: 'app01',
  appType: 'web',
  enabled: true,
  tokenExpire: 3600,
  refreshTokenExpire: 2592000,
  callbackUrl: '',
  callbackRegion: 'Region01',
  quickEntry: 'yes',
  shortcutGroup: '服务中心',
  description: '',
})

const scopes = ref([
  { value: 'openid', desc: '获取用户标识符 (sub) 的权限', checked: true },
  { value: 'profile', desc: '获取用户基本信息的权限，包括用户名、邮箱等', checked: true },
  { value: 'offline_access', desc: '获取刷新令牌 (refresh token) 的权限，用于在访问令牌过期后获取新的访问令牌', checked: true },
  { value: 'mo/unisso', desc: 'Web App如果需要使用ID Token换取IAM Token，则必须取得该授权', checked: false },
  { value: 'mo/uan/safebox', desc: '访问账号保管箱中机密信息的权限，包括查询账号机密信息列表、查询指定账号机密信息', checked: false },
  { value: 'email', desc: '获取用户邮箱信息的权限', checked: false },
  { value: 'address', desc: '获取用户地址信息的权限', checked: false },
  { value: 'phone', desc: '获取用户电话信息的权限', checked: false },
])

function goBack() {
  router.push('/system/security/app-integration')
}

function confirmCreate() {
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
  background: #fff;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.header-sep {
  color: var(--border);
  font-size: 16px;
  font-weight: 200;
}
.create-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 20px 24px;
  background: #fff;
  flex-shrink: 0;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e8e8e8;
  color: #bfbfbf;
  transition: all 0.2s;
}
.step-circle.active {
  background: #262626;
  color: #fff;
}
.step-circle.done {
  background: var(--brand);
  color: #fff;
}
.step-label {
  font-size: 14px;
  color: #bfbfbf;
  transition: all 0.2s;
}
.step-label.active {
  color: #262626;
  font-weight: 600;
}
.step-label.done {
  color: var(--brand);
}
.step-connector {
  width: 60px;
  height: 1px;
  background: #e8e8e8;
  margin: 0 16px;
  transition: all 0.2s;
}
.step-connector.active {
  background: var(--brand);
}

.create-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-sec);
}

.protocol-list {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.protocol-card {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.protocol-card:hover {
  border-color: var(--brand);
  box-shadow: 0 2px 8px rgba(0,125,255,0.08);
}
.protocol-card.selected {
  border-color: var(--brand);
  border-width: 2px;
  box-shadow: 0 0 0 1px var(--brand-subtle);
}
.protocol-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10px;
}
.protocol-desc {
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.7;
}

.step2-header {
  margin-bottom: 24px;
}
.step2-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}
.form-hint {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.5;
}

.icon-field {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-box {
  width: 48px;
  height: 48px;
  background: var(--brand);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
}
.icon-change {
  font-size: 13px;
}

.app-type-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.app-type-radio {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.app-type-radio.selected {
  border-color: var(--brand);
  background: var(--brand-subtle);
}
.app-type-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.app-type-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.app-type-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.6;
}

.section {
  margin-top: 28px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.scope-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.scope-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}
.scope-item:last-child {
  border-bottom: none;
}
.scope-item:hover {
  background: #fafafa;
}
.scope-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.scope-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  font-family: 'SF Mono', 'Menlo', monospace;
}
.scope-desc {
  font-size: 12px;
  color: #8c8c8c;
}
.collapse-btn {
  display: block;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: #8c8c8c;
  cursor: pointer;
  margin-top: 4px;
}
.collapse-btn:hover {
  color: var(--brand);
}

.callback-list {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  padding: 12px 16px;
}
.callback-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.callback-col-label {
  flex: 1;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}
.callback-input-row {
  margin-top: 8px;
  gap: 12px;
}
.callback-input-row .ant-input {
  flex: 1;
}

.create-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
  box-shadow: 0 -1px 4px rgba(0,0,0,0.04);
}
</style>
