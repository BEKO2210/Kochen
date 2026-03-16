/**
 * Recipe Parser
 * Parses recipes from URLs using schema.org/Recipe format
 * Falls back to meta tags and other structured data
 */

import { Recipe, Ingredient, Instruction } from '../types';
import { generateId } from './utils';

// CORS proxy for fetching external URLs
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// Interface for parsed recipe data
interface ParsedRecipeData {
  name?: string;
  description?: string;
  image?: string | string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  keywords?: string | string[];
  recipeIngredient?: string[];
  recipeInstructions?: Array<{ text: string } | string>;
  author?: { name: string } | string;
  nutrition?: {
    calories?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fatContent?: string;
  };
}

// Fetch HTML content from URL with CORS proxy
export const fetchRecipeHtml = async (url: string): Promise<string | null> => {
  // Try each proxy in order
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (response.ok) {
        const html = await response.text();
        console.log(`[Recipe Parser] Successfully fetched via ${proxy}`);
        return html;
      }
    } catch (error) {
      console.warn(`[Recipe Parser] Proxy ${proxy} failed:`, error);
      continue;
    }
  }

  console.error('[Recipe Parser] All CORS proxies failed');
  return null;
};

// Extract JSON-LD structured data from HTML
const extractJsonLdData = (html: string): ParsedRecipeData | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all JSON-LD script tags
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '{}');

      // Handle array of objects
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Check for Recipe type directly
        if (item['@type'] === 'Recipe' ||
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          return item as ParsedRecipeData;
        }

        // Check for Recipe in @graph
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          const recipeItem = item['@graph'].find(
            (g: { '@type': string | string[] }) =>
              g['@type'] === 'Recipe' ||
              (Array.isArray(g['@type']) && g['@type'].includes('Recipe'))
          );
          if (recipeItem) {
            return recipeItem as ParsedRecipeData;
          }
        }
      }
    } catch (error) {
      console.warn('[Recipe Parser] Failed to parse JSON-LD:', error);
    }
  }

  return null;
};

// Extract meta tag data as fallback
const extractMetaData = (html: string): Partial<ParsedRecipeData> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (name: string): string | undefined => {
    const meta =
      doc.querySelector(`meta[name="${name}"]`) ||
      doc.querySelector(`meta[property="${name}"]`);
    return meta?.getAttribute('content') || undefined;
  };

  return {
    name: getMeta('og:title') || getMeta('twitter:title') || doc.title || undefined,
    description:
      getMeta('og:description') ||
      getMeta('twitter:description') ||
      getMeta('description') ||
      undefined,
    image: getMeta('og:image') || getMeta('twitter:image') || undefined,
  };
};

