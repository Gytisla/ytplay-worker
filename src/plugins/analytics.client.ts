// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export default defineNuxtPlugin(() => {
  // Simple Google tag (gtag.js) insertion — exact snippet requested by user
  const GA_ID = 'G-CH9Z7W3PXR'

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  const inline = document.createElement('script')
  inline.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`
  document.head.appendChild(inline)
})