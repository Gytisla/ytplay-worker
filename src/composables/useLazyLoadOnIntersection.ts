import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useLazyLoadOnIntersection(
  elementRef: Ref<HTMLElement | null>,
  loadFunction: () => Promise<void> | void,
  options: IntersectionObserverInit & { delay?: number; skipInitialCheck?: boolean } = {}
) {
  const isLoaded = ref(false)
  const isIntersecting = ref(false)

  let observer: IntersectionObserver | null = null

  const load = async () => {
    if (isLoaded.value) return
    try {
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay))
      }
      await loadFunction()
      isLoaded.value = true
    } catch (error) {
      console.error('Error in lazy load:', error)
    }
  }

  onMounted(() => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log(`👁️ IntersectionObserver: ${entry.target.id || 'unknown'} isIntersecting=${entry.isIntersecting}, isLoaded=${isLoaded.value}`)
          if (entry.isIntersecting && !isLoaded.value) {
            isIntersecting.value = true
            load()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(elementRef.value)

    // Check if element is already visible on mount and load immediately (unless skipped)
    if (!options.skipInitialCheck) {
      const rect = elementRef.value.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0
      if (isVisible && !isLoaded.value) {
        load()
      }
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    isLoaded,
    isIntersecting,
  }
}