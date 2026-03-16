/**
 * useOfflineData Composable
 * 
 * Offline-First Daten-Fetching mit automatischer Synchronisation
 */

import { ref, computed } from 'vue';
import { db, addToSyncQueue } from '@/db/database';

export function useOfflineData(entityType) {
  // State
  const data = ref([]);
  const singleItem = ref(null);
  const isLoading = ref(false);
  const isLoadingSingle = ref(false);
  const error = ref(null);
  const lastFetchTime = ref(null);
  
  // Tabellen-Referenz
  const table = db[entityType + 's'];
  
  if (!table) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  // ============================================
  // DATEN LADEN (Offline-First)
  // ============================================
  
  /**
   * Liste von Items laden
   */
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
      console.error('[useOfflineData] Fetch failed:', err);
    } finally {
      isLoading.value = false;
    }
    
    return data.value;
  }
  
  /**
   * Aus IndexedDB laden
   */
  async function fetchFromIndexedDB(options) {
    let query = table.toCollection();
    
    // Soft-deleted Items ausschließen
    query = query.filter(item => !item.deleted);
    
    // Where-Filter anwenden
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
  
  /**
   * Vom Server laden und cachen
   */
  async function fetchFromServer(options) {
    const url = `/api/v1/${entityType}s`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const serverData = await response.json();
    
    // In IndexedDB speichern
    const itemsToSave = serverData.map(item => ({
      ...item,
      syncStatus: 'synced',
      lastFetched: Date.now(),
    }));
    
    await table.bulkPut(itemsToSave);
    
    // UI aktualisieren wenn Daten sich geändert haben
    const hasChanges = JSON.stringify(data.value) !== JSON.stringify(itemsToSave);
    if (hasChanges) {
      data.value = itemsToSave;
    }
    
    return serverData;
  }
  
  // ============================================
  // EINZELNES ITEM LADEN
  // ============================================
  
  /**
   * Einzelnes Item laden
   */
  async function fetchById(id, options = {}) {
    isLoadingSingle.value = true;
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
      
      singleItem.value = item;
      return item;
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      isLoadingSingle.value = false;
    }
  }
  
  // ============================================
  // ITEM SPEICHERN
  // ============================================
  
  /**
   * Item speichern (Create oder Update)
   */
  async function save(item, options = {}) {
    const timestamp = Date.now();
    const isUpdate = !!item.id;
    
    const dataToSave = {
      ...item,
      updatedAt: timestamp,
      syncStatus: navigator.onLine ? 'syncing' : 'pending',
    };
    
    if (!isUpdate) {
      dataToSave.createdAt = timestamp;
    }
    
    // In IndexedDB speichern
    const id = await table.put(dataToSave);
    
    // Online: Direkt synchronisieren
    if (navigator.onLine && options.sync !== false) {
      try {
        const url = `/api/v1/${entityType}s${isUpdate ? `/${item.id}` : ''}`;
        const response = await fetch(url, {
          method: isUpdate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });
        
        if (response.ok) {
          const result = await response.json();
          await table.update(id, { 
            ...result, 
            syncStatus: 'synced',
            remoteId: result.id || result.remoteId,
          });
          
          // Lokale Daten aktualisieren
          if (isUpdate) {
            const index = data.value.findIndex(i => i.id === id);
            if (index !== -1) {
              data.value[index] = { ...data.value[index], ...result, syncStatus: 'synced' };
            }
          } else {
            data.value.push({ ...dataToSave, ...result, id, syncStatus: 'synced' });
          }
          
          return { id, synced: true, data: result };
        }
      } catch (err) {
        console.warn('[useOfflineData] Server save failed, queued:', err);
      }
    }
    
    // Offline: Zur Sync-Queue hinzufügen
    await addToSyncQueue(entityType, id, isUpdate ? 'update' : 'create', dataToSave);
    
    // Lokale Daten aktualisieren
    if (isUpdate) {
      const index = data.value.findIndex(i => i.id === id);
      if (index !== -1) {
        data.value[index] = { ...data.value[index], ...dataToSave };
      }
    } else {
      data.value.push({ ...dataToSave, id });
    }
    
    return { id, synced: false, queued: true };
  }
  
  // ============================================
  // ITEM LÖSCHEN
  // ============================================
  
  /**
   * Item löschen (Soft Delete)
   */
  async function remove(id, options = {}) {
    // Soft delete in IndexedDB
    await table.update(id, { 
      deleted: true, 
      deletedAt: timestamp,
      syncStatus: 'pending',
    });
    
    // Aus lokaler Liste entfernen
    const index = data.value.findIndex(i => i.id === id);
    if (index !== -1) {
      data.value.splice(index, 1);
    }
    
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
  
  // ============================================
  // BULK-OPERATIONEN
  // ============================================
  
  /**
   * Mehrere Items auf einmal speichern
   */
  async function saveMany(items, options = {}) {
    const timestamp = Date.now();
    const results = [];
    
    for (const item of items) {
      const result = await save(item, options);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Mehrere Items auf einmal löschen
   */
  async function removeMany(ids, options = {}) {
    const results = [];
    
    for (const id of ids) {
      const result = await remove(id, options);
      results.push(result);
    }
    
    return results;
  }
  
  // ============================================
  // SUCHEN
  // ============================================
  
  /**
   * Items durchsuchen
   */
  async function search(query, options = {}) {
    if (!query) {
      return fetch(options);
    }
    
    isLoading.value = true;
    
    try {
      const searchWords = query.toLowerCase().split(/\s+/);
      
      let collection = table.toCollection();
      
      // Volltext-Suche
      collection = collection.filter(item => {
        const searchFields = options.searchFields || ['title', 'description'];
        const searchText = searchFields
          .map(field => item[field] || '')
          .join(' ')
          .toLowerCase();
        
        return searchWords.every(word => searchText.includes(word));
      });
      
      // Soft-deleted ausschließen
      collection = collection.filter(item => !item.deleted);
      
      const results = await collection.toArray();
      data.value = results;
      
      return results;
    } finally {
      isLoading.value = false;
    }
  }
  
  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  
  const pendingItems = computed(() => {
    return data.value.filter(item => item.syncStatus === 'pending');
  });
  
  const syncedItems = computed(() => {
    return data.value.filter(item => item.syncStatus === 'synced');
  });
  
  const hasPendingChanges = computed(() => {
    return pendingItems.value.length > 0;
  });
  
  return {
    // State
    data: computed(() => data.value),
    singleItem: computed(() => singleItem.value),
    isLoading: computed(() => isLoading.value),
    isLoadingSingle: computed(() => isLoadingSingle.value),
    error: computed(() => error.value),
    lastFetchTime: computed(() => lastFetchTime.value),
    
    // Computed
    pendingItems,
    syncedItems,
    hasPendingChanges,
    
    // Methods
    fetch,
    fetchById,
    save,
    remove,
    saveMany,
    removeMany,
    search,
  };
}

export default useOfflineData;
