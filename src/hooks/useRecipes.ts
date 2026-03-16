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
const SEED_FLAG = 'kochplan_seeded';

const DEFAULT_FILTER: RecipeFilter = {};

/**
 * Standard-Rezepte für den ersten App-Start
 */
const getSeedRecipes = (): Recipe[] => {
  const now = new Date();
  return [
    {
      id: 'seed-carbonara',
      title: 'Spaghetti Carbonara',
      description: 'Das klassische italienische Pasta-Gericht mit Ei, Speck und Parmesan. Cremig, einfach und unglaublich lecker!',
      imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
      servings: 4,
      prepTime: 10,
      cookTime: 15,
      difficulty: 'easy',
      category: 'Hauptgericht',
      tags: ['Pasta', 'Schnell', 'Klassiker', 'Italienisch'],
      ingredients: [
        { id: 'sc-1', name: 'Spaghetti', amount: 400, unit: 'g', category: 'Getreide' },
        { id: 'sc-2', name: 'Speck oder Pancetta', amount: 150, unit: 'g', category: 'Fleisch' },
        { id: 'sc-3', name: 'Eier', amount: 4, unit: 'Stk', category: 'Milchprodukte' },
        { id: 'sc-4', name: 'Parmesan', amount: 100, unit: 'g', category: 'Milchprodukte' },
        { id: 'sc-5', name: 'Knoblauchzehen', amount: 2, unit: 'Stk', category: 'Gemüse' },
        { id: 'sc-6', name: 'Schwarzer Pfeffer', amount: 1, unit: 'TL', category: 'Gewürze' },
      ],
      steps: [
        { id: 'sc-s1', order: 1, description: 'Spaghetti in großem Salzwasser al dente kochen (ca. 8-10 Minuten).', duration: 10 },
        { id: 'sc-s2', order: 2, description: 'Währenddessen den Speck in kleine Würfel schneiden und in einer großen Pfanne knusprig anbraten.' },
        { id: 'sc-s3', order: 3, description: 'Knoblauch fein hacken und kurz mit dem Speck anschwitzen, dann entfernen.' },
        { id: 'sc-s4', order: 4, description: 'Eier mit geriebenem Parmesan und viel frisch gemahlenem Pfeffer verquirlen.' },
        { id: 'sc-s5', order: 5, description: 'Die heißen, abgetropften Spaghetti zur Pfanne geben und vom Herd nehmen.' },
        { id: 'sc-s6', order: 6, description: 'Die Ei-Käse-Mischung sofort unterheben, sodass eine cremige Sauce entsteht. Nicht mehr erhitzen!' },
        { id: 'sc-s7', order: 7, description: 'Sofort servieren und mit zusätzlichem Parmesan und Pfeffer garnieren.' },
      ],
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-kartoffelgratin',
      title: 'Kartoffelgratin',
      description: 'Cremiges Kartoffelgratin mit goldbrauner Käsekruste - der perfekte Begleiter zu Fleisch und Salat.',
      imageUrl: 'https://images.unsplash.com/photo-1568600891553-a3c5e6ee0eae?w=800',
      servings: 6,
      prepTime: 20,
      cookTime: 45,
      difficulty: 'easy',
      category: 'Beilage',
      tags: ['Vegetarisch', 'Ofen', 'Klassiker'],
      ingredients: [
        { id: 'kg-1', name: 'Kartoffeln (festkochend)', amount: 1, unit: 'kg', category: 'Gemüse' },
        { id: 'kg-2', name: 'Sahne', amount: 300, unit: 'ml', category: 'Milchprodukte' },
        { id: 'kg-3', name: 'Milch', amount: 200, unit: 'ml', category: 'Milchprodukte' },
        { id: 'kg-4', name: 'Gruyère', amount: 150, unit: 'g', category: 'Milchprodukte' },
        { id: 'kg-5', name: 'Knoblauchzehe', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'kg-6', name: 'Muskatnuss', amount: 1, unit: 'Prise', category: 'Gewürze' },
        { id: 'kg-7', name: 'Butter', amount: 20, unit: 'g', category: 'Milchprodukte' },
      ],
      steps: [
        { id: 'kg-s1', order: 1, description: 'Ofen auf 180°C Ober-/Unterhitze vorheizen. Auflaufform mit Knoblauch einreiben und buttern.' },
        { id: 'kg-s2', order: 2, description: 'Kartoffeln schälen und in 2-3 mm dünne Scheiben schneiden.' },
        { id: 'kg-s3', order: 3, description: 'Sahne, Milch, Salz, Pfeffer und Muskatnuss verrühren.' },
        { id: 'kg-s4', order: 4, description: 'Kartoffelscheiben schuppenartig in die Form schichten, jede Lage leicht salzen und mit Käse bestreuen.' },
        { id: 'kg-s5', order: 5, description: 'Sahne-Milch-Mischung darüber gießen und restlichen Käse obenauf verteilen.' },
        { id: 'kg-s6', order: 6, description: 'Im Ofen ca. 45 Minuten backen, bis die Oberfläche goldbraun ist und die Kartoffeln weich sind.', duration: 45 },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-curry',
      title: 'Hähnchen-Curry mit Kokosmilch',
      description: 'Aromatisches Thai-Curry mit zartem Hähnchen, buntem Gemüse und cremiger Kokosmilch.',
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
      servings: 4,
      prepTime: 15,
      cookTime: 25,
      difficulty: 'medium',
      category: 'Hauptgericht',
      tags: ['Asiatisch', 'Curry', 'Hähnchen'],
      ingredients: [
        { id: 'hc-1', name: 'Hähnchenbrustfilet', amount: 500, unit: 'g', category: 'Fleisch' },
        { id: 'hc-2', name: 'Kokosmilch', amount: 400, unit: 'ml', category: 'Konserven' },
        { id: 'hc-3', name: 'Rote Currypaste', amount: 2, unit: 'EL', category: 'Gewürze' },
        { id: 'hc-4', name: 'Paprika (rot)', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'hc-5', name: 'Zucchini', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'hc-6', name: 'Basmatireis', amount: 300, unit: 'g', category: 'Getreide' },
        { id: 'hc-7', name: 'Limette', amount: 1, unit: 'Stk', category: 'Obst' },
        { id: 'hc-8', name: 'Koriander (frisch)', amount: 1, unit: 'Bund', category: 'Kräuter' },
      ],
      steps: [
        { id: 'hc-s1', order: 1, description: 'Reis nach Packungsanweisung kochen.', duration: 15 },
        { id: 'hc-s2', order: 2, description: 'Hähnchen in mundgerechte Stücke schneiden. Paprika und Zucchini würfeln.' },
        { id: 'hc-s3', order: 3, description: 'Currypaste in einem Topf kurz anrösten, dann Hähnchenstücke darin anbraten.' },
        { id: 'hc-s4', order: 4, description: 'Gemüse hinzufügen und 2 Minuten mitbraten.' },
        { id: 'hc-s5', order: 5, description: 'Kokosmilch angießen, aufkochen und bei mittlerer Hitze 15 Minuten köcheln lassen.', duration: 15 },
        { id: 'hc-s6', order: 6, description: 'Mit Limettensaft, Salz und Fischsauce abschmecken. Mit frischem Koriander und Reis servieren.' },
      ],
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-salat',
      title: 'Caesar Salad',
      description: 'Knackiger Römersalat mit cremigem Caesar-Dressing, Croutons und Parmesan.',
      imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
      servings: 2,
      prepTime: 15,
      cookTime: 5,
      difficulty: 'easy',
      category: 'Vorspeise',
      tags: ['Salat', 'Schnell', 'Leicht'],
      ingredients: [
        { id: 'cs-1', name: 'Römersalat', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'cs-2', name: 'Parmesan', amount: 50, unit: 'g', category: 'Milchprodukte' },
        { id: 'cs-3', name: 'Ciabatta-Brot', amount: 2, unit: 'Scheiben', category: 'Getreide' },
        { id: 'cs-4', name: 'Knoblauchzehe', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'cs-5', name: 'Olivenöl', amount: 4, unit: 'EL', category: 'Öl' },
        { id: 'cs-6', name: 'Zitronensaft', amount: 2, unit: 'EL', category: 'Obst' },
        { id: 'cs-7', name: 'Worcestersauce', amount: 1, unit: 'TL', category: 'Gewürze' },
        { id: 'cs-8', name: 'Dijonsenf', amount: 1, unit: 'TL', category: 'Gewürze' },
      ],
      steps: [
        { id: 'cs-s1', order: 1, description: 'Brot in Würfel schneiden und mit Olivenöl und Knoblauch in der Pfanne goldbraun rösten.', duration: 5 },
        { id: 'cs-s2', order: 2, description: 'Für das Dressing: Olivenöl, Zitronensaft, Worcestersauce, Senf und geriebenen Parmesan verrühren.' },
        { id: 'cs-s3', order: 3, description: 'Römersalat waschen, trocken schleudern und in mundgerechte Stücke zupfen.' },
        { id: 'cs-s4', order: 4, description: 'Salat mit dem Dressing vermengen, Croutons und Parmesanspäne darüber geben.' },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-pancakes',
      title: 'Fluffige Pancakes',
      description: 'Amerikanische Pancakes – fluffig, goldbraun und perfekt mit Ahornsirup und frischen Beeren.',
      imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
      servings: 4,
      prepTime: 10,
      cookTime: 15,
      difficulty: 'easy',
      category: 'Frühstück',
      tags: ['Süß', 'Frühstück', 'Schnell', 'Vegetarisch'],
      ingredients: [
        { id: 'pc-1', name: 'Mehl', amount: 250, unit: 'g', category: 'Getreide' },
        { id: 'pc-2', name: 'Milch', amount: 300, unit: 'ml', category: 'Milchprodukte' },
        { id: 'pc-3', name: 'Eier', amount: 2, unit: 'Stk', category: 'Milchprodukte' },
        { id: 'pc-4', name: 'Backpulver', amount: 2, unit: 'TL', category: 'Backen' },
        { id: 'pc-5', name: 'Zucker', amount: 2, unit: 'EL', category: 'Backen' },
        { id: 'pc-6', name: 'Butter (geschmolzen)', amount: 30, unit: 'g', category: 'Milchprodukte' },
        { id: 'pc-7', name: 'Ahornsirup', amount: 1, unit: 'Portion', category: 'Sonstiges' },
      ],
      steps: [
        { id: 'pc-s1', order: 1, description: 'Mehl, Backpulver und Zucker in einer Schüssel vermengen.' },
        { id: 'pc-s2', order: 2, description: 'Milch, Eier und geschmolzene Butter verquirlen und zur Mehlmischung geben. Nur kurz verrühren (Klümpchen sind okay!).' },
        { id: 'pc-s3', order: 3, description: 'Teig 5 Minuten ruhen lassen.', duration: 5 },
        { id: 'pc-s4', order: 4, description: 'Pfanne bei mittlerer Hitze mit wenig Butter erhitzen. Pro Pancake ca. 3 EL Teig in die Pfanne geben.' },
        { id: 'pc-s5', order: 5, description: 'Wenn Blasen auf der Oberfläche erscheinen, wenden und von der anderen Seite goldbraun backen.', duration: 3 },
        { id: 'pc-s6', order: 6, description: 'Mit Ahornsirup und frischen Beeren servieren.' },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-chili',
      title: 'Chili con Carne',
      description: 'Herzhaftes Chili mit Hackfleisch, Bohnen und Paprika – ideal für große Runden oder Meal Prep.',
      imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
      servings: 6,
      prepTime: 15,
      cookTime: 40,
      difficulty: 'easy',
      category: 'Hauptgericht',
      tags: ['Eintopf', 'Deftig', 'Meal Prep'],
      ingredients: [
        { id: 'cc-1', name: 'Hackfleisch (gemischt)', amount: 500, unit: 'g', category: 'Fleisch' },
        { id: 'cc-2', name: 'Kidneybohnen (Dose)', amount: 2, unit: 'Stk', category: 'Konserven' },
        { id: 'cc-3', name: 'Mais (Dose)', amount: 1, unit: 'Stk', category: 'Konserven' },
        { id: 'cc-4', name: 'Passierte Tomaten', amount: 500, unit: 'ml', category: 'Konserven' },
        { id: 'cc-5', name: 'Paprika (rot)', amount: 2, unit: 'Stk', category: 'Gemüse' },
        { id: 'cc-6', name: 'Zwiebel', amount: 2, unit: 'Stk', category: 'Gemüse' },
        { id: 'cc-7', name: 'Knoblauchzehen', amount: 3, unit: 'Stk', category: 'Gemüse' },
        { id: 'cc-8', name: 'Kreuzkümmel', amount: 1, unit: 'TL', category: 'Gewürze' },
        { id: 'cc-9', name: 'Chilipulver', amount: 1, unit: 'TL', category: 'Gewürze' },
      ],
      steps: [
        { id: 'cc-s1', order: 1, description: 'Zwiebeln und Knoblauch fein hacken. Paprika in Würfel schneiden.' },
        { id: 'cc-s2', order: 2, description: 'Hackfleisch in einem großen Topf scharf anbraten und krümelig braten.' },
        { id: 'cc-s3', order: 3, description: 'Zwiebeln und Knoblauch dazugeben und glasig dünsten.' },
        { id: 'cc-s4', order: 4, description: 'Paprikawürfel, Gewürze und passierte Tomaten hinzufügen.' },
        { id: 'cc-s5', order: 5, description: 'Bohnen und Mais abtropfen lassen und unterheben.' },
        { id: 'cc-s6', order: 6, description: 'Bei niedriger Hitze 30-40 Minuten köcheln lassen. Mit Salz, Pfeffer und Chili abschmecken.', duration: 35 },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-risotto',
      title: 'Pilzrisotto',
      description: 'Cremiges Risotto mit gemischten Pilzen und Parmesan – pures Comfort Food.',
      imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800',
      servings: 4,
      prepTime: 10,
      cookTime: 30,
      difficulty: 'medium',
      category: 'Hauptgericht',
      tags: ['Vegetarisch', 'Italienisch', 'Reis'],
      ingredients: [
        { id: 'pr-1', name: 'Risottoreis (Arborio)', amount: 300, unit: 'g', category: 'Getreide' },
        { id: 'pr-2', name: 'Gemischte Pilze', amount: 400, unit: 'g', category: 'Gemüse' },
        { id: 'pr-3', name: 'Gemüsebrühe', amount: 1, unit: 'L', category: 'Sonstiges' },
        { id: 'pr-4', name: 'Parmesan', amount: 80, unit: 'g', category: 'Milchprodukte' },
        { id: 'pr-5', name: 'Schalotte', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'pr-6', name: 'Weißwein', amount: 100, unit: 'ml', category: 'Sonstiges' },
        { id: 'pr-7', name: 'Butter', amount: 30, unit: 'g', category: 'Milchprodukte' },
        { id: 'pr-8', name: 'Thymian (frisch)', amount: 3, unit: 'Zweige', category: 'Kräuter' },
      ],
      steps: [
        { id: 'pr-s1', order: 1, description: 'Gemüsebrühe erhitzen und warm halten. Pilze putzen und in Scheiben schneiden.' },
        { id: 'pr-s2', order: 2, description: 'Schalotte fein hacken und in Butter glasig dünsten.' },
        { id: 'pr-s3', order: 3, description: 'Pilze dazugeben und 3-4 Minuten mitbraten.' },
        { id: 'pr-s4', order: 4, description: 'Reis hinzufügen und kurz anrösten, bis die Körner glasig sind.' },
        { id: 'pr-s5', order: 5, description: 'Mit Weißwein ablöschen und einkochen lassen.' },
        { id: 'pr-s6', order: 6, description: 'Heiße Brühe kellenweise zugeben und unter ständigem Rühren einkochen lassen. Etwa 18-20 Minuten.', duration: 20 },
        { id: 'pr-s7', order: 7, description: 'Parmesan und einen Stich Butter unterrühren. Mit Thymian, Salz und Pfeffer abschmecken.' },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-wrap',
      title: 'Veggie Wraps',
      description: 'Schnelle, gesunde Wraps mit Hummus, frischem Gemüse und Feta – perfekt für die Mittagspause.',
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800',
      servings: 2,
      prepTime: 10,
      cookTime: 0,
      difficulty: 'easy',
      category: 'Snack',
      tags: ['Vegetarisch', 'Schnell', 'Gesund', 'Kein Kochen'],
      ingredients: [
        { id: 'vw-1', name: 'Tortilla-Wraps', amount: 2, unit: 'Stk', category: 'Getreide' },
        { id: 'vw-2', name: 'Hummus', amount: 4, unit: 'EL', category: 'Sonstiges' },
        { id: 'vw-3', name: 'Feta', amount: 80, unit: 'g', category: 'Milchprodukte' },
        { id: 'vw-4', name: 'Salatgurke', amount: 0.5, unit: 'Stk', category: 'Gemüse' },
        { id: 'vw-5', name: 'Tomate', amount: 1, unit: 'Stk', category: 'Gemüse' },
        { id: 'vw-6', name: 'Avocado', amount: 0.5, unit: 'Stk', category: 'Gemüse' },
        { id: 'vw-7', name: 'Rucola', amount: 1, unit: 'Handvoll', category: 'Gemüse' },
      ],
      steps: [
        { id: 'vw-s1', order: 1, description: 'Wraps kurz in einer trockenen Pfanne erwärmen, damit sie geschmeidiger werden.' },
        { id: 'vw-s2', order: 2, description: 'Hummus gleichmäßig auf die Wraps streichen.' },
        { id: 'vw-s3', order: 3, description: 'Gurke, Tomate und Avocado in dünne Scheiben schneiden.' },
        { id: 'vw-s4', order: 4, description: 'Gemüse, Rucola und zerbröselten Feta auf den Wraps verteilen.' },
        { id: 'vw-s5', order: 5, description: 'Wraps fest einrollen, diagonal halbieren und servieren.' },
      ],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

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

  // Initial laden (mit Seed-Daten beim ersten Start)
  useEffect(() => {
    try {
      let loaded = loadRecipesFromStorage();
      if (loaded.length === 0 && !localStorage.getItem(SEED_FLAG)) {
        loaded = getSeedRecipes();
        saveRecipesToStorage(loaded);
        localStorage.setItem(SEED_FLAG, '1');
      }
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
