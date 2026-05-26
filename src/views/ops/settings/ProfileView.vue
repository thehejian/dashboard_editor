<template>
  <div>
    <div class="page-header"><h3>个人设置</h3></div>
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-large">A</div>
        <div class="profile-info">
          <div class="profile-name">管理员</div>
          <div class="profile-email">admin@company.com</div>
        </div>
      </div>
      <a-form layout="vertical" class="profile-form">
        <a-form-item label="姓名">
          <a-input v-model:value="form.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="form.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="form.phone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="部门">
          <a-input v-model:value="form.department" placeholder="请输入部门" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary">保存</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  name: '管理员',
  email: 'admin@company.com',
  phone: '13800138000',
  department: '运维部',
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--text); }
.profile-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}
.profile-name { font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.profile-email { font-size: 13px; color: #8c8c8c; }
.profile-form { max-width: 400px; }
:deep(.ant-form-item-label > label) { font-weight: 500; color: var(--text); }
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .page-header h3 { font-size: 16px; }
  .profile-card { padding: 16px; }
}
</style>