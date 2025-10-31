<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <section class="relative py-20">
      <div class="max-w-5xl mx-auto px-4 text-center">
        <h1 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
          {{ t('submitChannelPage.title') }}
        </h1>
        <p class="text-lg text-  } catch (error: any) {
    console.error('Submission error:', error)

    // Handle different error types
    if (error.statusCode === 409) {
      submitError.value = error.statusMessage || 'Šis kanalas jau buvo pateiktas.'
    } else if (error.statusCode === 429) {
      submitError.value = error.statusMessage || 'Per daug pasiūlymų. Prašome palaukti.'
    } else if (error.statusCode === 400) {
      submitError.value = error.statusMessage || 'Neteisingi duomenys. Patikrin įvestį.'
    } else {
      submitError.value = 'Įvyko klaida siunčiant pasiūlymą. Prašome bandyti vėliau.'
    }
  } finally {k:text-gray-300 max-w-2xl mx-auto">
          Turite mėgstamą YouTube kanalą? Pasiūlyk jį mūsų platformai!
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Mes peržiūrėsime ir patvirtinsime pasiūlymus rankiniu būdu
        </p>
      </div>
    </section>

    <!-- Form Section -->
    <section class="pb-20">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">

          <!-- Success Message -->
          <div
            v-if="submitSuccess"
            class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div class="flex items-start">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              <div>
                <h3 class="text-green-900 dark:text-green-100 font-medium">Pasiūlymas išsiųstas!</h3>
                <p class="text-green-800 dark:text-green-200 text-sm mt-1">
                  Ačiū už pasiūlymą. Mes peržiūrėsime jį artimiausiu metu ir informuosime apie sprendimą.
                </p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="submitError"
            class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-start">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              <div>
                <h3 class="text-red-900 dark:text-red-100 font-medium">Klaida</h3>
                <p class="text-red-800 dark:text-red-200 text-sm mt-1">{{ submitError }}</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Submission Type Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Kaip norite pateikti kanalą?
              </label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  @click="submissionType = 'handle'"
                  :class="[
                    'p-4 border rounded-lg text-left transition-all',
                    submissionType === 'handle'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                >
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 002 0z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                      <div class="font-medium">@KanaloVardas</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">pvz. @TechChannel</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  @click="submissionType = 'id'"
                  :class="[
                    'p-4 border rounded-lg text-left transition-all',
                    submissionType === 'id'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                >
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                      <div class="font-medium">Channel ID</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">pvz. UC123456789</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  @click="submissionType = 'url'"
                  :class="[
                    'p-4 border rounded-lg text-left transition-all',
                    submissionType === 'url'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  ]"
                >
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                      <div class="font-medium">YouTube URL</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">pilnas adresas</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Input Field -->
            <div v-if="submissionType">
              <label :for="inputId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ getLabelText() }}
              </label>
              <input
                :id="inputId"
                v-model="channelInput"
                :placeholder="getPlaceholderText()"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
                :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasError }"
              />
              <p v-if="hasError" class="mt-2 text-sm text-red-600 dark:text-red-400">
                {{ errorMessage }}
              </p>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ getHelpText() }}
              </p>
            </div>

            <!-- Additional Info -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <div>
                  <h3 class="text-blue-900 dark:text-blue-100 font-medium mb-1">Svarbi informacija</h3>
                  <ul class="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                    <li>• Visi pasiūlymai peržiūrimi rankiniu būdu</li>
                    <li>• Galime priimti arba atmesti pasiūlymą be paaiškinimo</li>
                    <li>• Pasiūlymas nereiškia, kad kanalas bus iškart pridėtas</li>
                    <li>• Stengiamės atsakyti per 1-2 savaites</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Hidden honeypot field for spam detection -->
            <div class="hidden">
              <label for="website">Website (leave empty)</label>
              <input
                id="website"
                v-model="honeypot"
                type="text"
                autocomplete="off"
              />
            </div>
            <button
              type="submit"
              :disabled="!canSubmit || isSubmitting"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Siunčiama...' : 'Pateikti pasiūlymą' }}
            </button>
          </form>
        </div>

        <!-- Guidelines -->
        <div class="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kanalų atrankos kriterijai</h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Rekomenduojame</h4>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Kokybišką turinį</li>
                <li>• Reguliarius įrašus</li>
                <li>• Didelį prenumeratorių skaičių</li>
                <li>• Įdomias temas</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Netinkami kanalai</h4>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Šlamštas arba spam</li>
                <li>• Pažeidžiantys taisykles</li>
                <li>• Nekokybiškas turinys</li>
                <li>• Dubliuoti kanalai</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// make TS happy in this file for useHead (Nuxt auto-import may already provide it)
