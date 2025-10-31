<template>
  <div
    v-if="showBanner"
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg"
  >
    <div class="max-w-6xl mx-auto px-4 py-4">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Slapukų nustatymai
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Mes naudojame slapukus, kad pagerintume jūsų patirtį mūsų svetainėje.
            Galite pasirinkti, kuriuos slapukus priimti.
          </p>
        </div>

        <div class="flex flex-row gap-3">
          <button
            @click="acceptAll"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Priimti visus
          </button>
          <button
            @click="rejectAll"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            Atmesti visus
          </button>
          <button
            @click="showSettings"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Nustatymai
          </button>
        </div>
      </div>

      <!-- Detailed Settings Panel -->
      <div
        v-if="showDetailedSettings"
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Būtini slapukai</h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">Reikalingi svetainės veikimui</p>
            </div>
            <div class="flex items-center">
              <input
                type="checkbox"
                :checked="true"
                disabled
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
              <span class="ml-2 text-xs text-gray-500">Privalomi</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Google Analytics</h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">Lankytojų statistika ir analizė</p>
            </div>
            <label class="flex items-center">
              <input
                v-model="analyticsEnabled"
                type="checkbox"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
            </label>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Funkciniai slapukai</h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">Kalbos ir kitų nustatymų išsaugojimas</p>
            </div>
            <label class="flex items-center">
              <input
                v-model="functionalEnabled"
                type="checkbox"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              >
            </label>
          </div>

          <div class="flex justify-between items-center pt-2">
            <NuxtLink
              to="/privacy"
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            >
              Sužinok daugiau apie slapukus
            </NuxtLink>
            <button
              @click="saveSettingsHandler"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Išsaugoti nustatymus
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCookieConsent } from '../composables/useCookieConsent'

// Use the composable for shared state management
const {
  showBanner,
  showDetailedSettings,
  loadSettings,
  saveSettings,
  acceptAll,
  rejectAll,
  openSettings,
  closeBanner
} = useCookieConsent()

// Local state for the detailed settings toggles
const analyticsEnabled = ref(true)
const functionalEnabled = ref(true)

// Initialize local state with saved settings
onMounted(() => {
  const settings = loadSettings()
  if (settings) {
    analyticsEnabled.value = settings.analytics
    functionalEnabled.value = settings.functional
  }
})

// Click handlers
const showSettings = () => {
  openSettings()
}

const saveSettingsHandler = () => {
  const settings = {
    necessary: true,
    analytics: analyticsEnabled.value,
    functional: functionalEnabled.value,
    timestamp: Date.now()
  }
  saveSettings(settings)
  closeBanner()
}
</script>