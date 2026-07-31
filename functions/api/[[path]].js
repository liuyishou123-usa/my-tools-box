/**
 * Cloudflare Pages Functions：/api/* 反向代理到 VPS2 文档转换后端
 * ============================================================
 * 请求流：浏览器 → https://pdf123.cc.cd/api/doc/word2pdf
 *        → 本函数 → http://api.pdf123.cc.cd:8000/api/doc/word2pdf
 *
 * 说明：目标必须用域名（api.pdf123.cc.cd → VPS2 A 记录），
 * 不能用裸 IP——CF Worker 访问裸 IP 会被 Cloudflare 拦截（1003）。
 * 后端地址可通过环境变量 TOOLBOX_API_ORIGIN 覆盖。
 */
export async function onRequest(context) {
  const { request } = context
  const origin = (context.env && context.env.TOOLBOX_API_ORIGIN) || 'http://api.pdf123.cc.cd:8000'

  const url = new URL(request.url)
  const target = new URL(origin)
  target.pathname = url.pathname   // 保留 /api/xxx 路径
  target.search = url.search

  // 整体转发请求（保留 method / headers / body，支持文件上传流）
  return fetch(new Request(target, request))
}
