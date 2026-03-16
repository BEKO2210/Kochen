# KochPlan - Feature Spezifikation

## Übersicht

**App-Name:** KochPlan  
**Typ:** Progressive Web App (PWA)  
**Zielplattform:** Mobile-first, Desktop-kompatibel  
**Offline-Fähigkeit:** Vollständig (Service Worker + IndexedDB)

---

## Inhaltsverzeichnis

1. [Architektur-Übersicht](#1-architektur-übersicht)
2. [Datenmodelle](#2-datenmodelle)
3. [Feature 1: Rezeptverwaltung](#3-feature-1-rezeptverwaltung)
4. [Feature 2: Koch-Modus](#4-feature-2-koch-modus)
5. [Feature 3: Wochenplaner](#5-feature-3-wochenplaner)
6. [Feature 4: Einkaufsliste](#6-feature-4-einkaufsliste)
7. [Feature 5: Rezept-Import](#7-feature-5-rezept-import)
8. [State Management](#8-state-management)
9. [Datenfluss-Diagramme](#9-datenfluss-diagramme)
10. [Storage-Strategie](#10-storage-strategie)

---

## 1. Architektur-Übersicht

### 1.1 Technologie-Stack

```
Frontend:     React 18 + TypeScript 5
Styling:      Tailwind CSS + shadcn/ui
State:        Zustand + Immer
Storage:      IndexedDB (Dexie.js)
PWA:          Vite PWA Plugin
Icons:        Lucide React
```

### 1.2 Layer-Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (React Components, Pages, Modals, Toast Notifications)  │
├─────────────────────────────────────────────────────────┤
│                     STATE LAYER                          │
│  (Zustand Stores, Selectors, Actions, Middleware)        │
├─────────────────────────────────────────────────────────┤
│                   SERVICE LAYER                          │
│  (RecipeService, PlannerService, ShoppingService,        │
│   ImportService, TimerService, SpeechService)            │
├─────────────────────────────────────────────────────────┤
│                   STORAGE LAYER                          │
│  (IndexedDB Adapter, Blob Storage, Cache Manager)        │
├─────────────────────────────────────────────────────────┤
│                   UTILITY LAYER                          │
│  (Unit Converter, Timer Parser, URL Parser, Validators)  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Datenmodelle

### 2.1 Core Interfaces

#### Recipe (Haupt-Rezept)

```typescript
interface Recipe {
  // Identifikation
  id: string;                    // UUID v4
  
  // Basis-Informationen
  title: string;                 // max 200 Zeichen
  description: string;           // max 2000 Zeichen
  
  // Kategorisierung
  category: RecipeCategory;      // enum
  tags: string[];                // max 10 Tags
  cuisine: string;               // z.B. "italienisch", "asiatisch"
  difficulty: DifficultyLevel;   // enum
  
  // Zeit-Informationen
  prepTime: number;              // Minuten (Vorbereitung)
  cookTime: number;              // Minuten (Kochen)
  restTime: number;              // Minuten (Ruhezeit)
  totalTime: number;             // Berechnet: prep + cook + rest
  
  // Portionen
  servings: number;              // Standard-Portionen
  servingUnit: string;           // "Personen", "Stück", "Portionen"
  
  // Beziehungen
  ingredients: Ingredient[];     // Zutaten-Liste
  steps: CookingStep[];          // Zubereitungsschritte
  
  // Medien
  imageBlob?: Blob;              // Bild als Blob
  imageUrl?: string;             // Data-URL für Anzeige
  thumbnailUrl?: string;         // Komprimierte Vorschau
  
  // Metadaten
  isFavorite: boolean;
  rating: number;                // 1-5 Sterne
  notes: string;                 // Persönliche Notizen
  source?: string;               // URL oder Quellenangabe
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastCooked?: Date;
  cookCount: number;             // Wie oft gekocht
}

enum RecipeCategory {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DESSERT = 'dessert',
  DRINK = 'drink',
  BAKING = 'baking',
  OTHER = 'other'
}

enum DifficultyLevel {
  EASY = 1,      // Anfänger
  MEDIUM = 2,    // Fortgeschritten
  HARD = 3       // Profi
}
```

#### Ingredient (Zutat)

```typescript
interface Ingredient {
  id: string;                    // UUID
  
  // Basis
  name: string;                  // z.B. "Mehl"
  amount: number;                // Menge (kann dezimal sein)
  unit: Unit;                    // Einheit
  
  // Optional
  category: IngredientCategory;  // Für Einkaufsliste
  notes?: string;                // z.B. "fein gehackt"
  isOptional: boolean;           // Optionale Zutat?
  
  // Für Einkaufsliste
  alternativeNames?: string[];   // Synonyme für Matching
  defaultStoreSection: StoreSection;
}

enum Unit {
  // Gewicht
  GRAM = 'g',
  KILOGRAM = 'kg',
  
  // Volumen
  MILLILITER = 'ml',
  LITER = 'l',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
  CUP = 'cup',
  FLUID_OUNCE = 'fl_oz',
  
  // Stück
  PIECE = 'pc',
  PINCH = 'pinch',
  CLOVE = 'clove',
  SLICE = 'slice',
  CAN = 'can',
  PACKAGE = 'pkg',
  BUNCH = 'bunch',
  
  // Längen
  CENTIMETER = 'cm',
  MILLIMETER = 'mm',
  
  // Ohne Einheit
  NONE = 'none'
}

enum IngredientCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  MEAT = 'meat',
  FISH = 'fish',
  DAIRY = 'dairy',
  EGGS = 'eggs',
  BAKERY = 'bakery',
  GRAINS = 'grains',
  PASTA = 'pasta',
  CANNED = 'canned',
  FROZEN = 'frozen',
  SPICES = 'spices',
  HERBS = 'herbs',
  OILS = 'oils',
  SAUCES = 'sauces',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  OTHER = 'other'
}

enum StoreSection {
  PRODUCE = 'produce',           // Obst & Gemüse
  MEAT = 'meat',                 // Fleisch & Fisch
  DAIRY = 'dairy',               // Milchprodukte
  BAKERY = 'bakery',             // Brot & Gebäck
  DRY_GOODS = 'dry_goods',       // Trockenwaren
  CANNED = 'canned',             // Konserven
  FROZEN = 'frozen',             // Tiefkühl
  SPICES = 'spices',             // Gewürze
  BEVERAGES = 'beverages',       // Getränke
  HOUSEHOLD = 'household',       // Haushalt
  OTHER = 'other'
}
```

#### CookingStep (Zubereitungsschritt)

```typescript
interface CookingStep {
  id: string;                    // UUID
  order: number;                 // Reihenfolge (0-basiert)
  
  // Inhalt
  instruction: string;           // Anweisungstext
  
  // Timer (optional)
  timer?: {
    duration: number;            // Sekunden
    label: string;               // Timer-Name
    isAutoStart: boolean;        // Automatisch starten?
  };
  
  // Zutaten für diesen Schritt
  ingredients?: string[];        // IDs der benötigten Zutaten
  
  // Medien
  imageUrl?: string;             // Schritt-Bild
  
  // Tipps
  tip?: string;                  // Zusatzhinweis
}
```

### 2.2 Wochenplaner Interfaces

```typescript
interface WeeklyPlan {
  id: string;                    // UUID
  weekStart: Date;               // Montag der Woche
  name?: string;                 // Optionaler Name
  isTemplate: boolean;           // Als Vorlage speichern?
  
  // 7 Tage × 4 Slots
  days: DayPlan[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface DayPlan {
  date: Date;                    // Konkretes Datum
  dayOfWeek: number;             // 0 = Sonntag, 1 = Montag...
  
  // Mahlzeiten-Slots
  slots: {
    [MealSlot.BREAKFAST]?: PlannedMeal;
    [MealSlot.LUNCH]?: PlannedMeal;
    [MealSlot.DINNER]?: PlannedMeal;
    [MealSlot.SNACK]?: PlannedMeal;
  };
}

interface PlannedMeal {
  recipeId: string;              // Referenz zu Recipe
  servings: number;              // Angepasste Portionen
  notes?: string;                // Zusatznotizen
  isDone: boolean;               // Bereits gekocht?
}

enum MealSlot {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}
```

### 2.3 Einkaufsliste Interfaces

```typescript
interface ShoppingList {
  id: string;
  name: string;                  // z.B. "Einkaufsliste KW 42"
  weekPlanId?: string;           // Verknüpfter Wochenplan
  
  // Gruppiert nach Abteilungen
  sections: ShoppingSection[];
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

interface ShoppingSection {
  storeSection: StoreSection;
  items: ShoppingItem[];
  isCollapsed: boolean;
}

interface ShoppingItem {
  id: string;
  
  // Referenz (optional)
  ingredientId?: string;         // Original-Zutat
  recipeIds: string[];           // Aus welchen Rezepten?
  
  // Anzeige
  name: string;
  displayAmount: string;         // Formatierter Betrag
  originalAmounts: {             // Für Debugging/Details
    recipeId: string;
    amount: number;
    unit: Unit;
    servings: number;
  }[];
  
  // Status
  isChecked: boolean;
  isManuallyAdded: boolean;      // Nicht aus Rezept?
  
  // Kategorie für Sortierung
  category: IngredientCategory;
}
```

### 2.4 Timer Interfaces

```typescript
interface Timer {
  id: string;
  label: string;                 // Timer-Name
  duration: number;              // Gesamtdauer in Sekunden
  remaining: number;             // Verbleibende Sekunden
  
  // Status
  status: TimerStatus;
  
  // Zeitstempel
  startedAt?: Date;
  pausedAt?: Date;
  finishedAt?: Date;
  
  // Verknüpfung
  recipeId?: string;             // Aus welchem Rezept?
  stepId?: string;               // Aus welchem Schritt?
}

enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  FINISHED = 'finished'
}
```

### 2.5 Import Interfaces

```typescript
interface ImportJob {
  id: string;
  url: string;
  status: ImportStatus;
  
  // Rohdaten
  rawData?: any;                 // Geparste JSON-LD Daten
  
  // Ergebnis
  parsedRecipe?: Partial<Recipe>;
  validationErrors: string[];
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
}

enum ImportStatus {
  PENDING = 'pending',
  FETCHING = 'fetching',
  PARSING = 'parsing',
  VALIDATING = 'validating',
  READY = 'ready',
  ERROR = 'error'
}

interface ImportPreview {
  title: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  
  // Statistik
  ingredientCount: number;
  stepCount: number;
  totalTime: number;
  
  // Validierung
  warnings: string[];
  missingFields: string[];
}
```

---

## 3. Feature 1: Rezeptverwaltung

### 3.1 Übersicht

Die Rezeptverwaltung ist das Kernfeature der App. Sie ermöglicht das Erstellen, Bearbeiten, Anzeigen und Löschen von Rezepten mit allen zugehörigen Metadaten.

### 3.2 Datenmodell-Details

#### Recipe Entity

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | UUID | Ja | Eindeutige Identifikation |
| title | string | Ja | Rezept-Titel, max 200 Zeichen |
| description | string | Nein | Beschreibung, max 2000 Zeichen |
| category | enum | Ja | Kategorie des Rezepts |
| tags | string[] | Nein | Max 10 Tags für Filter |
| cuisine | string | Nein | Küche/Herkunft |
| difficulty | enum | Ja | Schwierigkeitsgrad 1-3 |
| prepTime | number | Ja | Vorbereitungszeit in Minuten |
| cookTime | number | Ja | Kochzeit in Minuten |
| restTime | number | Nein | Ruhezeit in Minuten |
| servings | number | Ja | Standard-Portionen |
| servingUnit | string | Ja | "Personen", "Stück", etc. |
| ingredients | Ingredient[] | Ja | Mindestens 1 Zutat |
| steps | CookingStep[] | Ja | Mindestens 1 Schritt |
| imageBlob | Blob | Nein | Bild als Binary |
| isFavorite | boolean | Ja | Favoriten-Status |
| rating | number | Nein | 1-5 Sterne |
| notes | string | Nein | Persönliche Notizen |
| source | string | Nein | Quellenangabe |
| createdAt | Date | Ja | Erstellungsdatum |
| updatedAt | Date | Ja | Letzte Änderung |
| lastCooked | Date | Nein | Zuletzt gekocht |
| cookCount | number | Ja | Anzahl gekocht |

### 3.3 CRUD-Operationen

#### Create Recipe

**Flow:**
1. Benutzer öffnet "Neues Rezept" Formular
2. Eingabe aller Pflichtfelder
3. Hinzufügen von Zutaten (dynamische Liste)
4. Hinzufügen von Zubereitungsschritten
5. Optional: Bild-Upload
6. Validierung
7. Speichern in IndexedDB

**Validierungsregeln:**
```typescript
const recipeValidation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  description: {
    maxLength: 2000
  },
  prepTime: {
    required: true,
    min: 0,
    max: 1440  // 24 Stunden
  },
  cookTime: {
    required: true,
    min: 0,
    max: 1440
  },
  servings: {
    required: true,
    min: 1,
    max: 100
  },
  ingredients: {
    required: true,
    minItems: 1,
    maxItems: 100
  },
  steps: {
    required: true,
    minItems: 1,
    maxItems: 50
  }
};
```

**Service-Methode:**
```typescript
class RecipeService {
  async createRecipe(recipeData: CreateRecipeDTO): Promise<Recipe> {
    // 1. Validierung
    const validation = this.validateRecipe(recipeData);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // 2. UUID generieren
    const id = generateUUID();
    
    // 3. Bild verarbeiten (falls vorhanden)
    let imageBlob: Blob | undefined;
    let thumbnailUrl: string | undefined;
    if (recipeData.imageFile) {
      imageBlob = await this.processImage(recipeData.imageFile);
      thumbnailUrl = await this.createThumbnail(imageBlob);
    }
    
    // 4. Recipe-Objekt erstellen
    const recipe: Recipe = {
      id,
      ...recipeData,
      imageBlob,
      thumbnailUrl,
      totalTime: recipeData.prepTime + recipeData.cookTime + (recipeData.restTime || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
      cookCount: 0,
      isFavorite: false
    };
    
    // 5. In IndexedDB speichern
    await db.recipes.add(recipe);
    
    return recipe;
  }
}
```

#### Read Recipe

**Abfrage-Methoden:**
```typescript
class RecipeService {
  // Einzelnes Rezept
  async getRecipe(id: string): Promise<Recipe | undefined> {
    return db.recipes.get(id);
  }
  
  // Alle Rezepte
  async getAllRecipes(): Promise<Recipe[]> {
    return db.recipes.toArray();
  }
  
  // Mit Filter
  async getRecipes(filter: RecipeFilter): Promise<Recipe[]> {
    let query = db.recipes.toCollection();
    
    if (filter.category) {
      query = query.filter(r => r.category === filter.category);
    }
    
    if (filter.isFavorite !== undefined) {
      query = query.filter(r => r.isFavorite === filter.isFavorite);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      query = query.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    
    // Sortierung
    switch (filter.sortBy) {
      case 'name':
        query = query.sortBy('title');
        break;
      case 'date':
        query = query.reverse().sortBy('createdAt');
        break;
      case 'rating':
        query = query.reverse().sortBy('rating');
        break;
      case 'lastCooked':
        query = query.reverse().sortBy('lastCooked');
        break;
    }
    
    return query.toArray();
  }
}
```

#### Update Recipe

```typescript
class RecipeService {
  async updateRecipe(
    id: string, 
    updates: Partial<Recipe>
  ): Promise<Recipe> {
    const existing = await db.recipes.get(id);
    if (!existing) {
      throw new NotFoundError(`Recipe ${id} not found`);
    }
    
    // Bild-Updates verarbeiten
    if (updates.imageFile) {
      updates.imageBlob = await this.processImage(updates.imageFile);
      updates.thumbnailUrl = await this.createThumbnail(updates.imageBlob);
    }
    
    // Zeit neu berechnen
    if (updates.prepTime || updates.cookTime || updates.restTime) {
      updates.totalTime = 
        (updates.prepTime ?? existing.prepTime) +
        (updates.cookTime ?? existing.cookTime) +
        (updates.restTime ?? existing.restTime ?? 0);
    }
    
    updates.updatedAt = new Date();
    
    await db.recipes.update(id, updates);
    return { ...existing, ...updates };
  }
}
```

#### Delete Recipe

```typescript
class RecipeService {
  async deleteRecipe(id: string): Promise<void> {
    // Prüfen ob Rezept in Wochenplänen verwendet wird
    const usages = await this.findRecipeUsages(id);
    if (usages.length > 0) {
      throw new ConflictError(
        `Recipe is used in ${usages.length} meal plans`,
        usages
      );
    }
    
    await db.recipes.delete(id);
  }
}
```

### 3.4 Portionen-Skalierung

#### Skalierungs-Algorithmus

```typescript
class PortionScaler {
  /**
   * Skaliert alle Zutaten auf neue Portionenzahl
   */
  static scaleIngredients(
    ingredients: Ingredient[],
    originalServings: number,
    targetServings: number
  ): Ingredient[] {
    const factor = targetServings / originalServings;
    
    return ingredients.map(ing => ({
      ...ing,
      amount: this.roundAmount(ing.amount * factor)
    }));
  }
  
  /**
   * Rundet Mengen sinnvoll
   */
  private static roundAmount(amount: number): number {
    // Sehr kleine Mengen: 2 Dezimalstellen
    if (amount < 1) {
      return Math.round(amount * 100) / 100;
    }
    // Kleine Mengen: 1 Dezimalstelle
    if (amount < 10) {
      return Math.round(amount * 10) / 10;
    }
    // Größere Mengen: ganze Zahlen
    return Math.round(amount);
  }
  
  /**
   * Formatiert Menge für Anzeige
   */
  static formatAmount(amount: number, unit: Unit): string {
    // Brüche für häufige Werte
    const fractionMap: Record<number, string> = {
      0.25: '¼',
      0.5: '½',
      0.75: '¾',
      0.33: '⅓',
      0.67: '⅔'
    };
    
    const tolerance = 0.02;
    for (const [value, fraction] of Object.entries(fractionMap)) {
      if (Math.abs(amount - parseFloat(value)) < tolerance) {
        return `${fraction} ${unit}`;
      }
    }
    
    // Ganze Zahl?
    if (Number.isInteger(amount)) {
      return `${amount} ${unit}`;
    }
    
    // Dezimal
    return `${amount.toFixed(1).replace('.0', '')} ${unit}`;
  }
}
```

#### UI-Komponente: Portionen-Selector

```typescript
interface PortionSelectorProps {
  servings: number;
  servingUnit: string;
  onChange: (servings: number) => void;
  min?: number;
  max?: number;
}

// Verwendung:
// - Buttons: -1, +1
// - Direkte Eingabe möglich
// - Slider für schnelle Auswahl (1-20)
```

### 3.5 Bild-Upload

#### Bild-Verarbeitung

```typescript
class ImageProcessor {
  private readonly MAX_WIDTH = 1200;
  private readonly MAX_HEIGHT = 1200;
  private readonly THUMB_WIDTH = 300;
  private readonly QUALITY = 0.85;
  
  async processImage(file: File): Promise<ProcessedImage> {
    // 1. Validierung
    if (!file.type.startsWith('image/')) {
      throw new Error('Nur Bilddateien erlaubt');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Bild zu groß (max 10MB)');
    }
    
    // 2. Bild laden
    const img = await this.loadImage(file);
    
    // 3. Hauptbild skalieren
    const mainBlob = await this.resizeImage(img, {
      maxWidth: this.MAX_WIDTH,
      maxHeight: this.MAX_HEIGHT,
      quality: this.QUALITY
    });
    
    // 4. Thumbnail erstellen
    const thumbBlob = await this.resizeImage(img, {
      maxWidth: this.THUMB_WIDTH,
      maxHeight: this.THUMB_WIDTH,
      quality: 0.7
    });
    
    // 5. Data-URLs für Anzeige
    const mainUrl = URL.createObjectURL(mainBlob);
    const thumbUrl = URL.createObjectURL(thumbBlob);
    
    return {
      mainBlob,
      thumbBlob,
      mainUrl,
      thumbUrl
    };
  }
  
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  
  private async resizeImage(
    img: HTMLImageElement,
    options: ResizeOptions
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Seitenverhältnis berechnen
    let { width, height } = img;
    const ratio = Math.min(
      options.maxWidth / width,
      options.maxHeight / height,
      1  // Nie vergrößern
    );
    
    width *= ratio;
    height *= ratio;
    
    canvas.width = width;
    canvas.height = height;
    
    // Bild zeichnen
    ctx.drawImage(img, 0, 0, width, height);
    
    // Als Blob exportieren
    return new Promise(resolve => {
      canvas.toBlob(
        blob => resolve(blob!),
        'image/jpeg',
        options.quality
      );
    });
  }
}
```

#### IndexedDB Speicherung

```typescript
// Dexie Schema
class KochPlanDB extends Dexie {
  recipes!: Table<Recipe>;
  
  constructor() {
    super('KochPlanDB');
    
    this.version(1).stores({
      recipes: 'id, title, category, isFavorite, createdAt, *tags'
    });
  }
}

// Blob-Speicherung
// - Bilder werden als Blob in IndexedDB gespeichert
// - Für Anzeige werden Object URLs erstellt
// - Thumbnails für Listen-Ansicht
```

### 3.6 Favoriten & Bewertung

```typescript
class RecipeFavoritesService {
  async toggleFavorite(recipeId: string): Promise<boolean> {
    const recipe = await db.recipes.get(recipeId);
    if (!recipe) throw new NotFoundError();
    
    const newStatus = !recipe.isFavorite;
    await db.recipes.update(recipeId, { isFavorite: newStatus });
    
    return newStatus;
  }
  
  async setRating(recipeId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating muss zwischen 1 und 5 sein');
    }
    
    await db.recipes.update(recipeId, { rating });
  }
  
  async getFavorites(): Promise<Recipe[]> {
    return db.recipes
      .where('isFavorite')
      .equals(1)
      .toArray();
  }
}
```

### 3.7 Notizen

```typescript
interface RecipeNotes {
  recipeId: string;
  notes: string;           // Markdown unterstützt
  lastModified: Date;
}

// Features:
// - Rich-Text Editor (einfach)
// - Auto-Save (500ms Debounce)
// - Zeichenlimit: 5000
```

---

## 4. Feature 2: Koch-Modus

### 4.1 Übersicht

Der Koch-Modus bietet eine optimierte, ablenkungsfreie Ansicht für die Zubereitung von Rezepten mit Schritt-für-Schritt Navigation, Timern und Sprachausgabe.

### 4.2 Schritt-für-Schritt Navigation

#### State-Management

```typescript
interface CookingSession {
  recipeId: string;
  startedAt: Date;
  
  // Navigation
  currentStepIndex: number;
  completedSteps: string[];      // IDs der abgeschlossenen Schritte
  
  // Portionen
  scaledServings: number;
  
  // Timer
  activeTimers: Timer[];
  
  // Zutaten-Checklist
  checkedIngredients: string[];  // IDs der abgehakten Zutaten
}
```

#### Navigation-Logik

```typescript
class CookingModeService {
  private session: CookingSession | null = null;
  
  startCooking(recipe: Recipe, servings: number): CookingSession {
    this.session = {
      recipeId: recipe.id,
      startedAt: new Date(),
      currentStepIndex: 0,
      completedSteps: [],
      scaledServings: servings,
      activeTimers: [],
      checkedIngredients: []
    };
    
    // Wake Lock aktivieren
    this.enableWakeLock();
    
    return this.session;
  }
  
  nextStep(): boolean {
    if (!this.session) return false;
    
    const recipe = this.getCurrentRecipe();
    if (this.session.currentStepIndex < recipe.steps.length - 1) {
      // Aktuellen Schritt als erledigt markieren
      const currentStep = recipe.steps[this.session.currentStepIndex];
      this.session.completedSteps.push(currentStep.id);
      
      // Weiter
      this.session.currentStepIndex++;
      return true;
    }
    return false;
  }
  
  previousStep(): boolean {
    if (!this.session || this.session.currentStepIndex <= 0) {
      return false;
    }
    
    this.session.currentStepIndex--;
    
    // Aus erledigt entfernen
    const step = this.getCurrentRecipe().steps[this.session.currentStepIndex];
    this.session.completedSteps = this.session.completedSteps.filter(
      id => id !== step.id
    );
    
    return true;
  }
  
  goToStep(index: number): boolean {
    if (!this.session) return false;
    const recipe = this.getCurrentRecipe();
    
    if (index >= 0 && index < recipe.steps.length) {
      // Alle dazwischen als erledigt markieren
      for (let i = this.session.currentStepIndex; i < index; i++) {
        this.session.completedSteps.push(recipe.steps[i].id);
      }
      
      this.session.currentStepIndex = index;
      return true;
    }
    return false;
  }
  
  finishCooking(): void {
    if (!this.session) return;
    
    // Statistik aktualisieren
    this.updateRecipeStats();
    
    // Wake Lock freigeben
    this.disableWakeLock();
    
    // Session beenden
    this.session = null;
  }
}
```

#### UI-Komponente: StepViewer

```typescript
interface StepViewerProps {
  step: CookingStep;
  stepNumber: number;
  totalSteps: number;
  ingredients: Ingredient[];     // Für diesen Schritt relevant
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
}

// Features:
// - Große, lesbare Schrift
// - Swipe-Gesten für Navigation
// - Fortschrittsbalken
// - Schritt-Nummer-Anzeige (z.B. "Schritt 3 von 8")
// - Zutaten-Highlighting (Zutaten im Text verlinken)
```

### 4.3 Timer-Integration

#### Timer-Erkennung

```typescript
class TimerParser {
  // Regex-Patterns für Zeitangaben
  private patterns = [
    // "30 Minuten", "30 Min.", "30min"
    /(\d+)\s*(?:Minuten|Min\.?|min)/gi,
    
    // "2 Stunden", "2 Std.", "2h"
    /(\d+)\s*(?:Stunden|Std\.?|h)/gi,
    
    // "1:30" (Stunden:Minuten)
    /(\d+):(\d{2})/g,
    
    // "30 Sekunden", "30s"
    /(\d+)\s*(?:Sekunden|Sek\.?|s)/gi,
    
    // "eine halbe Stunde"
    /(?:eine?\s+)?halbe?\s+Stunde/gi,
    
    // "eine Stunde"
    /eine?\s+Stunde/gi
  ];
  
  parseTimers(text: string): ParsedTimer[] {
    const timers: ParsedTimer[] = [];
    
    // Minuten
    const minRegex = /(\d+)\s*(?:Minuten|Min\.?|min)/gi;
    let match;
    while ((match = minRegex.exec(text)) !== null) {
      timers.push({
        duration: parseInt(match[1]) * 60,
        label: `${match[1]} Minuten`,
        position: match.index
      });
    }
    
    // Stunden
    const hourRegex = /(\d+)\s*(?:Stunden|Std\.?|h)/gi;
    while ((match = hourRegex.exec(text)) !== null) {
      timers.push({
        duration: parseInt(match[1]) * 3600,
        label: `${match[1]} Stunden`,
        position: match.index
      });
    }
    
    // Kombinierte Angaben (z.B. "1 Stunde 30 Minuten")
    const combinedRegex = /(\d+)\s*(?:Stunden|Std\.?|h)\s*(?:und\s*)?(\d+)\s*(?:Minuten|Min\.?|min)/gi;
    while ((match = combinedRegex.exec(text)) !== null) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      timers.push({
        duration: hours * 3600 + minutes * 60,
        label: `${hours}:${minutes.toString().padStart(2, '0')} Stunden`,
        position: match.index
      });
    }
    
    return timers;
  }
}
```

#### Timer-Service

```typescript
class TimerService extends EventEmitter {
  private timers: Map<string, Timer> = new Map();
  private intervals: Map<string, number> = new Map();
  
  createTimer(
    duration: number,
    label: string,
    options: {
      recipeId?: string;
      stepId?: string;
      autoStart?: boolean;
    } = {}
  ): Timer {
    const timer: Timer = {
      id: generateUUID(),
      label,
      duration,
      remaining: duration,
      status: TimerStatus.IDLE,
      recipeId: options.recipeId,
      stepId: options.stepId
    };
    
    this.timers.set(timer.id, timer);
    
    if (options.autoStart) {
      this.startTimer(timer.id);
    }
    
    return timer;
  }
  
  startTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer || timer.status === TimerStatus.RUNNING) return;
    
    timer.status = TimerStatus.RUNNING;
    timer.startedAt = new Date();
    
    // Intervall starten (jede Sekunde)
    const intervalId = window.setInterval(() => {
      this.tick(timerId);
    }, 1000);
    
    this.intervals.set(timerId, intervalId);
    
    this.emit('timerStarted', timer);
  }
  
  private tick(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;
    
    timer.remaining--;
    
    if (timer.remaining <= 0) {
      this.finishTimer(timerId);
    } else {
      this.emit('timerTick', timer);
    }
  }
  
  pauseTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer || timer.status !== TimerStatus.RUNNING) return;
    
    timer.status = TimerStatus.PAUSED;
    timer.pausedAt = new Date();
    
    // Intervall stoppen
    const intervalId = this.intervals.get(timerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(timerId);
    }
    
    this.emit('timerPaused', timer);
  }
  
  resumeTimer(timerId: string): void {
    this.startTimer(timerId);
  }
  
  stopTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;
    
    // Intervall stoppen
    const intervalId = this.intervals.get(timerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(timerId);
    }
    
    timer.status = TimerStatus.IDLE;
    timer.remaining = timer.duration;
    
    this.emit('timerStopped', timer);
  }
  
  private finishTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;
    
    // Intervall stoppen
    const intervalId = this.intervals.get(timerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(timerId);
    }
    
    timer.status = TimerStatus.FINISHED;
    timer.finishedAt = new Date();
    timer.remaining = 0;
    
    // Benachrichtigung
    this.showNotification(timer);
    this.playAlarmSound();
    
    this.emit('timerFinished', timer);
  }
  
  private showNotification(timer: Timer): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer abgelaufen!', {
        body: timer.label,
        icon: '/icons/timer.png',
        requireInteraction: true
      });
    }
  }
  
  private playAlarmSound(): void {
    const audio = new Audio('/sounds/timer-alarm.mp3');
    audio.play().catch(() => {
      // Fallback: Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
    });
  }
  
  getAllTimers(): Timer[] {
    return Array.from(this.timers.values());
  }
  
  getActiveTimers(): Timer[] {
    return this.getAllTimers().filter(
      t => t.status === TimerStatus.RUNNING
    );
  }
  
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
```

#### Multiple Timer UI

```typescript
interface TimerOverlayProps {
  timers: Timer[];
  onTimerAction: (timerId: string, action: 'start' | 'pause' | 'stop') => void;
}

// Features:
// - Floating Timer-Panel
// - Minimierbar
// - Für jeden Timer: Play/Pause/Stop
// - Fortschrittsbalken
// - Zeit-Anzeige
```

### 4.4 Wake Lock API

```typescript
class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = 'wakeLock' in navigator;
  }
  
  async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Wake Lock API nicht unterstützt');
      return false;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock freigegeben');
        this.wakeLock = null;
      });
      
      return true;
    } catch (err) {
      console.error('Wake Lock konnte nicht aktiviert werden:', err);
      return false;
    }
  }
  
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
  
  // Re-acquire wenn Tab wieder sichtbar wird
  async handleVisibilityChange(): Promise<void> {
    if (this.wakeLock !== null && document.visibilityState === 'visible') {
      await this.requestWakeLock();
    }
  }
}
```

### 4.5 Web Speech API

```typescript
class SpeechService {
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = 'speechSynthesis' in window;
    this.synthesis = window.speechSynthesis;
  }
  
  speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech API nicht unterstützt'));
        return;
      }
      
      // Vorherige Sprache stoppen
      this.stop();
      
      this.utterance = new SpeechSynthesisUtterance(text);
      
      // Spracheinstellungen
      this.utterance.lang = options.lang || 'de-DE';
      this.utterance.rate = options.rate || 1.0;      // 0.1 - 10
      this.utterance.pitch = options.pitch || 1.0;    // 0 - 2
      this.utterance.volume = options.volume || 1.0;  // 0 - 1
      
      // Stimme auswählen
      if (options.voice) {
        this.utterance.voice = options.voice;
      } else {
        const voices = this.synthesis.getVoices();
        const germanVoice = voices.find(v => v.lang.startsWith('de'));
        if (germanVoice) {
          this.utterance.voice = germanVoice;
        }
      }
      
      this.utterance.onend = () => {
        this.utterance = null;
        resolve();
      };
      
      this.utterance.onerror = (event) => {
        reject(new Error(`Speech error: ${event.error}`));
      };
      
      this.synthesis.speak(this.utterance);
    });
  }
  
  stop(): void {
    if (this.isSupported) {
      this.synthesis.cancel();
      this.utterance = null;
    }
  }
  
  pause(): void {
    if (this.isSupported) {
      this.synthesis.pause();
    }
  }
  
  resume(): void {
    if (this.isSupported) {
      this.synthesis.resume();
    }
  }
  
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported) return [];
    return this.synthesis.getVoices();
  }
  
  // Vorlesen eines Rezeptschritts
  async speakStep(step: CookingStep, stepNumber: number, totalSteps: number): Promise<void> {
    const intro = `Schritt ${stepNumber} von ${totalSteps}.`;
    const text = `${intro} ${step.instruction}`;
    
    if (step.tip) {
      await this.speak(text);
      await this.speak(`Tipp: ${step.tip}`);
    } else {
      await this.speak(text);
    }
  }
}
```

### 4.6 Zutaten-Checklist

```typescript
interface IngredientChecklistProps {
  ingredients: Ingredient[];
  scaledAmounts: Map<string, number>;  // Zutat-ID -> skalierte Menge
  checkedIds: string[];
  onToggle: (ingredientId: string) => void;
  onCheckAll: () => void;
  onUncheckAll: () => void;
}

// Features:
// - Checkbox pro Zutat
// - Durchgestrichen wenn abgehakt
// - "Alle abhaken" Button
// - Gruppierung nach Kategorie
// - Skalierte Mengen-Anzeige
```

---

## 5. Feature 3: Wochenplaner

### 5.1 Übersicht

Der Wochenplaner ermöglicht die Planung von Mahlzeiten für eine Woche mit Drag & Drop, Templates und Wochen-Kopier-Funktion.

### 5.2 7-Tage Übersicht

#### Datenstruktur

```typescript
interface WeekView {
  weekStart: Date;               // Montag 00:00
  weekEnd: Date;                 // Sonntag 23:59
  days: DayView[];
}

interface DayView {
  date: Date;
  dayName: string;               // "Montag"
  dayShort: string;              // "Mo"
  isToday: boolean;
  slots: SlotView[];
}

interface SlotView {
  slot: MealSlot;
  slotName: string;              // "Frühstück"
  meal?: PlannedMealView;
}

interface PlannedMealView {
  recipe: Recipe;                // Vollständiges Rezept
  servings: number;
  notes?: string;
  isDone: boolean;
}
```

#### Wochen-Navigation

```typescript
class WeekNavigator {
  private currentWeek: Date;
  
  constructor() {
    this.currentWeek = this.getWeekStart(new Date());
  }
  
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Montag als erster Tag
    return new Date(d.setDate(diff));
  }
  
  goToPreviousWeek(): Date {
    this.currentWeek.setDate(this.currentWeek.getDate() - 7);
    return new Date(this.currentWeek);
  }
  
  goToNextWeek(): Date {
    this.currentWeek.setDate(this.currentWeek.getDate() + 7);
    return new Date(this.currentWeek);
  }
  
  goToCurrentWeek(): Date {
    this.currentWeek = this.getWeekStart(new Date());
    return new Date(this.currentWeek);
  }
  
  goToWeek(date: Date): Date {
    this.currentWeek = this.getWeekStart(date);
    return new Date(this.currentWeek);
  }
  
  getWeekRange(): { start: Date; end: Date } {
    const end = new Date(this.currentWeek);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return {
      start: new Date(this.currentWeek),
      end
    };
  }
}
```

### 5.3 Mahlzeiten-Slots

#### Slot-Konfiguration

```typescript
const MEAL_SLOTS: MealSlotConfig[] = [
  {
    id: MealSlot.BREAKFAST,
    name: 'Frühstück',
    icon: 'Coffee',
    timeRange: '06:00 - 10:00',
    color: 'amber'
  },
  {
    id: MealSlot.LUNCH,
    name: 'Mittagessen',
    icon: 'Sun',
    timeRange: '11:00 - 14:00',
    color: 'orange'
  },
  {
    id: MealSlot.DINNER,
    name: 'Abendessen',
    icon: 'Moon',
    timeRange: '17:00 - 21:00',
    color: 'indigo'
  },
  {
    id: MealSlot.SNACK,
    name: 'Snack',
    icon: 'Cookie',
    timeRange: 'jederzeit',
    color: 'green'
  }
];
```

### 5.4 Drag & Drop

#### DnD-Implementierung

```typescript
interface DragItem {
  type: 'recipe' | 'planned-meal';
  recipeId: string;
  sourceDay?: Date;
  sourceSlot?: MealSlot;
}

interface DropTarget {
  day: Date;
  slot: MealSlot;
}

class DragDropService {
  private draggedItem: DragItem | null = null;
  
  startDrag(item: DragItem): void {
    this.draggedItem = item;
  }
  
  async drop(target: DropTarget, servings?: number): Promise<void> {
    if (!this.draggedItem) return;
    
    if (this.draggedItem.type === 'recipe') {
      // Neues Rezept einplanen
      await this.planRecipe(
        this.draggedItem.recipeId,
        target.day,
        target.slot,
        servings
      );
    } else if (this.draggedItem.type === 'planned-meal') {
      // Bestehendes Meal verschieben
      await this.movePlannedMeal(
        this.draggedItem.sourceDay!,
        this.draggedItem.sourceSlot!,
        target.day,
        target.slot
      );
    }
    
    this.draggedItem = null;
  }
  
  private async planRecipe(
    recipeId: string,
    day: Date,
    slot: MealSlot,
    servings?: number
  ): Promise<void> {
    const recipe = await recipeService.getRecipe(recipeId);
    if (!recipe) throw new Error('Recipe not found');
    
    const weekPlan = await this.getOrCreateWeekPlan(day);
    
    // Tag finden
    const dayPlan = weekPlan.days.find(d => 
      isSameDay(d.date, day)
    );
    if (!dayPlan) throw new Error('Day not found');
    
    // Meal erstellen
    dayPlan.slots[slot] = {
      recipeId,
      servings: servings || recipe.servings,
      isDone: false
    };
    
    await db.weekPlans.update(weekPlan.id, weekPlan);
  }
  
  private async movePlannedMeal(
    fromDay: Date,
    fromSlot: MealSlot,
    toDay: Date,
    toSlot: MealSlot
  ): Promise<void> {
    const fromWeekPlan = await this.getWeekPlan(fromDay);
    const toWeekPlan = await this.getOrCreateWeekPlan(toDay);
    
    // Meal aus Quelle entfernen
    const fromDayPlan = fromWeekPlan.days.find(d => 
      isSameDay(d.date, fromDay)
    );
    const meal = fromDayPlan?.slots[fromSlot];
    if (!meal) throw new Error('Meal not found');
    
    delete fromDayPlan!.slots[fromSlot];
    
    // In Ziel einfügen
    const toDayPlan = toWeekPlan.days.find(d => 
      isSameDay(d.date, toDay)
    );
    if (!toDayPlan) throw new Error('Day not found');
    
    toDayPlan.slots[toSlot] = meal;
    
    // Speichern
    await db.weekPlans.update(fromWeekPlan.id, fromWeekPlan);
    await db.weekPlans.update(toWeekPlan.id, toWeekPlan);
  }
}
```

### 5.5 Template-Pläne

```typescript
interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Vorlage ohne konkrete Daten
  structure: TemplateDay[];
  
  createdAt: Date;
}

interface TemplateDay {
  dayOfWeek: number;             // 0-6
  slots: {
    [key in MealSlot]?: {
      recipeId: string;
      servings?: number;
    };
  };
}

class TemplateService {
  async createTemplate(
    weekPlan: WeeklyPlan,
    name: string
  ): Promise<PlanTemplate> {
    // Struktur extrahieren (ohne konkrete Daten)
    const structure: TemplateDay[] = weekPlan.days.map(day => ({
      dayOfWeek: day.dayOfWeek,
      slots: Object.entries(day.slots).reduce((acc, [slot, meal]) => {
        if (meal) {
          acc[slot as MealSlot] = {
            recipeId: meal.recipeId,
            servings: meal.servings
          };
        }
        return acc;
      }, {} as TemplateDay['slots'])
    }));
    
    const template: PlanTemplate = {
      id: generateUUID(),
      name,
      structure,
      createdAt: new Date()
    };
    
    await db.templates.add(template);
    return template;
  }
  
  async applyTemplate(
    templateId: string,
    weekStart: Date
  ): Promise<WeeklyPlan> {
    const template = await db.templates.get(templateId);
    if (!template) throw new Error('Template not found');
    
    const weekPlan = await this.createEmptyWeekPlan(weekStart);
    
    // Template-Struktur auf Woche anwenden
    for (const templateDay of template.structure) {
      const targetDate = new Date(weekStart);
      targetDate.setDate(targetDate.getDate() + templateDay.dayOfWeek);
      
      const dayPlan = weekPlan.days.find(d => 
        d.dayOfWeek === templateDay.dayOfWeek
      );
      if (!dayPlan) continue;
      
      dayPlan.date = targetDate;
      
      for (const [slot, mealData] of Object.entries(templateDay.slots)) {
        // Prüfen ob Rezept noch existiert
        const recipe = await recipeService.getRecipe(mealData!.recipeId);
        if (recipe) {
          dayPlan.slots[slot as MealSlot] = {
            recipeId: mealData!.recipeId,
            servings: mealData!.servings || recipe.servings,
            isDone: false
          };
        }
      }
    }
    
    await db.weekPlans.add(weekPlan);
    return weekPlan;
  }
}
```

### 5.6 Wochen kopieren

```typescript
class WeekCopyService {
  async copyWeek(
    sourceWeekStart: Date,
    targetWeekStart: Date,
    options: CopyOptions = {}
  ): Promise<WeeklyPlan> {
    const sourcePlan = await this.getWeekPlan(sourceWeekStart);
    if (!sourcePlan) throw new Error('Source week not found');
    
    // Neue Woche erstellen
    const newPlan = await this.createEmptyWeekPlan(targetWeekStart);
    newPlan.name = options.name;
    
    // Tage kopieren
    for (let i = 0; i < 7; i++) {
      const sourceDay = sourcePlan.days[i];
      const targetDay = newPlan.days[i];
      
      // Datum anpassen
      const targetDate = new Date(targetWeekStart);
      targetDate.setDate(targetDate.getDate() + i);
      targetDay.date = targetDate;
      
      // Slots kopieren
      for (const [slot, meal] of Object.entries(sourceDay.slots)) {
        if (meal) {
          // Prüfen ob Rezept existiert
          const recipe = await recipeService.getRecipe(meal.recipeId);
          if (recipe) {
            targetDay.slots[slot as MealSlot] = {
              recipeId: meal.recipeId,
              servings: meal.servings,
              notes: meal.notes,
              isDone: options.resetStatus ? false : meal.isDone
            };
          }
        }
      }
    }
    
    await db.weekPlans.add(newPlan);
    return newPlan;
  }
}

interface CopyOptions {
  name?: string;
  resetStatus?: boolean;         // isDone zurücksetzen?
}
```

---

## 6. Feature 4: Einkaufsliste

### 6.1 Übersicht

Die Einkaufsliste wird automatisch aus dem Wochenplan generiert, gruppiert nach Supermarkt-Abteilungen und unterstützt intelligente Aggregation.

### 6.2 Automatische Generierung

```typescript
class ShoppingListGenerator {
  async generateFromWeekPlan(weekPlanId: string): Promise<ShoppingList> {
    const weekPlan = await db.weekPlans.get(weekPlanId);
    if (!weekPlan) throw new Error('Week plan not found');
    
    // Alle Meals sammeln
    const meals: { meal: PlannedMeal; day: Date; slot: MealSlot }[] = [];
    for (const day of weekPlan.days) {
      for (const [slot, meal] of Object.entries(day.slots)) {
        if (meal) {
          meals.push({ meal, day: day.date, slot: slot as MealSlot });
        }
      }
    }
    
    // Alle Zutaten sammeln
    const ingredientItems: IngredientItem[] = [];
    
    for (const { meal } of meals) {
      const recipe = await recipeService.getRecipe(meal.recipeId);
      if (!recipe) continue;
      
      // Skalierungsfaktor
      const scaleFactor = meal.servings / recipe.servings;
      
      for (const ingredient of recipe.ingredients) {
        ingredientItems.push({
          ingredient,
          scaledAmount: ingredient.amount * scaleFactor,
          recipeId: recipe.id,
          servings: meal.servings
        });
      }
    }
    
    // Aggregation
    const aggregated = this.aggregateIngredients(ingredientItems);
    
    // In Abteilungen gruppieren
    const sections = this.groupBySection(aggregated);
    
    const shoppingList: ShoppingList = {
      id: generateUUID(),
      name: `Einkaufsliste ${this.formatWeekRange(weekPlan.weekStart)}`,
      weekPlanId: weekPlan.id,
      sections,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    };
    
    await db.shoppingLists.add(shoppingList);
    return shoppingList;
  }
  
  private aggregateIngredients(
    items: IngredientItem[]
  ): AggregatedIngredient[] {
    const grouped = new Map<string, IngredientItem[]>();
    
    // Gruppieren nach Zutatsname (normalisiert)
    for (const item of items) {
      const key = this.normalizeIngredientName(item.ingredient.name);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }
    
    // Aggregation
    const aggregated: AggregatedIngredient[] = [];
    
    for (const [name, group] of grouped) {
      // Einheit normalisieren
      const normalized = this.normalizeUnits(group);
      
      aggregated.push({
        name: group[0].ingredient.name,
        totalAmount: normalized.total,
        unit: normalized.unit,
        originalItems: group,
        category: group[0].ingredient.category,
        storeSection: group[0].ingredient.defaultStoreSection
      });
    }
    
    return aggregated;
  }
  
  private normalizeUnits(
    items: IngredientItem[]
  ): { total: number; unit: Unit } {
    // Alle in Basiseinheit konvertieren
    const baseUnit = items[0].ingredient.unit;
    let total = 0;
    
    for (const item of items) {
      const converted = this.convertUnit(
        item.scaledAmount,
        item.ingredient.unit,
        baseUnit
      );
      total += converted;
    }
    
    // In sinnvolle Einheit konvertieren
    return this.toDisplayUnit(total, baseUnit);
  }
  
  private convertUnit(
    amount: number,
    from: Unit,
    to: Unit
  ): number {
    const conversions: Record<Unit, Record<Unit, number>> = {
      [Unit.GRAM]: {
        [Unit.KILOGRAM]: 0.001,
        [Unit.GRAM]: 1
      },
      [Unit.KILOGRAM]: {
        [Unit.GRAM]: 1000,
        [Unit.KILOGRAM]: 1
      },
      [Unit.MILLILITER]: {
        [Unit.LITER]: 0.001,
        [Unit.MILLILITER]: 1
      },
      [Unit.LITER]: {
        [Unit.MILLILITER]: 1000,
        [Unit.LITER]: 1
      },
      // ... weitere Konvertierungen
    };
    
    const factor = conversions[from]?.[to];
    if (factor === undefined) {
      // Nicht konvertierbar, als separate Einträge behandeln
      throw new Error(`Cannot convert ${from} to ${to}`);
    }
    
    return amount * factor;
  }
}
```

### 6.3 Intelligente Aggregation

```typescript
interface AggregationRules {
  // Zutaten, die immer separat aufgeführt werden
  alwaysSeparate: string[];
  
  // Zutaten, die nie aggregiert werden
  neverAggregate: string[];
  
  // Ähnliche Namen mappen
  nameMappings: Record<string, string>;
}

const DEFAULT_AGGREGATION_RULES: AggregationRules = {
  alwaysSeparate: [
    'Salz',
    'Pfeffer',
    'Zucker',
    'Öl',
    'Butter'
  ],
  
  neverAggregate: [],
  
  nameMappings: {
    'Karotten': 'Möhren',
    'Petersilienwurzel': 'Petersilienwurzeln',
    'Tomatenmark': 'Tomatenmark',
    'Passierte Tomaten': 'Tomaten passiert'
  }
};
```

### 6.4 Supermarkt-Abteilungen

```typescript
const STORE_SECTION_ORDER: StoreSection[] = [
  StoreSection.PRODUCE,      // Obst & Gemüse (meist am Eingang)
  StoreSection.BAKERY,       // Brot
  StoreSection.MEAT,         // Fleisch & Fisch
  StoreSection.DAIRY,        // Milchprodukte
  StoreSection.DRY_GOODS,    // Trockenwaren
  StoreSection.CANNED,       // Konserven
  StoreSection.FROZEN,       // Tiefkühl
  StoreSection.SPICES,       // Gewürze
  StoreSection.BEVERAGES,    // Getränke
  StoreSection.HOUSEHOLD,    // Haushalt
  StoreSection.OTHER         // Sonstiges
];

// Abteilung-Zuordnung für Zutaten
const INGREDIENT_SECTION_MAP: Record<IngredientCategory, StoreSection> = {
  [IngredientCategory.VEGETABLES]: StoreSection.PRODUCE,
  [IngredientCategory.FRUITS]: StoreSection.PRODUCE,
  [IngredientCategory.MEAT]: StoreSection.MEAT,
  [IngredientCategory.FISH]: StoreSection.MEAT,
  [IngredientCategory.DAIRY]: StoreSection.DAIRY,
  [IngredientCategory.EGGS]: StoreSection.DAIRY,
  [IngredientCategory.BAKERY]: StoreSection.BAKERY,
  [IngredientCategory.GRAINS]: StoreSection.DRY_GOODS,
  [IngredientCategory.PASTA]: StoreSection.DRY_GOODS,
  [IngredientCategory.CANNED]: StoreSection.CANNED,
  [IngredientCategory.FROZEN]: StoreSection.FROZEN,
  [IngredientCategory.SPICES]: StoreSection.SPICES,
  [IngredientCategory.HERBS]: StoreSection.PRODUCE,
  [IngredientCategory.OILS]: StoreSection.DRY_GOODS,
  [IngredientCategory.SAUCES]: StoreSection.CANNED,
  [IngredientCategory.BEVERAGES]: StoreSection.BEVERAGES,
  [IngredientCategory.SNACKS]: StoreSection.DRY_GOODS,
  [IngredientCategory.OTHER]: StoreSection.OTHER
};
```

### 6.5 Abhaken-Funktion

```typescript
class ShoppingListService {
  async toggleItem(
    listId: string,
    sectionIndex: number,
    itemIndex: number
  ): Promise<void> {
    const list = await db.shoppingLists.get(listId);
    if (!list) throw new Error('List not found');
    
    const item = list.sections[sectionIndex].items[itemIndex];
    item.isChecked = !item.isChecked;
    
    list.updatedAt = new Date();
    await db.shoppingLists.update(listId, list);
  }
  
  async checkAllInSection(listId: string, sectionIndex: number): Promise<void> {
    const list = await db.shoppingLists.get(listId);
    if (!list) throw new Error('List not found');
    
    for (const item of list.sections[sectionIndex].items) {
      item.isChecked = true;
    }
    
    list.updatedAt = new Date();
    await db.shoppingLists.update(listId, list);
  }
  
  async uncheckAll(listId: string): Promise<void> {
    const list = await db.shoppingLists.get(listId);
    if (!list) throw new Error('List not found');
    
    for (const section of list.sections) {
      for (const item of section.items) {
        item.isChecked = false;
      }
    }
    
    list.updatedAt = new Date();
    await db.shoppingLists.update(listId, list);
  }
  
  async removeCheckedItems(listId: string): Promise<void> {
    const list = await db.shoppingLists.get(listId);
    if (!list) throw new Error('List not found');
    
    for (const section of list.sections) {
      section.items = section.items.filter(item => !item.isChecked);
    }
    
    // Leere Abschnitte entfernen
    list.sections = list.sections.filter(s => s.items.length > 0);
    
    list.updatedAt = new Date();
    await db.shoppingLists.update(listId, list);
  }
}
```

### 6.6 Teilen via Web Share API

```typescript
class ShareService {
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = 'share' in navigator;
  }
  
  async shareShoppingList(list: ShoppingList): Promise<void> {
    const text = this.formatListForSharing(list);
    
    if (this.isSupported) {
      try {
        await navigator.share({
          title: list.name,
          text: text,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          // Fallback: Clipboard
          await this.copyToClipboard(text);
        }
      }
    } else {
      // Fallback: Clipboard
      await this.copyToClipboard(text);
    }
  }
  
  private formatListForSharing(list: ShoppingList): string {
    const lines: string[] = [`🛒 ${list.name}`, ''];
    
    for (const section of list.sections) {
      lines.push(`📍 ${this.getSectionName(section.storeSection)}`);
      
      for (const item of section.items) {
        const checkbox = item.isChecked ? '✅' : '⬜';
        lines.push(`${checkbox} ${item.displayAmount} ${item.name}`);
      }
      
      lines.push('');
    }
    
    lines.push('— Erstellt mit KochPlan');
    
    return lines.join('\n');
  }
  
  private async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    // Toast-Notification anzeigen
  }
  
  private getSectionName(section: StoreSection): string {
    const names: Record<StoreSection, string> = {
      [StoreSection.PRODUCE]: 'Obst & Gemüse',
      [StoreSection.MEAT]: 'Fleisch & Fisch',
      [StoreSection.DAIRY]: 'Milchprodukte',
      [StoreSection.BAKERY]: 'Brot & Gebäck',
      [StoreSection.DRY_GOODS]: 'Trockenwaren',
      [StoreSection.CANNED]: 'Konserven',
      [StoreSection.FROZEN]: 'Tiefkühl',
      [StoreSection.SPICES]: 'Gewürze',
      [StoreSection.BEVERAGES]: 'Getränke',
      [StoreSection.HOUSEHOLD]: 'Haushalt',
      [StoreSection.OTHER]: 'Sonstiges'
    };
    return names[section];
  }
}
```

---

## 7. Feature 5: Rezept-Import

### 7.1 Übersicht

Der Rezept-Import ermöglicht das Importieren von Rezepten aus URLs durch Parsen von schema.org/Recipe oder JSON-LD Daten.

### 7.2 URL-Parser

#### Schema.org Recipe Parser

```typescript
class RecipeUrlParser {
  private readonly USER_AGENT = 'KochPlan/1.0 (Recipe Import Bot)';
  
  async parseUrl(url: string): Promise<ImportResult> {
    // 1. URL validieren
    if (!this.isValidUrl(url)) {
      return { success: false, error: 'Ungültige URL' };
    }
    
    // 2. HTML fetch
    const html = await this.fetchHtml(url);
    if (!html) {
      return { success: false, error: 'Seite konnte nicht geladen werden' };
    }
    
    // 3. JSON-LD extrahieren
    const jsonLdData = this.extractJsonLd(html);
    
    // 4. Recipe Schema finden
    const recipeData = this.findRecipeSchema(jsonLdData);
    if (!recipeData) {
      return { success: false, error: 'Kein Rezept-Schema gefunden' };
    }
    
    // 5. In internes Format konvertieren
    const parsed = this.convertToRecipe(recipeData, url);
    
    // 6. Validierung
    const validation = this.validateParsedRecipe(parsed);
    
    return {
      success: true,
      recipe: parsed,
      warnings: validation.warnings,
      missingFields: validation.missingFields
    };
  }
  
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  
  private async fetchHtml(url: string): Promise<string | null> {
    try {
      // CORS-Proxy für externe URLs
      const proxyUrl = this.getCorsProxyUrl(url);
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': this.USER_AGENT
        }
      });
      
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }
  
  private getCorsProxyUrl(url: string): string {
    // Option 1: Eigener Proxy (empfohlen für Produktion)
    // return `https://api.kochplan.de/proxy?url=${encodeURIComponent(url)}`;
    
    // Option 2: Öffentlicher Proxy (nur für Entwicklung)
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }
  
  private extractJsonLd(html: string): any[] {
    const results: any[] = [];
    const regex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        results.push(data);
      } catch {
        // Ungültiges JSON, überspringen
      }
    }
    
    return results;
  }
  
  private findRecipeSchema(data: any[]): any | null {
    for (const item of data) {
      // Direktes Recipe
      if (item['@type'] === 'Recipe') {
        return item;
      }
      
      // In Graph-Struktur
      if (item['@graph']) {
        const recipe = item['@graph'].find(
          (n: any) => n['@type'] === 'Recipe'
        );
        if (recipe) return recipe;
      }
    }
    return null;
  }
}
```

#### Schema-Mapping

```typescript
interface SchemaOrgRecipe {
  '@type': 'Recipe';
  name: string;
  description?: string;
  image?: string | { url: string } | Array<string | { url: string }>;
  recipeCategory?: string;
  recipeCuisine?: string;
  keywords?: string;
  
  // Zeit
  prepTime?: string;             // ISO 8601 Dauer, z.B. "PT30M"
  cookTime?: string;
  totalTime?: string;
  
  // Portionen
  recipeYield?: string | number;
  
  // Zutaten
  recipeIngredient?: string[];
  
  // Schritte
  recipeInstructions?: Array<{
    '@type': 'HowToStep';
    text: string;
    name?: string;
    url?: string;
    image?: string;
  }> | string[];
  
  // Bewertung
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  
  // Nährwerte
  nutrition?: {
    calories?: string;
  };
  
  // Autor
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  
  // Veröffentlicht
  datePublished?: string;
}
```

#### Konvertierung

```typescript
class RecipeConverter {
  convert(schema: SchemaOrgRecipe, sourceUrl: string): Partial<Recipe> {
    return {
      title: this.cleanText(schema.name),
      description: this.cleanText(schema.description),
      category: this.mapCategory(schema.recipeCategory),
      cuisine: schema.recipeCuisine,
      tags: this.parseKeywords(schema.keywords),
      
      // Zeiten parsen
      prepTime: this.parseDuration(schema.prepTime),
      cookTime: this.parseDuration(schema.cookTime),
      
      // Portionen
      servings: this.parseYield(schema.recipeYield),
      servingUnit: 'Personen',
      
      // Zutaten
      ingredients: this.parseIngredients(schema.recipeIngredient),
      
      // Schritte
      steps: this.parseInstructions(schema.recipeInstructions),
      
      // Bild
      imageUrl: this.extractImageUrl(schema.image),
      
      // Quelle
      source: sourceUrl,
      
      // Defaults
      isFavorite: false,
      cookCount: 0
    };
  }
  
  private parseDuration(isoDuration: string | undefined): number {
    if (!isoDuration) return 0;
    
    // ISO 8601 Dauer parsen
    // PT30M = 30 Minuten
    // PT1H30M = 1 Stunde 30 Minuten
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    
    return hours * 60 + minutes;
  }
  
  private parseIngredients(ingredients: string[] | undefined): Ingredient[] {
    if (!ingredients) return [];
    
    return ingredients.map((ing, index) => {
      const parsed = this.parseIngredientString(ing);
      return {
        id: generateUUID(),
        order: index,
        ...parsed,
        isOptional: false,
        category: IngredientCategory.OTHER,
        defaultStoreSection: StoreSection.OTHER
      };
    });
  }
  
  private parseIngredientString(text: string): Partial<Ingredient> {
    // Muster: "200g Mehl" oder "2 EL Olivenöl" oder "Salz"
    const patterns = [
      // Mit Einheit: "200 g Mehl"
      /^(\d+(?:[.,]\d+)?)\s*(\w+)\s+(.+)$/i,
      // Mit Bruch: "½ TL Salz"
      /^([½¼¾⅓⅔])\s*(\w+)\s+(.+)$/i,
      // Ohne Menge: "Salz"
      /^(.+)$/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 4) {
          return {
            amount: this.parseNumber(match[1]),
            unit: this.mapUnit(match[2]),
            name: this.cleanText(match[3])
          };
        } else {
          return {
            amount: 1,
            unit: Unit.PIECE,
            name: this.cleanText(match[1])
          };
        }
      }
    }
    
    return { name: text, amount: 1, unit: Unit.PIECE };
  }
  
  private parseInstructions(
    instructions: SchemaOrgRecipe['recipeInstructions']
  ): CookingStep[] {
    if (!instructions) return [];
    
    if (Array.isArray(instructions)) {
      return instructions.map((inst, index) => {
        if (typeof inst === 'string') {
          return this.createStep(index, inst);
        } else {
          return this.createStep(index, inst.text, inst.name);
        }
      });
    }
    
    return [this.createStep(0, String(instructions))];
  }
  
  private createStep(
    order: number,
    instruction: string,
    name?: string
  ): CookingStep {
    const parsed = this.parseTimersFromStep(instruction);
    
    return {
      id: generateUUID(),
      order,
      instruction: this.cleanText(instruction),
      timer: parsed.timer,
      tip: name
    };
  }
  
  private parseTimersFromStep(text: string): { timer?: Timer } {
    const parser = new TimerParser();
    const timers = parser.parseTimers(text);
    
    if (timers.length > 0) {
      const timer = timers[0]; // Ersten Timer verwenden
      return {
        timer: {
          duration: timer.duration,
          label: timer.label,
          isAutoStart: false
        }
      };
    }
    
    return {};
  }
}
```

### 7.3 Vorschau vor Speichern

```typescript
interface ImportPreviewProps {
  result: ImportResult;
  onSave: (recipe: Partial<Recipe>) => void;
  onEdit: () => void;
  onCancel: () => void;
}

// Vorschau zeigt:
// - Titel & Beschreibung
// - Bild (falls vorhanden)
// - Zeit-Übersicht
// - Zutaten-Liste (mit Anzahl)
// - Schritt-Übersicht (mit Anzahl)
// - Warnungen (fehlende Felder)
// - Bearbeiten-Button für Korrekturen
```

### 7.4 Fallback Copy-Paste

```typescript
class ManualImportService {
  async parseManualInput(text: string): Promise<Partial<Recipe>> {
    // Versuchen, Struktur zu erkennen
    const lines = text.split('\n').filter(l => l.trim());
    
    const recipe: Partial<Recipe> = {
      ingredients: [],
      steps: []
    };
    
    let section: 'title' | 'ingredients' | 'steps' | 'none' = 'none';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Titel (erste nicht-leere Zeile)
      if (!recipe.title && section === 'none') {
        recipe.title = trimmed;
        section = 'title';
        continue;
      }
      
      // Sektions-Erkennung
      if (this.isIngredientHeader(trimmed)) {
        section = 'ingredients';
        continue;
      }
      
      if (this.isInstructionHeader(trimmed)) {
        section = 'steps';
        continue;
      }
      
      // Inhalt parsen
      if (section === 'ingredients') {
        const ingredient = this.parseIngredientLine(trimmed);
        if (ingredient) {
          recipe.ingredients!.push(ingredient);
        }
      }
      
      if (section === 'steps') {
        const step = this.parseInstructionLine(trimmed, recipe.steps!.length);
        if (step) {
          recipe.steps!.push(step);
        }
      }
    }
    
    return recipe;
  }
  
  private isIngredientHeader(line: string): boolean {
    const keywords = ['zutaten', 'ingredients', 'was du brauchst'];
    return keywords.some(k => line.toLowerCase().includes(k));
  }
  
  private isInstructionHeader(line: string): boolean {
    const keywords = ['zubereitung', 'anleitung', 'schritte', 'instructions'];
    return keywords.some(k => line.toLowerCase().includes(k));
  }
}
```

---

## 8. State Management

### 8.1 Zustand-Store Struktur

```typescript
// Haupt-Store mit Zustand
interface AppState {
  // Rezepte
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  recipeFilter: RecipeFilter;
  
  // Wochenplaner
  currentWeek: WeeklyPlan | null;
  selectedDate: Date;
  templates: PlanTemplate[];
  
  // Einkaufsliste
  currentShoppingList: ShoppingList | null;
  shoppingLists: ShoppingList[];
  
  // Koch-Modus
  cookingSession: CookingSession | null;
  activeTimers: Timer[];
  
  // Import
  importJob: ImportJob | null;
  importPreview: ImportPreview | null;
  
  // UI
  isLoading: boolean;
  error: string | null;
  toast: Toast | null;
}

// Actions
interface AppActions {
  // Rezepte
  loadRecipes: () => Promise<void>;
  createRecipe: (data: CreateRecipeDTO) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setRecipeFilter: (filter: RecipeFilter) => void;
  
  // Wochenplaner
  loadWeek: (weekStart: Date) => Promise<void>;
  planMeal: (day: Date, slot: MealSlot, recipeId: string, servings?: number) => Promise<void>;
  removeMeal: (day: Date, slot: MealSlot) => Promise<void>;
  moveMeal: (from: DropTarget, to: DropTarget) => Promise<void>;
  
  // Einkaufsliste
  generateShoppingList: (weekPlanId: string) => Promise<void>;
  toggleShoppingItem: (listId: string, sectionIndex: number, itemIndex: number) => Promise<void>;
  
  // Koch-Modus
  startCooking: (recipe: Recipe, servings: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  finishCooking: () => void;
  
  // Timer
  createTimer: (duration: number, label: string) => string;
  startTimer: (timerId: string) => void;
  pauseTimer: (timerId: string) => void;
  stopTimer: (timerId: string) => void;
  
  // Import
  startImport: (url: string) => Promise<void>;
  saveImportedRecipe: (recipe: Partial<Recipe>) => Promise<void>;
}

// Kombinierter Store-Typ
type AppStore = AppState & AppActions;
```

### 8.2 Store-Implementierung

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

const useAppStore = create<AppStore>()(
  immer(
    persist(
      (set, get) => ({
        // Initial State
        recipes: [],
        currentRecipe: null,
        recipeFilter: { sortBy: 'date' },
        currentWeek: null,
        selectedDate: new Date(),
        templates: [],
        currentShoppingList: null,
        shoppingLists: [],
        cookingSession: null,
        activeTimers: [],
        importJob: null,
        importPreview: null,
        isLoading: false,
        error: null,
        toast: null,
        
        // Actions
        loadRecipes: async () => {
          set({ isLoading: true });
          try {
            const recipes = await recipeService.getAllRecipes();
            set({ recipes, isLoading: false });
          } catch (err) {
            set({ error: String(err), isLoading: false });
          }
        },
        
        createRecipe: async (data) => {
          const recipe = await recipeService.createRecipe(data);
          set(state => {
            state.recipes.push(recipe);
          });
          return recipe;
        },
        
        // ... weitere Actions
        
        startCooking: (recipe, servings) => {
          const session = cookingModeService.startCooking(recipe, servings);
          set({ cookingSession: session });
          
          // Wake Lock aktivieren
          wakeLockManager.requestWakeLock();
        },
        
        nextStep: () => {
          const success = cookingModeService.nextStep();
          if (success) {
            set(state => {
              if (state.cookingSession) {
                state.cookingSession.currentStepIndex++;
              }
            });
          }
        },
        
        createTimer: (duration, label) => {
          const timer = timerService.createTimer(duration, label, {
            autoStart: true
          });
          set(state => {
            state.activeTimers.push(timer);
          });
          return timer.id;
        }
      }),
      {
        name: 'kochplan-storage',
        partialize: (state) => ({
          // Nur bestimmte Teile persistieren
          recipeFilter: state.recipeFilter,
          selectedDate: state.selectedDate
        })
      }
    )
  )
);
```

---

## 9. Datenfluss-Diagramme

### 9.1 Rezept erstellen

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Benutzer  │────▶│  RecipeForm  │────▶│   Validate  │────▶│   Service   │
│  (Eingabe)  │     │  (React)     │     │   (Zod)     │     │  (Business) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────┬──────┘
                                                                     │
                                                                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Benutzer  │◀────│   Success    │◀────│   Store     │◀────│  IndexedDB  │
│  (Feedback) │     │   (Toast)    │     │  (Zustand)  │     │   (Dexie)   │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
```

### 9.2 Koch-Modus

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────────┐
│   Benutzer  │────▶│  StartCook   │────▶│      CookingSession State       │
│ (Start btn) │     │   (Action)   │     │  - currentStepIndex             │
└─────────────┘     └──────────────┘     │  - completedSteps[]             │
                                         │  - activeTimers[]               │
                                         │  - checkedIngredients[]         │
                                         └─────────────────────────────────┘
                                                           │
        ┌──────────────────────────────────────────────────┼──────────────────┐
        │                                                  │                  │
        ▼                                                  ▼                  ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  StepViewer   │     │  TimerPanel   │     │ Ingredient    │     │  WakeLock     │
│  (Navigation) │     │  (Multiple)   │     │  Checklist    │     │   (Screen)    │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
```

### 9.3 Einkaufsliste generieren

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│   Benutzer  │────▶│  Generate    │────▶│    ShoppingListGenerator Service    │
│  (Button)   │     │   (Action)   │     │                                     │
└─────────────┘     └──────────────┘     └─────────────────────────────────────┘
                                                           │
                              ┌────────────────────────────┼────────────────────────────┐
                              │                            │                            │
                              ▼                            ▼                            ▼
                    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
                    │  Collect Meals  │          │ Scale Ingredients│          │  Aggregate      │
                    │  from WeekPlan  │─────────▶│  by Servings    │─────────▶│  by Name/Unit   │
                    └─────────────────┘          └─────────────────┘          └─────────────────┘
                                                                                          │
                                                                                          ▼
                    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
                    │   Display UI    │◀─────────│  Save to DB     │◀─────────│  Group by       │
                    │  (Sections)     │          │  (IndexedDB)    │          │  StoreSection   │
                    └─────────────────┘          └─────────────────┘          └─────────────────┘
```

### 9.4 Rezept-Import

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Benutzer  │────▶│  Enter URL   │────▶│   Fetch     │────▶│  Parse      │
│  (Eingabe)  │     │   (Input)    │     │   HTML      │     │  JSON-LD    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────┬──────┘
                                                                     │
                                                                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Benutzer  │◀────│   Preview    │◀────│   Convert   │◀────│   Validate  │
│  (Review)   │     │   (Modal)    │     │  to Recipe  │     │   Schema    │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
       │
       │ (Edit/Save)
       ▼
┌─────────────┐     ┌──────────────┐
│   Save to   │────▶│   Recipe     │
│    Store    │     │   Created    │
└─────────────┘     └──────────────┘
```

---

## 10. Storage-Strategie

### 10.1 IndexedDB Schema

```typescript
class KochPlanDB extends Dexie {
  // Version 1
  recipes!: Table<Recipe>;
  weekPlans!: Table<WeeklyPlan>;
  shoppingLists!: Table<ShoppingList>;
  templates!: Table<PlanTemplate>;
  
  constructor() {
    super('KochPlanDB');
    
    this.version(1).stores({
      recipes: 'id, title, category, isFavorite, createdAt, *tags',
      weekPlans: 'id, weekStart, isTemplate',
      shoppingLists: 'id, weekPlanId, createdAt, isArchived',
      templates: 'id, name, createdAt'
    });
  }
}

export const db = new KochPlanDB();
```

### 10.2 Blob Storage

```typescript
class BlobStorage {
  private dbName = 'KochPlanBlobs';
  private storeName = 'images';
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }
  
  async saveImage(id: string, blob: Blob): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put({ id, blob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getImage(id: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 10.3 Cache-Strategie

```typescript
// Service Worker Cache für Assets
const CACHE_NAME = 'kochplan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/timer-alarm.mp3'
];

// Install: Assets cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch: Cache-First Strategie
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Netzwerk-Request
      return fetch(event.request).then((response) => {
        // Nicht-cachable Requests überspringen
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Response clonen und cachen
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});
```

---

## Anhang A: Komplette TypeScript Interfaces

```typescript
// ============================================
// CORE TYPES
// ============================================

// Eindeutige IDs
type UUID = string;

// Zeit in Minuten
type Minutes = number;

// Zeit in Sekunden  
type Seconds = number;

// ============================================
// RECIPE TYPES
// ============================================

interface Recipe {
  id: UUID;
  title: string;
  description: string;
  category: RecipeCategory;
  tags: string[];
  cuisine: string;
  difficulty: DifficultyLevel;
  prepTime: Minutes;
  cookTime: Minutes;
  restTime: Minutes;
  totalTime: Minutes;
  servings: number;
  servingUnit: string;
  ingredients: Ingredient[];
  steps: CookingStep[];
  imageBlob?: Blob;
  imageUrl?: string;
  thumbnailUrl?: string;
  isFavorite: boolean;
  rating: number;
  notes: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  lastCooked?: Date;
  cookCount: number;
}

interface Ingredient {
  id: UUID;
  name: string;
  amount: number;
  unit: Unit;
  category: IngredientCategory;
  notes?: string;
  isOptional: boolean;
  alternativeNames?: string[];
  defaultStoreSection: StoreSection;
}

interface CookingStep {
  id: UUID;
  order: number;
  instruction: string;
  timer?: StepTimer;
  ingredients?: UUID[];
  imageUrl?: string;
  tip?: string;
}

interface StepTimer {
  duration: Seconds;
  label: string;
  isAutoStart: boolean;
}

// ============================================
// PLANNER TYPES
// ============================================

interface WeeklyPlan {
  id: UUID;
  weekStart: Date;
  name?: string;
  isTemplate: boolean;
  days: DayPlan[];
  createdAt: Date;
  updatedAt: Date;
}

interface DayPlan {
  date: Date;
  dayOfWeek: number;
  slots: Partial<Record<MealSlot, PlannedMeal>>;
}

interface PlannedMeal {
  recipeId: UUID;
  servings: number;
  notes?: string;
  isDone: boolean;
}

interface PlanTemplate {
  id: UUID;
  name: string;
  description?: string;
  structure: TemplateDay[];
  createdAt: Date;
}

interface TemplateDay {
  dayOfWeek: number;
  slots: Partial<Record<MealSlot, { recipeId: UUID; servings?: number }>>;
}

// ============================================
// SHOPPING TYPES
// ============================================

interface ShoppingList {
  id: UUID;
  name: string;
  weekPlanId?: UUID;
  sections: ShoppingSection[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

interface ShoppingSection {
  storeSection: StoreSection;
  items: ShoppingItem[];
  isCollapsed: boolean;
}

interface ShoppingItem {
  id: UUID;
  ingredientId?: UUID;
  recipeIds: UUID[];
  name: string;
  displayAmount: string;
  originalAmounts: OriginalAmount[];
  isChecked: boolean;
  isManuallyAdded: boolean;
  category: IngredientCategory;
}

interface OriginalAmount {
  recipeId: UUID;
  amount: number;
  unit: Unit;
  servings: number;
}

// ============================================
// TIMER TYPES
// ============================================

interface Timer {
  id: UUID;
  label: string;
  duration: Seconds;
  remaining: Seconds;
  status: TimerStatus;
  startedAt?: Date;
  pausedAt?: Date;
  finishedAt?: Date;
  recipeId?: UUID;
  stepId?: UUID;
}

// ============================================
// IMPORT TYPES
// ============================================

interface ImportJob {
  id: UUID;
  url: string;
  status: ImportStatus;
  rawData?: any;
  parsedRecipe?: Partial<Recipe>;
  validationErrors: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface ImportResult {
  success: boolean;
  recipe?: Partial<Recipe>;
  warnings?: string[];
  missingFields?: string[];
  error?: string;
}

interface ImportPreview {
  title: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  ingredientCount: number;
  stepCount: number;
  totalTime: number;
  warnings: string[];
  missingFields: string[];
}

// ============================================
// COOKING SESSION TYPES
// ============================================

interface CookingSession {
  recipeId: UUID;
  startedAt: Date;
  currentStepIndex: number;
  completedSteps: UUID[];
  scaledServings: number;
  activeTimers: Timer[];
  checkedIngredients: UUID[];
}

// ============================================
// FILTER & SORT TYPES
// ============================================

interface RecipeFilter {
  category?: RecipeCategory;
  isFavorite?: boolean;
  searchTerm?: string;
  tags?: string[];
  sortBy: 'name' | 'date' | 'rating' | 'lastCooked';
}

// ============================================
// ENUMS
// ============================================

enum RecipeCategory {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DESSERT = 'dessert',
  DRINK = 'drink',
  BAKING = 'baking',
  OTHER = 'other'
}

enum DifficultyLevel {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3
}

enum Unit {
  GRAM = 'g',
  KILOGRAM = 'kg',
  MILLILITER = 'ml',
  LITER = 'l',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
  CUP = 'cup',
  FLUID_OUNCE = 'fl_oz',
  PIECE = 'pc',
  PINCH = 'pinch',
  CLOVE = 'clove',
  SLICE = 'slice',
  CAN = 'can',
  PACKAGE = 'pkg',
  BUNCH = 'bunch',
  CENTIMETER = 'cm',
  MILLIMETER = 'mm',
  NONE = 'none'
}

enum IngredientCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  MEAT = 'meat',
  FISH = 'fish',
  DAIRY = 'dairy',
  EGGS = 'eggs',
  BAKERY = 'bakery',
  GRAINS = 'grains',
  PASTA = 'pasta',
  CANNED = 'canned',
  FROZEN = 'frozen',
  SPICES = 'spices',
  HERBS = 'herbs',
  OILS = 'oils',
  SAUCES = 'sauces',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  OTHER = 'other'
}

enum StoreSection {
  PRODUCE = 'produce',
  MEAT = 'meat',
  DAIRY = 'dairy',
  BAKERY = 'bakery',
  DRY_GOODS = 'dry_goods',
  CANNED = 'canned',
  FROZEN = 'frozen',
  SPICES = 'spices',
  BEVERAGES = 'beverages',
  HOUSEHOLD = 'household',
  OTHER = 'other'
}

enum MealSlot {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

enum ImportStatus {
  PENDING = 'pending',
  FETCHING = 'fetching',
  PARSING = 'parsing',
  VALIDATING = 'validating',
  READY = 'ready',
  ERROR = 'error'
}
```

---

**Dokument erstellt:** KochPlan Feature Spezifikation  
**Version:** 1.0  
**Umfang:** Alle Kernfeatures der PWA Rezept-App
