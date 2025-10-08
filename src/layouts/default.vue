<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
    <Header />
    <main class="max-w-6xl mx-auto p-6">
      <slot />
    </main>
    <footer class="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-6xl mx-auto p-4 text-sm text-muted dark:text-gray-400">© ytplay — discovery for public viewers</div>
    </footer>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
</script>

<style scoped>
/* Minimal layout styling; rely on Tailwind for theming */
</style>
