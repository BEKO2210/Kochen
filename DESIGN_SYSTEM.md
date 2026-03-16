# KochPlan Design System

> Mobile-First PWA für Familienrezepte - Warm, Einladend, Kitchen-Friendly

---

## 1. Farbpalette

### Primary Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#F97316` | `orange-500` | Haupt-Akzent, Buttons, Icons |
| Primary Light | `#FB923C` | `orange-400` | Hover-States |
| Primary Dark | `#EA580C` | `orange-600` | Active-States |
| Primary Subtle | `#FFF7ED` | `orange-50` | Hintergründe, Badges |

### Secondary Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Secondary | `#92400E` | `amber-800` | Überschriften, wichtige Texte |
| Secondary Light | `#B45309` | `amber-700` | Sekundäre Überschriften |

### Background Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Background Main | `#FFFBEB` | `amber-50` | App-Hintergrund |
| Background Card | `#FFFFFF` | `white` | Karten, Modals |
| Background Elevated | `#FEF3C7` | `amber-100` | Eingefärbte Bereiche |

### Text Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Text Primary | `#451A03` | `amber-950` | Haupttext |
| Text Secondary | `#78350F` | `amber-900` | Sekundärer Text |
| Text Muted | `#A16207` | `amber-700` | Placeholder, Hinweise |
| Text Inverse | `#FFFFFF` | `white` | Text auf dunklen Hintergründen |

### Semantic Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#22C55E` | `green-500` | Erfolg, Timer fertig |
| Success Light | `#DCFCE7` | `green-100` | Success-Hintergrund |
| Warning | `#EAB308` | `yellow-500` | Warnungen |
| Warning Light | `#FEF9C3` | `yellow-100` | Warning-Hintergrund |
| Error | `#EF4444` | `red-500` | Fehler, Löschen |
| Error Light | `#FEE2E2` | `red-100` | Error-Hintergrund |
| Info | `#3B82F6` | `blue-500` | Informationen |

### Accent Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Accent Cream | `#FEF3C7` | `amber-100` | Tags, Chips |
| Accent Warm | `#FDE68A` | `amber-200` | Highlights |
| Accent Border | `#FCD34D` | `amber-300` | Borders, Dividers |

---

## 2. Typography

### Font Families
```css
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Playfair Display', Georgia, serif; /* Optional für Überschriften */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* Für Timer */
```

### Type Scale

#### Mobile (Base: 16px)
| Level | Size | Line Height | Weight | Tailwind |
|-------|------|-------------|--------|----------|
| H1 | 1.75rem (28px) | 1.2 | 700 | `text-2xl font-bold` |
| H2 | 1.5rem (24px) | 1.3 | 700 | `text-xl font-bold` |
| H3 | 1.25rem (20px) | 1.4 | 600 | `text-lg font-semibold` |
| H4 | 1.125rem (18px) | 1.4 | 600 | `text-base font-semibold` |
| Body Large | 1.125rem (18px) | 1.6 | 400 | `text-lg` |
| Body | 1rem (16px) | 1.6 | 400 | `text-base` |
| Body Small | 0.875rem (14px) | 1.5 | 400 | `text-sm` |
| Caption | 0.75rem (12px) | 1.4 | 500 | `text-xs font-medium` |

#### Tablet (768px+)
| Level | Size | Tailwind |
|-------|------|----------|
| H1 | 2rem (32px) | `md:text-3xl` |
| H2 | 1.75rem (28px) | `md:text-2xl` |
| H3 | 1.5rem (24px) | `md:text-xl` |

#### Desktop (1024px+)
| Level | Size | Tailwind |
|-------|------|----------|
| H1 | 2.25rem (36px) | `lg:text-4xl` |
| H2 | 2rem (32px) | `lg:text-3xl` |
| H3 | 1.75rem (28px) | `lg:text-2xl` |

