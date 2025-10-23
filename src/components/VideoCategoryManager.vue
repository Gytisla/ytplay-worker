<template>
  <div v-if="hasRole('admin')" class="mb-3 flex-shrink-0">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600 dark:text-gray-400">Category:</span>
      <select
        v-model="selectedCategoryId"
        @change="updateCategory"
        :disabled="updating"
        class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        <option value="">No Category</option>
        <option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.icon }} {{ category.name }}
        </option>
      </select>
      <div v-if="updating" class="flex items-center">
        <svg class="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div v-if="updateMessage" :class="['text-sm', updateMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
        {{ updateMessage.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// Type declarations for auto-imported composables
declare function useAuth(): {
  hasRole: (role: string) => boolean
  initialize: () => Promise<void>
}

interface Category {
  id: string
  name: string
  key: string
  color: string
  icon: string
}

interface Props {
  videoId: string
  currentCategoryId?: string
}

const props = defineProps<Props>()

const { hasRole, initialize } = useAuth()
const categories = ref<Category[]>([])
const selectedCategoryId = ref(props.currentCategoryId || '')
const updating = ref(false)
const updateMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

// Load categories
const loadCategories = async () => {
  try {
    const response = await $fetch<Category[]>('/api/categories')
    categories.value = response
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

// Update video category
const updateCategory = async () => {
  if (!selectedCategoryId.value && !props.currentCategoryId) return

  updating.value = true
  updateMessage.value = null

  try {
    await $fetch(`/api/admin/video-category`, {
      method: 'PUT',
      body: {
        videoId: props.videoId,
        categoryId: selectedCategoryId.value || null
      }
    })

    updateMessage.value = {
      type: 'success',
      text: 'Category updated successfully!'
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      updateMessage.value = null
    }, 3000)

  } catch (error) {
    console.error('Error updating category:', error)
    updateMessage.value = {
      type: 'error',
      text: 'Failed to update category'
    }
  } finally {
    updating.value = false
  }
}

// Watch for prop changes
watch(() => props.currentCategoryId, (newVal) => {
  selectedCategoryId.value = newVal || ''
})

onMounted(async () => {
  // Ensure auth state is initialized
  await initialize()
  
  if (hasRole('admin')) {
    loadCategories()
  }
})
</script>