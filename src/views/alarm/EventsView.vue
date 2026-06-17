<template>
  <div class="page-view">
    <div class="page-header"><h2>事件</h2></div>
    <div class="empty-state">
      <i class="fa-solid fa-calendar"></i>
      <p>事件管理功能开发中</p>
    </div>
  </div>
</template>

<style scoped>
.page-view { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; height: 100%; }
.page-header { margin-bottom: 24px; flex-shrink: 0; width: 100%; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.empty-state { text-align: center; padding: 60px 20px; color: #8c8c8c; }
.empty-state i { font-size: 48px; margin-bottom: 16px; display: block; }
.empty-state p { margin: 0; font-size: 14px; }
</style>
