<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
    <Header />
    <main class="max-w-6xl mx-auto px-6 pt-20">
      <slot />
    </main>
    <Footer />
    <CookieConsent />

    <!-- Back to Top Button -->
    <button
      :class="['fixed z-50 bg-primary-600/90 hover:bg-primary-700/95 active:bg-primary-700 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/10 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2', {
        'bottom-6 right-6 p-3 md:bottom-8 md:right-8 md:p-3 opacity-100 translate-y-0 scale-100 pointer-events-auto': showBackToTop,
        'bottom-6 right-6 p-3 md:bottom-8 md:right-8 md:p-3 opacity-0 translate-y-4 scale-95 pointer-events-none': !showBackToTop
      }]"
      @click="scrollToTop"
      @touchstart="handleTouchStart"
      aria-label="Scroll to top"
    >
      <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
import CookieConsent from '~/components/CookieConsent.vue'

// Back to top button state
const showBackToTop = ref(false)
const lastScrollY = ref(0)

// Scroll handler
const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  // Mobile behavior: show only when scrolling up (like header)
  if (window.innerWidth < 640) { // Mobile breakpoint
    // Show when scrolling up and past minimum threshold
    if (currentScrollY < lastScrollY.value && currentScrollY > 1600) {
      showBackToTop.value = true
    }
    // Hide when scrolling down or near top
    else if (currentScrollY > lastScrollY.value || currentScrollY < 1600) {
      showBackToTop.value = false
    }
  }
  // Desktop behavior: show after scroll threshold
  else {
    showBackToTop.value = currentScrollY > 1800
  }
  
  lastScrollY.value = currentScrollY
}

// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Touch feedback for mobile
const handleTouchStart = () => {
  // Add haptic feedback if available
  if (navigator.vibrate) {
    navigator.vibrate(10)
  }
}

// Add scroll listener on mount
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

// Remove scroll listener on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Minimal layout styling; rely on Tailwind for theming */
</style>
