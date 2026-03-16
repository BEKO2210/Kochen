/**
 * Utility Functions
 * Helper functions for various tasks
 */

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate short ID (for display purposes)
export const generateShortId = (length = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

// Deep clone an object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Object) {
    const copy = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone(obj[key]);
      }
    }
    return copy;
  }

  return obj;
};

// Deep merge objects
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(
          result[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
};

// Round number to specified decimal places
export const roundToDecimals = (num: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

// Format number as German decimal
export const formatGermanNumber = (num: number, decimals = 0): string => {
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Parse German number string
export const parseGermanNumber = (str: string): number | null => {
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Unit conversion
interface UnitConversion {
  factor: number;
  baseUnit: string;
}

const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Weight
  'g': { factor: 1, baseUnit: 'g' },
  'kg': { factor: 1000, baseUnit: 'g' },
  'mg': { factor: 0.001, baseUnit: 'g' },

  // Volume
  'ml': { factor: 1, baseUnit: 'ml' },
  'l': { factor: 1000, baseUnit: 'ml' },
  'cl': { factor: 10, baseUnit: 'ml' },
  'dl': { factor: 100, baseUnit: 'ml' },

  // Volume to weight approximations (for water-based liquids)
  'el': { factor: 15, baseUnit: 'ml' },
  'tl': { factor: 5, baseUnit: 'ml' },
  'esslöffel': { factor: 15, baseUnit: 'ml' },
  'teelöffel': { factor: 5, baseUnit: 'ml' },
  'tasse': { factor: 250, baseUnit: 'ml' },

  // Count
  'stk': { factor: 1, baseUnit: 'stk' },
  'stück': { factor: 1, baseUnit: 'stk' },
  'packung': { factor: 1, baseUnit: 'packung' },
  'pck': { factor: 1, baseUnit: 'packung' },
  'dose': { factor: 1, baseUnit: 'dose' },
  'glas': { factor: 1, baseUnit: 'glas' },
  'bund': { factor: 1, baseUnit: 'bund' },
  'prise': { factor: 1, baseUnit: 'prise' },
};

// Normalize unit name
const normalizeUnitName = (unit: string): string => {
  const normalized = unit.toLowerCase().trim();

  const unitAliases: Record<string, string> = {
    'gramm': 'g',
    'kilogramm': 'kg',
    'milligramm': 'mg',
    'milliliter': 'ml',
    'liter': 'l',
    'zentiliter': 'cl',
    'deziliter': 'dl',
    'esslöffel': 'el',
    'teelöffel': 'tl',
    'tassen': 'tasse',
    'stücke': 'stk',
    'packungen': 'packung',
    'päckchen': 'pck',
    'dosen': 'dose',
    'gläser': 'glas',
    'bündel': 'bund',
    'prisen': 'prise',
  };

  return unitAliases[normalized] || normalized;
};

// Convert between units
export const convertUnit = (
  amount: number,
  fromUnit: string,
  toUnit: string
): number => {
  const normalizedFrom = normalizeUnitName(fromUnit);
  const normalizedTo = normalizeUnitName(toUnit);

  // Same unit, no conversion needed
  if (normalizedFrom === normalizedTo) {
    return amount;
  }

  const fromConversion = UNIT_CONVERSIONS[normalizedFrom];
  const toConversion = UNIT_CONVERSIONS[normalizedTo];

  if (!fromConversion || !toConversion) {
    throw new Error(`Cannot convert from "${fromUnit}" to "${toUnit}"`);
  }

  // Must have same base unit
  if (fromConversion.baseUnit !== toConversion.baseUnit) {
    throw new Error(
      `Incompatible units: "${fromUnit}" and "${toUnit}" have different base units`
    );
  }

  // Convert to base unit then to target unit
  const baseAmount = amount * fromConversion.factor;
  return baseAmount / toConversion.factor;
};

// Check if units are convertible
export const areUnitsConvertible = (unitA: string, unitB: string): boolean => {
  try {
    const normalizedA = normalizeUnitName(unitA);
    const normalizedB = normalizeUnitName(unitB);

    if (normalizedA === normalizedB) return true;

    const conversionA = UNIT_CONVERSIONS[normalizedA];
    const conversionB = UNIT_CONVERSIONS[normalizedB];

    if (!conversionA || !conversionB) return false;

    return conversionA.baseUnit === conversionB.baseUnit;
  } catch {
    return false;
  }
};

// Format duration in minutes to readable string
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} Min.`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} Std.`;
  }

  return `${hours} Std. ${remainingMinutes} Min.`;
};

