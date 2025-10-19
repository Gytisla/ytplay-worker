<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 py-20">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <div class="flex items-center justify-center gap-4 mb-8">
          <div class="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">YT</div>
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">{{ $t('about.hero.title') }}</h1>
        </div>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          {{ $t('about.hero.subtitle') }}
        </p>
        <p class="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {{ $t('about.hero.description') }}
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white dark:bg-gray-900">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          {{ $t('about.features.title') }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <!-- New Videos -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ $t('about.features.newVideos.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-300">
              {{ $t('about.features.newVideos.description') }}
            </p>
          </div>

          <!-- Trending Videos -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ $t('about.features.trending.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-300">
              {{ $t('about.features.trending.description') }}
            </p>
          </div>

          <!-- Top Videos -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
            <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ $t('about.features.topVideos.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-300">
              {{ $t('about.features.topVideos.description') }}
            </p>
          </div>
        </div>

        <!-- Channels Section -->
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 md:p-12">
          <div class="text-center mb-8">
            <h3 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {{ $t('about.channels.title') }}
            </h3>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {{ $t('about.channels.description') }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('about.channels.categories.videos') }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">Kokybiškas turinys</p>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('about.channels.categories.community') }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">Bendruomenė</p>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('about.channels.categories.news') }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">Aktualijos</p>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('about.channels.categories.education') }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">Mokymai</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Lithuanian Focus Section -->
    <section class="py-20 bg-gray-50 dark:bg-gray-800">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          {{ $t('about.lithuanianFocus.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white dark:bg-gray-700 rounded-xl p-8">
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ $t('about.lithuanianFocus.language.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-300">
              {{ $t('about.lithuanianFocus.language.description') }}
            </p>
          </div>

          <div class="bg-white dark:bg-gray-700 rounded-xl p-8">
            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ $t('about.lithuanianFocus.community.title') }}</h3>
            <p class="text-gray-600 dark:text-gray-300">
              {{ $t('about.lithuanianFocus.community.description') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-20 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t('about.contact.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            {{ $t('about.contact.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <!-- Contact Info -->
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{{ $t('about.contact.info.title') }}</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ $t('about.contact.info.email') }}</p>
                  <p class="text-gray-600 dark:text-gray-300">info@ytplay.lt</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ $t('about.contact.info.website') }}</p>
                  <p class="text-gray-600 dark:text-gray-300">www.ytplay.lt</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="relative">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{{ $t('about.contact.form.title') }}</h3>
            <div class="relative">
              <form @submit.prevent class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('about.contact.form.name') }}</label>
                  <input
                    type="text"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    :placeholder="$t('about.contact.form.namePlaceholder')"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('about.contact.form.email') }}</label>
                  <input
                    type="email"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    :placeholder="$t('about.contact.form.emailPlaceholder')"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ $t('about.contact.form.message') }}</label>
                  <textarea
                    rows="4"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    :placeholder="$t('about.contact.form.messagePlaceholder')"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled
                  class="w-full px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
                >
                  {{ $t('about.contact.form.submit') }}
                </button>
              </form>

              <!-- Overlay -->
              <div class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div class="text-center p-6 max-w-sm">
                  <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ $t('about.contact.form.overlay.title') }}</h4>
                  <p class="text-gray-600 dark:text-gray-300 mb-4">
                    {{ $t('about.contact.form.overlay.description') }}
                  </p>
                  <a
                    href="mailto:info@ytplay.lt"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition font-medium"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ $t('about.contact.form.overlay.emailButton') }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// About page component
</script>