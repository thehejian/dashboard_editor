<template>
  <div class="ldap-form">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false" expand-icon-position="end">
      <a-collapse-panel key="basic" header="基本信息">
        <a-form layout="vertical">
          <a-form-item label="图标">
            <div class="icon-upload-area">
              <div class="icon-preview">
                <i class="fa-solid fa-building"></i>
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
          <a-form-item label="名称" required>
            <a-input v-model:value="form.name" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="状态" required>
            <a-switch v-model:checked="form.status" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="form.description" placeholder="请输入" :maxlength="1000" :show-count="true" />
          </a-form-item>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="server" header="服务器信息">
        <a-form layout="vertical">
          <a-form-item label="主服务器IP地址类型" required>
            <a-radio-group v-model:value="form.mainAddrType" button-style="solid" size="small">
              <a-radio-button value="IPV4">IPV4</a-radio-button>
              <a-radio-button value="IPV6">IPV6</a-radio-button>
              <a-radio-button value="DOMAIN">域名</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="主服务器地址" required>
            <a-input v-model:value="form.mainAddr" placeholder="· · ·" />
          </a-form-item>
          <a-form-item label="主服务器端口" required>
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
          <a-form-item label="启用TLS" required>
            <a-switch v-model:checked="form.tlsEnabled" />
          </a-form-item>
          <a-form-item required>
            <template #label>
              TLS版本
              <a-tooltip title="选择 TLS 协议版本，建议使用 TLSv1.3"><i class="fa-regular fa-circle-question" style="margin-left:4px;color:var(--text-ter);cursor:help"></i></a-tooltip>
            </template>
            <a-select v-model:value="form.tlsVersion" placeholder="请选择" style="width:200px">
              <a-select-option value="TLSv1.2">TLSv1.2</a-select-option>
              <a-select-option value="TLSv1.3">TLSv1.3</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="证书" required>
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
          <a-form-item label="根DN" required>
            <a-input v-model:value="form.userRootDn" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="根DN前缀" required>
            <a-input v-model:value="form.userRootDnPrefix" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="根DN后缀" required>
            <a-input v-model:value="form.userRootDnSuffix" placeholder="请输入" />
          </a-form-item>
          <a-form-item label="用户对象类名" required>
            <a-input v-model:value="form.userObjectClass" placeholder="请输入" />
          </a-form-item>
          <a-form-item required>
            <template #label>
              用户名属性
              <a-tooltip title="用于唯一标识用户的属性，如 uid 或 cn"><i class="fa-regular fa-circle-question" style="margin-left:4px;color:var(--text-ter);cursor:help"></i></a-tooltip>
            </template>
            <a-input v-model:value="form.userUniqueId" placeholder="请输入" />
          </a-form-item>

          <a-form-item label="同步用户名属性">
            <a-switch v-model:checked="form.syncNameEnabled" />
          </a-form-item>
          <template v-if="form.syncNameEnabled">
            <div class="card-section">
              <div class="card-body">
                <a-form-item label="用户显示名属性">
                  <a-input v-model:value="form.userNameAttr" placeholder="请输入" />
                </a-form-item>
                <a-form-item label="用户描述属性">
                  <a-input v-model:value="form.userDescAttr" placeholder="请输入" />
                </a-form-item>
              </div>
            </div>
          </template>

          <a-form-item label="同步用户手机">
            <a-switch v-model:checked="form.syncPhoneEnabled" />
          </a-form-item>
          <template v-if="form.syncPhoneEnabled">
            <div class="card-section">
              <div class="card-body">
                <a-form-item>
                  <template #label>
                    用户手机属性
                    <a-tooltip title="LDAP 中存储手机号的属性字段名"><i class="fa-regular fa-circle-question" style="margin-left:4px;color:var(--text-ter);cursor:help"></i></a-tooltip>
                  </template>
                  <a-input v-model:value="form.userPhoneAttr" />
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
                <a-form-item>
                  <template #label>
                    用户手机号码格式
                    <a-tooltip title="手机号码的存储格式"><i class="fa-regular fa-circle-question" style="margin-left:4px;color:var(--text-ter);cursor:help"></i></a-tooltip>
                  </template>
                  <a-select v-model:value="form.phoneFormat" style="width:200px">
                    <a-select-option value="手机号码">手机号码</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
            </div>
          </template>

          <a-form-item label="同步用户邮箱">
            <a-switch v-model:checked="form.syncEmailEnabled" />
          </a-form-item>
          <template v-if="form.syncEmailEnabled">
            <div class="card-section">
              <div class="card-body">
                <a-form-item>
                  <template #label>
                    用户邮箱属性名称
                    <a-tooltip title="LDAP 中存储邮箱的属性字段名"><i class="fa-regular fa-circle-question" style="margin-left:4px;color:var(--text-ter);cursor:help"></i></a-tooltip>
                  </template>
                  <a-input v-model:value="form.userEmailAttr" />
                </a-form-item>
              </div>
            </div>
          </template>
        </a-form>
      </a-collapse-panel>

      <a-collapse-panel key="data-sync" header="数据同步">
        <a-form layout="vertical">
          <a-form-item label="同步用户">
            <a-switch v-model:checked="form.dataSyncUsers" />
          </a-form-item>
          <a-form-item label="同步用户组">
            <a-switch v-model:checked="form.dataSyncGroups" />
          </a-form-item>

          <template v-if="form.dataSyncUsers || form.dataSyncGroups">
            <div style="font-size:12px;color:var(--text-sec);margin-bottom:16px;line-height:1.6">
              开启同步后，每天凌晨00:00自动进行同步。也可以在身份提供商操作列中随时进行同步操作。
            </div>

            <div class="card-section">
              <div class="card-body">
                <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px">公共配置</div>
                <a-form-item label="所属租户" required>
                  <a-select v-model:value="form.targetTenant" style="width:200px">
                    <a-select-option value="租户01">租户01</a-select-option>
                    <a-select-option value="租户02">租户02</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="服务账号" required>
                  <a-input v-model:value="form.bindDn" placeholder="请输入" />
                </a-form-item>
                <a-form-item label="服务密码" required>
                  <a-input-password v-model:value="form.bindPassword" placeholder="******" />
                </a-form-item>
              </div>
            </div>

            <template v-if="form.dataSyncUsers">
              <div class="card-section">
                <div class="card-body">
                  <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px">同步用户配置</div>
                  <a-form-item label="所属用户组名属性">
                    <a-input v-model:value="form.userGroupNameAttr" placeholder="请输入" />
                  </a-form-item>
                  <a-form-item label="查询条件">
                    <a-input v-model:value="form.queryFilter" placeholder="objectClass=..." />
                  </a-form-item>
                </div>
              </div>
            </template>

            <template v-if="form.dataSyncGroups">
              <div class="card-section">
                <div class="card-body">
                  <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px">同步用户组配置</div>
                  <a-form-item label="用户组名属性" required>
                    <a-select v-model:value="form.groupAttribute" style="width:200px">
                      <a-select-option value="cn">cn</a-select-option>
                      <a-select-option value="name">name</a-select-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="用户组成员属性">
                    <a-input v-model:value="form.groupMemberAttr" placeholder="请输入" />
                  </a-form-item>
                  <a-form-item label="用户组描述属性">
                    <a-input v-model:value="form.groupDescAttr" placeholder="请输入" />
                  </a-form-item>
                  <a-form-item label="用户组对象类型" required>
                    <a-input v-model:value="form.groupObjectClass" placeholder="groupOfNames" />
                  </a-form-item>
                  <a-form-item label="查询条件">
                    <a-input v-model:value="form.queryFilter" placeholder="objectClass=..." />
                  </a-form-item>
                </div>
              </div>
            </template>
          </template>
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
          <a-form-item label="支持本地认证方式" required>
            <a-switch v-model:checked="form.localAuth" />
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
  syncNameEnabled: false,
  userNameAttr: '',
  userDescAttr: '',
  syncPhoneEnabled: false,
  userPhoneAttr: 'User Phone Attributes',
  phoneRegion: '通用',
  phoneCode: '+86 (中国大陆)',
  phoneFormat: '手机号码',
  syncEmailEnabled: false,
  userEmailAttr: 'User Phone Attributes',
  dataSyncUsers: false,
  dataSyncGroups: false,
  targetTenant: '租户01',
  bindDn: '',
  bindPassword: '',
  baseDn: 'ou=groups,dc=company,dc=com',
  userGroupNameAttr: '',
  groupMemberAttr: '',
  groupDescAttr: '',
  groupAttribute: 'cn',
  groupObjectClass: 'groupOfNames',
  queryFilter: 'objectClass=groupOfNames',
  autoCreateUser: false,
  localAuth: false,
})

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
.ldap-form :deep(.ant-form-item) { margin-bottom: 20px; }
.icon-upload-area { display: flex; flex-direction: column; gap: 8px; }
.icon-preview { width: 60px; height: 60px; border-radius: 8px; background: var(--brand-subtle); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--brand); }
.icon-actions { display: flex; gap: 8px; }
.icon-tips { font-size: 11px; color: var(--text-ter); line-height: 1.6; }
.icon-tips p { margin: 0; }
.form-hint { font-size: 11px; color: var(--text-ter); margin-top: 4px; line-height: 1.5; }
.card-section { border: 1px solid var(--border); border-radius: 6px; padding: 16px; margin-bottom: 16px; background: var(--bg); }
.card-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
:deep(.card-body .ant-form-item) { margin-bottom: 12px; }
.section-divider { height: 1px; background: var(--border); margin: 16px 0; }
</style>

<style>
.ant-form-item-required::before { color: #ff4d4f !important; }
.required-mark { color: #ff4d4f; }
</style>
