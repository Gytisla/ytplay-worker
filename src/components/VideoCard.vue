<template>
  <!-- Hidden image for loading detection -->
  <img
    v-if="!imageLoaded"
    :src="video.thumb"
    class="hidden"
    @load="imageLoaded = true"
    @error="imageLoaded = true"
  />

  <div v-if="!imageLoaded" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
    <!-- Loading placeholder -->
    <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
    <div class="p-4">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
  <NuxtLink
    v-else
    :to="`/video/${video.slug || video.id}`"
    class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col min-h-[280px]"
  >
    <!-- Thumbnail -->
    <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden flex-shrink-0">
      <img
        :src="video.thumb"
        :alt="video.title"
        class="w-full h-full object-cover group-hover:scale-105 transition"
        loading="lazy"
      />
      <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
        {{ video.duration }}
      </div>
      <!-- Ranking Badge -->
      <div v-if="ranking" class="absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-lg"
           :class="ranking.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 text-white' :
                  ranking.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600 text-white' :
                  ranking.position === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 text-white' :
                  'bg-gray-800/80 text-white'">
        {{ ranking.position }}
      </div>
      <!-- Medal for Top 3 -->
      <div v-if="ranking && ranking.showMedal && ranking.position <= 3" class="absolute top-3 right-3 z-10">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
             :class="ranking.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700' :
                    ranking.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600' :
                    'bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700'">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>
      <!-- Optional badges -->
      <div v-if="autoBadges.length > 0" :class="ranking ? 'absolute top-2 right-2 flex gap-1' : 'absolute top-2 right-2 flex gap-1'">
        <span
          v-for="(badge, index) in autoBadges"
          :key="index"
          :class="[
            'text-white text-xs px-2 py-1 rounded font-medium block',
            badge.type === 'new' ? 'bg-green-600' :
            badge.type === 'trending' ? 'bg-red-600' :
            badge.type === 'ranking' ? 'bg-primary-600' :
            badge.text === 'LIVE' ? 'bg-red-500 animate-pulse' :
            badge.text === 'PREMIERE' ? 'bg-purple-600' :
            'bg-gray-600'
          ]"
        >
          {{ badge.text }}
        </span>
      </div>
    </div>

    <!-- Video Info -->
    <div class="p-4 flex flex-col flex-1">
      <h3 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2 flex-shrink-0 transition-colors duration-200 hover:text-red-600 dark:hover:text-red-400">{{ video.title }}</h3>
      
      <!-- Category Badge -->
      <div v-if="video.category" class="mb-2 flex-shrink-0">
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
      
      <div class="flex flex-col gap-2 text-sm text-muted dark:text-gray-400 mt-auto">
        <div class="flex items-center gap-2">
          <img v-if="video.channelThumb" :src="video.channelThumb" alt="" class="w-5 h-5 rounded-full object-cover" />
          <div v-else class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <NuxtLink
            :to="`/channel/${video.channelSlug || video.channelId}`"
            class="hover:text-primary-600 dark:hover:text-primary-400 transition"
            @click.stop
          >
            {{ video.channel }}
          </NuxtLink>
        </div>
        <div class="flex items-center justify-between">
          <span>{{ video.views }}</span>
          <div v-if="video.trend" class="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <span class="text-sm font-bold text-green-700 dark:text-green-300">+{{ formatNumber(video.trend.gain) }}</span>
          </div>
          <span>{{ formattedAge }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string }

interface Props {
  video: {
    id: string
    slug?: string
    title: string
    thumb: string
    duration: string
    channel: string
    channelThumb?: string
    channelSlug?: string
    channelId?: string
    views: string
    age: string
    trend?: {
      gain: number
      period: string
    }
    category?: {
      id: string
      name: string
      key: string
      color: string
      icon: string
    }
    live_broadcast_content?: string
  }
  badge?: {
    type: 'new' | 'trending' | 'ranking' | 'custom'
    text: string
  } | Array<{
    type: 'new' | 'trending' | 'ranking' | 'custom'
    text: string
  }>
  ranking?: {
    position: number
    showMedal?: boolean
  }
}

