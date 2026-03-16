/**
 * KochPlan Database Helpers
 * 
 * High-Level Funktionen für Datenbank-Operationen
 */

import { db, addToSyncQueue } from './database';

// ============================================
// REZEPT-OPERATIONEN
// ============================================

/**
 * Rezept speichern (neu oder aktualisieren)
 */
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

/**
 * Einzelnes Rezept laden (mit Bild und Zutaten)
 */
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

/**
 * Rezepte suchen mit Filtern
 */
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
  if (filters.cuisine) {
    collection = collection.filter(r => r.cuisine === filters.cuisine);
  }
  if (filters.tags && filters.tags.length > 0) {
    collection = collection.filter(r => 
      filters.tags.some(tag => r.tags?.includes(tag))
    );
  }
  
  // Sortierung
  const sortField = filters.sortBy || 'updatedAt';
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
  
  return collection.sortBy(sortField).then(results => 
    sortOrder === 'desc' ? results.reverse() : results
  );
}

/**
 * Favoriten abrufen
 */
export async function getFavorites() {
  return db.recipes
    .where('isFavorite')
    .equals(1)
    .reverse()
    .sortBy('updatedAt');
}

/**
 * Rezept löschen (Soft Delete)
 */
export async function deleteRecipe(id) {
  // Soft delete
  await db.recipes.update(id, {
    deleted: true,
    deletedAt: Date.now(),
    syncStatus: 'pending',
  });
  
  // Zur Sync-Queue hinzufügen
  await addToSyncQueue('recipe', id, 'delete', { id });
  
  return true;
}

/**
 * Rezept duplizieren
 */
export async function duplicateRecipe(id) {
  const original = await getRecipe(id);
  if (!original) return null;
  
  const { id: _, createdAt, updatedAt, remoteId, ...recipeData } = original;
  
  const newRecipe = {
    ...recipeData,
    title: `${recipeData.title} (Kopie)`,
    isFavorite: false,
    rating: 0,
  };
  
  const newId = await saveRecipe(newRecipe);
  
  // Zutaten kopieren
  if (original.ingredients?.length > 0) {
    const newIngredients = original.ingredients.map(ing => ({
      recipeId: newId,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: ing.category,
    }));
    await db.ingredients.bulkAdd(newIngredients);
  }
  
  return newId;
}

// ============================================
// MEAL PLAN OPERATIONEN
// ============================================

/**
 * Meal Plans für ein Datum abrufen
 */
export async function getMealPlanForDate(date, mealType = null) {
  let query;
  
  if (mealType) {
    query = db.mealPlans.where('[date+mealType]').equals([date, mealType]);
  } else {
    query = db.mealPlans.where('date').equals(date);
  }
  
  const plans = await query.toArray();
  
  // Rezept-Details laden
  return Promise.all(plans.map(async plan => {
    const recipe = await db.recipes.get(plan.recipeId);
    return { ...plan, recipe };
  }));
}

/**
 * Meal Plans für einen Zeitraum abrufen
 */
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

/**
 * Meal Plan speichern
 */
export async function saveMealPlan(mealPlan) {
  const timestamp = Date.now();
  
  const data = {
    ...mealPlan,
    updatedAt: timestamp,
    syncStatus: 'pending',
  };
  
  if (!mealPlan.id) {
    data.createdAt = timestamp;
  }
  
  const id = await db.mealPlans.put(data);
  await addToSyncQueue('mealPlan', id, mealPlan.id ? 'update' : 'create', data);
  
  return id;
}

/**
 * Meal Plan löschen
 */
export async function deleteMealPlan(id) {
  await db.mealPlans.delete(id);
  await addToSyncQueue('mealPlan', id, 'delete', { id });
  return true;
}

// ============================================
// EINKAUFSLISTEN-OPERATIONEN
// ============================================

/**
 * Einkaufsliste aus Meal Plan erstellen
 */
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
    name: name || `Einkaufsliste für ${recipe?.title || 'Rezept'}`,
    mealPlanId,
    createdAt: timestamp,
    updatedAt: timestamp,
    isCompleted: false,
    syncStatus: 'pending',
  });
  
  // Zutaten als Items hinzufügen
  if (ingredients.length > 0 && recipe) {
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
  }
  
  await addToSyncQueue('shoppingList', listId, 'create', { id: listId });
  
  return listId;
}

/**
 * Einkaufsliste mit Items abrufen
 */
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

/**
 * Shopping Item Status toggeln
 */
export async function toggleShoppingItem(itemId) {
  const item = await db.shoppingItems.get(itemId);
  if (!item) return false;
  
  await db.shoppingItems.update(itemId, {
    isChecked: !item.isChecked,
  });
  
  return !item.isChecked;
}

/**
 * Alle Items einer Liste abhaken
 */
export async function checkAllItems(listId) {
  await db.shoppingItems
    .where('shoppingListId')
    .equals(listId)
    .modify({ isChecked: true });
}

/**
 * Einkaufsliste löschen
 */
