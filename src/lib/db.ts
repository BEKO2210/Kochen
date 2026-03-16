// ============================================
// KochPlan - Dexie.js Datenbank
// ============================================

import Dexie, { type Table, type IndexableType } from 'dexie';
import type {
  Recipe,
  MealPlan,
  ShoppingList,
  ShoppingItem,
  Timer,
  RecipeCollection,
  AppSettings,
  UserPreferences,
  SyncState,
  NewRecipe,
  NewShoppingList,
  NewTimer,
  NewMealPlan,
  RecipeSearchFilters,
  ImportResult,
  ExportOptions,
  DayOfWeek,
  MealType,
  ShoppingItemStatus,
  ShoppingCategory,
} from '../types';

// ============================================
// Datenbank-Klasse
// ============================================

export class KochPlanDB extends Dexie {
  // Tabellen-Deklarationen
  recipes!: Table<Recipe, number>;
  mealPlans!: Table<MealPlan, number>;
  shoppingLists!: Table<ShoppingList, number>;
  timers!: Table<Timer, number>;
  collections!: Table<RecipeCollection, number>;
  settings!: Table<AppSettings, number>;
  userPreferences!: Table<UserPreferences, number>;
  syncState!: Table<SyncState, number>;

  constructor() {
    super('KochPlanDB');
    
    this.version(1).stores({
      // Rezepte: Primärschlüssel id, Indizes für Suche
      recipes: '++id, title, category, difficulty, isFavorite, *dietLabels, *collections, *tags, createdAt, lastCooked, rating',
      
      // Wochenpläne: Primärschlüssel id, Index für Wochenstart
      mealPlans: '++id, weekStartDate, weekEndDate, createdAt',
      
      // Einkaufslisten: Primärschlüssel id, Indizes für Status und Datum
      shoppingLists: '++id, name, isCompleted, dueDate, createdAt, mealPlanId',
      
      // Timer: Primärschlüssel id, Index für Status
      timers: '++id, status, createdAt, recipeId',
      
      // Sammlungen: Primärschlüssel id, Index für Name
      collections: '++id, name, isSystem, createdAt',
      
      // Einstellungen: Primärschlüssel id (immer 1)
      settings: '++id',
      
      // Benutzereinstellungen: Primärschlüssel id (immer 1)
      userPreferences: '++id',
      
      // Sync-Status: Primärschlüssel id (immer 1)
      syncState: '++id, deviceId',
    });

    // Hooks für automatische Zeitstempel
    this.setupHooks();
  }

  // ============================================
  // Hooks
  // ============================================

