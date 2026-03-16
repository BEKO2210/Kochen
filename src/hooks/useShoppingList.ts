import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ingredient } from './useRecipes';

// ============================================================================
// Types
// ============================================================================

export interface ShoppingItem extends Ingredient {
  id: string;
  checked: boolean;
  category: string;
  recipeSource?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UseShoppingListReturn {
  // State
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  isLoading: boolean;

  // List Management
  createList: (name: string) => string;
  deleteList: (listId: string) => boolean;
  renameList: (listId: string, newName: string) => boolean;
  selectList: (listId: string) => void;
  clearCurrentList: () => void;

  // Item Management
  addItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => string;
  removeItem: (itemId: string) => boolean;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => boolean;
  toggleItem: (itemId: string) => boolean;
  checkAll: () => void;
  uncheckAll: () => void;
  removeChecked: () => void;
  clearList: () => void;

  // Bulk Operations
  addItems: (items: Omit<ShoppingItem, 'id' | 'checked'>[]) => void;
  addFromIngredients: (ingredients: Ingredient[], recipeSource?: string, scaleFactor?: number) => void;

  // Getters
  getItemsByCategory: () => Record<string, ShoppingItem[]>;
  getCheckedItems: () => ShoppingItem[];
  getUncheckedItems: () => ShoppingItem[];
  getProgress: () => { total: number; checked: number; percentage: number };

  // Categories
  categories: string[];
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;

  // Combined Operations
  createListWithIngredients: (name: string, ingredients: Ingredient[], recipeSource?: string) => string;

  // Export
  exportToText: () => string;
  exportToMarkdown: () => string;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kochplan_shopping_lists';
const CATEGORIES_KEY = 'kochplan_shopping_categories';

const DEFAULT_CATEGORIES = [
  'Obst & Gemüse',
  'Fleisch & Fisch',
  'Milch & Eier',
  'Brot & Gebäck',
  'Getreide & Nudeln',
  'Konserven & Saucen',
  'Gewürze & Kräuter',
  'Getränke',
  'Süßwaren & Snacks',
  'Tiefkühl',
  'Haushalt',
  'Sonstiges',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generiert eine eindeutige ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Lädt Listen aus dem LocalStorage
 */
const loadListsFromStorage = (): ShoppingList[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((list: ShoppingList) => ({
      ...list,
      createdAt: new Date(list.createdAt),
      updatedAt: new Date(list.updatedAt),
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Einkaufslisten:', error);
    return [];
  }
};

/**
 * Speichert Listen im LocalStorage
 */
const saveListsToStorage = (lists: ShoppingList[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Fehler beim Speichern der Einkaufslisten:', error);
  }
};

/**
 * Lädt Kategorien aus dem LocalStorage
 */
const loadCategoriesFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (!stored) return DEFAULT_CATEGORIES;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Fehler beim Laden der Kategorien:', error);
    return DEFAULT_CATEGORIES;
  }
};

/**
 * Speichert Kategorien im LocalStorage
 */
const saveCategoriesToStorage = (categories: string[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Fehler beim Speichern der Kategorien:', error);
  }
};

/**
 * Formatiert eine Menge für die Anzeige
 */
const formatAmount = (amount: number): string => {
  if (amount === 0) return '';
  if (amount === Math.floor(amount)) return amount.toString();
  return amount.toFixed(2).replace(/\.?0+$/, '');
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zur Verwaltung von Einkaufslisten
 * Unterstützt mehrere Listen, Kategorien, Häkchen und Import von Zutaten
 *
 * @example
 * ```tsx
 * const {
 *   currentList,
 *   addItem,
 *   toggleItem,
 *   getProgress,
 *   addFromIngredients
 * } = useShoppingList();
 *
 * addFromIngredients(recipe.ingredients, recipe.title);
 * ```
 */
export function useShoppingList(): UseShoppingListReturn {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial laden
  useEffect(() => {
    const loadedLists = loadListsFromStorage();
    const loadedCategories = loadCategoriesFromStorage();
    setLists(loadedLists);
    setCategories(loadedCategories);
    setIsLoading(false);
  }, []);

  // Speichern bei Änderungen
  useEffect(() => {
    if (!isLoading) {
      saveListsToStorage(lists);
    }
  }, [lists, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      saveCategoriesToStorage(categories);
    }
  }, [categories, isLoading]);

  // Aktuelle Liste
  const currentList = useMemo(() => {
    if (!currentListId) return null;
    return lists.find((l) => l.id === currentListId) || null;
  }, [lists, currentListId]);

  /**
   * Erstellt eine neue Liste
   */
  const createList = useCallback((name: string): string => {
    const id = generateId();
    const newList: ShoppingList = {
      id,
      name,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLists((prev) => [...prev, newList]);
    setCurrentListId(id);
    return id;
  }, []);

  /**
   * Löscht eine Liste
   */
  const deleteList = useCallback((listId: string): boolean => {
    let deleted = false;

    setLists((prev) => {
      const exists = prev.some((l) => l.id === listId);
      deleted = exists;
      return prev.filter((l) => l.id !== listId);
    });

    if (currentListId === listId) {
      setCurrentListId(null);
    }

    return deleted;
  }, [currentListId]);

  /**
   * Benennt eine Liste um
   */
  const renameList = useCallback((listId: string, newName: string): boolean => {
    let renamed = false;

    setLists((prev) => {
      const index = prev.findIndex((l) => l.id === listId);
      if (index === -1) return prev;

      renamed = true;
      const newLists = [...prev];
      newLists[index] = {
        ...newLists[index],
        name: newName,
        updatedAt: new Date(),
      };
      return newLists;
    });

    return renamed;
  }, []);

  /**
   * Wählt eine Liste aus
   */
  const selectList = useCallback((listId: string): void => {
    setCurrentListId(listId);
  }, []);

  /**
   * Deselektiert die aktuelle Liste
   */
  const clearCurrentList = useCallback((): void => {
    setCurrentListId(null);
  }, []);

  /**
   * Fügt ein Item zur aktuellen Liste hinzu
   */
  const addItem = useCallback(
    (item: Omit<ShoppingItem, 'id' | 'checked'>): string => {
      if (!currentListId) {
        console.warn('Keine Liste ausgewählt');
        return '';
      }

      const id = generateId();

      setLists((prev) => {
        const index = prev.findIndex((l) => l.id === currentListId);
        if (index === -1) return prev;

        const newItem: ShoppingItem = {
          ...item,
          id,
          checked: false,
        };

        const newLists = [...prev];
        newLists[index] = {
          ...newLists[index],
          items: [...newLists[index].items, newItem],
          updatedAt: new Date(),
        };
        return newLists;
      });

      return id;
    },
    [currentListId]
  );

  /**
   * Entfernt ein Item
   */
  const removeItem = useCallback((itemId: string): boolean => {
    if (!currentListId) return false;

    let removed = false;

    setLists((prev) => {
      const listIndex = prev.findIndex((l) => l.id === currentListId);
      if (listIndex === -1) return prev;

      const list = prev[listIndex];
      const itemExists = list.items.some((i) => i.id === itemId);
      removed = itemExists;

      const newLists = [...prev];
      newLists[listIndex] = {
        ...list,
        items: list.items.filter((i) => i.id !== itemId),
        updatedAt: new Date(),
      };
      return newLists;
    });

    return removed;
  }, [currentListId]);

  /**
   * Aktualisiert ein Item
   */
  const updateItem = useCallback(
    (itemId: string, updates: Partial<ShoppingItem>): boolean => {
      if (!currentListId) return false;

      let updated = false;

      setLists((prev) => {
        const listIndex = prev.findIndex((l) => l.id === currentListId);
        if (listIndex === -1) return prev;

        const list = prev[listIndex];
        const itemIndex = list.items.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) return prev;

        updated = true;
        const newItems = [...list.items];
        newItems[itemIndex] = { ...newItems[itemIndex], ...updates };

        const newLists = [...prev];
        newLists[listIndex] = {
          ...list,
          items: newItems,
          updatedAt: new Date(),
        };
        return newLists;
      });

      return updated;
    },
    [currentListId]
  );

  /**
   * Toggelt den Haken-Status eines Items
   */
  const toggleItem = useCallback(
    (itemId: string): boolean => {
      if (!currentListId) return false;

      let toggled = false;

      setLists((prev) => {
        const listIndex = prev.findIndex((l) => l.id === currentListId);
        if (listIndex === -1) return prev;

        const list = prev[listIndex];
        const itemIndex = list.items.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) return prev;

        toggled = true;
        const newItems = [...list.items];
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          checked: !newItems[itemIndex].checked,
        };

        const newLists = [...prev];
        newLists[listIndex] = {
          ...list,
          items: newItems,
          updatedAt: new Date(),
        };
        return newLists;
      });

      return toggled;
    },
    [currentListId]
  );

  /**
   * Hakt alle Items ab
   */
  const checkAll = useCallback((): void => {
    if (!currentListId) return;

    setLists((prev) => {
      const listIndex = prev.findIndex((l) => l.id === currentListId);
      if (listIndex === -1) return prev;

      const list = prev[listIndex];
      const newLists = [...prev];
      newLists[listIndex] = {
        ...list,
        items: list.items.map((i) => ({ ...i, checked: true })),
        updatedAt: new Date(),
      };
      return newLists;
    });
  }, [currentListId]);

  /**
   * Entfernt alle Haken
   */
  const uncheckAll = useCallback((): void => {
    if (!currentListId) return;

    setLists((prev) => {
      const listIndex = prev.findIndex((l) => l.id === currentListId);
      if (listIndex === -1) return prev;

      const list = prev[listIndex];
      const newLists = [...prev];
      newLists[listIndex] = {
        ...list,
        items: list.items.map((i) => ({ ...i, checked: false })),
        updatedAt: new Date(),
      };
      return newLists;
    });
  }, [currentListId]);

  /**
   * Entfernt alle abgehakten Items
   */
  const removeChecked = useCallback((): void => {
    if (!currentListId) return;

    setLists((prev) => {
      const listIndex = prev.findIndex((l) => l.id === currentListId);
      if (listIndex === -1) return prev;

      const list = prev[listIndex];
      const newLists = [...prev];
      newLists[listIndex] = {
        ...list,
        items: list.items.filter((i) => !i.checked),
        updatedAt: new Date(),
      };
      return newLists;
    });
  }, [currentListId]);

  /**
   * Leert die aktuelle Liste
   */
  const clearList = useCallback((): void => {
    if (!currentListId) return;

    setLists((prev) => {
      const listIndex = prev.findIndex((l) => l.id === currentListId);
      if (listIndex === -1) return prev;

      const newLists = [...prev];
      newLists[listIndex] = {
        ...newLists[listIndex],
        items: [],
        updatedAt: new Date(),
      };
      return newLists;
    });
  }, [currentListId]);

  /**
   * Fügt mehrere Items hinzu
   */
  const addItems = useCallback(
    (items: Omit<ShoppingItem, 'id' | 'checked'>[]): void => {
      if (!currentListId) return;

      setLists((prev) => {
        const listIndex = prev.findIndex((l) => l.id === currentListId);
        if (listIndex === -1) return prev;

        const newItems: ShoppingItem[] = items.map((item) => ({
          ...item,
          id: generateId(),
          checked: false,
        }));

        const newLists = [...prev];
        newLists[listIndex] = {
          ...newLists[listIndex],
          items: [...newLists[listIndex].items, ...newItems],
          updatedAt: new Date(),
        };
        return newLists;
      });
    },
    [currentListId]
  );

  /**
   * Fügt Zutaten aus einem Rezept hinzu
   */
  const addFromIngredients = useCallback(
    (
      ingredients: Ingredient[],
      recipeSource?: string,
      scaleFactor: number = 1
    ): void => {
      if (!currentListId) return;

      const items: Omit<ShoppingItem, 'id' | 'checked'>[] = ingredients.map(
        (ing) => ({
          name: ing.name,
          amount: ing.amount * scaleFactor,
          unit: ing.unit,
          category: ing.category || 'Sonstiges',
          recipeSource,
        })
      );

      addItems(items);
    },
    [currentListId, addItems]
  );

  /**
   * Erstellt eine neue Liste und fügt sofort Zutaten hinzu (verhindert Race Condition)
   */
  const createListWithIngredients = useCallback(
    (name: string, ingredients: Ingredient[], recipeSource?: string): string => {
      const id = generateId();
      const items: ShoppingItem[] = ingredients.map((ing) => ({
        id: generateId(),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category || 'Sonstiges',
        checked: false,
        recipeSource,
      }));

      const newList: ShoppingList = {
        id,
        name,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setLists((prev) => [...prev, newList]);
      setCurrentListId(id);
      return id;
    },
    []
  );

  /**
   * Gibt Items nach Kategorie gruppiert zurück
   */
  const getItemsByCategory = useCallback((): Record<string, ShoppingItem[]> => {
    if (!currentList) return {};

    const grouped: Record<string, ShoppingItem[]> = {};

    currentList.items.forEach((item) => {
      const cat = item.category || 'Sonstiges';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    // Sortiere Kategorien
    const sorted: Record<string, ShoppingItem[]> = {};
    categories.forEach((cat) => {
      if (grouped[cat]) {
        sorted[cat] = grouped[cat];
      }
    });

    // Füge nicht kategorisierte Items hinzu
    Object.keys(grouped).forEach((cat) => {
      if (!sorted[cat]) {
        sorted[cat] = grouped[cat];
      }
    });

    return sorted;
  }, [currentList, categories]);

  /**
   * Gibt abgehakte Items zurück
   */
  const getCheckedItems = useCallback((): ShoppingItem[] => {
    if (!currentList) return [];
    return currentList.items.filter((i) => i.checked);
  }, [currentList]);

  /**
   * Gibt nicht abgehakte Items zurück
   */
  const getUncheckedItems = useCallback((): ShoppingItem[] => {
    if (!currentList) return [];
    return currentList.items.filter((i) => !i.checked);
  }, [currentList]);

  /**
   * Berechnet den Fortschritt
   */
  const getProgress = useCallback(() => {
    if (!currentList) {
      return { total: 0, checked: 0, percentage: 0 };
    }

    const total = currentList.items.length;
    const checked = currentList.items.filter((i) => i.checked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, checked, percentage };
  }, [currentList]);

  /**
   * Fügt eine Kategorie hinzu
   */
  const addCategory = useCallback((category: string): void => {
    setCategories((prev) => {
      if (prev.includes(category)) return prev;
      return [...prev, category];
    });
  }, []);

  /**
   * Entfernt eine Kategorie
   */
  const removeCategory = useCallback((category: string): void => {
    setCategories((prev) => prev.filter((c) => c !== category));
  }, []);

  /**
   * Exportiert die Liste als Text
   */
  const exportToText = useCallback((): string => {
    if (!currentList) return '';

    const lines: string[] = [`Einkaufsliste: ${currentList.name}`, ''];

    const grouped = getItemsByCategory();
    Object.entries(grouped).forEach(([category, items]) => {
      lines.push(`[${category}]`);
      items.forEach((item) => {
        const check = item.checked ? '[x]' : '[ ]';
        const amount = formatAmount(item.amount);
        const unit = item.unit || '';
        lines.push(`  ${check} ${amount} ${unit} ${item.name}`.trim());
      });
      lines.push('');
    });

    return lines.join('\n');
  }, [currentList, getItemsByCategory]);

  /**
   * Exportiert die Liste als Markdown
   */
  const exportToMarkdown = useCallback((): string => {
    if (!currentList) return '';

    const lines: string[] = [`# Einkaufsliste: ${currentList.name}`, ''];

    const grouped = getItemsByCategory();
    Object.entries(grouped).forEach(([category, items]) => {
      lines.push(`## ${category}`);
      lines.push('');
      items.forEach((item) => {
        const check = item.checked ? '- [x]' : '- [ ]';
        const amount = formatAmount(item.amount);
        const unit = item.unit || '';
        lines.push(`${check} ${amount} ${unit} ${item.name}`.trim());
      });
      lines.push('');
    });

    return lines.join('\n');
  }, [currentList, getItemsByCategory]);

  return {
    lists,
    currentList,
    isLoading,
    createList,
    deleteList,
    renameList,
    selectList,
    clearCurrentList,
    addItem,
    removeItem,
    updateItem,
    toggleItem,
    checkAll,
    uncheckAll,
    removeChecked,
    clearList,
    addItems,
    addFromIngredients,
    createListWithIngredients,
    getItemsByCategory,
    getCheckedItems,
    getUncheckedItems,
    getProgress,
    categories,
    addCategory,
    removeCategory,
    exportToText,
    exportToMarkdown,
  };
}

export default useShoppingList;
