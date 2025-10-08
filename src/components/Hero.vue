<template>
  <section class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-400 text-white p-8 md:p-12 lg:p-20">
    <div class="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply" aria-hidden>
      <svg class="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 800 400">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.06" />
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#g)" />
      </svg>
    </div>

    <div class="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-8">
      <div class="flex-1">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
          Discover the web's freshest videos
        </h1>
        <p class="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl">
          Explore new, trending and top content across categories. Fast, beautiful, and built for discovery.
        </p>

        <div class="mt-6 flex items-center gap-3">
          <a href="#new" class="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-4 py-2 rounded-lg shadow hover:translate-y-[-1px] transition">Explore New</a>
          <a href="#top" class="inline-flex items-center gap-2 border border-white/30 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition">Top Charts</a>
        </div>
      </div>

      <div class="w-full md:w-96 hidden md:block">
        <div class="rounded-xl overflow-hidden shadow-lg transform transition hover:scale-105">
          <img :src="hero" alt="Hero preview" class="w-full h-56 object-cover bg-gray-200 dark:bg-gray-700"/>
          <div class="p-3 bg-white/10">
            <div class="text-sm font-semibold">Featured</div>
            <div class="text-sm text-white/90">A quick teaser of trending content.</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Import as a URL so Vite/Nuxt returns a usable path at runtime
import hero from '~/assets/hero-thumb.svg?url'

// Pure presentational component
</script>

<style scoped>
/* Simple shimmer animation or other micro-interactions can be added here */
</style>
