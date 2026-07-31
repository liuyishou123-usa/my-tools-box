<script setup>
/**
 * 全局 Toast 提示组件
 * 顶部居中弹出，3.5 秒自动消失，用于友好错误/成功提示
 */
import { toastState, toastIcon, toastStyle } from '../utils/globalError'
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-4"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 -translate-y-4"
  >
    <div
      v-if="toastState.visible"
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-[90vw]"
      role="alert"
    >
      <div
        class="flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium"
        :class="toastStyle(toastState.type)"
      >
        <span>{{ toastIcon(toastState.type) }}</span>
        <span>{{ toastState.message }}</span>
        <button
          class="ml-2 opacity-70 hover:opacity-100 text-base leading-none"
          @click="toastState.visible = false"
        >✕</button>
      </div>
    </div>
  </Transition>
</template>
