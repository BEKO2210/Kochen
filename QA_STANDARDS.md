# KochPlan QA-Standards

## Produktionsreife Qualitätsstandards für PWA Rezept-App

---

## A) CODE-QUALITÄT

### TypeScript Strict Mode - VERPFLICHTEND

```typescript
// tsconfig.json - KEINE AUSNAHMEN
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

### VERBOTENE PATTERNS

```typescript
// ❌ VERBOTEN: any-Type
function processData(data: any): any { }

// ❌ VERBOTEN: Implicit any
function badFunction(param) { }

// ❌ VERBOTEN: @ts-ignore ohne Begründung
// @ts-ignore
const result = unsafeOperation();

// ❌ VERBOTEN: Type Assertions ohne Validierung
const user = data as User;

// ✅ ERLAUBT: Explizite Typen
function processData(data: RecipeData): ProcessedResult { }

// ✅ ERLAUBT: Generics mit Constraints
function processData<T extends RecipeData>(data: T): T { }

// ✅ ERLAUBT: Type Guards
function isUser(data: unknown): data is User {
  return data && typeof (data as User).id === 'string';
}
```

### ESLint-Regeln

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  rules: {
    // TypeScript Strict
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    
    // Import
    'import/no-default-export': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }],
    
    // Allgemein
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Naming Conventions

| Element | Konvention | Beispiel |
|---------|------------|----------|
| Komponenten | PascalCase | `RecipeCard`, `IngredientList` |
| Hooks | camelCase mit use-Präfix | `useRecipes`, `useLocalStorage` |
| Interfaces | PascalCase mit I-Präfix | `IRecipe`, `IIngredient` |
| Types | PascalCase | `RecipeType`, `UnitType` |
| Enums | PascalCase | `RecipeCategory`, `Difficulty` |
| Konstanten | UPPER_SNAKE_CASE | `MAX_INGREDIENTS`, `API_BASE_URL` |
| Funktionen | camelCase | `fetchRecipes`, `calculateTime` |
| Variablen | camelCase | `recipeList`, `isLoading` |
| Boolean-Props | is/has/can-Präfix | `isActive`, `hasError`, `canEdit` |
| Event-Handler | handle/on + Event | `handleClick`, `onRecipeSelect` |
| CSS-Klassen | kebab-case | `recipe-card`, `ingredient-item` |

### Komponenten-Struktur

```typescript
// 1. Imports (geordnet: React, extern, intern)
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RecipeService } from '@/services/RecipeService';
import { IRecipe } from '@/types/recipe.types';
import styles from './RecipeCard.module.css';

// 2. Props Interface
interface IRecipeCardProps {
  recipe: IRecipe;
  isFavorite: boolean;
  onToggleFavorite: (recipeId: string) => void;
  onRecipeClick: (recipe: IRecipe) => void;
}

// 3. Komponente
export const RecipeCard: React.FC<IRecipeCardProps> = ({
  recipe,
  isFavorite,
  onToggleFavorite,
  onRecipeClick
}) => {
  // 4. State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // 5. Hooks
  const { data: nutrition } = useQuery({
    queryKey: ['nutrition', recipe.id],
    queryFn: () => RecipeService.getNutrition(recipe.id)
  });
  
  // 6. Callbacks (memoisiert)
  const handleToggle = useCallback((): void => {
    onToggleFavorite(recipe.id);
  }, [onToggleFavorite, recipe.id]);
  
  // 7. Render
  return (
    <article className={styles.card}>
      {/* JSX */}
    </article>
  );
};

// 8. Default Export VERBOTEN - Named Export erforderlich
// export default RecipeCard; ❌
```

### Props-Interfaces - Pflichtfelder

```typescript
interface IBaseProps {
  // Jede Komponente braucht eine id für Testing/ARIA
  id?: string;
  // Klassen für Styling-Overrides
  className?: string;
  // Data-Attribute für Testing
  'data-testid'?: string;
}

