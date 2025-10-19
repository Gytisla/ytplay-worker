<template>
  <div>
    <Hero />
    <div class="mt-8">
      <NewSection :loading="false" />
    </div>
    <TrendingSection :loading="false" />
    <TopChannelsSection :loading="false" />
  </div>

</template>

<script setup>
import Hero from '~/components/home/Hero.vue'
import NewSection from '~/components/home/NewSection.vue'
import TrendingSection from '~/components/home/TrendingSection.vue'
import TopChannelsSection from '~/components/home/TopChannelsSection.vue'

// SEO and Open Graph meta tags
useHead({
  title: 'YouTube Player - Discover Amazing Videos',
  meta: [
    {
      name: 'description',
      content: 'Discover and explore amazing YouTube videos organized by categories. Watch trending content, top channels, and new videos all in one place.'
    },
    // Open Graph
    {
      property: 'og:title',
      content: 'YouTube Player - Discover Amazing Videos'
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
      content: 'YouTube Player'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: 'YouTube Player - Discover Amazing Videos'
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
