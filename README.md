# 🍳 KochPlan - Deine Offline-First Rezept & Meal-Prep PWA

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://yourusername.github.io/KochPlan/)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue)](https://yourusername.github.io/KochPlan/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite)](https://vitejs.dev/)

> **Plane, koche, genieße — alles offline.**

KochPlan ist eine Progressive Web App (PWA) für die komplette Küchen-Organisation: Rezeptverwaltung, Wochenplanung, automatische Einkaufslisten und ein spezieller Koch-Modus für die Nutzung beim Kochen.

![KochPlan Screenshot](public/screenshots/screenshot1.png)

## ✨ Features

### 📖 Rezeptverwaltung
- 📝 Rezepte erstellen, bearbeiten und löschen
- 🖼️ Bilder direkt aus der Kamera oder Galerie
- 🏷️ Kategorien, Tags und Ernährungs-Labels
- ⭐ Favoriten und persönliche Bewertungen
- 📏 Automatische Portionen-Skalierung
- 🔗 Rezepte von URLs importieren (schema.org/Recipe)

### 👨‍🍳 Koch-Modus (Hands-Free)
- 🌙 Dunkles Design für die Küche
- 📱 Bildschirm bleibt an (Wake Lock API)
- 🔊 Zubereitungsschritte vorlesen lassen
- ⏱️ Integrierte Timer mit Kreis-Animation
- ✅ Zutaten-Checkliste zum Abhaken
- 👆 Große Touch-Targets für nasse Hände

### 📅 Wochenplaner
- 📆 7-Tage Übersicht mit allen Mahlzeiten
- 🍳 Frühstück, Mittag, Abend, Snack pro Tag
- 🔄 Wochen kopieren und wiederholen
- 📋 Vordefinierte Templates (Fitness, Budget, etc.)

### 🛒 Einkaufsliste
- 🤖 Automatisch aus Wochenplan generieren
- 🧮 Intelligente Zutaten-Aggregation
- 🏪 Nach Supermarkt-Abteilungen sortiert
- ✅ Abhaken und verwalten
- 📤 Teilen via Web Share API

### 🌐 Offline-First
- 💾 Alle Daten in IndexedDB (Dexie.js)
- 📴 100% Funktionalität ohne Internet
- 🔄 Background Sync wenn wieder online
- ⚡ Schnelle Ladezeiten durch Caching

## 🚀 Schnellstart

### Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/KochPlan.git
cd KochPlan

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

### Build & Deploy

```bash
# Production Build erstellen
npm run build

# Build lokal testen
npm run preview

# Deploy zu GitHub Pages (automatisch via GitHub Actions)
git push origin main
```

## 🛠️ Tech Stack

| Kategorie | Technologie |
|-----------|-------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **State** | Zustand |
| **Datenbank** | Dexie.js (IndexedDB) |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Animationen** | Framer Motion |
| **Icons** | Lucide React |

## 📱 PWA Installieren

### Android (Chrome)
1. Öffne [KochPlan](https://yourusername.github.io/KochPlan/) in Chrome
2. Tippe auf "Zum Startbildschirm hinzufügen"
3. Fertig! 🎉

### iOS (Safari)
1. Öffne [KochPlan](https://yourusername.github.io/KochPlan/) in Safari
2. Tippe auf "Teilen" → "Zum Home-Bildschirm"
3. Fertig! 🎉

### Desktop (Chrome/Edge)
1. Öffne [KochPlan](https://yourusername.github.io/KochPlan/)
2. Klicke auf das Install-Icon in der Adressleiste
3. Fertig! 🎉

## 📊 Lighthouse Scores

| Kategorie | Score |
|-----------|-------|
| Performance | 85+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 95+ |
| **PWA** | **95+** |

## 🏗️ Projektstruktur

```
KochPlan/
├── .github/workflows/     # CI/CD
├── public/
│   ├── icons/            # PWA Icons
│   ├── manifest.json     # Web App Manifest
│   └── sw.js            # Service Worker
├── src/
│   ├── components/
│   │   ├── cooking/     # Koch-Modus Komponenten
│   │   ├── planner/     # Wochenplaner
│   │   ├── recipes/     # Rezept-Verwaltung
│   │   ├── shopping/    # Einkaufsliste
│   │   └── ui/          # UI-Komponenten
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Utilities & Parser
│   ├── pages/           # Seiten-Komponenten
│   ├── store/           # Zustand Stores
│   └── types/           # TypeScript Types
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🗄️ Datenbank Schema

```typescript
// Rezepte
interface Recipe {
  id: number;
  title: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  dietLabels: string[];
  ingredients: Ingredient[];
  steps: CookingStep[];
  image?: Blob;
  isFavorite: boolean;
  rating?: number;
  createdAt: Date;
}

// Wochenplan
interface MealPlan {
  id: number;
  weekStart: string;
  meals: DayMeals[];
}

// Einkaufsliste
interface ShoppingList {
  id: number;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
}
```

## ⚙️ Umgebungsvariablen

```bash
# .env.local
VITE_APP_NAME=KochPlan
VITE_APP_VERSION=1.0.0
```

## 🌐 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Wake Lock | ✅ | ❌ | ✅ | ✅ |
| Web Speech | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |

## 🤝 Mitwirken

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Danksagungen

- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Dexie.js](https://dexie.org/) - A Minimalistic Wrapper for IndexedDB
- [Zustand](https://github.com/pmndrs/zustand) - A small, fast and scalable bearbones state-management solution
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

<p align="center">
  Made with ❤️ and 🍕
</p>
