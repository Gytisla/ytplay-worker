<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 mb-8">
    <div class="max-w-5xl mx-auto text-center">
      <!-- 404 Illustration -->
      <div class="mb-8">
        <div class="relative">
          <div class="w-48 h-48 mx-auto relative">
            <!-- Large 404 text -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-8xl md:text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">404</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        {{ $t('error.404.title') }}
      </h1>

      <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
        {{ $t('error.404.description') }}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition font-semibold text-lg shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          {{ $t('error.404.goHome') }}
        </NuxtLink>

        <button
          @click="$router.go(-1)"
          class="inline-flex items-center gap-3 px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          {{ $t('error.404.goBack') }}
        </button>
      </div>

      <!-- Popular Pages -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {{ $t('error.404.popularPages') }}
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            to="/"
            class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-blue-600/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
          >
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <div class="text-left">
                <div class="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{{ $t('navigation.home') }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">{{ $t('error.404.explore') }}</div>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/top-videos"
            class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-500/5 before:to-green-600/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
          >
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="text-left">
                <div class="font-bold text-gray-900 dark:text-white text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">{{ $t('common.top') }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">{{ $t('common.videos') }}</div>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/top-channels"
            class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-br before:from-purple-500/5 before:to-purple-600/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
          >
            <div class="relative z-10 flex items-center gap-4">
              <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <div class="text-left">
                <div class="font-bold text-gray-900 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">{{ $t('common.top') }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">{{ $t('common.channels') }}</div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Footer message -->
      <div class="mt-12 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-lg">
          {{ $t('error.404.footer') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 404 Error page component
</script>