// Parse duration string to minutes
export const parseDurationString = (str: string): number | null => {
  // Match patterns like "1h 30m", "90 min", "1.5 hours"
  const patterns = [
    /(\d+)\s*h(?:ou)?r?s?\s*(\d+)\s*m(?:in)?/i,
    /(\d+)\s*stunden?\s*(\d+)\s*minuten?/i,
    /(\d+)\s*std?\.?\s*(\d+)\s*min\.?/i,
    /(\d+)\s*minuten?/i,
    /(\d+)\s*min\.?/i,
    /(\d+[.,]\d+)\s*h(?:ou)?r?s?/i,
    /(\d+[.,]\d+)\s*stunden?/i,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      if (match[2]) {
        // Hours and minutes
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
      } else if (str.toLowerCase().includes('h') || str.toLowerCase().includes('std')) {
        // Just hours (possibly decimal)
        const hours = parseFloat(match[1].replace(',', '.'));
        return Math.round(hours * 60);
      } else {
        // Just minutes
        return parseInt(match[1], 10);
      }
    }
  }

  return null;
};

// Format date to German locale
export const formatDate = (date: Date | number, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'number' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };

  return d.toLocaleDateString('de-DE', defaultOptions);
};

// Format time to German locale
export const formatTime = (date: Date | number, includeSeconds = false): string => {
  const d = typeof date === 'number' ? new Date(date) : date;

  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  });
};

// Format date and time
export const formatDateTime = (date: Date | number): string => {
  return `${formatDate(date)}, ${formatTime(date)}`;
};

// Get relative time string (e.g., "vor 5 Minuten")
export const getRelativeTimeString = (date: Date | number): string => {
  const now = Date.now();
  const then = typeof date === 'number' ? date : date.getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'gerade eben';
  } else if (minutes < 60) {
    return `vor ${minutes} Min.`;
  } else if (hours < 24) {
    return `vor ${hours} Std.`;
  } else if (days < 7) {
    return `vor ${days} Tagen`;
  } else {
    return formatDate(date);
  }
};

// Debounce function
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Base64 to Blob
export const base64ToBlob = (base64: string, mimeType = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// Download file
export const downloadFile = (content: string | Blob, filename: string, mimeType?: string): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType || 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Read from clipboard
export const readFromClipboard = async (): Promise<string | null> => {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
};

// Group array by key
export const groupBy = <T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    result[key] = result[key] || [];
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
};

// Sort array by multiple criteria
export const sortBy = <T>(
  array: T[],
  ...criteria: Array<{ key: keyof T; order?: 'asc' | 'desc' }>
): T[] => {
  return [...array].sort((a, b) => {
    for (const { key, order = 'asc' } of criteria) {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) continue;

      const comparison = aVal < bVal ? -1 : 1;
      return order === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
};

// Chunk array into smaller arrays
export const chunk = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// Remove duplicates from array
export const unique = <T>(array: T[], keyFn?: (item: T) => unknown): T[] => {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set<unknown>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Shuffle array (Fisher-Yates algorithm)
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Get random item from array
export const sample = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
};

// Get multiple random items
export const sampleSize = <T>(array: T[], n: number): T[] => {
  return shuffle(array).slice(0, Math.min(n, array.length));
};

// Clamp number between min and max
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

// Check if value is empty (null, undefined, empty string, empty array, empty object)
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Check if value is not empty
export const isNotEmpty = (value: unknown): boolean => !isEmpty(value);

// Capitalize first letter
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Capitalize each word
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Slugify string (for URLs)
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Truncate string with ellipsis
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

// Escape HTML special characters
export const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

// LocalStorage helpers with JSON serialization
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

export default {
  generateId,
  generateShortId,
  deepClone,
  deepMerge,
  roundToDecimals,
  formatGermanNumber,
  parseGermanNumber,
  convertUnit,
  areUnitsConvertible,
  formatDuration,
  parseDurationString,
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTimeString,
  debounce,
  throttle,
  blobToBase64,
  base64ToBlob,
  downloadFile,
  copyToClipboard,
  readFromClipboard,
  groupBy,
  sortBy,
  chunk,
  unique,
  shuffle,
  sample,
  sampleSize,
  clamp,
  isEmpty,
  isNotEmpty,
  capitalize,
  capitalizeWords,
  slugify,
  truncate,
  escapeHtml,
  storage,
};
