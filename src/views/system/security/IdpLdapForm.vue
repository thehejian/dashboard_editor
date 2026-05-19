<template>
  <div class="ldap-form">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false" expand-icon-position="end">
      <a-collapse-panel key="basic" header="基本信息">
        <a-form layout="vertical">
          <a-form-item label="图标">
            <div class="icon-upload-area">
              <div class="icon-preview">
                <i class="fa-solid fa-hexagon-nodes"></i>
              </div>
              <div class="icon-actions">
                <a-button size="small">上传图标</a-button>
                <a-button size="small">恢复默认</a-button>
              </div>
              <div class="icon-tips">
                <p>1、目前支持上传的图片格式为JPG、PNG格式；</p>
                <p>2、为保证图片的正常显示，图片上传大小需在16KB以内，建议尺寸为64*64px；</p>
                <p>3、如果不自定义图标则会使用默认图标；</p>
              </div>
            </div>
          </a-form-item>
          <a-form-item label="* 名称">
            <a-input v-model:value="form.name" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 状态">
            <a-switch v-model:checked="form.status" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="form.description" placeholder="请输入" :maxlength="1000" :show-count="true" />
          </a-form-item>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="server" header="服务器信息">
        <a-form layout="vertical">
          <a-form-item label="* 主服务器IP地址类型">
            <a-radio-group v-model:value="form.mainAddrType" button-style="solid" size="small">
              <a-radio-button value="IPV4">IPV4</a-radio-button>
              <a-radio-button value="IPV6">IPV6</a-radio-button>
              <a-radio-button value="DOMAIN">域名</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="* 主服务器地址">
            <a-input v-model:value="form.mainAddr" placeholder="· · ·" />
          </a-form-item>
          <a-form-item label="* 主服务器端口">
            <a-input v-model:value="form.mainPort" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="备服务器IP地址类型">
            <a-radio-group v-model:value="form.backupAddrType" button-style="solid" size="small">
              <a-radio-button value="IPV4">IPV4</a-radio-button>
              <a-radio-button value="IPV6">IPV6</a-radio-button>
              <a-radio-button value="DOMAIN">域名</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="备服务器地址">
            <a-input v-model:value="form.backupAddr" placeholder="· · ·" />
          </a-form-item>
          <a-form-item label="备服务器端口">
            <a-input v-model:value="form.backupPort" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 启用TLS">
            <a-switch v-model:checked="form.tlsEnabled" />
          </a-form-item>
          <a-form-item label="TLS版本">
            <a-select v-model:value="form.tlsVersion" placeholder="请选择" style="width:200px">
              <a-select-option value="TLSv1.2">TLSv1.2</a-select-option>
              <a-select-option value="TLSv1.3">TLSv1.3</a-select-option>
            </a-select>
            <a-tooltip title="选择 TLS 协议版本，建议使用 TLSv1.3"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="* 证书">
            <a-button size="small">添加文件</a-button>
            <span class="form-hint">证书后缀为 cer, der 或 pem</span>
          </a-form-item>
          <a-form-item label="模式">
            <a-radio-group v-model:value="form.mode" button-style="solid" size="small">
              <a-radio-button value="OpenLDAP">OpenLDAP</a-radio-button>
              <a-radio-button value="AD">AD</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="directory" header="用户目录树配置">
        <a-form layout="vertical">
          <a-form-item label="* 用户根DN">
            <a-input v-model:value="form.userRootDn" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 用户根DN前缀">
            <a-input v-model:value="form.userRootDnPrefix" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 用户根DN后缀">
            <a-input v-model:value="form.userRootDnSuffix" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 用户对象类名">
            <a-input v-model:value="form.userObjectClass" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="* 用户唯一标识">
            <a-input v-model:value="form.userUniqueId" placeholder="请输入" />
            <a-tooltip title="用于唯一标识用户的属性，如 uid 或 cn"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="* 开启同步">
            <a-switch v-model:checked="form.syncEnabled" />
          </a-form-item>

          <div class="card-section">
            <div class="card-label">* 同步用户姓名</div>
            <div class="card-body">
              <a-form-item label="用户全名属性名称">
                <a-input v-model:value="form.userNameAttr" placeholder="请输入" />
              </a-form-item>
              <a-form-item label="用户描述属性名称">
                <a-input v-model:value="form.userDescAttr" placeholder="请输入" />
              </a-form-item>
            </div>
          </div>

          <div class="card-section">
            <div class="card-label">* 同步用户手机</div>
            <div class="card-body">
              <a-form-item label="用户手机属性">
                <a-input v-model:value="form.userPhoneAttr" />
                <a-tooltip title="LDAP 中存储手机号的属性字段名"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
              </a-form-item>
              <a-form-item label="区号">
                <a-space>
                  <a-select v-model:value="form.phoneRegion" style="width:120px">
                    <a-select-option value="通用">通用</a-select-option>
                  </a-select>
                  <a-select v-model:value="form.phoneCode" style="width:180px">
                    <a-select-option value="+86 (中国大陆)">+86 (中国大陆)</a-select-option>
                    <a-select-option value="+1 (美国)">+1 (美国)</a-select-option>
                    <a-select-option value="+81 (日本)">+81 (日本)</a-select-option>
                  </a-select>
                </a-space>
                <div class="form-hint">如果XXX Server不支持同步手机号区号信息，则需要手工指定区号，才能正确同步手机号信息。否则会因为手机号信息不完整，导致部分云服务使用短信通知相关功能失败</div>
              </a-form-item>
              <a-form-item label="用户手机号码格式">
                <a-select v-model:value="form.phoneFormat" style="width:200px">
                  <a-select-option value="手机号码">手机号码</a-select-option>
                </a-select>
                <a-tooltip title="手机号码的存储格式"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
              </a-form-item>
            </div>
          </div>

          <div class="card-section">
            <div class="card-label">* 同步用户邮箱</div>
            <div class="card-body">
              <a-form-item label="用户邮箱属性名称">
                <a-input v-model:value="form.userEmailAttr" />
                <a-tooltip title="LDAP 中存储邮箱的属性字段名"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
              </a-form-item>
            </div>
          </div>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="data-sync" header="数据同步">
        <a-form layout="vertical">
          <a-form-item label="* 开启同步">
            <a-switch v-model:checked="form.dataSyncEnabled" />
          </a-form-item>

          <div class="sync-mode-grid">
            <div
              v-for="mode in syncModes"
              :key="mode.value"
              class="sync-mode-card"
              :class="{ selected: form.syncMode === mode.value }"
              @click="form.syncMode = mode.value"
            >
              <div class="sync-mode-title">{{ mode.label }}</div>
              <div class="sync-mode-desc">{{ mode.desc }}</div>
            </div>
          </div>

          <a-form-item label="* 目标租户">
            <a-select v-model:value="form.targetTenant" style="width:200px">
              <a-select-option value="租户01">租户01</a-select-option>
              <a-select-option value="租户02">租户02</a-select-option>
            </a-select>
            <a-tooltip title="选择同步数据的目标租户"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="* BindDN">
            <a-input v-model:value="form.bindDn" placeholder="请输入" />
            <a-tooltip title="应用服务器作为'代理人'使用的服务账号，用于发起查询，而非用户本人的账号"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
            <div class="form-hint">应用服务器作为"代理人"使用的服务账号，用于发起查询，而非用户本人的账号</div>
          </a-form-item>
          <a-form-item label="* Bind密码">
            <a-input-password v-model:value="form.bindPassword" placeholder="******" />
            <a-tooltip title="Bind 服务账号的密码"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="* BaseDN">
            <a-input v-model:value="form.baseDn" placeholder="ou=groups,dc=company,dc=com" />
            <a-tooltip title="搜索的基准 DN"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="* 用户属性">
            <a-select v-model:value="form.userAttribute" style="width:200px">
              <a-select-option value="cn">cn</a-select-option>
              <a-select-option value="uid">uid</a-select-option>
              <a-select-option value="sAMAccountName">sAMAccountName</a-select-option>
            </a-select>
            <a-tooltip title="LDAP 用户条目中标识用户名的属性"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="用户组根DN">
            <a-input v-model:value="form.groupRootDn" placeholder="请输入" />
            <a-tooltip title="用户组在 LDAP 目录树中的位置"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="用户组成员属性名称">
            <a-input v-model:value="form.groupMemberAttr" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="用户组描述属性名称">
            <a-input v-model:value="form.groupDescAttr" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="用户组属性">
            <a-select v-model:value="form.groupAttribute" style="width:200px">
              <a-select-option value="cn">cn</a-select-option>
              <a-select-option value="name">name</a-select-option>
            </a-select>
            <a-tooltip title="LDAP 用户组条目中标识组名的属性"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="用户组对象类">
            <a-input v-model:value="form.groupObjectClass" placeholder="groupOfNames" />
            <a-tooltip title="LDAP 用户组条目的对象类"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
          <a-form-item label="查询条件">
            <a-input v-model:value="form.queryFilter" placeholder="objectClass=groupOfNames" />
            <a-tooltip title="LDAP 搜索过滤器"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>

          <div class="section-divider"></div>

          <a-form-item label="* 同步方式">
            <div class="sync-method-group">
              <label class="sync-method-option" :class="{ selected: form.syncMethod === 'periodic' }">
                <input type="radio" v-model="form.syncMethod" value="periodic" />
                <div>
                  <div class="method-title">周期同步</div>
                  <div class="method-desc">每天凌晨00:00进行一次自动进行全量的同步任务</div>
                </div>
              </label>
              <label class="sync-method-option" :class="{ selected: form.syncMethod === 'manual' }">
                <input type="radio" v-model="form.syncMethod" value="manual" />
                <div>
                  <div class="method-title">手动同步</div>
                  <div class="method-desc">需要在"身份提供商"列表的操作列中，点击"立即同步"进行全量同步</div>
                </div>
              </label>
            </div>
            <a-tooltip title="选择数据同步的执行方式"><i class="fa-regular fa-circle-question" style="margin-left:6px;color:var(--text-ter);cursor:help"></i></a-tooltip>
          </a-form-item>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="auto-create" header="登录时创建用户">
        <a-form layout="vertical">
          <a-form-item>
            <a-switch v-model:checked="form.autoCreateUser" />
            <span style="margin-left:8px;font-size:13px;color:var(--text-sec)">开启后，用户首次通过此身份提供商登录时将自动创建本地账号</span>
          </a-form-item>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="advanced" header="高级设置" :force-render="true">
        <a-form layout="vertical">
          <a-form-item label="连接超时（秒）">
            <a-input-number v-model:value="form.connectionTimeout" :min="5" :max="300" style="width:200px" />
          </a-form-item>
          <a-form-item label="分页大小">
            <a-input-number v-model:value="form.pageSize" :min="10" :max="1000" style="width:200px" />
          </a-form-item>
        </a-form>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeKeys = ref(['basic', 'server', 'directory', 'data-sync', 'auto-create'])

