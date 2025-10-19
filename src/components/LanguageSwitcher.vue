<template>
  <div class="relative inline-block">
    <button
      @click="toggleDropdown"
      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
      :class="{ 'ring-2 ring-indigo-500': isOpen }"
    >
      <span>{{ currentLocaleName }}</span>
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown menu -->
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700"
        @click.stop
      >
        <div class="py-1">
          <button
            v-for="locale in availableLocales"
            :key="locale.code"
            @click="switchLocale(locale.code)"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
            :class="{
              'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white': locale.code === locale
            }"
          >
            <span class="flex-1 text-left">{{ locale.name }}</span>
            <svg
              v-if="locale.code === locale"
              class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const { locale, locales, setLocale } = useI18n()
const isOpen = ref(false)

const availableLocales = computed(() => {
  return locales.value.map((loc: any) => ({
    code: loc.code,
    name: loc.name
  }))
})

const currentLocaleName = computed(() => {
  const current = availableLocales.value.find((loc: any) => loc.code === locale.value)
  return current?.name || 'English'
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const switchLocale = async (newLocale: string) => {
  await setLocale(newLocale)
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>