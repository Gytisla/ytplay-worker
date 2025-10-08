<template>
  <section id="top-channels" class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-semibold">Top Channels</h2>
        <p class="text-sm text-muted dark:text-gray-400">Channels users are subscribing to right now.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <button class="text-sm px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300">All</button>
        <button class="text-sm px-3 py-1 rounded-md bg-primary-600 text-white hover:bg-primary-500 transition">Top</button>
      </div>
    </div>

    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <template v-if="loading">
        <div v-for="i in 8" :key="`ch-skel-${i}`" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/4 rounded"></div>
          </div>
        </div>
      </template>

      <template v-else>
        <article v-for="ch in channels" :key="ch.id" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 flex items-center gap-3 transition hover:shadow-lg hover:-translate-y-1">
          <img :src="ch.avatar" alt="" class="w-12 h-12 rounded-full object-cover" />
          <div class="flex-1">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-50">{{ ch.name }}</div>
              <div class="text-xs text-muted dark:text-gray-400">{{ ch.subs }}</div>
            </div>
            <div class="text-xs text-muted dark:text-gray-400">{{ ch.recent }} new videos</div>
          </div>
          <button class="px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-primary-600">Subscribe</button>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup>
import { toRef } from 'vue'
import avatar from '~/assets/hero-thumb.svg?url'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = toRef(props, 'loading')

const channels = Array.from({ length: 8 }).map((_, i) => ({
  id: `ch-${i}`,
  avatar,
  name: `Channel ${i + 1}`,
  subs: `${Math.floor(Math.random() * 5) + 1}M`,
  recent: Math.floor(Math.random() * 12) + 1,
}))
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>
