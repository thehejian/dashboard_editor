<template>
  <div class="postmortem-report">
    <div class="pmr-header">
      <h2 class="pmr-title">POSTMORTEM REPORT</h2>
      <h3 class="pmr-subtitle">{{ report.title }}</h3>
      <div class="pmr-actions">
        <a-button size="small" @click="copyMarkdown"><i class="fa-solid fa-download"></i> 下载分析报告</a-button>
        <a-button size="small" @click="$emit('back')"><i class="fa-solid fa-arrow-left"></i> 返回故障终端</a-button>
      </div>
    </div>
    <div class="pmr-body">
      <div class="pmr-content" v-html="renderedMarkdown"></div>
    </div>
    <div class="pmr-footer">
      <span>报告编制：{{ report.author }}</span>
      <span>{{ report.status }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  report: { type: Object, required: true },
})

defineEmits(['back'])

const renderedMarkdown = computed(() => {
  if (!props.report.markdown) return ''
  return simpleMarkdownToHtml(props.report.markdown)
})

function simpleMarkdownToHtml(md) {
  let html = md
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n{2,}/g, '</p><p>')
  return '<p>' + html + '</p>'
}

function copyMarkdown() {
  navigator.clipboard.writeText(props.report.markdown).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败')
  })
}
</script>

<style scoped>
.postmortem-report {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}
.pmr-header {
  text-align: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.pmr-title {
  font-size: 13px;
  font-weight: 600;
  color: #8c8c8c;
  letter-spacing: 2px;
  margin: 0;
}
.pmr-subtitle {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 6px 0 12px;
}
.pmr-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.pmr-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}
.pmr-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  width: 100%;
}
.pmr-content :deep(h2) { font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 24px 0 12px; }
.pmr-content :deep(h3) { font-size: 17px; font-weight: 600; color: #1a1a1a; margin: 20px 0 10px; }
.pmr-content :deep(h4) { font-size: 15px; font-weight: 600; color: #333; margin: 16px 0 8px; }
.pmr-content :deep(b) { font-weight: 600; color: #1a1a1a; }
.pmr-content :deep(code) {
  background: #f5f5f5;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 13px;
  font-family: 'SF Mono', monospace;
  color: #d4380d;
}
.pmr-content :deep(hr) { border: none; border-top: 1px solid #f0f0f0; margin: 16px 0; }
.pmr-content :deep(ul) { padding-left: 20px; margin: 8px 0; }
.pmr-content :deep(li) { margin-bottom: 4px; }
.pmr-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}
.pmr-content :deep(th),
.pmr-content :deep(td) {
  border: 1px solid #f0f0f0;
  padding: 8px 12px;
  text-align: left;
}
.pmr-content :deep(th) { background: #fafafa; font-weight: 600; }
.pmr-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #8c8c8c;
}

@media (max-width: 768px) {
  .postmortem-report { border: none; border-radius: 0; }
  .pmr-header { padding: 12px 12px 10px; }
  .pmr-title { font-size: 11px; letter-spacing: 1px; }
  .pmr-subtitle { font-size: 15px; margin: 4px 0 8px; }
  .pmr-actions { gap: 6px; }
  .pmr-body { padding: 12px; }
  .pmr-content { font-size: 13px; }
  .pmr-content :deep(h2) { font-size: 17px; }
  .pmr-content :deep(h3) { font-size: 15px; }
  .pmr-content :deep(h4) { font-size: 14px; }
  .pmr-footer { padding: 10px 12px; font-size: 11px; }
}
</style>