// Parse ISO 8601 duration to minutes
const parseDuration = (duration: string | undefined): number | undefined => {
  if (!duration) return undefined;

  // Handle ISO 8601 duration format (PT1H30M)
  const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10);
    const minutes = parseInt(isoMatch[2] || '0', 10);
    return hours * 60 + minutes;
  }

  // Handle simple number (assume minutes)
  const numMatch = duration.match(/(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return undefined;
};

// Parse yield/servings
const parseYield = (recipeYield: string | number | undefined): number | undefined => {
  if (typeof recipeYield === 'number') return recipeYield;
  if (!recipeYield) return undefined;

  const match = recipeYield.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
};

// Parse ingredients from string array
const parseIngredients = (ingredients: string[] | undefined): Ingredient[] => {
  if (!ingredients || !Array.isArray(ingredients)) return [];

  return ingredients.map((ingredient, index) => {
    const parsed = parseIngredientString(ingredient);
    return {
      id: generateId(),
      name: parsed.name,
      amount: parsed.amount,
      unit: parsed.unit,
      category: parsed.category,
      order: index,
    };
  });
};

// Parse a single ingredient string
interface ParsedIngredient {
  name: string;
  amount?: number;
  unit?: string;
  category: string;
}

const parseIngredientString = (ingredient: string): ParsedIngredient => {
  // Common patterns:
  // "500g Mehl"
  // "2 Esslöffel Olivenöl"
  // "1/2 Teelöffel Salz"
  // "3 große Tomaten"

  const result: ParsedIngredient = {
    name: ingredient.trim(),
    category: 'other',
  };

  // Try to extract amount and unit
  // Pattern: number (optional fraction) + unit + name
  const patterns = [
    // "500g Mehl" or "500 g Mehl"
    /^([\d.,]+)\s*(g|kg|ml|l|L)\s+(.+)$/i,
    // "2 Esslöffel Olivenöl"
    /^([\d./]+)\s*(Esslöffel|EL|Teelöffel|TL|Tasse|Tassen|Stück|Stk|Prise|Prisen|Bund|Bündel|Dose|Dosen|Pck|Päckchen|Packung|Packungen|Scheibe|Scheiben|Zehe|Zehen|Kopf|Köpfe)\s+(.+)$/i,
    // "1/2 Teelöffel Salz"
    /^([\d./]+)\s+(.+)$/,
    // Just a number at the start
    /^([\d.,]+)\s+(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = ingredient.match(pattern);
    if (match) {
      const amountStr = match[1];
      const possibleUnit = match[2]?.toLowerCase();
      const name = match[3] || match[2];

      // Parse amount (handle fractions like 1/2)
      if (amountStr.includes('/')) {
        const [num, denom] = amountStr.split('/');
        result.amount = parseFloat(num) / parseFloat(denom);
      } else {
        result.amount = parseFloat(amountStr.replace(',', '.'));
      }

      // Determine if it's a unit or part of the name
      const units = ['g', 'kg', 'ml', 'l', 'el', 'tl', 'esslöffel', 'teelöffel', 'tasse', 'tassen', 'stk', 'stück', 'prise', 'prisen', 'bund', 'bündel', 'dose', 'dosen', 'pck', 'päckchen', 'packung', 'scheibe', 'scheiben', 'zehe', 'zehen', 'kopf', 'köpfe'];

      if (units.includes(possibleUnit)) {
        result.unit = normalizeUnit(possibleUnit);
        result.name = name.trim();
      } else {
        result.name = `${possibleUnit} ${name}`.trim();
      }

      break;
    }
  }

  // Categorize ingredient
  result.category = categorizeIngredient(result.name);

  return result;
};

// Normalize unit names
const normalizeUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'g': 'g',
    'gramm': 'g',
    'kg': 'kg',
    'kilogramm': 'kg',
    'ml': 'ml',
    'milliliter': 'ml',
    'l': 'l',
    'liter': 'l',
    'el': 'EL',
    'esslöffel': 'EL',
    'tl': 'TL',
    'teelöffel': 'TL',
    'tasse': 'Tasse',
    'tassen': 'Tassen',
    'stk': 'Stk',
    'stück': 'Stk',
    'prise': 'Prise',
    'prisen': 'Prisen',
    'bund': 'Bund',
    'bündel': 'Bündel',
    'dose': 'Dose',
    'dosen': 'Dosen',
    'pck': 'Pck',
    'päckchen': 'Pck',
    'packung': 'Pck',
    'scheibe': 'Scheibe',
    'scheiben': 'Scheiben',
    'zehe': 'Zehe',
    'zehen': 'Zehen',
    'kopf': 'Kopf',
    'köpfe': 'Kopf',
  };

  return unitMap[unit.toLowerCase()] || unit;
};