### Timer Typography (Kitchen Mode)
| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| Timer Display | 4rem (64px) | 700 | `text-6xl font-bold font-mono` |
| Timer Label | 1.25rem (20px) | 500 | `text-xl font-medium` |
| Timer Button | 1.5rem (24px) | 600 | `text-2xl font-semibold` |

---

## 3. Spacing System

### Base Unit: 4px (0.25rem)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| space-1 | 4px | `p-1`, `m-1`, `gap-1` | Minimal spacing |
| space-2 | 8px | `p-2`, `m-2`, `gap-2` | Tight spacing |
| space-3 | 12px | `p-3`, `m-3`, `gap-3` | Default inner spacing |
| space-4 | 16px | `p-4`, `m-4`, `gap-4` | Standard padding |
| space-5 | 20px | `p-5`, `m-5`, `gap-5` | Card padding |
| space-6 | 24px | `p-6`, `m-6`, `gap-6` | Section spacing |
| space-8 | 32px | `p-8`, `m-8`, `gap-8` | Large sections |
| space-10 | 40px | `p-10`, `m-10`, `gap-10` | Page padding |
| space-12 | 48px | `p-12`, `m-12` | Major sections |
| space-16 | 64px | `p-16`, `m-16` | Hero spacing |

### Component Spacing
```
Card Padding: p-4 (mobile), p-5 (tablet+)
Button Padding: px-4 py-2 (small), px-6 py-3 (medium), px-8 py-4 (large)
Input Padding: px-4 py-3
List Item Gap: gap-3
Section Gap: gap-6
```

---

## 4. Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| radius-none | 0 | `rounded-none` | - |
| radius-sm | 4px | `rounded-sm` | Tags, Chips |
| radius-md | 8px | `rounded-md` | Inputs, Small buttons |
| radius-lg | 12px | `rounded-lg` | Cards, Modals |
| radius-xl | 16px | `rounded-xl` | Large cards, Images |
| radius-2xl | 24px | `rounded-2xl` | Featured elements |
| radius-full | 9999px | `rounded-full` | Buttons, Avatars |

### Component Radius
```
Buttons: rounded-full (Primary), rounded-lg (Secondary)
Cards: rounded-xl
Inputs: rounded-lg
Images: rounded-lg (thumbnails), rounded-xl (featured)
Modals: rounded-2xl
Avatars: rounded-full
```

---

## 5. Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| shadow-none | none | `shadow-none` | Flat design |
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | `shadow-sm` | Subtle elevation |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.1) | `shadow-md` | Cards |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.1) | `shadow-lg` | Modals, Dropdowns |
| shadow-xl | 0 20px 25px -5px rgba(0,0,0,0.1) | `shadow-xl` | Popovers |
| shadow-2xl | 0 25px 50px -12px rgba(0,0,0,0.25) | `shadow-2xl` | Overlays |

### Custom Shadows (Warm Tone)
```css
--shadow-warm: 0 4px 14px rgba(249, 115, 22, 0.15);
--shadow-warm-lg: 0 8px 24px rgba(249, 115, 22, 0.2);
--shadow-inner-warm: inset 0 2px 4px rgba(249, 115, 22, 0.06);
```

---

## 6. Breakpoints

| Name | Width | Tailwind | Usage |
|------|-------|----------|-------|
| Mobile | < 640px | Default | Base styles |
| sm | 640px | `sm:` | Large phones |
| md | 768px | `md:` | Tablets |
| lg | 1024px | `lg:` | Small laptops |
| xl | 1280px | `xl:` | Desktops |
| 2xl | 1536px | `2xl:` | Large screens |

### Container Max Widths
```
Mobile: 100% (px-4)
Tablet: 100% (px-6)
Desktop: 1200px (max-w-5xl)
Large: 1400px (max-w-6xl)
```

---

## 7. Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| z-base | 0 | Default content |
| z-dropdown | 10 | Dropdown menus |
| z-sticky | 20 | Sticky headers |
| z-nav | 30 | Bottom navigation |
| z-modal | 40 | Modals |
| z-popover | 50 | Popovers, tooltips |
| z-toast | 60 | Toast notifications |
| z-overlay | 70 | Backdrops |

