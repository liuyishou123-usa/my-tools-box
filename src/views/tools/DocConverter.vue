<script setup>
/**
 * 文档格式转换工具：PDF / Word / Excel 相互转换
 *  - 上传文件 → 自动识别格式 → 选择目标格式 → 后端转换 → 下载
 *  - 后端：Python + LibreOffice（独立 VPS 部署，见 backend/）
 *  - 支持转换矩阵：
 *      Word  → PDF, Excel
 *      PDF   → Word, Excel（文本型 PDF 最佳）
 *      Excel → PDF, Word
 *  - 隐私：文件仅发送到转换服务，临时文件 15 分钟内自动清理
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from '../../utils/globalError'
import { API_BASE } from '../../config'

const route = useRoute()
const router = useRouter()

// ---------- 状态 ----------
const file = ref(null)              // 选中文件
const sourceType = ref('')          // 识别出的源格式 word|pdf|excel
const targetType = ref('')          // 目标格式
const converting = ref(false)       // 转换中
const serverOk = ref(null)          // 后端健康检查：null=未检测 true=正常 false=异常
const error = ref('')
const dragged = ref(false)

// ---------- 格式定义 ----------
const FORMATS = {
  word:  { label: 'Word',  exts: ['.doc', '.docx'], color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  pdf:   { label: 'PDF',   exts: ['.pdf'],          color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
  excel: { label: 'Excel', exts: ['.xls', '.xlsx'], color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800' },
}

// 转换矩阵：源格式 → 可选目标
const CONVERSIONS = {
  word: [
    { to: 'pdf',   api: 'word2pdf',   ext: 'pdf',  mime: 'application/pdf', desc: 'Word → PDF（保持排版）' },
    { to: 'excel', api: 'word2excel', ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', desc: 'Word → Excel（提取表格/段落）' },
  ],
  pdf: [
    { to: 'word',  api: 'pdf2word',   ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'PDF → Word（文本型最佳）' },
    { to: 'excel', api: 'pdf2excel',  ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', desc: 'PDF → Excel（提取表格）' },
  ],
  excel: [
    { to: 'pdf',   api: 'xlsx2pdf',   ext: 'pdf',  mime: 'application/pdf', desc: 'Excel → PDF（保持表格）' },
    { to: 'word',  api: 'excel2word', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'Excel → Word（表格还原）' },
  ],
}

const availableTargets = computed(() => (sourceType.value ? CONVERSIONS[sourceType.value] : []))
const fileSize = computed(() => {
  if (!file.value) return ''
  const b = file.value.size
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1024 / 1024).toFixed(2) + ' MB'
})

// ---------- 文件选择 ----------
function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) selectFile(f)
  e.target.value = ''
}

function onDrop(e) {
  dragged.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) selectFile(f)
}

function selectFile(f) {
  error.value = ''
  const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()
  const type = Object.keys(FORMATS).find(k => FORMATS[k].exts.includes(ext))
  if (!type) {
    error.value = '仅支持 PDF / Word / Excel 格式'
    showToast('仅支持 PDF / Word / Excel 格式')
    return
  }
  file.value = f
  sourceType.value = type
  // 预选推荐目标（来自路由 query 或默认第一个）
  const fromQ = route.query.from
  const toQ = route.query.to
  const def = CONVERSIONS[type]?.find(c => c.to === toQ) || CONVERSIONS[type]?.[0]
  targetType.value = def ? def.to : ''
}

function reset() {
  file.value = null
  sourceType.value = ''
  targetType.value = ''
  error.value = ''
}

// ---------- 转换 ----------
async function convert(conv) {
  if (!file.value || converting.value) return
  targetType.value = conv.to
  error.value = ''
  converting.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    const res = await fetch(`${API_BASE}/api/doc/${conv.api}`, { method: 'POST', body: fd, timeout: 180000 })
    if (!res.ok) {
      let detail = `转换失败（HTTP ${res.status}）`
      try {
        const j = await res.json()
        if (j.detail) detail = j.detail
      } catch (_) { /* 非 JSON 响应 */ }
      throw new Error(detail)
    }
    const blob = await res.blob()
    // 触发下载
    const name = (file.value.name || 'document').replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}_converted.${conv.ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
    showToast(`转换完成：已下载 ${name}_converted.${conv.ext}`, 'success')
  } catch (e) {
    error.value = e.message || '转换失败'
    showToast(e.message || '转换失败，请稍后重试')
  } finally {
    converting.value = false
  }
}

