<template>
  <div class="page-view">
    <div class="page-header">
      <h2>自动作业</h2>
      <a-button type="primary">新建任务</a-button>
    </div>
    <a-tabs v-model:activeKey="activeKey" type="card">
      <a-tab-pane key="running" tab="执行中">
        <div class="job-list">
          <div class="job-item" v-for="job in runningJobs" :key="job.id">
            <div class="job-icon"><i class="fa-solid fa-spinner fa-spin"></i></div>
            <div class="job-content">
              <div class="job-name">{{ job.name }}</div>
              <a-progress :percent="job.progress" size="small" style="width: 200px" />
              <div class="job-meta">目标: {{ job.target }}</div>
            </div>
            <a-button size="small" danger @click="stopJob(job.id)">停止</a-button>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="history" tab="执行历史">
        <a-table :columns="columns" :data-source="jobHistory" :pagination="{ pageSize: 8 }" row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'"><a-tag :color="record.status === 'success' ? 'green' : 'red'">{{ record.status === 'success' ? '成功' : '失败' }}</a-tag></template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const activeKey = ref('running')
const runningJobs = ref([{ id: 1, name: '批量更新安全组规则', target: '华东区域', progress: 65 }])
const jobHistory = ref([{ id: 101, name: '日志清理任务', startTime: '2026-05-17 10:00', endTime: '10:05', status: 'success' }])
const columns = [{ title: '任务名称', dataIndex: 'name' }, { title: '开始', dataIndex: 'startTime' }, { title: '结束', dataIndex: 'endTime' }, { title: '状态', key: 'status' }]
const stopJob = (id) => { runningJobs.value = runningJobs.value.filter(j => j.id !== id) }
</script>

<style scoped>
.page-view { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.job-list { display: flex; flex-direction: column; gap: 12px; }
.job-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-card); border-radius: 8px; }
.job-icon { font-size: 24px; color: var(--brand); }
.job-content { flex: 1; }
.job-name { font-weight: 500; margin-bottom: 8px; }
.job-meta { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
</style>