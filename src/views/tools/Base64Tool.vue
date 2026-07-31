<script setup>
/**
 * Base64 / URL 编解码工具（纯前端）
 *  - 四种模式：Base64 编码 / Base64 解码 / URL 编码 / URL 解码
 *  - Base64 支持 Unicode（中文/emoji）——先 UTF-8 再 Base64
 *  - 实时转换：输入即转，一键复制
 */
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const MODES = [
  { id: 'b64e', label: '🔒 Base64 编码', desc: '文本 → Base64（UTF-8 安全）' },
  { id: 'b64d', label: '🔓 Base64 解码', desc: 'Base64 → 文本' },
  { id: 'urle', label: '🔗 URL 编码', desc: '文本 → URL 安全编码' },
  { id: 'urld', label: '🔓 URL 解码', desc: 'URL 编码 → 文本' },
]

const mode = ref('b64e')
const input = ref('')
const output = ref('')
const errorMsg = ref('')

// UTF-8 安全的 Base64 编码（避免 btoa 对中文抛异常）
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

// Base64 → UTF-8 解码（兼容含换行的 Base64）
function base64ToUtf8(b64) {
  const clean = b64.replace(/\s+/g, '')
  const bin = atob(clean)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function convert() {
  errorMsg.value = ''
  const raw = input.value
  if (!raw) { output.value = ''; return }
  try {
    switch (mode.value) {
      case 'b64e':
        output.value = utf8ToBase64(raw)
        break
      case 'b64d':
        output.value = base64ToUtf8(raw)
        break
      case 'urle':
        // encodeURIComponent 编码所有特殊字符（含中文）
        output.value = encodeURIComponent(raw)
        break
      case 'urld':
        output.value = decodeURIComponent(raw)
        break
    }
  } catch (e) {
    errorMsg.value = (mode.value === 'b64d')
      ? '解码失败：输入不是有效的 Base64 字符串'
      : (mode.value === 'urld'
        ? '解码失败：URL 编码格式不正确（可能含未转义字符）'
        : '处理失败：' + e.message)
    output.value = ''
  }
}

watch([input, mode], convert)

async function copyOutput() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    alert('✅ 已复制到剪贴板')
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = output.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    alert('✅ 已复制到剪贴板')
  }
}

function swap() {
  input.value = output.value || input.value
  // 同类型互切（b64e↔b64d, urle↔urld）
  mode.value = mode.value === 'b64e' ? 'b64d'
    : mode.value === 'b64d' ? 'b64e'
    : mode.value === 'urle' ? 'urld' : 'urle'
}

function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
}

const currentDesc = () => MODES.find(m => m.id === mode.value)?.desc || ''
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <button
      @click="router.push('/')"
      class="mb-6 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <h1 class="text-2xl font-bold mb-1">🔡 Base64 / URL 编解码</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Base64 与 URL 编码互转 · 支持中文/emoji · 输入即转</p>

    <!-- 模式切换 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="m in MODES"
        :key="m.id"
        @click="mode = m.id"
        class="px-4 py-2 rounded-xl text-sm font-medium transition"
        :class="mode === m.id
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
      >{{ m.label }}</button>
    </div>

    <p class="text-xs text-slate-400 dark:text-slate-500 mb-5">{{ currentDesc() }}</p>

    <div class="grid md:grid-cols-2 gap-5">
      <!-- 输入 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
          <span class="text-xs font-medium text-slate-500">输入</span>
          <span class="text-xs text-slate-400">{{ input.length }} 字符</span>
        </div>
        <textarea
          v-model="input"
          spellcheck="false"
          :placeholder="mode === 'b64e' ? '输入要编码的文本，支持中文…' : mode === 'b64d' ? '输入 Base64 字符串…' : mode === 'urle' ? '输入要编码的文本…' : '输入 URL 编码…'"
          class="w-full h-72 p-4 bg-transparent outline-none resize-none font-mono text-sm leading-6"
        ></textarea>
      </div>

      <!-- 输出 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
          <span class="text-xs font-medium text-slate-500">结果</span>
          <button v-if="output" @click="copyOutput" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">一键复制</button>
        </div>
        <textarea
          :value="output"
          readonly
          spellcheck="false"
          placeholder="结果将实时显示在这里"
          class="w-full h-72 p-4 bg-transparent outline-none resize-none font-mono text-sm leading-6 text-slate-700 dark:text-slate-300"
        ></textarea>
      </div>
    </div>

    <p v-if="errorMsg" class="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">❌ {{ errorMsg }}</p>

    <div class="mt-5 flex gap-3">
      <button
        @click="swap"
        class="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
      >🔄 交换方向</button>
      <button
        @click="clearAll"
        class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 transition"
      >🗑️ 清空</button>
    </div>
  </div>
</template>
