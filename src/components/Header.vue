
<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out shadow-sm"
    :class="{ '-translate-y-full': isHidden }"
  >
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-3">
        <img 
          src="/assets/logo.png" 
          alt="ToPlay.lt" 
          class="w-8 h-8"
        />
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          ToPlay<span class="text-sm transform translate-y-0.5">.lt</span>
        </span>
      </NuxtLink>

      <!-- <div class="flex-1 px-4">
        <input
          aria-label="Search"
          :placeholder="$t('header.searchPlaceholder')"
          class="w-full max-w-xl mx-auto block px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div> -->

      <div class="flex items-center gap-3">
        <!-- Mobile menu button (visible on small screens) -->
        <button
          @click="mobileOpen = !mobileOpen"
          :aria-expanded="mobileOpen.toString()"
          aria-controls="mobile-menu"
          class="sm:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 mr-1"
          :title="$t('header.openMenu')"
        >
          <svg v-if="!mobileOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="hidden sm:flex items-center gap-3">
          <NuxtLink
            to="/categories"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/categories')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            {{ $t('header.categories') }}
          </NuxtLink>
          <NuxtLink
            to="/trending"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/trending')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            {{ $t('header.topVideos') }}
          </NuxtLink>
          <NuxtLink
            to="/top-channels"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/top-channels')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            {{ $t('header.topChannels') }}
          </NuxtLink>
          <NuxtLink
            to="/new"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/new')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            Naujausi
          </NuxtLink>
          <NuxtLink
            to="/live-upcoming"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/live-upcoming')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            {{ $t('header.liveUpcoming') }}
          </NuxtLink>
          <NuxtLink
            to="/top-videos"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-md transition',
              isActiveRoute('/top-videos')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            Žiūrimiausi
          </NuxtLink>
          <div class="ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
            <NuxtLink
              to="/submit-channel"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md transition',
                isActiveRoute('/submit-channel')
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
            >
              {{ $t('header.submitChannel') }}
            </NuxtLink>
          </div>
          <!-- <LanguageSwitcher /> -->
          
          <!-- Auth buttons -->
          <div class="ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
            <div v-if="isAuthenticated" class="flex items-center gap-2">
              <NuxtLink
                to="/admin"
                class="px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Admin
              </NuxtLink>
              <!-- <button
                @click="handleSignOut"
                class="px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Atsijungti
              </button> -->
            </div>
          </div>
          <!-- <div v-else>
            <NuxtLink
              to="/login"
              class="px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Prisijungti
            </NuxtLink>
          </div> -->
          
          <button
            @click="toggleTheme"
            :aria-pressed="isDark.toString()"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
            :title="$t('header.toggleTheme')"
          >
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM10 16a.75.75 0 01.75.75V18a.75.75 0 01-1.5 0v-1.25A.75.75 0 0110 16zM4.22 4.22a.75.75 0 011.06 0l.89.89a.75.75 0 11-1.06 1.06l-.89-.89a.75.75 0 010-1.06zM14.83 14.83a.75.75 0 011.06 0l.89.89a.75.75 0 11-1.06 1.06l-.89-.89a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75H4a.75.75 0 010 1.5H2.75A.75.75 0 012 10zM16 10a.75.75 0 01.75-.75H18a.75.75 0 010 1.5h-1.25A.75.75 0 0116 10zM4.22 15.78a.75.75 0 010-1.06l.89-.89a.75.75 0 111.06 1.06l-.89.89a.75.75 0 01-1.06 0zM14.83 5.17a.75.75 0 010-1.06l.89-.89a.75.75 0 111.06 1.06l-.89.89a.75.75 0 01-1.06 0z" />
              <path d="M10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 116.707 2.707a6 6 0 0010.586 10.586z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu panel -->
    <div
      id="mobile-menu"
      v-if="mobileOpen"
      class="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
    >
      <div class="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
        <NuxtLink
          to="/categories"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/categories')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/categories') ? 'page' : null"
        >
          {{ $t('header.categories') }}
        </NuxtLink>
        <NuxtLink
          to="/trending"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/trending')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/trending') ? 'page' : null"
        >
          {{ $t('header.topVideos') }}
        </NuxtLink>
        <NuxtLink
          to="/top-channels"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/top-channels')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/top-channels') ? 'page' : null"
        >
          {{ $t('header.topChannels') }}
        </NuxtLink>
        <NuxtLink
          to="/new"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/new')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/new') ? 'page' : null"
        >
          Naujausi
        </NuxtLink>
        <NuxtLink
          to="/live-upcoming"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/live-upcoming')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/live-upcoming') ? 'page' : null"
        >
          {{ $t('header.liveUpcoming') }}
        </NuxtLink>
        <NuxtLink
          to="/top-videos"
          @click="mobileOpen = false"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition',
            isActiveRoute('/top-videos')
              ? 'text-primary-600 dark:text-primary-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
          :aria-current="isActiveRoute('/top-videos') ? 'page' : null"
        >
          Populiariausi
        </NuxtLink>
        <div class="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
          <NuxtLink
            to="/submit-channel"
            @click="mobileOpen = false"
            :class="[
              'w-full block px-3 py-2 text-sm font-medium rounded-md transition text-center',
              isActiveRoute('/submit-channel')
                ? 'text-primary-600 dark:text-primary-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
            :aria-current="isActiveRoute('/submit-channel') ? 'page' : null"
          >
            {{ $t('header.submitChannel') }}
          </NuxtLink>
        </div>
        <div class="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
          <!-- Auth buttons for mobile -->
          <div v-if="isAuthenticated" class="px-3 py-2 space-y-2">
            <NuxtLink
              to="/admin"
              @click="mobileOpen = false"
              class="w-full block px-3 py-2 text-sm font-medium rounded-md text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Admin
            </NuxtLink>
            <button
              @click="handleSignOut(); mobileOpen = false"
              class="w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Atsijungti
            </button>
          </div>
          <!-- <div v-else class="px-3 py-2">
            <NuxtLink
              to="/login"
              @click="mobileOpen = false"
              class="w-full block px-3 py-2 text-sm font-medium rounded-md text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Prisijungti
            </NuxtLink>
          </div> -->
          
          <button
            @click="toggleTheme(); mobileOpen = false"
            class="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {{ $t('header.toggleTheme') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
