<script setup>
/**
 * 首页：左侧分类栏 + 右侧工具网格
 *  - 搜索：顶栏输入 → 本页 keyword 实时过滤（组合：分类 ∩ 关键词）
 *  - 分类：全部/媒体/文档/开发/日常
 */
import { ref, computed, onMounted } from 'vue'
import { CATEGORIES, searchTools } from '../data/tools'
import ToolCard from '../components/ToolCard.vue'
import { useAppSearch } from '../composables/useAppSearch'

const activeCat = ref('all')
const keyword = ref('')

// 与 App.vue 顶栏搜索联动
useAppSearch((kw) => { keyword.value = kw })

// 先按关键词过滤，再按分类过滤（保留排序）
const filtered = computed(() => {
  let list = searchTools(keyword.value)
  if (activeCat.value !== 'all') {
    list = list.filter(t => t.cat === activeCat.value)
  }
  return list
})

const readyCount = computed(() => filtered.value.filter(t => t.status === 'ready').length)

function selectCat(cat) {
  activeCat.value = cat
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6 flex gap-6">
    <!-- ======= 左侧分类切换栏 ======= -->
    <aside class="w-44 shrink-0 hidden md:block">
      <div class="sticky top-20 space-y-1">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          @click="selectCat(cat.id)"
          class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition"
          :class="activeCat === cat.id
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </button>

        <div class="pt-4 px-2 text-xs text-slate-400 dark:text-slate-500 leading-5">
          <div>已上线 {{ readyCount }} 个工具</div>
          <div>其余为开发中</div>
        </div>
      </div>
    </aside>

    <!-- ======= 移动端分类：横向滚动标签 ======= -->
    <div class="md:hidden flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        @click="selectCat(cat.id)"
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition"
        :class="activeCat === cat.id
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- ======= 右侧工具网格 ======= -->
    <section class="flex-1 min-w-0">
      <!-- 结果提示 -->
      <div class="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          <template v-if="keyword">“{{ keyword }}” 的搜索结果</template>
          <template v-else>全部工具</template>
          （{{ filtered.length }}）
        </span>
        <button
          v-if="keyword || activeCat !== 'all'"
          @click="keyword = ''; activeCat = 'all'"
          class="text-blue-600 dark:text-blue-400 hover:underline"
        >清除筛选</button>
      </div>

      <!-- Grid 网格布局 -->
      <div v-if="filtered.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <ToolCard
          v-for="tool in filtered"
          :key="tool.id"
          :tool="tool"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="py-24 text-center text-slate-400 dark:text-slate-600">
        <div class="text-5xl mb-4">🔍</div>
        <div class="text-lg">没有找到相关工具</div>
        <div class="mt-2 text-sm">换个关键词试试，或选择其他分类</div>
      </div>
    </section>
  </div>
</template>