---

## 8. Animation & Transitions

### Duration
```
Fast: 150ms (hover states)
Normal: 200ms (standard transitions)
Slow: 300ms (page transitions)
Slower: 500ms (complex animations)
```

### Easing
```
Default: cubic-bezier(0.4, 0, 0.2, 1)
In: cubic-bezier(0.4, 0, 1, 1)
Out: cubic-bezier(0, 0, 0.2, 1)
Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Tailwind Classes
```
Standard: transition-all duration-200 ease-in-out
Button Hover: transition-colors duration-150
Card Hover: transition-transform duration-200 hover:scale-[1.02]
Modal: transition-opacity duration-300
```

---

## 9. Icon Sizes

| Size | Value | Usage |
|------|-------|-------|
| xs | 12px | Inline icons |
| sm | 16px | Buttons, inputs |
| md | 20px | Navigation |
| lg | 24px | Cards, lists |
| xl | 32px | Featured icons |
| 2xl | 48px | Empty states |
| 3xl | 64px | Hero icons |

---

## 10. Touch Targets

### Minimum Sizes (WCAG 2.1)
```
Standard: 44px × 44px
Kitchen Mode: 64px × 64px
Icon Buttons: 48px × 48px (with 44px icon)
```

### Spacing Between Touch Targets
```
Standard: 8px
Compact: 4px
Kitchen Mode: 16px
```

---

# KITCHEN MODE DESIGN

## Übersicht
Der Kitchen Mode ist ein spezieller Modus für die Verwendung während des Kochens - optimiert für Touch-Bedienung mit eventuell nassen oder bemehlten Händen.

## Farbschema (Kitchen Mode)

### Background
| Name | Hex | Tailwind |
|------|-----|----------|
| Kitchen BG | `#1A1A1A` | `bg-neutral-900` |
| Kitchen Card | `#262626` | `bg-neutral-800` |
| Kitchen Elevated | `#404040` | `bg-neutral-700` |

### Text
| Name | Hex | Tailwind |
|------|-----|----------|
| Kitchen Text | `#FFFFFF` | `text-white` |
| Kitchen Text Muted | `#A3A3A3` | `text-neutral-400` |
| Kitchen Accent | `#F97316` | `text-orange-500` |

### Accent
| Name | Hex | Tailwind |
|------|-----|----------|
| Kitchen Primary | `#F97316` | `bg-orange-500` |
| Kitchen Success | `#22C55E` | `bg-green-500` |
| Kitchen Timer | `#F97316` | Timer-Akzent |

## Typography (Kitchen Mode)

| Element | Size | Line Height | Weight | Tailwind |
|---------|------|-------------|--------|----------|
| Step Title | 2rem (32px) | 1.2 | 700 | `text-3xl font-bold` |
| Step Text | 1.5rem (24px) | 1.5 | 500 | `text-2xl font-medium` |
| Timer Display | 5rem (80px) | 1 | 700 | `text-7xl font-bold font-mono` |
| Button Text | 1.5rem (24px) | 1 | 600 | `text-2xl font-semibold` |
| Ingredient | 1.25rem (20px) | 1.4 | 400 | `text-xl` |
| Label | 1.125rem (18px) | 1.4 | 500 | `text-lg font-medium` |

**Minimum Font Size: 1.125rem (18px)**

## Touch Targets (Kitchen Mode)

| Element | Minimum Size | Tailwind |
|---------|--------------|----------|
| Primary Buttons | 80px × 80px | `min-w-20 min-h-20` |
| Icon Buttons | 64px × 64px | `w-16 h-16` |
| Navigation Buttons | 72px × 72px | `w-[72px] h-[72px]` |
| Checkbox/Toggle | 48px × 48px | `w-12 h-12` |
| List Items | 64px min-height | `min-h-16` |

