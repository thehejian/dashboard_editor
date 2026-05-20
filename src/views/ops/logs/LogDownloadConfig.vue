<template>
  <div>
    <div class="page-header">
      <h3>日志下载配置</h3>
      <a-button type="primary">保存</a-button>
    </div>
    <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }" style="max-width: 720px">
      <a-form-item label="下载留存天数">
        <a-input-number v-model:value="form.retentionDays" :min="1" :max="90" style="width: 120px" /> 天
      </a-form-item>
      <a-form-item label="单文件最大大小">
        <a-select v-model:value="form.maxFileSize" style="width: 200px">
          <a-select-option value="100">100 MB</a-select-option>
          <a-select-option value="500">500 MB</a-select-option>
          <a-select-option value="1024">1 GB</a-select-option>
          <a-select-option value="5120">5 GB</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="默认导出格式">
        <a-radio-group v-model:value="form.defaultFormat">
          <a-radio value="txt">TXT</a-radio>
          <a-radio value="csv">CSV</a-radio>
          <a-radio value="json">JSON</a-radio>
          <a-radio value="gz">GZip</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="压缩方式">
        <a-select v-model:value="form.compression" style="width: 200px">
          <a-select-option value="none">不压缩</a-select-option>
          <a-select-option value="gzip">GZip</a-select-option>
          <a-select-option value="zip">ZIP</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="包含字段">
        <a-checkbox-group v-model:value="form.fields">
          <a-checkbox value="timestamp">时间戳</a-checkbox>
          <a-checkbox value="level">级别</a-checkbox>
          <a-checkbox value="source">来源</a-checkbox>
          <a-checkbox value="message">内容</a-checkbox>
          <a-checkbox value="instance">实例</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item label="最大并发下载数">
        <a-input-number v-model:value="form.maxConcurrent" :min="1" :max="20" style="width: 120px" />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const form = ref({
  retentionDays: 7,
  maxFileSize: '500',
  defaultFormat: 'csv',
  compression: 'gzip',
  fields: ['timestamp', 'level', 'source', 'message'],
  maxConcurrent: 5,
})
</script>
