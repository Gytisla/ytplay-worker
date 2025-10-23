<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('breadcrumb.topVideos'), to: '/trending' }, { label: video?.title || t('breadcrumb.video') }]" />

      <!-- Video Player Section -->
      <section v-if="video" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <!-- Video Player -->
          <div class="relative w-full mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-600">
            <div class="aspect-[4/3] sm:aspect-[16/10] lg:aspect-video w-full max-w-full sm:max-w-4xl lg:max-w-5xl mx-auto">
              <iframe
                :src="`https://www.youtube.com/embed/${video.id}`"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="w-full h-full rounded-xl shadow-lg"
              ></iframe>
            </div>
          </div>

          <!-- Video Info -->
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div class="flex-1">
              <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{{ video.title }}</h1>
              
              <!-- Category Badge -->
              <div v-if="video.category" class="mb-3 flex-shrink-0">
                <NuxtLink
                  :to="`/categories/${video.category.key}`"
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-current/20"
                  :style="{ backgroundColor: video.category.color + '20', color: video.category.color }"
                  @click.stop
                >
                  <span class="text-xs">{{ video.category.icon }}</span>
                  <span>{{ video.category.name }}</span>
                </NuxtLink>
              </div>

              <!-- Admin Category Manager -->
              <VideoCategoryManager
                :video-id="video.dbId"
                :current-category-id="video.category_id"
              />
              
              <!-- Live/Upcoming Badge -->
              <div v-if="videoBadge" class="mb-3 flex-shrink-0">
                <span :class="['inline-flex items-center px-3 py-1 text-xs font-medium rounded-full', videoBadge.class]">
                  {{ videoBadge.text }}
                </span>
              </div>
              
              <!-- Tags -->
              <div v-if="displayedTags.length > 0" class="mb-4">
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="tag in displayedTags"
                    :key="tag"
                    class="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    @click="searchByTag(tag)"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    {{ tag }}
                  </span>
                </div>
                <button
                  v-if="shouldShowTagsToggle"
                  @click="tagsExpanded = true"
                  class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  {{ showMoreTagsText }}
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <button
                  v-else-if="tagsExpanded && hasMoreTags"
                  @click="tagsExpanded = false"
                  class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  {{ t('video.showLessTags') }}
                  <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </button>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-muted dark:text-gray-400 mb-4">
                <span>{{ video.views }} {{ t('common.viewCount') }}</span>•
                <span v-if="video.duration">{{ video.duration }}</span>•
                <span>{{ formattedUploadedTime }}</span>
              </div>
              <button
                @click="openVideoInYouTube"
                class="inline-flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition font-medium text-sm mb-4"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {{ t('video.openInYouTube') }}
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
                    <p class="text-sm text-muted dark:text-gray-400">{{ video.channel.subscribers }} {{ t('common.subscribersText') }}</p>
                  </div>
                </div>
                <button
                  @click="openChannelInYouTube"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  {{ t('video.viewOnYouTube') }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="shouldShowToggle" class="flex justify-center mt-4">
            <button 
                    @click="descriptionExpanded = !descriptionExpanded"
                    class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors duration-200"
                >
                <span>{{ descriptionExpanded ? t('video.showLess') : t('video.showMore') }}</span>
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
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <!-- Header with toggle -->
          <div class="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" @click="statsCollapsed = !statsCollapsed">
            <h2 class="text-2xl font-semibold">{{ t('video.performanceAnalytics') }}</h2>
            <div class="flex items-center gap-3">
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
          <div class="px-6 py-3 analytics-content">
            <!-- Summary Cards (always visible) -->
            <div v-if="videoStats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('video.stats.views') }}</div>
                <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentViews) : '0' }}</div>
                <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.viewChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ videoStats.summary.viewChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.viewChange) }}
                </div>
                <div v-else class="text-sm text-muted dark:text-gray-400">{{ t('video.noData') }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('video.stats.likes') }}</div>
                <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentLikes) : '0' }}</div>
                <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.likeChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ videoStats.summary.likeChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.likeChange) }}
                </div>
                <div v-else class="text-sm text-muted dark:text-gray-400">{{ t('video.noData') }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('video.stats.comments') }}</div>
                <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.currentComments) : '0' }}</div>
                <div v-if="videoStats.summary" class="text-sm" :class="videoStats.summary.commentChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ videoStats.summary.commentChange >= 0 ? '+' : '' }}{{ formatNumber(videoStats.summary.commentChange) }}
                </div>
                <div v-else class="text-sm text-muted dark:text-gray-400">{{ t('video.noData') }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="text-sm text-muted dark:text-gray-400">{{ t('video.stats.totalViewGains') }}</div>
                <div class="text-2xl font-bold">{{ videoStats.summary ? formatNumber(videoStats.summary.totalViewGained) : '0' }}</div>
                <div class="text-sm text-muted dark:text-gray-400">{{ videoStats.isTodayView ? t('video.today') : t('video.thisPeriod') }}</div>
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

            <!-- Period Selector (visible when expanded) -->
            <div v-show="!statsCollapsed" class="mb-6 flex justify-center">
              <select 
                v-model="statsPeriod" 
                @change="loadVideoStats" 
                class="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm font-medium" 
                :disabled="!videoStats"
              >
                <option v-if="canShowTodayStats" value="1">{{ t('video.periods.1') }}</option>
                <option value="7">{{ t('video.periods.7') }}</option>
                <option value="30">{{ t('video.periods.30') }}</option>
                <option value="90">{{ t('video.periods.90') }}</option>
                <option value="365">{{ t('video.periods.365') }}</option>
              </select>
            </div>

            <!-- Charts (only visible when expanded) -->
            <div v-show="!statsCollapsed" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- View Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? t('video.charts.hourlyViewGrowth') : t('video.charts.viewGrowth') }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📈</div>
                  <div class="text-sm">{{ t('video.noDataAvailable') }}</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Like Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? t('video.charts.hourlyLikeGrowth') : t('video.charts.likeGrowth') }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">👍</div>
                  <div class="text-sm">{{ t('video.noDataAvailable') }}</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="likeChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Daily View Gains -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? t('video.charts.hourlyViewGains') : t('video.charts.dailyViewGains') }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">📊</div>
                  <div class="text-sm">{{ t('video.noDataAvailable') }}</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="viewGainChartRef" class="w-full h-full"></canvas>
              </div>
            </div>

            <!-- Comment Growth Chart -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-4">{{ videoStats.isTodayView ? t('video.charts.hourlyCommentGrowth') : t('video.charts.commentGrowth') }}</h3>
              <div v-if="!videoStats" class="relative h-64 flex items-center justify-center">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div class="h-32 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
              <div v-else-if="videoStats && (!videoStats.stats || videoStats.stats.length === 0)" class="relative h-64 flex items-center justify-center">
                <div class="text-center text-muted dark:text-gray-400">
                  <div class="text-4xl mb-2">💬</div>
                  <div class="text-sm">{{ t('video.noDataAvailable') }}</div>
                </div>
              </div>
              <div v-else class="relative h-64">
                <canvas ref="commentChartRef" class="w-full h-full"></canvas>
              </div>
            </div>
            </div>
          </div>

          <!-- Show More Button (only visible when collapsed) -->
          <div v-show="statsCollapsed" class="flex justify-center pb-6">
            <button 
              @click="statsCollapsed = false"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200"
            >
              <span>{{ t('video.showMoreAnalytics') }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>      <!-- Loading State -->
      <div v-else class="flex items-center justify-center min-h-96">
        <div class="flex items-center gap-3 text-muted dark:text-gray-400">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
          <span>{{ t('video.loadingVideo') }}</span>
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
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string; locale: string }

