# KochPlan - Code Quality Report

## Zusammenfassung

| Metrik | Wert |
|--------|------|
| **Gesamtbewertung** | **7.5/10** |
| **Anzahl TypeScript-Dateien** | 69 |
| **Kritische Fehler** | 3 |
| **Warnungen** | 12 |
| **Empfehlungen** | 8 |

---

## Kritische Fehler (MUST FIX)

### 1. **Fehlende Typ-Definitionen in `types/index.ts`**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/types/index.ts`

Die zentrale Typ-Datei ist unvollständig. Es fehlen viele Typen, die in anderen Dateien importiert werden:

- `ShoppingItem`
- `Timer` (aus db.ts)
- `RecipeCollection`
- `AppSettings`
- `UserPreferences`
- `SyncState`
- `NewRecipe`, `NewShoppingList`, `NewTimer`, `NewMealPlan`
- `RecipeSearchFilters`
- `ImportResult`, `ExportOptions`
- `DayOfWeek`, `MealType`
- `ShoppingItemStatus`, `ShoppingCategory`

**Impact:** TypeScript-Compiler wird Fehler werfen beim Import dieser Typen.

**Fix:**
```typescript
// types/index.ts - Ergänzen:
export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  status: 'pending' | 'purchased' | 'skipped';
  recipeId?: number;
  recipeName?: string;
  isOptional?: boolean;
  sortOrder: number;
}

export interface RecipeCollection {
  id?: number;
  name: string;
  description?: string;
  recipeIds: number[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ... weitere fehlende Typen
```

---

### 2. **Duplizierte Typ-Definitionen**
**Dateien:** 
- `/mnt/okcomputer/output/KochPlan/src/types/index.ts`
- `/mnt/okcomputer/output/KochPlan/src/hooks/useRecipes.ts`
- `/mnt/okcomputer/output/KochPlan/src/components/ui/RecipeCard.tsx`

`Recipe`, `Ingredient`, `RecipeStep` Interfaces sind an mehreren Stellen definiert, aber mit unterschiedlichen Eigenschaften:

| Eigenschaft | types/index.ts | useRecipes.ts | RecipeCard.tsx |
|-------------|----------------|---------------|----------------|
| `image` vs `imageUrl` | image | imageUrl | image |
| `prepTime` | prepTimeMinutes | prepTime | prepTime |
| `cookTime` | cookTimeMinutes | cookTime | - |
| `difficulty` | optional | required | optional |
| `isFavorite` | - | required | optional |

**Impact:** Typ-Inkompatibilitäten bei der Verwendung dieser Interfaces.

**Fix:** Zentrale Typ-Definition in `types/index.ts` und Export für alle Module.

---

### 3. **Unvollständiger Hooks-Index**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/hooks/index.ts`

Nur 2 von 11 Hooks werden exportiert:

```typescript
// Aktuell:
export { useWakeLock } from './useWakeLock';
export { useSpeech } from './useSpeech';

// Fehlen:
// - useRecipes
// - useTimer
// - useCookingMode
// - useMealPlanner
// - useOnlineStatus
// - useRecipeImport
// - useServingsScale
// - usePWAInstall
// - useShoppingList
```

**Fix:**
```typescript
export { useRecipes, type Recipe, type RecipeFilter } from './useRecipes';
export { useTimer, type Timer, type TimerPreset } from './useTimer';
export { useCookingMode, type UseCookingModeReturn } from './useCookingMode';
// ... etc
```

---

## Warnungen (SHOULD FIX)

### W1. **Fehlende Rückgabetypen bei Funktionen**
**Dateien:** Verschiedene Komponenten

Viele Funktionen haben keine expliziten Rückgabetypen:

```typescript
// In RecipeCard.tsx - Zeile 65-74:
const handleFavoriteClick = (e: React.MouseEvent) => {  // => void fehlt
  e.stopPropagation();
  const newFavoriteState = !isFavorite;
  setIsFavorite(newFavoriteState);
  onFavoriteToggle?.(recipe.id);
};
```

**Empfohlene Fix:**
```typescript
const handleFavoriteClick = (e: React.MouseEvent): void => {
  // ...
};
```

