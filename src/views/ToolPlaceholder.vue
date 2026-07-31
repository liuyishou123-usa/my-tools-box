<script setup>
/**
 * 未实现工具的占位页：展示工具信息和“开发中”状态
 */
import { useRoute, useRouter } from 'vue-router'
import { findTool } from '../data/tools'

const route = useRoute()
const router = useRouter()
const tool = findTool(route.params.id)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16 text-center">
    <button
      @click="router.push('/')"
      class="mb-8 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <div class="text-6xl mb-4">{{ tool?.icon || '🛠️' }}</div>
    <h1 class="text-2xl font-bold mb-2">{{ tool?.name || '未知工具' }}</h1>
    <p class="text-slate-500 dark:text-slate-400 mb-4">{{ tool?.desc }}</p>

    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm">
      <span>🚧</span> 该工具正在开发中，敬请期待
    </div>

    <!-- 文档类工具展示预留后端接口信息 -->
    <div v-if="tool?.api" class="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
      <div class="font-semibold mb-2">预留后端接口</div>
      <code class="block bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">POST {{ tool.api }}</code>
      <div class="mt-2 leading-5">独立 VPS 后端（Python + LibreOffice）将提供该接口，前端通过标准 Fetch API 对接。</div>
    </div>
  </div>
</template>