## Spacing (Kitchen Mode)

| Context | Value | Tailwind |
|---------|-------|----------|
| Button Padding | px-8 py-6 | `px-8 py-6` |
| Card Padding | p-8 | `p-8` |
| Section Gap | gap-8 | `gap-8` |
| Touch Target Gap | 16px | `gap-4` |

## Komponenten (Kitchen Mode)

### Timer Display
```
- Größe: 5rem (80px) Zahlen
- Mono-Schrift für bessere Lesbarkeit
- Heller Hintergrund mit hohem Kontrast
- Große Start/Stop Buttons (80px)
```

### Navigation (Kitchen Mode)
```
- Fixed bottom
- Höhe: 88px
- 3 große Buttons (Zurück, Timer, Weiter)
- Jeder Button: 72px × 72px Touch-Target
```

### Schritt-Anzeige
```
- Aktueller Schritt: Große, hervorgehobene Karte
- Fortschritt: Große, deutliche Progress-Bar
- Swipe-Gesten für Navigation
```

## Interaktions-Muster

### Gesten
```
- Swipe Left: Nächster Schritt
- Swipe Right: Vorheriger Schritt
- Tap: Timer starten/stoppen
- Long Press: Timer zurücksetzen
```

### Feedback
```
- Haptic Feedback bei Touch
- Visuelle Ripple-Effekte
- Audio-Feedback optional (Timer abgelaufen)
```

---

# COMPONENT DESIGN

## 1. RecipeCard

### Struktur
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │      [Bild]             │    │ ← Aspect Ratio 16:9
│  │      16:9               │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Titel                   │    │ ← text-lg font-semibold
│  │ ⏱ 30 min  👤 4 Pers.   │    │ ← text-sm text-muted
│  │ [Tag1] [Tag2]           │    │ ← Flex gap-2
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### Varianten
| Variante | Beschreibung |
|----------|--------------|
| Default | Standard-Karte mit Bild |
| Compact | Ohne Bild, nur Text |
| Featured | Größer, mit mehr Details |
| Horizontal | Bild links, Text rechts |

### Tailwind-Klassen
```html
<!-- Default RecipeCard -->
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
  <div class="aspect-video bg-amber-100 relative">
    <img src="..." class="w-full h-full object-cover" alt="...">
    <div class="absolute top-2 right-2">
      <button class="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
        <HeartIcon class="w-5 h-5 text-orange-500" />
      </button>
    </div>
  </div>
  <div class="p-4">
    <h3 class="text-lg font-semibold text-amber-950 line-clamp-2">Rezepttitel</h3>
    <div class="flex items-center gap-4 mt-2 text-sm text-amber-700">
      <span class="flex items-center gap-1">
        <ClockIcon class="w-4 h-4" />
        30 min
      </span>
      <span class="flex items-center gap-1">
        <UsersIcon class="w-4 h-4" />
        4 Pers.
      </span>
    </div>
    <div class="flex flex-wrap gap-2 mt-3">
      <span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Vegetarisch</span>
    </div>
  </div>
</div>
```

---

## 2. BottomNav

### Struktur
```
┌─────────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │ 🏠  │  │ 🔍  │  │ ➕  │  │ ❤️  │    │
│  │Home │  │Suche│  │Neu  │  │Fav. │    │
│  └─────┘  └─────┘  └─────┘  └─────┘    │
└─────────────────────────────────────────┘
```

