import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  description: string;
  duration?: number; // in Minuten
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  servings: number;
  prepTime: number; // in Minuten
  cookTime: number; // in Minuten
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  notes?: string;
  source?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeFilter {
  search?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  onlyFavorites?: boolean;
}

export interface RecipeSort {
  field: 'title' | 'createdAt' | 'updatedAt' | 'prepTime' | 'cookTime';
  direction: 'asc' | 'desc';
}

export interface UseRecipesReturn {
  // State
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  getRecipeById: (id: string) => Recipe | undefined;

  // Filter & Search
  filteredRecipes: Recipe[];
  filter: RecipeFilter;
  setFilter: (filter: RecipeFilter) => void;
  clearFilter: () => void;

  // Sortierung
  sort: RecipeSort;
  setSort: (sort: RecipeSort) => void;

  // Favoriten
  toggleFavorite: (id: string) => Promise<boolean>;
  favoriteRecipes: Recipe[];

  // Tags & Kategorien
  allTags: string[];
  allCategories: string[];

  // Import
  importRecipe: (recipeData: Partial<Recipe>) => Promise<Recipe>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kochplan_recipes';

const DEFAULT_FILTER: RecipeFilter = {};

const DEFAULT_SORT: RecipeSort = {
  field: 'updatedAt',
  direction: 'desc',
};

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
 * Lädt Rezepte aus dem LocalStorage
 */
const loadRecipesFromStorage = (): Recipe[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((recipe: Recipe) => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt),
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Rezepte:', error);
    return [];
  }
};

/**
 * Speichert Rezepte im LocalStorage
 */
