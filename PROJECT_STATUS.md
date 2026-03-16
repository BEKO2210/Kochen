# 📋 KochPlan - Projektstatus

> **APP_NAME:** KochPlan  
> **APP_TAGLINE:** Plane, koche, genieße — alles offline.  
> **Farbschema:** Warmes Orange (#F97316) + Creme (#FFFBEB) + Dunkelbraun  
> **Offline-First:** ✅ Ja  
> **Sprache:** Deutsch

---

## 📁 Projektstruktur

```
KochPlan/
├── .github/
│   └── workflows/          # CI/CD Workflows
├── public/
│   └── icons/              # PWA Icons (192x192, 512x512)
├── src/
│   ├── components/
│   │   ├── recipes/        # Rezept-Komponenten
│   │   ├── cooking/        # Kochmodus-Komponenten
│   │   ├── planner/        # Meal-Planer-Komponenten
│   │   ├── shopping/       # Einkaufslisten-Komponenten
│   │   ├── search/         # Such-Komponenten
│   │   └── ui/             # UI-Basis-Komponenten
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Hilfsfunktionen & Utils
│   ├── store/              # State Management (Zustand)
│   ├── types/              # TypeScript Typdefinitionen
│   └── pages/              # Seiten-Komponenten
├── .gitignore              # Git Ignore Regeln
└── PROJECT_STATUS.md       # Diese Datei
```

---

## 📄 Zu erstellende Dateien

### Konfigurationsdateien (Root)

| Datei | Beschreibung | Priorität |
|-------|--------------|-----------|
| `package.json` | NPM Dependencies & Scripts | 🔴 Hoch |
| `tsconfig.json` | TypeScript Konfiguration | 🔴 Hoch |
| `vite.config.ts` | Vite Build Konfiguration | 🔴 Hoch |
| `tailwind.config.js` | Tailwind CSS Konfiguration | 🔴 Hoch |
| `postcss.config.js` | PostCSS Konfiguration | 🟡 Mittel |
| `eslint.config.js` | ESLint Regeln | 🟡 Mittel |
| `prettier.config.js` | Prettier Formatierung | 🟡 Mittel |
| `index.html` | HTML Entry Point | 🔴 Hoch |

### PWA Dateien (public/)

| Datei | Beschreibung | Priorität |
|-------|--------------|-----------|
| `manifest.json` | Web App Manifest | 🔴 Hoch |
| `sw.js` | Service Worker | 🔴 Hoch |
| `icons/icon-192x192.png` | PWA Icon 192px | 🔴 Hoch |
| `icons/icon-512x512.png` | PWA Icon 512px | 🔴 Hoch |
| `icons/maskable-icon.png` | Maskable Icon | 🟡 Mittel |
| `robots.txt` | SEO Robots | 🟢 Niedrig |

### TypeScript Typen (src/types/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Typ-Exporte | - |
| `recipe.ts` | Rezept-Typen | - |
| `meal.ts` | Mahlzeiten-Typen | recipe.ts |
| `shopping.ts` | Einkaufslisten-Typen | recipe.ts |
| `user.ts` | Benutzer-Typen | - |

### State Management (src/store/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Store-Exporte | - |
| `recipeStore.ts` | Rezept-State | types/recipe.ts |
| `mealPlanStore.ts` | Meal-Plan-State | types/meal.ts |
| `shoppingStore.ts` | Einkaufslisten-State | types/shopping.ts |
| `uiStore.ts` | UI-State | - |

### Custom Hooks (src/hooks/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Hook-Exporte | - |
| `useRecipes.ts` | Rezept-Hooks | store/recipeStore.ts |
| `useMealPlan.ts` | Meal-Plan-Hooks | store/mealPlanStore.ts |
| `useShoppingList.ts` | Einkaufslisten-Hooks | store/shoppingStore.ts |
| `useOffline.ts` | Offline-Status Hook | - |
| `useLocalStorage.ts` | LocalStorage Hook | - |

### Hilfsfunktionen (src/lib/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Lib-Exporte | - |
| `utils.ts` | Allgemeine Utils | - |
| `idb.ts` | IndexedDB Wrapper | - |
| `constants.ts` | App-Konstanten | - |
| `formatters.ts` | Formatierungsfunktionen | - |

### UI Komponenten (src/components/ui/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | UI-Exporte | - |
| `Button.tsx` | Button Komponente | - |
| `Card.tsx` | Card Komponente | - |
| `Input.tsx` | Input Komponente | - |
| `Modal.tsx` | Modal Komponente | - |
| `Badge.tsx` | Badge Komponente | - |
| `Icon.tsx` | Icon Komponente | - |

### Rezept Komponenten (src/components/recipes/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Rezept-Komponenten-Exporte | - |
| `RecipeCard.tsx` | Rezept-Karte | ui/Card, ui/Badge |
| `RecipeList.tsx` | Rezept-Liste | RecipeCard |
| `RecipeDetail.tsx` | Rezept-Detailansicht | ui/Modal |
| `RecipeForm.tsx` | Rezept-Formular | ui/Input, ui/Button |
| `IngredientList.tsx` | Zutatenliste | - |

### Kochmodus Komponenten (src/components/cooking/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Kochmodus-Exporte | - |
| `CookingTimer.tsx` | Koch-Timer | ui/Button |
| `StepNavigator.tsx` | Schritt-Navigation | ui/Button |
| `PortionCalculator.tsx` | Portionen-Rechner | ui/Input |
| `CookingView.tsx` | Koch-Ansicht | StepNavigator, CookingTimer |

### Planer Komponenten (src/components/planner/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Planer-Exporte | - |
| `WeekPlanner.tsx` | Wochenplaner | - |
| `DaySlot.tsx` | Tages-Slot | ui/Card |
| `MealSlot.tsx` | Mahlzeiten-Slot | ui/Badge |
| `PlannerGrid.tsx` | Planer-Raster | DaySlot, MealSlot |

### Einkaufsliste Komponenten (src/components/shopping/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Shopping-Exporte | - |
| `ShoppingList.tsx` | Einkaufsliste | - |
| `ShoppingItem.tsx` | Listen-Eintrag | ui/Checkbox |
| `CategoryGroup.tsx` | Kategorie-Gruppe | ShoppingItem |
| `AddItemForm.tsx` | Hinzufügen-Formular | ui/Input |

### Suche Komponenten (src/components/search/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `index.ts` | Search-Exporte | - |
| `SearchBar.tsx` | Suchleiste | ui/Input |
| `FilterChips.tsx` | Filter-Chips | ui/Badge |
| `SearchResults.tsx` | Suchergebnisse | RecipeCard |
| `CategoryFilter.tsx` | Kategorie-Filter | - |

### Seiten (src/pages/)

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `HomePage.tsx` | Startseite | RecipeList, SearchBar |
| `RecipePage.tsx` | Rezept-Seite | RecipeDetail |
| `PlannerPage.tsx` | Planer-Seite | WeekPlanner |
| `ShoppingPage.tsx` | Einkaufslisten-Seite | ShoppingList |
| `CookingPage.tsx` | Kochmodus-Seite | CookingView |
| `SettingsPage.tsx` | Einstellungen | - |

### App Entry Points

| Datei | Beschreibung | Abhängigkeiten |
|-------|--------------|----------------|
| `src/main.tsx` | React Entry Point | - |
| `src/App.tsx` | Haupt-App Komponente | pages/* |
| `src/index.css` | Globale Styles | - |

---

## 🔗 Abhängigkeitsdiagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP STRUKTUR                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   types/     │◄───│   store/     │◄───│   hooks/     │      │
│  │  (Basis)     │    │  (State)     │    │  (Logik)     │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│         ▲                  ▲                    │               │
│         │                  │                    │               │
│         └──────────────────┴────────────────────┘               │
│                                                  │               │
│  ┌──────────────┐    ┌──────────────┐           │               │
│  │    lib/      │◄───│ components/  │◄──────────┘               │
│  │   (Utils)    │    │   (UI)       │                           │
│  └──────────────┘    └──────┬───────┘                           │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                           │
│                      │   pages/     │                           │
│                      │  (Screens)   │                           │
│                      └──────┬───────┘                           │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                           │
│                      │   App.tsx    │                           │
│                      └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Entwickler-Checkliste

### Phase 1: Setup & Konfiguration

- [ ] `package.json` mit Dependencies erstellen
- [ ] `vite.config.ts` mit PWA-Plugin konfigurieren
- [ ] `tsconfig.json` einrichten
- [ ] `tailwind.config.js` mit Farbschema konfigurieren
- [ ] `manifest.json` mit App-Infos erstellen
- [ ] Service Worker `sw.js` implementieren

### Phase 2: Typen & State

- [ ] Alle TypeScript-Typen in `src/types/` definieren
- [ ] Zustand-Stores in `src/store/` implementieren
- [ ] IndexedDB-Wrapper in `src/lib/idb.ts` erstellen

### Phase 3: UI-Komponenten

- [ ] Basis-UI-Komponenten in `src/components/ui/` erstellen
- [ ] Rezept-Komponenten implementieren
- [ ] Planer-Komponenten implementieren
- [ ] Einkaufslisten-Komponenten implementieren
- [ ] Such-Komponenten implementieren
- [ ] Kochmodus-Komponenten implementieren

### Phase 4: Hooks & Logik

- [ ] Custom Hooks für Rezepte erstellen
- [ ] Custom Hooks für Meal-Plan erstellen
- [ ] Custom Hooks für Einkaufsliste erstellen
- [ ] Offline-Detection Hook implementieren

### Phase 5: Seiten & Routing

- [ ] Alle Seiten in `src/pages/` erstellen
- [ ] React Router konfigurieren
- [ ] Navigation implementieren

### Phase 6: PWA & Optimierung

- [ ] Icons generieren und in `public/icons/` speichern
- [ ] Service Worker für Offline-Funktionalität testen
- [ ] Lighthouse Audit durchführen
- [ ] Performance optimieren

---

## 📦 Empfohlene Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "idb": "^7.1.1",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

---

## 🎨 Farbschema

| Name | Hex | Verwendung |
|------|-----|------------|
| Primary | `#F97316` | Buttons, Akzente, Highlights |
| Primary Dark | `#EA580C` | Hover-States |
| Background | `#FFFBEB` | Hintergrund |
| Surface | `#FFFFFF` | Karten, Modals |
| Text Primary | `#451A03` | Haupttext (Dunkelbraun) |
| Text Secondary | `#92400E` | Sekundärer Text |
| Border | `#FDE68A` | Rahmen, Trennlinien |

---

## 📝 Notizen

- **Offline-First:** Alle Daten werden lokal in IndexedDB gespeichert
- **PWA:** App ist installierbar und funktioniert offline
- **Responsive:** Mobile-first Design für alle Bildschirmgrößen
- **Performance:** Lazy Loading für Bilder und Komponenten
- **Barrierefreiheit:** ARIA-Labels, Tastaturnavigation

---

*Letzte Aktualisierung: $(date)*  
*Projekt: KochPlan PWA*
