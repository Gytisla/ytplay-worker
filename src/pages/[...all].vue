<template>
  <!-- Redirect page: will immediately navigate to the 404 page -->
  <div />
</template>

<script setup lang="ts">
// Navigate to the canonical 404 page for any unmatched route.
// Using navigateTo works on both server and client when executed during setup.
navigateTo('/404', { replace: true })
</script>
