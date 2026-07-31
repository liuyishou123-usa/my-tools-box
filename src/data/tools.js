/**
 * 工具清单数据源
 * status: 'ready' 已上线 | 'coming' 开发中
 * cat: 'media' 媒体 | 'doc' 文档 | 'dev' 开发 | 'daily' 日常
 * api: 文档类工具预留的后端接口路径（第二阶段对接 VPS 后端）
 */

export const CATEGORIES = [
  { id: 'all', name: '全部工具', icon: '🧰' },
  { id: 'media', name: '媒体', icon: '🎨' },
  { id: 'doc', name: '文档', icon: '📄' },
  { id: 'dev', name: '开发', icon: '💻' },
  { id: 'daily', name: '日常', icon: '☕' },
]

export const TOOLS = [
  // ============ 媒体 ============
  {
    id: 'image-converter',
    name: '图片转换压缩',
    desc: 'JPG/PNG 转 WebP/PNG/JPG，支持质量调节，纯本地处理',
    cat: 'media',
    icon: '🖼️',
    path: '/tools/image-converter',
    status: 'ready',
  },
  {
    id: 'image-base64',
    name: '图片转 Base64',
    desc: '图片转 Data URL，一键复制，前端本地完成',
    cat: 'media',
    icon: '🔤',
    path: '/tools/image-base64',
    status: 'coming',
  },
  {
    id: 'qrcode',
    name: '二维码生成',
    desc: '文本/链接生成二维码，支持下载 PNG',
    cat: 'media',
    icon: '📱',
    path: '/tools/qrcode',
    status: 'coming',
  },

  // ============ 文档 ============
  {
    id: 'word-to-pdf',
    name: 'Word 转 PDF',
    desc: 'Word 文档转 PDF，保持排版（LibreOffice 后端）',
    cat: 'doc',
    icon: '📝',
    path: '/tools/doc-converter?from=word&to=pdf',
    status: 'ready',
    api: '/api/doc/word2pdf',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF 转 Word',
    desc: 'PDF 转可编辑 Word 文档（文本型 PDF 最佳）',
    cat: 'doc',
    icon: '📄',
    path: '/tools/doc-converter?from=pdf&to=word',
    status: 'ready',
    api: '/api/doc/pdf2word',
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel 转 PDF',
    desc: 'Excel 表格转 PDF，保持表格样式',
    cat: 'doc',
    icon: '📊',
    path: '/tools/doc-converter?from=excel&to=pdf',
    status: 'ready',
    api: '/api/doc/xlsx2pdf',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF 转 Excel',
    desc: 'PDF 转 Excel，自动识别表格结构',
    cat: 'doc',
    icon: '📈',
    path: '/tools/doc-converter?from=pdf&to=excel',
    status: 'ready',
    api: '/api/doc/pdf2excel',
  },
  {
    id: 'word-to-excel',
    name: 'Word 转 Excel',
    desc: 'Word 文档转 Excel，提取表格/段落',
    cat: 'doc',
    icon: '📋',
    path: '/tools/doc-converter?from=word&to=excel',
    status: 'ready',
    api: '/api/doc/word2excel',
  },
  {
    id: 'excel-to-word',
    name: 'Excel 转 Word',
    desc: 'Excel 表格转 Word 文档，表格完整还原',
    cat: 'doc',
    icon: '🗂️',
    path: '/tools/doc-converter?from=excel&to=word',
    status: 'ready',
    api: '/api/doc/excel2word',
  },
  {
    id: 'markdown',
    name: 'Markdown 编辑器',
    desc: '实时预览 Markdown，支持导出 HTML',
    cat: 'doc',
    icon: '📘',
    path: '/tools/markdown',
    status: 'coming',
  },

  // ============ 开发 ============
  {
    id: 'json-format',
    name: 'JSON 格式化',
    desc: '格式化/压缩/校验 JSON，错误定位',
    cat: 'dev',
    icon: '🧾',
    path: '/tools/json-format',
    status: 'ready',
  },
  {
    id: 'base64',
    name: 'Base64/URL 编解码',
    desc: 'Base64 编解码 + URL 编码解码，支持中文，输入即转',
    cat: 'dev',
    icon: '🔡',
    path: '/tools/base64',
    status: 'ready',
  },
  {
    id: 'timestamp',
    name: '时间戳转换',
    desc: '当前时间实时转时间戳，时间戳与日期互转（秒/毫秒）',
    cat: 'dev',
    icon: '⏱️',
    path: '/tools/timestamp',
    status: 'ready',
  },
  {
    id: 'regex',
    name: '正则测试',
    desc: '正则表达式在线测试与高亮匹配',
    cat: 'dev',
    icon: '🧩',
    path: '/tools/regex',
    status: 'coming',
  },

  // ============ 日常 ============
  {
    id: 'color-picker',
    name: '颜色转换',
    desc: 'HEX/RGB/HSL 颜色互转与预览',
    cat: 'daily',
    icon: '🎨',
    path: '/tools/color-picker',
    status: 'coming',
  },
  {
    id: 'password',
    name: '密码生成器',
    desc: '强密码生成，自定义长度与字符集',
    cat: 'daily',
    icon: '🔐',
    path: '/tools/password',
    status: 'coming',
  },
  {
    id: 'counter',
    name: '字数统计',
    desc: '统计字数/字符/行数，实时计算',
    cat: 'daily',
    icon: '🔢',
    path: '/tools/counter',
    status: 'coming',
  },
]

/** 按分类取工具 */
export function toolsByCategory(cat) {
  if (!cat || cat === 'all') return TOOLS
  return TOOLS.filter(t => t.cat === cat)
}

/** 模糊搜索：匹配名称/描述/分类名 */
export function searchTools(keyword) {
  const kw = (keyword || '').trim().toLowerCase()
  if (!kw) return TOOLS
  const catName = (cid) => {
    const c = CATEGORIES.find(x => x.id === cid)
    return c ? c.name.toLowerCase() : ''
  }
  return TOOLS.filter(t => {
    return t.name.toLowerCase().includes(kw)
      || t.desc.toLowerCase().includes(kw)
      || catName(t.cat).includes(kw)
  })
}

/** 按 id 查找工具 */
export function findTool(id) {
  return TOOLS.find(t => t.id === id)
}
