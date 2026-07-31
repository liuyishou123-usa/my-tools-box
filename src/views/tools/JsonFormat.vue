<script setup>
/**
 * JSON 格式化与压缩工具（纯前端）
 *  - 一键美化：2 空格缩进 + 语法高亮
 *  - 一键压缩：去除所有空白
 *  - 一键复制：复制纯文本结果
 *  - 校验：错误信息 + 行/列定位
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const input = ref('')
const output = ref('')
const errorMsg = ref('')
const stats = ref(null)

// ---------- JSON 语法高亮（输出区展示用） ----------
// 注意：高亮用内联 style，避免 Tailwind 动态类扫描问题
function highlightJson(text) {
  if (!text) return ''
  const esc = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = '#f59e0b' // number
      if (match.startsWith('"')) {
        // 以冒号结尾的是 key，否则是字符串值
        color = /:\s*$/.test(match) ? '#0ea5e9' : '#10b981'
      } else if (/true|false/.test(match)) {
        color = '#a855f7'
      } else if (/null/.test(match)) {
        color = '#94a3b8'
      }
      return `<span style="color:${color}">${match}</span>`
    }
  )
}

const highlighted = computed(() => highlightJson(output.value))

// ---------- 核心逻辑 ----------
function doFormat(compact = false) {
  errorMsg.value = ''
  stats.value = null
  const raw = input.value.trim()
  if (!raw) {
    output.value = ''
    return
  }
  try {
    const obj = JSON.parse(raw)
    output.value = compact
      ? JSON.stringify(obj)
      : JSON.stringify(obj, null, 2)
    const bytes = new Blob([output.value]).size
    stats.value = {
      lines: output.value.split('\n').length,
      bytes,
      keys: countKeys(obj),
    }
  } catch (e) {
    errorMsg.value = e.message || 'JSON 解析失败'
    const m = e.message?.match(/position (\d+)/)
    if (m) {
      const pos = Number(m[1])
      const before = raw.slice(0, pos)
      const line = before.split('\n').length
      const col = pos - before.lastIndexOf('\n')
      errorMsg.value += `（第 ${line} 行，第 ${col} 列）`
    }
    output.value = ''
  }
}

function countKeys(obj) {
  if (Array.isArray(obj)) return obj.reduce((s, v) => s + (typeof v === 'object' && v !== null ? countKeys(v) : 0), 0)
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).length + Object.values(obj).reduce((s, v) => s + (typeof v === 'object' && v !== null ? countKeys(v) : 0), 0)
  }
  return 0
}

// ---------- 一键复制 ----------
async function copyOutput() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    alert('✅ 已复制到剪贴板')
  } catch (e) {
    // 降级方案：临时 textarea 选中复制
    const ta = document.createElement('textarea')
    ta.value = output.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    alert('✅ 已复制到剪贴板')
  }
}

function downloadOutput() {
  if (!output.value) return
  const blob = new Blob([output.value], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
  stats.value = null
}

function loadSample() {
  input.value = JSON.stringify(
    { name: '数字工具箱', version: '1.0', features: ['图片转换', 'JSON 格式化', 'Base64'], enabled: true, count: 3 },
    null, 2
  )
  doFormat()
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <button
      @click="router.push('/')"
      class="mb-6 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <h1 class="text-2xl font-bold mb-1">🧾 JSON 格式化与压缩</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">美化高亮 / 压缩 / 校验 / 一键复制 · 纯本地处理</p>

    <div class="grid md:grid-cols-2 gap-5">
      <!-- 输入区 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-xs font-medium text-slate-500">输入</span>
          <button @click="loadSample" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">示例</button>
        </div>
        <textarea
          v-model="input"
          spellcheck="false"
          placeholder='粘贴 JSON 文本，如 {"key": "value"}'
          class="w-full h-96 p-4 bg-transparent outline-none resize-none font-mono text-sm leading-6"
        ></textarea>
      </div>

      <!-- 输出区：高亮渲染层 + 隐藏 textarea 保证复制纯文本 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <span class="text-xs font-medium text-slate-500">
            输出
            <span v-if="stats" class="ml-2 text-slate-400">{{ stats.lines }} 行 · {{ (stats.bytes / 1024).toFixed(1) }} KB · {{ stats.keys }} 个键</span>
          </span>
          <div class="flex gap-3">
            <button v-if="output" @click="copyOutput" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">一键复制</button>
            <button v-if="output" @click="downloadOutput" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">下载</button>
          </div>
        </div>
        <!-- 高亮展示 -->
        <pre v-if="output" class="w-full h-96 p-4 overflow-auto font-mono text-sm leading-6" v-html="highlighted"></pre>
        <!-- 空状态 -->
        <div v-else class="w-full h-96 p-4 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm">
          格式化结果将显示在这里
        </div>
        <!-- 隐藏 textarea 用于复制纯文本 -->
        <textarea v-show="false" :value="output"></textarea>
      </div>
    </div>

    <p v-if="errorMsg" class="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">❌ {{ errorMsg }}</p>

    <div class="mt-5 flex flex-wrap gap-3">
      <button
        @click="doFormat(false)"
        class="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
      >✨ 美化高亮</button>
      <button
        @click="doFormat(true)"
        class="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
      >🗜️ 一键压缩</button>
      <button
        @click="copyOutput"
        :disabled="!output"
        class="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition"
      >📋 一键复制</button>
      <button
        @click="clearAll"
        class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 transition"
      >🗑️ 清空</button>
    </div>
  </div>
</template>
