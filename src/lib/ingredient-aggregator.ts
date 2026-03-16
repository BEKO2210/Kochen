/**
 * Ingredient Aggregator
 * Aggregates ingredients from multiple recipes for shopping list
 * Groups by supermarket sections and converts units
 */

import { Ingredient, ShoppingListItem } from '../types';
import { convertUnit, roundToDecimals } from './utils';

// Supermarket section order (typical German supermarket layout)
export const SUPERMARKET_SECTIONS = [
  'produce',      // Obst & Gemüse
  'bakery',       // Brot & Gebäck
  'dairy',        // Milchprodukte, Eier
  'meat',         // Fleisch, Wurst
  'seafood',      // Fisch
  'frozen',       // Tiefkühl
  'pantry',       // Grundnahrungsmittel, Konserven
  'beverages',    // Getränke
  'other',        // Sonstiges
] as const;

export type SupermarketSection = typeof SUPERMARKET_SECTIONS[number];

// German section names for display
export const SECTION_DISPLAY_NAMES: Record<SupermarketSection, string> = {
  produce: 'Obst & Gemüse',
  bakery: 'Brot & Gebäck',
  dairy: 'Milchprodukte & Eier',
  meat: 'Fleisch & Wurst',
  seafood: 'Fisch & Meeresfrüchte',
  frozen: 'Tiefkühl',
  pantry: 'Grundnahrungsmittel',
  beverages: 'Getränke',
  other: 'Sonstiges',
};

// Section icons/emojis
export const SECTION_ICONS: Record<SupermarketSection, string> = {
  produce: '🥬',
  bakery: '🥖',
  dairy: '🥛',
  meat: '🥩',
  seafood: '🐟',
  frozen: '🧊',
  pantry: '🥫',
  beverages: '🥤',
  other: '📦',
};

// Ingredient synonym mapping for consolidation
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'tomaten': ['tomate', 'cocktailtomaten', 'kirschtomaten', 'romatomaten'],
  'zwiebeln': ['zwiebel', 'schalotten', 'schalotte'],
  'knoblauch': ['knoblauchzehe', 'knoblauchzehen'],
  'karotten': ['karotte', 'möhren', 'möhre', 'mohrrüben', 'mohrrübe'],
  'kartoffeln': ['kartoffel', 'festkochende kartoffeln', 'mehligkochende kartoffeln'],
  'paprika': ['rote paprika', 'gelbe paprika', 'grüne paprika'],
  'mehl': ['weizenmehl', 'dinkelmehl', 'vollkornmehl', 'type 405', 'type 550'],
  'zucker': ['weißer zucker', 'raffinade', 'kristallzucker'],
  'öl': ['olivenöl', 'sonnenblumenöl', 'rapsöl', 'pflanzenöl'],
  'essig': ['balsamico', 'balsamicoessig', 'weinessig', 'apfelessig'],
  'brühe': ['gemüsebrühe', 'hühnerbrühe', 'rinderbrühe', 'brühpulver', 'brühwürfel'],
  'sahne': ['schlagsahne', 'crème fraîche', 'creme fraiche', 'schmand'],
  'käse': ['parmesan', 'gouda', 'emmentaler', 'cheddar', 'mozzarella', 'feta'],
  'nudeln': ['pasta', 'spaghetti', 'penne', 'fusilli', 'tagliatelle', 'farfalle'],
  'reis': ['basmatireis', 'jasminreis', 'vollkornreis'],
  'eier': ['ei', 'hühnereier'],
  'butter': ['margarine'],
  'milch': ['vollmilch', 'fettarme milch'],
};

