# Supabase 邮件服务配置指南 (Aliyun + Cloudflare 专版)

本文档汇总了使用 **阿里云企业邮箱** + **Cloudflare DNS** 配置 Supabase SMTP 的关键步骤与避坑指南。

## 1. 核心架构
*   **邮件服务商**: 阿里云免费企业邮箱 (Aliyun Enterprise Mail)
*   **DNS 托管**: Cloudflare
*   **应用后端**: Supabase Auth

## 2. 关键配置表 (Configuration)

### Supabase SMTP Settings
| Setting | Value | 备注 |
| :--- | :--- | :--- |
| **Host** | `smtp.qiye.aliyun.com` | |
| **Port** | `465` 或 `80` | 优先试 465。如果日志报 `Timeout`，请改用 **80** (阿里云专有 SMTP 端口，穿透性更好)。 |
| **User** | `noreply@huaizhoutechai.com` | 必须填完整邮箱地址。 |
| **Password** | (您的邮箱密码) | **注意：不能开启双重认证**。 |
| **Sender Email**| `noreply@huaizhoutechai.com` | 必须与 User 一致。 |
| **Sender Name** | Huaizhou Tech | 自定义显示名称。 |

### Cloudflare DNS Records
> **CRITICAL**: 所有 CNAME 记录必须关闭 Proxy (小云朵变灰/DNS Only)，否则阿里云无法验证域名所有权。

| Type | Name | Content | Proxy Status |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `mx1.qiye.aliyun.com` (Priority 5) | DNS Only |
| **MX** | `@` | `mx2.qiye.aliyun.com` (Priority 10)| DNS Only |
| **MX** | `@` | `mx3.qiye.aliyun.com` (Priority 15)| DNS Only |
| **TXT**| `@` | `v=spf1 include:spf.qiye.aliyun.com -all`| DNS Only |
| **CNAME**| `mail` | `qiye.aliyun.com` | **DNS Only (灰色云朵)** |

## 3. 避坑指南 (Troubleshooting)

### 🔴 错误 1: `526 Authentication failure`
*   **现象**: 网页版邮箱能登录，但 Supabase 发不出信。
*   **原因**: **开启了双重认证 (2FA)**。
*   **解决方案**:
    1.  登录阿里云邮箱管理后台。
    2.  找到 `noreply` 账号。
    3.  **关闭“启用双重认证”开关**。
    4.  并确保“允许第三方客户端 (POP3/SMTP)”已开启。

### 🔴 错误 2: `Timeout / ETIMEDOUT`
*   **现象**: 日志显示连接超时，发信慢或失败。
*   **原因**: 国外服务器 (Supabase) 连接国内阿里云 465 SSL 端口不稳定/被墙。
*   **解决方案**:
    *   将 Supabase SMTP 端口改为 **80**。
    *   或者尝试 **25**。

### 🔴 错误 3: `Sender address rejected`
*   **现象**: 邮件被拒绝。
*   **原因**: `Sender Email` 填写的地址与认证的 `User` 不一致，或者域名未通过验证。
*   **解决方案**: 确保 Supabase 设置里的 `User` 和 `Sender Email` 完全一致。

## 4. 推荐 HTML 模板 (English)
为了提升专业度，建议在 `Supabase Dashboard -> Auth -> Email Templates -> Confirm signup` 中使用以下 HTML：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Account - Huaizhou Tech</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 0; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #000000; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 600; }
    .content { padding: 40px 30px; text-align: left; }
    .button { background-color: #000000; color: #ffffff !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; }
    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>HUAIZHOU TECH</h1></div>
    <div class="content">
      <h2>Welcome to Huaizhou Tech</h2>
      <p>Please confirm your signup:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Your Email</a>
      </div>
    </div>
    <div class="footer">&copy; 2025 Huaizhou Tech. All rights reserved.</div>
  </div>
</body>
</html>
```


### 1 域名设置：Cloudflare 的 CNAME 必须开 DNS Only (灰云)，否则阿里云验证不过。
### 2 账号设置：阿里云企业邮箱必须 关闭双重认证 (2FA) 并 允许第三方客户端，否则 Supabase 会报 526 Authentication failure。