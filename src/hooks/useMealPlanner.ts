import { useState, useEffect, useCallback, useMemo } from 'react';
import { Recipe, Ingredient } from './useRecipes';

// ============================================================================
// Types
// ============================================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string;
  recipeId: string;
  recipe: Recipe;
  day: DayOfWeek;
  mealType: MealType;
  servings: number;
  notes?: string;
}

export interface WeeklyPlan {
  weekStart: Date;
  meals: PlannedMeal[];
}

export interface UseMealPlannerReturn {
  // State
  currentWeek: Date;
  plannedMeals: PlannedMeal[];
  isLoading: boolean;

  // Week Navigation
  previousWeek: () => void;
  nextWeek: () => void;
  goToCurrentWeek: () => void;
  goToWeek: (date: Date) => void;

  // Meal Planning
  addMeal: (recipe: Recipe, day: DayOfWeek, mealType: MealType, servings?: number, notes?: string) => string;
  removeMeal: (mealId: string) => boolean;
  updateMeal: (mealId: string, updates: Partial<Omit<PlannedMeal, 'id' | 'recipe'>>) => boolean;
  moveMeal: (mealId: string, newDay: DayOfWeek, newMealType?: MealType) => boolean;

  // Getters
  getMealsForDay: (day: DayOfWeek) => PlannedMeal[];
  getMealForSlot: (day: DayOfWeek, mealType: MealType) => PlannedMeal | undefined;
  getWeekDates: () => Date[];

  // Shopping List Generation
  generateShoppingList: () => Ingredient[];

  // Statistics
  getWeeklyStats: () => WeeklyStats;

  // Clear & Copy
  clearWeek: () => void;
  clearDay: (day: DayOfWeek) => void;
  copyWeekTo: (targetWeekStart: Date) => void;
}

