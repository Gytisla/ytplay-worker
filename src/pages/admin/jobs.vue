<template>
  <div class="p-6">
    <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
      <div class="p-4 sm:p-6 flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-4 10v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2m0-8V5a2 2 0 012-2h6a2 2 0 012 2v4"/>
            </svg>
          </div>
          <div class="ml-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Job Queue Status</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Monitor background workers by job type and status</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="fetchRows"
            :disabled="loading"
            class="inline-flex items-center justify-center px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
            :title="loading ? 'Refreshing...' : 'Refresh'">
            <svg v-if="!loading" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <svg v-else class="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="text-center bg-white dark:bg-slate-800">
            <div class="text-xs text-gray-500">Total Jobs</div>
            <div class="text-2xl font-bold dark:text-blue-100">{{ totalJobs }}</div>
          </div>
          <div class="text-center bg-white dark:bg-slate-800">
            <div class="text-xs text-gray-500">Pending</div>
            <div class="text-2xl font-bold text-yellow-600">{{ totalPending }}</div>
          </div>
          <div class="text-center bg-white dark:bg-slate-800">
            <div class="text-xs text-gray-500">Running</div>
            <div class="text-2xl font-bold text-green-600">{{ totalRunning }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards by job_type -->
    <div class="mt-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <template v-for="job in groupedRows" :key="job.job_type">
          <div class="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="flex-shrink-0">
                  <svg class="h-7 w-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 1.343-3 3v6h6v-6c0-1.657-1.343-3-3-3zM12 5a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                </div>
                <div class="ml-3 min-w-0">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white truncate"><code class="truncate">{{ job.job_type }}</code></div>
                  <div class="text-xs text-gray-500 mt-0.5 truncate">Last updated: {{ formatDate(job.last_updated) }}</div>
                </div>
              </div>

              <div class="flex items-center gap-3 flex-wrap justify-end">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Pending: {{ formatNumber(job.pending || 0) }}</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Running: {{ formatNumber(job.running || 0) }}</span>
                  <button v-if="job.failed > 0" @click="openFailed(job.job_type)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Failed: {{ formatNumber(job.failed || 0) }}</button>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">Total: {{ formatNumber(job.total) }}</span>
                  <div v-if="job.avg_processing_time_seconds != null" class="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">Avg: <span class="ml-2 font-medium">{{ formatTime(job.avg_processing_time_seconds) }}</span></div>
                </div>

                <button @click="toggle(job.job_type)" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                  <svg :class="{'transform rotate-180': expanded.has(job.job_type)}" class="h-5 w-5 text-gray-500 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="px-3 sm:px-4 pb-3">
              <div class="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded overflow-hidden relative">
                <div class="h-2" :class="backlogColor(job)" :style="{ width: estBacklogPercent(job) + '%' }"></div>
              </div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">Estimated backlog: <span class="font-medium">{{ formatTime(estBacklogSeconds(job)) }}</span></div>

              <div v-if="expanded.has(job.job_type)" class="mt-3 text-sm text-gray-600 dark:text-gray-300">
                <div class="mb-3 grid grid-cols-2 gap-2">
                  <div>Last 1h: <span class="font-medium text-gray-900 dark:text-white">{{ job.last_hour || 0 }}</span></div>
                  <div>Avg proc: <span class="font-medium">{{ formatTime(job.avg_processing_time_seconds) }}</span></div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="text-xs text-gray-500 dark:text-gray-400">
                        <th class="pr-4">Status</th>
                        <th class="pr-4">Count</th>
                        <th class="pr-4">Last 1h</th>
                        <th class="pr-4">Last 24h</th>
                        <th class="pr-4">Avg proc</th>
                        <th class="pr-4">Oldest pending</th>
                        <th class="pr-4">Last updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="sr in job.status_rows" :key="sr.status" class="border-t border-gray-100 dark:border-gray-700">
                        <td class="py-2 pr-4"><span class="inline-block capitalize">{{ sr.status }}</span></td>
                        <td class="py-2 pr-4 font-medium">{{ formatNumber(sr.count) }}</td>
                        <td class="py-2 pr-4">{{ sr.last_hour || 0 }}</td>
                        <td class="py-2 pr-4">{{ sr.last_24h || 0 }}</td>
                        <td class="py-2 pr-4">{{ sr.avg_processing_time_seconds ? formatTime(sr.avg_processing_time_seconds) : '-' }}</td>
                        <td class="py-2 pr-4">{{ sr.oldest_pending ? formatDate(sr.oldest_pending) : '-' }}</td>
                        <td class="py-2 pr-4">{{ sr.last_updated ? formatDate(sr.last_updated) : '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- CRON Jobs Section -->
    <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 my-6">
      <div class="p-4 sm:p-6 flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Scheduled CRON Jobs</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Monitor automated background tasks and their schedules</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="fetchCronJobs"
            :disabled="cronLoading"
            class="inline-flex items-center justify-center px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
            :title="cronLoading ? 'Refreshing...' : 'Refresh CRON jobs'">
            <svg v-if="!cronLoading" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <svg v-else class="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700">
        <div v-if="cronJobs.length === 0 && !cronLoading" class="text-center py-4 text-gray-500 dark:text-gray-400">
          No CRON jobs found or unable to load CRON job information.
        </div>
        <div v-else-if="cronLoading" class="text-center py-4 text-gray-500 dark:text-gray-400">
          Loading CRON jobs...
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <th class="pr-4 py-2">Job Name</th>
                <th class="pr-4 py-2">Type</th>
                <th class="pr-4 py-2">Schedule</th>
                <th class="pr-4 py-2">Last Run</th>
                <th class="pr-4 py-2">Next Run</th>
                <th class="pr-4 py-2">Status</th>
                <th class="pr-4 py-2">Command</th>
                <th class="pr-4 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in cronJobs" :key="job.jobname" class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td class="py-3 pr-4">
                  <div class="font-medium text-gray-900 dark:text-white">{{ job.jobname }}</div>
                </td>
                <td class="py-3 pr-4">
                  <span v-if="cronJobCategories[job.jobname] === 'worker'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                    worker
                  </span>
                  <span v-else-if="cronJobCategories[job.jobname] === 'enqueue'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                    enqueue
                  </span>
                  <span v-else-if="cronJobCategories[job.jobname] === 'mv refresh'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                    mv refresh
                  </span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
                <td class="py-3 pr-4">
                  <code class="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs" :title="parseCronSchedule(job.schedule)">{{ job.schedule }}</code>
                </td>
                <td class="py-3 pr-4">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ job.last_run ? formatDate(job.last_run) : '-' }}</span>
                </td>
                <td class="py-3 pr-4">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ calculateNextRun(job.schedule) ? formatDate(calculateNextRun(job.schedule)!.toISOString()) : 'Unknown' }}</span>
                </td>
                <td class="py-3 pr-4">
                  <span :class="job.active ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ job.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-3 pr-4 max-w-xs">
                  <code class="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-xs break-all block truncate" :title="job.command">{{ job.command }}</code>
                </td>
                <td class="py-3 pr-4">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ job.jobid }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p class="mt-4 text-sm text-gray-600">Auto-refreshes every 15s.</p>

    <!-- Failed jobs modal (single template) -->
    <div v-if="failedModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-black/60" @click="closeFailed"></div>
  <div class="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
  <div class="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"/></svg>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Failed jobs — {{ failedModal.jobType }}</h3>
          </div>
          <div class="flex items-center gap-2">
            <button @click="closeFailed" class="px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600">Close</button>
          </div>
        </div>
        <div class="p-4 overflow-auto h-[calc(80vh-80px)]">
          <div v-if="failedModal.loading" class="text-sm text-gray-500 dark:text-gray-300">Loading...</div>
          <div v-else>
            <div v-if="failedModal.jobs.length === 0" class="text-sm text-gray-500 dark:text-gray-300">No failed jobs found.</div>
            <div v-else class="space-y-4">
              <div v-for="j in failedModal.jobs" :key="j.id" class="border rounded p-3 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <div class="font-medium truncate text-gray-900 dark:text-gray-100">ID: <code class="text-xs">{{ j.id }}</code></div>
                    <div class="text-xs text-gray-600 dark:text-gray-300 truncate">Status: {{ j.status }} • Attempts: {{ j.attempt_count }} • Updated: {{ formatDate(j.updated_at) }}</div>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">{{ j.last_error || '-' }}</div>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <button @click="j.showPayload = !j.showPayload" class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white">{{ j.showPayload ? 'Hide' : 'Show' }} payload</button>
                  </div>
                </div>
                <div v-if="j.showPayload" class="mt-2 bg-white dark:bg-slate-900 border rounded p-2 text-xs font-mono overflow-auto max-h-48 text-gray-900 dark:text-gray-100">
                  <pre class="whitespace-pre-wrap">{{ JSON.stringify(j.payload, null, 2) }}</pre>
                </div>
                <div class="mt-2 text-xs">
                  <div class="font-medium mb-1 text-gray-800 dark:text-gray-100">Events:</div>
                  <div class="flex flex-col gap-1">
                    <div v-for="ev in j.job_events || []" :key="ev.id" class="flex items-start gap-3">
                      <div class="text-xs text-gray-500 dark:text-gray-300 w-36">{{ formatDate(ev.created_at) }}</div>
                      <div class="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-slate-600 text-xs text-gray-800 dark:text-white">{{ ev.event_type }}</div>
                      <div class="text-xs text-gray-700 dark:text-gray-200">{{ ev.error_message || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Page meta like other admin pages
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiredRole: 'admin'
})