interface IRecipeCardProps extends IBaseProps {
  // Pflicht-Props zuerst
  recipe: IRecipe;
  
  // Optional-Props mit Default
  isFavorite?: boolean;
  showNutrition?: boolean;
  
  // Callbacks
  onToggleFavorite?: (recipeId: string) => void;
  onRecipeClick?: (recipe: IRecipe) => void;
  
  // Children nur wenn nötig
  children?: React.ReactNode;
}
```

---

## B) TESTING-KRITERIEN

### Test-Abdeckungsziele

| Test-Typ | Mindestabdeckung | Verantwortlich |
|----------|------------------|----------------|
| Unit-Tests (Hooks/Utils) | 90% | Entwickler |
| Komponenten-Tests | 80% | Entwickler |
| Integration-Tests | 70% | QA-Team |
| E2E-Tests (kritische Flows) | 100% | QA-Team |

### Unit-Tests für Hooks

```typescript
// useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default value when key does not exist', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string>('test-key', 'default')
    );
    
    expect(result.current[0]).toBe('default');
  });

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string>('test-key', 'default')
    );
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(localStorage.getItem('test-key')).toBe('"new-value"');
  });

  it('should handle JSON parsing errors gracefully', () => {
    localStorage.setItem('test-key', 'invalid-json');
    
    const { result } = renderHook(() => 
      useLocalStorage<string>('test-key', 'fallback')
    );
    
    expect(result.current[0]).toBe('fallback');
  });
});
```

### Komponenten-Tests

```typescript
// RecipeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from './RecipeCard';
import { mockRecipe } from '@/test/mocks/recipe.mock';

describe('RecipeCard', () => {
  const defaultProps = {
    recipe: mockRecipe,
    isFavorite: false,
    onToggleFavorite: jest.fn(),
    onRecipeClick: jest.fn()
  };

  it('renders recipe title and image', () => {
    render(<RecipeCard {...defaultProps} />);
    
    expect(screen.getByText(mockRecipe.title)).toBeInTheDocument();
    expect(screen.getByAltText(mockRecipe.title)).toBeInTheDocument();
  });

  it('calls onRecipeClick when card is clicked', () => {
    render(<RecipeCard {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('recipe-card'));
    
    expect(defaultProps.onRecipeClick).toHaveBeenCalledWith(mockRecipe);
  });

  it('toggles favorite state on button click', () => {
    render(<RecipeCard {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Zu Favoriten hinzufügen'));
    
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith(mockRecipe.id);
  });

  it('is accessible via keyboard', () => {
    render(<RecipeCard {...defaultProps} />);
    
    const card = screen.getByTestId('recipe-card');
    card.focus();
    
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
```

### Integration-Tests für Features

```typescript
// RecipeSearch.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecipeSearch } from './RecipeSearch';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('RecipeSearch Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  it('searches and displays recipes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RecipeSearch />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Rezept suchen...'), {
      target: { value: 'pasta' }
    });
    
    fireEvent.click(screen.getByText('Suchen'));

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    server.use(
      rest.get('/api/recipes', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <RecipeSearch />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText('Suchen'));

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Rezepte')).toBeInTheDocument();
    });
  });
});
```

### Test-Naming-Konventionen

```typescript
// Pattern: should [expected behavior] when [condition]
describe('ComponentName', () => {
  it('should display recipe title when data is loaded');
  it('should show loading spinner while fetching data');
  it('should render error message when API returns 500');
  it('should disable submit button when form is invalid');
  it('should call onSubmit with form values when submitted');
});
```

---

## C) PERFORMANCE-GATES

### Lighthouse-Schwellenwerte

| Metrik | Minimum | Ziel | Status |
|--------|---------|------|--------|
| Performance | ≥85 | ≥90 | 🔴 Blocker |
| PWA | ≥90 | ≥95 | 🔴 Blocker |
| Accessibility | ≥95 | 100 | 🔴 Blocker |
| Best Practices | ≥90 | ≥95 | 🟡 Warning |
| SEO | ≥90 | ≥95 | 🟡 Warning |

### Core Web Vitals

| Metrik | Minimum | Ziel | Messung |
|--------|---------|------|---------|
| First Contentful Paint (FCP) | <1.8s | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | <2.0s | Lighthouse |
| First Input Delay (FID) | <100ms | <50ms | RUM |
| Time to Interactive (TTI) | <3.8s | <3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | <0.05 | Lighthouse |
| Total Blocking Time (TBT) | <200ms | <150ms | Lighthouse |

### Performance-Budget

```javascript
// bundle-analyzer.config.js
module.exports = {
  budgets: [
    { type: 'bundle', name: 'main', maximumWarning: '150kb', maximumError: '200kb' },
    { type: 'bundle', name: 'vendor', maximumWarning: '250kb', maximumError: '300kb' },
    { type: 'asset', name: '*.css', maximumWarning: '20kb', maximumError: '30kb' },
    { type: 'asset', name: '*.jpg', maximumWarning: '100kb', maximumError: '150kb' },
    { type: 'asset', name: '*.png', maximumWarning: '50kb', maximumError: '75kb' }
  ]
};
```

### Lazy Loading Pflicht

```typescript
// Jede Route lazy laden
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const ShoppingList = lazy(() => import('./pages/ShoppingList'));

