<template>
  <section id="trending">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Populiarūs vaizdo įrašai</h2>
      <p class="text-sm text-muted dark:text-gray-400">Žiūrimiausi vaizdo įrašai įkelti per pastarasias 30 dienų</p>
    </div>

    <div class="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <VideoCard
        v-for="item in videos"
        :key="item.id"
        :video="item"
        :badge="{ type: 'trending', text: 'POPULIARUS' }"
      />
    </div>

    <!-- CTA Button -->
    <div v-if="videos && videos.length > 0" class="mt-6 text-center">
      <NuxtLink
        to="/top-videos"
        class="inline-flex items-center gap-2 px-6 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 group"
      >
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        Žiūrėti geriausius vaizdo įrašus
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  videos?: any[]
}>()

// Use videos from props
const videos = computed(() => props.videos || [])
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }

/* Small optimizations for card content */
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; -webkit-line-clamp: 2; line-clamp: 2; }
</style>
