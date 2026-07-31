/**
 * 全局错误处理与 Toast 提示
 * ==========================
 * 1. Vue 全局 errorHandler：捕获组件渲染/生命周期错误，防止白屏
 * 2. window error / unhandledrejection：捕获异步错误
 * 3. 统一的 showToast 提示：损坏图片、JSON 解析失败等友好提示
 */
import { reactive } from 'vue'

// ---------- 全局 Toast 状态 ----------
export const toastState = reactive({
  visible: false,
  message: '',
  type: 'error',   // error | success | info
  timer: null,
})

const ICONS = { error: '⚠️', success: '✅', info: 'ℹ️' }
const STYLES = {
  error: 'bg-red-600 text-white',
  success: 'bg-green-600 text-white',
  info: 'bg-slate-800 text-white',
}

/** 弹出全局提示（默认 3.5 秒自动消失） */
export function showToast(message, type = 'error', duration = 3500) {
  toastState.message = message
  toastState.type = type
  toastState.visible = true
  clearTimeout(toastState.timer)
  toastState.timer = setTimeout(() => {
    toastState.visible = false
  }, duration)
}

/** 供模板使用的样式/图标映射 */
export function toastIcon(type) { return ICONS[type] || ICONS.info }
export function toastStyle(type) { return STYLES[type] || STYLES.info }

// ---------- 全局错误处理器 ----------
/** 安装全局错误拦截：挂载到 app.config.errorHandler + window 事件 */
export function installGlobalErrorHandler(app) {
  // Vue 渲染/生命周期错误（防止白屏）
  app.config.errorHandler = (err, _instance, info) => {
    console.error('[Vue Error]', info, err)
    showToast('页面遇到一点小问题，请刷新后重试')
  }

  // window 全局错误（跳过资源加载失败，避免误报）
  window.addEventListener('error', (e) => {
    const tag = e.target && e.target.tagName
    if (tag === 'IMG' || tag === 'SCRIPT' || tag === 'LINK' || tag === 'STYLE') return
    console.error('[Window Error]', e.message)
    showToast('页面遇到一点小问题，请刷新后重试')
  })

  // 未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[Unhandled Rejection]', e.reason)
    showToast('操作未能完成，请检查输入内容后重试')
  })
}
