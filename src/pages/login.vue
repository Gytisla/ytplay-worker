<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-6 bg-gray-50 dark:bg-slate-900">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      <div>
        <h1 class="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Prisijungti prie paskyros
        </h1>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Arba
          <NuxtLink to="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            susikurti naują paskyrą
          </NuxtLink>
        </p>
      </div>
      <form class="space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              El. paštas
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="El. paštas"
              v-model="form.email"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slaptažodis
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Slaptažodis"
              v-model="form.password"
            />
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div class="text-sm text-red-700 dark:text-red-400">
            {{ error }}
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Prisijungiama...
            </span>
            <span v-else>
              Prisijungti
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// Page meta - use no layout to prevent hydration mismatches
definePageMeta({
  layout: false
})

const { signIn, isAdmin, isAuthenticated } = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

// Watch for authentication and admin status changes
watch([isAuthenticated, isAdmin], ([authenticated, admin]) => {
  if (authenticated) {
    if (admin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }
}, { immediate: false })

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: signInError } = await signIn(form.value.email, form.value.password)

    if (signInError) {
      error.value = signInError.message || 'Prisijungimo klaida'
      return
    }

    // Redirect will happen automatically via the watcher when profile loads

  } catch (err) {
    error.value = 'Įvyko netikėta klaida'
  } finally {
    loading.value = false
  }
}
</script>