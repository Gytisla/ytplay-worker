<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: 'Videos', to: '/top-videos' }, { label: video?.title || 'Video' }]" />

      <!-- Video Player Section -->
      <section v-if="video" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <!-- Video Player -->
          <div class="aspect-video w-full mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              :src="`https://www.youtube.com/embed/${video.id}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>

          <!-- Video Info -->
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{{ video.title }}</h1>
              <div class="flex items-center gap-4 text-sm text-muted dark:text-gray-400 mb-4">
                <span>{{ video.views }} views</span>
                <span v-if="video.duration">{{ video.duration }}</span>
                <span>{{ video.uploaded }}</span>
              </div>
              <button
                @click="openVideoInYouTube"
                class="inline-flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition font-medium text-sm mb-4"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Open in YouTube
              </button>
              <div class="text-gray-700 dark:text-gray-300 leading-relaxed">
                <p v-html="displayDescription"></p>
              </div>
            </div>

            <!-- Channel Info -->
            <div class="lg:w-80">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3 cursor-pointer" @click="navigateToChannel">
                  <img :src="video.channel.avatar" :alt="video.channel.name" class="w-10 h-10 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-50 truncate hover:text-primary-600 dark:hover:text-primary-400 transition">{{ video.channel.name }}</h3>
                    <p class="text-sm text-muted dark:text-gray-400">{{ video.channel.subscribers }} subscribers</p>
                  </div>
                </div>
                <button
                  @click="openChannelInYouTube"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  View on YouTube
                </button>
              </div>
            </div>
          </div>
          <div v-if="shouldShowToggle" class="flex justify-center mt-4">
            <button 
                    @click="descriptionExpanded = !descriptionExpanded"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors duration-200"
                >
                <span>{{ descriptionExpanded ? 'Show less' : 'Show more' }}</span>
                <svg 
                    :class="['w-4 h-4 transition-transform duration-200', descriptionExpanded ? 'rotate-180' : '']" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Performance Analytics -->
      <section v-if="videoStats" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <h2 class="text-2xl font-semibold">Performance Analytics</h2>
            <select v-model="statsPeriod" @change="loadVideoStats" class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm" :disabled="!videoStats">
              <option v-if="canShowTodayStats" value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <!-- Summary Cards -->
          <div v-if="videoStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Views</div>
              <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentViews) : '0' }}</div>
              <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.viewChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ videoStats.summary.viewChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.viewChange) }}
              </div>
              <div v-else class="text-sm text-muted dark:text-gray-400">No data</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Likes</div>
              <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentLikes) : '0' }}</div>
              <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.likeChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ videoStats.summary.likeChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.likeChange) }}
              </div>
              <div v-else class="text-sm text-muted dark:text-gray-400">No data</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Comments</div>
              <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentComments) : '0' }}</div>
              <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.commentChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ videoStats.summary.commentChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.commentChange) }}
              </div>
              <div v-else class="text-sm text-muted dark:text-gray-400">No data</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-sm text-muted dark:text-gray-400">Total View Gains</div>
              <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.totalViewGained) : '0' }}</div>
              <div class="text-sm text-muted dark:text-gray-400">{{ videoStats.isTodayView ? 'today' : 'this period' }}</div>
            </div>
          </div>

          <!-- Loading Summary Cards -->
          <div v-if="!videoStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div v-for="i in 4" :key="`summary-skeleton-${i}`" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
              <div class="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
            </div>
          </div>

          <!-- Charts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- View Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? 'Hourly View Growth' : 'View Growth' }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📈</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Like Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? 'Hourly Like Growth' : 'Like Growth' }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">👍</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="likeChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Daily View Gains -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? 'Hourly View Gains' : 'Daily View Gains' }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📊</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewGainChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Comment Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? 'Hourly Comment Growth' : 'Comment Growth' }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">💬</div>
                  <div class="text-sm">No data available for this period</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="commentChartRef" class="w-full h-full"></canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center min-h-96">
        <div class="flex items-center gap-3 text-muted dark:text-gray-400">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
          <span>Loading video...</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
const router = useRouter()
const videoId = route.params['id'] as string

// make TS happy in this file for useHead (Nuxt auto-import may already provide it)
declare const useHead: any

// Video data
const video = ref<any>(null)
const loading = ref(true)

// Description collapse state
const descriptionExpanded = ref(false)
const descriptionMaxLength = 300

// Stats data
const videoStats = ref<any>(null)
const statsPeriod = ref('30')

// Chart refs
const viewChartRef = ref<HTMLCanvasElement>()
const likeChartRef = ref<HTMLCanvasElement>()
const viewGainChartRef = ref<HTMLCanvasElement>()
const commentChartRef = ref<HTMLCanvasElement>()

// Chart instances
let viewChart: any = null
let likeChart: any = null
let viewGainChart: any = null
let commentChart: any = null

// Computed property for description display
const displayDescription = computed(() => {
  if (!video.value?.description) return ''
  const formatted = formatDescription(video.value.description)
  if (descriptionExpanded.value || formatted.length <= descriptionMaxLength) {
    return formatted
  }
  return formatted.substring(0, descriptionMaxLength) + '...'
})

const shouldShowToggle = computed(() => {
  if (!video.value?.description) return false
  return formatDescription(video.value.description).length > descriptionMaxLength
})

const canShowTodayStats = computed(() => {
  if (!video.value?.publishedAt) return false
  const uploadDate = new Date(video.value.publishedAt)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return uploadDate >= sevenDaysAgo
})

// Fetch video and stats on the client after navigation so route change is instant
onMounted(async () => {
  // Load video data for the current route id (client-side)
  await loadVideo()

  // Set initial stats period based on video age (if available)
  if (video.value?.publishedAt) {
    const uploadDate = new Date(video.value.publishedAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    statsPeriod.value = uploadDate >= sevenDaysAgo ? '1' : '30'
  }

  // Start loading stats (don't block navigation)
  loadVideoStats()

  // If stats are already available right away, update charts
  if (videoStats.value) {
    updateCharts()
  }
})

// Watch for videoStats changes and update charts
watch(videoStats, (newStats) => {
  if (newStats) {
    nextTick(() => updateCharts())
  }
})

// Watch for video changes to handle "Today" option availability
watch(video, (newVideo) => {
  if (newVideo && newVideo.publishedAt) {
    const uploadDate = new Date(newVideo.publishedAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const isNewVideo = uploadDate >= sevenDaysAgo

    console.log('Video upload date:', uploadDate, 'Seven days ago:', sevenDaysAgo, 'isNewVideo:', isNewVideo)

    // For new videos, switch to "Today" view
    if (isNewVideo && statsPeriod.value !== '1') {
      statsPeriod.value = '1'
      loadVideoStats()
    }
    // For old videos, ensure we're not on "Today" (which would be hidden)
    else if (!isNewVideo && statsPeriod.value === '1') {
      statsPeriod.value = '30'
      loadVideoStats()
    }
  }
})

// Cleanup charts on unmount
onBeforeUnmount(() => {
  if (viewChart) viewChart.destroy()
  if (likeChart) likeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()
  if (commentChart) commentChart.destroy()
})

async function loadVideo() {
  try {
    loading.value = true
  const id = route.params['id'] as string
    console.log('Loading video:', id)

    const videoData = await $fetch(`/api/public/video/${id}`)
    video.value = videoData

  } catch (err: any) {
    console.error('Error loading video:', err)
  } finally {
    loading.value = false
  }
}

async function loadVideoStats() {
  try {
    console.log('Loading video stats for period:', statsPeriod.value)
  const id = route.params['id'] as string
    const statsData = await $fetch(`/api/public/video/${id}/stats`, {
      query: { days: statsPeriod.value }
    })
    console.log('Received video stats data:', statsData)
    videoStats.value = statsData

    // Update charts after data loads
    await nextTick()
    updateCharts()

  } catch (err: any) {
    console.error('Error loading video stats:', err)
    // Set empty stats on error so UI shows properly
    videoStats.value = { videoId, days: parseInt(statsPeriod.value), stats: [], summary: null }
  }
}

// Reload data if the route id changes (client-side nav between videos)
watch(() => route.params['id'], (newId, oldId) => {
  if (newId === oldId) return
  video.value = null
  videoStats.value = null
  loading.value = true
  // kick off new loads (don't await)
  loadVideo()
  loadVideoStats()
})

function formatDescription(description: string): string {
  if (!description) return ''
  // Convert URLs to links and preserve line breaks
  return description
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-500">$1</a>')
}

function openChannelInYouTube() {
  if (video.value?.channel?.youtubeId) {
    window.open(`https://www.youtube.com/channel/${video.value.channel.youtubeId}`, '_blank')
  }
}

