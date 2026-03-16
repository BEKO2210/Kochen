# KochPlan PWA Architektur

## Übersicht

**App-Name:** KochPlan  
**Architektur:** Offline-First Progressive Web App  
**Build-Tool:** Vite mit vite-plugin-pwa  
**Datenbank:** IndexedDB mit Dexie.js  
**Service Worker:** Workbox-basiert

---

## 1. SERVICE WORKER STRATEGIE

### 1.1 Workbox Runtime Caching Konfiguration

```javascript
// vite.config.js - Workbox Runtime Caching
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Precache: App-Shell
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,json}'
        ],
        
        // Runtime Caching Strategien
        runtimeCaching: [
          // ============================================
          // STRATEGIE 1: CacheFirst für Rezeptbilder
          // ============================================
          {
            urlPattern: /^https:\/\/images\.kochplan\.app\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipe-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              matchOptions: {
                ignoreVary: true,
              },
            },
          },
          // Externe Bildquellen (Unsplash, etc.)
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 14 * 24 * 60 * 60, // 14 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // ============================================
          // STRATEGIE 2: StaleWhileRevalidate für API
          // ============================================
          {
            urlPattern: /\/api\/v1\/recipes/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-recipes-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              backgroundSync: {
                name: 'recipe-sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 Stunden
                },
              },
            },
          },
          {
            urlPattern: /\/api\/v1\/meal-plans/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-mealplans-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
            },
          },
          {
            urlPattern: /\/api\/v1\/shopping-lists/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-shopping-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
            },
          },
          
          // ============================================
          // STRATEGIE 3: NetworkFirst für URL-Import
          // ============================================
          {
            urlPattern: /\/api\/v1\/import\/url/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'import-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
              cacheableResponse: {
                statuses: [0, 200, 201],
              },
            },
          },
          
          // ============================================
          // STRATEGIE 4: Background Sync Queue
          // ============================================
          {
            urlPattern: /\/api\/v1\/sync/,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 Stunden
                  onSync: async ({ queue }) => {
                    console.log('[SW] Background Sync triggered');
                    await queue.replayRequests();
                  },
                },
              },
            },
          },
          
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Jahr
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Jahr
              },
            },
          },
        ],
        
        // Cleanup
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      
      // Manifest wird separat konfiguriert
      manifest: false,
    }),
  ],
});
```

### 1.2 Custom Service Worker (sw.js)

```javascript
// public/sw.js - Custom Service Worker
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache Manifest (wird von Workbox generiert)
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ============================================
// CUSTOM BACKGROUND SYNC HANDLER
// ============================================
const syncQueue = new BackgroundSyncPlugin('kochplan-sync-queue', {
  maxRetentionTime: 24 * 60, // 24 Stunden
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('[SW] Synced:', entry.request.url);
        
        // Benachrichtigung nach erfolgreichem Sync
        self.registration.showNotification('KochPlan', {
          body: 'Deine Änderungen wurden synchronisiert',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
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
// PUSH NOTIFICATION HANDLER
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'kochplan-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.payload || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'KochPlan', options)
  );
});

// ============================================
// NOTIFICATION CLICK HANDLER
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { notification } = event;
  const action = event.action;
  
  if (action === 'open-recipe') {
    event.waitUntil(
      clients.openWindow(`/recipe/${notification.data.recipeId}`)
    );
  } else if (action === 'dismiss') {
    // Nur schließen
  } else {
    // Default: App öffnen
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  }
});

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'recipe-update') {
    event.waitUntil(syncRecipeUpdates());
  } else if (event.tag === 'meal-prep-reminder') {
    event.waitUntil(sendMealPrepReminders());
  }
});

async function syncRecipeUpdates() {
  // Rezepte im Hintergrund aktualisieren
  const cache = await caches.open('api-recipes-cache');
  const response = await fetch('/api/v1/recipes/updates');
  if (response.ok) {
    await cache.put('/api/v1/recipes', response.clone());
  }
}

async function sendMealPrepReminders() {
  // Wird durch Notification Service implementiert
  console.log('[SW] Meal prep reminders checked');
}

// ============================================
// MESSAGE HANDLER (App <-> SW Kommunikation)
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_RECIPE_IMAGE') {
    const { imageUrl, recipeId } = event.data;
    event.waitUntil(cacheRecipeImage(imageUrl, recipeId));
  }
  
  if (event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(clearAllCaches());
  }
});

async function cacheRecipeImage(imageUrl, recipeId) {
  const cache = await caches.open('recipe-images-cache');
  const response = await fetch(imageUrl);
  if (response.ok) {
    await cache.put(imageUrl, response);
    console.log(`[SW] Cached image for recipe ${recipeId}`);
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

console.log('[SW] KochPlan Service Worker loaded');
```

---

## 2. INDEXEDDB SCHEMA MIT DEXIE.JS

### 2.1 Datenbank-Definition