// Build reverse mapping for quick lookup
const buildSynonymMap = (): Map<string, string> => {
  const map = new Map<string, string>();

  for (const [canonical, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    map.set(canonical, canonical);
    for (const synonym of synonyms) {
      map.set(synonym, canonical);
    }
  }

  return map;
};

const synonymMap = buildSynonymMap();

// Get canonical ingredient name
const getCanonicalName = (name: string): string => {
  const lowerName = name.toLowerCase().trim();
  return synonymMap.get(lowerName) || lowerName;
};

// Check if two ingredients can be merged
const canMergeIngredients = (a: Ingredient, b: Ingredient): boolean => {
  const nameA = getCanonicalName(a.name);
  const nameB = getCanonicalName(b.name);

  // Must have same canonical name
  if (nameA !== nameB) return false;

  // Must have compatible units or no units
  if (!a.unit && !b.unit) return true;
  if (a.unit === b.unit) return true;

  // Check if units are convertible
  if (a.unit && b.unit) {
    try {
      convertUnit(1, a.unit, b.unit);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

// Merge two ingredients
const mergeIngredients = (a: Ingredient, b: Ingredient): Ingredient => {
  // If one has no amount, use the other
  if (!a.amount) return { ...b, id: a.id };
  if (!b.amount) return a;

  // If same unit, just add
  if (a.unit === b.unit) {
    return {
      ...a,
      amount: roundToDecimals(a.amount + b.amount, 2),
    };
  }

  // Convert b to a's unit and add
  if (a.unit && b.unit) {
    try {
      const convertedAmount = convertUnit(b.amount, b.unit, a.unit);
      return {
        ...a,
        amount: roundToDecimals(a.amount + convertedAmount, 2),
      };
    } catch {
      // If conversion fails, keep both separate
      return a;
    }
  }

  return a;
};

// Aggregate ingredients from multiple sources
export interface AggregatedIngredient {
  id: string;
  name: string;
  amount: number;
  unit?: string;
  category: SupermarketSection;
  checked: boolean;
  originalIngredients: Ingredient[];
  displayAmount: string;
}

export interface AggregatedShoppingList {
  items: ShoppingListItem[];
  bySection: Record<SupermarketSection, ShoppingListItem[]>;
  totalCount: number;
  checkedCount: number;
}

// Convert ingredient to shopping list item
export const ingredientToShoppingItem = (
  ingredient: Ingredient,
  recipeId?: string,
  recipeName?: string
): ShoppingListItem => ({
  id: ingredient.id,
  name: ingredient.name,
  amount: ingredient.amount,
  unit: ingredient.unit,
  category: ingredient.category as SupermarketSection,
  checked: false,
  recipeId,
  recipeName,
});

// Aggregate multiple ingredients
export const aggregateIngredients = (
  ingredients: Ingredient[],
  recipeId?: string,
  recipeName?: string
): AggregatedIngredient[] => {
  const merged: Map<string, AggregatedIngredient> = new Map();

  for (const ingredient of ingredients) {
    const canonicalName = getCanonicalName(ingredient.name);
    const existing = merged.get(canonicalName);

    if (existing && canMergeIngredients(existing as Ingredient, ingredient)) {
      // Merge with existing
      const mergedIngredient = mergeIngredients(existing as Ingredient, ingredient);
      merged.set(canonicalName, {
        ...existing,
        amount: mergedIngredient.amount!,
        unit: mergedIngredient.unit,
        originalIngredients: [...existing.originalIngredients, ingredient],
        displayAmount: formatAmount(mergedIngredient.amount!, mergedIngredient.unit),
      });
    } else {
      // Create new entry
      merged.set(canonicalName, {
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount || 0,
        unit: ingredient.unit,
        category: (ingredient.category as SupermarketSection) || 'other',
        checked: false,
        originalIngredients: [ingredient],
        displayAmount: formatAmount(ingredient.amount, ingredient.unit),
      });
    }
  }

  return Array.from(merged.values());
};

// Format amount for display
const formatAmount = (amount?: number, unit?: string): string => {
  if (amount === undefined || amount === null) return '';

  // Format number
  let formattedAmount: string;
  if (amount === Math.floor(amount)) {
    formattedAmount = amount.toString();
  } else {
    formattedAmount = amount.toFixed(2).replace(/\.?0+$/, '');
  }

  if (unit) {
    return `${formattedAmount} ${unit}`;
  }

  return formattedAmount;
};

// Build shopping list from meal plan
export interface MealPlanEntry {
  recipeId: string;
  recipeName: string;
  servings: number;
  originalServings: number;
  ingredients: Ingredient[];
}

export const buildShoppingListFromMealPlan = (
  entries: MealPlanEntry[]
): AggregatedShoppingList => {
  const allItems: ShoppingListItem[] = [];

  for (const entry of entries) {
    const scaleFactor = entry.servings / entry.originalServings;

    for (const ingredient of entry.ingredients) {
      const scaledAmount = ingredient.amount
        ? roundToDecimals(ingredient.amount * scaleFactor, 2)
        : undefined;

      allItems.push({
        id: `${entry.recipeId}-${ingredient.id}`,
        name: ingredient.name,
        amount: scaledAmount,
        unit: ingredient.unit,
        category: (ingredient.category as SupermarketSection) || 'other',
        checked: false,
        recipeId: entry.recipeId,
        recipeName: entry.recipeName,
      });
    }
  }

  // Group by section
  const bySection: Record<SupermarketSection, ShoppingListItem[]> = {
    produce: [],
    bakery: [],
    dairy: [],
    meat: [],
    seafood: [],
    frozen: [],
    pantry: [],
    beverages: [],
    other: [],
  };

  for (const item of allItems) {
    const section = item.category || 'other';
    if (section in bySection) {
      bySection[section].push(item);
    } else {
      bySection.other.push(item);
    }
  }

  // Sort sections by supermarket order
  const sortedItems: ShoppingListItem[] = [];
  for (const section of SUPERMARKET_SECTIONS) {
    sortedItems.push(...bySection[section]);
  }

  return {
    items: sortedItems,
    bySection,
    totalCount: sortedItems.length,
    checkedCount: sortedItems.filter((i) => i.checked).length,
  };
};

// Scale ingredients for different serving sizes
export const scaleIngredients = (
  ingredients: Ingredient[],
  originalServings: number,
  targetServings: number
): Ingredient[] => {
  if (originalServings === targetServings) return ingredients;

  const scaleFactor = targetServings / originalServings;

  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount: ingredient.amount
      ? roundToDecimals(ingredient.amount * scaleFactor, 2)
      : undefined,
  }));
};

// Sort ingredients by supermarket section order
export const sortBySection = <T extends { category?: string }>(
  items: T[]
): T[] => {
  const sectionOrder: Record<string, number> = {};
  SUPERMARKET_SECTIONS.forEach((section, index) => {
    sectionOrder[section] = index;
  });

  return [...items].sort((a, b) => {
    const orderA = sectionOrder[a.category || 'other'] ?? 999;
    const orderB = sectionOrder[b.category || 'other'] ?? 999;
    return orderA - orderB;
  });
};

// Group items by section with headers
export interface SectionGroup<T> {
  section: SupermarketSection;
  displayName: string;
  icon: string;
  items: T[];
}

export const groupBySection = <T extends { category?: string }>(
  items: T[]
): SectionGroup<T>[] => {
  const groups: SectionGroup<T>[] = [];

  for (const section of SUPERMARKET_SECTIONS) {
    const sectionItems = items.filter((item) => item.category === section);
    if (sectionItems.length > 0) {
      groups.push({
        section,
        displayName: SECTION_DISPLAY_NAMES[section],
        icon: SECTION_ICONS[section],
        items: sectionItems,
      });
    }
  }

  return groups;
};

// Estimate ingredient price (rough estimates for budgeting)
const PRICE_ESTIMATES: Record<string, number> = {
  // Produce (per unit or 100g)
  'tomaten': 0.25,
  'zwiebeln': 0.15,
  'knoblauch': 0.10,
  'karotten': 0.12,
  'kartoffeln': 0.08,
  'paprika': 0.50,
  'gurke': 0.40,
  'salat': 0.80,
  'spinat': 0.15,
  'brokkoli': 0.60,
  'zucchini': 0.45,
  'aubergine': 0.70,

  // Dairy
  'milch': 0.12, // per 100ml
  'sahne': 0.25,
  'butter': 0.15,
  'eier': 0.25,
  'käse': 0.15,
  'joghurt': 0.15,

  // Meat
  'hähnchen': 0.12,
  'rindfleisch': 0.18,
  'schweinefleisch': 0.14,
  'hackfleisch': 0.12,
  'wurst': 0.15,

  // Pantry
  'nudeln': 0.08,
  'reis': 0.06,
  'mehl': 0.03,
  'zucker': 0.02,
  'öl': 0.05,
  'tomatenmark': 0.15,
};

export const estimateIngredientPrice = (ingredient: Ingredient): number => {
  const canonicalName = getCanonicalName(ingredient.name);
  const pricePerUnit = PRICE_ESTIMATES[canonicalName] || 0.10;

  if (!ingredient.amount) return pricePerUnit;

  // Simple estimation based on amount
  let multiplier = 1;

  if (ingredient.unit) {
    const unit = ingredient.unit.toLowerCase();
    if (unit === 'kg' || unit === 'l') multiplier = 10;
    else if (unit === 'g' || unit === 'ml') multiplier = 0.01;
    else if (unit === 'el' || unit === 'tl') multiplier = 0.05;
    else if (unit === 'tasse' || unit === 'tassen') multiplier = 2;
    else if (unit === 'stk' || unit === 'stück') multiplier = 1;
  }

  return roundToDecimals(ingredient.amount * pricePerUnit * multiplier, 2);
};

// Export shopping list to text format
export const exportShoppingListToText = (
  items: ShoppingListItem[],
  includeChecked = false
): string => {
  const filteredItems = includeChecked ? items : items.filter((i) => !i.checked);
  const groups = groupBySection(filteredItems);

  let text = '🛒 EINKAUFSLISTE\n';
  text += '================\n\n';

  for (const group of groups) {
    text += `${group.icon} ${group.displayName.toUpperCase()}\n`;
    text += '-'.repeat(group.displayName.length + 4) + '\n';

    for (const item of group.items) {
      const checkBox = item.checked ? '[x]' : '[ ]';
      const amount = item.amount ? `${item.amount} ${item.unit || ''}`.trim() : '';
      text += `${checkBox} ${item.name}${amount ? ` (${amount})` : ''}\n`;
    }

    text += '\n';
  }

  const totalItems = filteredItems.length;
  const checkedItems = filteredItems.filter((i) => i.checked).length;
  text += `----------------\n`;
  text += `Gesamt: ${checkedItems}/${totalItems} erledigt`;

  return text;
};

// Export shopping list to JSON
export const exportShoppingListToJSON = (
  items: ShoppingListItem[]
): string => {
  return JSON.stringify(items, null, 2);
};

// Parse shopping list from text (for import)
export const parseShoppingListFromText = (text: string): Partial<ShoppingListItem>[] => {
  const items: Partial<ShoppingListItem>[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('=') || trimmed.startsWith('-')) continue;

    // Skip section headers (emojis or uppercase)
    if (/^[🥬🥖🥛🥩🐟🧊🥫🥤📦]/.test(trimmed)) continue;
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) continue;

    // Parse item line
    // Format: [ ] Item Name (amount unit) or [x] Item Name
    const match = trimmed.match(/^\[[\s x]\]\s+(.+?)(?:\s*\(([^)]+)\))?$/i);
    if (match) {
      const name = match[1].trim();
      const amountStr = match[2];

      const item: Partial<ShoppingListItem> = {
        name,
        checked: trimmed.startsWith('[x]'),
      };

      if (amountStr) {
        const amountMatch = amountStr.match(/^([\d.,]+)\s*(.+)?$/);
        if (amountMatch) {
          item.amount = parseFloat(amountMatch[1].replace(',', '.'));
          item.unit = amountMatch[2]?.trim();
        }
      }

      items.push(item);
    }
  }

  return items;
};

export default {
  SUPERMARKET_SECTIONS,
  SECTION_DISPLAY_NAMES,
  SECTION_ICONS,
  aggregateIngredients,
  buildShoppingListFromMealPlan,
  scaleIngredients,
  sortBySection,
  groupBySection,
  ingredientToShoppingItem,
  estimateIngredientPrice,
  exportShoppingListToText,
  exportShoppingListToJSON,
  parseShoppingListFromText,
};
