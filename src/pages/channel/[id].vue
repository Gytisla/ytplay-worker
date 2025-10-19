<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: 'Channels', to: '/top-channels' }, { label: channel?.name || 'Channel' }]" />

      <!-- Channel Info -->
      <section v-if="channel" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div class="flex flex-col md:flex-row gap-6">
            <img :src="channel.avatar" alt="" class="w-24 h-24 rounded-full object-cover mx-auto md:mx-0" />
            <div class="flex-1 text-center md:text-left">
              <div class="flex items-center justify-between mb-2">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ channel.name }}</h1>
                <button 
                  @click="openInYouTube"
                  class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Open in YouTube
                </button>
              </div>
              <p class="text-muted dark:text-gray-400 mb-4">{{ channel.description || 'No description available' }}</p>
              <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm mb-4">
                <span class="text-muted dark:text-gray-400">{{ channel.subs }} subscribers</span>
                <span class="text-muted dark:text-gray-400">{{ channel.videos }} videos</span>
                <span class="text-muted dark:text-gray-400">Joined {{ channel.joined }}</span>
              </div>
            </div>
          </div>
        </div>
      <!-- Performance Analytics -->
      <section class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold">Performance Analytics</h2>
            <select v-model="statsPeriod" @change="loadChannelStats" class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm" :disabled="!channelStats">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <!-- Summary Cards -->
          <div v-if="channelStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Subscribers</div>
              <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentSubscribers) }}</div>
              <div class="text-sm" :class="channelStats.summary.subscriberChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ channelStats.summary.subscriberChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.subscriberChange) }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Total Views</div>
              <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentViews) }}</div>
              <div class="text-sm" :class="channelStats.summary.viewChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ channelStats.summary.viewChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.viewChange) }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Videos</div>
              <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.currentVideos) }}</div>
              <div class="text-sm" :class="channelStats.summary.videoChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ channelStats.summary.videoChange >= 0 ? '+' : '' }}{{ formatNumber(channelStats.summary.videoChange) }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Avg Subscriber Gain</div>
              <div class="text-2xl font-bold">{{ formatNumber(channelStats.summary.avgSubscriberGain) }}</div>
              <div class="text-sm text-muted dark:text-gray-400">per day</div>
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

          <!-- Charts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Subscriber Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Subscriber Growth</h3>
              <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📊</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="subscriberChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- View Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">View Growth</h3>
              <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📈</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Subscriber Gains/Losses -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Daily Subscriber Changes</h3>
              <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📊</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="subscriberChangeChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- View Gains -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">Daily View Gains</h3>
              <div v-if="!channelStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="channelStats && (!channelStats.stats || channelStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">👁️</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewGainChartRef" class="w-full h-full"></canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Videos Grid -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Videos</h3>
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
              Latest
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
              Popular
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
          <article v-for="video in videos" :key="video.id" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer" @click="navigateToVideo(video.slug || video.id)">
            <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <img :src="video.thumbnail" :alt="video.title" class="w-full h-full object-cover group-hover:scale-105 transition" />
              <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {{ video.duration }}
              </div>
            </div>
            <div class="p-4">
              <h4 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h4>
              <div class="flex items-center justify-between text-sm text-muted dark:text-gray-400">
                <span>{{ video.views }} views</span>
                <span>{{ video.uploaded }}</span>
              </div>
            </div>
          </article>
        </div>

        <!-- Loading more indicator -->
        <div v-if="loadingMore" class="flex justify-center py-8">
          <div class="flex items-center gap-2 text-muted dark:text-gray-400">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
            <span class="text-sm">Loading more videos...</span>
          </div>
        </div>

        <!-- No more videos indicator -->
        <div v-else-if="videos.length > 0 && !hasMoreVideos" class="text-center py-8">
          <p class="text-sm text-muted dark:text-gray-400">You've reached the end of the video list</p>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">No videos found for this channel.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
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
const channelId = route.params.id as string

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

// Load channel data
await loadChannel()
await loadChannelStats()

// Ensure charts are updated after everything is mounted
onMounted(() => {
  if (channelStats.value) {
    updateCharts()
  }

  // Add scroll listener for infinite scrolling
  window.addEventListener('scroll', handleScroll)
})

// Watch for channelStats changes and update charts
watch(channelStats, (newStats) => {
  if (newStats) {
    nextTick(() => updateCharts())
  }
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
    console.log('Loading channel:', channelId)

    // Load channel info (works with both UUID and slug)
    const channelData = await $fetch(`/api/public/channel/${channelId}`)
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

    const response = await $fetch(`/api/public/channel/${channelId}/videos`, {
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
    console.log('Loading channel stats for period:', statsPeriod.value)
    const statsData = await $fetch(`/api/public/channel/${channelId}/stats`, {
      query: { days: statsPeriod.value }
    })
    console.log('Received stats data:', statsData)
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

function navigateToVideo(videoId: string) {
  navigateTo(`/video/${videoId}`)
}

function updateCharts() {
  console.log('updateCharts called with channelStats:', channelStats.value)
  if (!channelStats.value) {
    console.log('No channelStats, returning')
    return
  }

  const stats = channelStats.value.stats || []
  console.log('Stats array length:', stats.length)
  const labels = stats.length > 0
    ? stats.map((s: any) => new Date(s.date).toLocaleDateString())
    : ['No data available']

  console.log('Chart labels:', labels)

  // Destroy existing charts
  if (subscriberChart) subscriberChart.destroy()
  if (viewChart) viewChart.destroy()
  if (subscriberChangeChart) subscriberChangeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()

  // Subscriber growth chart
  if (subscriberChartRef.value) {
    console.log('Creating subscriber chart with canvas:', subscriberChartRef.value)
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
          label: 'Gained',
          data: stats.length > 0 ? stats.map((s: any) => Math.max(0, s.subscriberGained)) : [0],
          backgroundColor: 'rgba(16, 185, 129, 0.7)'
        }, {
          label: 'Lost',
          data: stats.length > 0 ? stats.map((s: any) => Math.max(0, -s.subscriberLost)) : [0],
          backgroundColor: 'rgba(239, 68, 68, 0.7)'
        }]
      },
      options: {
        responsive: true,
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
          label: 'Daily Views',
          data: stats.length > 0 ? stats.map((s: any) => s.viewGained) : [0],
          backgroundColor: 'rgba(59, 130, 246, 0.7)'
        }]
      },
      options: {
        responsive: true,
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
  title: () => channel.value ? `${channel.value.name} - YouTube Player` : 'Channel - YouTube Player'
})
</script>

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