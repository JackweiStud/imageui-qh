/**
 * HTTP(S)_PROXY / global-agent 仍然负责访问官方 Google API。
 * 一旦设置了 GEMINI_BASE_URL（例如 Cloudflare Tunnel 上的反代），
 * 该主机名必须直连：undici 的 ProxyAgent 不认 NO_PROXY，会把隧道请求也送进代理。
 */

function geminiBypassHostname() {
  const raw = typeof process.env.GEMINI_BASE_URL === 'string'
    ? process.env.GEMINI_BASE_URL.trim()
    : '';
  if (!raw) return '';
  try {
    return new URL(raw).hostname;
  } catch {
    return '';
  }
}

function appendEnvList(name, value) {
  if (!value) return;
  const current = process.env[name] || '';
  const entries = current.split(/[\s,]+/).filter(Boolean);
  if (!entries.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
    entries.push(value);
  }
  process.env[name] = entries.join(',');
}

/** 把反代主机名写入 NO_PROXY，供 global-agent（Node http/https）跳过。 */
function applyGeminiNoProxy() {
  const host = geminiBypassHostname();
  if (!host) return '';
  appendEnvList('NO_PROXY', host);
  appendEnvList('no_proxy', host);
  appendEnvList('GLOBAL_AGENT_NO_PROXY', host);
  return host;
}

/**
 * 与原先 route.ts 相同：仅在设置了 HTTP(S)_PROXY 时替换 undici 全局 dispatcher。
 * 未设置 GEMINI_BASE_URL 时仍使用 ProxyAgent(proxyUrl)。
 * 设置了自定义端点时改用 EnvHttpProxyAgent，对同一代理地址放行其它主机，并直连反代主机。
 */
function installFetchProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return;

  const { EnvHttpProxyAgent, ProxyAgent, setGlobalDispatcher } = require('undici');
  const host = applyGeminiNoProxy();
  if (!host) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    return;
  }

  setGlobalDispatcher(new EnvHttpProxyAgent({
    httpProxy: proxyUrl,
    httpsProxy: proxyUrl,
    noProxy: process.env.NO_PROXY || host,
  }));
}

module.exports = {
  applyGeminiNoProxy,
  geminiBypassHostname,
  installFetchProxy,
};
