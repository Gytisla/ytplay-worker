<template>
  <section id="top-channels">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Geriausi kanalai</h2>
      <p class="text-sm text-muted dark:text-gray-400">Populiariausi lietuviški YouTube kanalai pagal prenumeratorius</p>
    </div>

    <div class="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <NuxtLink v-for="ch in channels" :key="ch.id" :to="`/channel/${ch.slug || ch.id}`" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-4 transition hover:shadow-lg hover:-translate-y-1 cursor-pointer group relative">
        <img :src="ch.avatar" alt="" class="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="mb-2">
            <div class="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate" :title="ch.name">{{ ch.name }}</div>
          </div>
          <div class="flex items-center justify-between text-xs text-muted dark:text-gray-400">
            <span>{{ ch.recent }} videos</span>
            <span>{{ ch.subs }}</span>
          </div>
        </div>
        <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </NuxtLink>
    </div>

    <!-- CTA to view all channels -->
    <div class="mt-6 text-center">
      <NuxtLink
        to="/top-channels"
        class="inline-flex items-center gap-2 px-6 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 group"
      >
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        <span>Žiūrėti visus kanalus</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  channels?: any[]
}>()

// Use channels from props
const channels = computed(() => props.channels || [])
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>
