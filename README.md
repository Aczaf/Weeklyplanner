# Efficiency Pro: Weekly Planner & Year Journey

Efficiency Pro 是一款专为追求极致效率和成就感的用户设计的全能周计划工具。它不仅能帮助你精准管理每一分钟，还能通过独特的“年度成就之旅”视图，让你见证自己全年的成长轨迹。

## ✨ 核心功能

### 1. 极致周计划 (Weekly Grid)
- **20分钟精细化管理**：支持以 20 分钟为单位的日程安排，满足高强度工作/学习需求。
- **直观拖拽感**：点击起始与结束时间点即可快速创建任务。
- **实时进度线**：带有呼吸灯效果的“当前时间”指示线，时刻提醒你活在当下。

### 2. 年度成就之旅 (Year Journey)
- **365天全景视图**：从 1 月到 12 月纵向排布，横向展示每日日程密度。
- **成就感可视化**：随着任务的填满，彩色方块将连成一片，见证你的坚持。
- **快速跳转**：在年视图中点击任意一天，即可瞬间回到那一周的详细计划。

### 3. 智能交互与设计
- **悬浮月日历**：支持跨月切换，快速定位日期。
- **多维搜索**：支持按标题和描述实时搜索任务。
- **每周洞察 (Insights)**：自动统计各分类任务的时间占比，量化你的努力。
- **全平台适配**：针对手机端进行了深度优化，支持“灵动岛”安全区域适配，操作手感丝滑。
- **夜间模式**：精心调校的深色模式，保护视力且极具科技感。

## 🛠️ 技术栈
- **React 18**：构建响应式 UI。
- **TypeScript**：确保代码健壮性。
- **Tailwind CSS**：实现精致的原子化样式设计。
- **Framer Motion**：提供流畅的交互动画。
- **Date-fns**：精准的日期逻辑处理。
- **Lucide React**：简洁美观的图标库。

## 🚀 快速开始

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **启动开发服务器**：
   ```bash
   npm run dev
   ```

3. **构建生产版本**：
   ```bash
   npm run build
   ```

## 📂 项目结构
- `/src/App.tsx`：主程序入口，包含所有核心逻辑。
- `/src/index.css`：全局样式及 Tailwind 配置。
- `localStorage`：所有数据均存储在本地，保护隐私且支持离线使用。

*由 我和哈基米3对线 倾情打造，下面进一段广告。*

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 运行并部署您的 AI Studio 应用！

这里包含了在本地运行您的应用所需的一切！！！。

在 AI Studio 中查看您的应用：https://ai.studio/apps/e3d23b2c-f3ee-4a7d-bba6-6b2b6c85f4dd

## 本地运行

**前提条件：** Node.js

1. 安装依赖：
`npm install`
2. 在 [.env.local](.env.local) 中设置 `GEMINI_API_KEY` 为您的 Gemini API 密钥
3. 运行应用：
`npm run dev`