export async function deleteShoppingList(id) {
  // Zuerst alle Items löschen
  await db.shoppingItems
    .where('shoppingListId')
    .equals(id)
    .delete();
  
  // Dann die Liste löschen
  await db.shoppingLists.delete(id);
  await addToSyncQueue('shoppingList', id, 'delete', { id });
  
  return true;
}

// ============================================
// SETTINGS OPERATIONEN
// ============================================

/**
 * Setting abrufen
 */
export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
}

/**
 * Setting speichern
 */
export async function setSetting(key, value) {
  return db.settings.put({ key, value });
}

/**
 * Mehrere Settings auf einmal speichern
 */
export async function setSettings(settings) {
  const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
  return db.settings.bulkPut(entries);
}

// ============================================
// TIMER OPERATIONEN
// ============================================

/**
 * Timer erstellen
 */
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

/**
 * Aktive Timer abrufen
 */
export async function getActiveTimers() {
  const now = Date.now();
  return db.timers
    .where('isRunning')
    .equals(1)
    .and(timer => timer.endsAt > now)
    .toArray();
}

/**
 * Timer stoppen
 */
export async function stopTimer(id) {
  return db.timers.update(id, {
    isRunning: false,
  });
}

/**
 * Timer als abgeschlossen markieren
 */
export async function completeTimer(id) {
  return db.timers.update(id, {
    isRunning: false,
    isCompleted: true,
  });
}

// ============================================
// KATEGORIE-OPERATIONEN
// ============================================

/**
 * Kategorien abrufen
 */
export async function getCategories(type = null) {
  let query = db.categories.toCollection();
  
  if (type) {
    query = db.categories.where('type').equals(type);
  }
  
  return query.sortBy('order');
}

/**
 * Kategorie speichern
 */
export async function saveCategory(category) {
  return db.categories.put(category);
}

// ============================================
// DATENBANK-WARTUNG
// ============================================

/**
 * Datenbank-Statistiken abrufen
 */
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
    categories: await db.categories.count(),
  };
  
  // Geschätzte Größe der Bilder
  const images = await db.recipeImages.toArray();
  const imageSize = images.reduce((sum, img) => {
    return sum + (img.image?.size || 0);
  }, 0);
  
  stats.imageStorageMB = (imageSize / 1024 / 1024).toFixed(2);
  
  return stats;
}

/**
 * Datenbank exportieren
 */
export async function exportDatabase() {
  const data = {
    recipes: await db.recipes.toArray(),
    ingredients: await db.ingredients.toArray(),
    mealPlans: await db.mealPlans.toArray(),
    shoppingLists: await db.shoppingLists.toArray(),
    shoppingItems: await db.shoppingItems.toArray(),
    settings: await db.settings.toArray(),
    categories: await db.categories.toArray(),
    exportDate: new Date().toISOString(),
    version: 1,
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Datenbank importieren
 */
export async function importDatabase(jsonData) {
  const data = JSON.parse(jsonData);
  
  // Validierung
  if (!data.recipes || !Array.isArray(data.recipes)) {
    throw new Error('Invalid import data');
  }
  
  // Daten importieren
  if (data.recipes?.length > 0) {
    await db.recipes.bulkPut(data.recipes);
  }
  if (data.ingredients?.length > 0) {
    await db.ingredients.bulkPut(data.ingredients);
  }
  if (data.mealPlans?.length > 0) {
    await db.mealPlans.bulkPut(data.mealPlans);
  }
  if (data.shoppingLists?.length > 0) {
    await db.shoppingLists.bulkPut(data.shoppingLists);
  }
  if (data.shoppingItems?.length > 0) {
    await db.shoppingItems.bulkPut(data.shoppingItems);
  }
  if (data.settings?.length > 0) {
    await db.settings.bulkPut(data.settings);
  }
  if (data.categories?.length > 0) {
    await db.categories.bulkPut(data.categories);
  }
  
  return true;
}

/**
 * Alle Daten löschen
 */
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

/**
 * Gelöschte/veraltete Daten bereinigen
 */
export async function cleanupDatabase() {
  // Alte Sync-Queue-Einträge löschen (älter als 7 Tage)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await db.syncQueue
    .where('timestamp')
    .below(oneWeekAgo)
    .delete();
  
  // Abgeschlossene Timer löschen (älter als 1 Tag)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  await db.timers
    .where('isCompleted')
    .equals(1)
    .and(timer => timer.endsAt < oneDayAgo)
    .delete();
  
  // Soft-deleted Rezepte nach 30 Tagen endgültig löschen
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const deletedRecipes = await db.recipes
    .where('deleted')
    .equals(1)
    .and(recipe => recipe.deletedAt < thirtyDaysAgo)
    .toArray();
  
  for (const recipe of deletedRecipes) {
    await db.recipeImages.where('recipeId').equals(recipe.id).delete();
    await db.ingredients.where('recipeId').equals(recipe.id).delete();
    await db.recipes.delete(recipe.id);
  }
  
  return {
    syncQueueCleaned: true,
    timersCleaned: true,
    recipesDeleted: deletedRecipes.length,
  };
}
