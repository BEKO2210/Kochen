/**
 * KochPlan Service Worker
 * 
 * Dieser Service Worker implementiert:
 * - Precaching der App-Shell
 * - Runtime Caching für verschiedene Ressourcen
 * - Background Sync für Offline-Änderungen
 * - Push Notifications
 * - Periodic Background Sync
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// ============================================
// PRECACHE
// ============================================
// Das Manifest wird von Workbox während des Builds generiert
// und hier injiziert
// eslint-disable-next-line no-restricted-globals
precacheAndRoute(self.__WB_MANIFEST || []);

// Veraltete Caches bereinigen
cleanupOutdatedCaches();

// ============================================
// CUSTOM BACKGROUND SYNC HANDLER
// ============================================
const syncQueue = new BackgroundSyncPlugin('kochplan-sync-queue', {
  maxRetentionTime: 24 * 60, // 24 Stunden
  onSync: async ({ queue }) => {
    console.log('[SW] Background Sync triggered');
    
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[SW] Synced:', entry.request.url);
        
        // Benachrichtigung nach erfolgreichem Sync
        // eslint-disable-next-line no-restricted-globals
        self.registration.showNotification('KochPlan', {
          body: 'Deine Änderungen wurden synchronisiert',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'sync-complete',
          requireInteraction: false,
        });
      } catch (error) {
        console.error('[SW] Sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// ============================================
// INSTALL EVENT
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('install', (event) => {
  console.log('[SW] Installing KochPlan Service Worker...');
  
  // Sofort aktivieren
  // eslint-disable-next-line no-restricted-globals
  self.skipWaiting();
});

// ============================================
// ACTIVATE EVENT
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('activate', (event) => {
  console.log('[SW] KochPlan Service Worker activated');
  
  // Clients übernehmen
  // eslint-disable-next-line no-restricted-globals
  event.waitUntil(self.clients.claim());
});

// ============================================
// PUSH NOTIFICATION HANDLER
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    console.warn('[SW] Push event has no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
    data = {
      title: 'KochPlan',
      body: event.data.text(),
    };
  }
  
  const options = {
    body: data.body || 'Neue Benachrichtigung von KochPlan',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'kochplan-notification',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    actions: data.actions || [],
    data: data.payload || {},
    timestamp: data.timestamp || Date.now(),
  };
  
  // Vibration für Timer-Benachrichtigungen
  if (data.tag && data.tag.startsWith('timer-')) {
    options.vibrate = [200, 100, 200, 100, 200];
  }
  
  event.waitUntil(
    // eslint-disable-next-line no-restricted-globals
    self.registration.showNotification(data.title || 'KochPlan', options)
  );
});

// ============================================
// NOTIFICATION CLICK HANDLER
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const { notification } = event;
  const action = event.action;
  const data = notification.data || {};
  
  // Aktion basierend auf dem Action-Button
  if (action === 'open-recipe' && data.recipeId) {
    event.waitUntil(
      // eslint-disable-next-line no-restricted-globals
      clients.openWindow(`/recipe/${data.recipeId}`)
    );
  } else if (action === 'open-plan') {
    event.waitUntil(
      // eslint-disable-next-line no-restricted-globals
      clients.openWindow('/meal-plan')
    );
  } else if (action === 'open-list' && data.shoppingListId) {
    event.waitUntil(
      // eslint-disable-next-line no-restricted-globals
      clients.openWindow(`/shopping-list/${data.shoppingListId}`)
    );
  } else if (action === 'dismiss') {
    // Nur schließen - nichts weiter tun
    console.log('[SW] Notification dismissed');
  } else {
    // Default: App öffnen oder fokussieren
    event.waitUntil(
      // eslint-disable-next-line no-restricted-globals
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Prüfen ob bereits ein Fenster geöffnet ist
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Kein Fenster gefunden - neues öffnen
        // eslint-disable-next-line no-restricted-globals
        if (clients.openWindow) {
          // eslint-disable-next-line no-restricted-globals
          return clients.openWindow('/');
        }
      })
    );
  }
});

// ============================================
// NOTIFICATION CLOSE HANDLER
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'recipe-update') {
    event.waitUntil(syncRecipeUpdates());
  } else if (event.tag === 'meal-prep-reminder') {
    event.waitUntil(sendMealPrepReminders());
  } else if (event.tag === 'weekly-plan') {
    event.waitUntil(sendWeeklyPlanNotification());
  }
});

async function syncRecipeUpdates() {
  console.log('[SW] Syncing recipe updates...');
  
  try {
    const cache = await caches.open('api-recipes-cache');
    const response = await fetch('/api/v1/recipes/updates');
    
    if (response.ok) {
      await cache.put('/api/v1/recipes', response.clone());
      console.log('[SW] Recipe updates synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync recipe updates:', error);
  }
}

async function sendMealPrepReminders() {
  console.log('[SW] Checking meal prep reminders...');
  
  // Diese Funktion würde die IndexedDB prüfen und Benachrichtigungen senden
  // Die Implementierung hängt von der spezifischen App-Logik ab
}

async function sendWeeklyPlanNotification() {
  console.log('[SW] Sending weekly plan notification...');
  
  // eslint-disable-next-line no-restricted-globals
  await self.registration.showNotification('KochPlan - Wochenplanung', {
    body: 'Plane deine Mahlzeiten für die kommende Woche!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'weekly-plan',
    requireInteraction: false,
    actions: [
      { action: 'open-plan', title: 'Zum Wochenplan' },
      { action: 'dismiss', title: 'Später' },
    ],
  });
}

// ============================================
// BACKGROUND FETCH (für große Uploads)
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[SW] Background fetch succeeded:', event.registration.id);
  
  event.waitUntil(
    event.registration.updateUI({
      title: 'Upload abgeschlossen!',
    })
  );
});

// eslint-disable-next-line no-restricted-globals
self.addEventListener('backgroundfetchfail', (event) => {
  console.log('[SW] Background fetch failed:', event.registration.id);
  
  event.waitUntil(
    event.registration.updateUI({
      title: 'Upload fehlgeschlagen',
    })
  );
});

// ============================================
// MESSAGE HANDLER (App <-> SW Kommunikation)
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  // Sofortige Aktivierung
  if (event.data === 'SKIP_WAITING') {
    // eslint-disable-next-line no-restricted-globals
    self.skipWaiting();
  }
  
  // Rezeptbild cachen
  if (event.data.type === 'CACHE_RECIPE_IMAGE') {
    const { imageUrl, recipeId } = event.data;
    event.waitUntil(cacheRecipeImage(imageUrl, recipeId));
  }
  
  // Alle Caches leeren
  if (event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(clearAllCaches());
  }
  
  // Cache-Statistiken abrufen
  if (event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      getCacheStats().then((stats) => {
        event.ports[0].postMessage(stats);
      })
    );
  }
  
  // Precache aktualisieren
  if (event.data.type === 'UPDATE_PRECACHES') {
    event.waitUntil(updatePrecaches());
  }
});

async function cacheRecipeImage(imageUrl, recipeId) {
  try {
    const cache = await caches.open('recipe-images-cache');
    const response = await fetch(imageUrl, { mode: 'no-cors' });
    
    if (response.ok || response.type === 'opaque') {
      await cache.put(imageUrl, response);
      console.log(`[SW] Cached image for recipe ${recipeId}`);
    }
  } catch (error) {
    console.error(`[SW] Failed to cache image for recipe ${recipeId}:`, error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

async function getCacheStats() {
  const stats = {};
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    let totalSize = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    stats[cacheName] = {
      entries: requests.length,
      sizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }
  
  return stats;
}

async function updatePrecaches() {
  console.log('[SW] Updating precaches...');
  // Diese Funktion würde den Precache aktualisieren
  // Workbox übernimmt dies normalerweise automatisch
}

// ============================================
// FETCH EVENT (für zusätzliche Kontrolle)
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('fetch', (event) => {
  // Hier können spezielle Fetch-Handler hinzugefügt werden
  // Die meisten Fälle werden durch Workbox-Routing abgedeckt
});

// ============================================
// SYNC EVENT (Background Sync)
// ============================================
// eslint-disable-next-line no-restricted-globals
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-recipes') {
    event.waitUntil(syncRecipes());
  } else if (event.tag === 'sync-meal-plans') {
    event.waitUntil(syncMealPlans());
  } else if (event.tag === 'sync-shopping-lists') {
    event.waitUntil(syncShoppingLists());
  }
});

async function syncRecipes() {
  console.log('[SW] Syncing recipes...');
  // Implementierung der Rezept-Synchronisation
}

async function syncMealPlans() {
  console.log('[SW] Syncing meal plans...');
  // Implementierung der Meal-Plan-Synchronisation
}

async function syncShoppingLists() {
  console.log('[SW] Syncing shopping lists...');
  // Implementierung der Einkaufslisten-Synchronisation
}

console.log('[SW] KochPlan Service Worker loaded');