const saveRecipesToStorage = (recipes: Recipe[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (error) {
    console.error('Fehler beim Speichern der Rezepte:', error);
    throw new Error('Rezepte konnten nicht gespeichert werden');
  }
};

/**
 * Filtert Rezepte basierend auf den Filterkriterien
 */
const filterRecipes = (recipes: Recipe[], filter: RecipeFilter): Recipe[] => {
  return recipes.filter((recipe) => {
    // Textsuche
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchLower)) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Kategorie-Filter
    if (filter.category && recipe.category !== filter.category) {
      return false;
    }

    // Schwierigkeits-Filter
    if (filter.difficulty && recipe.difficulty !== filter.difficulty) {
      return false;
    }

    // Tag-Filter
    if (filter.tags && filter.tags.length > 0) {
      const hasAllTags = filter.tags.every((tag) => recipe.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // Zeit-Filter
    if (filter.maxPrepTime !== undefined && recipe.prepTime > filter.maxPrepTime) {
      return false;
    }

    if (filter.maxCookTime !== undefined && recipe.cookTime > filter.maxCookTime) {
      return false;
    }

    // Favoriten-Filter
    if (filter.onlyFavorites && !recipe.isFavorite) {
      return false;
    }

    return true;
  });
};

/**
 * Sortiert Rezepte
 */
const sortRecipes = (recipes: Recipe[], sort: RecipeSort): Recipe[] => {
  return [...recipes].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'prepTime':
        comparison = a.prepTime - b.prepTime;
        break;
      case 'cookTime':
        comparison = a.cookTime - b.cookTime;
        break;
      default:
        comparison = 0;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zur Verwaltung von Rezepten
 * Bietet CRUD-Operationen, Filter, Sortierung und Favoriten-Verwaltung
 *
 * @example
 * ```tsx
 * const {
 *   recipes,
 *   filteredRecipes,
 *   addRecipe,
 *   updateRecipe,
 *   deleteRecipe,
 *   setFilter
 * } = useRecipes();
 * ```
 */
export function useRecipes(): UseRecipesReturn {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<RecipeFilter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<RecipeSort>(DEFAULT_SORT);

  // Initial laden
  useEffect(() => {
    try {
      const loaded = loadRecipesFromStorage();
      setRecipes(loaded);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Rezepte');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Speichern bei Änderungen
  useEffect(() => {
    if (!isLoading) {
      try {
        saveRecipesToStorage(recipes);
      } catch (err) {
        setError('Fehler beim Speichern der Rezepte');
      }
    }
  }, [recipes, isLoading]);

  // Gefilterte und sortierte Rezepte
  const filteredRecipes = useMemo(() => {
    const filtered = filterRecipes(recipes, filter);
    return sortRecipes(filtered, sort);
  }, [recipes, filter, sort]);

  // Favoriten
  const favoriteRecipes = useMemo(() => {
    return recipes.filter((recipe) => recipe.isFavorite);
  }, [recipes]);

  // Alle Tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Alle Kategorien
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    recipes.forEach((recipe) => {
      categorySet.add(recipe.category);
    });
    return Array.from(categorySet).sort();
  }, [recipes]);

  /**
   * Fügt ein neues Rezept hinzu
   */
  const addRecipe = useCallback(
    async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> => {
      const newRecipe: Recipe = {
        ...recipeData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setRecipes((prev) => [...prev, newRecipe]);
      return newRecipe;
    },
    []
  );

  /**
   * Aktualisiert ein bestehendes Rezept
   */
  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>): Promise<Recipe | null> => {
      let updatedRecipe: Recipe | null = null;

      setRecipes((prev) => {
        const index = prev.findIndex((r) => r.id === id);
        if (index === -1) return prev;

        updatedRecipe = {
          ...prev[index],
          ...updates,
          updatedAt: new Date(),
        };

        const newRecipes = [...prev];
        newRecipes[index] = updatedRecipe;
        return newRecipes;
      });

      return updatedRecipe;
    },
    []
  );

  /**
   * Löscht ein Rezept
   */
  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    let deleted = false;

    setRecipes((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      if (index === -1) return prev;

      deleted = true;
      return prev.filter((r) => r.id !== id);
    });

    return deleted;
  }, []);

  /**
   * Holt ein Rezept anhand der ID
   */
  const getRecipeById = useCallback(
    (id: string): Recipe | undefined => {
      return recipes.find((r) => r.id === id);
    },
    [recipes]
  );

  /**
   * Setzt den Filter
   */
  const setFilter = useCallback((newFilter: RecipeFilter): void => {
    setFilterState(newFilter);
  }, []);

  /**
   * Löscht den Filter
   */
  const clearFilter = useCallback((): void => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  /**
   * Toggelt den Favoriten-Status eines Rezepts
   */
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    let success = false;

    setRecipes((prev) => {
      const index = prev.findIndex((r) => r.id === id);
      if (index === -1) return prev;

      success = true;
      const newRecipes = [...prev];
      newRecipes[index] = {
        ...newRecipes[index],
        isFavorite: !newRecipes[index].isFavorite,
        updatedAt: new Date(),
      };
      return newRecipes;
    });

    return success;
  }, []);

  /**
   * Importiert ein Rezept (z.B. von externer Quelle)
   */
  const importRecipe = useCallback(
    async (recipeData: Partial<Recipe>): Promise<Recipe> => {
      const newRecipe: Recipe = {
        id: generateId(),
        title: recipeData.title || 'Unbenanntes Rezept',
        description: recipeData.description || '',
        imageUrl: recipeData.imageUrl,
        servings: recipeData.servings || 4,
        prepTime: recipeData.prepTime || 0,
        cookTime: recipeData.cookTime || 0,
        difficulty: recipeData.difficulty || 'medium',
        category: recipeData.category || 'Sonstiges',
        tags: recipeData.tags || [],
        ingredients: recipeData.ingredients || [],
        steps: recipeData.steps || [],
        notes: recipeData.notes,
        source: recipeData.source,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setRecipes((prev) => [...prev, newRecipe]);
      return newRecipe;
    },
    []
  );

  return {
    recipes,
    isLoading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById,
    filteredRecipes,
    filter,
    setFilter,
    clearFilter,
    sort,
    setSort,
    toggleFavorite,
    favoriteRecipes,
    allTags,
    allCategories,
    importRecipe,
  };
}

export default useRecipes;