const form = reactive({
  name: '',
  status: true,
  description: '',
  mainAddrType: 'IPV4',
  mainAddr: '',
  mainPort: '',
  backupAddrType: 'IPV4',
  backupAddr: '',
  backupPort: '',
  tlsEnabled: true,
  tlsVersion: null,
  mode: 'OpenLDAP',
  userRootDn: '',
  userRootDnPrefix: '',
  userRootDnSuffix: '',
  userObjectClass: '',
  userUniqueId: '',
  syncEnabled: true,
  userNameAttr: '',
  userDescAttr: '',
  userPhoneAttr: 'User Phone Attributes',
  phoneRegion: '通用',
  phoneCode: '+86 (中国大陆)',
  phoneFormat: '手机号码',
  userEmailAttr: 'User Phone Attributes',
  dataSyncEnabled: true,
  syncMode: 'user-and-group',
  targetTenant: '租户01',
  bindDn: '',
  bindPassword: '',
  baseDn: 'ou=groups,dc=company,dc=com',
  userAttribute: 'cn',
  groupRootDn: '',
  groupMemberAttr: '',
  groupDescAttr: '',
  groupAttribute: 'cn',
  groupObjectClass: 'groupOfNames',
  queryFilter: 'objectClass=groupOfNames',
  syncMethod: 'periodic',
  autoCreateUser: false,
  connectionTimeout: 30,
  pageSize: 100,
})

