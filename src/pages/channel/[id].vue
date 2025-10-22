<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('breadcrumb.topChannels'), to: '/top-channels' }, { label: channel?.name || t('breadcrumb.channel') }]" />

      <!-- Channel Info -->
      <section v-if="channel" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div class="flex flex-col md:flex-row gap-6">
            <img :src="channel.avatar" alt="" class="w-24 h-24 rounded-full object-cover mx-auto md:mx-0" />
            <div class="flex-1 text-center md:text-left">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ channel.name }}</h1>
                <button 
                  @click="openInYouTube"
                  class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  {{ t('channel.openInYouTube') }}
                </button>
              </div>
              <p class="text-muted dark:text-gray-400 mb-4">{{ displayDescription }}</p>
              <button 
                v-if="shouldShowDescriptionToggle"
                @click="descriptionExpanded = !descriptionExpanded"
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mb-4"
              >
                {{ descriptionExpanded ? t('channel.showLessDescription') : t('channel.showMoreDescription') }}
              </button>
              <div class="flex flex-wrap justify-center md:justify-start gap-6 text-sm mb-4">
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ channel.subs }}</span>
                  <span class="text-gray-500 dark:text-gray-400">{{ t('channel.subscribersText') }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ channel.videos }}</span>
                  <span class="text-gray-500 dark:text-gray-400">{{ t('channel.videosText') }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-gray-500 dark:text-gray-400">{{ t('channel.joined') }}</span>
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ t(`channel.timeAgo.${channel.joined.unit}_${channel.joined.count === 1 ? 'one' : 'other'}`, { count: channel.joined.count }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      <!-- Performance Analytics -->
      <section class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <!-- Header with toggle -->
          <div 
            class="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            @click="statsCollapsed = !statsCollapsed"
          >
            <h2 class="text-2xl font-semibold">{{ t('channel.performanceAnalytics') }}</h2>
            <div class="flex items-center gap-3">
              <select 
                v-model="statsPeriod" 
                @change="loadChannelStats" 
                @click.stop
                class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm" 
                :disabled="!channelStats"
              >
                <option value="7">{{ t('channel.periods.7') }}</option>
                <option value="30">{{ t('channel.periods.30') }}</option>
                <option value="90">{{ t('channel.periods.90') }}</option>
                <option value="365">{{ t('channel.periods.365') }}</option>
              </select>
              <button 
                @click.stop="statsCollapsed = !statsCollapsed"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                :aria-expanded="!statsCollapsed"
                aria-label="Toggle analytics"
              >
                <svg 
                  :class="['w-4 h-4 transition-transform duration-200', !statsCollapsed ? 'rotate-180' : '']" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Collapsible content -->
          <div class="px-6 pb-4 pt-4 analytics-content">
            <!-- Summary Cards (always visible) -->
            <div v-if="channelStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('channel.stats.subscribers') }}</div>
                <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentSubscribers) }}</div>
                <div class="text-sm" :class="channelStats.summary.subscriberChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ channelStats.summary.subscriberChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.subscriberChange) }}
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('channel.stats.totalViews') }}</div>
                <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentViews) }}</div>
                <div class="text-sm" :class="channelStats.summary.viewChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ channelStats.summary.viewChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.viewChange) }}
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('channel.stats.videos') }}</div>
                <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentVideos) }}</div>
                <div class="text-sm" :class="channelStats.summary.videoChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ channelStats.summary.videoChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.videoChange) }}
                </div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('channel.stats.avgSubscriberGain') }}</div>
                <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.avgSubscriberGain) }}</div>
                <div class="text-sm text-muted dark:text-gray-400">{{ t('channel.stats.perDay') }}</div>
              </div>
            </div>

            <!-- Loading Summary Cards -->
            <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div v-for="i in 4" :key="`summary-skeleton-${i}`" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
                <div class="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
                <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>
            </div>

            <!-- Charts (only visible when expanded) -->
            <div v-show="!statsCollapsed" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Subscriber Growth Chart -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">{{ t('channel.charts.subscriberGrowth') }}</h3>
                <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                  <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
                <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                  <div class="text-center text-muted dark:text-gray-400">
                    <div class="text-4xl mb-2">📊</div>
                    <div class="text-sm">{{ t('channel.noData') }}</div>
                  </div>
                </div>
                <div v-else class="relative h-64">
                  <canvas ref="subscriberChartRef" class="block w-full h-full" style="height:100%"></canvas>
                </div>
              </div>

              <!-- View Growth Chart -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">{{ t('channel.charts.viewGrowth') }}</h3>
                <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                  <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
                <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                  <div class="text-center text-muted dark:text-gray-400">
                    <div class="text-4xl mb-2">📈</div>
                    <div class="text-sm">{{ t('channel.noData') }}</div>
                  </div>
                </div>
                <div v-else class="relative h-64">
                  <canvas ref="viewChartRef" class="block w-full h-full" style="height:100%"></canvas>
                </div>
              </div>

              <!-- Subscriber Gains/Losses -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">{{ t('channel.charts.dailySubscriberChanges') }}</h3>
                <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                  <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-4"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
                <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-96 sm:h-64 flex items-center justify-center">
                  <div class="text-center text-muted dark:text-gray-400">
                    <div class="text-4xl mb-2">📊</div>
                    <div class="text-sm">{{ t('channel.noData') }}</div>
                  </div>
                </div>
                <div v-else class="relative h-64">
                  <canvas ref="subscriberChangeChartRef" class="block w-full h-full" style="height:100%"></canvas>
                </div>
              </div>

              <!-- View Gains -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="text-lg font-semibold mb-4">{{ t('channel.charts.dailyViewGains') }}</h3>
                <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                  <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
                <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                  <div class="text-center text-muted dark:text-gray-400">
                    <div class="text-4xl mb-2">👁️</div>
                    <div class="text-sm">{{ t('channel.noData') }}</div>
                  </div>
                </div>
                <div v-else class="relative h-64">
                  <canvas ref="viewGainChartRef" class="block w-full h-full" style="height:100%"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Videos Grid -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">{{ t('channel.videos') }}</h3>
          <div class="flex items-center gap-2">
            <button 
              @click="changeSort('new')"
              :class="[
                'text-sm px-3 py-1 rounded-md border transition',
                videoSort === 'new' 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ t('channel.sort.latest') }}
            </button>
            <button 
              @click="changeSort('popular')"
              :class="[
                'text-sm px-3 py-1 rounded-md border transition',
                videoSort === 'popular' 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ t('channel.sort.popular') }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 12" :key="`vid-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="videos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <VideoCard
            v-for="video in videos"
            :key="video.id"
            :video="{
              id: video.id,
              slug: video.slug,
              title: video.title,
              thumb: video.thumbnail,
              duration: video.duration,
              channel: channel?.name || 'Unknown',
              channelThumb: channel?.avatar,
              channelSlug: channel?.slug,
              channelId: channel?.id,
              views: video.views,
              age: video.age,
              category: video.category,
              live_broadcast_content: video.live_broadcast_content
            }"
          />
        </div>

        <!-- Loading more indicator -->
        <div v-if="loadingMore" class="flex justify-center py-8">
          <div class="flex items-center gap-2 text-muted dark:text-gray-400">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
            <span class="text-sm">{{ t('channel.loading.moreVideos') }}</span>
          </div>
        </div>

        <!-- No more videos indicator -->
        <div v-else-if="videos.length > 0 && !hasMoreVideos" class="text-center py-8">
          <p class="text-sm text-muted dark:text-gray-400">{{ t('channel.messages.endOfList') }}</p>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">{{ t('channel.messages.noVideos') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
)

const route = useRoute()
const channelId = route.params['id'] as string

// ensure useHead is recognized (Nuxt auto-imported in most files)
declare const useHead: any
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string }

const { t } = useI18n()

// Channel data
const channel = ref<any>(null)
const videos = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Pagination state
const videosOffset = ref(0)
const videosLimit = 24
const loadingMore = ref(false)
const hasMoreVideos = ref(true)

// Sort state
const videoSort = ref<'new' | 'popular'>('new')

// Stats data
const channelStats = ref<any>(null)
const statsPeriod = ref('30')
const statsCollapsed = ref(true) // Start collapsed by default

// Description collapse state
const descriptionExpanded = ref(false)
const descriptionMaxLength = 200

// Chart refs
const subscriberChartRef = ref<HTMLCanvasElement>()
const viewChartRef = ref<HTMLCanvasElement>()
const subscriberChangeChartRef = ref<HTMLCanvasElement>()
const viewGainChartRef = ref<HTMLCanvasElement>()

// Chart instances
let subscriberChart: any = null
let viewChart: any = null
let subscriberChangeChart: any = null
let viewGainChart: any = null

// Computed properties for description display
const displayDescription = computed(() => {
  if (!channel.value?.description) return ''
  if (descriptionExpanded.value || channel.value.description.length <= descriptionMaxLength) {
    return channel.value.description
  }
  return channel.value.description.substring(0, descriptionMaxLength) + '...'
})

const shouldShowDescriptionToggle = computed(() => {
  if (!channel.value?.description) return false
  return channel.value.description.length > descriptionMaxLength
})

// Fetch channel data client-side after navigation so route change is instant
onMounted(async () => {
  await loadChannel()
  loadChannelStats()

  // Add scroll listener for infinite scrolling
  window.addEventListener('scroll', handleScroll)

  // If stats are already present, render charts
  if (channelStats.value) {
    updateCharts()
  }
})

// Watch for channelStats changes and update charts
watch(channelStats, (newStats) => {
  if (newStats) {
    nextTick(() => updateCharts())
  }
})

// Reload data when the route id changes (client-side nav between channels)
watch(() => route.params['id'], (newId, oldId) => {
  if (newId === oldId) return
  channel.value = null
  channelStats.value = null
  videos.value = []
  loading.value = true
  videosOffset.value = 0
  hasMoreVideos.value = true
  // kick off loads (don't await)
  loadChannel()
  loadChannelStats()
})

// Cleanup charts and scroll listener on unmount
onBeforeUnmount(() => {
  if (subscriberChart) subscriberChart.destroy()
  if (viewChart) viewChart.destroy()
  if (subscriberChangeChart) subscriberChangeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()

  window.removeEventListener('scroll', handleScroll)
})

function handleScroll() {
  if (loadingMore.value || !hasMoreVideos.value) return

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // Load more when user is within 200px of the bottom
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadVideos()
  }
}

async function loadChannel() {
  try {
    loading.value = true
    const id = route.params['id'] as string

    // Load channel info (works with both UUID and slug)
    const channelData = await $fetch(`/api/public/channel/${id}`)
    channel.value = channelData

    // Load initial videos
    await loadVideos(true)

  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading channel:', err)
  } finally {
    loading.value = false
  }
}

async function loadVideos(initial = false) {
  if (initial) {
    videosOffset.value = 0
    hasMoreVideos.value = true
  }

  if (!hasMoreVideos.value || loadingMore.value) return

  try {
    loadingMore.value = true

    const id = route.params['id'] as string
    const response = await $fetch(`/api/public/channel/${id}/videos`, {
      query: {
        limit: videosLimit,
        offset: videosOffset.value,
        sort: videoSort.value
      }
    }) as { videos: any[], hasMore: boolean }

    if (initial) {
      videos.value = response.videos
    } else {
      videos.value.push(...response.videos)
    }

    hasMoreVideos.value = response.hasMore
    videosOffset.value += response.videos.length

  } catch (err: any) {
    console.error('Error loading videos:', err)
  } finally {
    loadingMore.value = false
  }
}

async function loadChannelStats() {
  try {
    const id = route.params['id'] as string
    const statsData = await $fetch(`/api/public/channel/${id}/stats`, {
      query: { days: statsPeriod.value }
    })
    channelStats.value = statsData

    // Update charts after data loads
    await nextTick()
    updateCharts()

  } catch (err: any) {
    console.error('Error loading channel stats:', err)
    // Set empty stats on error so UI shows properly
    channelStats.value = { channelId, days: parseInt(statsPeriod.value), stats: [], summary: null }
  }
}

async function changeSort(sort: 'new' | 'popular') {
  if (videoSort.value === sort) return // No change needed

  videoSort.value = sort
  await loadVideos(true) // Reset and reload with new sort
}

function openInYouTube() {
  if (channel.value?.youtubeId) {
    window.open(`https://www.youtube.com/channel/${channel.value.youtubeId}`, '_blank')
  }
}

