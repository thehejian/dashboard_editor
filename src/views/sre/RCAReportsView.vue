<template>
  <div class="page-view">
    <div class="page-header"><h3>根因分析报告</h3></div>
    <div v-if="loading" style="text-align:center;margin:60px 0"><a-spin /></div>
    <template v-else>
      <div class="rca-list">
        <div v-for="r in reports" :key="r.id" class="rca-card" @click="router.push('/ops/incident/' + r.incidentId)">
          <div class="rca-head">
            <span class="rca-sev" :style="{ background: severityBg[r.severity] }">{{ r.severity }}</span>
            <span class="rca-title">{{ r.title }}</span>
            <span class="rca-time">{{ r.createdAt }}</span>
          </div>
          <div class="rca-cause">根因: {{ r.rootCause }}</div>
          <div class="rca-evidence">
            <span v-for="e in r.evidence" :key="e.key" class="rca-evidence-tag">{{ e.key }}: {{ e.detail }}</span>
          </div>
          <div class="rca-suggestions">
            <span v-for="(s, i) in r.suggestions" :key="i" class="rca-suggestion">{{ s }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const loading = ref(true)
const reports = ref([])
const severityBg = { P1: '#F5222D', P2: '#FF7D00', P3: '#FAAD14' }
onMounted(async () => {
  try {
    const res = await fetch('/api/sre/rca-reports')
    const json = await res.json()
    if (json.success) reports.value = json.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.rca-list { display:flex;flex-direction:column;gap:10px; }
.rca-card { background:#fff;border:1px solid #f0f0f0;border-radius:8px;padding:14px 16px;cursor:pointer;transition:all 0.15s; }
.rca-card:hover { border-color:#1890ff;box-shadow:0 1px 4px rgba(24,144,255,0.1); }
.rca-head { display:flex;align-items:center;gap:8px;margin-bottom:6px; }
.rca-sev { font-size:11px;font-weight:700;color:#fff;padding:1px 6px;border-radius:3px; }
.rca-title { font-size:14px;font-weight:600;color:#1a1a1a;flex:1; }
.rca-time { font-size:11px;color:#8c8c8c; }
.rca-cause { font-size:12px;color:#333;margin-bottom:8px; }
.rca-evidence { display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px; }
.rca-evidence-tag { font-size:11px;background:#f5f5f5;padding:2px 8px;border-radius:4px;color:#666; }
.rca-suggestions { display:flex;flex-wrap:wrap;gap:4px; }
.rca-suggestion { font-size:11px;background:#e6f7ff;color:#096dd9;padding:2px 8px;border-radius:4px; }

@media (max-width: 768px) {
  .rca-head { flex-wrap: wrap; }
  .rca-title { min-width: 0; }
  .rca-time { width: 100%; margin-top: 2px; }
}
</style>