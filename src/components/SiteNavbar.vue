<template>
  <aside
    class="site-sidebar"
    :class="{ expanded }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="s-icons">
      <div v-for="item in quickItems" :key="item.key" class="s-icon" :title="item.label">
        <i :class="item.icon"></i>
      </div>
    </div>

    <div class="s-panel">
      <div class="s-quick">
        <div v-for="item in quickItems" :key="item.key" class="item">
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <i v-if="item.arrow" class="fa-solid fa-chevron-right arrow"></i>
        </div>
      </div>
      <div class="divider"></div>
      <div class="s-cats">
        <div
          v-for="cat in categoryItems"
          :key="cat"
          class="cat"
          :class="{ on: isActive(cat) }"
          @click="handleCatClick(cat)"
        >
          {{ cat }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const expanded = ref(false)
let enterTimer = null
let leaveTimer = null

function onEnter() {
  clearTimeout(leaveTimer)
  leaveTimer = null
  if (!expanded.value) {
    enterTimer = setTimeout(() => { expanded.value = true }, 2000)
  }
}

function onLeave() {
  clearTimeout(enterTimer)
  enterTimer = null
  leaveTimer = setTimeout(() => { expanded.value = false }, 300)
}

onBeforeUnmount(() => {
  clearTimeout(enterTimer)
  clearTimeout(leaveTimer)
})

const quickItems = [
  { key: 'scene', icon: 'fa-solid fa-bars', label: '场景菜单', arrow: false },
  { key: 'quick', icon: 'fa-regular fa-clock', label: '快速访问', arrow: true },
  { key: 'tenant', icon: 'fa-solid fa-puzzle-piece', label: '应用', arrow: false },
  { key: 'cloud', icon: 'fa-solid fa-cloud', label: '云服务', arrow: true },
  { key: 'pool', icon: 'fa-solid fa-layer-group', label: '资源池', arrow: false },
  { key: 'vdc', icon: 'fa-solid fa-network-wired', label: '组织', arrow: false },
  { key: 'container', icon: 'fa-solid fa-cube', label: '容器', arrow: false },
]

const categoryItems = computed(() => [
  '大数据运维', '数据库运维', '中间件运维', 'OBS运维',
  '虚拟机运维', '虚拟网络运维', '物理设备运维',
])

const catRoutes = { 'OBS运维': '/obs/overview' }

function isActive(cat) {
  if (cat === 'OBS运维') return route.path.startsWith('/obs')
  return false
}

function handleCatClick(cat) {
  const path = catRoutes[cat]
  if (path) router.push(path)
}
</script>

<style scoped>
.site-sidebar {
  position: relative;
  display: flex;
  flex-shrink: 0;
  width: 48px;
  background: var(--bg);
  border-right: 1px solid var(--border);
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.site-sidebar.expanded {
  width: 280px;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.04);
}

.s-icons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  width: 48px;
  flex-shrink: 0;
}
.s-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 40px;
  color: var(--text-sec);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.s-icon:hover {
  background: var(--brand-subtle);
  color: var(--brand);
}

.s-panel {
  position: absolute;
  top: 0;
  left: 48px;
  width: 232px;
  height: 100%;
  padding: 8px 0 16px;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-8px);
  transition: opacity 0.18s 0.05s, transform 0.18s 0.05s;
}
.site-sidebar.expanded .s-panel {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}

.s-quick {
  padding: 0 8px;
}
.s-quick .item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text);
  font-size: 14px;
}
.s-quick .item:hover {
  background: var(--bg-sec);
}
.s-quick .item i {
  width: 16px;
  text-align: center;
  color: var(--text-sec);
}
.s-quick .item .arrow {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-ter);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 8px 12px;
}

.s-cats {
  padding: 0 8px;
}
.s-cats .cat {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 8px 0 24px;
  font-size: 14px;
  color: var(--text);
  border-radius: 6px;
  cursor: pointer;
}
.s-cats .cat:hover {
  background: var(--bg-sec);
}
.s-cats .cat.on {
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 4px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .site-sidebar {
    width: 44px;
  }
  .site-sidebar:hover,
  .site-sidebar.expanded,
  .site-sidebar:focus-within {
    width: 44px;
    box-shadow: none;
  }
  .s-icons {
    width: 44px;
  }
  .s-icon {
    width: 44px;
    height: 38px;
    font-size: 15px;
  }
  .s-panel {
    left: 44px;
    width: 220px;
    transform: translateX(0);
    opacity: 1;
    pointer-events: none;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
  }
  .site-sidebar:hover .s-panel,
  .site-sidebar.expanded .s-panel {
    pointer-events: auto;
  }
}
</style>