const router = useRouter()
const { initialize, isAuthenticated, isAdmin } = useAuth()

// Ensure auth initialized
await initialize()

if (process.client) {
  if (!isAuthenticated.value) {
    await router.push('/login')
  } else if (!isAdmin.value) {
    await router.push('/')
  }

}

type JobRow = {
  job_type: string | null
  status: string
  count: number
  last_hour: number | null
  last_24h: number | null
  avg_processing_time_seconds: number | null
  oldest_pending: string | null
  last_updated: string | null
}

const rows = ref<JobRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// CRON jobs data
const cronJobs = ref<any[]>([])
const cronLoading = ref(false)
const cronError = ref<string | null>(null)

// CRON job categories
const cronJobCategories = computed(() => {
  const categories: Record<string, string> = {
    'backfill_worker_every_2_minutes': 'worker',
    'process_queue_every_minute': 'worker',
    'rss_worker_every_minute': 'worker',
    'rss_poll_every_15_minutes': 'enqueue',
    'refresh_video_stats_weekly': 'enqueue',
    'refresh_medium_videos_daily': 'enqueue',
    'refresh_hot_videos_hourly': 'enqueue',
    'refresh_channel_stats_daily': 'enqueue',
    'refresh_mv_video_performance': 'mv refresh'
  }
  return categories
})

