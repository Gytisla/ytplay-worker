// composables/useCookieConsent.ts
import { reactive, computed } from 'vue'

// Global reactive state shared across all components
const cookieConsentState = reactive({
  showBanner: false,
  showDetailedSettings: false
})

// Make it globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).cookieConsentState = cookieConsentState
}

const COOKIE_CONSENT_KEY = 'ytplay_cookie_consent'

interface CookieSettings {
  necessary: boolean
  analytics: boolean
  functional: boolean
  timestamp: number
}

export const useCookieConsent = () => {
  const loadSettings = () => {
    const savedSettings = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!savedSettings) {
      cookieConsentState.showBanner = true
    }
    return savedSettings ? JSON.parse(savedSettings) : null
  }

  const saveSettings = (settings: CookieSettings) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(settings))
    applyCookieSettings(settings)
  }

  const applyCookieSettings = (settings: CookieSettings) => {
    // Disable Google Analytics if not accepted
    if (!settings.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }

    // You can add more cookie management logic here
    // For example, disabling other tracking scripts
  }

  const acceptAll = () => {
    const settings: CookieSettings = {
      necessary: true,
      analytics: true,
      functional: true,
      timestamp: Date.now()
    }
    saveSettings(settings)
    cookieConsentState.showBanner = false
    cookieConsentState.showDetailedSettings = false
  }

  const rejectAll = () => {
    const settings: CookieSettings = {
      necessary: true,
      analytics: false,
      functional: false,
      timestamp: Date.now()
    }
    saveSettings(settings)
    cookieConsentState.showBanner = false
    cookieConsentState.showDetailedSettings = false
  }

  const openSettings = () => {
    console.log('openSettings called, current state:', cookieConsentState.showBanner, cookieConsentState.showDetailedSettings)
    cookieConsentState.showBanner = true
    cookieConsentState.showDetailedSettings = true
    console.log('After setting:', cookieConsentState.showBanner, cookieConsentState.showDetailedSettings)
  }

  const closeBanner = () => {
    cookieConsentState.showBanner = false
    cookieConsentState.showDetailedSettings = false
  }

  return {
    showBanner: computed(() => cookieConsentState.showBanner),
    showDetailedSettings: computed(() => cookieConsentState.showDetailedSettings),
    loadSettings,
    saveSettings,
    acceptAll,
    rejectAll,
    openSettings,
    closeBanner
  }
}