<template>
  <div class="space-y-6 sm:space-y-8">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Channel Submissions</h1>
        <button
          @click="fetchList"
          :disabled="loading"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Refresh
        </button>
      </div>

      <div class="space-y-3">
        <div v-for="s in subs" :key="s.id" class="border rounded p-3 bg-white dark:bg-slate-800">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 w-full">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white truncate"><code class="font-mono text-sm">{{ s.submitted_value }}</code></div>
                    <div v-if="s.submission_type" class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      <span class="inline-block px-2 py-0.5 rounded bg-gray-50 dark:bg-slate-700 text-xs">{{ s.submission_type }}</span>
                    </div>
                  </div>
                  <button @click="copyToClipboard(s.submitted_value)" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"> 
                    <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Copy Value
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400">by</span>
                  <div class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ displaySubmitter(s) }}</div>
                  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="{
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200': s.status === 'pending',
                    'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200': s.status === 'approved',
                    'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200': s.status === 'rejected',
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200': s.status === 'duplicate',
                    'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200': true
                  }">{{ s.status }}</span>
                </div>
              </div>

              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                <div>Submitted: {{ formatDate(s.submitted_at) }}</div>
                <div class="flex items-center gap-2">ID:
                  <code class="ml-1 px-1 py-0.5 rounded bg-gray-50 dark:bg-slate-700 text-xs">{{ s.id }}</code>
                  <button @click="copyToClipboard(s.id)" class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-600">Copy</button>
                </div>
              </div>
            </div>

            <div class="flex-shrink-0 flex flex-col items-end gap-2">
              <div class="flex flex-col sm:flex-row gap-2">
                <button @click="openDetail(s)" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"> 
                  <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Details
                </button>
                <button v-if="s.status === 'pending'" @click="doAction(s.id, 'approved')" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 text-sm text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"> 
                  <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Approve
                </button>
              </div>
                <div class="flex flex-col sm:flex-row gap-2">
                <button v-if="s.status === 'pending'" @click="doAction(s.id, 'rejected')" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800 hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"> 
                  <svg class="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Reject
                </button>
                <button v-if="s.status === 'pending'" @click="doAction(s.id, 'duplicate')" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-800 hover:scale-105 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"> 
                  <svg class="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h4l3 10 4-18 3 8h4"/></svg>
                  Duplicate
                </button>
                <button v-if="s.status !== 'pending'" @click="doAction(s.id, 'pending')" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-transparent border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"> 
                  <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/></svg>
                  Reopen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="detail.open" class="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-black/50" @click="closeDetail"></div>
      <div class="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-2xl p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900 dark:text-white">Submission detail</h3>
          <button @click="closeDetail" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"> 
            <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            Close
          </button>
        </div>
        <div>
          <div class="text-sm text-gray-800 dark:text-gray-200">Type: <span class="font-medium">{{ detail.item.submission_type || '-' }}</span></div>
          <div class="mt-2 text-lg font-semibold text-gray-900 dark:text-white"><code class="font-mono text-base">{{ detail.item.submitted_value }}</code></div>
          <div class="text-sm text-gray-800 dark:text-gray-200">IP: {{ detail.item?.client_ip || '-' }}</div>
          <div class="text-sm text-gray-800 dark:text-gray-200">Submitted: {{ formatDate(detail.item.submitted_at) }}</div>
          <div class="mt-2">
            <label class="block text-xs text-gray-600 dark:text-gray-400">Review notes</label>
            <textarea v-model="detail.notes" class="w-full p-2 border rounded text-sm dark:bg-slate-700 dark:text-gray-200"></textarea>
          </div>
          <div class="mt-3 flex gap-2">
            <button @click="doAction(detail.item.id, 'approved', detail.notes)" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:brightness-95 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"> 
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Approve
            </button>
            <button @click="doAction(detail.item.id, 'rejected', detail.notes)" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:brightness-95 hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"> 
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Reject
            </button>
            <button @click="doAction(detail.item.id, 'duplicate', detail.notes)" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white hover:brightness-95 hover:scale-105 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"> 
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h4l3 10 4-18 3 8h4"/></svg>
              Duplicate
            </button>
            <button v-if="detail.item && detail.item.status !== 'pending'" @click="doAction(detail.item.id, 'pending')" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-transparent border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"> 
              <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/></svg>
              Reopen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Page meta for admin layout & middleware
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiredRole: 'admin'
})

const router = useRouter()
const { isAuthenticated, isAdmin, initialize } = useAuth()

// Initialize auth (same pattern as other admin pages)
await initialize()

if (process.client) {
  if (!isAuthenticated.value) {
    await router.push('/login')
  } else if (!isAdmin.value) {
    await router.push('/')
  }
}

const subs = ref<any[]>([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/channel-submissions')
    if ((res as any).error) subs.value = []
    else subs.value = (res as any).data ?? []
  } catch (err) {
    subs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchList())

const detail = ref({ open: false, item: null as any, notes: '' })
function openDetail(it: any) {
  detail.value.open = true
  detail.value.item = it
  detail.value.notes = it.review_notes || ''
}
function closeDetail() { detail.value.open = false; detail.value.item = null }

async function doAction(id: string, action: string, notes?: string) {
  try {
    const body: any = { action }
    if (notes) body.review_notes = notes
    const res = await $fetch(`/api/admin/channel-submissions/${id}/action`, { method: 'POST', body })
    if ((res as any).error) alert('Error: ' + (res as any).error)
    else {
      await fetchList()
      closeDetail()
    }
  } catch (err: any) {
    alert('Error: ' + String(err))
  }
}

function formatDate(d: string | null) {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

function displaySubmitter(s: any) {
  // Prefer an explicit submitter object if present, fall back to email, name, or client_ip
  if (!s) return '-'
  if (s.submitter_name) return s.submitter_name
  if (s.submitter_email) return s.submitter_email
  if (s.submitted_by) return String(s.submitted_by)
  if (s.client_ip) return s.client_ip
  return '-'
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // small visual feedback — use alert for now (keeps dependency-free)
    // later we can replace with a nicer toast component
    // but avoid spamming alerts during quick testing
    // show a very short, non-blocking info via console and small DOM hint
    console.info('Copied to clipboard:', text)
  } catch (err) {
    console.warn('Copy failed', err)
  }
}
</script>

<style scoped>
/* minimal styling — relies on existing Tailwind */
</style>