const totalJobs = computed(() => rows.value.reduce((s, r) => s + (r.count || 0), 0))
const totalPending = computed(() => rows.value.filter(r => r.status === 'pending').reduce((s, r) => s + (r.count || 0), 0))
const totalRunning = computed(() => rows.value.filter(r => r.status === 'running').reduce((s, r) => s + (r.count || 0), 0))

const groupedRows = computed(() => {
  const map = new Map<string, any>()
  for (const r of rows.value) {
    const key = r.job_type ?? 'unknown'
    if (!map.has(key)) {
      map.set(key, {
        job_type: key,
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        last_hour: 0,
        sum_processing_time_seconds: 0,
        processed_count_for_avg: 0,
        avg_processing_time_seconds: null,
        oldest_pending: null,
        last_updated: null,
        status_rows: []
      })
    }
    const cur = map.get(key)
    cur.total += r.count || 0
    cur.last_hour += r.last_hour || 0
    cur.last_updated = r.last_updated || cur.last_updated
    // keep the raw row for per-status breakdown
    cur.status_rows.push(r)
    if (r.status === 'pending') {
      cur.pending += r.count || 0
      cur.oldest_pending = cur.oldest_pending || r.oldest_pending
    } else if (r.status === 'running') cur.running += r.count || 0
    else if (r.status === 'completed') {
      cur.completed += r.count || 0
      if (r.avg_processing_time_seconds) {
        cur.sum_processing_time_seconds += r.avg_processing_time_seconds * (r.count || 1)
        cur.processed_count_for_avg += r.count || 0
      }
    } else if (r.status === 'failed' || r.status === 'dead_letter') {
      // treat dead_letter as failed for display
      cur.failed += r.count || 0
      if (r.avg_processing_time_seconds) {
        cur.sum_processing_time_seconds += r.avg_processing_time_seconds * (r.count || 1)
        cur.processed_count_for_avg += r.count || 0
      }
    }
  }
  // finalize avg (currently we're summing per-status averages; keep as-is or divide by count if you prefer)
  for (const v of map.values()) {
    if (v.processed_count_for_avg && v.processed_count_for_avg > 0) {
      // incoming per-row avg values are in seconds from database
      v.avg_processing_time_seconds = v.sum_processing_time_seconds / v.processed_count_for_avg
    } else {
      v.avg_processing_time_seconds = null
    }
  }
  return Array.from(map.values())
})