const { video, badge: externalBadge, ranking } = defineProps<Props>()

// Track image loading state
const imageLoaded = ref(false)

// Fallback: show card after 3 seconds if image fails to load
setTimeout(() => {
  if (!imageLoaded.value) {
    imageLoaded.value = true
  }
}, 3000)

// Auto-determine badges based on video criteria (returns array to allow multiple badges)
const autoBadges = computed(() => {
  const badges = []
  const badgeTypes = new Set()

  // Check for trending badge first (highest priority): 3k+ 24h gain OR 10k+ 7d gain
  if (video.trend && ((video.trend.gain >= 3000 && video.trend.period === 'today') || (video.trend.gain >= 10000 && video.trend.period === '7') || (video.trend.gain >= 20000 && video.trend.period === '30'))) {
    badges.push({
      type: 'trending' as const,
      text: 'POPULIARUS'
    })
    badgeTypes.add('trending')
  }

  // Check for live badge: videos that are currently live
  console.log('Video live_broadcast_content:', video.live_broadcast_content)
  if (video.live_broadcast_content === 'live') {
    badges.push({
      type: 'custom' as const,
      text: 'LIVE'
    })
    badgeTypes.add('live')
  }

  // Check for upcoming/premiere badge: videos scheduled for live
  if (video.live_broadcast_content === 'upcoming') {
    badges.push({
      type: 'custom' as const,
      text: 'PREMJERA'
    })
    badgeTypes.add('upcoming')
  }

  // Check for new badge: videos less than 7 days old
  if (video.age) {
    const ageText = video.age.toLowerCase()
    // Consider videos new if they're less than 7 days old (now, Xh, 1d, 2d, ..., 6d, 7d)
    if (ageText === 'now' || 
        /^\d+h$/.test(ageText) || // Matches "1h", "2h", etc.
        ageText === '1d' || ageText === '2d' || ageText === '3d' || 
        ageText === '4d' || ageText === '5d' || ageText === '6d' || ageText === '7d') {
      badges.push({
        type: 'new' as const,
        text: 'NAUJAS'
      })
      badgeTypes.add('new')
    }
  }

  // Add external badges if provided (avoid duplicates)
  if (externalBadge) {
    const externalBadges = Array.isArray(externalBadge) ? externalBadge : [externalBadge]
    for (const badge of externalBadges) {
      if (!badgeTypes.has(badge.type)) {
        badges.push(badge)
        badgeTypes.add(badge.type)
      }
    }
  }

  return badges
})

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  } else {
    return num.toString()
  }
}

// Format age using i18n translations
const formattedAge = computed(() => {
  if (!video.age) return ''
  
  const ageText = video.age.toLowerCase()
  const { t } = useI18n()
  
  if (ageText === 'now') {
    return t('time.now')
  }
  
  // Match patterns like "1h", "2h", etc.
  const hourMatch = ageText.match(/^(\d+)h$/)
  if (hourMatch && hourMatch[1]) {
    const hours = parseInt(hourMatch[1])
    return `${hours}${t('time.hour')}`
  }
  
  // Match patterns like "1d", "2d", etc.
  const dayMatch = ageText.match(/^(\d+)d$/)
  if (dayMatch && dayMatch[1]) {
    const days = parseInt(dayMatch[1])
    return `${days}${t('time.day')}`
  }
  
  // Match patterns like "1mo", "2mo", etc.
  const monthMatch = ageText.match(/^(\d+)mo$/)
  if (monthMatch && monthMatch[1]) {
    const months = parseInt(monthMatch[1])
    return `${months}${t('time.month')}`
  }
  
  // Match patterns like "1y", "2y", etc.
  const yearMatch = ageText.match(/^(\d+)y$/)
  if (yearMatch && yearMatch[1]) {
    const years = parseInt(yearMatch[1])
    return `${years}${t('time.year')}`
  }
  
  // Fallback to original age if no pattern matches
  return video.age
})
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