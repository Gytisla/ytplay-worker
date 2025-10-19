<template>
  <section ref="sectionRef" id="top-channels">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{{ t('home.sections.topChannels.title') }}</h2>
      <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.topChannels.description') }}</p>
    </div>

    <div class="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
        <NuxtLink v-for="ch in channels" :key="ch.id" :to="`/channel/${ch.slug || ch.id}`" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 flex items-center gap-3 transition hover:shadow-lg hover:-translate-y-1 cursor-pointer">
          <img :src="ch.avatar" alt="" class="w-12 h-12 rounded-full object-cover" />
          <div class="flex-1">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-50">{{ ch.name }}</div>
              <div class="text-xs text-muted dark:text-gray-400">{{ ch.subs }}</div>
            </div>
            <div class="text-xs text-muted dark:text-gray-400">{{ ch.recent }} videos</div>
          </div>
          <div class="px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-primary-600">{{ t('home.sections.topChannels.view') }}</div>
        </NuxtLink>
      </template>
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
    console.log('Loading top channels...')
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
