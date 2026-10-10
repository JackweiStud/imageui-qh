# Gemini 端点与模型

所有 Gemini 调用都在 `app/api/generate/route.ts`，通过 `@google/genai` 的 `GoogleGenAI` 发出。API Key 只放在服务端的 `GEMINI_API_KEY`。

## 环境变量

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `GEMINI_API_KEY` | 无（必填） | 官方 API 与反代共用。SDK 放在 `x-goog-api-key` 头里。 |
| `GEMINI_BASE_URL` | 未设置 | 可选。设置后传给 `httpOptions.baseUrl`，请求发往 `<BASE>/v1beta/models/<model>:generateContent`。不设置时不传 `httpOptions`，仍走 `https://generativelanguage.googleapis.com`。 |
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image` | 风格转换、参考图、换身、局部重绘、虚拟试衣。 |
| `GEMINI_IMAGE_PRO_MODEL` | `gemini-3-pro-image` | 自由创作（可带比例和分辨率）。 |
| `GEMINI_TEXT_MODEL` | `gemini-3-flash-preview` | 提示词增强。 |

`GEMINI_BASE_URL` 填源站根地址，例如 `https://your-tunnel.trycloudflare.com`。不要带 `/v1beta`；如果带了，程序会去掉，避免路径变成 `/v1beta/v1beta/...`。

## 为什么是这些默认模型

- **图像**：官方稳定版 ID 就是 `gemini-3.1-flash-image`，和反代上验证过的 ID 相同（`responseModalities: TEXT + IMAGE`，返回 JPEG `inlineData`）。原先写死的 `gemini-2.5-flash-image` 在反代上是 429，不再作为默认值；需要时仍可通过 `GEMINI_IMAGE_MODEL` 指定。
- **自由创作**：原先的 `gemini-3-pro-image-preview` 已于 2026-06-25 下线。官方现用 GA ID `gemini-3-pro-image`，所以默认用它，不设反代时官方 API 仍可用。反代的 ID 相同，但目前返回 503（没有可用账号）。
- **文本**：官方文档里的 ID 仍是 `gemini-3-flash-preview`。反代使用 `gemini-3-flash`（没有 `-preview`）。默认保持官方 ID，避免不设反代时文本增强失效。

## 用 Antigravity Tools 反代

反代暴露的是 Gemini 原生 REST（`x-goog-api-key` 或 `Authorization: Bearer` 均可；SDK 使用前者）。经 Cloudflare Tunnel 暴露时，在 Vercel 的 Environment Variables 设置：

```env
GEMINI_API_KEY=<反代接受的 key>
GEMINI_BASE_URL=https://<tunnel-host>
GEMINI_IMAGE_PRO_MODEL=gemini-3.1-flash-image
GEMINI_TEXT_MODEL=gemini-3-flash
```

`GEMINI_IMAGE_MODEL` 可以不设，默认已经是 `gemini-3.1-flash-image`。

`GEMINI_IMAGE_PRO_MODEL` 必须改成 `gemini-3.1-flash-image`。默认的 `gemini-3-pro-image` 在该反代上没有可用账号，会 503。

`GEMINI_TEXT_MODEL` 必须改成 `gemini-3-flash`。官方默认的 `gemini-3-flash-preview` 不是反代的模型 ID。

不要在 Vercel 上设置 `HTTP_PROXY` / `HTTPS_PROXY`。

## 本地 HTTP 代理

`HTTP_PROXY` / `HTTPS_PROXY` 仍用于访问官方 Google API：

- `next.config.js` 在这两个变量存在时启动 `global-agent`（Node `http`/`https`）。
- `installFetchProxy()` 用 undici 的 `ProxyAgent` 接管全局 `fetch`（`@google/genai` 走 `fetch`）。

设置了 `GEMINI_BASE_URL` 之后，反代主机名会写入 `NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。`fetch` 改用 `EnvHttpProxyAgent`：隧道上的 Gemini 请求直连，Supabase 等其它请求继续走原来的代理。未设置 `GEMINI_BASE_URL` 时，dispatcher 仍是 `new ProxyAgent(proxyUrl)`，与之前相同。

## 文本回答

提示词增强只采用最后一个非思考文本片段：跳过 `thought: true`，并且在反代把英文草稿和最终中文答案分成多个未标记片段时，不拼接、不取第一段。