// Bilder lazy laden
<img 
  src={recipe.image} 
  loading="lazy" 
  alt={recipe.title}
  width={400}
  height={300}
/>

// Komponenten lazy laden
const NutritionChart = lazy(() => import('./NutritionChart'));
```

### Caching-Strategie

```javascript
// service-worker.js
const CACHE_STRATEGIES = {
  // App Shell: Cache First
  '/': new CacheFirst({
    cacheName: 'app-shell',
    expiration: { maxAgeSeconds: 7 * 24 * 60 * 60 }
  }),
  
  // API-Daten: Stale While Revalidate
  '/api/recipes': new StaleWhileRevalidate({
    cacheName: 'api-cache',
    expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }
  }),
  
  // Bilder: Cache First mit Fallback
  '/images/': new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
};
```

---

## D) ACCESSIBILITY

### ARIA-Labels - Pflicht

```tsx
// ❌ VERBOTEN: Unbeschriftete Buttons
<button onClick={handleDelete}>🗑️</button>

// ✅ ERFORDERLICH: Beschreibende Labels
<button 
  onClick={handleDelete}
  aria-label="Rezept Pasta Carbonara löschen"
>
  🗑️
</button>

// ✅ ERFORDERLICH: ARIA für komplexe Komponenten
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Rezept teilen</h2>
  {/* Content */}
</div>

// ✅ ERFORDERLICH: Live-Regionen für Updates
<div aria-live="polite" aria-atomic="true">
  {notification && <p>{notification.message}</p>}
</div>
```

### Keyboard Navigation

```tsx
// ✅ ERFORDERLICH: Fokus-Management
const Modal: React.FC = () => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    // Fokus beim Öffnen setzen
    firstFocusableRef.current?.focus();
    
    // Fokus-Trap
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        // Fokus innerhalb Modal halten
        trapFocus(e, modalRef.current);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return <div ref={modalRef}>{/* Content */}</div>;
};
```

### Screen Reader Support

```tsx
// ✅ ERFORDERLICH: Semantisches HTML
<nav aria-label="Hauptnavigation">
  <ul>
    <li><a href="/" aria-current="page">Startseite</a></li>
    <li><a href="/recipes">Rezepte</a></li>
  </ul>
</nav>

<main>
  <h1>Meine Rezepte</h1>
  
  <section aria-labelledby="favorites-heading">
    <h2 id="favorites-heading">Favoriten</h2>
    {/* Content */}
  </section>
</main>

