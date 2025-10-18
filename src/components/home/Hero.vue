<template>
  <!-- Clean Hero Section -->
  <section class="relative py-16 md:py-24">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Main Heading -->
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
          Discover Amazing
          <span class="text-red-600 dark:text-red-500">Videos</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          Explore the best content from creators around the world
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button class="group px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Explore Videos
            </span>
          </button>
          <button class="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
            Browse Categories
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">10K+</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">Videos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">500+</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">Channels</div>
          </div>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">24/7</div>
            <div class="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide">Fresh Content</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Popular Videos Sections -->
  <section class="py-8">
    <!-- Today -->
    <div v-if="todayHasContent" class="mb-12">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Most Popular Today</h2>
      <PopularVideosSection :period="'today'" @has-content="onTodayContent" />
    </div>

    <!-- Last 7 Days -->
    <div v-if="weekHasContent" class="mb-12">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Trending This Week</h2>
      <PopularVideosSection :period="'7'" @has-content="onWeekContent" />
    </div>

    <!-- Last 30 Days -->
    <div v-if="monthHasContent" class="mb-12">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Top This Month</h2>
      <PopularVideosSection :period="'30'" @has-content="onMonthContent" />
    </div>
  </section>
</template>

<script setup lang="ts">
// Popular videos component will be imported
import PopularVideosSection from './PopularVideosSection.vue'
import { ref } from 'vue'

// Track which sections have content
const todayHasContent = ref(true) // Start with true, hide only when confirmed empty
const weekHasContent = ref(true)
const monthHasContent = ref(true)

function onTodayContent(hasContent: boolean) {
  console.log(`Hero: today section hasContent = ${hasContent}`)
  todayHasContent.value = hasContent
}

function onWeekContent(hasContent: boolean) {
  console.log(`Hero: week section hasContent = ${hasContent}`)
  weekHasContent.value = hasContent
}

function onMonthContent(hasContent: boolean) {
  console.log(`Hero: month section hasContent = ${hasContent}`)
  monthHasContent.value = hasContent
}
</script>

<style scoped>
/* Clean, minimal styling */
</style>