---

### W2. **Fehlende Props-Interface-Dokumentation**
**Dateien:** Verschiedene UI-Komponenten

Einige Komponenten haben zwar Props-Interfaces, aber keine JSDoc-Kommentare:

```typescript
// Button.tsx - Gut dokumentiert
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  // ...
}

// Timer.tsx - Fehlende Beschreibungen
interface TimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  // ...
}
```

---

### W3. **Inconsistent Error Handling**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/hooks/useRecipes.ts`

```typescript
// Zeile 262-266:
} catch (err) {
  setError('Fehler beim Laden der Rezepte');  // String
}

// Zeile 274-276:
} catch (err) {
  setError('Fehler beim Speichern der Rezepte');  // String
}
```

Aber `error` ist als `string | null` typisiert - konsistent, aber `err` wird nicht verwendet.

**Empfohlener Fix:**
```typescript
} catch (err) {
  console.error('Fehler beim Laden:', err);
  setError(err instanceof Error ? err.message : 'Fehler beim Laden der Rezepte');
}
```

---

### W4. **Fehlende Null-Checks**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/pages/RecipesPage.tsx`

```typescript
// Zeile 98:
comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

// createdAt könnte undefined sein laut types/index.ts
```

---

### W5. **Unused Imports**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/App.tsx`

```typescript
import { useAppStore } from './stores/appStore';  // Existiert nicht!
```

**Datei:** `/mnt/okcomputer/output/KochPlan/src/pages/RecipesPage.tsx`

```typescript
import { Heart, Clock, ChefHat } from 'lucide-react';  // Heart und Clock werden nicht verwendet
```

---

### W6. **Fehlende Default-Exporte**
**Dateien:** Verschiedene Index-Dateien

`lib/index.ts` exportiert nicht alle verfügbaren Utilities:
```typescript
// Aktuell:
export { db, KochPlanDB, initializeDatabase } from './db';

// Fehlen:
// - utils.ts Funktionen
// - notifications.ts
// - recipe-parser.ts
// - ingredient-aggregator.ts
```

---

### W7. **Inconsistent Naming Conventions**

| Datei | Problem |
|-------|---------|
| `useRecipes.ts` | `imageUrl` statt `image` |
| `types/index.ts` | `prepTimeMinutes` statt `prepTime` |
| `db.ts` | `dietLabels` statt `diet` |

---

### W8. **Fehlende Strict Null Checks**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/components/ui/RecipeCard.tsx`

```typescript
// Zeile 62:
const [isFavorite, setIsFavorite] = useState(recipe.isFavorite ?? false);

// Gut! Aber an anderen Stellen fehlt das:
// Zeile 253:
i < recipe.rating!  // Non-null assertion - riskant
```

---

### W9. **Type Assertion statt Type Guard**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/pages/RecipesPage.tsx`

```typescript
// Zeile 81:
difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard' | undefined,

// Besser:
const isValidDifficulty = (d: string): d is 'easy' | 'medium' | 'hard' => 
  ['easy', 'medium', 'hard'].includes(d);
```

---

### W10. **Fehlende Dependency Array Einträge**
**Datei:** `/mnt/okcomputer/output/KochPlan/src/pages/RecipesPage.tsx`

```typescript
// Zeile 59-73:
useEffect(() => {
  const favoritesParam = searchParams.get('favorites');
  // ...
  if (favoritesParam === 'true') {
    setFavoritesOnly(true);
    setFilter({ ...filter, onlyFavorites: true });  // filter fehlt in deps!
  }
}, []);  // ESLint: React Hook useEffect has missing dependencies
```

---

### W11. **Fehlende Accessibility-Attribute**
**Dateien:** Verschiedene UI-Komponenten

Einige Buttons haben keine `type` Attribute:
```typescript
// RecipesPage.tsx - Zeile 238:
<button
  onClick={() => setShowFilters(!showFilters)}
  // type="button" fehlt!
>
```

---

### W12. **Inconsistent Import-Organisation**
**Dateien:** Verschiedene

