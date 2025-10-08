<template>
  <div>
    <Hero />
  <NewSection :loading="false" />

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
