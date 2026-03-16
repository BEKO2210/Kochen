/**
 * KochPlan IndexedDB Database
 * 
 * Verwendet Dexie.js für einfache IndexedDB-Verwaltung
 * Implementiert Offline-First Datenpersistenz
 */

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
    
    // ============================================
    // HOOKS
    // ============================================
    this._setupHooks();
    
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
  
  _setupHooks() {
    // Hook für Rezepte: Suchindex aktualisieren
    this.recipes.hook('creating', (primKey, obj) => {
      this._updateSearchIndex('recipe', primKey, obj);
    });
    
    this.recipes.hook('updating', (mods, primKey, obj) => {
      this._updateSearchIndex('recipe', primKey, { ...obj, ...mods });
    });
    
    this.recipes.hook('deleting', (primKey) => {
      this._removeFromSearchIndex('recipe', primKey);
    });
  }
  
  async _updateSearchIndex(entityType, entityId, obj) {
    // Suchwörter extrahieren
    const words = this._extractWords(obj);
    
    // Alte Einträge löschen
    await this.searchIndex
      .where('[entityId+entityType]')
      .equals([entityId, entityType])
      .delete();
    
    // Neue Einträge hinzufügen
    const entries = words.map(word => ({
      word: word.toLowerCase(),
      entityType,
      entityId,
      field: 'title', // Simplifiziert
    }));
    
    if (entries.length > 0) {
      await this.searchIndex.bulkAdd(entries);
    }
  }
  
  async _removeFromSearchIndex(entityType, entityId) {
    await this.searchIndex
      .where('[entityId+entityType]')
      .equals([entityId, entityType])
      .delete();
  }
  
  _extractWords(obj) {
    const words = new Set();
    const fields = ['title', 'description', 'tags'];
    
    fields.forEach(field => {
      if (obj[field]) {
        const value = Array.isArray(obj[field]) 
          ? obj[field].join(' ') 
          : String(obj[field]);
        
        value.split(/\s+/).forEach(word => {
          word = word.replace(/[^\w]/g, '').toLowerCase();
          if (word.length > 2) {
            words.add(word);
          }
        });
      }
    });
    
    return Array.from(words);
  }
}

// Singleton-Instanz
export const db = new KochPlanDatabase();

// ============================================
// DATENBANK-INITIALISIERUNG
// ============================================
export async function initDatabase() {
  try {
    await db.open();
    console.log('[DB] KochPlan Database initialized');
    return true;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    return false;
  }
}

// ============================================
// SYNC QUEUE HELPER
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
  const item = await db.syncQueue.get(id);
  if (item) {
    return db.syncQueue.update(id, {
      retryCount: item.retryCount + 1,
    });
  }
}

export default db;