  private setupHooks(): void {
    // Rezepte: updatedAt automatisch setzen
    this.recipes.hook('creating', (primKey, obj) => {
      obj.createdAt = obj.createdAt || new Date();
      obj.updatedAt = new Date();
      obj.isFavorite = obj.isFavorite ?? false;
      obj.collections = obj.collections || [];
      obj.dietLabels = obj.dietLabels || [];
      obj.ingredients = obj.ingredients || [];
      obj.steps = obj.steps || [];
      return obj;
    });

    this.recipes.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Wochenpläne: updatedAt automatisch setzen
    this.mealPlans.hook('creating', (primKey, obj) => {
      obj.createdAt = obj.createdAt || new Date();
      obj.updatedAt = new Date();
      return obj;
    });

    this.mealPlans.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Einkaufslisten: updatedAt automatisch setzen
    this.shoppingLists.hook('creating', (primKey, obj) => {
      obj.createdAt = obj.createdAt || new Date();
      obj.updatedAt = new Date();
      obj.isCompleted = obj.isCompleted ?? false;
      obj.items = obj.items || [];
      return obj;
    });

    this.shoppingLists.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Sammlungen: updatedAt automatisch setzen
    this.collections.hook('creating', (primKey, obj) => {
      obj.createdAt = obj.createdAt || new Date();
      obj.updatedAt = new Date();
      obj.recipeIds = obj.recipeIds || [];
      return obj;
    });

    this.collections.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    // Einstellungen: updatedAt automatisch setzen
    this.settings.hook('creating', (primKey, obj) => {
      obj.updatedAt = new Date();
      return obj;
    });

    this.settings.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });
  }

  // ============================================
  // Recipe CRUD Operations
  // ============================================

  /**
   * Erstellt ein neues Rezept
   */
  async createRecipe(recipe: NewRecipe): Promise<number> {
    return await this.recipes.add(recipe as Recipe);
  }

  /**
   * Liest ein Rezept anhand der ID
   */
  async getRecipe(id: number): Promise<Recipe | undefined> {
    return await this.recipes.get(id);
  }

  /**
   * Liest alle Rezepte
   */
  async getAllRecipes(): Promise<Recipe[]> {
    return await this.recipes.toArray();
  }

  /**
   * Aktualisiert ein Rezept
   */
  async updateRecipe(id: number, changes: Partial<Recipe>): Promise<number> {
    return await this.recipes.update(id, changes);
  }

  /**
   * Löscht ein Rezept
   */
  async deleteRecipe(id: number): Promise<void> {
    await this.recipes.delete(id);
    // Entferne Rezept aus allen Sammlungen
    await this.removeRecipeFromAllCollections(id);
  }

  /**
   * Sucht Rezepte mit Filtern
   */
  async searchRecipes(filters: RecipeSearchFilters): Promise<Recipe[]> {
    let collection = this.recipes.toCollection();

    // Textsuche im Titel
    if (filters.query) {
      const query = filters.query.toLowerCase();
      collection = this.recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        (recipe.description?.toLowerCase().includes(query) ?? false) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query))
      );
    }

    // Kategorien filtern
    if (filters.categories && filters.categories.length > 0) {
      collection = this.recipes.where('category').anyOf(filters.categories);
    }

    // Schwierigkeitsgrade filtern
    if (filters.difficulties && filters.difficulties.length > 0) {
      collection = this.recipes.where('difficulty').anyOf(filters.difficulties);
    }

    // Ernährungslabels filtern
    if (filters.dietLabels && filters.dietLabels.length > 0) {
      collection = this.recipes.where('dietLabels').anyOf(filters.dietLabels);
    }

    // Nur Favoriten
    if (filters.favoritesOnly) {
      collection = this.recipes.where('isFavorite').equals(1);
    }

    // Maximale Zeit
    if (filters.maxTime) {
      collection = this.recipes.filter(recipe => recipe.totalTime <= filters.maxTime!);
    }

    // Mindestbewertung
    if (filters.minRating) {
      collection = this.recipes.filter(recipe => (recipe.rating ?? 0) >= filters.minRating!);
    }

    // Sammlung filtern
    if (filters.collection) {
      collection = this.recipes.filter(recipe => 
        recipe.collections.includes(filters.collection!)
      );
    }

    // Tags filtern
    if (filters.tags && filters.tags.length > 0) {
      collection = this.recipes.filter(recipe => 
        filters.tags!.some(tag => recipe.tags?.includes(tag))
      );
    }

    return await collection.toArray();
  }

  /**
   * Holt alle Favoriten-Rezepte
   */
  async getFavoriteRecipes(): Promise<Recipe[]> {
    return await this.recipes.where('isFavorite').equals(1).toArray();
  }

  /**
   * Holt Rezepte nach Kategorie
   */
  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return await this.recipes.where('category').equals(category).toArray();
  }

  /**
   * Holt Rezepte nach Sammlung
   */
  async getRecipesByCollection(collectionName: string): Promise<Recipe[]> {
    return await this.recipes.where('collections').equals(collectionName).toArray();
  }

  /**
   * Setzt den Favoriten-Status eines Rezepts
   */
  async toggleFavorite(id: number): Promise<void> {
    const recipe = await this.getRecipe(id);
    if (recipe) {
      await this.updateRecipe(id, { isFavorite: !recipe.isFavorite });
    }
  }

  /**
   * Markiert ein Rezept als gekocht (aktualisiert lastCooked)
   */
  async markAsCooked(id: number): Promise<void> {
    await this.updateRecipe(id, { lastCooked: new Date() });
  }

  /**
   * Holt zuletzt gekochte Rezepte
   */
  async getRecentlyCooked(limit: number = 10): Promise<Recipe[]> {
    return await this.recipes
      .where('lastCooked')
      .above(new Date(0))
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Holt die neuesten Rezepte
   */
  async getLatestRecipes(limit: number = 10): Promise<Recipe[]> {
    return await this.recipes
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Zählt alle Rezepte
   */
  async countRecipes(): Promise<number> {
    return await this.recipes.count();
  }

  // ============================================
  // Meal Plan Operations
  // ============================================

  /**
   * Erstellt einen neuen Wochenplan
   */
  async createMealPlan(mealPlan: NewMealPlan): Promise<number> {
    return await this.mealPlans.add(mealPlan as MealPlan);
  }

  /**
   * Liest einen Wochenplan anhand der ID
   */
  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    return await this.mealPlans.get(id);
  }

  /**
   * Holt den Wochenplan für ein bestimmtes Datum
   */
  async getMealPlanByDate(date: Date): Promise<MealPlan | undefined> {
    const startOfWeek = this.getStartOfWeek(date);
    return await this.mealPlans
      .where('weekStartDate')
      .equals(startOfWeek)
      .first();
  }

  /**
   * Holt den aktuellen Wochenplan
   */
  async getCurrentMealPlan(): Promise<MealPlan | undefined> {
    return await this.getMealPlanByDate(new Date());
  }

  /**
   * Holt alle Wochenpläne
   */
  async getAllMealPlans(): Promise<MealPlan[]> {
    return await this.mealPlans.orderBy('weekStartDate').reverse().toArray();
  }

  /**
   * Aktualisiert einen Wochenplan
   */
  async updateMealPlan(id: number, changes: Partial<MealPlan>): Promise<number> {
    return await this.mealPlans.update(id, changes);
  }

  /**
   * Fügt eine Mahlzeit zum Wochenplan hinzu
   */
  async addMealToPlan(
    planId: number,
    day: DayOfWeek,
    mealType: MealType,
    recipeId: number,
    recipeName: string,
    servings: number = 4
  ): Promise<void> {
    const plan = await this.getMealPlan(planId);
    if (!plan) throw new Error('Meal plan not found');

    const updatedDays = { ...plan.days };
    if (!updatedDays[day]) {
      updatedDays[day] = { breakfast: undefined, lunch: undefined, dinner: undefined, snack: undefined };
    }

    updatedDays[day][mealType] = {
      recipeId,
      recipeName,
      servings,
      addToShoppingList: true,
      isCooked: false,
    };

    await this.updateMealPlan(planId, { days: updatedDays });
  }

  /**
   * Entfernt eine Mahlzeit aus dem Wochenplan
   */
  async removeMealFromPlan(
    planId: number,
    day: DayOfWeek,
    mealType: MealType
  ): Promise<void> {
    const plan = await this.getMealPlan(planId);
    if (!plan) throw new Error('Meal plan not found');

    const updatedDays = { ...plan.days };
    if (updatedDays[day]) {
      delete updatedDays[day][mealType];
    }

    await this.updateMealPlan(planId, { days: updatedDays });
  }

  /**
   * Löscht einen Wochenplan
   */
  async deleteMealPlan(id: number): Promise<void> {
    await this.mealPlans.delete(id);
  }

  /**
   * Generiert eine Einkaufsliste aus einem Wochenplan
   */
  async generateShoppingListFromMealPlan(planId: number, listName?: string): Promise<number> {
    const plan = await this.getMealPlan(planId);
    if (!plan) throw new Error('Meal plan not found');

    const shoppingItems: ShoppingItem[] = [];
    let sortOrder = 0;

    // Sammle alle Zutaten aus den geplanten Mahlzeiten
    for (const [day, meals] of Object.entries(plan.days)) {
      for (const [mealType, meal] of Object.entries(meals)) {
        if (!meal || !meal.addToShoppingList) continue;

        const recipe = await this.getRecipe(meal.recipeId);
        if (!recipe) continue;

        // Skaliere Zutaten basierend auf Portionen
        const scaleFactor = meal.servings / recipe.servings;

        for (const ingredient of recipe.ingredients) {
          if (ingredient.isOptional) continue;

          shoppingItems.push({
            name: ingredient.name,
            amount: ingredient.amount * scaleFactor,
            unit: ingredient.unit,
            category: this.categorizeIngredient(ingredient.name),
            status: 'pending',
            recipeId: recipe.id,
            recipeName: recipe.title,
            isOptional: ingredient.isOptional,
            sortOrder: sortOrder++,
          });
        }
      }
    }

    // Gruppiere gleiche Zutaten
    const groupedItems = this.groupShoppingItems(shoppingItems);

    // Erstelle die Einkaufsliste
    const shoppingList: NewShoppingList = {
      name: listName || `Einkaufsliste ${plan.weekStartDate.toLocaleDateString('de-DE')}`,
      description: `Automatisch generiert aus Wochenplan`,
      createdAt: new Date(),
      dueDate: plan.weekStartDate,
      isCompleted: false,
      items: groupedItems,
      mealPlanId: planId,
    };

    return await this.createShoppingList(shoppingList);
  }

  // ============================================
  // Shopping List Operations
  // ============================================

  /**
   * Erstellt eine neue Einkaufsliste
   */
  async createShoppingList(shoppingList: NewShoppingList): Promise<number> {
    return await this.shoppingLists.add(shoppingList as ShoppingList);
  }

  /**
   * Liest eine Einkaufsliste anhand der ID
   */
  async getShoppingList(id: number): Promise<ShoppingList | undefined> {
    return await this.shoppingLists.get(id);
  }

  /**
   * Holt alle Einkaufslisten
   */
  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return await this.shoppingLists.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Holt aktive (nicht abgeschlossene) Einkaufslisten
   */
  async getActiveShoppingLists(): Promise<ShoppingList[]> {
    return await this.shoppingLists.where('isCompleted').equals(0).toArray();
  }

  /**
   * Aktualisiert eine Einkaufsliste
   */
  async updateShoppingList(id: number, changes: Partial<ShoppingList>): Promise<number> {
    return await this.shoppingLists.update(id, changes);
  }

  /**
   * Löscht eine Einkaufsliste
   */
  async deleteShoppingList(id: number): Promise<void> {
    await this.shoppingLists.delete(id);
  }

  /**
   * Fügt einen Artikel zur Einkaufsliste hinzu
   */
  async addItemToShoppingList(
    listId: number,
    item: Omit<ShoppingItem, 'id' | 'sortOrder'>
  ): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const maxSortOrder = list.items.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    
    const newItem: ShoppingItem = {
      ...item,
      sortOrder: maxSortOrder + 1,
    };

    await this.updateShoppingList(listId, {
      items: [...list.items, newItem],
    });
  }

  /**
   * Aktualisiert den Status eines Artikels
   */
  async updateItemStatus(
    listId: number,
    itemIndex: number,
    status: ShoppingItemStatus
  ): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const updatedItems = [...list.items];
    if (updatedItems[itemIndex]) {
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], status };
      await this.updateShoppingList(listId, { items: updatedItems });
    }
  }

  /**
   * Entfernt einen Artikel aus der Einkaufsliste
   */
  async removeItemFromShoppingList(listId: number, itemIndex: number): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const updatedItems = list.items.filter((_, index) => index !== itemIndex);
    await this.updateShoppingList(listId, { items: updatedItems });
  }

  /**
   * Markiert alle Artikel als gekauft
   */
  async markAllItemsAsPurchased(listId: number): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const updatedItems = list.items.map(item => ({
      ...item,
      status: 'purchased' as ShoppingItemStatus,
    }));

    await this.updateShoppingList(listId, { 
      items: updatedItems,
      isCompleted: true,
    });
  }

  /**
   * Löscht alle gekauften Artikel
   */
  async clearPurchasedItems(listId: number): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const updatedItems = list.items.filter(item => item.status !== 'purchased');
    await this.updateShoppingList(listId, { items: updatedItems });
  }

  /**
   * Sortiert Artikel nach Kategorie
   */
  async sortShoppingListByCategory(listId: number): Promise<void> {
    const list = await this.getShoppingList(listId);
    if (!list) throw new Error('Shopping list not found');

    const categoryOrder = this.getDefaultShoppingCategories().map(c => c.name);
    
    const sortedItems = [...list.items].sort((a, b) => {
      const catIndexA = categoryOrder.indexOf(a.category);
      const catIndexB = categoryOrder.indexOf(b.category);
      
      if (catIndexA !== catIndexB) {
        return catIndexA - catIndexB;
      }
      return a.name.localeCompare(b.name);
    });

    // Aktualisiere Sortierreihenfolge
    const reorderedItems = sortedItems.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    await this.updateShoppingList(listId, { items: reorderedItems });
  }

  // ============================================
  // Timer Operations
  // ============================================

  /**
   * Erstellt einen neuen Timer
   */
  async createTimer(timer: NewTimer): Promise<number> {
    return await this.timers.add(timer as Timer);
  }

  /**
   * Liest einen Timer anhand der ID
   */
  async getTimer(id: number): Promise<Timer | undefined> {
    return await this.timers.get(id);
  }

  /**
   * Holt alle Timer
   */
  async getAllTimers(): Promise<Timer[]> {
    return await this.timers.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Holt aktive Timer
   */
  async getActiveTimers(): Promise<Timer[]> {
    return await this.timers.where('status').anyOf(['running', 'paused']).toArray();
  }

  /**
   * Aktualisiert einen Timer
   */
  async updateTimer(id: number, changes: Partial<Timer>): Promise<number> {
    return await this.timers.update(id, changes);
  }

  /**
   * Löscht einen Timer
   */
  async deleteTimer(id: number): Promise<void> {
    await this.timers.delete(id);
  }

  /**
   * Startet einen Timer
   */
  async startTimer(id: number): Promise<void> {
    await this.updateTimer(id, {
      status: 'running',
      startedAt: new Date(),
    });
  }

  /**
   * Pausiert einen Timer
   */
  async pauseTimer(id: number): Promise<void> {
    const timer = await this.getTimer(id);
    if (!timer || timer.status !== 'running') return;

    const now = new Date();
    const elapsedSeconds = timer.startedAt 
      ? Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
      : 0;

    await this.updateTimer(id, {
      status: 'paused',
      pausedAt: now,
      remainingSeconds: Math.max(0, timer.remainingSeconds - elapsedSeconds),
    });
  }

  /**
   * Setzt einen Timer zurück
   */
  async resetTimer(id: number): Promise<void> {
    const timer = await this.getTimer(id);
    if (!timer) return;

    await this.updateTimer(id, {
      status: 'idle',
      remainingSeconds: timer.durationSeconds,
      startedAt: undefined,
      pausedAt: undefined,
      completedAt: undefined,
    });
  }

  /**
   * Markiert einen Timer als abgeschlossen
   */
  async completeTimer(id: number): Promise<void> {
    await this.updateTimer(id, {
      status: 'completed',
      remainingSeconds: 0,
      completedAt: new Date(),
    });
  }

  /**
   * Löscht alle abgeschlossenen Timer
   */
  async clearCompletedTimers(): Promise<void> {
    const completedTimers = await this.timers.where('status').equals('completed').toArray();
    await this.timers.bulkDelete(completedTimers.map(t => t.id!));
  }

  // ============================================
  // Collection Operations
  // ============================================

  /**
   * Erstellt eine neue Sammlung
   */
  async createCollection(collection: Omit<RecipeCollection, 'id'>): Promise<number> {
    return await this.collections.add(collection as RecipeCollection);
  }

  /**
   * Liest eine Sammlung anhand der ID
   */
  async getCollection(id: number): Promise<RecipeCollection | undefined> {
    return await this.collections.get(id);
  }

  /**
   * Liest eine Sammlung anhand des Namens
   */
  async getCollectionByName(name: string): Promise<RecipeCollection | undefined> {
    return await this.collections.where('name').equals(name).first();
  }

  /**
   * Holt alle Sammlungen
   */
  async getAllCollections(): Promise<RecipeCollection[]> {
    return await this.collections.orderBy('name').toArray();
  }

  /**
   * Holt alle benutzerdefinierten Sammlungen (nicht System)
   */
  async getUserCollections(): Promise<RecipeCollection[]> {
    return await this.collections.where('isSystem').equals(0).toArray();
  }

  /**
   * Aktualisiert eine Sammlung
   */
  async updateCollection(id: number, changes: Partial<RecipeCollection>): Promise<number> {
    return await this.collections.update(id, changes);
  }

  /**
   * Löscht eine Sammlung
   */
  async deleteCollection(id: number): Promise<void> {
    await this.collections.delete(id);
  }

  /**
   * Fügt ein Rezept zu einer Sammlung hinzu
   */
  async addRecipeToCollection(collectionId: number, recipeId: number): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    if (!collection.recipeIds.includes(recipeId)) {
      await this.updateCollection(collectionId, {
        recipeIds: [...collection.recipeIds, recipeId],
      });
    }
  }

  /**
   * Entfernt ein Rezept aus einer Sammlung
   */
  async removeRecipeFromCollection(collectionId: number, recipeId: number): Promise<void> {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    await this.updateCollection(collectionId, {
      recipeIds: collection.recipeIds.filter(id => id !== recipeId),
    });
  }

  /**
   * Entfernt ein Rezept aus allen Sammlungen
   */
  async removeRecipeFromAllCollections(recipeId: number): Promise<void> {
    const allCollections = await this.getAllCollections();
    
    for (const collection of allCollections) {
      if (collection.recipeIds.includes(recipeId)) {
        await this.removeRecipeFromCollection(collection.id!, recipeId);
      }
    }
  }

  // ============================================
  // Settings Operations
  // ============================================

  /**
   * Holt die App-Einstellungen
   */
  async getSettings(): Promise<AppSettings | undefined> {
    return await this.settings.get(1);
  }

  /**
   * Initialisiert die Standardeinstellungen
   */
  async initializeDefaultSettings(): Promise<number> {
    const existing = await this.getSettings();
    if (existing) return 1;

    const defaultSettings: Omit<AppSettings, 'id'> = {
      themeMode: 'system',
      language: 'de',
      defaultServings: 4,
      defaultCategory: 'dinner',
      notificationsEnabled: true,
      timerSoundEnabled: true,
      timerVolume: 0.7,
      vibrationEnabled: true,
      shoppingCategories: this.getDefaultShoppingCategories(),
      defaultUnits: ['g', 'ml', 'piece', 'tsp', 'tbsp', 'cup'],
      recentTags: [],
      recentCollections: [],
      dbVersion: 1,
      updatedAt: new Date(),
    };

    return await this.settings.add(defaultSettings as AppSettings);
  }

  /**
   * Aktualisiert die Einstellungen
   */
  async updateSettings(changes: Partial<AppSettings>): Promise<number> {
    return await this.settings.update(1, changes);
  }

  /**
   * Holt die Benutzereinstellungen
   */
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return await this.userPreferences.get(1);
  }

  /**
   * Initialisiert die Standard-Benutzereinstellungen
   */
  async initializeDefaultUserPreferences(): Promise<number> {
    const existing = await this.getUserPreferences();
    if (existing) return 1;

    const defaultPrefs: Omit<UserPreferences, 'id'> = {
      preferredCategories: ['dinner', 'lunch'],
      preferredDietLabels: [],
      excludedIngredients: [],
      maxCookingTime: 60,
      preferredStores: [],
      budgetPreference: 'medium',
    };

    return await this.userPreferences.add(defaultPrefs as UserPreferences);
  }

  /**
   * Aktualisiert die Benutzereinstellungen
   */
  async updateUserPreferences(changes: Partial<UserPreferences>): Promise<number> {
    return await this.userPreferences.update(1, changes);
  }

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Holt den Sync-Status
   */
  async getSyncState(): Promise<SyncState | undefined> {
    return await this.syncState.get(1);
  }

  /**
   * Initialisiert den Sync-Status
   */
  async initializeSyncState(deviceId: string): Promise<number> {
    const existing = await this.getSyncState();
    if (existing) return 1;

    const syncState: Omit<SyncState, 'id'> = {
      deviceId,
      isSyncing: false,
    };

    return await this.syncState.add(syncState as SyncState);
  }

  /**
   * Aktualisiert den Sync-Status
   */
  async updateSyncState(changes: Partial<SyncState>): Promise<number> {
    return await this.syncState.update(1, changes);
  }

  // ============================================
  // Import/Export Operations
  // ============================================

  /**
   * Exportiert alle Daten
   */
  async exportAllData(options: ExportOptions): Promise<string> {
    const exportData: Record<string, unknown> = {};

    if (options.includeRecipes) {
      let recipes = await this.getAllRecipes();
      if (options.favoritesOnly) {
        recipes = recipes.filter(r => r.isFavorite);
      }
      if (options.collectionIds) {
        recipes = recipes.filter(r => 
          options.collectionIds!.some(id => r.collections.includes(String(id)))
        );
      }
      exportData.recipes = recipes;
    }

    if (options.includeMealPlans) {
      exportData.mealPlans = await this.getAllMealPlans();
    }

    if (options.includeShoppingLists) {
      exportData.shoppingLists = await this.getAllShoppingLists();
    }

    if (options.includeCollections) {
      exportData.collections = await this.getAllCollections();
    }

    if (options.includeSettings) {
      exportData.settings = await this.getSettings();
      exportData.userPreferences = await this.getUserPreferences();
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importiert Rezepte aus JSON
   */
  async importRecipes(jsonData: string): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      importedIds: [],
    };

    try {
      const data = JSON.parse(jsonData);
      const recipes: NewRecipe[] = Array.isArray(data) ? data : data.recipes || [];

      for (const recipe of recipes) {
        try {
          // Entferne ID für Neuanlage
          const { id, ...recipeWithoutId } = recipe as Recipe & { id?: number };
          const newId = await this.createRecipe(recipeWithoutId as NewRecipe);
          result.successCount++;
          result.importedIds.push(newId);
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Fehler beim Importieren von "${recipe.title}": ${error}`);
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push(`Ungültiges JSON-Format: ${error}`);
    }

    return result;
  }

  /**
   * Löscht alle Daten (für Reset)
   */
  async clearAllData(): Promise<void> {
    await this.recipes.clear();
    await this.mealPlans.clear();
    await this.shoppingLists.clear();
    await this.timers.clear();
    await this.collections.clear();
  }

  // ============================================
  // Database Info
  // ============================================

  /**
   * Holt Datenbank-Statistiken
   */
  async getDatabaseStats(): Promise<{
    recipes: number;
    mealPlans: number;
    shoppingLists: number;
    timers: number;
    collections: number;
    totalSize: number;
  }> {
    return {
      recipes: await this.recipes.count(),
      mealPlans: await this.mealPlans.count(),
      shoppingLists: await this.shoppingLists.count(),
      timers: await this.timers.count(),
      collections: await this.collections.count(),
      totalSize: 0, // Würde durch Storage API berechnet
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Berechnet den Montag der aktuellen Woche
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Montag als erster Tag
    return new Date(d.setDate(diff));
  }

  /**
   * Kategorisiert eine Zutat für die Einkaufsliste
   */
  private categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    
    const categories: Record<string, string[]> = {
      'Obst & Gemüse': ['apfel', 'banane', 'tomate', 'gurke', 'zwiebel', 'knoblauch', 'karotte', 'kartoffel', 'salat', 'spinat', 'brokkoli', 'paprika', 'zucchini', 'aubergine', 'pilz', 'zitrone', 'orange', 'erdbeere', 'kirsche', 'pfirsich'],
      'Milchprodukte & Eier': ['milch', 'joghurt', 'sahne', 'butter', 'käse', 'eier', 'quark', 'creme fraiche', 'sour cream'],
      'Fleisch & Fisch': ['hähnchen', 'rind', 'schwein', 'lachs', 'thunfisch', 'garnelen', 'wurst', 'speck', 'hackfleisch', 'schnitzel'],
      'Brot & Gebäck': ['brot', 'brötchen', 'toast', 'mehl', 'hefe', 'backpulver'],
      'Getränke': ['wasser', 'saft', 'cola', 'bier', 'wein', 'kaffee', 'tee'],
      'Gewürze & Kräuter': ['salz', 'pfeffer', 'basilikum', 'oregano', 'thymian', 'rosmarin', 'paprikapulver', 'kreuzkümmel', 'kurkuma', 'zimt'],
      'Konserven & Fertiggerichte': ['dose', 'konserve', 'suppe', 'soße', 'nudeln', 'reis', 'linsen', 'bohnen'],
      'Süßes & Snacks': ['schokolade', 'kekse', 'chips', 'nüsse', 'mandeln', 'haselnüsse', 'walnüsse'],
      'Tiefkühl': ['tiefkühl', 'eis', 'tiefgekühlt'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }

    return 'Sonstiges';
  }

  /**
   * Gruppiert gleiche Zutaten in der Einkaufsliste
   */
  private groupShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
    const grouped = new Map<string, ShoppingItem>();

    for (const item of items) {
      const key = `${item.name.toLowerCase()}_${item.unit}`;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.amount += item.amount;
        // Sammle Rezept-Informationen
        if (item.recipeId && !existing.recipeName?.includes(item.recipeName || '')) {
          existing.recipeName = existing.recipeName 
            ? `${existing.recipeName}, ${item.recipeName}` 
            : item.recipeName;
        }
      } else {
        grouped.set(key, { ...item });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Gibt die Standard-Einkaufskategorien zurück
   */
  private getDefaultShoppingCategories(): ShoppingCategory[] {
    return [
      { name: 'Obst & Gemüse', color: '#22c55e', defaultSortOrder: 0 },
      { name: 'Milchprodukte & Eier', color: '#3b82f6', defaultSortOrder: 1 },
      { name: 'Fleisch & Fisch', color: '#ef4444', defaultSortOrder: 2 },
      { name: 'Brot & Gebäck', color: '#f59e0b', defaultSortOrder: 3 },
      { name: 'Getränke', color: '#06b6d4', defaultSortOrder: 4 },
      { name: 'Gewürze & Kräuter', color: '#8b5cf6', defaultSortOrder: 5 },
      { name: 'Konserven & Fertiggerichte', color: '#f97316', defaultSortOrder: 6 },
      { name: 'Süßes & Snacks', color: '#ec4899', defaultSortOrder: 7 },
      { name: 'Tiefkühl', color: '#06b6d4', defaultSortOrder: 8 },
      { name: 'Sonstiges', color: '#6b7280', defaultSortOrder: 9 },
    ];
  }
}

// ============================================
// Singleton-Instanz
// ============================================

export const db = new KochPlanDB();

// ============================================
// Initialisierungs-Funktion
// ============================================

export async function initializeDatabase(): Promise<void> {
  try {
    // Öffne die Datenbank
    await db.open();
    
    // Initialisiere Standardeinstellungen
    await db.initializeDefaultSettings();
    await db.initializeDefaultUserPreferences();
    
    console.log('KochPlanDB erfolgreich initialisiert');
  } catch (error) {
    console.error('Fehler beim Initialisieren der Datenbank:', error);
    throw error;
  }
}

// ============================================
// Exportierte Typen
// ============================================

export type { KochPlanDB };
