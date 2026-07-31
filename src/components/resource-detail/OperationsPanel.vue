<template>
  <div class="ops-wrap">
    <div v-if="currentGroup" class="ops-content">
      <div class="ops-content-header">
        <i :class="currentGroup.icon" class="ops-content-icon"></i>
        <span class="ops-content-title">{{ currentGroup.title }}</span>
        <span class="ops-content-desc">{{ currentGroup.desc }}</span>
      </div>
      <div class="ops-items">
        <div v-for="item in currentGroup.items" :key="item.action" class="ops-item" @click="runAction(item)">
          <div class="ops-item-info">
            <span class="ops-item-name">{{ item.name }}</span>
            <span class="ops-item-desc">{{ item.desc }}</span>
          </div>
          <a-button size="small" type="primary" ghost class="ops-run-btn">
            <i class="fa-solid fa-play"></i> 执行
          </a-button>
        </div>
      </div>
    </div>

    <a-modal v-model:open="modalVisible" :title="modalTitle" :footer="null" :width="480">
      <div class="ops-modal">
        <div class="ops-modal-status">
          <a-spin v-if="running" />
          <a-tag v-else color="green"><i class="fa-solid fa-check"></i> 执行完成</a-tag>
        </div>
        <pre class="ops-modal-output">{{ modalOutput }}</pre>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  groupKey: { type: String, default: 'auto-job' },
})

const modalVisible = ref(false)
const modalTitle = ref('')
const modalOutput = ref('')
const running = ref(false)

const currentGroup = computed(() => props.data.find(g => g.key === props.groupKey) || props.data[0])

const outputMap = {
  restart: '$ systemctl restart order-service\n[OK] 服务重启成功，PID: 28451\n[INFO] 健康检查通过 (耗时 3.2s)',
  cleanup: '$ find /tmp -mtime +7 -delete\n$ journalctl --vacuum-time=7d\n[OK] 清理完成，释放磁盘空间 2.3GB',
  healthcheck: '$ curl -s http://localhost:8080/health\n{"status":"up","uptime":"72h","mem":"62%","cpu":"34%"}\n[OK] 健康检查全部通过',
  ping: '$ ping -c 4 order-service\nPING order-service (10.0.1.15): 56 data bytes\n64 bytes: icmp_seq=0 ttl=64 time=0.45ms\n64 bytes: icmp_seq=1 ttl=64 time=0.38ms\n--- 平均延迟 0.42ms，丢包率 0% ---',
  traceroute: '$ traceroute order-service\n 1  gateway (10.0.3.11)   1.2ms\n 2  order-service (10.0.1.15)  2.1ms\n--- 路由正常，共 2 跳 ---',
  dns: '$ nslookup order-service.local\nServer: 10.0.0.2\nAddress: 10.0.0.2#53\nName: order-service.local\nAddress: 10.0.1.15\n[OK] DNS 解析正常',
  'http-dial': '$ http-dial https://order-service:8080/api/health --timeout 5s\n[200 OK] 响应时间: 32ms\n[200 OK] 响应时间: 28ms\n[200 OK] 响应时间: 35ms\n--- 拨测通过，可用率 100% ---',
  'tcp-dial': '$ tcp-dial order-service:8080 --timeout 3s\n[OK] 端口可达，延迟 0.8ms\n[OK] 端口可达，延迟 0.6ms\n--- TCP 拨测通过 ---',
  'cpu-locate': '$ anomaly-scan --metric cpu --threshold 2sigma\n扫描中... (扫描 156 台主机)\n[ALERT] 10.0.1.15 (order-service) CPU 偏离度 +3.2σ\n[ALERT] 10.0.2.31 (mysql-primary) CPU 偏离度 +2.8σ\n--- 发现 2 台异常主机 ---',
  'mem-locate': '$ anomaly-scan --metric memory --threshold 2sigma\n扫描中... (扫描 156 台主机)\n[ALERT] 10.0.1.15 (order-service) 内存偏离度 +2.5σ\n[INFO] 建议排查是否存在内存泄漏',
  'disk-locate': '$ anomaly-scan --metric diskio --threshold 2sigma\n扫描中... (扫描 156 台主机)\n[ALERT] 10.0.2.31 (mysql-primary) IO wait 偏离度 +4.1σ\n--- 发现 1 台异常主机 ---',
}

function runAction(item) {
  modalTitle.value = currentGroup.value.title + ' — ' + item.name
  modalOutput.value = ''
  running.value = true
  modalVisible.value = true

  const output = outputMap[item.action] || '[OK] 任务已提交'
  const lines = output.split('\n')
  let i = 0
  const timer = setInterval(() => {
    if (i < lines.length) {
      modalOutput.value += lines[i] + '\n'
      i++
    } else {
      clearInterval(timer)
      running.value = false
    }
  }, 200)
}
</script>

<style scoped>
.ops-wrap { padding: 16px 20px; }
.ops-content-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.ops-content-icon { font-size: 16px; color: #1890ff; }
.ops-content-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.ops-content-desc { font-size: 12px; color: #8c8c8c; margin-left: auto; }
.ops-items { display: flex; flex-direction: column; gap: 8px; }
.ops-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 8px; cursor: pointer; transition: all 0.15s; border: 1px solid #f0f0f0; background: #fafafa; }
.ops-item:hover { background: #f0f5ff; border-color: #91caff; }
.ops-item-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ops-item-name { font-size: 13px; color: #1a1a1a; font-weight: 500; }
.ops-item-desc { font-size: 11px; color: #8c8c8c; }
.ops-run-btn { flex-shrink: 0; }
.ops-modal { display: flex; flex-direction: column; gap: 12px; }
.ops-modal-status { display: flex; align-items: center; gap: 8px; }
.ops-modal-output { font-size: 12px; font-family: 'SF Mono', Monaco, monospace; background: #1a1a1a; color: #52c41a; padding: 12px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6; margin: 0; max-height: 300px; overflow-y: auto; }
</style>
