// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export default defineNuxtPlugin(() => {
  // Google Analytics ID
  const GA_ID = 'G-CH9Z7W3PXR'

  // Only load Google Analytics if GA_ID is set
  if (!GA_ID) {
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

  // Configure Google Analytics
  gtag('js', new Date())
  gtag('config', GA_ID)
})