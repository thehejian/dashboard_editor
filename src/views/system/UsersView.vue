<template>
  <div class="page-view">
    <div class="page-header">
      <h2>用户权限</h2>
      <a-button type="primary">新增用户</a-button>
    </div>
    <a-tabs v-model:activeKey="activeKey" type="card">
      <a-tab-pane key="users" tab="用户列表">
        <a-table :columns="columns" :data-source="users" :pagination="{ pageSize: 10 }" row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'"><a-switch v-model:checked="record.enabled" /></template>
            <template v-if="column.key === 'action'"><a-button type="link" size="small">编辑</a-button></template>
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
            <a-button size="small">配置权限</a-button>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeKey = ref('users')
const users = ref([
  { id: 1, username: 'admin', name: '管理员', email: 'admin@company.com', role: '超级管理员', enabled: true },
  { id: 2, username: 'ops1', name: '运维人员', email: 'ops1@company.com', role: '运维', enabled: true },
])
const roles = ref([
  { id: 1, name: '超级管理员', description: '拥有所有系统权限', userCount: 1 },
  { id: 2, name: '运维', description: '运维管理权限', userCount: 3 },
])
const columns = [
  { title: '用户名', dataIndex: 'username' }, { title: '姓名', dataIndex: 'name' },
  { title: '邮箱', dataIndex: 'email' }, { title: '角色', dataIndex: 'role' },
  { title: '状态', key: 'status' }, { title: '操作', key: 'action' },
]
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.role-list { display: flex; flex-direction: column; gap: 12px; }
.role-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.role-name { font-weight: 500; margin-bottom: 4px; }
.role-desc { font-size: 12px; color: var(--text-secondary); }
.role-users { font-size: 11px; color: var(--text-ter); }
</style>