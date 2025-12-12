# StyleMorph AI

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

StyleMorph AI 是一个功能强大的 AI 图像生成与编辑平台，基于 **Next.js**、**Supabase** 和 **Google Gemini** 模型构建。它集成了多种图像处理能力，旨在提供从灵感到成品的完整 AI 创作流。

[在 AI Studio 中查看原型](https://ai.studio/apps/drive/17wByG7kGDgDeS3hVluko_l7vjHDW-Xby)

## ✨ 核心功能

- **🎨 风格转换 (Style Transform)**: 保持原图构图与主体，一键迁移各种艺术风格。
- **🖼️ 场景融合 (Reference Transform)**: 将人像完美融合到指定背景或参考图中。
- **✨ 自由创作 (Free Style)**: 支持文生图、图生图，以及多轮对话式修图。
- **🎭 自定义换身 (Custom Swap)**: 高级换脸与换装，支持 Pose 姿态控制与三图融合。
- **🖌️ 局部重绘 (Inpainting)**: 涂抹遮罩，精准修改或修复图片特定区域。
- **👗 虚拟试衣 (Virtual Try-On)**: 专业的试衣模式，支持保持人物换衣服或保持衣服换模特。
- **🪄 智能提示词 (Prompt Enhancer)**: 内置 AI 润色功能，将简单描述自动转化为专业提示词。
- **☁️ 历史同步 (Cloud Sync)**: 自动保存生成记录到云端，跨设备同步历史，支持断网恢复。
- **🔐 用户鉴权 (User Auth)**: 集成 Google/GitHub 一键登录，安全可靠。
- **💎 积分系统 (Credit System)**: 内置积分消耗与管理机制。

## 🛠️ 技术栈

- **前端**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React
- **后端**: Next.js API Routes, Supabase Auth & Database
- **存储**: Supabase Storage (解决 Vercel Payload 限制)
- **AI 模型**: Google Gemini (gemini-2.5-flash-image, gemini-3-pro-image-preview)

## 🚀 本地运行

### 前置要求

- Node.js 18 或更高版本
- Google Gemini API Key ([获取 API Key](https://aistudio.google.com/app/apikey))
- Supabase Project ([创建项目](https://supabase.com/dashboard))

### 步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   在项目根目录创建一个 `.env.local` 文件，并添加以下配置：

   ```env
   # Google Gemini AI
   GEMINI_API_KEY=你的_GEMINI_API_KEY

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=你的_SUPABASE_PROJECT_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=你的_SUPABASE_SERVICE_ROLE_KEY

   # (可选) 代理设置
   # HTTP_PROXY=http://127.0.0.1:7890
   # HTTPS_PROXY=http://127.0.0.1:7890
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## ☁️ 部署指南

本项目支持一键部署到 Vercel。

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入该仓库。
3. 在 **Environment Variables** 中添加以下变量：
    - `GEMINI_API_KEY`
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
4. 点击 **Deploy**。

> **注意**: Vercel 服务器位于海外，通常可以直接访问 Google API，无需配置代理。

## 📁 项目结构

```text
├── app/                # Next.js App Router 页面与 API
├── components/         # React UI 组件 (SketchPad, ImageUploader 等)
├── lib/                # 工具函数、类型定义与 API 客户端 (含 Supabase)
├── public/             # 静态资源与预设图片
└── docs/               # 项目文档与 PRD
```
