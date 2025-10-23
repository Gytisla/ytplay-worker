<template>
  <!-- Clean Hero Section -->
  <section class="relative pt-8 md:pt-16 pb-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12 text-center">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Main Heading -->
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
          {{ t('hero.discover') }}
          <span class="text-red-600 dark:text-red-500">{{ t('hero.videos') }}</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          {{ t('hero.subtitle') }}
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <NuxtLink to="/trending" class="group px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 inline-block">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              {{ t('hero.exploreVideos') }}
            </span>
          </NuxtLink>
          <NuxtLink to="/categories" class="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 inline-block">
            {{ t('hero.browseCategories') }}
          </NuxtLink>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">50K+</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">{{ t('hero.stats.videos') }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">300+</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">{{ t('hero.stats.channels') }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">24/7</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">{{ t('hero.stats.freshContent') }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="flex items-center justify-center py-8">
    <hr class="w-full max-w-4xl border-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent">
  </div>

  <!-- Popular Videos Sections -->
  <section class="py-12">
    <!-- Today -->
    <div v-if="todayHasContent" class="mb-12">
      <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          {{ t('home.sections.popularToday.title') }}
        </h2>
        <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.popularToday.description') }}</p>
      </div>
      <PopularVideosSection :period="'today'" :immediate="true" @has-content="onTodayContent" />
    </div>

    <!-- Last 7 Days -->
    <div v-if="weekHasContent" class="mb-12">
      <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          {{ t('home.sections.trendingWeek.title') }}
        </h2>
        <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.trendingWeek.description') }}</p>
      </div>
      <PopularVideosSection :period="'7'" @has-content="onWeekContent" />
    </div>

    <!-- Last 30 Days -->
    <div v-if="monthHasContent">
      <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          {{ t('home.sections.topMonth.title') }}
        </h2>
        <p class="text-sm text-muted dark:text-gray-400">{{ t('home.sections.topMonth.description') }}</p>
      </div>
      <PopularVideosSection :period="'30'" @has-content="onMonthContent" />
    </div>
  </section>
</template>

<script setup lang="ts">
// Popular videos component will be imported
import PopularVideosSection from './PopularVideosSection.vue'
import { ref } from 'vue'

const { t } = useI18n()

// Track which sections have content
const todayHasContent = ref(true) // Start with true, hide only when confirmed empty
const weekHasContent = ref(true)
const monthHasContent = ref(true)

function onTodayContent(hasContent: boolean) {
  todayHasContent.value = hasContent
}

function onWeekContent(hasContent: boolean) {
  weekHasContent.value = hasContent
}

function onMonthContent(hasContent: boolean) {
  monthHasContent.value = hasContent
}
</script>

<style scoped>
/* Clean, minimal styling */
</style>