### Tailwind-Klassen
```html
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-200 px-4 py-2 z-30">
  <div class="flex justify-around items-center max-w-lg mx-auto">
    <a href="/" class="flex flex-col items-center gap-1 p-2 text-orange-500">
      <HomeIcon class="w-6 h-6" />
      <span class="text-xs font-medium">Home</span>
    </a>
    <a href="/search" class="flex flex-col items-center gap-1 p-2 text-amber-700 hover:text-orange-500 transition-colors">
      <SearchIcon class="w-6 h-6" />
      <span class="text-xs font-medium">Suche</span>
    </a>
    <a href="/add" class="flex flex-col items-center gap-1 p-2 text-amber-700 hover:text-orange-500 transition-colors">
      <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center -mt-4 shadow-lg">
        <PlusIcon class="w-6 h-6 text-white" />
      </div>
    </a>
    <a href="/favorites" class="flex flex-col items-center gap-1 p-2 text-amber-700 hover:text-orange-500 transition-colors">
      <HeartIcon class="w-6 h-6" />
      <span class="text-xs font-medium">Favoriten</span>
    </a>
    <a href="/profile" class="flex flex-col items-center gap-1 p-2 text-amber-700 hover:text-orange-500 transition-colors">
      <UserIcon class="w-6 h-6" />
      <span class="text-xs font-medium">Profil</span>
    </a>
  </div>
</nav>
```

### Kitchen Mode BottomNav
```html
<nav class="fixed bottom-0 left-0 right-0 bg-neutral-900 px-6 py-3 z-30">
  <div class="flex justify-between items-center max-w-lg mx-auto">
    <button class="w-[72px] h-[72px] flex items-center justify-center bg-neutral-800 rounded-2xl active:bg-neutral-700">
      <ChevronLeftIcon class="w-10 h-10 text-white" />
    </button>
    <button class="w-20 h-20 flex items-center justify-center bg-orange-500 rounded-2xl active:bg-orange-600">
      <TimerIcon class="w-10 h-10 text-white" />
    </button>
    <button class="w-[72px] h-[72px] flex items-center justify-center bg-neutral-800 rounded-2xl active:bg-neutral-700">
      <ChevronRightIcon class="w-10 h-10 text-white" />
    </button>
  </div>
</nav>
```

---

## 3. Timer-Komponente

### Struktur
```
┌─────────────────────────────────┐
│         ⏱️ Timer                │
│                                 │
│         25:00                   │ ← Große Anzeige
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ -5  │  │ ▶️  │  │ +5  │     │ ← Controls
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  [==========>        ] 50%     │ ← Progress
└─────────────────────────────────┘
```

### Tailwind-Klassen (Standard)
```html
<div class="bg-white rounded-xl shadow-md p-6">
  <div class="text-center">
    <div class="flex items-center justify-center gap-2 text-amber-700 mb-2">
      <TimerIcon class="w-5 h-5" />
      <span class="text-sm font-medium">Timer</span>
    </div>
    <div class="text-5xl font-bold font-mono text-amber-950 tabular-nums">
      25:00
    </div>
  </div>
  
  <div class="flex justify-center gap-3 mt-6">
    <button class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 hover:bg-amber-200 transition-colors">
      <span class="text-lg font-bold">-5</span>
    </button>
    <button class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg">
      <PlayIcon class="w-8 h-8" />
    </button>
    <button class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 hover:bg-amber-200 transition-colors">
      <span class="text-lg font-bold">+5</span>
    </button>
  </div>
  
  <div class="mt-6">
    <div class="h-2 bg-amber-100 rounded-full overflow-hidden">
      <div class="h-full bg-orange-500 rounded-full" style="width: 50%"></div>
    </div>
    <div class="text-center text-sm text-amber-600 mt-2">50% abgeschlossen</div>
  </div>
</div>
```

### Kitchen Mode Timer
```html
<div class="bg-neutral-800 rounded-2xl p-8">
  <div class="text-center">
    <div class="text-neutral-400 text-xl font-medium mb-4">Timer</div>
    <div class="text-7xl font-bold font-mono text-white tabular-nums tracking-wider">
      25:00
    </div>
  </div>
  
  <div class="flex justify-center gap-6 mt-10">
    <button class="w-20 h-20 bg-neutral-700 rounded-2xl flex items-center justify-center text-white active:bg-neutral-600">
      <span class="text-2xl font-bold">-5</span>
    </button>
    <button class="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center text-white active:bg-orange-600">
      <PlayIcon class="w-12 h-12" />
    </button>
    <button class="w-20 h-20 bg-neutral-700 rounded-2xl flex items-center justify-center text-white active:bg-neutral-600">
      <span class="text-2xl font-bold">+5</span>
    </button>
  </div>
  
  <div class="mt-10">
    <div class="h-4 bg-neutral-700 rounded-full overflow-hidden">
      <div class="h-full bg-orange-500 rounded-full" style="width: 50%"></div>
    </div>
    <div class="text-center text-lg text-neutral-400 mt-4">50% abgeschlossen</div>
  </div>
</div>
```

