<script setup>
/**
 * 时间戳转换工具（纯前端）
 *  - 当前时间实时显示 + 一键获取秒/毫秒时间戳
 *  - 时间戳 → 日期（自动识别秒/毫秒，显示本地/UTC/相对时间）
 *  - 日期 → 时间戳（输出秒 + 毫秒）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ---------- 当前时间 ----------
const now = ref(Date.now())
let timer = null

onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => { clearInterval(timer) })

const nowText = computed(() => {
  const d = new Date(now.value)
  return fmtDateTime(d)
})

function fmtDateTime(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function getNowTs(ms = false) {
  return ms ? String(now.value) : String(Math.floor(now.value / 1000))
}

// ---------- 时间戳 → 日期 ----------
const tsInput = ref('')
const tsResult = ref(null)
const tsError = ref('')

function parseTs(str) {
  const s = str.trim()
  if (!/^-?\d+$/.test(s)) return null
  const n = Number(s)
  // 自动判断：13 位及以上视为毫秒，10 位视为秒
  return n > 1e12 ? n : n * 1000
}

function convertTs() {
  tsError.value = ''
  tsResult.value = null
  const raw = tsInput.value
  if (!raw.trim()) return
  const ms = parseTs(raw)
  if (ms === null) {
    tsError.value = '请输入纯数字时间戳（10 位秒级 或 13 位毫秒级）'
    return
  }
  const d = new Date(ms)
  if (isNaN(d.getTime())) {
    tsError.value = '时间戳超出有效范围'
    return
  }
  tsResult.value = {
    ms,
    sec: Math.floor(ms / 1000),
    local: fmtDateTime(d),
    utc: d.toUTCString(),
    // 相对时间
    relative: calcRelative(ms),
    iso: d.toISOString(),
  }
}

function calcRelative(ms) {
  const diff = ms - Date.now()
  const abs = Math.abs(diff)
  const dir = diff >= 0 ? '后' : '前'
  const min = 60 * 1000, hour = 60 * min, day = 24 * hour
  if (abs < min) return `${Math.max(0, Math.round(abs / 1000))} 秒${dir}`
  if (abs < hour) return `${Math.round(abs / min)} 分钟${dir}`
  if (abs < day) return `${Math.round(abs / hour)} 小时${dir}`
  return `${Math.round(abs / day)} 天${dir}`
}

// ---------- 日期 → 时间戳 ----------
const dtInput = ref('')
const dtTsResult = ref(null)
const dtError = ref('')

function convertDt() {
  dtError.value = ''
  dtTsResult.value = null
  const raw = dtInput.value.trim()
  if (!raw) return
  // 支持 YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DDTHH:mm 或 YYYY-MM-DD
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) {
    dtError.value = '日期格式无效，请使用 YYYY-MM-DD HH:mm:ss'
    return
  }
  dtTsResult.value = {
    ms: d.getTime(),
    sec: Math.floor(d.getTime() / 1000),
  }
}

function setNowToTs() {
  tsInput.value = getNowTs(false)
  convertTs()
}

function setNowToDt() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  dtInput.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  convertDt()
}

async function copy(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(String(text))
    alert('✅ 已复制')
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = String(text)
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    alert('✅ 已复制')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <button
      @click="router.push('/')"
      class="mb-6 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <h1 class="text-2xl font-bold mb-1">⏱️ 时间戳转换</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">当前时间实时转换 · 时间戳 ↔ 标准日期 · 自动识别秒/毫秒</p>

    <div class="grid md:grid-cols-2 gap-5">
      <!-- ===== 当前时间 ===== -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h3 class="font-semibold text-sm mb-3">🕐 当前时间</h3>
        <div class="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 mb-4">{{ nowText }}</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="copy(getNowTs(false))"
            class="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left"
          >
            <div class="text-xs text-slate-400 mb-1">秒级时间戳</div>
            <div class="font-mono text-xs break-all">{{ getNowTs(false) }}</div>
          </button>
          <button
            @click="copy(getNowTs(true))"
            class="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left"
          >
            <div class="text-xs text-slate-400 mb-1">毫秒级时间戳</div>
            <div class="font-mono text-xs break-all">{{ getNowTs(true) }}</div>
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-3">点击卡片即可复制对应时间戳</p>
      </div>

      <!-- ===== 时间戳 → 日期 ===== -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">🔢 时间戳 → 日期</h3>
          <button @click="setNowToTs" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">填入当前</button>
        </div>
        <div class="flex gap-2 mb-3">
          <input
            v-model="tsInput"
            @keyup.enter="convertTs"
            type="text"
            placeholder="如 1700000000 或 1700000000000"
            class="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 outline-none font-mono text-sm"
          />
          <button @click="convertTs" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">转换</button>
        </div>

        <div v-if="tsResult" class="space-y-2 text-sm">
          <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span class="text-slate-400 text-xs">本地时间</span>
            <span class="font-mono">{{ tsResult.local }}</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span class="text-slate-400 text-xs">UTC 时间</span>
            <span class="font-mono text-xs">{{ tsResult.utc }}</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span class="text-slate-400 text-xs">相对时间</span>
            <span class="font-mono text-xs">{{ tsResult.relative }}</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span class="text-slate-400 text-xs">毫秒</span>
            <span class="font-mono text-xs">{{ tsResult.ms }}</span>
          </div>
        </div>
        <p v-if="tsError" class="text-sm text-red-500 mt-2">{{ tsError }}</p>
      </div>
    </div>

    <!-- ===== 日期 → 时间戳 ===== -->
    <div class="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-sm">📅 日期 → 时间戳</h3>
        <button @click="setNowToDt" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">填入当前</button>
      </div>
      <div class="flex gap-2 mb-3">
        <input
          v-model="dtInput"
          @keyup.enter="convertDt"
          type="text"
          placeholder="YYYY-MM-DD HH:mm:ss"
          class="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 outline-none font-mono text-sm"
        />
        <button @click="convertDt" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">转换</button>
      </div>

      <div v-if="dtTsResult" class="grid grid-cols-2 gap-3">
        <button
          @click="copy(dtTsResult.sec)"
          class="text-left bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <div class="text-xs text-slate-400 mb-1">秒级</div>
          <div class="font-mono text-sm">{{ dtTsResult.sec }}</div>
        </button>
        <button
          @click="copy(dtTsResult.ms)"
          class="text-left bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <div class="text-xs text-slate-400 mb-1">毫秒级</div>
          <div class="font-mono text-sm">{{ dtTsResult.ms }}</div>
        </button>
      </div>
      <p v-if="dtError" class="text-sm text-red-500 mt-2">{{ dtError }}</p>
    </div>
  </div>
</template>
