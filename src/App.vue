<script setup>
/**
 * App 根组件：
 *  - 顶栏：Logo + 全局模糊搜索 + 返回首页
 *  - 主区域：工具子页全屏展示；首页由 HomeView 内部管理侧栏+网格
 *  - 路由视图：/ 为首页，/tools/* 为工具页
 */
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isHome = () => route.name === 'home'

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- ======= 顶栏：Logo + 全局搜索框 ======= -->
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <!-- Logo -->
        <button
          @click="goHome"
          class="flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-80 transition"
        >
          <span class="text-xl">🧰</span>
          <span>数字<span class="text-blue-600 dark:text-blue-400">工具箱</span></span>
        </button>

        <!-- 全局模糊搜索（首页显示；工具页隐藏，聚焦工具本身） -->
        <div v-if="isHome()" class="flex-1 max-w-md ml-4 relative hidden sm:block">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <!-- 输入框与 HomeView 的 keyword 双向同步：通过自定义事件向上转发 -->
          <input
            :value="homeKeyword"
            @input="onGlobalSearch"
            type="text"
            placeholder="🔍 搜索工具，如：图片、JSON、Base64..."
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 outline-none text-sm transition"
          />
        </div>

        <div class="ml-auto flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>全部本地处理 · 安全无上传</span>
        </div>
      </div>
    </header>

    <!-- ======= 主区域 ======= -->
    <main class="flex-1">
      <router-view />
    </main>

    <footer class="py-6 text-center text-xs text-slate-400 dark:text-slate-600">
      数字工具箱 · 图片/JSON/Base64 等工具均在浏览器本地完成，不上传任何数据
    </footer>

    <!-- 全局错误提示 Toast（损坏图片 / JSON 解析失败等友好提示） -->
    <ErrorToast />
  </div>
</template>

<script>
// 补充导出：为了让顶栏搜索与 HomeView 联动，这里采用极简事件总线方案
// HomeView 挂载时注册回调，顶栏输入时触发
export default {
  data() {
    return { homeKeyword: '' }
  },
  created() {
    this._searchCb = null
  },
  methods: {
    /** 由 HomeView 注册搜索回调 */
    registerSearch(cb) {
      this._searchCb = cb
    },
    onGlobalSearch(e) {
      this.homeKeyword = e.target.value
      if (this._searchCb) this._searchCb(this.homeKeyword)
    },
  },
}
</script>
