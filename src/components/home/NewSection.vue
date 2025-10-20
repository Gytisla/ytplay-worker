<template>
  <section ref="sectionRef" id="new">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{{ t('home.sections.new.title') }}</h2>
      <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.new.description') }}</p>
    </div>

    <div class="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <ClientOnly>
        <template v-if="localLoading">
          <VideoCardSkeleton v-for="i in 8" :key="`skeleton-${i}`" />
        </template>
        <template v-else>
          <VideoCard
            v-for="item in items"
            :key="item.id"
            :video="item"
          />
        </template>
        <template #fallback>
          <VideoCardSkeleton v-for="i in 8" :key="`fallback-${i}`" />
        </template>
      </ClientOnly>
    </div>

    <!-- CTA Button -->
    <div v-if="!localLoading && items.length > 0" class="mt-6 text-center">
      <NuxtLink
        to="/new"
        class="inline-flex items-center gap-2 px-6 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 group"
      >
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        Žiūrėti daugiau naujų vaizdo įrašų
      </NuxtLink>
    </div>
  </section>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import VideoCard from '~/components/VideoCard.vue'
import VideoCardSkeleton from '~/components/VideoCardSkeleton.vue'
import { useLazyLoadOnIntersection } from '../../composables/useLazyLoadOnIntersection'

const { t } = useI18n()

// Use a simple static path as a safe fallback for the bundled SVG asset to
// avoid TypeScript import issues for image modules in this environment.
const thumb = '/assets/hero-thumb.svg'

const props = defineProps({
  loading: { type: Boolean, default: false },
})

// Ref for intersection observer
const sectionRef = ref<HTMLElement | null>(null)

// Real data state
const items = ref<Array<any>>([])
const localLoading = ref(true)
const error = ref<string | null>(null)

// Lazy load on intersection
const { isLoaded } = useLazyLoadOnIntersection(sectionRef, loadRecentVideos, { delay: 100, skipInitialCheck: true })

async function loadRecentVideos() {
  try {
    localLoading.value = true

    const data = await $fetch('/api/public/discovery', {
      query: { section: 'new', limit: 8 }
    }) as { items: any[] }

    items.value = (data.items || []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      thumb: item.thumb,
      title: item.title,
      channel: item.channel,
      channelSlug: item.channelSlug,
      channelId: item.channelId,
      channelThumb: item.channelThumb,
      views: item.views,
      age: item.age,
      duration: item.duration,
      category: item.category,
    }))
  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading recent videos:', err)
    // Fallback to placeholder items on error
    items.value = Array.from({ length: 8 }).map((_, i) => ({
      id: `new-${i}`,
      thumb,
      title: `Exciting new video ${i + 1}: a short, punchy title to draw attention`,
      channel: `Channel ${i + 1}`,
      channelThumb: null,
      views: `${Math.floor(Math.random() * 50) + 1}K views`,
      age: `${Math.floor(Math.random() * 12) + 1}d`,
      duration: `${Math.floor(Math.random() * 12) + 1}:0${Math.floor(Math.random() * 9)}`,
    }))
  } finally {
    localLoading.value = false
    console.log('✅ NewSection: Finished loading recent videos')
  }
}
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }

/* Small optimizations for card content */
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; -webkit-line-clamp: 2; line-clamp: 2; }
</style>