```javascript
// src/db/database.js
import Dexie from 'dexie';

class KochPlanDatabase extends Dexie {
  constructor() {
    super('KochPlanDB');
    
    // ============================================
    // SCHEMA VERSION 1
    // ============================================
    this.version(1).stores({
      // ----------------------------------------
      // TABELLE: recipes
      // ----------------------------------------
      recipes: `
        ++id,
        title,
        category,
        cuisine,
        difficulty,
        prepTime,
        cookTime,
        servings,
        rating,
        isFavorite,
        createdAt,
        updatedAt,
        syncStatus,
        remoteId,
        [category+difficulty],
        [isFavorite+updatedAt],
        *tags
      `,
      
      // ----------------------------------------
      // TABELLE: recipeImages (Blobs separat speichern)
      // ----------------------------------------
      recipeImages: `
        ++id,
        recipeId,
        type,
        createdAt
      `,
      
      // ----------------------------------------
      // TABELLE: ingredients (für Rezepte)
      // ----------------------------------------
      ingredients: `
        ++id,
        recipeId,
        name,
        amount,
        unit,
        category,
        [recipeId+category]
      `,
      
      // ----------------------------------------
      // TABELLE: mealPlans
      // ----------------------------------------
      mealPlans: `
        ++id,
        date,
        mealType,
        recipeId,
        servings,
        notes,
        isCompleted,
        createdAt,
        updatedAt,
        syncStatus,
        [date+mealType],
        [date+isCompleted]
      `,
      
      // ----------------------------------------
      // TABELLE: shoppingLists
      // ----------------------------------------
      shoppingLists: `
        ++id,
        name,
        mealPlanId,
        createdAt,
        updatedAt,
        isCompleted,
        syncStatus
      `,
      
      // ----------------------------------------
      // TABELLE: shoppingItems
      // ----------------------------------------
      shoppingItems: `
        ++id,
        shoppingListId,
        name,
        amount,
        unit,
        category,
        isChecked,
        recipeId,
        [shoppingListId+category],
        [shoppingListId+isChecked]
      `,
      
      // ----------------------------------------
      // TABELLE: settings
      // ----------------------------------------
      settings: `
        key
      `,
      
      // ----------------------------------------
      // TABELLE: syncQueue (für Offline-Änderungen)
      // ----------------------------------------
      syncQueue: `
        ++id,
        entityType,
        entityId,
        operation,
        payload,
        timestamp,
        retryCount,
        [entityType+operation],
        [retryCount+timestamp]
      `,
      
      // ----------------------------------------
      // TABELLE: timers (für Koch-Timer)
      // ----------------------------------------
      timers: `
        ++id,
        recipeId,
        name,
        duration,
        startedAt,
        endsAt,
        isRunning,
        isCompleted
      `,
      
      // ----------------------------------------
      // TABELLE: categories (benutzerdefiniert)
      // ----------------------------------------
      categories: `
        ++id,
        name,
        type,
        order,
        color
      `,
    });
    
    // ============================================
    // SCHEMA VERSION 2 - Migration
    // ============================================
    this.version(2).stores({
      recipes: `
        ++id,
        title,
        category,
        cuisine,
        difficulty,
        prepTime,
        cookTime,
        servings,
        rating,
        isFavorite,
        createdAt,
        updatedAt,
        syncStatus,
        remoteId,
        sourceUrl,
        [category+difficulty],
        [isFavorite+updatedAt],
        *tags
      `,
    }).upgrade(tx => {
      return tx.table('recipes').toCollection().modify(recipe => {
        recipe.sourceUrl = recipe.sourceUrl || null;
      });
    });
    
    // ============================================
    // SCHEMA VERSION 3 - Full-Text Search Index
    // ============================================
    this.version(3).stores({
      searchIndex: `
        ++id,
        word,
        entityType,
        entityId,
        field,
        [word+entityType],
        [entityId+entityType]
      `,
    });
    
    // Tabellen-Referenzen
    this.recipes = this.table('recipes');
    this.recipeImages = this.table('recipeImages');
    this.ingredients = this.table('ingredients');
    this.mealPlans = this.table('mealPlans');
    this.shoppingLists = this.table('shoppingLists');
    this.shoppingItems = this.table('shoppingItems');
    this.settings = this.table('settings');
    this.syncQueue = this.table('syncQueue');
    this.timers = this.table('timers');
    this.categories = this.table('categories');
    this.searchIndex = this.table('searchIndex');
  }
}

// Singleton-Instanz
export const db = new KochPlanDatabase();
export default db;
```

### 2.2 Datenbank-Helper-Funktionen

```javascript
// src/db/helpers.js
import { db } from './database';

// ============================================
// REZEPT-OPERATIONEN
// ============================================

export async function saveRecipe(recipe, imageBlob = null) {
  const timestamp = Date.now();
  
  const recipeData = {
    ...recipe,
    updatedAt: timestamp,
    syncStatus: 'pending',
  };
  
  if (!recipe.id) {
    recipeData.createdAt = timestamp;
  }
  
  const id = await db.recipes.put(recipeData);
  
  // Bild speichern wenn vorhanden
  if (imageBlob) {
    await db.recipeImages.put({
      recipeId: id,
      image: imageBlob,
      type: imageBlob.type,
      createdAt: timestamp,
    });
  }
  
  // Zur Sync-Queue hinzufügen
  await addToSyncQueue('recipe', id, recipe.id ? 'update' : 'create', recipeData);
  
  return id;
}

export async function getRecipe(id) {
  const recipe = await db.recipes.get(id);
  if (!recipe) return null;
  
  // Bild laden
  const imageRecord = await db.recipeImages
    .where('recipeId')
    .equals(id)
    .first();
  
  // Zutaten laden
  const ingredients = await db.ingredients
    .where('recipeId')
    .equals(id)
    .toArray();
  
  return {
    ...recipe,
    image: imageRecord?.image ? URL.createObjectURL(imageRecord.image) : null,
    ingredients,
  };
}

export async function searchRecipes(query, filters = {}) {
  let collection = db.recipes.toCollection();
  
  // Volltext-Suche
  if (query) {
    const searchWords = query.toLowerCase().split(/\s+/);
    collection = collection.filter(recipe => {
      const searchText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
      return searchWords.every(word => searchText.includes(word));
    });
  }
  
  // Filter anwenden
  if (filters.category) {
    collection = collection.filter(r => r.category === filters.category);
  }
  if (filters.difficulty) {
    collection = collection.filter(r => r.difficulty === filters.difficulty);
  }
  if (filters.maxTime) {
    collection = collection.filter(r => 
      (r.prepTime || 0) + (r.cookTime || 0) <= filters.maxTime
    );
  }
  if (filters.isFavorite !== undefined) {
    collection = collection.filter(r => r.isFavorite === filters.isFavorite);
  }
  
  // Sortierung
  const sortField = filters.sortBy || 'updatedAt';
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
  
  return collection.sortBy(sortField).then(results => 
    sortOrder === 'desc' ? results.reverse() : results
  );
}

export async function getFavorites() {
  return db.recipes
    .where('isFavorite')
    .equals(1)
    .reverse()
    .sortBy('updatedAt');
}

// ============================================
// MEAL PLAN OPERATIONEN
// ============================================

export async function getMealPlanForDate(date, mealType = null) {
  let query = db.mealPlans.where('date').equals(date);
  
  if (mealType) {
    query = db.mealPlans.where('[date+mealType]').equals([date, mealType]);
  }
  
  const plans = await query.toArray();
  
  // Rezept-Details laden
  return Promise.all(plans.map(async plan => {
    const recipe = await db.recipes.get(plan.recipeId);
    return { ...plan, recipe };
  }));
}

export async function getMealPlansForRange(startDate, endDate) {
  const plans = await db.mealPlans
    .where('date')
    .between(startDate, endDate)
    .toArray();
  
  return Promise.all(plans.map(async plan => {
    const recipe = await db.recipes.get(plan.recipeId);
    return { ...plan, recipe };
  }));
}

// ============================================
// EINKAUFSLISTEN-OPERATIONEN
// ============================================

export async function createShoppingListFromMealPlan(mealPlanId, name) {
  const mealPlan = await db.mealPlans.get(mealPlanId);
  if (!mealPlan) throw new Error('Meal plan not found');
  
  const recipe = await db.recipes.get(mealPlan.recipeId);
  const ingredients = await db.ingredients
    .where('recipeId')
    .equals(mealPlan.recipeId)
    .toArray();
  
  const timestamp = Date.now();
  
  // Einkaufsliste erstellen
  const listId = await db.shoppingLists.add({
    name: name || `Einkaufsliste für ${recipe.title}`,
    mealPlanId,
    createdAt: timestamp,
    updatedAt: timestamp,
    isCompleted: false,
    syncStatus: 'pending',
  });
  
  // Zutaten als Items hinzufügen
  const items = ingredients.map(ing => ({
    shoppingListId: listId,
    name: ing.name,
    amount: ing.amount * (mealPlan.servings / recipe.servings),
    unit: ing.unit,
    category: ing.category || 'Sonstiges',
    isChecked: false,
    recipeId: recipe.id,
  }));
  
  await db.shoppingItems.bulkAdd(items);
  
  return listId;
}

export async function getShoppingListWithItems(listId) {
  const list = await db.shoppingLists.get(listId);
  if (!list) return null;
  
  const items = await db.shoppingItems
    .where('shoppingListId')
    .equals(listId)
    .sortBy('category');
  
  // Nach Kategorie gruppieren
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Sonstiges';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
  
  return { ...list, items, groupedItems };
}

// ============================================
// SYNC QUEUE OPERATIONEN
// ============================================

export async function addToSyncQueue(entityType, entityId, operation, payload) {
  return db.syncQueue.add({
    entityType,
    entityId,
    operation,
    payload: JSON.stringify(payload),
    timestamp: Date.now(),
    retryCount: 0,
  });
}

export async function getPendingSyncItems() {
  return db.syncQueue
    .where('retryCount')
    .below(5)
    .sortBy('timestamp');
}

export async function removeFromSyncQueue(id) {
  return db.syncQueue.delete(id);
}

export async function incrementRetryCount(id) {
  return db.syncQueue.update(id, {
    retryCount: (await db.syncQueue.get(id)).retryCount + 1,
  });
}

// ============================================
// SETTINGS OPERATIONEN
// ============================================

export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
}

export async function setSetting(key, value) {
  return db.settings.put({ key, value });
}

// ============================================
// TIMER OPERATIONEN
// ============================================

export async function createTimer(recipeId, name, durationMinutes) {
  const now = Date.now();
  const durationMs = durationMinutes * 60 * 1000;
  
  return db.timers.add({
    recipeId,
    name,
    duration: durationMs,
    startedAt: now,
    endsAt: now + durationMs,
    isRunning: true,
    isCompleted: false,
  });
}

export async function getActiveTimers() {
  return db.timers
    .where('isRunning')
    .equals(1)
    .and(timer => timer.endsAt > Date.now())
    .toArray();
}

// ============================================
// DATENBANK-WARTUNG
// ============================================

export async function getDatabaseStats() {
  const stats = {
    recipes: await db.recipes.count(),
    recipeImages: await db.recipeImages.count(),
    ingredients: await db.ingredients.count(),
    mealPlans: await db.mealPlans.count(),
    shoppingLists: await db.shoppingLists.count(),
    shoppingItems: await db.shoppingItems.count(),
    syncQueue: await db.syncQueue.count(),
    timers: await db.timers.count(),
  };
  
  // Geschätzte Größe der Bilder
  const images = await db.recipeImages.toArray();
  const imageSize = images.reduce((sum, img) => {
    return sum + (img.image?.size || 0);
  }, 0);
  
  stats.imageStorageMB = (imageSize / 1024 / 1024).toFixed(2);
  
  return stats;
}

export async function exportDatabase() {
  const data = {
    recipes: await db.recipes.toArray(),
    mealPlans: await db.mealPlans.toArray(),
    shoppingLists: await db.shoppingLists.toArray(),
    settings: await db.settings.toArray(),
    categories: await db.categories.toArray(),
    exportDate: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
}

export async function clearAllData() {
  await Promise.all([
    db.recipes.clear(),
    db.recipeImages.clear(),
    db.ingredients.clear(),
    db.mealPlans.clear(),
    db.shoppingLists.clear(),
    db.shoppingItems.clear(),
    db.syncQueue.clear(),
    db.timers.clear(),
    db.categories.clear(),
    db.searchIndex.clear(),
  ]);
}
```

