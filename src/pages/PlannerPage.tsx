import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  LayoutTemplate,
  RotateCcw,
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useMealPlanner, getDayName, getMealTypeName, DayOfWeek, MealType } from '../hooks/useMealPlanner';
import { useRecipes } from '../hooks/useRecipes';
import { useShoppingList } from '../hooks/useShoppingList';
import { Button } from '../components/ui/Button';
import { Recipe } from '../types';

interface MealSlotProps {
  day: DayOfWeek;
  mealType: MealType;
  recipe: Recipe | null;
  servings: number;
  onSelect: (recipe: Recipe | null, servings?: number) => void;
}

const MealSlot: React.FC<MealSlotProps> = ({ day, mealType, recipe, servings, onSelect }) => {
  const [showSelector, setShowSelector] = useState(false);
  const { recipes } = useRecipes();

  return (
    <div className="min-h-[80px] p-2 bg-amber-50 rounded-lg border border-amber-100">
      {recipe ? (
        <div className="relative group">
          <div 
            onClick={() => setShowSelector(true)}
            className="cursor-pointer"
          >
            <p className="font-medium text-amber-950 text-sm line-clamp-2">{recipe.title}</p>
            <p className="text-xs text-amber-600 mt-1">{servings} Portionen</p>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSelector(true)}
          className="w-full h-full flex items-center justify-center text-amber-400 hover:text-orange-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Recipe Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-semibold text-amber-950">
                {getDayName(day)} - {getMealTypeName(mealType)}
              </h3>
              <button
                onClick={() => setShowSelector(false)}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      onSelect(recipe, recipe.servings);
                      setShowSelector(false);
                    }}
                    className="w-full p-3 text-left bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-amber-950">{recipe.title}</p>
                    <p className="text-sm text-amber-600">
                      {recipe.prepTime + recipe.cookTime} min • {recipe.servings} Portionen
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentWeek,
    plannedMeals,
    isLoading,
    previousWeek,
    nextWeek,
    goToCurrentWeek,
    addMeal,
    removeMeal,
    getMealsForDay,
    getMealForSlot,
    getWeekDates,
    generateShoppingList,
    getWeeklyStats,
    clearWeek,
  } = useMealPlanner();
  
  const { recipes } = useRecipes();
  const { createList, addFromIngredients } = useShoppingList();
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [targetWeekOffset, setTargetWeekOffset] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');

  const weekDates = getWeekDates();
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Format date range
  const formatDateRange = (): string => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Handle meal selection
  const handleMealSelect = (day: DayOfWeek, mealType: MealType, recipe: Recipe | null, servings?: number) => {
    if (recipe) {
      // Remove existing meal at this slot first
      const existing = getMealForSlot(day, mealType);
      if (existing) {
        removeMeal(existing.id);
      }
      addMeal(recipe, day, mealType, servings);
    } else {
      const existing = getMealForSlot(day, mealType);
      if (existing) {
        removeMeal(existing.id);
      }
    }
  };

  // Generate shopping list
  const handleGenerateShoppingList = () => {
    const ingredients = generateShoppingList();
    if (ingredients.length > 0) {
      const listName = `Einkaufsliste KW ${getWeekNumber(currentWeek)}`;
      createList(listName);
      addFromIngredients(ingredients);
      navigate('/shopping');
    }
  };

  // Handle clear week
  const handleClearWeek = () => {
    clearWeek();
    setShowClearConfirm(false);
  };

  // Stats
  const stats = getWeeklyStats();

  // Apply template: fill week with matching recipes
  const applyTemplate = (templateId: string) => {
    if (recipes.length === 0) return;

    // Filter recipes by template criteria
    let filtered = [...recipes];
    if (templateId === 'vegetarian') {
      filtered = recipes.filter(r => r.tags.some(t => t.toLowerCase().includes('vegetarisch') || t.toLowerCase().includes('vegan')));
    } else if (templateId === 'quick') {
      filtered = recipes.filter(r => (r.prepTime + r.cookTime) <= 30);
    } else if (templateId === 'family') {
      filtered = recipes.filter(r => r.difficulty === 'easy' && r.servings >= 4);
    }

    // Fallback to all recipes if filter yields nothing
    if (filtered.length === 0) filtered = [...recipes];

    // Clear current week first
    clearWeek();

    // Fill lunch and dinner for each day
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    let recipeIdx = 0;
    const daysToFill: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mealsToFill: MealType[] = ['lunch', 'dinner'];

    for (const day of daysToFill) {
      for (const mealType of mealsToFill) {
        const recipe = shuffled[recipeIdx % shuffled.length];
        addMeal(recipe, day, mealType, recipe.servings);
        recipeIdx++;
      }
    }

    const labels: Record<string, string> = {
      vegetarian: 'Vegetarische Woche',
      quick: 'Schnelle Woche',
      family: 'Familienwoche',
      mealprep: 'Meal Prep Woche',
    };
    setTemplateSuccess(labels[templateId] || 'Vorlage');
    setTimeout(() => setTemplateSuccess(''), 2000);
    setShowTemplates(false);
  };

  // Copy current week to target week
  const handleCopyWeek = () => {
    if (targetWeekOffset === null || plannedMeals.length === 0) return;

    const targetDate = new Date(currentWeek);
    targetDate.setDate(targetDate.getDate() + targetWeekOffset * 7);

    // Build localStorage key for target week
    const d = new Date(targetDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const key = `kochplan_meal_planner_${weekStart.toISOString().split('T')[0]}`;

    // Copy meals with new IDs
    const copiedMeals = plannedMeals.map(meal => ({
      ...meal,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    localStorage.setItem(key, JSON.stringify(copiedMeals));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    setShowCopyDialog(false);
    setTargetWeekOffset(null);
  };

  // Templates
  const templates = [
    { id: 'vegetarian', name: 'Vegetarische Woche', description: 'Füllt Mittag- und Abendessen mit vegetarischen Rezepten' },
    { id: 'quick', name: 'Schnelle Woche', description: 'Nur Rezepte unter 30 Minuten Gesamtzeit' },
    { id: 'family', name: 'Familienwoche', description: 'Einfache Gerichte mit ≥4 Portionen' },
    { id: 'mealprep', name: 'Zufällig füllen', description: 'Zufällige Auswahl aus allen Rezepten' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-amber-700">Lade Wochenplan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-950 flex items-center gap-2">
                <Calendar className="w-7 h-7 text-orange-500" />
                Wochenplaner
              </h1>
              <p className="text-amber-600 text-sm mt-1">
                KW {getWeekNumber(currentWeek)} • {formatDateRange()}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Heute</span>
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
              >
                <LayoutTemplate className="w-4 h-4" />
                <span className="hidden sm:inline">Vorlagen</span>
              </button>
              <button
                onClick={() => setShowCopyDialog(true)}
                className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Kopieren</span>
              </button>
              <button
                onClick={handleGenerateShoppingList}
                disabled={plannedMeals.length === 0}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Einkaufsliste</span>
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={previousWeek}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-amber-700" />
            </button>
            <span className="font-medium text-amber-950 min-w-[200px] text-center">
              {formatDateRange()}
            </span>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-amber-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-orange-500">{stats.totalMeals}</p>
            <p className="text-sm text-amber-600">Mahlzeiten</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-orange-500">{stats.totalServings}</p>
            <p className="text-sm text-amber-600">Portionen</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-orange-500">{stats.estimatedPrepTime + stats.estimatedCookTime}</p>
            <p className="text-sm text-amber-600">Min. Gesamtzeit</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-orange-500">{stats.uniqueRecipes}</p>
            <p className="text-sm text-amber-600">Verschiedene Rezepte</p>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-8 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="p-2"></div>
            {days.map((day, index) => {
              const date = weekDates[index];
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div
                  key={day}
                  className={`p-2 text-center rounded-lg ${
                    isToday ? 'bg-orange-500 text-white' : 'bg-white'
                  }`}
                >
                  <p className="font-semibold">{getDayName(day).slice(0, 2)}</p>
                  <p className={`text-sm ${isToday ? 'text-orange-100' : 'text-amber-600'}`}>
                    {date.getDate()}.
                  </p>
                </div>
              );
            })}
          </div>

          {/* Meal Types */}
          {mealTypes.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
              <div className="p-2 flex items-center">
                <span className="text-sm font-medium text-amber-700">
                  {getMealTypeName(mealType)}
                </span>
              </div>
              {days.map((day) => {
                const meal = getMealForSlot(day, mealType);
                return (
                  <MealSlot
                    key={`${day}-${mealType}`}
                    day={day}
                    mealType={mealType}
                    recipe={meal?.recipe || null}
                    servings={meal?.servings || 4}
                    onSelect={(recipe, servings) => handleMealSelect(day, mealType, recipe, servings)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Clear Week Button */}
        {plannedMeals.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 mx-auto"
            >
              <Trash2 className="w-4 h-4" />
              Woche leeren
            </button>
          </div>
        )}
      </main>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-amber-950 mb-4">Wochenvorlagen</h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="w-full p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-left transition-colors"
                >
                  <p className="font-medium text-amber-950">{template.name}</p>
                  <p className="text-sm text-amber-600">{template.description}</p>
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowTemplates(false)}
              className="w-full mt-4"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Copy Week Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-amber-950 mb-4">Woche kopieren</h2>
            <p className="text-amber-600 mb-4">
              Wähle die Zielwoche, in die der aktuelle Plan kopiert werden soll:
            </p>
            <div className="space-y-2 mb-4">
              {[-2, -1, 1, 2, 3, 4].map((offset) => {
                const targetDate = new Date(currentWeek);
                targetDate.setDate(targetDate.getDate() + offset * 7);
                const isSelected = targetWeekOffset === offset;
                return (
                  <button
                    key={offset}
                    onClick={() => setTargetWeekOffset(offset)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    <p className="font-medium">KW {getWeekNumber(targetDate)}</p>
                    <p className={`text-sm ${isSelected ? 'text-orange-100' : 'text-amber-600'}`}>
                      {targetDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} -
                      {new Date(targetDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCopyDialog(false);
                  setTargetWeekOffset(null);
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleCopyWeek}
                disabled={targetWeekOffset === null || plannedMeals.length === 0}
                className="flex-1"
              >
                Kopieren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toasts */}
      {copySuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Copy className="w-4 h-4" />
          Woche erfolgreich kopiert!
        </div>
      )}
      {templateSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <LayoutTemplate className="w-4 h-4" />
          {templateSuccess} angewendet!
        </div>
      )}

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-950 mb-2">Woche leeren?</h2>
            <p className="text-amber-600 mb-6">
              Möchtest du wirklich alle geplanten Mahlzeiten für diese Woche entfernen?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleClearWeek}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Leeren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerPage;
