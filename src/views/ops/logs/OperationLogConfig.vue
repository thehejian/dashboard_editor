<template>
  <div>
    <div class="page-header">
      <h3>操作日志参数配置</h3>
      <a-button type="primary">保存</a-button>
    </div>
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }" style="max-width: 720px">
      <a-form-item label="日志留存周期">
        <a-select v-model:value="form.retention" style="width: 200px">
          <a-select-option value="7">7 天</a-select-option>
          <a-select-option value="30">30 天</a-select-option>
          <a-select-option value="90">90 天</a-select-option>
          <a-select-option value="180">180 天</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="采集日志等级">
        <a-checkbox-group v-model:value="form.levels">
          <a-checkbox value="info">INFO</a-checkbox>
          <a-checkbox value="warn">WARN</a-checkbox>
          <a-checkbox value="error">ERROR</a-checkbox>
          <a-checkbox value="critical">CRITICAL</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item label="告警阈值">
        <a-input-number v-model:value="form.alertThreshold" :min="1" :max="1000" style="width: 120px" /> 条/分钟
      </a-form-item>
      <a-form-item label="事件通知">
        <a-switch v-model:checked="form.notify" />
      </a-form-item>
      <a-form-item label="通知方式" v-if="form.notify">
        <a-checkbox-group v-model:value="form.notifyChannels">
          <a-checkbox value="sms">短信</a-checkbox>
          <a-checkbox value="email">邮件</a-checkbox>
          <a-checkbox value="webhook">Webhook</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const form = ref({
  retention: '30',
  levels: ['info', 'warn', 'error'],
  alertThreshold: 100,
  notify: true,
  notifyChannels: ['email'],
})
</script>