---

## 3. MANIFEST KONFIGURATION

### 3.1 Web App Manifest (manifest.json)

```json
{
  "name": "KochPlan - Dein smarter Rezeptplaner",
  "short_name": "KochPlan",
  "description": "Plane deine Mahlzeiten, verwalte Rezepte und erstelle Einkaufslisten - auch offline!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#e65100",
  "orientation": "portrait-primary",
  "scope": "/",
  "id": "/",
  "lang": "de-DE",
  "dir": "ltr",
  
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/recipe-list-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Rezeptübersicht auf dem Smartphone"
    },
    {
      "src": "/screenshots/recipe-detail-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Rezeptdetailansicht auf dem Smartphone"
    },
    {
      "src": "/screenshots/meal-plan-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Wochenplanung auf dem Smartphone"
    },
    {
      "src": "/screenshots/shopping-list-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Einkaufsliste auf dem Smartphone"
    },
    {
      "src": "/screenshots/recipe-list-wide.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Rezeptübersicht auf dem Desktop"
    },
    {
      "src": "/screenshots/meal-plan-wide.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Wochenplanung auf dem Desktop"
    }
  ],
  
  "categories": [
    "food",
    "lifestyle",
    "productivity",
    "utilities"
  ],
  
  "shortcuts": [
    {
      "name": "Neues Rezept",
      "short_name": "+ Rezept",
      "description": "Schnell ein neues Rezept hinzufügen",
      "url": "/recipe/new",
      "icons": [
        {
          "src": "/icons/shortcut-add-recipe-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Wochenplan",
      "short_name": "Plan",
      "description": "Deinen Wochenplan anzeigen",
      "url": "/meal-plan",
      "icons": [
        {
          "src": "/icons/shortcut-meal-plan-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Einkaufsliste",
      "short_name": "Einkauf",
      "description": "Deine aktuelle Einkaufsliste",
      "url": "/shopping-list",
      "icons": [
        {
          "src": "/icons/shortcut-shopping-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Favoriten",
      "short_name": "Favoriten",
      "description": "Deine Lieblingsrezepte",
      "url": "/favorites",
      "icons": [
        {
          "src": "/icons/shortcut-favorites-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  
  "related_applications": [],
  "prefer_related_applications": false,
  
  "handle_links": "preferred",
  "launch_handler": {
    "client_mode": ["navigate-existing", "auto"]
  },
  
  "edge_side_panel": {
    "preferred_width": 400
  },
  
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "name",
      "text": "description",
      "url": "link",
      "files": [
        {
          "name": "recipe_image",
          "accept": ["image/*"]
        }
      ]
    }
  },
  
  "protocol_handlers": [
    {
      "protocol": "web+kochplan",
      "url": "/recipe/%s"
    }
  ]
}
```

