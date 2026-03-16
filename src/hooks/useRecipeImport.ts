import { useState, useCallback } from 'react';
import { Recipe, Ingredient, RecipeStep } from './useRecipes';

// ============================================================================
// Types
// ============================================================================

export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ParsedRecipe {
  title: string;
  description: string;
  imageUrl?: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  source: string;
}

export interface UseRecipeImportReturn {
  // State
  status: ImportStatus;
  error: string | null;
  parsedRecipe: ParsedRecipe | null;

  // Actions
  parseFromUrl: (url: string) => Promise<ParsedRecipe | null>;
  parseFromHtml: (html: string, sourceUrl?: string) => ParsedRecipe | null;
  parseFromJsonLd: (jsonLd: unknown, sourceUrl?: string) => ParsedRecipe | null;
  reset: () => void;

  // Supported Sites
  supportedSites: string[];
  isSiteSupported: (url: string) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Bekannte Rezept-Seiten mit strukturierten Daten
const SUPPORTED_SITES = [
  'chefkoch.de',
  'lecker.de',
  'essen-und-trinken.de',
  'eatsmarter.de',
  'kochbar.de',
  'rewe.de',
  'dr-oetker.de',
  'bettybossi.ch',
  'migros.ch',
  'coop.ch',
  'allrecipes.com',
  'foodnetwork.com',
  'seriouseats.com',
  'bonappetit.com',
  'tasty.co',
  'jamieoliver.com',
  'bbcgoodfood.com',
];

// JSON-LD Recipe Type
interface JsonLdRecipe {
  '@type': string | string[];
  name?: string;
  description?: string;
  image?: string | { url?: string } | Array<{ url?: string }>;
  recipeYield?: string | number | string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeCategory?: string;
  keywords?: string;
  recipeIngredient?: string[];
  recipeInstructions?:
    | string[]
    | Array<{ '@type': string; text: string }>
    | string;
  author?: { name?: string } | string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parst ISO 8601 Dauer (PT30M -> 30)
 */
const parseDuration = (duration: string | undefined): number => {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  return hours * 60 + minutes;
};

/**
 * Parst eine Zutatenzeile
 */
const parseIngredient = (text: string, index: number): Ingredient => {
  // Versuche Muster wie "200g Mehl" oder "2 EL Öl" zu erkennen
  const patterns = [
    // "200 g Mehl" oder "200g Mehl"
    /^([\d.,]+)\s*(g|kg|ml|l|el|tl|stück|stk|prise|pr|bund|bd|dose|dose|glas|becher|packung|pkg|pck)\s+(.+)$/i,
    // "2 Eier"
    /^([\d.,]+)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const unit = match[2]?.toLowerCase() || 'stück';
      const name = match[3] || match[2];

      return {
        id: `ing-${index}`,
        name: name.trim(),
        amount: isNaN(amount) ? 1 : amount,
        unit: unit,
      };
    }
  }

  // Fallback: ganzer Text als Name
  return {
    id: `ing-${index}`,
    name: text.trim(),
    amount: 1,
    unit: 'Stück',
  };
};

/**
 * Parst JSON-LD Recipe Daten
 */
const parseJsonLdRecipe = (data: JsonLdRecipe, sourceUrl: string): ParsedRecipe | null => {
  try {
    // Prüfe ob es ein Recipe ist
    const type = Array.isArray(data['@type'])
      ? data['@type']
      : [data['@type']];

    if (!type.some((t) => t.toLowerCase().includes('recipe'))) {
      return null;
    }

    // Extrahiere Bild-URL
    let imageUrl: string | undefined;
    if (typeof data.image === 'string') {
      imageUrl = data.image;
    } else if (Array.isArray(data.image) && data.image.length > 0) {
      imageUrl = data.image[0].url;
    } else if (typeof data.image === 'object' && data.image?.url) {
      imageUrl = data.image.url;
    }

    // Extrahiere Portionen
    let servings = 4;
    if (data.recipeYield) {
      if (typeof data.recipeYield === 'number') {
        servings = data.recipeYield;
      } else if (typeof data.recipeYield === 'string') {
        const match = data.recipeYield.match(/(\d+)/);
        if (match) servings = parseInt(match[1], 10);
      } else if (Array.isArray(data.recipeYield) && data.recipeYield.length > 0) {
        const match = data.recipeYield[0].match(/(\d+)/);
        if (match) servings = parseInt(match[1], 10);
      }
    }

    // Extrahiere Zutaten
    const ingredients: Ingredient[] =
      data.recipeIngredient?.map((ing, index) => parseIngredient(ing, index)) ||
      [];

    // Extrahiere Anweisungen
    const steps: RecipeStep[] = [];
    if (typeof data.recipeInstructions === 'string') {
      steps.push({
        id: 'step-0',
        order: 0,
        description: data.recipeInstructions,
      });
    } else if (Array.isArray(data.recipeInstructions)) {
      data.recipeInstructions.forEach((instruction, index) => {
        if (typeof instruction === 'string') {
          steps.push({
            id: `step-${index}`,
            order: index,
            description: instruction,
          });
        } else if (instruction.text) {
          steps.push({
            id: `step-${index}`,
            order: index,
            description: instruction.text,
          });
        }
      });
    }

    // Extrahiere Tags aus Keywords
    const tags = data.keywords
      ? data.keywords.split(',').map((k) => k.trim())
      : [];

    return {
      title: data.name || 'Unbekanntes Rezept',
      description: data.description || '',
      imageUrl,
      servings,
      prepTime: parseDuration(data.prepTime),
      cookTime: parseDuration(data.cookTime),
      difficulty: 'medium',
      category: data.recipeCategory || 'Sonstiges',
      tags,
      ingredients,
      steps,
      source: sourceUrl,
    };
  } catch (error) {
    console.error('Fehler beim Parsen von JSON-LD:', error);
    return null;
  }
};

/**
 * Extrahiert JSON-LD aus HTML
 */
const extractJsonLdFromHtml = (html: string): unknown[] => {
  const scripts: unknown[] = [];
  const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      scripts.push(data);
    } catch (e) {
      // Ignoriere ungültiges JSON
    }
  }

  return scripts;
};