// Categorize ingredient for supermarket sections
const categorizeIngredient = (name: string): string => {
  const lowerName = name.toLowerCase();

  const categories: Record<string, string[]> = {
    produce: [
      'tomate', 'tomaten', 'gurke', 'gurken', 'salat', 'karotte', 'karotten', 'möhre', 'möhren',
      'zwiebel', 'zwiebeln', 'knoblauch', 'kartoffel', 'kartoffeln', 'paprika', 'aubergine',
      'zucchini', 'spinat', 'brokkoli', 'blumenkohl', 'spargel', 'erbsen', 'bohnen', 'mais',
      'apfel', 'äpfel', 'banane', 'bananen', 'orange', 'orangen', 'zitrone', 'zitronen',
      'erdbeere', 'erdbeeren', 'kirsche', 'kirschen', 'pfirsich', 'pfirsiche', 'birne', 'birnen',
      'avocado', 'avocados', 'mango', 'mangos', 'kiwi', 'kiwis', 'traube', 'trauben',
    ],
    dairy: [
      'milch', 'sahne', 'schmand', 'crème fraîche', 'creme fraiche', 'joghurt', 'quark',
      'butter', 'margarine', 'käse', 'parmesan', 'mozzarella', 'feta', 'gouda', 'emmentaler',
      'eier', 'ei ', 'eigelb', 'eiweiß', 'protein',
    ],
    meat: [
      'hähnchen', 'huhn', 'hühnchen', 'pute', 'truthahn', 'ente', 'ente', 'rind', 'rindfleisch',
      'schwein', 'schweinefleisch', 'lamm', 'lammfleisch', 'hackfleisch', 'wurst', 'würstchen',
      'speck', 'schinken', 'salami', 'bratwurst', 'wiener', 'schnitzel', 'kotelett',
    ],
    seafood: [
      'lachs', 'forelle', 'kabeljau', 'dorsch', 'thunfisch', 'garnelen', 'krabben', 'muscheln',
      'calamari', ' Tintenfisch', 'fisch', 'filet', 'filets',
    ],
    bakery: [
      'brot', 'brötchen', 'baguette', 'ciabatta', 'toast', 'toastbrot', 'brösel', 'paniermehl',
      'mehl', 'weizenmehl', 'dinkelmehl', 'vollkornmehl',
    ],
    pantry: [
      'nudeln', 'pasta', 'spaghetti', 'penne', 'fusilli', 'reis', 'couscous', 'quinoa',
      'bulgur', 'linsen', 'kichererbsen', 'bohnen', 'tomatenmark', 'passierte tomaten',
      'dosentomaten', 'gemüsebrühe', 'hühnerbrühe', 'brühe', 'brühpulver', 'soße', 'sauce',
      'ketchup', 'senf', 'mayonnaise', 'mayo', 'essig', 'öl', 'olivenöl', 'sonnenblumenöl',
      'honig', 'zucker', 'brauner zucker', 'puderzucker', 'vanillezucker', 'salz', 'pfeffer',
      'gewürz', 'gewürze', 'basilikum', 'oregano', 'thymian', 'rosmarin', 'petersilie',
      'zimt', 'muskat', 'paprikapulver', 'curry', 'kurkuma', 'kreuzkümmel', 'koriander',
    ],
    frozen: [
      'tiefkühl', 'tk-', 'tk ', 'gefroren',
    ],
    beverages: [
      'wasser', 'mineralwasser', 'saft', 'orangesaft', 'apfelsaft', 'cola', 'limonade',
      'wein', 'rotwein', 'weißwein', 'bier',
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      return category;
    }
  }

  return 'other';
};

// Parse instructions
const parseInstructions = (
  instructions: Array<{ text: string } | string> | undefined
): Instruction[] => {
  if (!instructions) return [];

  return instructions.map((instruction, index) => {
    const text = typeof instruction === 'string' ? instruction : instruction.text;
    return {
      step: index + 1,
      text: text.trim(),
      timer: extractTimerFromInstruction(text),
    };
  });
};