// ✅ ERFORDERLICH: Alt-Texte für Bilder
<img 
  src={recipe.image} 
  alt={`Fertiges Gericht: ${recipe.title}`}
  width={400}
  height={300}
/>

// ✅ ERFORDERLICH: Formular-Labels
<label htmlFor="recipe-title">Rezepttitel</label>
<input 
  id="recipe-title"
  type="text"
  aria-required="true"
  aria-describedby="title-error"
/>
<span id="title-error" role="alert">Titel ist erforderlich</span>
```

### Farbkontrast (WCAG AA)

| Element | Mindestkontrast | Beispiel |
|---------|-----------------|----------|
| Normaler Text | 4.5:1 | `#000000` auf `#FFFFFF` = 21:1 ✅ |
| Großer Text (18pt+) | 3:1 | `#757575` auf `#FFFFFF` = 4.6:1 ✅ |
| UI-Komponenten | 3:1 | Button-Rand, Fokus-Indikatoren |
| Grafiken | 3:1 | Icons, Diagramme |

```css
/* ✅ ERFORDERLICH: Fokus-Indikatoren sichtbar */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ❌ VERBOTEN: Outline entfernen */
button:focus {
  outline: none; /* NIEMALS! */
}
```

---

## E) MOBILE-OPTIMIERUNG

### Touch-Targets

```css
/* ✅ ERFORDERLICH: Mindestgröße 48x48px */
.touch-target {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 16px;
}

/* ✅ ERFORDERLICH: Ausreichender Abstand */
.button-group {
  display: flex;
  gap: 8px; /* Minimum 8px zwischen Touch-Targets */
}

/* ✅ ERFORDERLICH: Größere Targets für wichtige Aktionen */
.primary-action {
  min-height: 56px;
  padding: 16px 24px;
}
```

### Viewport-Konfiguration

```html
<!-- ✅ ERFORDERLICH in index.html -->
<meta name="viewport" 
      content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- ✅ ERFORDERLICH: Theme Color -->
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
```

### Safe Areas für Notch

```css
/* ✅ ERFORDERLICH: Safe Area Support */
.app-header {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.app-footer {
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* ✅ ERFORDERLICH: Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--background);
}
```

### PWA-Manifest

```json
{
  "name": "KochPlan - Dein Rezeptplaner",
  "short_name": "KochPlan",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ff6b35",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "screenshots": [
    {
      "src": "/screenshot-1.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-2.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### Offline-Fähigkeit

```typescript
// ✅ ERFORDERLICH: Offline-Indikator
const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <div role="status" aria-live="polite" className="offline-banner">
      Du bist offline. Einige Funktionen sind eingeschränkt.
    </div>
  );
};

// ✅ ERFORDERLICH: Daten-Synchronisation
const useRecipeSync = (): void => {
  const { data: offlineRecipes } = useOfflineRecipes();
  const syncMutation = useSyncRecipes();
  
  useEffect(() => {
    const handleOnline = (): void => {
      if (offlineRecipes.length > 0) {
        syncMutation.mutate(offlineRecipes);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineRecipes, syncMutation]);
};
```

---

## Qualitäts-Gates vor Merge

| Gate | Prüfung | Blockiert Merge |
|------|---------|-----------------|
| 1 | TypeScript strict kompiliert | ✅ Ja |
| 2 | ESLint keine Errors | ✅ Ja |
| 3 | Alle Tests bestehen | ✅ Ja |
| 4 | Testabdeckung ≥80% | ✅ Ja |
| 5 | Lighthouse Performance ≥85 | ✅ Ja |
| 6 | Lighthouse PWA ≥90 | ✅ Ja |
| 7 | Lighthouse A11y ≥95 | ✅ Ja |
| 8 | Bundle-Size unter Budget | ✅ Ja |
| 9 | Code-Review approved | ✅ Ja |
| 10 | Keine Konflikte | ✅ Ja |

---

*Version: 1.0 | Letzte Aktualisierung: 2024*