function updateCharts() {
  if (!channelStats.value) {
    return
  }

  const stats = channelStats.value.stats || []
  const labels = stats.length > 0
    ? stats.map((s: any) => new Date(s.date).toLocaleDateString())
    : ['No data available']


  // Destroy existing charts
  if (subscriberChart) subscriberChart.destroy()
  if (viewChart) viewChart.destroy()
  if (subscriberChangeChart) subscriberChangeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()

  // Subscriber growth chart
  if (subscriberChartRef.value) {
    subscriberChart = new ChartJS(subscriberChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Subscribers',
          data: stats.length > 0 ? stats.map((s: any) => s.subscribers) : [0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }

  // View growth chart
  if (viewChartRef.value) {
    viewChart = new ChartJS(viewChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total Views',
          data: stats.length > 0 ? stats.map((s: any) => s.views) : [0],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }

  // Subscriber change chart
  if (subscriberChangeChartRef.value) {
    subscriberChangeChart = new ChartJS(subscriberChangeChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('channel.charts.gained'),
          data: stats.length > 0 ? stats.map((s: any) => Math.max(0, s.subscriberGained)) : [0],
          backgroundColor: 'rgba(16, 185, 129, 0.7)'
        }, {
          label: t('channel.charts.lost'),
          data: stats.length > 0 ? stats.map((s: any) => Math.max(0, -s.subscriberLost)) : [0],
          backgroundColor: 'rgba(239, 68, 68, 0.7)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' as const }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }

  // View gain chart
  if (viewGainChartRef.value) {
    viewGainChart = new ChartJS(viewGainChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('channel.charts.dailyViews'),
          data: stats.length > 0 ? stats.map((s: any) => s.viewGained) : [0],
          backgroundColor: 'rgba(59, 130, 246, 0.7)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }
}

function formatNumber(num: number): string {
  if (num === null || num === undefined) {
    return '0'
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// Meta tags
useHead({
  title: () => channel.value ? `${channel.value.name} - YTPlay.lt` : 'Channel - YTPlay.lt'
})

</script>

<style scoped>
/* Smooth transition for the collapsible analytics section */
.analytics-content {
  transition: all 0.3s ease-in-out;
}

/* Custom scrollbar for better UX */
.analytics-content::-webkit-scrollbar {
  width: 6px;
}

.analytics-content::-webkit-scrollbar-track {
  background: transparent;
}

.analytics-content::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.analytics-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark .analytics-content::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .analytics-content::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>