/**
 * Extrahiert Rezept aus HTML-Struktur (Fallback)
 */
const extractFromHtmlStructure = (html: string, sourceUrl: string): ParsedRecipe | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Versuche Titel zu finden
    const title =
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('[class*="title"]')?.textContent?.trim() ||
      doc.querySelector('[class*="recipe-title"]')?.textContent?.trim() ||
      'Unbekanntes Rezept';

    // Versuche Zutaten zu finden
    const ingredientElements = doc.querySelectorAll(
      '[class*="ingredient"], [class*="zutat"], .recipe-ingredients li'
    );
    const ingredients: Ingredient[] = Array.from(ingredientElements)
      .map((el, index) => parseIngredient(el.textContent || '', index))
      .filter((ing) => ing.name.length > 0);

    // Versuche Anweisungen zu finden
    const stepElements = doc.querySelectorAll(
      '[class*="instruction"], [class*="step"], [class*="zubereitung"] li, .recipe-steps li'
    );
    const steps: RecipeStep[] = Array.from(stepElements).map((el, index) => ({
      id: `step-${index}`,
      order: index,
      description: el.textContent?.trim() || '',
    }));

    // Versuche Bild zu finden
    const imageUrl =
      doc.querySelector('[class*="recipe-image"] img')?.getAttribute('src') ||
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      undefined;

    if (ingredients.length === 0 && steps.length === 0) {
      return null;
    }

    return {
      title,
      description: '',
      imageUrl,
      servings: 4,
      prepTime: 0,
      cookTime: 0,
      difficulty: 'medium',
      category: 'Sonstiges',
      tags: [],
      ingredients,
      steps,
      source: sourceUrl,
    };
  } catch (error) {
    console.error('Fehler beim HTML-Parsing:', error);
    return null;
  }
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zum Importieren von Rezepten aus URLs
 * Unterstützt JSON-LD strukturierte Daten und HTML-Scraping als Fallback
 *
 * @example
 * ```tsx
 * const { status, parseFromUrl, parsedRecipe, error } = useRecipeImport();
 *
 * const handleImport = async (url: string) => {
 *   const recipe = await parseFromUrl(url);
 *   if (recipe) {
 *     // Rezept speichern
 *   }
 * };
 * ```
 */
export function useRecipeImport(): UseRecipeImportReturn {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

  /**
   * Prüft ob eine URL von einer unterstützten Seite stammt
   */
  const isSiteSupported = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return SUPPORTED_SITES.some((site) => hostname.includes(site));
    } catch {
      return false;
    }
  }, []);

  /**
   * Parst ein Rezept von einer URL
   */
  const parseFromUrl = useCallback(
    async (url: string): Promise<ParsedRecipe | null> => {
      setStatus('loading');
      setError(null);
      setParsedRecipe(null);

      try {
        // URL validieren
        new URL(url);

        // HTML von URL laden (CORS-Proxy könnte nötig sein)
        const response = await fetch(url, {
          headers: {
            Accept: 'text/html',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const html = await response.text();
        const recipe = parseFromHtml(html, url);

        if (recipe) {
          setParsedRecipe(recipe);
          setStatus('success');
          return recipe;
        } else {
          throw new Error('Kein Rezept gefunden');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(errorMessage);
        setStatus('error');
        return null;
      }
    },
    []
  );

  /**
   * Parst ein Rezept aus HTML
   */
  const parseFromHtml = useCallback(
    (html: string, sourceUrl: string = ''): ParsedRecipe | null => {
      // Zuerst JSON-LD versuchen
      const jsonLdData = extractJsonLdFromHtml(html);

      for (const data of jsonLdData) {
        // Prüfe auf @graph (mehrere Elemente)
        if (data && typeof data === 'object' && '@graph' in data) {
          const graph = (data as { '@graph': unknown[] })['@graph'];
          for (const item of graph) {
            const recipe = parseJsonLdRecipe(item as JsonLdRecipe, sourceUrl);
            if (recipe) return recipe;
          }
        }

        // Direktes Recipe-Objekt
        const recipe = parseJsonLdRecipe(data as JsonLdRecipe, sourceUrl);
        if (recipe) return recipe;
      }

      // Fallback: HTML-Struktur
      return extractFromHtmlStructure(html, sourceUrl);
    },
    []
  );

  /**
   * Parst ein Rezept aus JSON-LD Daten
   */
  const parseFromJsonLd = useCallback(
    (jsonLd: unknown, sourceUrl: string = ''): ParsedRecipe | null => {
      if (!jsonLd || typeof jsonLd !== 'object') {
        return null;
      }

      const recipe = parseJsonLdRecipe(jsonLd as JsonLdRecipe, sourceUrl);
      if (recipe) {
        setParsedRecipe(recipe);
        setStatus('success');
      }
      return recipe;
    },
    []
  );

  /**
   * Setzt den Status zurück
   */
  const reset = useCallback((): void => {
    setStatus('idle');
    setError(null);
    setParsedRecipe(null);
  }, []);

  return {
    status,
    error,
    parsedRecipe,
    parseFromUrl,
    parseFromHtml,
    parseFromJsonLd,
    reset,
    supportedSites: SUPPORTED_SITES,
    isSiteSupported,
  };
}

export default useRecipeImport;
