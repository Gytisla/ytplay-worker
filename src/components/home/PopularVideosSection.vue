<template>
  <!-- Only render if has videos -->
  <div v-if="videos && videos.length > 0" class="popular-videos-section">
    <!-- Videos Grid -->
    <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
      />
    </div>

    <!-- CTA Button -->
    <div class="mt-6 text-center">
      <NuxtLink
        :to="`/trending?period=${props.period}`"
        class="inline-flex items-center gap-2 px-6 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 group"
      >
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        {{ getCtaText() }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import VideoCardSkeleton from '~/components/VideoCardSkeleton.vue'

const props = defineProps<{
  period: 'today' | '7' | '30'
  videos?: any[]
}>()

// Get CTA text based on period
function getCtaText() {
  switch (props.period) {
    case 'today':
      return 'Žiūrėti daugiau populiarių šiandien'
    case '7':
      return 'Žiūrėti daugiau populiarių šią savaitę'
    case '30':
      return 'Žiūrėti daugiau populiarių šį mėnesį'
    default:
      return 'Žiūrėti daugiau'
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>