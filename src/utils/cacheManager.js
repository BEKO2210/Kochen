/**
 * Cache Manager
 * 
 * Verwaltet die Cache-Größen und führt Bereinigungen durch
 */

export class CacheManager {
  constructor() {
    this.cacheNames = {
      images: 'recipe-images-cache',
      externalImages: 'external-images-cache',
      api: 'api-recipes-cache',
      mealPlans: 'api-mealplans-cache',
      shopping: 'api-shopping-cache',
      import: 'import-cache',
      fonts: 'google-fonts-cache',
    };
  }
  
  // ============================================
  // CACHE-GRÖSSE PRÜFEN
  // ============================================
  
  /**
   * Größe eines einzelnen Caches abrufen
   */
  async getCacheSize(cacheName) {
    try {
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
        name: cacheName,
        entries: requests.length,
        sizeBytes: totalSize,
        sizeMB: (totalSize / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error(`[CacheManager] Failed to get size for ${cacheName}:`, error);
      return {
        name: cacheName,
        entries: 0,
        sizeBytes: 0,
        sizeMB: '0.00',
        error: error.message,
      };
    }
  }
  
  /**
   * Größen aller Caches abrufen
   */
  async getAllCacheSizes() {
    const sizes = {};
    let totalSize = 0;
    let totalEntries = 0;
    
    for (const [name, cacheName] of Object.entries(this.cacheNames)) {
      const size = await this.getCacheSize(cacheName);
      sizes[name] = size;
      totalSize += size.sizeBytes;
      totalEntries += size.entries;
    }
    
    sizes.total = {
      sizeMB: (totalSize / 1024 / 1024).toFixed(2),
      entries: totalEntries,
    };
    
    return sizes;
  }
  
  // ============================================
  // CACHE BEREINIGEN
  // ============================================
  
  /**
   * Alte Bilder aus dem Cache entfernen
   */
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
  
  /**
   * Verwaiste Bilder entfernen (nicht mehr referenziert)
   */
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
  
  /**
   * API-Cache bereinigen (älteste Einträge zuerst)
   */
  async cleanupAPICache(maxEntries = 100) {
    const cache = await caches.open(this.cacheNames.api);
    const requests = await cache.keys();
    
    if (requests.length <= maxEntries) {
      return 0;
    }
    
    // Nach Datum sortieren und älteste löschen
    const sortedRequests = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const dateHeader = response?.headers.get('date');
        return {
          request,
          date: dateHeader ? new Date(dateHeader).getTime() : 0,
        };
      })
    );
    
    sortedRequests.sort((a, b) => a.date - b.date);
    
    const toDelete = sortedRequests.slice(0, sortedRequests.length - maxEntries);
    
    for (const { request } of toDelete) {
      await cache.delete(request);
    }
    
    console.log(`[CacheManager] Cleaned up ${toDelete.length} API cache entries`);
    return toDelete.length;
  }
  
  // ============================================
  // CACHE LEEREN
  // ============================================
  
  /**
   * Einzelnen Cache leeren
   */
  async clearCache(cacheName) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      await Promise.all(requests.map(req => cache.delete(req)));
      console.log(`[CacheManager] Cleared cache: ${cacheName}`);
      return true;
    } catch (error) {
      console.error(`[CacheManager] Failed to clear cache ${cacheName}:`, error);
      return false;
    }
  }
  
  /**
   * Alle Caches leeren
   */
  async clearAllCaches() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('[CacheManager] All caches cleared');
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to clear all caches:', error);
      return false;
    }
  }
  
  // ============================================
  // SPEICHERWARNUNG
  // ============================================
  
  /**
   * Speicher-Quota prüfen
   */
  async checkStorageQuota() {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return {
        available: false,
        message: 'Storage API not available',
      };
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
      const totalMB = estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) : 'unlimited';
      const percent = estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 'N/A';
      
      const warning = estimate.quota && (estimate.usage / estimate.quota) > 0.8;
      
      if (warning) {
        console.warn('[CacheManager] Storage quota exceeded 80%, cleanup recommended');
      }
      
      return {
        available: true,
        usedMB,
        totalMB,
        percent,
        warning,
        usage: estimate.usage,
        quota: estimate.quota,
      };
    } catch (error) {
      console.error('[CacheManager] Failed to check storage quota:', error);
      return {
        available: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Persistente Speicherung anfragen
   */
  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      return { granted: false, reason: 'API not available' };
    }
    
    try {
      const isPersistent = await navigator.storage.persist();
      
      if (isPersistent) {
        console.log('[CacheManager] Persistent storage granted');
      } else {
        console.log('[CacheManager] Persistent storage denied');
      }
      
      return { granted: isPersistent };
    } catch (error) {
      console.error('[CacheManager] Failed to request persistent storage:', error);
      return { granted: false, error: error.message };
    }
  }
  
  // ============================================
  // CACHE-WARTUNG
  // ============================================
  
  /**
   * Vollständige Cache-Wartung durchführen
   */
  async performMaintenance() {
    console.log('[CacheManager] Starting maintenance...');
    
    const results = {
      imageCleanup: 0,
      apiCleanup: 0,
      storageQuota: null,
    };
    
    // Alte Bilder bereinigen
    results.imageCleanup = await this.cleanupImageCache(30);
    
    // API-Cache bereinigen
    results.apiCleanup = await this.cleanupAPICache(100);
    
    // Speicher-Quota prüfen
    results.storageQuota = await this.checkStorageQuota();
    
    // Persistente Speicherung anfragen wenn nötig
    if (results.storageQuota.warning) {
      results.persistentStorage = await this.requestPersistentStorage();
    }
    
    console.log('[CacheManager] Maintenance completed', results);
    return results;
  }
  
  /**
   * Cache-Statistiken als String formatieren
   */
  formatStats(stats) {
    let output = 'Cache Statistics:\n';
    output += '=================\n\n';
    
    for (const [name, data] of Object.entries(stats)) {
      if (name === 'total') {
        output += `\nTOTAL:\n`;
        output += `  Entries: ${data.entries}\n`;
        output += `  Size: ${data.sizeMB} MB\n`;
      } else {
        output += `${name}:\n`;
        output += `  Entries: ${data.entries}\n`;
        output += `  Size: ${data.sizeMB} MB\n`;
      }
    }
    
    return output;
  }
}

// Singleton-Instanz
export const cacheManager = new CacheManager();

export default cacheManager;