---

## 4. Buttons

### Primary Button
```html
<!-- Small -->
<button class="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150">
  Speichern
</button>

<!-- Medium (Default) -->
<button class="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 shadow-md hover:shadow-lg">
  Rezept erstellen
</button>

<!-- Large -->
<button class="px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-full hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150 shadow-lg hover:shadow-xl">
  Jetzt kochen
</button>

<!-- Kitchen Mode -->
<button class="w-full min-h-20 bg-orange-500 text-white text-2xl font-semibold rounded-2xl hover:bg-orange-600 active:bg-orange-700 transition-colors">
  Timer starten
</button>
```

### Secondary Button
```html
<!-- Default -->
<button class="px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 active:bg-orange-100 transition-colors duration-150">
  Abbrechen
</button>

<!-- Kitchen Mode -->
<button class="w-full min-h-20 bg-neutral-800 text-white text-2xl font-semibold rounded-2xl border-2 border-neutral-600 hover:bg-neutral-700 active:bg-neutral-600 transition-colors">
  Zurück
</button>
```

### Ghost Button
```html
<!-- Default -->
<button class="px-4 py-2 text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors duration-150">
  Mehr anzeigen
</button>

<!-- Kitchen Mode -->
<button class="px-6 py-4 text-neutral-400 text-xl font-medium hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
  Überspringen
</button>
```

### Icon Button
```html
<!-- Standard -->
<button class="w-10 h-10 flex items-center justify-center text-amber-700 hover:bg-amber-100 rounded-full transition-colors">
  <HeartIcon class="w-5 h-5" />
</button>

<!-- Kitchen Mode -->
<button class="w-16 h-16 flex items-center justify-center bg-neutral-800 text-white rounded-2xl active:bg-neutral-700">
  <HeartIcon class="w-8 h-8" />
</button>
```

### Button States
```css
/* Disabled */
.disabled, [disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading */
.loading {
  position: relative;
  color: transparent;
}
.loading::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

---

## 5. Input-Felder

### Text Input
```html
<div class="space-y-2">
  <label class="text-sm font-medium text-amber-900">Rezeptname</label>
  <input 
    type="text" 
    placeholder="z.B. Spaghetti Carbonara"
    class="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-lg text-amber-950 placeholder-amber-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
  />
</div>
```

### Textarea
```html
<div class="space-y-2">
  <label class="text-sm font-medium text-amber-900">Zubereitung</label>
  <textarea 
    rows="4"
    placeholder="Beschreibe die Zubereitungsschritte..."
    class="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-lg text-amber-950 placeholder-amber-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-y"
  ></textarea>
</div>
```

### Select
```html
<div class="space-y-2">
  <label class="text-sm font-medium text-amber-900">Kategorie</label>
  <div class="relative">
    <select class="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-lg text-amber-950 appearance-none focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all">
      <option value="">Kategorie wählen</option>
      <option value="hauptgericht">Hauptgericht</option>
      <option value="vorspeise">Vorspeise</option>
      <option value="dessert">Dessert</option>
    </select>
    <ChevronDownIcon class="w-5 h-5 text-amber-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
</div>
```

### Search Input
```html
<div class="relative">
  <SearchIcon class="w-5 h-5 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
  <input 
    type="search" 
    placeholder="Rezepte suchen..."
    class="w-full pl-12 pr-4 py-3 bg-white border-2 border-amber-200 rounded-full text-amber-950 placeholder-amber-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
  />
