import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // A dashboard behind a login gains nothing from server rendering.
  ssr: false,
  app: {
    head: {
      title: 'Plants API Dashboard',
      meta: [{ name: 'description', content: 'Manage your Plants API keys and monitor usage.' }],
    },
  },
  // Headers for every response. They harden the app whatever the host in front of it.
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    },
  },
  $production: {
    routeRules: {
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
          // The browser may only talk to this site (connect-src), so injected script
          // cannot send data anywhere else. Inline scripts are still allowed because
          // Nuxt embeds its config in the page; a nonce-based policy would need a module.
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      },
    },
  },
  modules: ['shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  runtimeConfig: {
    // ---- Server only: never sent to the browser ----
    // Where the dashboard's server reaches the Plants API (NUXT_API_URL). This can
    // be an internal address, unlike the public URL below.
    apiUrl: 'http://localhost:3333/api/v1',
    // Secret that seals the session cookie, 32+ random characters (NUXT_SESSION_PASSWORD).
    // Required in production; the server refuses to start without it.
    sessionPassword: '',
    // Send the session cookie only over HTTPS (NUXT_COOKIE_SECURE). On by default in
    // production builds; set to false only to test a production build over plain HTTP.
    cookieSecure: process.env.NODE_ENV === 'production',
    // Trust X-Forwarded-For and X-Forwarded-Host (NUXT_TRUST_PROXY). Turn on only
    // behind a reverse proxy you control; otherwise clients could spoof them.
    trustProxy: false,

    public: {
      // The API's public URL, shown in code examples (override with NUXT_PUBLIC_API_BASE).
      // The dashboard itself never calls it from the browser.
      apiBase: 'http://localhost:3333/api/v1',
      // Public API reference page (override with NUXT_PUBLIC_DOCS_URL).
      docsUrl: 'http://localhost:3333/docs',
    },
  },
})