function openVideoInYouTube() {
  if (video.value?.id) {
    window.open(`https://www.youtube.com/watch?v=${video.value.id}`, '_blank')
  }
}

function navigateToChannel() {
  if (video.value?.channel?.id) {
    const slug = video.value.channel.slug
    router.push(`/channel/${slug || video.value.channel.id}`)
  }
}

function updateCharts() {
  console.log('updateCharts called with videoStats:', videoStats.value)
  if (!videoStats.value) {
    console.log('No videoStats, returning')
    return
  }

  const stats = videoStats.value.stats || []
  const isTodayView = videoStats.value.isTodayView
  console.log('Stats array length:', stats.length, 'isTodayView:', isTodayView)

  const labels = stats.length > 0
    ? stats.map((s: any) => {
        if (isTodayView && s.hour !== undefined) {
          // For today view, show hour labels
          return `${s.hour}:00`
        } else {
          // For multi-day view, show date labels
          return new Date(s.date).toLocaleDateString()
        }
      })
    : ['No data available']

  console.log('Chart labels:', labels)

  // Destroy existing charts
  if (viewChart) viewChart.destroy()
  if (likeChart) likeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()
  if (commentChart) commentChart.destroy()

  // View growth chart
  if (viewChartRef.value) {
    console.log('Creating view chart with canvas:', viewChartRef.value)
    viewChart = new ChartJS(viewChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Views',
          data: stats.length > 0 ? stats.map((s: any) => s.views) : [0],
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
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }

  // Like growth chart
  if (likeChartRef.value) {
    likeChart = new ChartJS(likeChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Likes',
          data: stats.length > 0 ? stats.map((s: any) => s.likes) : [0],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
          label: isTodayView ? 'Hourly View Gains' : 'Daily View Gains',
          data: stats.length > 0 ? stats.map((s: any) => s.viewGained) : [0],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  }

  // Comment growth chart
  if (commentChartRef.value) {
    commentChart = new ChartJS(commentChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Comments',
          data: stats.length > 0 ? stats.map((s: any) => s.comments) : [0],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Meta tags
useHead({
  title: () => video.value ? `${video.value.title} - YouTube Player` : 'Video - YouTube Player'
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>