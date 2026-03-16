/**
 * KochPlan - Page Components
 * 
 * Dieses Modul exportiert alle Page-Komponenten für das Routing.
 * Jede Page ist eine vollständige Ansicht mit Datenladen und Fehlerbehandlung.
 */

// Dashboard - Übersichtsseite
export { Dashboard } from './Dashboard';
export { default as DashboardPage } from './Dashboard';

// Rezepte - Rezept-Bibliothek
export { RecipesPage } from './RecipesPage';
export { default as RecipesPageDefault } from './RecipesPage';

// Rezept-Detail - Einzelnes Rezept
export { RecipeDetailPage } from './RecipeDetailPage';
export { default as RecipeDetailPageDefault } from './RecipeDetailPage';

// Koch-Modus - Vollbild-Kochansicht
export { CookingPage } from './CookingPage';
export { default as CookingPageDefault } from './CookingPage';

// Wochenplaner - Mahlzeitenplanung
export { PlannerPage } from './PlannerPage';
export { default as PlannerPageDefault } from './PlannerPage';

// Einkaufsliste - Shopping List Management
export { ShoppingPage } from './ShoppingPage';
export { default as ShoppingPageDefault } from './ShoppingPage';

// Einstellungen - App-Konfiguration
export { SettingsPage } from './SettingsPage';
export { default as SettingsPageDefault } from './SettingsPage';

// Re-exports für bequemeren Import
export { default } from './Dashboard';