declare const useHead: any

// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string }

import { ref, computed } from 'vue'
const { t } = useI18n()

// Form state
const submissionType = ref('')
const channelInput = ref('')
const honeypot = ref('') // Hidden field for spam detection
const pageLoadTime = ref(Date.now()) // For minimum submission time check
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')
const inputId = 'channel-input'

// Computed properties
const hasError = computed(() => {
  if (!channelInput.value.trim()) return false
  return !isValidInput()
})

const errorMessage = computed(() => {
  if (!channelInput.value.trim()) return ''

  switch (submissionType.value) {
    case 'handle':
      if (!channelInput.value.startsWith('@')) {
        return 'Kanalo vardas turi prasidėti @ simboliu'
      }
      if (channelInput.value.length < 3) {
        return 'Kanalo vardas per trumpas'
      }
      break
    case 'id':
      if (!channelInput.value.startsWith('UC') || channelInput.value.length !== 24) {
        return 'Channel ID turi prasidėti "UC" ir būti 24 simbolių ilgio'
      }
      break
    case 'url':
      if (!isValidYouTubeUrl(channelInput.value)) {
        return 'Neteisingas YouTube URL formatas'
      }
      break
  }
  return ''
})

const canSubmit = computed(() => {
  return submissionType.value &&
         channelInput.value.trim() &&
         isValidInput() &&
         !isSubmitting.value
})

// Helper functions
function getLabelText() {
  switch (submissionType.value) {
    case 'handle': return 'Kanalo @vardas'
    case 'id': return 'Channel ID'
    case 'url': return 'YouTube URL'
    default: return 'Kanalo informacija'
  }
}

function getPlaceholderText() {
  switch (submissionType.value) {
    case 'handle': return '@TechChannel'
    case 'id': return 'UC1234567890abcdef'
    case 'url': return 'https://www.youtube.com/channel/UC...'
    default: return ''
  }
}

function getHelpText() {
  switch (submissionType.value) {
    case 'handle': return 'Įvesk kanalo @vardą iš YouTube (prasideda @ simboliu)'
    case 'id': return 'Channel ID galima rasti kanalo URL arba naudoti YouTube Data API'
    case 'url': return 'Pilnas kanalo URL iš YouTube'
    default: return ''
  }
}

function isValidInput() {
  if (!channelInput.value.trim()) return false

  switch (submissionType.value) {
    case 'handle':
      return channelInput.value.startsWith('@') && channelInput.value.length >= 3
    case 'id':
      return channelInput.value.startsWith('UC') && channelInput.value.length === 24
    case 'url':
      return isValidYouTubeUrl(channelInput.value)
    default:
      return false
  }
}

function isValidYouTubeUrl(url: string) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')
  } catch {
    return false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return

  // Check honeypot field (basic spam protection)
  if (honeypot.value.trim()) {
    submitError.value = 'Forma buvo užpildyta neteisingai.'
    return
  }

  // Minimum time check (prevent instant submissions)
  const timeSinceLoad = Date.now() - pageLoadTime.value
  if (timeSinceLoad < 3000) { // 3 seconds minimum
    submitError.value = 'Prašome palaukti prieš siunčiant.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    // Send submission to API
    await $fetch('/api/channel-submissions', {
      method: 'POST',
      body: {
        submissionType: submissionType.value,
        channelInput: channelInput.value
      }
    })

    // Reset form
    submissionType.value = ''
    channelInput.value = ''
    submitSuccess.value = true

    // Hide success message after 5 seconds
    setTimeout(() => {
      submitSuccess.value = false
    }, 5000)

  } catch (error: any) {
    console.error('Submission error:', error)

    // Handle different error types
    if (error.statusCode === 409) {
      submitError.value = 'Šis kanalas jau buvo pasiūlytas ir laukia peržiūros.'
    } else if (error.statusCode === 400) {
      submitError.value = error.statusMessage || 'Neteisingi duomenys. Patikrink įvestį.'
    } else {
      submitError.value = 'Įvyko klaida siunčiant pasiūlymą. Prašome bandyti vėliau.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Meta tags
useHead({
  title: () => `${t('submitChannelPage.title')} | ToPlay.lt`,
  meta: [
    {
      name: 'description',
      content: () => t('submitChannelPage.metaDescription')
    },
    {
      property: 'og:title',
      content: () => t('submitChannelPage.metaTitle')
    },
    {
      property: 'og:description',
      content: () => t('submitChannelPage.ogDescription')
    }
  ]
})
</script>