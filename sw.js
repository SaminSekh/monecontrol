// ============================================
// sw.js — Service Worker (PWA Offline Support)
// ============================================

const CACHE_NAME = 'money-manager-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/pages.css',
  './js/db.js',
  './js/utils.js',
  './js/app.js',
  './js/dashboard.js',
  './js/money.js',
  './js/loans.js',
  './js/payments.js',
  './js/insurance.js',
  './js/freelancing.js',
  './js/reports.js',
  './js/settings.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// External CDN resources
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.3/chart.umd.min.js'
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache CDN resources
        if (response.ok) {
          const url = event.request.url;
          const isCDN = CDN_ASSETS.some(cdn => url.includes(new URL(cdn).hostname));
          const isLocal = url.includes(self.location.origin);
          if (isCDN || isLocal) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