export interface WeeklyStats {
  totalMeals: number;
  totalServings: number;
  estimatedPrepTime: number;
  estimatedCookTime: number;
  uniqueRecipes: number;
  categories: Record<string, number>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kochplan_meal_planner';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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
 * Gibt den Montag der aktuellen Woche zurück
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

/**
 * Formatiert ein Datum als Key für LocalStorage
 */
const formatWeekKey = (date: Date): string => {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split('T')[0];
};

/**
 * Lädt den Wochenplan aus dem LocalStorage
 */
const loadWeekPlan = (weekStart: Date): PlannedMeal[] => {
  try {
    const key = `${STORAGE_KEY}_${formatWeekKey(weekStart)}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((meal: PlannedMeal) => ({
      ...meal,
      recipe: {
        ...meal.recipe,
        createdAt: new Date(meal.recipe.createdAt),
        updatedAt: new Date(meal.recipe.updatedAt),
      },
    }));
  } catch (error) {
    console.error('Fehler beim Laden des Wochenplans:', error);
    return [];
  }
};

/**
 * Speichert den Wochenplan im LocalStorage
 */
const saveWeekPlan = (weekStart: Date, meals: PlannedMeal[]): void => {
  try {
    const key = `${STORAGE_KEY}_${formatWeekKey(weekStart)}`;
    localStorage.setItem(key, JSON.stringify(meals));
  } catch (error) {
    console.error('Fehler beim Speichern des Wochenplans:', error);
  }
};

/**
 * Gibt den deutschen Namen eines Wochentags zurück
 */
export const getDayName = (day: DayOfWeek): string => {
  const names: Record<DayOfWeek, string> = {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  };
  return names[day];
};

/**
 * Gibt den deutschen Namen einer Mahlzeit zurück
 */
export const getMealTypeName = (mealType: MealType): string => {
  const names: Record<MealType, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
  };
  return names[mealType];
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zur Verwaltung des Wochenplans
 * Ermöglicht das Planen von Mahlzeiten für die Woche und Generierung von Einkaufslisten
 *
 * @example
 * ```tsx
 * const {
 *   currentWeek,
 *   plannedMeals,
 *   addMeal,
 *   removeMeal,
 *   generateShoppingList
 * } = useMealPlanner();
 *
 * addMeal(recipe, 'monday', 'dinner', 4);
 * ```
 */
export function useMealPlanner(): UseMealPlannerReturn {
  const [currentWeek, setCurrentWeek] = useState<Date>(() => getWeekStart(new Date()));
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lade den Plan für die aktuelle Woche
  useEffect(() => {
    setIsLoading(true);
    const loaded = loadWeekPlan(currentWeek);
    setPlannedMeals(loaded);
    setIsLoading(false);
  }, [currentWeek]);

  // Speichere bei Änderungen
  useEffect(() => {
    if (!isLoading) {
      saveWeekPlan(currentWeek, plannedMeals);
    }
  }, [plannedMeals, currentWeek, isLoading]);

  // Navigation
  const previousWeek = useCallback((): void => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const nextWeek = useCallback((): void => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToCurrentWeek = useCallback((): void => {
    setCurrentWeek(getWeekStart(new Date()));
  }, []);

  const goToWeek = useCallback((date: Date): void => {
    setCurrentWeek(getWeekStart(date));
  }, []);

  /**
   * Fügt eine Mahlzeit zum Plan hinzu
   */
  const addMeal = useCallback(
    (
      recipe: Recipe,
      day: DayOfWeek,
      mealType: MealType,
      servings: number = recipe.servings,
      notes?: string
    ): string => {
      const id = generateId();

      setPlannedMeals((prev) => {
        // Entferne existierende Mahlzeit am gleichen Slot
        const filtered = prev.filter(
          (m) => !(m.day === day && m.mealType === mealType)
        );

        const newMeal: PlannedMeal = {
          id,
          recipeId: recipe.id,
          recipe,
          day,
          mealType,
          servings,
          notes,
        };

        return [...filtered, newMeal];
      });

      return id;
    },
    []
  );

  /**
   * Entfernt eine Mahlzeit
   */
  const removeMeal = useCallback((mealId: string): boolean => {
    let removed = false;

    setPlannedMeals((prev) => {
      const exists = prev.some((m) => m.id === mealId);
      removed = exists;
      return prev.filter((m) => m.id !== mealId);
    });

    return removed;
  }, []);

  /**
   * Aktualisiert eine Mahlzeit
   */
  const updateMeal = useCallback(
    (mealId: string, updates: Partial<Omit<PlannedMeal, 'id' | 'recipe'>>): boolean => {
      let updated = false;

      setPlannedMeals((prev) => {
        const index = prev.findIndex((m) => m.id === mealId);
        if (index === -1) return prev;

        updated = true;
        const newMeals = [...prev];
        newMeals[index] = { ...newMeals[index], ...updates };
        return newMeals;
      });

      return updated;
    },
    []
  );

  /**
   * Verschiebt eine Mahlzeit
   */
  const moveMeal = useCallback(
    (mealId: string, newDay: DayOfWeek, newMealType?: MealType): boolean => {
      let moved = false;

      setPlannedMeals((prev) => {
        const meal = prev.find((m) => m.id === mealId);
        if (!meal) return prev;

        moved = true;
        const targetMealType = newMealType || meal.mealType;

        // Entferne existierende Mahlzeit am Ziel-Slot
        const filtered = prev.filter(
          (m) => !(m.day === newDay && m.mealType === targetMealType) && m.id !== mealId
        );

        return [
          ...filtered,
          {
            ...meal,
            day: newDay,
            mealType: targetMealType,
          },
        ];
      });

      return moved;
    },
    []
  );

  /**
   * Gibt alle Mahlzeiten für einen Tag zurück
   */
  const getMealsForDay = useCallback(
    (day: DayOfWeek): PlannedMeal[] => {
      return plannedMeals
        .filter((m) => m.day === day)
        .sort((a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType));
    },
    [plannedMeals]
  );

  /**
   * Gibt die Mahlzeit für einen bestimmten Slot zurück
   */
  const getMealForSlot = useCallback(
    (day: DayOfWeek, mealType: MealType): PlannedMeal | undefined => {
      return plannedMeals.find((m) => m.day === day && m.mealType === mealType);
    },
    [plannedMeals]
  );

  /**
   * Gibt alle Daten der aktuellen Woche zurück
   */
  const getWeekDates = useCallback((): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeek]);

  /**
   * Generiert eine Einkaufsliste aus dem Wochenplan
   */
  const generateShoppingList = useCallback((): Ingredient[] => {
    const ingredientMap = new Map<string, Ingredient>();

    plannedMeals.forEach((meal) => {
      const scaleFactor = meal.servings / meal.recipe.servings;

      meal.recipe.ingredients.forEach((ing) => {
        const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
        const scaledAmount = ing.amount * scaleFactor;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.amount += scaledAmount;
        } else {
          ingredientMap.set(key, {
            ...ing,
            amount: scaledAmount,
          });
        }
      });
    });

    return Array.from(ingredientMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [plannedMeals]);

  /**
   * Berechnet Statistiken für die Woche
   */
  const getWeeklyStats = useCallback((): WeeklyStats => {
    const uniqueRecipeIds = new Set(plannedMeals.map((m) => m.recipeId));
    const categories: Record<string, number> = {};

    plannedMeals.forEach((meal) => {
      const cat = meal.recipe.category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      totalMeals: plannedMeals.length,
      totalServings: plannedMeals.reduce((sum, m) => sum + m.servings, 0),
      estimatedPrepTime: plannedMeals.reduce((sum, m) => sum + m.recipe.prepTime, 0),
      estimatedCookTime: plannedMeals.reduce((sum, m) => sum + m.recipe.cookTime, 0),
      uniqueRecipes: uniqueRecipeIds.size,
      categories,
    };
  }, [plannedMeals]);

  /**
   * Kopiert den aktuellen Wochenplan in eine andere Woche
   */
  const copyWeekTo = useCallback((targetWeekStart: Date): void => {
    if (plannedMeals.length === 0) return;

    const copiedMeals = plannedMeals.map(meal => ({
      ...meal,
      id: generateId(),
    }));

    saveWeekPlan(targetWeekStart, copiedMeals);
  }, [plannedMeals]);

  /**
   * Löscht den gesamten Wochenplan
   */
  const clearWeek = useCallback((): void => {
    setPlannedMeals([]);
  }, []);

  /**
   * Löscht alle Mahlzeiten eines Tages
   */
  const clearDay = useCallback((day: DayOfWeek): void => {
    setPlannedMeals((prev) => prev.filter((m) => m.day !== day));
  }, []);

  return {
    currentWeek,
    plannedMeals,
    isLoading,
    previousWeek,
    nextWeek,
    goToCurrentWeek,
    goToWeek,
    addMeal,
    removeMeal,
    updateMeal,
    moveMeal,
    getMealsForDay,
    getMealForSlot,
    getWeekDates,
    generateShoppingList,
    getWeeklyStats,
    clearWeek,
    clearDay,
    copyWeekTo,
  };
}

export default useMealPlanner;
