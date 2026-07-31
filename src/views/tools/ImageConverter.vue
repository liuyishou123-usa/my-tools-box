<script setup>
/**
 * 图片转换与压缩工具（纯前端 Canvas 实现，0 服务器成本）
 *  - 支持导入：JPG / PNG
 *  - 目标格式：WebP / PNG / JPG
 *  - 质量调节：WebP/JPG 有效（0-100），PNG 无损忽略
 *  - 全部在浏览器本地完成，文件不上传
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '../../utils/globalError'

const router = useRouter()

// ---------- 状态 ----------
const originalFile = ref(null)   // 原始文件
const originalUrl = ref('')      // 原图预览 URL
const originalImg = ref(null)    // 解码后的 Image 对象
const originalSize = ref(0)      // 原图字节数
const originalDim = ref('')      // 原图尺寸

const format = ref('webp')       // 目标格式
const quality = ref(80)          // 质量 0-100
const maxEdge = ref(4096)        // 最大边像素（超限等比缩放，防 canvas 崩溃）

const outputUrl = ref('')        // 输出预览 URL
const outputBlob = ref(null)     // 输出 Blob
const outputSize = ref(0)        // 输出字节数
const processing = ref(false)    // 处理中
const error = ref('')            // 错误信息
const dragged = ref(false)       // 拖拽高亮

const FORMAT_MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' }
const FORMAT_EXT = { webp: 'webp', png: 'png', jpg: 'jpg' }

// 压缩率（原图 > 0 时）
const ratio = computed(() => {
  if (!originalSize.value || !outputSize.value) return null
  return Math.round((1 - outputSize.value / originalSize.value) * 100)
})

const fmtSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 导入 ----------
function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) loadFile(file)
  e.target.value = '' // 允许重复选择同一文件
}

function onDrop(e) {
  dragged.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

async function loadFile(file) {
  error.value = ''
  // 校验类型
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    error.value = '仅支持 JPG / PNG 格式，请重新选择'
    showToast('仅支持 JPG / PNG 格式，请重新选择')
    return
  }
  originalFile.value = file
  originalSize.value = file.size

  // 释放旧预览
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)

  originalUrl.value = URL.createObjectURL(file)

  // 解码图片拿到宽高
  const img = new Image()
  img.onload = () => {
    originalImg.value = img
    originalDim.value = `${img.naturalWidth} × ${img.naturalHeight}`
    processImage()
  }
  img.onerror = () => {
    error.value = '图片解码失败，文件可能已损坏'
    showToast('文件解析失败，请检查图片格式')
  }
  img.src = originalUrl.value
}

// ---------- 核心处理：canvas 绘制 → toBlob ----------
async function processImage() {
  const img = originalImg.value
  if (!img) return
  processing.value = true
  error.value = ''
  try {
    // 计算目标尺寸：最大边不超过 maxEdge（等比缩放，超限才缩小）
    let { width, height } = img
    const max = maxEdge.value
    if (Math.max(width, height) > max) {
      const scale = max / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    // 绘制到 canvas（JPG 输出时白底填充，避免透明像素变黑）
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (format.value === 'jpg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)

    // 转 Blob：质量仅对 webp/jpg 生效
    const mime = FORMAT_MIME[format.value]
    const q = format.value === 'png' ? undefined : quality.value / 100
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, q)
    })

    if (!blob) throw new Error('转换失败：浏览器不支持 ' + format.value.toUpperCase() + ' 输出')

    // 更新输出
    if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
    outputBlob.value = blob
    outputSize.value = blob.size
    outputUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    error.value = e.message || '处理失败'
    showToast(e.message || '处理失败')
  } finally {
    processing.value = false
  }
}

// ---------- 下载 ----------
function download() {
  if (!outputBlob.value) return
  const a = document.createElement('a')
  const name = (originalFile.value?.name || 'image').replace(/\.[^.]+$/, '')
  a.href = outputUrl.value
  a.download = `${name}_converted.${FORMAT_EXT[format.value]}`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function reset() {
  originalFile.value = null
  originalImg.value = null
  originalSize.value = 0
  originalDim.value = ''
  outputBlob.value = null
  outputSize.value = 0
  error.value = ''
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
  originalUrl.value = ''
  outputUrl.value = ''
}

const inputId = 'img-file-input'
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- 返回 -->
    <button
      @click="router.push('/')"
      class="mb-6 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
    >← 返回工具箱</button>

    <h1 class="text-2xl font-bold mb-1">🖼️ 图片转换压缩</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
      JPG/PNG → WebP/PNG/JPG · 质量可调 · 全部在浏览器本地处理，文件不会上传
    </p>

    <!-- ===== 上传区 ===== -->
    <div v-if="!originalImg"
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
      <div class="font-medium mb-1">点击或拖拽图片到此处</div>
      <div class="text-xs text-slate-400">支持 JPG / PNG 格式</div>
      <input ref="fileInput" :id="inputId" type="file" accept="image/jpeg,image/png" class="hidden" @change="onFileChange" />
    </div>

    <!-- ===== 处理面板 ===== -->
    <div v-else class="grid md:grid-cols-2 gap-6">
      <!-- 左：原图 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">原图</h3>
          <div class="text-xs text-slate-400">{{ fmtSize(originalSize) }} · {{ originalDim }}</div>
        </div>
        <img :src="originalUrl" class="max-h-72 mx-auto rounded-xl object-contain" alt="原图" />
      </div>

      <!-- 右：输出预览 -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">输出预览</h3>
          <div class="text-xs" :class="ratio !== null && ratio > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'">
            <template v-if="outputSize">
              {{ fmtSize(outputSize) }}
              <span v-if="ratio !== null">（{{ ratio > 0 ? '-' : '+' }}{{ Math.abs(ratio) }}%）</span>
            </template>
            <span v-else-if="processing" class="inline-flex items-center gap-1">
              <span class="inline-block w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></span>
              处理中
            </span>
          </div>
        </div>
        <img v-if="outputUrl" :src="outputUrl" class="max-h-72 mx-auto rounded-xl object-contain" alt="输出预览" />
        <div v-else class="h-72 flex items-center justify-center text-slate-300 text-sm">等待转换...</div>
      </div>
    </div>

    <!-- ===== 参数区 ===== -->
    <div v-if="originalImg" class="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
      <div class="grid sm:grid-cols-3 gap-5">
        <!-- 目标格式 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">目标格式</label>
          <div class="flex gap-2">
            <button
              v-for="f in ['webp', 'png', 'jpg']"
              :key="f"
              @click="format = f; processImage()"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium uppercase transition"
              :class="format === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
            >{{ f }}</button>
          </div>
        </div>

        <!-- 质量 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            压缩质量
            <span v-if="format !== 'png'" class="text-blue-600 dark:text-blue-400 font-semibold">{{ quality }}%</span>
            <span v-else class="text-slate-400">（PNG 无损）</span>
          </label>
          <input
            v-model.number="quality"
            type="range" min="1" max="100"
            :disabled="format === 'png'"
            @change="processImage"
            class="w-full accent-blue-600 disabled:opacity-40"
          />
        </div>

        <!-- 最大边 -->
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">最大边长</label>
          <select
            v-model.number="maxEdge"
            @change="processImage"
            class="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none"
          >
            <option :value="2048">2048 px</option>
            <option :value="4096">4096 px</option>
            <option :value="8192">8192 px</option>
            <option :value="99999">原尺寸</option>
          </select>
        </div>
      </div>

      <!-- 错误提示 -->
      <p v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{{ error }}</p>

      <!-- 操作按钮 -->
      <div class="mt-5 flex flex-wrap gap-3">
        <button
          @click="download"
          :disabled="!outputBlob"
          class="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-blue-600/20"
        >⬇️ 下载{{ format.toUpperCase() }}</button>
        <button
          @click="processImage"
          :disabled="processing"
          class="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition"
        >🔄 重新处理</button>
        <button
          @click="reset"
          class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 transition"
        >🗑️ 清除</button>
      </div>
    </div>

    <!-- 技术说明 -->
    <div class="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-6">
      <strong class="text-slate-600 dark:text-slate-300">实现原理：</strong>
      图片通过 Canvas 在浏览器本地解码并重新编码，<code class="bg-slate-100 dark:bg-slate-800 px-1 rounded">canvas.toBlob(type, quality)</code> 输出目标格式，整个过程不经过任何服务器，隐私安全。
    </div>
  </div>
</template>