// Expanded state for collapse per job_type
const expanded = ref(new Set<string>())
function toggle(jobType: string | null) {
  if (!jobType) return
  const s = expanded.value
  if (s.has(jobType)) s.delete(jobType)
  else s.add(jobType)
  // force reactivity
  expanded.value = new Set(Array.from(s))
}

// formatSeconds removed - use formatTime instead

function formatDate(d: string | null) {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return dt.toLocaleString()
  } catch {
    return d
  }
}

function formatNumber(n: number | null) {
  if (n == null) return '0'
  return Intl.NumberFormat().format(n)
}

function parseCronSchedule(schedule: string): string {
  if (!schedule || typeof schedule !== 'string') return schedule

  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) return schedule

  const minute = parts[0] || '*'
  const hour = parts[1] || '*'
  const day = parts[2] || '*'
  const month = parts[3] || '*'
  const weekday = parts[4] || '*'

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Common patterns
  if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return 'every minute'
  }

  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.substring(2))
    if (!isNaN(interval)) {
      if (interval === 1) return 'every minute'
      return `every ${interval} minute${interval > 1 ? 's' : ''}`
    }
  }

  if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return 'every hour'
  }

  if (minute === '0' && hour.startsWith('*/')) {
    const interval = parseInt(hour.substring(2))
    if (!isNaN(interval)) {
      return `every ${interval} hour${interval > 1 ? 's' : ''}`
    }
  }

  if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
    return 'daily'
  }

  if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '0') {
    return 'weekly (Sunday)'
  }

  // Weekly at specific time
  if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
    const hr = parseInt(hour)
    const wd = parseInt(weekday)
    if (!isNaN(hr) && !isNaN(wd) && wd >= 0 && wd <= 6) {
      const timeStr = new Date(2000, 0, 1, hr, 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `weekly at ${timeStr} (${weekdays[wd]})`
    }
  }

  if (minute === '0' && hour === '0' && day === '1' && month === '*' && weekday === '*') {
    return 'monthly'
  }

  if (minute === '0' && hour === '0' && day === '1' && month === '1' && weekday === '*') {
    return 'yearly'
  }

  // Try to parse specific times
  if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
    const min = parseInt(minute)
    const hr = parseInt(hour)
    if (!isNaN(min) && !isNaN(hr)) {
      const timeStr = new Date(2000, 0, 1, hr, min).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `daily at ${timeStr}`
    }
  }

  // Fallback to original schedule
  return schedule
}

