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
