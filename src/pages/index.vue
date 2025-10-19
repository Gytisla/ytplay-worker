<template>
  <div>
    <Hero />
    
    <!-- Modern HR Separator -->
    <div class="flex items-center justify-center py-8">
      <hr class="w-full max-w-4xl border-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent">
    </div>
    
    <div>
      <NewSection :loading="false" />
    </div>
    
    <!-- Modern HR Separator -->
    <div class="flex items-center justify-center py-8">
      <hr class="w-full max-w-4xl border-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent">
    </div>
    
    <div>
      <TrendingSection :loading="false" />
    </div>
    
    <!-- Modern HR Separator -->
    <div class="flex items-center justify-center py-8">
      <hr class="w-full max-w-4xl border-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent">
    </div>
    
    <div class="mb-12">
      <TopChannelsSection :loading="false" />
    </div>
    
    <!-- Submit Channel CTA -->
    <div class="max-w-4xl mx-auto px-4 mb-16">
      <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-8 md:p-12 text-center border border-primary-200 dark:border-primary-800">
        <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('home.cta.submitChannel.title') }}
        </h3>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {{ $t('home.cta.submitChannel.description') }}
        </p>
        <NuxtLink
          to="/submit-channel"
          class="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          {{ $t('home.cta.submitChannel.button') }}
          <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>

</template>

<script setup>
import Hero from '~/components/home/Hero.vue'
import NewSection from '~/components/home/NewSection.vue'
import TrendingSection from '~/components/home/TrendingSection.vue'
import TopChannelsSection from '~/components/home/TopChannelsSection.vue'

// SEO and Open Graph meta tags
useHead({
  title: 'YTPlay.lt - Discover Amazing Videos',
  meta: [
    {
      name: 'description',
      content: 'Discover and explore amazing YouTube videos organized by categories. Watch trending content, top channels, and new videos all in one place.'
    },
    // Open Graph
    {
      property: 'og:title',
  content: 'YTPlay.lt - Discover Amazing Videos'
    },
    {
      property: 'og:description',
      content: 'Discover and explore amazing YouTube videos organized by categories. Watch trending content, top channels, and new videos all in one place.'
    },
    {
      property: 'og:image',
      content: '/assets/hero-thumb.svg'
    },
    {
      property: 'og:url',
      content: 'https://ytplay-worker.vercel.app'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:site_name',
  content: 'YTPlay.lt'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
  content: 'YTPlay.lt - Discover Amazing Videos'
    },
    {
      name: 'twitter:description',
      content: 'Discover and explore amazing YouTube videos organized by categories. Watch trending content, top channels, and new videos all in one place.'
    },
    {
      name: 'twitter:image',
      content: '/assets/hero-thumb.svg'
    }
  ]
})
</script>

<style>
</style>