function calculateNextRun(schedule: string): Date | null {
  if (!schedule || typeof schedule !== 'string') return null

  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const minute = parts[0] || '*'
  const hour = parts[1] || '*'
  const day = parts[2] || '*'
  const month = parts[3] || '*'
  const weekday = parts[4] || '*'

  const now = new Date()

  // Handle simple patterns
  if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    // Every minute
    const next = new Date(now)
    next.setMinutes(next.getMinutes() + 1, 0, 0)
    return next
  }
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.substring(2))
    if (!isNaN(interval)) {
      const next = new Date(now)
      const currentMinute = now.getMinutes()
      const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + 1, nextMinute - 60, 0, 0)
      } else {
        next.setMinutes(nextMinute, 0, 0)
      }
      return next
    }
  }

  if (minute === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    // Every hour at minute 0
    const next = new Date(now)
    if (now.getMinutes() > 0) {
      next.setHours(next.getHours() + 1, 0, 0, 0)
    } else {
      next.setMinutes(0, 0, 0)
    }
    return next
  }

  if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
    // Daily at midnight
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
    return next
  }

  if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
    // Daily at specific hour
    const hr = parseInt(hour)
    if (!isNaN(hr)) {
      const next = new Date(now)
      next.setHours(hr, 0, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      return next
    }
  }

  if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday !== '*') {
    // Weekly on specific weekday at midnight
    const wd = parseInt(weekday)
    if (!isNaN(wd) && wd >= 0 && wd <= 6) {
      const next = new Date(now)
      const currentWeekday = now.getDay()
      let daysUntilNext = (wd - currentWeekday + 7) % 7
      if (daysUntilNext === 0 && (now.getHours() > 0 || now.getMinutes() > 0)) {
        daysUntilNext = 7
      }
      next.setDate(next.getDate() + daysUntilNext)
      next.setHours(0, 0, 0, 0)
      return next
    }
  }

  // Weekly at specific time on specific weekday
  if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
    const hr = parseInt(hour)
    const wd = parseInt(weekday)
    if (!isNaN(hr) && !isNaN(wd) && wd >= 0 && wd <= 6) {
      const next = new Date(now)
      const currentWeekday = now.getDay()
      let daysUntilNext = (wd - currentWeekday + 7) % 7

      // If it's the same weekday, check if the time has passed
      if (daysUntilNext === 0) {
        if (now.getHours() > hr || (now.getHours() === hr && now.getMinutes() > 0)) {
          daysUntilNext = 7
        }
      }

      next.setDate(next.getDate() + daysUntilNext)
      next.setHours(hr, 0, 0, 0)
      return next
    }
  }

  return null // Unknown pattern
}

function formatTime(seconds: number | null) {
  if (seconds == null) return '-'
  if (seconds < 1) return Math.round(seconds * 1000) + 'ms'
  return Number(seconds).toFixed(1) + ' sec'
}

function estBacklogSeconds(job: any) {
  // use avg_processing_time_seconds (seconds) * pending count
  const avg = job.avg_processing_time_seconds || 0
  const pending = job.pending || 0
  return avg * pending
}

function estBacklogPercent(job: any) {
  // represent backlog as percent of 24h (86400s), cap at 100
  const secs = estBacklogSeconds(job)
  const pct = Math.min(100, Math.round((secs / 86400) * 100))
  return pct
}

function backlogColor(job: any) {
  const pct = estBacklogPercent(job)
  if (pct > 75) return 'bg-red-500'
  if (pct > 35) return 'bg-yellow-500'
  return 'bg-green-500'
}

async function fetchRows() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch('/api/admin/jobs')
    if ((res as any).error) {
      error.value = (res as any).error
      rows.value = []
    } else {
      rows.value = (res as any).data ?? []
    }
  } catch (err: any) {
    error.value = err?.message ?? String(err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function fetchCronJobs() {
  cronLoading.value = true
  cronError.value = null
  try {
    const res = await $fetch('/api/admin/jobs/cron')
    if ((res as any).error) {
      cronError.value = (res as any).error
      cronJobs.value = []
    } else {
      cronJobs.value = (res as any).data ?? []
    }
  } catch (err: any) {
    cronError.value = err?.message ?? String(err)
    cronJobs.value = []
  } finally {
    cronLoading.value = false
  }
}

let timer: number | null = null
onMounted(() => {
  fetchRows()
  fetchCronJobs() // Also fetch CRON jobs on mount
  timer = window.setInterval(fetchRows, 15000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Modal state for failed jobs
const failedModal = ref({ open: false, jobType: '', loading: false, jobs: [] as any[] })

async function openFailed(jobType: string | null) {
  if (!jobType) return
  failedModal.value.open = true
  failedModal.value.jobType = jobType
  failedModal.value.loading = true
  failedModal.value.jobs = []
  try {
    const res = await $fetch(`/api/admin/jobs/failed?job_type=${encodeURIComponent(jobType)}`)
    // debug when empty
    if ((res as any).error) {
      console.debug('failed API error', res)
      failedModal.value.jobs = []
    } else {
      const jobs = (res as any).jobs ?? []
      if (!jobs || jobs.length === 0) console.debug('failed API empty response', res)
      failedModal.value.jobs = jobs
    }
  } catch (err) {
    failedModal.value.jobs = []
  } finally {
    failedModal.value.loading = false
  }
}

function closeFailed() {
  failedModal.value.open = false
  failedModal.value.jobType = ''
  failedModal.value.jobs = []
}
</script>

<style scoped>
table th, table td { border-bottom: 1px solid rgba(0,0,0,0.06); }
</style>