### 3.2 HTML Head Konfiguration

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#e65100">
  <meta name="background-color" content="#ffffff">
  
  <!-- Primary Meta Tags -->
  <title>KochPlan - Dein smarter Rezeptplaner</title>
  <meta name="description" content="Plane deine Mahlzeiten, verwalte Rezepte und erstelle Einkaufslisten - auch offline!">
  <meta name="keywords" content="Rezepte, Meal Planning, Einkaufsliste, Kochen, Offline">
  <meta name="author" content="KochPlan Team">
  <meta name="robots" content="index, follow">
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Icons -->
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
  <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#e65100">
  
  <!-- Apple Specific -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="KochPlan">
  
  <!-- Apple Splash Screens -->
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
  <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
  
  <!-- Microsoft -->
  <meta name="msapplication-TileColor" content="#e65100">
  <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png">
  <meta name="msapplication-config" content="/browserconfig.xml">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://kochplan.app">
  <meta property="og:title" content="KochPlan - Dein smarter Rezeptplaner">
  <meta property="og:description" content="Plane deine Mahlzeiten, verwalte Rezepte und erstelle Einkaufslisten - auch offline!">
  <meta property="og:image" content="https://kochplan.app/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="de_DE">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://kochplan.app">
  <meta property="twitter:title" content="KochPlan - Dein smarter Rezeptplaner">
  <meta property="twitter:description" content="Plane deine Mahlzeiten, verwalte Rezepte und erstelle Einkaufslisten - auch offline!">
  <meta property="twitter:image" content="https://kochplan.app/twitter-image.png">
  
  <!-- Preconnect für Performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://images.kochplan.app">
  
  <!-- Preload kritische Ressourcen -->
  <link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/src/main.js" as="script">
  <link rel="preload" href="/src/main.css" as="style">
  
  <!-- DNS Prefetch -->
  <link rel="dns-prefetch" href="https://api.kochplan.app">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/src/main.css">
</head>
<body>
  <div id="app"></div>
  <noscript>
    <div style="padding: 20px; text-align: center;">
      <h1>JavaScript erforderlich</h1>
      <p>KochPlan benötigt JavaScript um zu funktionieren. Bitte aktiviere JavaScript in deinem Browser.</p>
    </div>
  </noscript>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

---

## 4. CACHING STRATEGIEN

### 4.1 Cache-Struktur Übersicht

| Cache-Name | Inhalt | Strategie | Max Entries | Max Age |
|------------|--------|-----------|-------------|---------|
| `workbox-precache-v2` | App-Shell (JS, CSS, HTML) | Precache | - | - |
| `recipe-images-cache` | Rezeptbilder | CacheFirst | 500 | 30 Tage |
| `external-images-cache` | Externe Bilder (Unsplash) | CacheFirst | 200 | 14 Tage |
| `api-recipes-cache` | API-Rezeptdaten | StaleWhileRevalidate | 100 | 7 Tage |
| `api-mealplans-cache` | Meal Plan Daten | StaleWhileRevalidate | 50 | 1 Tag |
| `api-shopping-cache` | Einkaufslistendaten | StaleWhileRevalidate | 50 | 1 Tag |
| `import-cache` | URL-Import Ergebnisse | NetworkFirst | 20 | 1 Tag |
| `google-fonts-cache` | Google Fonts | CacheFirst | 10 | 1 Jahr |

### 4.2 Precache Konfiguration

```javascript
// vite.config.js - Precache Details
{
  workbox: {
    // Nur essentielle Dateien precachen
    globPatterns: [
      'index.html',
      'manifest.json',
      '**/*.{js,css}',
      'icons/*.png',
      'fonts/*.{woff2,woff}',
    ],
    
    // Ausschließen
    globIgnores: [
      '**/*.map',
      '**/*.br',
      '**/*.gz',
      'node_modules/**/*',
    ],
    
    // Manifest-Transformation
    manifestTransforms: [
      async (manifestEntries) => {
        const manifest = manifestEntries.map(entry => {
          // Revision für HTML-Dateien immer aktualisieren
          if (entry.url.endsWith('.html')) {
            entry.revision = Date.now().toString();
          }
          return entry;
        });
        return { manifest, warnings: [] };
      },
    ],
    
    // Maximum File Size to Cache (5MB)
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    
    // Modification Callback
    modifyURLPrefix: {
      '': '/',
    },
  }
}
```

### 4.3 Cache-Größen-Limits & Cleanup

```javascript
// src/utils/cacheManager.js

export class CacheManager {
  constructor() {
    this.cacheNames = {
      images: 'recipe-images-cache',
      externalImages: 'external-images-cache',
      api: 'api-recipes-cache',
      mealPlans: 'api-mealplans-cache',
      shopping: 'api-shopping-cache',
    };
  }
  
  // ============================================
  // CACHE-GRÖSSE PRÜFEN
  // ============================================
  async getCacheSize(cacheName) {
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
    
    return {
      entries: requests.length,
      sizeBytes: totalSize,
      sizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }
  
  async getAllCacheSizes() {
    const sizes = {};
    for (const [name, cacheName] of Object.entries(this.cacheNames)) {
      sizes[name] = await this.getCacheSize(cacheName);
    }
    return sizes;
  }
  
  // ============================================
  // CACHE BEREINIGEN
  // ============================================
  async cleanupImageCache(maxAgeDays = 30) {
    const cache = await caches.open(this.cacheNames.images);
    const requests = await cache.keys();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    let deleted = 0;
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cachedDate = new Date(dateHeader).getTime();
          if (now - cachedDate > maxAge) {
            await cache.delete(request);
            deleted++;
          }
        }
      }
    }
    
    console.log(`[CacheManager] Cleaned up ${deleted} old images`);
    return deleted;
  }
  
  // ============================================
  // NICHT MEHR BENÖTIGTE BILDER ENTFERNEN
  // ============================================
  async cleanupOrphanedImages(recipeIds) {
    const cache = await caches.open(this.cacheNames.images);
    const requests = await cache.keys();
    
    const recipeIdSet = new Set(recipeIds.map(id => id.toString()));
    let deleted = 0;
    
    for (const request of requests) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const recipeId = pathParts[pathParts.length - 2]; // Annahme: /images/{recipeId}/image.jpg
      
      if (!recipeIdSet.has(recipeId)) {
        await cache.delete(request);
        deleted++;
      }
    }
    
    console.log(`[CacheManager] Removed ${deleted} orphaned images`);
    return deleted;
  }
  
  // ============================================
  // CACHE LEEREN
  // ============================================
  async clearCache(cacheName) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    await Promise.all(requests.map(req => cache.delete(req)));
    console.log(`[CacheManager] Cleared cache: ${cacheName}`);
  }
  
  async clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    console.log('[CacheManager] All caches cleared');
  }
  
  // ============================================
  // SPEICHERWARNUNG
  // ============================================
  async checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
      const totalMB = estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) : 'unlimited';
      const percent = estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 'N/A';
      
      console.log(`[CacheManager] Storage: ${usedMB}MB / ${totalMB}MB (${percent}%)`);
      
      if (estimate.quota && (estimate.usage / estimate.quota) > 0.8) {
        console.warn('[CacheManager] Storage quota exceeded 80%, cleanup recommended');
        return { warning: true, usedMB, totalMB, percent };
      }
      
      return { warning: false, usedMB, totalMB, percent };
    }
    
    return { warning: false, message: 'Storage API not available' };
  }
}

export const cacheManager = new CacheManager();
```

---

## 5. OFFLINE-FUNKTIONALITÄT