// import LanguageSwitcher from '~/components/LanguageSwitcher.vue'

const route = useRoute()
const { isAuthenticated, user, signOut, initialize } = useAuth()
const THEME_KEY = 'ytplay_theme'
const theme = ref('system')
const isDark = ref(false)
const mobileOpen = ref(false)
const isHidden = ref(false)
const lastScrollY = ref(0)
const scrollThreshold = 50 // Minimum scroll distance before hiding/showing

// Computed property to check if a route is active
const isActiveRoute = (path) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

function applyTheme(val) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  if (val === 'dark') {
    el.classList.add('dark')
    isDark.value = true
  } else if (val === 'light') {
    el.classList.remove('dark')
    isDark.value = false
  } else {
    // system
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      el.classList.add('dark')
      isDark.value = true
    } else {
      el.classList.remove('dark')
      isDark.value = false
    }
  }
}

function toggleTheme() {
  if (theme.value === 'dark') theme.value = 'light'
  else theme.value = 'dark'

  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, theme.value)
  applyTheme(theme.value)
}

async function handleSignOut() {
  await signOut()
}

function onKeydown(e) {
  if (e.key === 'Escape' && mobileOpen.value) {
    mobileOpen.value = false
  }
}

function onScroll() {
  if (typeof window === 'undefined') return

  const currentScrollY = window.scrollY

  // Only apply hide/show behavior on mobile screens
  if (window.innerWidth >= 640) { // sm breakpoint
    isHidden.value = false
    return
  }

  // Show header when scrolling up or at the very top
  if (currentScrollY < lastScrollY.value || currentScrollY < scrollThreshold) {
    isHidden.value = false
  }
  // Hide header when scrolling down past threshold
  else if (currentScrollY > lastScrollY.value && currentScrollY > scrollThreshold) {
    isHidden.value = true
  }

  lastScrollY.value = currentScrollY
}

onMounted(async () => {
  // Initialize auth state
  await initialize()
  
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY)
    theme.value = stored || 'system'
  } else theme.value = 'system'
  applyTheme(theme.value)
  
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', onScroll, { passive: true })
  }
  
  // Fallback: ensure content is visible even if theme application fails
  // setTimeout(() => {
  //   if (typeof document !== 'undefined') {
  //     document.body.classList.add('theme-applied')
  //   }
  // }, 100)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', onScroll)
  }
})
</script>

<style scoped>
/* small helper for header visual balance */
</style>
