<template>
  <div class="page-view">
    <div class="page-header"><h2>系统配置</h2></div>
    <div class="config-section">
      <h3>通知配置</h3>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item label="邮件通知"><a-switch v-model:checked="notify.email" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="短信通知"><a-switch v-model:checked="notify.sms" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="企业微信"><a-switch v-model:checked="notify.wechat" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="钉钉通知"><a-switch v-model:checked="notify.dingtalk" /></a-form-item></a-col>
        </a-row>
      </a-form>
    </div>
    <div class="config-section">
      <h3>系统参数</h3>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item label="会话超时时间"><a-input-number v-model:value="system.sessionTimeout" :min="5" :max="1440" style="width: 100%" /><span class="help">分钟</span></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="密码最小长度"><a-input-number v-model:value="system.passwordMinLength" :min="6" :max="32" style="width: 100%" /></a-form-item></a-col>
        </a-row>
        <a-button type="primary">保存配置</a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const notify = reactive({ email: true, sms: false, wechat: true, dingtalk: false })
const system = reactive({ sessionTimeout: 30, passwordMinLength: 8 })
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.config-section { background: var(--bg-card); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.config-section h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
.help { margin-left: 8px; font-size: 12px; color: var(--text-secondary); }

@media (max-width: 768px) {
  .page-view { padding: 16px; }
  .config-section { padding: 16px; }
}
</style>