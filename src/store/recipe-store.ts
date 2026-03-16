import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Filter-Types
export type RecipeCategory = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'drink';
export type DietType = 'all' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'keto';
export type TimeFilter = 'all' | 'under-15' | 'under-30' | 'under-60' | 'over-60';
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
export type SortOption = 'newest' | 'rating' | 'time' | 'alpha';
export type ViewMode = 'grid' | 'list';

// Interface für Filter-Objekt
export interface RecipeFilters {
  category: RecipeCategory;
  diet: DietType;
  time: TimeFilter;
  difficulty: DifficultyFilter;
}

// Interface für RecipeState
export interface RecipeState {
  // Filter-States
  filters: RecipeFilters;
  sortBy: SortOption;
  searchQuery: string;
  viewMode: ViewMode;
  selectedCollection: string | null;

  // Actions
  setFilter: <K extends keyof RecipeFilters>(
    key: K,
    value: RecipeFilters[K]
  ) => void;
  setFilters: (filters: Partial<RecipeFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortOption) => void;
  setSearch: (query: string) => void;
  clearSearch: () => void;
  setViewMode: (mode: ViewMode) => void;
  setCollection: (collectionId: string | null) => void;
}

// Default Filter-Werte
const defaultFilters: RecipeFilters = {
  category: 'all',
  diet: 'all',
  time: 'all',
  difficulty: 'all',
};

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      // Initial State
      filters: { ...defaultFilters },
      sortBy: 'newest',
      searchQuery: '',
      viewMode: 'grid',
      selectedCollection: null,

      // Actions
      setFilter: (key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        })),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...newFilters,
          },
        })),

      resetFilters: () =>
        set({
          filters: { ...defaultFilters },
        }),

      setSort: (sort) =>
        set({
          sortBy: sort,
        }),

      setSearch: (query) =>
        set({
          searchQuery: query,
        }),

      clearSearch: () =>
        set({
          searchQuery: '',
        }),

      setViewMode: (mode) =>
        set({
          viewMode: mode,
        }),

      setCollection: (collectionId) =>
        set({
          selectedCollection: collectionId,
        }),
    }),
    {
      name: 'kochplan-recipe-store',
      partialize: (state) => ({
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        filters: state.filters,
      }),
    }
  )
);

// Selector-Hooks für bessere Performance
export const useRecipeFilters = () => useRecipeStore((state) => state.filters);
export const useRecipeSortBy = () => useRecipeStore((state) => state.sortBy);
export const useRecipeSearchQuery = () => useRecipeStore((state) => state.searchQuery);
export const useRecipeViewMode = () => useRecipeStore((state) => state.viewMode);
export const useSelectedCollection = () => useRecipeStore((state) => state.selectedCollection);

// Hilfsfunktion zum Prüfen ob Filter aktiv sind
export const useHasActiveFilters = () =>
  useRecipeStore((state) =>
    Object.entries(state.filters).some(([key, value]) => {
      if (key === 'category') return value !== 'all';
      if (key === 'diet') return value !== 'all';
      if (key === 'time') return value !== 'all';
      if (key === 'difficulty') return value !== 'all';
      return false;
    })
  );
