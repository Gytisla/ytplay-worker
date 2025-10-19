<template>
  <footer class="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <div class="max-w-6xl mx-auto p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <img 
            src="/assets/logo.png" 
            alt="YTPlay.lt" 
            class="h-12 w-auto"
          />
          <div>
            <div class="text-lg font-semibold">{{ $t('footer.brandLine1') }}</div>
            <div class="text-sm text-muted dark:text-gray-400">{{ $t('footer.brandLine2') }}</div>
          </div>
        </div>
        <p class="text-sm text-muted dark:text-gray-400 max-w-sm">{{ $t('footer.tagline') }}</p>
      </div>

      <div class="flex gap-8 md:gap-12">
        <div>
          <h4 class="text-sm font-semibold mb-3">{{ $t('footer.explore') }}</h4>
          <ul class="space-y-2 text-sm text-muted dark:text-gray-400">
            <li><NuxtLink class="hover:underline" to="/">{{ $t('footer.exploreLinks.new') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/">{{ $t('footer.exploreLinks.trending') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/top-videos">{{ $t('footer.exploreLinks.top') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/top-channels">{{ $t('footer.exploreLinks.channels') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/submit-channel">{{ $t('footer.exploreLinks.submitChannel') }}</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4 class="text-sm font-semibold mb-3">{{ $t('footer.resources') }}</h4>
          <ul class="space-y-2 text-sm text-muted dark:text-gray-400">
            <li><NuxtLink class="hover:underline" to="/about">{{ $t('footer.resourcesLinks.about') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/privacy">{{ $t('footer.resourcesLinks.privacy') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/terms">{{ $t('footer.resourcesLinks.terms') }}</NuxtLink></li>
            <li><NuxtLink class="hover:underline" to="/about#contact">{{ $t('footer.resourcesLinks.contact') }}</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="md:col-span-1">
        <h4 class="text-sm font-semibold mb-3">{{ $t('footer.stayInLoop') }}</h4>
        <p class="text-sm text-muted dark:text-gray-400 mb-3">{{ $t('footer.subscribeText') }}</p>
        <div class="flex gap-2">
          <div class="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-muted dark:text-gray-400 flex items-center">
            {{ $t('footer.comingSoon') }}
          </div>
          <button disabled class="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-semibold cursor-not-allowed">{{ $t('footer.subscribe') }}</button>
        </div>
        <div class="mt-4 text-xs text-muted dark:text-gray-500">{{ $t('footer.copyright') }}</div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Presentational footer component
</script>

<style scoped>
/* small tweak: ensure muted class works even if not available globally */
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
</style>