const { t, locale } = useI18n()

// Video data
const video = ref<any>(null)
const loading = ref(true)

// Description collapse state
const descriptionExpanded = ref(false)
const descriptionMaxLength = 300

// Tags display state
const tagsExpanded = ref(false)
const maxTagsToShow = 8

// Stats data
const videoStats = ref<any>(null)
const statsPeriod = ref('30')
const statsCollapsed = ref(true) // Start collapsed by default

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

const formattedUploadedTime = computed(() => {
  if (!video.value?.publishedAt) return video.value?.uploaded || ''
  
  const uploadDate = new Date(video.value.publishedAt)
  const now = new Date()
  const diffMs = now.getTime() - uploadDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)
  
  // Check if current locale is Lithuanian (where "ago" comes before the time)
  const isLithuanian = locale === 'lt'
  
  const formatTime = (value: number, unit: string) => {
    if (isLithuanian) {
      return `${t('time.ago')} ${value}${t(`time.${unit}`)}`
    } else {
      return `${value}${t(`time.${unit}`)} ${t('time.ago')}`
    }
  }
  
  if (diffHours < 1) {
    return t('time.now')
  } else if (diffHours < 24) {
    return formatTime(diffHours, 'hour')
  } else if (diffDays < 7) {
    return formatTime(diffDays, 'day')
  } else if (diffDays < 30) {
    // Show weeks for anything under 30 days to avoid "0 months ago" when days are 28-29
    return formatTime(diffWeeks, 'week')
  } else if (diffDays < 365) {
    return formatTime(diffMonths, 'month')
  } else {
    return formatTime(diffYears, 'year')
  }
})

