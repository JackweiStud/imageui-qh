# Supabase 配置指南 (Setup Guide)

您已经完成了代码层面的集成。现在只需 3 步，即可启用登录功能。

## 步骤 1：获取 API Key

1.  访问 [GitHub 登录 Supabase](https://supabase.com/dashboard/sign-in) 并创建一个新项目。
2.  等待项目数据库初始化完成（约 2 分钟）。
3.  进入 **Project Settings** (左下角齿轮) -> **API**。
4.  找到 `Project URL` 和 `Project API keys (anon public)`。

## 步骤 2：填入环境变量

1.  打开项目根目录的 `.env.local` 文件。
2.  添加以下填写内容（替换为您刚才复制的值）：

```env
# Google Gemini API
GEMINI_API_KEY=YOUR_GEMINI_KEY
# 可选：反代与模型覆盖，见 docs/Gemini配置.md
# GEMINI_BASE_URL=https://your-tunnel.trycloudflare.com
# GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
# GEMINI_IMAGE_PRO_MODEL=gemini-3-pro-image
# GEMINI_TEXT_MODEL=gemini-3-flash-preview

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> **注意**: 修改 `.env.local` 后，必须**重启终端** (`Ctrl+C` 然后重新运行 `npm run dev`) 才能生效！

## 步骤 3：配置登录方式 (Providers)

回到 Supabase Dashboard：

1.  点击左侧的 **Authentication** 图标 -> **Providers**。
2.  **Email**: 确保 `Enable Email provider` 已开启 (默认开启)。
    *   *(可选)* 在 **Email Templates** 中可以关闭 "Confirm email" 选项，这样用户注册后无需验证邮箱即可登录（测试阶段推荐）。
3.  **Google / GitHub (可选)**:
    *   如果您暂时没有 Client ID，可以先**跳过**。
    *   代码中我们已经预置了按钮，点击会提示错误，这是正常的。
    *   等您有 Key 后，在这里填入 Client ID 和 Secret，然后在顶部开启开关，网页上的按钮就会自动生效。

## 步骤 4：配置重定向 (重要)

为防止登录后跳转出错：

1.  进入 **Authentication** -> **URL Configuration**。
2.  在 `Site URL` 填入 `http://localhost:3000`。
3.  在 `Redirect URLs` 中添加一行 `http://localhost:3000/auth/callback`。
4.  点击 Save。

---

### 现在尝试一下！

重启项目 (`npm run dev`)，打开网页。
1.  左侧菜单顶部应该会出现一个 **Sign in** 按钮。
2.  点击 **Generate** 按钮，也会弹出登录框。
3.  尝试使用 **邮箱注册** (Sign Up)，成功后您应该能看到自己的头像显示在侧边栏。
