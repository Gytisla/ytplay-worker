<template>
  <section id="trending" class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-semibold">Trending</h2>
        <p class="text-sm text-muted dark:text-gray-400">Popular videos gaining traction across the network.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <button class="text-sm px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300">Today</button>
        <button class="text-sm px-3 py-1 rounded-md bg-primary-600 text-white hover:bg-primary-500 transition">This week</button>
      </div>
    </div>

    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <template v-if="loading">
        <div v-for="i in 8" :key="`t-skel-${i}`" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse">
          <div class="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
        </div>
      </template>

      <template v-else>
        <article v-for="item in items" :key="item.id" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 transition transform hover:-translate-y-1 hover:shadow-lg">
          <a href="#" class="block focus:outline-none">
            <div class="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-3 overflow-hidden">
              <img :src="item.thumb" alt="" class="w-full h-full object-cover" />
            </div>
            <div class="h-4 text-sm font-semibold text-gray-900 dark:text-gray-50">{{ item.title }}</div>
            <div class="mt-2 text-xs text-muted dark:text-gray-400">{{ item.views }} • {{ item.age }}</div>
          </a>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { toRef } from 'vue'
import thumb from '~/assets/hero-thumb.svg?url'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = toRef(props, 'loading')

const items = Array.from({ length: 8 }).map((_, i) => ({
  id: `trend-${i}`,
  thumb,
  title: `Trending video ${i + 1} — watch this now`,
  views: `${Math.floor(Math.random() * 200) + 20}K views`,
  age: `${Math.floor(Math.random() * 30) + 1}h`,
}))
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
</style>
