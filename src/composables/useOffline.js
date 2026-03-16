/**
 * useOffline Composable
 * 
 * Verwaltet den Offline-Status und die Synchronisation
 * für die KochPlan PWA
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db, addToSyncQueue } from '@/db/database';

// Reactive State
const isOnline = ref(navigator.onLine);
const isSyncing = ref(false);
const pendingSyncCount = ref(0);
const lastSyncTime = ref(null);
const syncError = ref(null);

// Event Listener Referenzen
let onlineListener = null;
let offlineListener = null;

export function useOffline() {
  // ============================================
  // INITIALISIERUNG
  // ============================================
  
  onMounted(() => {
    // Event Listener registrieren
    onlineListener = () => updateOnlineStatus();
    offlineListener = () => updateOnlineStatus();
    
    window.addEventListener('online', onlineListener);
    window.addEventListener('offline', offlineListener);
    
    // Initialen Status setzen
    updateOnlineStatus();
    updatePendingSyncCount();
  });
  
  onUnmounted(() => {
    // Event Listener entfernen
    if (onlineListener) {
      window.removeEventListener('online', onlineListener);
    }
    if (offlineListener) {
      window.removeEventListener('offline', offlineListener);
    }
  });
  
  // ============================================
  // NETZWERK-STATUS
  // ============================================
  
  /**
   * Online-Status aktualisieren
   */
  function updateOnlineStatus() {
    const wasOffline = !isOnline.value;
    isOnline.value = navigator.onLine;
    
    // Wenn wir wieder online kommen, automatisch synchronisieren
    if (wasOffline && isOnline.value && pendingSyncCount.value > 0) {
      triggerSync();
    }
  }
  
  // ============================================
  // SYNC-QUEUE VERWALTEN
  // ============================================
  
  /**
   * Anzahl der ausstehenden Sync-Items aktualisieren
   */
  async function updatePendingSyncCount() {
    pendingSyncCount.value = await db.syncQueue.count();
  }
  
  /**
   * Offline-Aktion zur Sync-Queue hinzufügen
   */
  async function queueOfflineAction(entityType, entityId, operation, payload) {
    await addToSyncQueue(entityType, entityId, operation, payload);
    await updatePendingSyncCount();
    
    // Background Sync registrieren wenn verfügbar
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(`${entityType}-${operation}`);
      } catch (error) {
        console.warn('[useOffline] Background sync registration failed:', error);
      }
    }
  }
  
  // ============================================
  // SYNCHRONISATION
  // ============================================
  
  /**
   * Synchronisation auslösen
   */
  async function triggerSync() {
    if (!isOnline.value || isSyncing.value) return;
    
    isSyncing.value = true;
    syncError.value = null;
    
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
          console.error(`[useOffline] Failed to sync item ${item.id}:`, error);
          
          // Retry-Count erhöhen
          const currentItem = await db.syncQueue.get(item.id);
          if (currentItem) {
            await db.syncQueue.update(item.id, {
              retryCount: currentItem.retryCount + 1,
              lastError: error.message,
            });
          }
          
          // Nach 5 Versuchen aufgeben
          if (currentItem?.retryCount >= 4) {
            syncError.value = `Synchronisation fehlgeschlagen für ${item.entityType}`;
          }
        }
      }
      
      lastSyncTime.value = Date.now();
    } catch (error) {
      console.error('[useOffline] Sync failed:', error);
      syncError.value = error.message;
    } finally {
      isSyncing.value = false;
      await updatePendingSyncCount();
    }
  }
  
  /**
   * Einzelnes Item synchronisieren
   */
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
      const errorText = await response.text();
      throw new Error(`Sync failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Remote ID aktualisieren wenn neu erstellt
    if (item.operation === 'create' && result.remoteId) {
      const tableName = item.entityType + 's';
      if (db[tableName]) {
        await db[tableName].update(item.entityId, {
          remoteId: result.remoteId,
          syncStatus: 'synced',
        });
      }
    }
    
    // Bei Update: Sync-Status aktualisieren
    if (item.operation === 'update') {
      const tableName = item.entityType + 's';
      if (db[tableName]) {
        await db[tableName].update(item.entityId, {
          syncStatus: 'synced',
        });
      }
    }
    
    return result;
  }
  
  // ============================================
  // KONFLIKT-LÖSUNG
  // ============================================
  
  /**
   * Konflikt zwischen lokalem und remote Item lösen
   */
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
  
  /**
   * Konfliktierende Items mergen
   */
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
    
    // Bewertung: höheren Wert behalten
    if (local.rating > remote.rating) {
      merged.rating = local.rating;
    }
    
    merged.updatedAt = Date.now();
    merged.syncStatus = 'pending';
    
    return merged;
  }
  
  /**
   * Konflikte prüfen und lösen
   */
  async function checkAndResolveConflicts() {
    if (!isOnline.value) return;
    
    try {
      // Alle Items mit pending Status abrufen
      const pendingRecipes = await db.recipes
        .where('syncStatus')
        .equals('pending')
        .toArray();
      
      for (const localItem of pendingRecipes) {
        if (!localItem.remoteId) continue;
        
        // Remote-Version abrufen
        const response = await fetch(`/api/v1/recipes/${localItem.remoteId}`);
        if (!response.ok) continue;
        
        const remoteItem = await response.json();
        
        // Prüfen ob Konflikt existiert
        if (remoteItem.updatedAt > localItem.updatedAt) {
          console.log(`[useOffline] Conflict detected for recipe ${localItem.id}`);
          
          // Konflikt lösen
          const resolved = await resolveConflict(localItem, remoteItem, 'merge');
          
          // Lokal speichern
          await db.recipes.update(localItem.id, resolved);
        }
      }
    } catch (error) {
      console.error('[useOffline] Conflict resolution failed:', error);
    }
  }
  
  // ============================================
  // OFFLINE-INDIKATOR
  // ============================================
  
  /**
   * Status für UI-Indikator
   */
  const offlineIndicator = computed(() => {
    if (!isOnline.value) {
      return { 
        type: 'offline', 
        message: 'Offline - Änderungen werden lokal gespeichert',
        icon: 'wifi-off',
        color: 'warning',
      };
    }
    if (isSyncing.value) {
      return { 
        type: 'syncing', 
        message: 'Synchronisiere...',
        icon: 'sync',
        color: 'info',
      };
    }
    if (pendingSyncCount.value > 0) {
      return { 
        type: 'pending', 
        message: `${pendingSyncCount.value} Änderungen werden synchronisiert`,
        icon: 'cloud-upload',
        color: 'info',
      };
    }
    if (syncError.value) {
      return {
        type: 'error',
        message: syncError.value,
        icon: 'error',
        color: 'error',
      };
    }
    return { 
      type: 'online', 
      message: 'Online',
      icon: 'wifi',
      color: 'success',
    };
  });
  
  /**
   * Formatierte letzte Sync-Zeit
   */
  const formattedLastSync = computed(() => {
    if (!lastSyncTime.value) return 'Nie';
    
    const date = new Date(lastSyncTime.value);
    const now = new Date();
    const diff = now - date;
    
    // Vor weniger als einer Minute
    if (diff < 60000) {
      return 'Gerade eben';
    }
    
    // Vor weniger als einer Stunde
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    }
    
    // Vor weniger als einem Tag
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `Vor ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    }
    
    // Datum anzeigen
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });
  
  return {
    // State
    isOnline: computed(() => isOnline.value),
    isSyncing: computed(() => isSyncing.value),
    pendingSyncCount: computed(() => pendingSyncCount.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    formattedLastSync,
    syncError: computed(() => syncError.value),
    offlineIndicator,
    
    // Methods
    queueOfflineAction,
    triggerSync,
    resolveConflict,
    checkAndResolveConflicts,
    updatePendingSyncCount,
  };
}

export default useOffline;
