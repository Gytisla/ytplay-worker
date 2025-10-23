<template>
  <div class="space-y-6">
    <!-- Users Table -->
    <div class="bg-white dark:bg-slate-800 shadow-lg overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-5">
        <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
          All Users
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          A list of all registered users in the system.
        </p>
      </div>
      <div v-if="loading" class="px-6 py-5">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
        </div>
      </div>
      <div v-else-if="users.length === 0" class="px-6 py-5">
        <p class="text-gray-500 dark:text-gray-400 text-center">No users found.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in users" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {{ user.full_name || 'No name' }}
                      <span v-if="isMainAdmin(user)" class="ml-2 text-xs text-amber-600 dark:text-amber-400 font-bold">👑</span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ user.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  :value="user.role"
                  @change="(event) => updateUserRole(user.id, (event.target as HTMLSelectElement).value)"
                  class="text-sm p-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500 transition-colors duration-200"
                  :disabled="updatingUser === user.id || isMainAdmin(user)"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <span v-if="isMainAdmin(user)" class="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">(Main Admin)</span>
                <span v-else-if="updatingUser === user.id" class="ml-2 text-xs text-gray-500 dark:text-gray-400">(Updating...)</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="user.is_active ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
                <span v-if="isMainAdmin(user)" class="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">★</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="toggleUserStatus(user.id, !user.is_active)"
                  :disabled="updatingUser === user.id || isMainAdmin(user)"
                  :class="[
                    user.is_active ? 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300' : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300',
                    (updatingUser === user.id || isMainAdmin(user)) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  class="mr-3 transition-colors duration-200"
                >
                  {{ user.is_active ? 'Deactivate' : 'Activate' }}
                </button>
                <span v-if="isMainAdmin(user)" class="text-xs text-amber-600 dark:text-amber-400 font-medium">(Protected)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import type { Database } from '~/types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Page meta for middleware
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiredRole: 'admin'
})

// State
const users = ref<UserProfile[]>([])
const loading = ref(true)
const updatingUser = ref<string | null>(null)

// Main admin user ID (from seed data)
const MAIN_ADMIN_AUTH_USER_ID = '46f41081-c641-4cf8-a2ec-96fa9a0fd249'

// Check if user is the main admin
const isMainAdmin = (user: UserProfile) => {
  return user.auth_user_id === MAIN_ADMIN_AUTH_USER_ID
}

// Load users
const loadUsers = async () => {
  try {
    const response = await $fetch('/api/admin/users') as { users: UserProfile[] }
    users.value = response.users || []
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

// Update user role
const updateUserRole = async (userId: string, newRole: string) => {
  updatingUser.value = userId
  try {
    await $fetch('/api/admin/users/role', {
      method: 'PUT',
      body: { userId, role: newRole }
    })

    // Update local state
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.role = newRole as UserProfile['role']
    }
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    updatingUser.value = null
  }
}

// Toggle user status
const toggleUserStatus = async (userId: string, isActive: boolean) => {
  updatingUser.value = userId
  try {
    await $fetch('/api/admin/users/status', {
      method: 'PUT',
      body: { userId, isActive }
    })

    // Update local state
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.is_active = isActive
    }
  } catch (error) {
    console.error('Error updating user status:', error)
  } finally {
    updatingUser.value = null
  }
}

// Format date
const formatDate = (date: string | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('lt-LT')
}

// Load users on mount
onMounted(() => {
  loadUsers()
})
</script>