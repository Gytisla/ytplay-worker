import { ref, onMounted, nextTick, readonly } from 'vue'

export function usePriorityLoading(
  priority: number,
  loadFunction: () => Promise<void> | void,
  options: { delay?: number } = {}
) {
  const isLoaded = ref(false)
  const isLoading = ref(false)

  const load = async () => {
    if (isLoaded.value || isLoading.value) return

    try {
      isLoading.value = true

      // Add delay based on priority (higher priority = less delay)
      const delay = options.delay || Math.max(0, (priority - 1) * 500) // 0ms for priority 1, 500ms for priority 2, 1000ms for priority 3, etc.

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      await loadFunction()
      isLoaded.value = true
    } catch (error) {
      console.error('Error in priority load:', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    // Load immediately on mount with priority-based delay
    nextTick(() => {
      load()
    })
  })

  return {
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    load
  }
}