### 5.1 Offline-Fähigkeiten Matrix

| Feature | Offline verfügbar | Sync-Queue | Konflikt-Lösung |
|---------|-------------------|------------|-----------------|
| Rezepte ansehen | ✅ Ja | - | - |
| Rezepte erstellen | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Rezepte bearbeiten | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Rezepte löschen | ✅ Ja | ✅ Ja | Soft Delete |
| Favoriten verwalten | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Meal Plans ansehen | ✅ Ja | - | - |
| Meal Plans erstellen | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Einkaufslisten ansehen | ✅ Ja | - | - |
| Einkaufslisten erstellen | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Einkaufsitems abhaken | ✅ Ja | ✅ Ja | Last-Write-Wins |
| Timer nutzen | ✅ Ja | - | - |
| URL-Import | ❌ Nein | - | - |
| Bilder hochladen | ⚠️ Queued | ✅ Ja | Retry |
| Teilen | ⚠️ Queued | ✅ Ja | Retry |

### 5.2 Offline-Status Hook

```javascript
// src/composables/useOffline.js
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db, addToSyncQueue } from '@/db/database';

const isOnline = ref(navigator.onLine);
const isSyncing = ref(false);
const pendingSyncCount = ref(0);
const lastSyncTime = ref(null);

export function useOffline() {
  // ============================================
  // NETZWERK-STATUS
  // ============================================
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
    if (isOnline.value) {
      triggerSync();
    }
  };
  
  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updatePendingSyncCount();
  });
  
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });
  
  // ============================================
  // SYNC-QUEUE VERWALTEN
  // ============================================
  async function updatePendingSyncCount() {
    pendingSyncCount.value = await db.syncQueue.count();
  }
  
  async function queueOfflineAction(entityType, entityId, operation, payload) {
    await addToSyncQueue(entityType, entityId, operation, payload);
    await updatePendingSyncCount();
    
    // Background Sync registrieren wenn verfügbar
    if ('serviceWorker' in navigator && 'sync' in registration) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(`${entityType}-${operation}`);
    }
  }
  
  // ============================================
  // SYNCHRONISATION
  // ============================================
  async function triggerSync() {
    if (!isOnline.value || isSyncing.value) return;
    
    isSyncing.value = true;
    
    try {
      const pendingItems = await db.syncQueue
        .where('retryCount')
        .below(5)
        .sortBy('timestamp');
      
      for (const item of pendingItems) {
        try {
          await syncItem(item);
          await db.syncQueue.delete(item.id);
        } catch (error) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, error);
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
          });
        }
      }
      
      lastSyncTime.value = Date.now();
    } finally {
      isSyncing.value = false;
      await updatePendingSyncCount();
    }
  }
  
  async function syncItem(item) {
    const payload = JSON.parse(item.payload);
    
    const response = await fetch(`/api/v1/${item.entityType}s/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: item.operation,
        entityId: item.entityId,
        data: payload,
        timestamp: item.timestamp,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Remote ID aktualisieren wenn neu erstellt
    if (item.operation === 'create' && result.remoteId) {
      await db[item.entityType + 's'].update(item.entityId, {
        remoteId: result.remoteId,
        syncStatus: 'synced',
      });
    }
    
    return result;
  }
  
  // ============================================
  // KONFLIKT-LÖSUNG
  // ============================================
  async function resolveConflict(localItem, remoteItem, strategy = 'last-write-wins') {
    switch (strategy) {
      case 'last-write-wins':
        return localItem.updatedAt > remoteItem.updatedAt ? localItem : remoteItem;
      
      case 'server-wins':
        return remoteItem;
      
      case 'client-wins':
        return localItem;
      
      case 'merge':
        return mergeConflictingItems(localItem, remoteItem);
      
      default:
        return localItem;
    }
  }
  
  function mergeConflictingItems(local, remote) {
    // Für Rezepte: Felder intelligent mergen
    const merged = { ...remote };
    
    // Lokale Änderungen bevorzugen für bestimmte Felder
    if (local.isFavorite !== remote.isFavorite) {
      merged.isFavorite = local.isFavorite;
    }
    
    // Tags zusammenführen
    merged.tags = [...new Set([...(local.tags || []), ...(remote.tags || [])])];
    
    // Notizen anhängen
    if (local.notes && local.notes !== remote.notes) {
      merged.notes = `${remote.notes || ''}\n---\n${local.notes}`;
    }
    
    merged.updatedAt = Date.now();
    merged.syncStatus = 'pending';
    
    return merged;
  }
  
  // ============================================
  // OFFLINE-INDIKATOR
  // ============================================
  const offlineIndicator = computed(() => {
    if (!isOnline.value) {
      return { type: 'offline', message: 'Offline - Änderungen werden gespeichert' };
    }
    if (isSyncing.value) {
      return { type: 'syncing', message: 'Synchronisiere...' };
    }
    if (pendingSyncCount.value > 0) {
      return { 
        type: 'pending', 
        message: `${pendingSyncCount.value} Änderungen ausstehend` 
      };
    }
    return null;
  });
  
  return {
    isOnline: computed(() => isOnline.value),
    isSyncing: computed(() => isSyncing.value),
    pendingSyncCount: computed(() => pendingSyncCount.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    offlineIndicator,
    queueOfflineAction,
    triggerSync,
    resolveConflict,
  };
}
```

### 5.3 Offline-First Daten-Fetching

```javascript
// src/composables/useOfflineData.js
import { ref, computed } from 'vue';
import { db } from '@/db/database';

