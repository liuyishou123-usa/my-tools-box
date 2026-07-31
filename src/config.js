/**
 * 文档转换后端 API 地址配置
 * =========================
 * 空字符串 = 同域请求，由 CF Pages Functions（functions/ 目录）代理到
 * VPS2 后端的 8000 端口。例如：
 *   /api/doc/word2pdf  →  VPS2:8000/api/doc/word2pdf
 * 这样前端域名 https://pdf123.cc.cd 统一承载页面 + API，零 CORS 问题。
 */
export const API_BASE = ''
