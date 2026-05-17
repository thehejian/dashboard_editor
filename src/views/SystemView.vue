<template>
  <div class="system-view">
    <div class="view-header">
      <h1>系统管理</h1>
    </div>

    <div class="system-tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        <i class="fa-solid fa-users"></i> 用户权限
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'config' }" @click="activeTab = 'config'">
        <i class="fa-solid fa-gear"></i> 系统配置
      </button>
    </div>

    <!-- 用户权限 -->
    <div class="tab-content" v-if="activeTab === 'users'">
      <div class="section-header">
        <a-button type="primary" @click="showUserModal">
          <i class="fa-solid fa-plus"></i> 新增用户
        </a-button>
      </div>

      <a-tabs v-model:activeKey="usersSubTab" type="card">
        <a-tab-pane key="users" tab="用户列表">
          <a-table :columns="userColumns" :data-source="users" :pagination="{ pageSize: 10 }" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-switch v-model:checked="record.enabled" @change="toggleUser(record.id)" />
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="editUser(record)">编辑</a-button>
                <a-button type="link" size="small" danger @click="deleteUser(record.id)">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="roles" tab="角色管理">
          <div class="role-list">
            <div class="role-item" v-for="role in roles" :key="role.id">
              <div class="role-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-desc">{{ role.description }}</div>
                <div class="role-users">{{ role.userCount }} 个用户</div>
              </div>
              <div class="role-actions">
                <a-button size="small" @click="editRole(role)">配置权限</a-button>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 系统配置 -->
    <div class="tab-content" v-if="activeTab === 'config'">
      <div class="config-section">
        <h3>通知配置</h3>
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="邮件通知">
                <a-switch v-model:checked="notifyConfig.email" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="短信通知">
                <a-switch v-model:checked="notifyConfig.sms" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="企业微信">
                <a-switch v-model:checked="notifyConfig.wechat" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="钉钉通知">
                <a-switch v-model:checked="notifyConfig.dingtalk" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="config-section">
        <h3>系统参数</h3>
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="会话超时时间">
                <a-input-number v-model:value="systemConfig.sessionTimeout" :min="5" :max="1440" style="width: 100%" />
                <span class="form-help">分钟</span>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="密码最小长度">
                <a-input-number v-model:value="systemConfig.passwordMinLength" :min="6" :max="32" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="日志保留天数">
                <a-input-number v-model:value="systemConfig.logRetention" :min="7" :max="365" style="width: 100%" />
                <span class="form-help">天</span>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="API请求限制">
                <a-input-number v-model:value="systemConfig.apiRateLimit" :min="100" :max="10000" style="width: 100%" />
                <span class="form-help">次/分钟</span>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item>
            <a-button type="primary" @click="saveConfig">保存配置</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- 用户弹窗 -->
    <a-modal v-model:open="userModalVisible" :title="editingUser ? '编辑用户' : '新增用户'" @ok="saveUser" :confirmLoading="saving">
      <a-form :model="userForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="userForm.username" placeholder="请输入用户名" :disabled="!!editingUser" />
        </a-form-item>
        <a-form-item label="姓名">
          <a-input v-model:value="userForm.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="userForm.roleId" placeholder="选择角色">
            <a-select-option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const activeTab = ref('users')
const usersSubTab = ref('users')
const userModalVisible = ref(false)
const editingUser = ref(null)
const saving = ref(false)

const notifyConfig = reactive({ email: true, sms: false, wechat: true, dingtalk: false })
const systemConfig = reactive({ sessionTimeout: 30, passwordMinLength: 8, logRetention: 30, apiRateLimit: 1000 })

const users = ref([
  { id: 1, username: 'admin', name: '管理员', email: 'admin@company.com', phone: '13800138000', role: '超级管理员', enabled: true },
  { id: 2, username: 'ops1', name: '运维人员', email: 'ops1@company.com', phone: '13800138001', role: '运维', enabled: true },
  { id: 3, username: 'dev1', name: '开发人员', email: 'dev1@company.com', phone: '13800138002', role: '开发', enabled: true },
  { id: 4, username: 'viewer', name: '查看人员', email: 'viewer@company.com', phone: '13800138003', role: '只读', enabled: false },
])

const roles = ref([
  { id: 1, name: '超级管理员', description: '拥有所有系统权限', userCount: 1 },
  { id: 2, name: '运维', description: '运维管理权限', userCount: 3 },
  { id: 3, name: '开发', description: '开发查看权限', userCount: 5 },
  { id: 4, name: '只读', description: '仅查看权限', userCount: 10 },
])

const userForm = reactive({ username: '', name: '', email: '', phone: '', roleId: null })
const userColumns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '姓名', dataIndex: 'name' },
  { title: '邮箱', dataIndex: 'email' },
  { title: '角色', dataIndex: 'role' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action', width: 150 },
]

const showUserModal = () => { editingUser.value = null; Object.assign(userForm, { username: '', name: '', email: '', phone: '', roleId: null }); userModalVisible.value = true }
const editUser = (user) => { editingUser.value = user; Object.assign(userForm, user); userModalVisible.value = true }
const saveUser = () => { saving.value = true; setTimeout(() => { if (editingUser.value) { const idx = users.value.findIndex(u => u.id === editingUser.value.id); if (idx > -1) users.value[idx] = { ...users.value[idx], ...userForm } } else { users.value.push({ ...userForm, id: Date.now(), role: roles.value.find(r => r.id === userForm.roleId)?.name || '', enabled: true }) } saving.value = false; userModalVisible.value = false }, 500) }
const deleteUser = (id) => { users.value = users.value.filter(u => u.id !== id) }
const toggleUser = (id) => {}
const editRole = (role) => {}
const saveConfig = () => {}
</script>

<style scoped>
.system-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.view-header { margin-bottom: 20px; }
.view-header h1 { font-size: 24px; font-weight: 600; margin: 0; }

.system-tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
.tab-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: none; background: transparent; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-radius: 6px; }
.tab-btn:hover { background: var(--bg-sec); color: var(--text); }
.tab-btn.active { background: var(--brand-subtle); color: var(--brand); font-weight: 500; }
.section-header { margin-bottom: 16px; }

.role-list { display: flex; flex-direction: column; gap: 12px; }
.role-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.role-name { font-weight: 500; margin-bottom: 4px; }
.role-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.role-users { font-size: 12px; color: var(--text-ter); }

.config-section { background: var(--bg-card); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.config-section h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
.form-help { margin-left: 8px; font-size: 12px; color: var(--text-secondary); }
</style>