/**
 * KochPlan Service Worker
 * 
 * Dieser Service Worker ermöglicht:
 * - Offline-Funktionalität
 - Schnelles Laden durch Caching
 * - Hintergrund-Synchronisation
 * - Push-Benachrichtigungen
 */

const CACHE_NAME = 'kochplan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon.png',
];

// Installations-Event: Cache statische Assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// Aktivierungs-Event: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch-Event: Netzwerk-Requests abfangen
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API-Requests: Network First, dann Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Bilder: Cache First, dann Network
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Statische Assets: Cache First
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Default: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Strategie: Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback für HTML-Requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Strategie: Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Strategie: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
    });
  
  return cachedResponse || fetchPromise;
}

// Hintergrund-Synchronisation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recipes') {
    console.log('[SW] Syncing recipes');
    event.waitUntil(syncRecipes());
  }
  
  if (event.tag === 'sync-shopping-list') {
    console.log('[SW] Syncing shopping list');
    event.waitUntil(syncShoppingList());
  }
});

async function syncRecipes() {
  // Rezepte mit Server synchronisieren
  // Implementation hier
}

async function syncShoppingList() {
  // Einkaufsliste mit Server synchronisieren
  // Implementation hier
}

// Push-Benachrichtigungen
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data?.text() || 'Neue Benachrichtigung von KochPlan',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'kochplan-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
      },
      {
        action: 'dismiss',
        title: 'Schließen',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('KochPlan', options)
  );
});

// Benachrichtigungs-Klicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodische Hintergrund-Synchronisation
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-recipes') {
    console.log('[SW] Periodic sync: update recipes');
    event.waitUntil(updateRecipes());
  }
});

async function updateRecipes() {
  // Periodische Updates
  // Implementation hier
}

// Nachrichten vom Haupt-Thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_ASSETS') {
    const { assets } = event.data;
    event.waitUntil(cacheAssets(assets));
  }
});

async function cacheAssets(assets) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(assets);
}
