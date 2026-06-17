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
import { ref, onMounted } from 'vue'

const activeKey = ref('users')
const users = ref([])
const roles = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [usersRes, rolesRes] = await Promise.all([
      fetch('/api/cmdb/users?sort=id&order=ASC'),
      fetch('/api/cmdb/roles?sort=id&order=ASC'),
    ])
    const usersJson = await usersRes.json()
    const rolesJson = await rolesRes.json()
    if (usersJson.success) {
      users.value = usersJson.data.map(function(item) {
        return {
          id: item.id,
          username: item.username,
          name: item.name,
          email: item.email,
          role: item.role,
          enabled: item.enabled,
        }
      })
    }
    if (rolesJson.success) {
      roles.value = rolesJson.data.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          userCount: item.user_count,
        }
      })
    }
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    loading.value = false
  }
})
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