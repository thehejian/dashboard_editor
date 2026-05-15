# Dashboard Editor

Vue 3 + Vite 仪表盘编辑器，用于创建和配置监控图表。

## 技术栈

- **Vue 3** ^3.5 - 前端框架
- **Vite** ^6.3 - 构建工具
- **Ant Design Vue** ^4.2.6 - UI 组件库
- **AntV G2** ^5.4.8 - 图表库

## 功能

- 添加/编辑/删除图表
- 配置面板（数据 + 样式 Tab）
- 三级级联数据集选择
- 图表推荐逻辑（根据指标类型、统计周期、监控对象自动推荐）
- 阈值设置（紧急/重要/次要/提示四级）
- 响应式设计，支持移动端

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── App.vue                    # 主布局
├── composables/
│   └── useEditorState.js     # 状态管理
└── components/
    ├── ChartGrid.vue          # 图表网格
    ├── ConfigPanel.vue        # 配置面板
    └── MultiSelect.vue        # 多选组件
```

## 参考文档

- [开发文档.md](./开发文档.md) - 完整技术文档
- `document/03-图表推荐逻辑.md` - 图表推荐逻辑详解