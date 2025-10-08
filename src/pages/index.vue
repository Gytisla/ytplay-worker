<template>
  <div>
    <Hero />
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">New</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="i in 8" :key="i" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse">
          <div class="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Trending</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="i in 8" :key="i + 't'" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse">
          <div class="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-2xl font-semibold mb-4">Top Channels</h2>
      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="i in 8" :key="i + 'c'" class="rounded-xl bg-white dark:bg-gray-800 shadow-sm p-3 animate-pulse flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/4 rounded"></div>
          </div>
        </div>
      </div>
    </section>
  </div>

</template>

<script setup>
import Hero from '~/components/home/Hero.vue'
</script>

<style>
</style>
