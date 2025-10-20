<template>
  <nav aria-label="Breadcrumb" class="mb-6">
    <ol class="flex flex-wrap items-center space-x-2 gap-y-1 text-sm overflow-hidden mt-2">
      <li class="flex items-center">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-muted dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          {{ t('common.home') }}
        </NuxtLink>
        <svg v-if="breadcrumbs.length > 0" class="w-4 h-4 text-muted dark:text-gray-400 ml-2 mr-2 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </li>

      <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center min-w-0">
        <NuxtLink
          v-if="crumb.to"
          :to="crumb.to"
          :class="[
            'text-muted dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition',
            index === breadcrumbs.length - 1
              ? 'flex-1 min-w-0 truncate block'
              : 'whitespace-nowrap'
          ]"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
          :title="crumb.label"
        >
          {{ crumb.label }}
        </NuxtLink>

        <span
          v-else
          :class="[
            'text-gray-900 dark:text-gray-50 font-medium',
            index === breadcrumbs.length - 1
              ? 'flex-1 min-w-0 truncate block'
              : 'whitespace-nowrap'
          ]"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
          :title="crumb.label"
        >
          {{ crumb.label }}
        </span>

        <svg v-if="index < breadcrumbs.length - 1" class="w-4 h-4 text-muted dark:text-gray-400 ml-2 mr-2 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
const { t } = useI18n()

interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  breadcrumbs: BreadcrumbItem[]
}

defineProps<Props>()
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
</style>