// Extract timer information from instruction text
const extractTimerFromInstruction = (text: string): { minutes: number; label?: string } | undefined => {
  // Look for patterns like "30 Minuten kochen", "für 45 Min. backen", "ca. 20 Min."
  const patterns = [
    /(\d+)\s*(?:Minuten|Min\.?|min\.?)/i,
    /ca\.?\s*(\d+)\s*(?:Minuten|Min\.?|min\.?)/i,
    /für\s*(\d+)\s*(?:Minuten|Min\.?|min\.?)/i,
    /(\d+)\s*(?:Minuten|Min\.?|min\.?)\s*(?:lang|lang)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        minutes: parseInt(match[1], 10),
        label: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      };
    }
  }

  return undefined;
};

// Get first image from various formats
const getImageUrl = (image: string | string[] | undefined): string | undefined => {
  if (!image) return undefined;

  if (Array.isArray(image)) {
    // Try to find the best quality image
    return image[0];
  }

  return image;
};

// Main parse function
export const parseRecipeFromUrl = async (url: string): Promise<Recipe | null> => {
  console.log(`[Recipe Parser] Parsing recipe from: ${url}`);

  try {
    // Fetch HTML content
    const html = await fetchRecipeHtml(url);
    if (!html) {
      throw new Error('Failed to fetch recipe HTML');
    }

    // Try JSON-LD first
    let recipeData = extractJsonLdData(html);

    // Fallback to meta tags
    if (!recipeData || !recipeData.name) {
      const metaData = extractMetaData(html);
      recipeData = { ...metaData, ...recipeData };
    }

    if (!recipeData || !recipeData.name) {
      throw new Error('No recipe data found');
    }

    // Build Recipe object
    const recipe: Recipe = {
      id: generateId(),
      name: recipeData.name || 'Unbekanntes Rezept',
      description: recipeData.description,
      image: getImageUrl(recipeData.image),
      sourceUrl: url,
      prepTime: parseDuration(recipeData.prepTime),
      cookTime: parseDuration(recipeData.cookTime),
      totalTime: parseDuration(recipeData.totalTime),
      servings: parseYield(recipeData.recipeYield) || 4,
      category: Array.isArray(recipeData.recipeCategory)
        ? recipeData.recipeCategory[0]
        : recipeData.recipeCategory,
      cuisine: Array.isArray(recipeData.recipeCuisine)
        ? recipeData.recipeCuisine[0]
        : recipeData.recipeCuisine,
      tags: parseTags(recipeData.keywords),
      ingredients: parseIngredients(recipeData.recipeIngredient),
      instructions: parseInstructions(recipeData.recipeInstructions),
      nutrition: recipeData.nutrition
        ? {
            calories: recipeData.nutrition.calories,
            protein: recipeData.nutrition.proteinContent,
            carbs: recipeData.nutrition.carbohydrateContent,
            fat: recipeData.nutrition.fatContent,
          }
        : undefined,
      author: typeof recipeData.author === 'object'
        ? recipeData.author?.name
        : recipeData.author,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('[Recipe Parser] Successfully parsed recipe:', recipe.name);
    return recipe;
  } catch (error) {
    console.error('[Recipe Parser] Error parsing recipe:', error);
    return null;
  }
};

// Parse tags from keywords
const parseTags = (keywords: string | string[] | undefined): string[] => {
  if (!keywords) return [];

  if (typeof keywords === 'string') {
    return keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean);
  }

  return keywords;
};

// Validate if URL is a recipe URL
export const isValidRecipeUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Check if it's a valid HTTP(S) URL
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Get domain from URL
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
};

// Extract recipe from clipboard (if it contains a URL)
export const extractUrlFromText = (text: string): string | null => {
  const urlPattern = /(https?:\/\/[^\s]+)/i;
  const match = text.match(urlPattern);
  return match ? match[1] : null;
};

export default {
  fetchRecipeHtml,
  parseRecipeFromUrl,
  isValidRecipeUrl,
  getDomainFromUrl,
  extractUrlFromText,
  parseIngredientString,
  categorizeIngredient,
};
