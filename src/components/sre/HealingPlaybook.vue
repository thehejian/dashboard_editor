<template>
  <div class="healing-playbook">
    <div class="hp-header">
      <h3 class="hp-title"><i class="fa-solid fa-robot"></i> 故障自愈编排与操作集 (Playbook)</h3>
      <p class="hp-desc">以下方案由智能运维引擎生成。您可以配置手动测试（单步 Run Action）或让 Agent 托管。</p>
    </div>

    <div class="hp-agent-bar">
      <div class="hp-agent-top">
        <div class="hp-agent-badge" :class="'agent-' + playbook.agentStatus">
          <i class="fa-solid fa-circle-check"></i>
          <span>AI 托管自愈自恢复</span>
        </div>
        <button class="hp-ai-btn" @click="$emit('ai-auto-execute')"><i class="fa-solid fa-bolt"></i> AI自动执行</button>
      </div>
      <div class="hp-agent-sub">全场景流水线、自愈结果自动校验</div>
    </div>

    <div class="hp-steps">
      <div v-for="(step, i) in playbook.steps" :key="step.id" class="hp-step" :class="'step-' + step.status">
        <div class="hp-step-header">
          <span class="hp-step-num">{{ i + 1 }}</span>
          <div class="hp-step-info">
            <div class="hp-step-name">
              <span class="hp-step-name-cn"><span v-if="appName" class="hp-step-app">[{{ appName }}]</span>{{ step.name }}</span>
              <span class="hp-step-name-en">({{ step.nameEn }})</span>
            </div>
            <div class="hp-step-config">{{ step.config }}</div>
          </div>
          <span class="hp-step-status" :class="'status-' + step.status">
            <template v-if="step.status === 'running'"><i class="fa-solid fa-spinner fa-spin"></i> Agent 执行中</template>
            <template v-else>
              <button class="hp-run-btn" @click="$emit('execute-step', i)"><i class="fa-solid fa-play"></i> 执行</button>
            </template>
          </span>
        </div>
        <div class="hp-step-desc">{{ step.description }}</div>
        <div v-if="step.logs.length" class="hp-step-logs">
          <div v-for="(log, li) in step.logs" :key="li" class="hp-log-line">
            <span class="hp-log-tag" :class="step.status === 'running' ? 'tag-process' : 'tag-info'">
              {{ step.status === 'running' ? '[PROCESS]' : '[INFO]' }}
            </span>
            <span class="hp-log-time">{{ log.time }}</span>
            <span class="hp-log-msg">{{ log.message }}</span>
          </div>
        </div>
        <div v-if="step.status === 'running' && step.progress > 0" class="hp-step-progress">
          <a-progress :percent="step.progress" size="small" :stroke-color="'#722ED1'" />
        </div>
      </div>
    </div>

    <div class="hp-footer">
      <div class="hp-validation">
        <span>预案完整程度校验: {{ playbook.validation.completedSteps }}/{{ playbook.validation.totalSteps }}</span>
        <span class="hp-val-sep">|</span>
        <span>状态码 200 水平: <b :class="playbook.validation.http200Status === '已恢复' ? 'val-ok' : 'val-warn'">{{ playbook.validation.http200Status }}</b></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  playbook: { type: Object, required: true },
  appName: { type: String, default: '' },
})

defineEmits(['execute-step', 'ai-auto-execute'])
</script>

<style scoped>
.healing-playbook {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.hp-header { padding: 12px 12px 0; }
.hp-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin: 0; }
.hp-title i { color: #722ED1; margin-right: 4px; }
.hp-desc { font-size: 11px; color: #8c8c8c; margin: 3px 0 0; }
.hp-agent-bar {
  margin: 8px 12px;
  padding: 8px 12px;
  background: #f9f0ff;
  border: 1px solid #d3adf7;
  border-radius: 8px;
}
.hp-agent-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hp-agent-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}
.agent-executing { color: #722ED1; }
.agent-completed { color: #52c41a; }
.hp-agent-sub { font-size: 10px; color: #8c8c8c; margin-top: 2px; }
.hp-ai-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid #722ED1;
  background: #722ED1;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.hp-ai-btn:hover { background: #9254de; }
.hp-steps { flex: 1; overflow-y: auto; padding: 0 12px; }
.hp-step {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 5px;
  transition: border-color 0.2s;
}
.hp-step.step-running { border-color: #722ED1; background: #faf5ff; }
.hp-step.step-success { border-color: #52c41a; }
.hp-step-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.hp-step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}
.step-running .hp-step-num { background: #722ED1; color: #fff; }
.step-success .hp-step-num { background: #52c41a; color: #fff; }
.hp-step-info { flex: 1; min-width: 0; }
.hp-step-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
.hp-step-app { font-size: 11px; color: #1890ff; font-weight: 500; margin-right: 4px; }
.hp-step-name-en { font-size: 11px; color: #8c8c8c; font-weight: 400; margin-left: 3px; }
.hp-step-config { font-size: 11px; color: #8c8c8c; margin-top: 1px; }
.hp-step-status { flex-shrink: 0; font-size: 11px; }
.status-running { color: #722ED1; font-weight: 500; }
.status-success { color: #52c41a; font-size: 11px; }
.status-pending { color: #8c8c8c; }
.hp-run-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid #722ED1;
  background: #fff;
  color: #722ED1;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}
.hp-run-btn:hover { background: #f9f0ff; }
.hp-run-btn i { font-size: 9px; }
.hp-step-desc { font-size: 12px; color: #666; margin: 3px 0 0 30px; line-height: 1.4; }
.hp-step-logs {
  margin: 4px 0 0 30px;
  padding: 4px 6px;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.5;
}
.hp-log-line { display: flex; gap: 8px; }
.hp-log-tag { font-weight: 600; flex-shrink: 0; }
.tag-process { color: #722ED1; }
.tag-info { color: #1890ff; }
.hp-log-time { color: #8c8c8c; flex-shrink: 0; }
.hp-log-msg { color: #333; }
.hp-step-progress { margin: 4px 0 0 30px; }
.hp-footer {
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.hp-validation {
  font-size: 12px;
  color: #666;
}
.hp-val-sep { margin: 0 8px; color: #d9d9d9; }
.val-ok { color: #52c41a; font-weight: 600; }
.val-warn { color: #FF7D00; font-weight: 600; }

@media (max-width: 768px) {
  .healing-playbook { border: none; border-radius: 0; }
  .hp-header { padding: 8px 10px 0; }
  .hp-title { font-size: 12px; }
  .hp-desc { font-size: 10px; }
  .hp-agent-bar { margin: 6px 8px; padding: 6px 8px; }
  .hp-agent-badge { font-size: 11px; }
  .hp-ai-btn { font-size: 10px; padding: 2px 8px; }
  .hp-steps { padding: 0 8px; }
  .hp-step { padding: 6px 8px; margin-bottom: 4px; }
  .hp-step-name { font-size: 12px; }
  .hp-step-name-en { font-size: 10px; }
  .hp-step-desc { font-size: 11px; margin-left: 28px; }
  .hp-step-logs { margin-left: 28px; font-size: 10px; padding: 3px 5px; }
  .hp-step-num { width: 20px; height: 20px; font-size: 11px; }
  .hp-run-btn { font-size: 10px; padding: 1px 6px; }
  .hp-footer { padding: 6px 8px; }
  .hp-validation { font-size: 11px; }
}
</style>
