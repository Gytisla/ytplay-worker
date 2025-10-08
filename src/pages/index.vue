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
</script>

<style>
</style>
