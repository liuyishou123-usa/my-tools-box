/**
 * Cloudflare Pages Functions：/api/* 反向代理到 VPS2 文档转换后端
 * ============================================================
 * 请求流：浏览器 → https://pdf123.cc.cd/api/doc/word2pdf
 *        → 本函数 → http://104.168.76.179:8000/api/doc/word2pdf
 *
 * 后端地址通过环境变量 TOOLBOX_API_ORIGIN 配置（Pages 项目设置里配置），
 * 未配置时使用下方默认值。
 */
export async function onRequest(context) {
  const { request } = context
  const origin = (context.env && context.env.TOOLBOX_API_ORIGIN) || 'http://104.168.76.179:8000'

  const url = new URL(request.url)
  const target = new URL(origin)
  target.pathname = url.pathname   // 保留 /api/xxx 路径
  target.search = url.search

  // 整体转发请求（保留 method / headers / body，支持文件上传流）
  return fetch(new Request(target, request))
}
