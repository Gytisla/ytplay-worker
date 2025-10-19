// plugins/router.client.ts
// Keep this plugin lightweight and TypeScript-safe. We only patch console.warn
// once to suppress the specific Vue Router warning about unmatched routes.
export default defineNuxtPlugin(() => {
  if (process.server) return // only run on client

  const globalAny = globalThis as any
  if (globalAny.__ytplay_router_warn_patched) return
  globalAny.__ytplay_router_warn_patched = true

  const originalWarn = console.warn.bind(console)
  console.warn = (...args: any[]) => {
    try {
      const first = args[0]
      if (typeof first === 'string' && first.includes('[Vue Router warn]: No match found for location with path')) {
        // suppress this specific router warning
        return
      }
    } catch (e) {
      // If anything goes wrong, fall back to original behavior
    }
    originalWarn(...args)
  }
})
