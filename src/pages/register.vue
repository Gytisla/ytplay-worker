<template>
  <div class="min-h-[60vh] flex items-center justify-center py-12">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      <!-- Registration Disabled Notice -->
      <div v-if="!$config.public.registrationEnabled" class="text-center">
        <div class="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-6 border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Registracija laikinai išjungta
          </h2>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            Šiuo metu naujų paskyrų registracija yra laikinai sustabdyta. Prašome pabandyti vėliau arba susisiekti su administratoriumi.
          </p>
        </div>
        <div class="mt-6">
          <NuxtLink
            to="/login"
            class="w-full flex justify-center py-2 px-4 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 dark:bg-slate-700 dark:text-primary-400 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Prisijungti prie esamos paskyros
          </NuxtLink>
        </div>
      </div>

      <!-- Registration Form -->
      <div v-else>
        <div>
          <h1 class="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Susikurti paskyrą
          </h1>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Arba
            <NuxtLink to="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              prisijungti prie esamos paskyros
            </NuxtLink>
          </p>
        </div>
        <form class="space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pilnas vardas
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autocomplete="name"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Pilnas vardas"
              v-model="form.fullName"
            />
          </div>
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
              autocomplete="new-password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Slaptažodis"
              v-model="form.password"
            />
          </div>
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pakartoti slaptažodį
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Pakartoti slaptažodį"
              v-model="form.confirmPassword"
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
              Kuriama paskyra...
            </span>
            <span v-else>
              Susikurti paskyrą
            </span>
          </button>
        </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { signUp } = useAuth()
const router = useRouter()

const form = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Slaptažodžiai nesutampa'
    loading.value = false
    return
  }

  // Validate password strength
  if (form.value.password.length < 6) {
    error.value = 'Slaptažodis turi būti bent 6 simbolių ilgio'
    loading.value = false
    return
  }

  try {
    const { error: signUpError } = await signUp(
      form.value.email,
      form.value.password,
      {
        full_name: form.value.fullName
      }
    )

    if (signUpError) {
      error.value = signUpError.message || 'Registracijos klaida'
      return
    }

    // Redirect to login or show success message
    await router.push('/login?message=Patikrinkite el. paštą ir patvirtinkite paskyrą')
  } catch (err) {
    error.value = 'Įvyko netikėta klaida'
  } finally {
    loading.value = false
  }
}
</script>