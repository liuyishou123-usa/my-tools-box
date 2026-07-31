<script setup>
/**
 * 单个工具卡片
 *  - ready：可点击进入工具页
 *  - coming：灰显 + “开发中”角标，点击提示
 */
import { useRouter } from 'vue-router'

const props = defineProps({
  tool: { type: Object, required: true },
})

const router = useRouter()

function open() {
  if (props.tool.status === 'ready') {
    router.push(props.tool.path)
  } else {
    alert(`「${props.tool.name}」开发中，敬请期待 👀`)
  }
}
</script>

<template>
  <button
    @click="open"
    class="group relative text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
  >
    <!-- 开发中角标 -->
    <span
      v-if="tool.status === 'coming'"
      class="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
    >开发中</span>

    <!-- 图标 -->
    <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
      {{ tool.icon }}
    </div>

    <!-- 名称 + 描述 -->
    <div class="font-semibold text-sm mb-1">{{ tool.name }}</div>
    <div class="text-xs text-slate-500 dark:text-slate-400 leading-5 line-clamp-2">{{ tool.desc }}</div>

    <!-- 分类标签 -->
    <div class="mt-3 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
      {{
        { media: '🎨 媒体', doc: '📄 文档', dev: '💻 开发', daily: '☕ 日常' }[tool.cat]
      }}
    </div>
  </button>
</template>
