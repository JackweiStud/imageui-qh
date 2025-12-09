# Google & GitHub OAuth 完整配置指南

本文档总结了为 Supabase 项目配置 Google 和 GitHub 第三方登录的完整流程，以及从本地开发切换到 Vercel 生产环境时的配置差异。

## 1. 核心原理
OAuth 登录的标准流程是：
`用户点击登录` -> `跳转至 Google/GitHub` -> `用户授权` -> `跳回 Supabase` -> `Supabase 验证并将 Session 写入 Cookie` -> `跳回您的应用`。

因此，**Authorization Callback URL (回调地址)** 必须始终指向 Supabase 服务器。

---

## 2. GitHub 配置流程
1.  **获取 Callback URL**:
    *   Supabase Dashboard -> Authentication -> Providers -> GitHub -> 复制 `Callback URL`。
2.  **GitHub设置**:
    *   前往 [GitHub Developer Settings](https://github.com/settings/developers) -> New OAuth App。
    *   **Application Name**: 您的应用名称。
    *   **Homepage URL**: `http://localhost:3000` (开发) 或 `https://您的项目.vercel.app` (生产)。
    *   **Authorization callback URL**: **粘贴 Supabase 的 Callback URL** (永远填这个)。
3.  **回填**.
    *   获取 Client ID 和 Client Secret，填回 Supabase 并保存。

---

## 3. Google 配置流程
1.  **获取 Callback URL**:
    *   Supabase Dashboard -> Authentication -> Providers -> Google -> 复制 `Callback URL`。
2.  **Google Cloud Console 设置**:
    *   前往 [Google Cloud Console](https://console.cloud.google.com/) ->那是新建项目。
    *   **OAuth Consent Screen**: 选择 "External"，填写基本信息。**注意：在 "Testing" 状态下，必须在 "Test Users" 中添加您自己的测试邮箱。**
    *   **Credentials**: Create Credentials -> OAuth Client ID -> Web Application。
    *   **Authorized redirect URIs**: **粘贴 Supabase 的 Callback URL**。
3.  **回填**:
    *   获取 Client ID 和 Client Secret，填回 Supabase 并保存。

---

## 4. 关键配置差异：本地开发 vs Vercel 生产环境

这是最容易出错的地方。您**不需要**修改 Google/GitHub 侧的配置（它们只认 Supabase），您只需要在 **Supabase 后台** 告诉它允许跳回哪里。

### 配置位置
**Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs**

### 差异对照表

| 配置项 | 本地开发环境 (Local) | Vercel 生产环境 (Production) | 备注 |
| :--- | :--- | :--- | :--- |
| **Site URL** | `http://localhost:3000` | `https://您的项目名.vercel.app` | 邮件链接的默认前缀 |
| **Redirect URLs** | `http://localhost:3000/auth/callback` | `https://您的项目名.vercel.app/auth/callback` | **必须都添加！** |
| .env.local 变量 | `NEXT_PUBLIC_SUPABASE_URL` <br> `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 在 Vercel Settings -> Environment Variables 中添加同样的变量 | 生产环境必须配置环境变量 |

### 最佳实践 (同时支持两者)
在 Supabase 的 Redirect URLs 列表中，**同时添加**以上两个地址。
这样一套配置就可以同时支持您在本地 `npm run dev` 调试，以及用户在线上使用。

```text
Redirect URLs 列表示例：
1. http://localhost:3000/auth/callback
2. https://stylemorph-ai.vercel.app/auth/callback
3. https://www.your-custom-domain.com/auth/callback (如果有自定义域名)
```
