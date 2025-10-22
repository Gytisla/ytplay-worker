<template>
  <div class="min-h-[60vh]">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Categorization Rules</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Manage automatic video categorization rules
          </p>
        </div>
        <div class="flex space-x-3">
          <NuxtLink
            to="/admin"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            ← Back to Dashboard
          </NuxtLink>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Rule
          </button>
        </div>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="bg-white dark:bg-slate-800 shadow-lg overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-5">
        <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
          All Categorization Rules
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Rules are processed in priority order (lower numbers first). Only active rules are applied.
        </p>
      </div>
      <div v-if="loading" class="px-6 py-5">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Loading rules...</span>
        </div>
      </div>
      <div v-else-if="rules.length === 0" class="px-6 py-5">
        <p class="text-gray-500 dark:text-gray-400 text-center">No categorization rules found.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Conditions
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="rule in rules" :key="rule.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ rule.priority }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ rule.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="text-lg mr-2">{{ rule.video_categories?.icon }}</span>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ rule.video_categories?.name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ rule.video_categories?.key }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {{ formatConditions(rule.conditions) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="rule.active ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ rule.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="editRule(rule)"
                  class="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-3 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  @click="deleteRule(rule.id)"
                  class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingRule" class="fixed inset-0 bg-gray-600 dark:bg-black bg-opacity-50 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-slate-800" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ editingRule ? 'Edit Rule' : 'Create New Rule' }}
          </h3>

          <form @submit.prevent="saveRule" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                v-model="ruleForm.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <input
                v-model.number="ruleForm.priority"
                type="number"
                required
                min="1"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Lower numbers = higher priority</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                v-model="ruleForm.category_id"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
              <input
                v-model="ruleForm.active"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conditions</label>
              <div class="space-y-2">
                <div v-for="(condition, index) in ruleForm.conditionsArray" :key="index" class="flex space-x-2">
                  <select
                    v-model="condition.type"
                    class="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="channel_id">Channel ID</option>
                    <option value="title_contains">Title Contains</option>
                    <option value="description_contains">Description Contains</option>
                    <option value="title_regex">Title Regex</option>
                    <option value="duration_lt">Duration Less Than (seconds)</option>
                  </select>
                  <input
                    v-model="condition.value"
                    type="text"
                    placeholder="Value"
                    class="flex-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    @click="removeCondition(index)"
                    class="px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  @click="addCondition"
                  class="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 text-sm"
                >
                  + Add Condition
                </button>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
              >
                {{ saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Page meta for middleware
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

// Types
interface CategorizationRule {
  id: string
  priority: number
  name: string
  conditions: Record<string, unknown>
  category_id: string
  active: boolean
  video_categories?: {
    id: string
    name: string
    key: string
    color: string
    icon: string
  }
}

interface VideoCategory {
  id: string
  name: string
  key: string
  color: string
  icon: string
}

interface Condition {
  type: string
  value: string
}

// State
const rules = ref<CategorizationRule[]>([])
const categories = ref<VideoCategory[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingRule = ref<CategorizationRule | null>(null)
const saving = ref(false)

const ruleForm = ref({
  name: '',
  priority: 100,
  category_id: '',
  active: true,
  conditionsArray: [] as Condition[]
})

// Computed
const ruleFormConditions = computed(() => {
  const conditions: Record<string, unknown> = {}
  ruleForm.value.conditionsArray.forEach((condition, index) => {
    if (condition.type && condition.value) {
      conditions[condition.type] = condition.value
    }
  })
  return conditions
})

// Methods
const loadRules = async () => {
  try {
    const response = await $fetch('/api/admin/categorization') as { rules: CategorizationRule[] }
    rules.value = response.rules || []
  } catch (error) {
    console.error('Error loading rules:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await $fetch('/api/admin/categories') as { categories: VideoCategory[] }
    categories.value = response.categories || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const formatConditions = (conditions: Record<string, unknown>) => {
  const parts = []
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'channel_id':
        parts.push(`Channel: ${String(value).slice(0, 8)}...`)
        break
      case 'title_contains':
        parts.push(`Title: "${String(value)}"`)
        break
      case 'description_contains':
        parts.push(`Desc: "${String(value)}"`)
        break
      case 'title_regex':
        parts.push(`Title ~ /${String(value)}/`)
        break
      case 'duration_lt':
        parts.push(`Duration < ${String(value)}s`)
        break
      default:
        parts.push(`${key}: ${String(value)}`)
    }
  }
  return parts.join(', ')
}

const addCondition = () => {
  ruleForm.value.conditionsArray.push({ type: 'title_contains', value: '' })
}

const removeCondition = (index: number) => {
  ruleForm.value.conditionsArray.splice(index, 1)
}

const editRule = (rule: CategorizationRule) => {
  editingRule.value = rule
  ruleForm.value = {
    name: rule.name,
    priority: rule.priority,
    category_id: rule.category_id,
    active: rule.active,
    conditionsArray: Object.entries(rule.conditions).map(([type, value]) => ({
      type,
      value: String(value)
    }))
  }
}

const saveRule = async () => {
  saving.value = true
  try {
    const ruleData = {
      name: ruleForm.value.name,
      priority: ruleForm.value.priority,
      category_id: ruleForm.value.category_id,
      active: ruleForm.value.active,
      conditions: ruleFormConditions.value
    }

    if (editingRule.value) {
      // Update existing rule
      await $fetch(`/api/admin/categorization/${editingRule.value.id}`, {
        method: 'PUT',
        body: ruleData
      })
    } else {
      // Create new rule
      await $fetch('/api/admin/categorization', {
        method: 'POST',
        body: ruleData
      })
    }

    await loadRules()
    closeModal()
  } catch (error) {
    console.error('Error saving rule:', error)
  } finally {
    saving.value = false
  }
}

const deleteRule = async (ruleId: string) => {
  if (!confirm('Are you sure you want to delete this rule?')) return

  try {
    await $fetch(`/api/admin/categorization/${ruleId}`, {
      method: 'DELETE'
    })
    await loadRules()
  } catch (error) {
    console.error('Error deleting rule:', error)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingRule.value = null
  ruleForm.value = {
    name: '',
    priority: 100,
    category_id: '',
    active: true,
    conditionsArray: []
  }
}

// Load data on mount
onMounted(() => {
  loadRules()
  loadCategories()
})
</script>