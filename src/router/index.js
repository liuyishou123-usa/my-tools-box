import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

/**
 * 路由表：
 * /                      → 首页（搜索 + 分类 + 工具网格）
 * /tools/image-converter → 图片转换压缩
 * /tools/json-format     → JSON 格式化
 * /tools/base64          → Base64 编解码
 * /tools/:id             → 未实现工具的统一占位页
 */
const routes = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/tools/image-converter',
    name: 'image-converter',
    component: () => import('../views/tools/ImageConverter.vue'),
    meta: { title: '图片转换压缩' },
  },
  {
    path: '/tools/json-format',
    name: 'json-format',
    component: () => import('../views/tools/JsonFormat.vue'),
    meta: { title: 'JSON 格式化' },
  },
  {
    path: '/tools/base64',
    name: 'base64',
    component: () => import('../views/tools/Base64Tool.vue'),
    meta: { title: 'Base64/URL 编解码' },
  },
  {
    path: '/tools/timestamp',
    name: 'timestamp',
    component: () => import('../views/tools/TimestampTool.vue'),
    meta: { title: '时间戳转换' },
  },
  {
    path: '/tools/doc-converter',
    name: 'doc-converter',
    component: () => import('../views/tools/DocConverter.vue'),
    meta: { title: '文档格式转换' },
  },
  {
    path: '/tools/:id',
    name: 'tool-placeholder',
    component: () => import('../views/ToolPlaceholder.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 路由切换时更新文档标题
router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} - 数字工具箱`
    : '数字工具箱 - 极简在线工具集'
})

export default router
