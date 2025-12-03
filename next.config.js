// 启用代理支持（用于访问 Google API）
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
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

