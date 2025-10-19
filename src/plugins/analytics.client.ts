// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export default defineNuxtPlugin(() => {
  // Google Analytics ID - you should add this to your environment variables
  const GA_ID = 'GA_MEASUREMENT_ID' // Replace with your actual GA ID

  // Only load Google Analytics if GA_ID is set
  if (!GA_ID || GA_ID === 'GA_MEASUREMENT_ID') {
    console.warn('Google Analytics ID not configured')
    return
  }

  // Load Google Analytics script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  window.gtag = gtag

  // Set default consent to 'denied' initially
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted'
  })

  // Configure Google Analytics
  gtag('js', new Date())
  gtag('config', GA_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_features: false
  })

  // Check for existing cookie consent
  const cookieConsent = localStorage.getItem('ytplay_cookie_consent')
  if (cookieConsent) {
    const settings = JSON.parse(cookieConsent)
    if (settings.analytics) {
      gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
    if (settings.functional) {
      gtag('consent', 'update', {
        functionality_storage: 'granted'
      })
    }
  }
})