Manche Dateien haben keine klare Import-Struktur:
```typescript
// Schlecht organisiert:
import React from 'react';
import { useState } from 'react';  // Doppelt!
import { something } from './local';
import { external } from 'external-lib';

// Besser:
// 1. React imports
// 2. External libraries
// 3. Internal absolute imports
// 4. Relative imports
```

---

## Empfehlungen

### R1. **TypeScript Strict Mode aktivieren**

`tsconfig.json` sollte folgende Optionen enthalten:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

### R2. **ESLint + Prettier einrichten**

`.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react/prop-types": "off"
  }
}
```

---

### R3. **Zentrale Typ-Definitionen**

Alle Typen sollten in `types/index.ts` definiert und von dort exportiert werden:

```typescript
// types/index.ts
export * from './recipe';
export * from './shopping';
export * from './meal-plan';
export * from './settings';
```

---

### R4. **Barrel Exports vervollständigen**

Alle `index.ts` Dateien sollten alle öffentlichen Exports enthalten:

```typescript
// hooks/index.ts
export * from './useRecipes';
export * from './useTimer';
export * from './useCookingMode';
// ... etc

// components/ui/index.ts
export * from './Button';
export * from './Input';
export * from './RecipeCard';
// ... etc
```

---

### R5. **Konsistente Datei-Organisation**

Jede Datei sollte folgende Struktur haben:
```typescript
/**
 * @fileoverview Kurze Beschreibung
 */

// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper Functions
// 5. Main Component/Function
// 6. Exports
```

---

### R6. **JSDoc für alle öffentlichen APIs**

```typescript
/**
 * Hook zur Verwaltung von Rezepten
 * @returns Object mit Rezepten und CRUD-Operationen
 * @example
 * const { recipes, addRecipe } = useRecipes();
 */
export function useRecipes(): UseRecipesReturn {
  // ...
}
```

---

### R7. **Unit Tests hinzufügen**

Mindestens für:
- Hooks (useRecipes, useTimer)
- Utilities (utils.ts)
- Store-Actions

---

### R8. **GitHub Actions für CI/CD**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

---

## Positive Aspekte

### TypeScript-Qualität
- ✅ Keine `any`-Types in den meisten Dateien
- ✅ Gute Verwendung von Generics (`groupBy`, `sortBy` in utils.ts)
- ✅ Korrekte Verwendung von `forwardRef`
- ✅ Gute Type-Exports mit `type` keyword

### Code-Struktur
- ✅ Konsistente Verwendung von React.FC
- ✅ Gute Komponenten-Komposition (Button, Input)
- ✅ Detaillierte Props-Interfaces in UI-Komponenten
- ✅ Kitchen Mode Unterstützung

### Best Practices
- ✅ Custom Hooks für wiederverwendbare Logik
- ✅ Zustand mit Zustand (Zustand library)
- ✅ Persistenz mit Middleware
- ✅ Selector-Hooks für Performance

### Dokumentation
- ✅ Umfangreiche JSDoc in useRecipes.ts
- ✅ Beispiele in Komponenten-Dokumentation
- ✅ Klare Kommentare für komplexe Logik

---

## Datei-Übersicht

| Kategorie | Dateien | Qualität |
|-----------|---------|----------|
| **Hooks** | 11 | Gut (8/10) |
| **Components** | 25 | Gut (7.5/10) |
| **Stores** | 3 | Sehr Gut (9/10) |
| **Types** | 1 | Mangelhaft (4/10) |
| **Utils/Lib** | 6 | Gut (8/10) |
| **Pages** | 8 | Befriedigend (6.5/10) |

---

## Handlungsempfehlungen (Priorisiert)

### Sofort (P0)
1. Fehlende Typen in `types/index.ts` ergänzen
2. Duplizierte Typ-Definitionen konsolidieren
3. Hooks-Index vervollständigen

### Kurzfristig (P1)
4. ESLint + Prettier einrichten
5. Rückgabetypen für alle Funktionen hinzufügen
6. Unused Imports bereinigen

### Mittelfristig (P2)
7. Strict Mode aktivieren
8. Unit Tests hinzufügen
9. CI/CD Pipeline einrichten

---

*Report erstellt am: $(date)*
*Überprüfte Dateien: 69 TypeScript-Dateien*
