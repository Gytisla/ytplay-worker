<template>
  <footer class="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <div class="max-w-6xl mx-auto p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-md bg-primary-600 flex items-center justify-center text-white font-bold">YT</div>
          <div>
            <div class="text-lg font-semibold">ytplay</div>
            <div class="text-sm text-muted dark:text-gray-400">Discover videos & channels</div>
          </div>
        </div>
        <p class="text-sm text-muted dark:text-gray-400 max-w-sm">A small discovery front-end for exploring new and trending videos across the web. Fast, privacy-friendly, and beautiful.</p>
      </div>

      <div class="flex gap-8 md:gap-12">
        <div>
          <h4 class="text-sm font-semibold mb-3">Explore</h4>
          <ul class="space-y-2 text-sm text-muted dark:text-gray-400">
            <li><a class="hover:underline" href="#new">New</a></li>
            <li><a class="hover:underline" href="#trending">Trending</a></li>
            <li><a class="hover:underline" href="#top">Top Charts</a></li>
            <li><a class="hover:underline" href="#channels">Top Channels</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-sm font-semibold mb-3">Resources</h4>
          <ul class="space-y-2 text-sm text-muted dark:text-gray-400">
            <li><a class="hover:underline" href="/about">About</a></li>
            <li><a class="hover:underline" href="/privacy">Privacy</a></li>
            <li><a class="hover:underline" href="/terms">Terms</a></li>
          </ul>
        </div>
      </div>

      <div class="md:col-span-1">
        <h4 class="text-sm font-semibold mb-3">Stay in the loop</h4>
        <p class="text-sm text-muted dark:text-gray-400 mb-3">Subscribe to a short monthly update about top videos and channels.</p>
        <form class="flex gap-2" @submit.prevent>
          <input aria-label="Email" type="email" placeholder="you@example.com" class="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <button class="px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition">Subscribe</button>
        </form>
        <div class="mt-4 text-xs text-muted dark:text-gray-500">© ytplay — discovery for public viewers</div>
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
