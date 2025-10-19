<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('topChannelsPage.breadcrumb') }]" />

      <!-- Title and Controls -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ t('topChannelsPage.title') }}</h1>
          <div class="flex items-center gap-2">
            <button @click="sortBy = 'subscribers'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', sortBy === 'subscribers' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600']">
              {{ t('topChannelsPage.sortBySubscribers') }}
            </button>
            <button @click="sortBy = 'views'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', sortBy === 'views' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600']">
              {{ t('topChannelsPage.sortByViews') }}
            </button>
          </div>
        </div>
        <p class="text-muted dark:text-gray-400">
          {{ sortBy === 'subscribers' ? t('topChannelsPage.descriptionSubscribers') : t('topChannelsPage.descriptionViews') }}
        </p>
      </div>

      <!-- Channels List -->
      <section>
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 10" :key="`ch-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 w-1/3 rounded mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/4 rounded"></div>
              </div>
              <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>

        <div v-else-if="channels.length > 0" class="space-y-3">
          <NuxtLink v-for="(ch, index) in channels" :key="ch.id" :to="`/channel/${ch.slug || ch.id}`" class="block bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition group">
            <div class="flex items-center gap-4">
              <!-- Ranking -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                   :class="index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'">
                {{ index + 1 }}
              </div>

              <!-- Avatar -->
              <img :src="ch.avatar" alt="" class="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-primary-300 dark:ring-primary-600 transition" />

              <!-- Channel Info -->
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-gray-50 group-hover:text-primary-600 transition">{{ ch.name }}</h3>
                <p class="text-sm text-muted dark:text-gray-400">
                  {{ sortBy === 'subscribers' ? `${ch.subs} ${t('topChannelsPage.subscribers')}` : `${ch.views} ${t('topChannelsPage.views')}` }} • {{ ch.recent }} {{ t('topChannelsPage.videos') }}
                </p>
              </div>

              <!-- Medal Icons for Top 3 -->
              <div v-if="index < 3" class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                     :class="index === 0 ? 'bg-yellow-100 dark:bg-yellow-900' :
                            index === 1 ? 'bg-gray-100 dark:bg-gray-700' :
                            'bg-orange-100 dark:bg-orange-900'">
                  <svg class="w-4 h-4" :class="index === 0 ? 'text-yellow-600' :
                                               index === 1 ? 'text-gray-600 dark:text-gray-400' :
                                               'text-orange-600'" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">{{ t('topChannelsPage.noChannelsFound') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const { t } = useI18n()

// Data state
const channels = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortBy = ref<'subscribers' | 'views'>('subscribers')

// Load channels data
await loadChannels()

// Watch for sort changes and reload
watch(sortBy, async () => {
  await loadChannels()
})

async function loadChannels() {
  try {
    loading.value = true
    console.log(`Loading top channels sorted by ${sortBy.value}...`)

    const data = await $fetch('/api/public/discovery', {
      query: { section: 'channels', limit: 50, sort: sortBy.value }
    }) as { channels: any[] }

    channels.value = (data.channels || []).map((ch: any) => ({
      id: ch.id,
      slug: ch.slug,
      avatar: ch.avatar || '/assets/hero-thumb.svg',
      name: ch.name,
      subs: ch.subs,
      views: ch.views,
      recent: ch.recent,
    }))
  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading channels:', err)
    // Fallback to placeholder items on error
    channels.value = Array.from({ length: 20 }).map((_, i) => ({
      id: `ch-${i}`,
      avatar: '/assets/hero-thumb.svg',
      name: `Channel ${i + 1}`,
      subs: `${Math.floor(Math.random() * 10) + 1}M`,
      views: `${Math.floor(Math.random() * 100) + 1}M`,
      recent: Math.floor(Math.random() * 50) + 1,
    }))
  } finally {
    loading.value = false
  }
}

// Computed property for top 3 channels
// const topChannels = computed(() => channels.value.slice(0, 3))

// Meta tags
useHead({
  title: `${t('topChannelsPage.title')} - YouTube Player`,
  meta: [
    {
      name: 'description',
      content: t('seo.topChannels.description')
    },
    // Open Graph
    {
      property: 'og:title',
      content: t('seo.topChannels.ogTitle')
    },
    {
      property: 'og:description',
      content: t('seo.topChannels.ogDescription')
    },
    {
      property: 'og:image',
      content: '/assets/hero-thumb.svg'
    },
    {
      property: 'og:url',
      content: 'https://ytplay-worker.vercel.app/top-channels'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:site_name',
      content: 'YouTube Player'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: t('seo.topChannels.ogTitle')
    },
    {
      name: 'twitter:description',
      content: t('seo.topChannels.ogDescription')
    },
    {
      name: 'twitter:image',
      content: '/assets/hero-thumb.svg'
    }
  ]
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
.ring-primary-300 { --tw-ring-color: rgb(147 197 253); }
.dark .ring-primary-600 { --tw-ring-color: rgb(37 99 235); }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  overflow: hidden;
}
</style>