</div>
```

### Kitchen Mode Input
```html
<div class="space-y-3">
  <label class="text-xl font-medium text-white">Rezeptname</label>
  <input 
    type="text" 
    placeholder="Rezeptname eingeben"
    class="w-full px-6 py-5 bg-neutral-800 border-2 border-neutral-600 rounded-2xl text-white text-xl placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
  />
</div>
```

### Input States
```css
/* Error */
.input-error {
  border-color: #EF4444;
  background-color: #FEF2F2;
}

/* Success */
.input-success {
  border-color: #22C55E;
  background-color: #F0FDF4;
}

/* Kitchen Mode Focus */
.kitchen-input:focus {
  border-color: #F97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
}
```

---

## 6. Zusätzliche Komponenten

### Badge/Tag
```html
<!-- Default -->
<span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
  Vegetarisch
</span>

<!-- Outline -->
<span class="px-3 py-1 bg-transparent text-orange-600 text-sm font-medium rounded-full border border-orange-300">
  Schnell
</span>

<!-- Kitchen Mode -->
<span class="px-4 py-2 bg-neutral-700 text-white text-lg font-medium rounded-xl">
  Schritt 3/5
</span>
```

### Progress Bar
```html
<!-- Default -->
<div class="h-2 bg-amber-100 rounded-full overflow-hidden">
  <div class="h-full bg-orange-500 rounded-full transition-all duration-300" style="width: 60%"></div>
</div>

<!-- Kitchen Mode -->
<div class="h-4 bg-neutral-700 rounded-full overflow-hidden">
  <div class="h-full bg-orange-500 rounded-full transition-all duration-300" style="width: 60%"></div>
</div>
```

### Checkbox
```html
<!-- Default -->
<label class="flex items-center gap-3 cursor-pointer">
  <input type="checkbox" class="w-5 h-5 rounded border-2 border-amber-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0">
  <span class="text-amber-900">Zutat abhaken</span>
</label>

<!-- Kitchen Mode -->
<label class="flex items-center gap-4 cursor-pointer">
  <input type="checkbox" class="w-8 h-8 rounded-xl border-2 border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0">
  <span class="text-white text-xl">Zutat abhaken</span>
</label>
```

### Toast/Notification
```html
<!-- Success Toast -->
<div class="fixed bottom-24 left-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-60">
  <CheckIcon class="w-6 h-6" />
  <span class="font-medium">Rezept gespeichert!</span>
</div>

<!-- Kitchen Mode Toast -->
<div class="fixed top-4 left-4 right-4 bg-green-600 text-white px-8 py-6 rounded-2xl flex items-center gap-4 z-60">
  <CheckIcon class="w-8 h-8" />
  <span class="text-xl font-medium">Timer abgelaufen!</span>
</div>
```

---

## CSS Custom Properties (Root)

```css
:root {
  /* Colors */
  --color-primary: #F97316;
  --color-primary-light: #FB923C;
  --color-primary-dark: #EA580C;
  --color-primary-subtle: #FFF7ED;
  
  --color-secondary: #92400E;
  --color-background: #FFFBEB;
  --color-background-card: #FFFFFF;
  --color-background-elevated: #FEF3C7;
  
  --color-text: #451A03;
  --color-text-secondary: #78350F;
  --color-text-muted: #A16207;
  
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-error: #EF4444;
  
  /* Kitchen Mode */
  --kitchen-bg: #1A1A1A;
  --kitchen-card: #262626;
  --kitchen-text: #FFFFFF;
  --kitchen-muted: #A3A3A3;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  
  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-warm: 0 4px 14px rgba(249, 115, 22, 0.15);
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Touch Targets */
  --touch-min: 44px;
  --touch-kitchen: 64px;
}
```

---

*Design System Version: 1.0*
*Last Updated: 2024*
*For: KochPlan PWA*
