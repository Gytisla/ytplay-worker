export default defineNuxtPlugin(() => {
  // Apply theme immediately on client-side to prevent flash of unstyled content
  if (process.client) {
    const applyTheme = () => {
      // Get theme from localStorage or system preference
      const savedTheme = localStorage.getItem('theme')
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)

      // Apply theme class immediately
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Mark that theme has been applied
      document.documentElement.classList.add('theme-applied')
    }

    // Apply theme immediately
    applyTheme()

    // Fallback: show content after 100ms if theme plugin fails
    setTimeout(() => {
      document.documentElement.classList.add('theme-applied')
    }, 100)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', applyTheme)

    // Cleanup on unmount (though plugins don't unmount)
    return () => {
      mediaQuery.removeEventListener('change', applyTheme)
    }
  }
})