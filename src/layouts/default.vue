<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
    <Header />
    <main class="max-w-6xl mx-auto px-6">
      <slot />
    </main>
    <Footer />
    <CookieConsent />
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
import CookieConsent from '~/components/CookieConsent.vue'
</script>

<style scoped>
/* Minimal layout styling; rely on Tailwind for theming */
</style>