export function useOfflineData(entityType) {
  const data = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const lastFetchTime = ref(null);
  
  const table = db[entityType + 's'];
  
  // ============================================
  // DATEN LADEN (Offline-First)
  // ============================================
  async function fetch(options = {}) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 1. Zuerst aus IndexedDB laden (sofort verfügbar)
      const localData = await fetchFromIndexedDB(options);
      data.value = localData;
      
      // 2. Dann im Hintergrund vom Server aktualisieren
      if (navigator.onLine && options.sync !== false) {
        fetchFromServer(options).catch(err => {
          console.warn('[useOfflineData] Server fetch failed:', err);
        });
      }
      
      lastFetchTime.value = Date.now();
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
    
    return data.value;
  }
  
  async function fetchFromIndexedDB(options) {
    let query = table.toCollection();
    
    // Filter anwenden
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        query = query.filter(item => item[key] === value);
      }
    }
    
    // Sortierung
    if (options.orderBy) {
      query = query.sortBy(options.orderBy);
    }
    
    // Limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return query.toArray();
  }
  
  async function fetchFromServer(options) {
    const response = await fetch(`/api/v1/${entityType}s`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const serverData = await response.json();
    
    // In IndexedDB speichern
    await table.bulkPut(serverData.map(item => ({
      ...item,
      syncStatus: 'synced',
      lastFetched: Date.now(),
    })));
    
    // UI aktualisieren
    data.value = serverData;
    
    return serverData;
  }
  
  // ============================================
  // EINZELNES ITEM LADEN
  // ============================================
  async function fetchById(id, options = {}) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 1. Aus IndexedDB
      let item = await table.get(id);
      
      // 2. Vom Server aktualisieren
      if (navigator.onLine && options.sync !== false) {
        try {
          const response = await fetch(`/api/v1/${entityType}s/${id}`);
          if (response.ok) {
            const serverItem = await response.json();
            await table.put({ ...serverItem, syncStatus: 'synced' });
            item = serverItem;
          }
        } catch (err) {
          console.warn('[useOfflineData] Server fetch failed:', err);
        }
      }
      
      return item;
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // ============================================
  // ITEM SPEICHERN
  // ============================================
  async function save(item, options = {}) {
    const timestamp = Date.now();
    const dataToSave = {
      ...item,
      updatedAt: timestamp,
      syncStatus: navigator.onLine ? 'syncing' : 'pending',
    };
    
    if (!item.id) {
      dataToSave.createdAt = timestamp;
    }
    
    // In IndexedDB speichern
    const id = await table.put(dataToSave);
    
    // Online: Direkt synchronisieren
    if (navigator.onLine && options.sync !== false) {
      try {
        const response = await fetch(`/api/v1/${entityType}s${item.id ? `/${item.id}` : ''}`, {
          method: item.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });
        
        if (response.ok) {
          const result = await response.json();
          await table.update(id, { 
            ...result, 
            syncStatus: 'synced',
            remoteId: result.id,
          });
          return { id, synced: true, data: result };
        }
      } catch (err) {
        console.warn('[useOfflineData] Server save failed, queued:', err);
      }
    }
    
    // Offline: Zur Sync-Queue hinzufügen
    await addToSyncQueue(entityType, id, item.id ? 'update' : 'create', dataToSave);
    
    return { id, synced: false, queued: true };
  }
  
  // ============================================
  // ITEM LÖSCHEN
  // ============================================
  async function remove(id, options = {}) {
    // Soft delete in IndexedDB
    await table.update(id, { 
      deleted: true, 
      deletedAt: Date.now(),
      syncStatus: 'pending',
    });
    
    // Online: Direkt löschen
    if (navigator.onLine && options.sync !== false) {
      try {
        const response = await fetch(`/api/v1/${entityType}s/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await table.delete(id);
          return { deleted: true, synced: true };
        }
      } catch (err) {
        console.warn('[useOfflineData] Server delete failed, queued:', err);
      }
    }
    
    // Offline: Zur Sync-Queue hinzufügen
    await addToSyncQueue(entityType, id, 'delete', { id });
    
    return { deleted: true, synced: false, queued: true };
  }
  
  return {
    data: computed(() => data.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    lastFetchTime: computed(() => lastFetchTime.value),
    fetch,
    fetchById,
    save,
    remove,
  };
}
```

---

## 6. LIGHTHOUSE-OPTIMIERUNGEN

### 6.1 Performance-Ziele

| Metrik | Ziel | Aktzeptabler Bereich |
|--------|------|---------------------|
| Performance Score | ≥ 90 | 85-100 |
| First Contentful Paint (FCP) | < 1.8s | < 3.0s |
| Largest Contentful Paint (LCP) | < 2.5s | < 4.0s |
| Time to Interactive (TTI) | < 3.8s | < 7.3s |
| Total Blocking Time (TBT) | < 200ms | < 600ms |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.25 |
| Speed Index | < 3.4s | < 5.8s |

### 6.2 PWA-Score Ziele

| Kategorie | Ziel | Mindestanforderung |
|-----------|------|-------------------|
| PWA Score | ≥ 90 | 85 |
| Installable | ✅ 100% | 100% |
| Service Worker | ✅ 100% | 100% |
| Manifest | ✅ 100% | 100% |
| HTTPS | ✅ 100% | 100% |

### 6.3 Accessibility-Ziele

| Metrik | Ziel | Mindestanforderung |
|--------|------|-------------------|
| Accessibility Score | ≥ 95 | 90 |
| Contrast Ratio | ≥ 4.5:1 | 4.5:1 |
| Touch Targets | ≥ 48x48px | 44x44px |
| ARIA Labels | 100% | 90% |

### 6.4 Performance-Optimierungs-Checkliste

```javascript
// vite.config.js - Performance Optimierungen
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  // ============================================
  // BUILD-OPTIMIERUNGEN
  // ============================================
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    
    // Chunk-Splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor-Chunks
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],
          'vendor-db': ['dexie'],
          'vendor-utils': ['date-fns', 'lodash-es'],
          
          // Feature-Chunks
          'feature-recipes': ['./src/views/RecipeList.vue', './src/views/RecipeDetail.vue'],
          'feature-mealplan': ['./src/views/MealPlan.vue'],
          'feature-shopping': ['./src/views/ShoppingList.vue'],
        },
        // Asset-Naming für besseres Caching
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          if (ext === 'css') {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    
    // Terser-Optionen
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    
    // Source Maps nur in Development
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Chunk-Größe Warnung
    chunkSizeWarningLimit: 500,
  },
  
  // ============================================
  // OPTIMIERUNGS-PLUGINS
  // ============================================
  plugins: [
    // PWA Plugin
    VitePWA({
      // ... (siehe oben)
    }),
    
    // Brotli-Kompression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    
    // Gzip-Kompression (Fallback)
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    
    // Bundle-Visualizer (nur in Analyze-Mode)
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  
  // ============================================
  // CSS-OPTIMIERUNGEN
  // ============================================
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('postcss-preset-env')({
          stage: 1,
        }),
        require('cssnano')({
          preset: ['default', {
            discardComments: { removeAll: true },
          }],
        }),
      ],
    },
  },
  
  // ============================================
  // RESOLVE-ALIAS
  // ============================================
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@views': '/src/views',
      '@composables': '/src/composables',
      '@db': '/src/db',
      '@utils': '/src/utils',
      '@assets': '/src/assets',
    },
  },
  
  // ============================================
  // SERVER-KONFIGURATION
  // ============================================
  server: {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  
  // ============================================
  // PREVIEW-KONFIGURATION
  // ============================================
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});
```

### 6.5 Bildoptimierungs-Strategie

```javascript
// src/utils/imageOptimizer.js

export const imageOptimizer = {
  // ============================================
  // BILD KOMPRESSIEREN
  // ============================================
  async compressImage(file, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      type = 'image/jpeg',
    } = options;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Seitenverhältnis beibehalten
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          type,
          quality
        );
      };
      
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // ============================================
  // WEBP KONVERTIEREN
  // ============================================
  async convertToWebP(file, quality = 0.8) {
    // Überprüfen ob WebP unterstützt wird
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
      // WebP nicht unterstützt, Original zurückgeben
      return file;
    }
    
    return this.compressImage(file, { quality, type: 'image/webp' });
  },
  
  // ============================================
  // RESPONSIVE BILDER ERSTELLEN
  // ============================================
  async createResponsiveImages(file) {
    const sizes = [
      { width: 400, suffix: 'sm' },
      { width: 800, suffix: 'md' },
      { width: 1200, suffix: 'lg' },
    ];
    
    const images = {};
    
    for (const size of sizes) {
      images[size.suffix] = await this.compressImage(file, {
        maxWidth: size.width,
        quality: 0.8,
      });
    }
    
    return images;
  },
  
  // ============================================
  // LAZY LOADING HELPER
  // ============================================
  createLazyImage(src, alt, options = {}) {
    const {
      placeholder = '/images/placeholder.svg',
      sizes = '100vw',
      srcset = null,
    } = options;
    
    const img = document.createElement('img');
    img.dataset.src = src;
    img.src = placeholder;
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    
    if (srcset) {
      img.dataset.srcset = srcset;
    }
    
    if (sizes) {
      img.sizes = sizes;
    }
    
    // Intersection Observer für Lazy Loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }
            observer.unobserve(img);
          }
        });
      });
      
      observer.observe(img);
    } else {
      // Fallback: Sofort laden
      img.src = src;
    }
    
    return img;
  },
};
```

### 6.6 Critical CSS

```javascript
// src/utils/criticalCss.js

// Kritische CSS-Regeln für Above-the-Fold Content
export const criticalCSS = `
  /* Critical CSS - Inline in <head> */
  :root {
    --color-primary: #e65100;
    --color-background: #ffffff;
    --color-text: #1a1a1a;
    --font-sans: system-ui, -apple-system, sans-serif;
  }
  
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    background-color: var(--color-background);
    color: var(--color-text);
    line-height: 1.5;
  }
  
  #app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Skeleton Loading */
  .skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }
  
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* App Header */
  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    padding: 0 16px;
    z-index: 100;
  }
  
  /* Content Area */
  .app-content {
    flex: 1;
    padding-top: 56px;
    padding-bottom: 64px;
  }
  
  /* Bottom Navigation */
  .app-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 100;
  }
`;

// Inline-Critical-CSS in HTML einfügen
export function injectCriticalCSS() {
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
}
```

---

## 7. NOTIFICATION-STRATEGIE

### 7.1 Push-Notification Service

```javascript
// src/services/notificationService.js

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.registration = null;
  }
  
  // ============================================
  // INITIALISIERUNG
  // ============================================
  async init() {
    if (!('Notification' in window)) {
      console.warn('[Notification] Notifications not supported');
      return false;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.warn('[Notification] Service Worker not supported');
      return false;
    }
    
    this.permission = Notification.permission;
    this.registration = await navigator.serviceWorker.ready;
    
    return true;
  }
  
  // ============================================
  // BERECHTIGUNG ANFRAGEN
  // ============================================
  async requestPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    this.permission = await Notification.requestPermission();
    
    if (this.permission === 'granted') {
      await this.subscribeToPush();
    }
    
    return this.permission;
  }
  
  // ============================================
  // PUSH-SUBSCRIPTION
  // ============================================
  async subscribeToPush() {
    if (!this.registration) return null;
    
    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        ),
      });
      
      // Subscription an Server senden
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      
      return subscription;
    } catch (error) {
      console.error('[Notification] Push subscription failed:', error);
      return null;
    }
  }
  
  // ============================================
  // LOKALE BENACHRICHTIGUNG
  // ============================================
  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('[Notification] Permission not granted');
      return false;
    }
    
    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'kochplan-notification',
      requireInteraction: false,
      silent: false,
    };
    
    const notificationOptions = { ...defaultOptions, ...options };
    
    try {
      await this.registration.showNotification(title, notificationOptions);
      return true;
    } catch (error) {
      console.error('[Notification] Show notification failed:', error);
      return false;
    }
  }
  
  // ============================================
  // KOCH-TIMER
  // ============================================
  async setCookingTimer(recipeId, recipeName, durationMinutes, stepName = '') {
    const timerId = `timer-${Date.now()}`;
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    
    // Timer in IndexedDB speichern
    await db.timers.add({
      recipeId,
      name: stepName || 'Koch-Timer',
      duration: durationMinutes * 60 * 1000,
      startedAt: Date.now(),
      endsAt: endTime,
      isRunning: true,
      isCompleted: false,
    });
    
    // Timer-Notification planen
    if ('showTrigger' in Notification.prototype) {
      // Notification Trigger API (experimentell)
      await this.registration.showNotification('KochPlan - Timer', {
        body: `${recipeName}: ${stepName || 'Timer'} abgelaufen!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: timerId,
        requireInteraction: true,
        actions: [
          { action: 'open-recipe', title: 'Rezept öffnen' },
          { action: 'dismiss', title: 'Schließen' },
        ],
        data: { recipeId, timerId },
        showTrigger: new TimestampTrigger(endTime),
      });
    } else {
      // Fallback: setTimeout (funktioniert nur wenn App läuft)
      setTimeout(() => {
        this.showNotification('KochPlan - Timer', {
          body: `${recipeName}: ${stepName || 'Timer'} abgelaufen!`,
          tag: timerId,
          requireInteraction: true,
          actions: [
            { action: 'open-recipe', title: 'Rezept öffnen' },
            { action: 'dismiss', title: 'Schließen' },
          ],
          data: { recipeId, timerId },
        });
      }, durationMinutes * 60 * 1000);
    }
    
    return timerId;
  }
  
  // ============================================
  // MEAL-PREP ERINNERUNGEN
  // ============================================
  async scheduleMealPrepReminder(mealPlanId, date, mealType, recipeName) {
    const reminderTime = new Date(date);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 Stunde vorher
    
    if (reminderTime < new Date()) {
      console.warn('[Notification] Reminder time is in the past');
      return null;
    }
    
    const reminderId = `prep-${mealPlanId}`;
    
    // In IndexedDB speichern
    await db.settings.put({
      key: `reminder-${reminderId}`,
      value: {
        mealPlanId,
        recipeName,
        mealType,
        scheduledFor: reminderTime.getTime(),
      },
    });
    
    // Notification planen
    const mealTypeLabels = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen',
      dinner: 'Abendessen',
      snack: 'Snack',
    };
    
    if ('showTrigger' in Notification.prototype) {
      await this.registration.showNotification('KochPlan - Meal Prep', {
        body: `Zeit für die Vorbereitung: ${recipeName} (${mealTypeLabels[mealType] || mealType})`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: reminderId,
        requireInteraction: false,
        actions: [
          { action: 'open-recipe', title: 'Rezept ansehen' },
          { action: 'dismiss', title: 'OK' },
        ],
        data: { mealPlanId },
        showTrigger: new TimestampTrigger(reminderTime.getTime()),
      });
    }
    
    return reminderId;
  }
  
  // ============================================
  // WOCHENPLAN-BENACHRICHTIGUNGEN
  // ============================================
  async scheduleWeeklyPlanNotification() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(10, 0, 0, 0);
    
    if ('showTrigger' in Notification.prototype) {
      await this.registration.showNotification('KochPlan - Wochenplanung', {
        body: 'Plane deine Mahlzeiten für die kommende Woche!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'weekly-plan',
        requireInteraction: false,
        actions: [
          { action: 'open-plan', title: 'Zum Wochenplan' },
          { action: 'dismiss', title: 'Später' },
        ],
        showTrigger: new TimestampTrigger(nextSunday.getTime()),
      });
    }
  }
  
  // ============================================
  // EINKAUFSLISTEN-ERINNERUNG
  // ============================================
  async scheduleShoppingReminder(shoppingListId, listName, reminderTime) {
    const reminderId = `shopping-${shoppingListId}`;
    
    if ('showTrigger' in Notification.prototype) {
      await this.registration.showNotification('KochPlan - Einkaufen', {
        body: `Vergiss nicht: ${listName}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: reminderId,
        requireInteraction: false,
        actions: [
          { action: 'open-list', title: 'Liste öffnen' },
          { action: 'dismiss', title: 'Erledigt' },
        ],
        data: { shoppingListId },
        showTrigger: new TimestampTrigger(reminderTime.getTime()),
      });
    }
  }
  
  // ============================================
  // ALLE TIMER ABBRECHEN
  // ============================================
  async cancelAllNotifications() {
    if (!this.registration) return;
    
    const notifications = await this.registration.getNotifications();
    notifications.forEach(notification => notification.close());
  }
  
  async cancelNotification(tag) {
    if (!this.registration) return;
    
    const notifications = await this.registration.getNotifications({ tag });
    notifications.forEach(notification => notification.close());
  }
  
  // ============================================
  // HELPER
  // ============================================
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

export const notificationService = new NotificationService();
```

### 7.2 Timer-Komponente

```vue
<!-- src/components/CookingTimer.vue -->
<template>
  <div class="cooking-timer" :class="{ 'is-running': isRunning, 'is-paused': isPaused }">
    <div class="timer-display">
      <span class="time">{{ formattedTime }}</span>
      <span class="label">{{ label }}</span>
    </div>
    
    <div class="timer-controls">
      <button 
        v-if="!isRunning && !isPaused"
        @click="start"
        class="btn btn-primary"
        aria-label="Timer starten"
      >
        <PlayIcon class="icon" />
        Start
      </button>
      
      <button 
        v-if="isRunning"
        @click="pause"
        class="btn btn-secondary"
        aria-label="Timer pausieren"
      >
        <PauseIcon class="icon" />
        Pause
      </button>
      
      <button 
        v-if="isPaused"
        @click="resume"
        class="btn btn-primary"
        aria-label="Timer fortsetzen"
      >
        <PlayIcon class="icon" />
        Weiter
      </button>
      
      <button 
        @click="reset"
        class="btn btn-ghost"
        aria-label="Timer zurücksetzen"
      >
        <ResetIcon class="icon" />
        Reset
      </button>
    </div>
    
    <div v-if="showNotificationOption" class="notification-option">
      <label class="checkbox">
        <input 
          v-model="enableNotification" 
          type="checkbox"
        />
        <span>Benachrichtigung bei Ablauf</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { PlayIcon, PauseIcon, ResetIcon } from '@heroicons/vue/24/solid';
import { notificationService } from '@/services/notificationService';

const props = defineProps({
  duration: { type: Number, required: true }, // in Minuten
  label: { type: String, default: 'Timer' },
  recipeId: { type: Number, default: null },
  recipeName: { type: String, default: '' },
});

const emit = defineEmits(['complete', 'start', 'pause', 'reset']);

// State
const timeRemaining = ref(props.duration * 60); // in Sekunden
const isRunning = ref(false);
const isPaused = ref(false);
const enableNotification = ref(true);
const timerInterval = ref(null);

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const showNotificationOption = computed(() => {
  return 'Notification' in window && Notification.permission === 'granted';
});

// Methods
function start() {
  isRunning.value = true;
  isPaused.value = false;
  
  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      complete();
    }
  }, 1000);
  
  // Notification planen
  if (enableNotification.value && showNotificationOption.value) {
    notificationService.setCookingTimer(
      props.recipeId,
      props.recipeName,
      props.duration,
      props.label
    );
  }
  
  emit('start');
}

function pause() {
  isRunning.value = false;
  isPaused.value = true;
  clearInterval(timerInterval.value);
  emit('pause');
}

function resume() {
  start();
}

function reset() {
  isRunning.value = false;
  isPaused.value = false;
  clearInterval(timerInterval.value);
  timeRemaining.value = props.duration * 60;
  emit('reset');
}

function complete() {
  isRunning.value = false;
  isPaused.value = false;
  clearInterval(timerInterval.value);
  
  // Sound abspielen
  playCompletionSound();
  
  emit('complete');
}

function playCompletionSound() {
  try {
    const audio = new Audio('/sounds/timer-complete.mp3');
    audio.play();
  } catch (error) {
    console.warn('[Timer] Could not play sound:', error);
  }
}

// Cleanup
onUnmounted(() => {
  clearInterval(timerInterval.value);
});
</script>

<style scoped>
.cooking-timer {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.timer-display {
  margin-bottom: 16px;
}

.time {
  display: block;
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #1a1a1a;
}

.label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.timer-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #e65100;
  color: white;
}

.btn-primary:hover {
  background: #d84315;
}

.btn-secondary {
  background: #fff;
  color: #1a1a1a;
  border: 1px solid #ddd;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.icon {
  width: 20px;
  height: 20px;
}

.notification-option {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.is-running .time {
  color: #e65100;
}
</style>
```

---

## 8. ZUSAMMENFASSUNG

### 8.1 Dateistruktur

```
KochPlan/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── ...
│   │   └── maskable-icon-512x512.png
│   ├── splash/
│   │   └── apple-splash-*.png
│   └── screenshots/
│       ├── recipe-list-narrow.png
│       └── ...
├── src/
│   ├── db/
│   │   ├── database.js
│   │   └── helpers.js
│   ├── services/
│   │   ├── notificationService.js
│   │   └── syncService.js
│   ├── composables/
│   │   ├── useOffline.js
│   │   └── useOfflineData.js
│   ├── utils/
│   │   ├── cacheManager.js
│   │   ├── imageOptimizer.js
│   │   └── criticalCss.js
│   ├── components/
│   │   └── CookingTimer.vue
│   └── ...
├── vite.config.js
└── PWA_ARCHITECTURE.md
```

### 8.2 Lighthouse-Score Ziele

| Kategorie | Ziel |
|-----------|------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |
| PWA | ≥ 90 |

### 8.3 Browser-Kompatibilität

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |
| Notification Triggers | ✅* | ❌ | ❌ | ✅* |
| Periodic Sync | ✅* | ❌ | ❌ | ✅* |

*Experimentell oder hinter Flag

---

*Dokumentation erstellt für KochPlan PWA - Offline-First Rezept-App*
