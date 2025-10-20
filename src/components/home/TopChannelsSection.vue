<template>
  <section ref="sectionRef" id="top-channels">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{{ t('home.sections.topChannels.title') }}</h2>
      <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.topChannels.description') }}</p>
    </div>

    <div class="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <ClientOnly>
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
        </template>
        <template #fallback>
          <div v-for="i in 8" :key="`ch-fallback-${i}`" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/4 rounded"></div>
            </div>
          </div>
        </template>
      </ClientOnly>
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
        <span>{{ t('home.cta.viewAllChannels', 'View All Channels') }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useLazyLoadOnIntersection } from '../../composables/useLazyLoadOnIntersection'

const { t } = useI18n()

// Use a simple static path as a safe fallback for the bundled SVG asset
// avoid TypeScript import issues for image modules in this environment.
const avatar = '/assets/hero-thumb.svg'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = toRef(props, 'loading')

// Ref for intersection observer
const sectionRef = ref<HTMLElement | null>(null)

// Real data state
const channels = ref<Array<any>>([])
const localLoading = ref(true)
const error = ref<string | null>(null)

// Lazy load on intersection
const { isLoaded } = useLazyLoadOnIntersection(sectionRef, loadTopChannels, { delay: 300 })

async function loadTopChannels() {
  try {
    localLoading.value = true

    const data = await $fetch('/api/public/discovery', {
      query: { section: 'channels', limit: 8 }
    }) as { channels: any[] }

    channels.value = (data.channels || []).map((ch: any) => ({
      id: ch.id,
      slug: ch.slug,
      avatar: ch.avatar || avatar,
      name: ch.name,
      subs: ch.subs,
      recent: ch.recent,
    }))
  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading top channels:', err)
    // Fallback to placeholder items on error
    channels.value = Array.from({ length: 8 }).map((_, i) => ({
      id: `ch-${i}`,
      avatar,
      name: `Channel ${i + 1}`,
      subs: `${Math.floor(Math.random() * 10) + 1}M`,
      recent: Math.floor(Math.random() * 50) + 1,
    }))
  } finally {
    localLoading.value = false
  }
}
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>