const videoBadge = computed(() => {
  if (!video.value?.live_broadcast_content) return null
  
  if (video.value.live_broadcast_content === 'live') {
    return {
      text: 'LIVE',
      class: 'bg-red-500 animate-pulse text-white'
    }
  } else if (video.value.live_broadcast_content === 'upcoming') {
    return {
      text: 'PREMJERA',
      class: 'bg-purple-600 text-white'
    }
  }
  
  return null
})

const displayedTags = computed(() => {
  if (!video.value?.tags || video.value.tags.length === 0) return []
  return tagsExpanded.value ? video.value.tags : video.value.tags.slice(0, maxTagsToShow)
})

const showMoreTagsText = computed(() => {
  if (!video.value?.tags) return ''
  const remainingCount = video.value.tags.length - maxTagsToShow
  
  // Lithuanian plural rules for "žymės" (tags)
  if (remainingCount === 1) {
    return `Rodyti dar ${remainingCount} žymę`
  } else {
    return `Rodyti dar ${remainingCount} žymių`
  }
})

const hasMoreTags = computed(() => {
  return video.value?.tags && video.value.tags.length > maxTagsToShow
})

const shouldShowTagsToggle = computed(() => {
  return hasMoreTags.value && !tagsExpanded.value
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
  const id = route.params['id'] as string
    const statsData = await $fetch(`/api/public/video/${id}/stats`, {
      query: { days: statsPeriod.value }
    })
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

function searchByTag(tag: string) {
  // Navigate to search page with tag filter
  router.push(`/search?q=${encodeURIComponent('#' + tag)}`)
}

function updateCharts() {
  if (!videoStats.value) {
    return
  }

  const stats = videoStats.value.stats || []
  const isTodayView = videoStats.value.isTodayView

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

  // Destroy existing charts
  if (viewChart) viewChart.destroy()
  if (likeChart) likeChart.destroy()
  if (viewGainChart) viewGainChart.destroy()
  if (commentChart) commentChart.destroy()

  // View growth chart
  if (viewChartRef.value) {
    viewChart = new ChartJS(viewChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: t('video.stats.views'),
          data: stats.length > 0 ? stats.map((s: any) => s.views) : [0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        maintainAspectRatio: false,
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
          label: t('video.stats.likes'),
          data: stats.length > 0 ? stats.map((s: any) => s.likes) : [0],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        maintainAspectRatio: false,
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
          label: isTodayView ? t('video.charts.hourlyViewGains') : t('video.charts.dailyViewGains'),
          data: stats.length > 0 ? stats.map((s: any) => s.viewGained) : [0],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        maintainAspectRatio: false,
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
          label: t('video.stats.comments'),
          data: stats.length > 0 ? stats.map((s: any) => s.comments) : [0],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        maintainAspectRatio: false,
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
  title: () => video.value ? `${video.value.title} - YTPlay.lt` : 'Video - YTPlay.lt'
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>