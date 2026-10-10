// 启用代理支持（用于访问 Google API）。
// 若配置了 GEMINI_BASE_URL，先把反代主机写入 NO_PROXY，避免 global-agent 转发隧道请求。
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  require('./lib/configureGeminiProxy').applyGeminiNoProxy();
  require('global-agent').bootstrap();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性特性（如果需要）
  // experimental: {},
  
  // 图片域名配置（如有外部图片）
  images: {
    unoptimized: true, // 简化配置，适合部署到任何平台
  },
};

module.exports = nextConfig;