const syncModes = [
  { value: 'user', label: '同步用户', desc: '从LDAP服务器同步用户信息，不同步用户组，即使用户关联了用户组' },
  { value: 'group', label: '同步用户组', desc: '从LDAP服务器同步用户组信息，不同步用户，即使用户组下包含了用户条目' },
  { value: 'user-and-group', label: '同步用户和用户组', desc: '从LDAP服务器同时同步用户组和用户，如果用户组下存在于用户组，将一并同步' },
]

function validate() {
  return true
}

defineExpose({ form, validate })
</script>

<style scoped>
.ldap-form { margin-top: -8px; }
.ldap-form :deep(.ant-collapse) { background: transparent; }
.ldap-form :deep(.ant-collapse-header) { font-weight: 600; font-size: 14px; padding-left: 0 !important; }
.ldap-form :deep(.ant-collapse-content-box) { padding-left: 0 !important; }
.ldap-form :deep(.ant-collapse-item) { border-bottom: 1px solid var(--border); }
.icon-upload-area { display: flex; flex-direction: column; gap: 8px; }
.icon-preview { width: 60px; height: 60px; border-radius: 8px; background: var(--brand-subtle); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--brand); }
.icon-actions { display: flex; gap: 8px; }
.icon-tips { font-size: 11px; color: var(--text-ter); line-height: 1.6; }
.icon-tips p { margin: 0; }
.form-hint { font-size: 11px; color: var(--text-ter); margin-top: 4px; line-height: 1.5; }
.card-section { border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin-bottom: 16px; background: var(--bg); }
.card-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.card-body .ant-form-item { margin-bottom: 12px; }
.sync-mode-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.sync-mode-card { border: 1px solid var(--border); border-radius: 6px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.sync-mode-card:hover { border-color: var(--brand); }
.sync-mode-card.selected { border-color: var(--brand); background: var(--brand-subtle); }
.sync-mode-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.sync-mode-desc { font-size: 11px; color: var(--text-sec); line-height: 1.5; }
.section-divider { height: 1px; background: var(--border); margin: 16px 0; }
.sync-method-group { display: flex; flex-direction: column; gap: 8px; }
.sync-method-option { display: flex; align-items: flex-start; gap: 8px; padding: 12px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.sync-method-option:hover { border-color: var(--brand); }
.sync-method-option.selected { border-color: var(--brand); background: var(--brand-subtle); }
.sync-method-option input[type="radio"] { margin-top: 3px; }
.method-title { font-size: 13px; font-weight: 600; color: var(--text); }
.method-desc { font-size: 11px; color: var(--text-sec); margin-top: 2px; }
</style>
