<template>
  <div class="system-view">
    <div class="view-header">
      <h1>系统管理</h1>
      <p class="subtitle">用户权限、系统配置</p>
    </div>
    <div class="coming-soon">
      <i class="fa-solid fa-gear"></i>
      <h2>系统管理开发中</h2>
      <p>正在构建用户权限、系统配置功能</p>
    </div>
  </div>
</template>

<style scoped>
.system-view { padding: 24px; max-width: 1400px; margin: 0 auto; }
.view-header { margin-bottom: 24px; }
.view-header h1 { font-size: 24px; font-weight: 600; margin: 0 0 8px; }
.subtitle { color: var(--text-secondary); margin: 0; }
.coming-soon { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: 12px; }
.coming-soon i { font-size: 48px; color: var(--brand); margin-bottom: 16px; }
.coming-soon h2 { margin: 0 0 8px; }
.coming-soon p { color: var(--text-secondary); margin: 0; }
</style>