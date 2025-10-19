<template>
  <div>
    <!-- This page redirects to the UUID-based route for backward compatibility -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading channel...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This page handles SEO-friendly channel URLs using slugs
// It will redirect to the UUID-based route for actual rendering

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

// Fetch channel by slug and redirect to UUID route
onMounted(async () => {
  try {
    const { data: channel } = await $fetch(`/api/public/channel/${slug}`)

    if (channel && channel.id) {
      // Redirect to the UUID-based route
      await router.replace(`/channel/${channel.id}`)
    } else {
      // Channel not found
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }
  } catch (error) {
    console.error('Error loading channel by slug:', error)
    throw createError({
      statusCode: 404,
      statusMessage: 'Channel not found'
    })
  }
})
</script>