import { getCurrentInstance, onMounted } from 'vue'

/**
 * 顶栏搜索与页面搜索联动
 * 用法（页面内）：
 *   useAppSearch((kw) => { keyword.value = kw })
 *
 * 原理：通过当前组件实例向上查找 App 根组件，
 * 调用其 registerSearch 注册回调；顶栏输入时回调被触发。
 */
export function useAppSearch(cb) {
  const instance = getCurrentInstance()
  if (!instance) return

  onMounted(() => {
    // 向上遍历父链，找到 App 根组件（拥有 registerSearch 方法）
    let parent = instance.parent
    while (parent) {
      const ctx = parent.proxy
      if (ctx && typeof ctx.registerSearch === 'function') {
        ctx.registerSearch(cb)
        return
      }
      parent = parent.parent
    }
  })
}
