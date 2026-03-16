import { useState, useCallback, useMemo } from 'react';
import { Recipe, Ingredient } from './useRecipes';

// ============================================================================
// Types
// ============================================================================

export interface ScaledIngredient extends Ingredient {
  originalAmount: number;
  scaledAmount: number;
}

export interface UseServingsScaleReturn {
  // State
  originalServings: number;
  targetServings: number;
  scaleFactor: number;

  // Actions
  setTargetServings: (servings: number) => void;
  increaseServings: (amount?: number) => void;
  decreaseServings: (amount?: number) => void;
  resetServings: () => void;

  // Scaled Data
  scaledIngredients: ScaledIngredient[];
  scaledRecipe: Recipe | null;

  // Helpers
  scaleAmount: (amount: number) => number;
  formatAmount: (amount: number) => string;
  formatScaledIngredient: (ingredient: Ingredient) => string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Rundet eine Menge sinnvoll
 * - Kleine Mengen (< 1): 2 Dezimalstellen
 * - Mittlere Mengen (1-10): 1 Dezimalstelle
 * - Große Mengen (> 10): Ganzzahl
 */
const roundAmount = (amount: number): number => {
  if (amount < 0.1) {
    return Math.round(amount * 100) / 100;
  } else if (amount < 1) {
    return Math.round(amount * 10) / 10;
  } else if (amount <= 10) {
    return Math.round(amount * 2) / 2; // 0.5 Schritte
  } else {
    return Math.round(amount);
  }
};

/**
 * Formatiert eine Menge für die Anzeige
 */
const formatAmountForDisplay = (amount: number): string => {
  const rounded = roundAmount(amount);

  // Ganzzahlen ohne Dezimalstellen
  if (rounded === Math.floor(rounded)) {
    return rounded.toString();
  }

  // 0.5 als ½ anzeigen
  if (rounded === 0.5) return '½';
  if (rounded === 1.5) return '1½';
  if (rounded === 2.5) return '2½';

  // Sonst mit Komma
  return rounded.toString().replace('.', ',');
};

/**
 * Konvertiert eine Zahl in einen Bruch-String
 */
const toFraction = (amount: number): string => {
  const commonFractions: Record<number, string> = {
    0.25: '¼',
    0.33: '⅓',
    0.5: '½',
    0.67: '⅔',
    0.75: '¾',
    1.25: '1¼',
    1.33: '1⅓',
    1.5: '1½',
    1.67: '1⅔',
    1.75: '1¾',
    2.25: '2¼',
    2.5: '2½',
    2.75: '2¾',
  };

  // Finde nächste passende Fraktion
  let closest = amount;
  let closestDiff = Infinity;

  for (const [key, value] of Object.entries(commonFractions)) {
    const diff = Math.abs(amount - parseFloat(key));
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = parseFloat(key);
    }
  }

  // Wenn sehr nah an einer Fraktion, verwende diese
  if (closestDiff < 0.05) {
    return commonFractions[closest] || formatAmountForDisplay(amount);
  }

  return formatAmountForDisplay(amount);
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zur Umrechnung von Rezept-Portionen
 * Skaliert Zutatenmengen basierend auf der gewünschten Portionenzahl
 *
 * @example
 * ```tsx
 * const { targetServings, setTargetServings, scaledIngredients, formatScaledIngredient } = useServingsScale(recipe);
 *
 * <input
 *   type="number"
 *   value={targetServings}
 *   onChange={(e) => setTargetServings(Number(e.target.value))}
 * />
 *
 * {scaledIngredients.map(ing => (
 *   <div>{formatScaledIngredient(ing)}</div>
 * ))}
 * ```
 */
export function useServingsScale(recipe: Recipe | null): UseServingsScaleReturn {
  const originalServings = recipe?.servings || 4;
  const [targetServings, setTargetServingsState] = useState<number>(originalServings);

  // Berechne Skalierungsfaktor
  const scaleFactor = useMemo(() => {
    if (!recipe || originalServings === 0) return 1;
    return targetServings / originalServings;
  }, [recipe, targetServings, originalServings]);

  // Skalierte Zutaten
  const scaledIngredients = useMemo((): ScaledIngredient[] => {
    if (!recipe) return [];

    return recipe.ingredients.map((ing) => ({
      ...ing,
      originalAmount: ing.amount,
      scaledAmount: roundAmount(ing.amount * scaleFactor),
    }));
  }, [recipe, scaleFactor]);

  // Skaliertes Rezept
  const scaledRecipe = useMemo((): Recipe | null => {
    if (!recipe) return null;

    return {
      ...recipe,
      servings: targetServings,
      ingredients: scaledIngredients,
    };
  }, [recipe, targetServings, scaledIngredients]);

  /**
   * Setzt die Ziel-Portionen
   */
  const setTargetServings = useCallback((servings: number): void => {
    // Mindestens 1 Portion
    setTargetServingsState(Math.max(1, Math.round(servings)));
  }, []);

  /**
   * Erhöht die Portionen
   */
  const increaseServings = useCallback((amount: number = 1): void => {
    setTargetServingsState((prev) => prev + amount);
  }, []);

  /**
   * Verringert die Portionen
   */
  const decreaseServings = useCallback((amount: number = 1): void => {
    setTargetServingsState((prev) => Math.max(1, prev - amount));
  }, []);

  /**
   * Setzt auf Original-Portionen zurück
   */
  const resetServings = useCallback((): void => {
    setTargetServingsState(originalServings);
  }, [originalServings]);

  /**
   * Skaliert eine beliebige Menge
   */
  const scaleAmount = useCallback(
    (amount: number): number => {
      return roundAmount(amount * scaleFactor);
    },
    [scaleFactor]
  );

  /**
   * Formatiert eine Menge für die Anzeige
   */
  const formatAmount = useCallback((amount: number): string => {
    return formatAmountForDisplay(amount);
  }, []);

  /**
   * Formatiert eine skalierte Zutat als String
   */
  const formatScaledIngredient = useCallback(
    (ingredient: Ingredient): string => {
      const scaledAmount = scaleAmount(ingredient.amount);
      const formattedAmount = formatAmountForDisplay(scaledAmount);
      const unit = ingredient.unit || '';
      const name = ingredient.name;

      return `${formattedAmount} ${unit} ${name}`.trim();
    },
    [scaleAmount]
  );

  // Reset wenn sich das Rezept ändert
  // Dies geschieht durch die Dependency auf recipe.servings im originalServings

  return {
    originalServings,
    targetServings,
    scaleFactor,
    setTargetServings,
    increaseServings,
    decreaseServings,
    resetServings,
    scaledIngredients,
    scaledRecipe,
    scaleAmount,
    formatAmount,
    formatScaledIngredient,
  };
}

export default useServingsScale;