// ---------- 后端健康检查 ----------
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { timeout: 8000 })
    serverOk.value = res.ok
  } catch (_) {
    serverOk.value = false
  }
})

const inputId = 'doc-file-input'
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- 返回 -->
    <button
      @click="router.push('/')"
      class="mb-6 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <h1 class="text-2xl font-bold mb-1">📄 文档格式转换</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
      PDF / Word / Excel 相互转换 · 文件仅发送至转换服务，临时文件 15 分钟内自动删除
    </p>

    <!-- 后端状态提示 -->
    <div
      v-if="serverOk === false"
      class="mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400"
    >
      ⚠️ 转换服务暂未上线（后端部署中）。代码已就绪，部署到 VPS 后即可使用。
    </div>

    <!-- ===== 上传区 ===== -->
    <div
      v-if="!file"
      class="border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition"
      :class="dragged
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'"
      @dragover.prevent="dragged = true"
      @dragleave="dragged = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <div class="text-5xl mb-4">📤</div>
      <div class="font-medium mb-1">点击或拖拽文档到此处</div>
      <div class="text-xs text-slate-400">支持 PDF / Word(.doc,.docx) / Excel(.xls,.xlsx)</div>
      <input ref="fileInput" :id="inputId" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" class="hidden" @change="onFileChange" />
    </div>

    <!-- ===== 已选文件 + 转换面板 ===== -->
    <div v-else class="space-y-6">
      <!-- 文件信息 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="text-4xl">📎</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ file.name }}</div>
            <div class="text-xs text-slate-400 mt-0.5">{{ fileSize }}</div>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold border"
            :class="FORMATS[sourceType]?.bg + ' ' + FORMATS[sourceType]?.color"
          >{{ FORMATS[sourceType]?.label }} 源文件</span>
          <button
            @click="reset"
            class="text-sm text-slate-400 hover:text-red-500 transition"
          >🗑️ 重新选择</button>
        </div>
      </div>

      <!-- 转换目标 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
        <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">选择目标格式</div>
        <div class="grid sm:grid-cols-2 gap-3">
          <button
            v-for="conv in availableTargets"
            :key="conv.to"
            :disabled="converting"
            @click="convert(conv)"
            class="group p-4 rounded-xl border-2 text-left transition"
            :class="targetType === conv.to
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm">
                {{ FORMATS[sourceType]?.label }} → {{ FORMATS[conv.to]?.label }}
              </span>
              <span v-if="converting && targetType === conv.to"
                class="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></span>
              <span v-else class="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition">→</span>
            </div>
            <div class="text-xs text-slate-400 mt-1">{{ conv.desc }}</div>
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-4 py-3">{{ error }}</p>

      <!-- 转换说明 -->
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-6">
        <strong class="text-slate-600 dark:text-slate-300">说明：</strong>
        · Word↔PDF / Excel→PDF 由 LibreOffice 服务端渲染，保持排版
        · Word→Excel 提取文档内表格，无表格时提取段落文本
        · PDF→Excel 自动识别表格结构，扫描件（纯图片）无法提取文字
        · 文件转换完成后，服务器 <code class="bg-slate-100 dark:bg-slate-800 px-1 rounded">15 分钟内自动彻底删除</code>，不留隐私
      </div>
    </div>
  </div>
</template>
