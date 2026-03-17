import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Play,
  Share2,
  ShoppingCart,
  Clock,
  Users,
  ChefHat,
  AlertCircle,
} from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';
import { useShoppingList } from '../hooks/useShoppingList';
import { Button } from '../components/ui/Button';
import { ServingsScaler } from '../components/recipes/ServingsScaler';
import { Recipe } from '../types';

interface Ingredient {
  id: string;
  amount: number;
  unit: string;
  name: string;
  optional: boolean;
}

interface Step {
  id: string;
  order: number;
  description: string;
  timerMinutes?: number;
}

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, toggleFavorite, isLoading } = useRecipes();
  const { addFromIngredients, createList, currentList } = useShoppingList();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentServings, setCurrentServings] = useState(4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showShareToast, setShowShareToast] = useState(false);
  const [showAddToListToast, setShowAddToListToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recipe
  useEffect(() => {
    if (!id) {
      setError('Keine Rezept-ID angegeben');
      return;
    }

    const foundRecipe = getRecipeById(id);
    if (foundRecipe) {
      setRecipe(foundRecipe);
      setCurrentServings(foundRecipe.servings);
      setError(null);
    } else {
      setError('Rezept nicht gefunden');
    }
  }, [id, getRecipeById]);

  // Calculate scaling factor
  const scalingFactor = recipe ? currentServings / recipe.servings : 1;

  // Scale amount
  const scaleAmount = (amount: number): string => {
    const scaled = amount * scalingFactor;
    if (scaled < 0.1) return scaled.toFixed(2);
    if (scaled < 1) return scaled.toFixed(1);
    if (scaled % 1 === 0) return scaled.toString();
    return scaled.toFixed(1);
  };

  // Toggle ingredient check
  const toggleIngredientCheck = (id: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIngredients(newChecked);
  };

  // Toggle step complete
  const toggleStepComplete = (id: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedSteps(newCompleted);
  };

  // Handle share
  const handleShare = async () => {
    if (!recipe) return;

    const shareData = {
      title: recipe.title,
      text: recipe.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Handle add to shopping list
  const handleAddToShoppingList = () => {
    if (!recipe) return;

    // Create a new list if none exists
    if (!currentList) {
      createList(`Einkaufsliste für ${recipe.title}`);
    }

    // Add ingredients
    const ingredients: Ingredient[] = recipe.ingredients.map(ing => ({
      id: ing.id || `${Date.now()}-${Math.random()}`,
      amount: ing.amount * scalingFactor,
      unit: ing.unit,
      name: ing.name,
      optional: ing.isOptional || false,
    }));

    addFromIngredients(ingredients, recipe.title, scalingFactor);
    setShowAddToListToast(true);
    setTimeout(() => setShowAddToListToast(false), 2000);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!recipe) return;
    await toggleFavorite(recipe.id);
    // Refresh recipe data
    const updated = getRecipeById(recipe.id);
    if (updated) {
      setRecipe(updated);
    }
  };

  // Handle start cooking
  const handleStartCooking = () => {
    if (!recipe) return;
    navigate(`/cooking/${recipe.id}`);
  };

  // Handle edit
  const handleEdit = () => {
    if (!recipe) return;
    navigate(`/recipes/${recipe.id}/edit`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-amber-700 dark:text-gray-300">Lade Rezept...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-950 dark:text-white mb-2">
            {error || 'Rezept nicht gefunden'}
          </h1>
          <p className="text-amber-600 dark:text-gray-400 mb-6">
            Das gesuchte Rezept existiert nicht oder wurde gelöscht.
          </p>
          <Button variant="primary" onClick={() => navigate('/recipes')}>
            Zurück zur Rezeptübersicht
          </Button>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-amber-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/recipes')}
              className="flex items-center gap-2 text-amber-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                title="Teilen"
              >
                <Share2 className="w-5 h-5 text-amber-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleEdit}
                className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                title="Bearbeiten"
              >
                <Edit3 className="w-5 h-5 text-amber-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 bg-amber-100 dark:bg-gray-700 rounded-2xl overflow-hidden mb-6">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-amber-300" />
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              recipe.isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800/90 text-amber-700 dark:text-gray-300 hover:bg-white dark:bg-gray-800'
            }`}
          >
            <svg
              className={`w-6 h-6 ${recipe.isFavorite ? 'fill-current' : ''}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* Difficulty Badge */}
          {recipe.difficulty && (
            <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium text-white ${
              recipe.difficulty === 'easy' ? 'bg-green-500' :
              recipe.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {recipe.difficulty === 'easy' ? 'Einfach' :
               recipe.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-950 dark:text-white mb-3">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-amber-700 dark:text-gray-300 leading-relaxed">{recipe.description}</p>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-amber-600 dark:text-gray-400">Vorbereitung</p>
              <p className="font-medium text-amber-950 dark:text-white">{recipe.prepTime} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-amber-600 dark:text-gray-400">Kochen</p>
              <p className="font-medium text-amber-950 dark:text-white">{recipe.cookTime} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-amber-600 dark:text-gray-400">Gesamt</p>
              <p className="font-medium text-amber-950 dark:text-white">{totalTime} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-amber-600 dark:text-gray-400">Portionen</p>
              <p className="font-medium text-amber-950 dark:text-white">{recipe.servings}</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button
            variant="primary"
            onClick={handleStartCooking}
            className="flex-1"
          >
            <Play className="w-5 h-5 mr-2" />
            Koch-Modus starten
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddToShoppingList}
            className="flex-1"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Zur Einkaufsliste
          </Button>
        </div>

        {/* Servings Scaler */}
        <div className="mb-8">
          <ServingsScaler
            originalServings={recipe.servings}
            currentServings={currentServings}
            onChange={setCurrentServings}
          />
        </div>

        {/* Ingredients */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-950 dark:text-white mb-4">Zutaten</h2>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <div
                key={ingredient.id || ingredient.name}
                onClick={() => toggleIngredientCheck(ingredient.id || ingredient.name)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  checkedIngredients.has(ingredient.id || ingredient.name)
                    ? 'bg-green-50'
                    : 'hover:bg-amber-50 dark:bg-gray-900'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  checkedIngredients.has(ingredient.id || ingredient.name)
                    ? 'bg-green-500 border-green-500'
                    : 'border-amber-300'
                }`}>
                  {checkedIngredients.has(ingredient.id || ingredient.name) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`flex-1 ${
                  checkedIngredients.has(ingredient.id || ingredient.name)
                    ? 'text-green-700 line-through'
                    : 'text-amber-950 dark:text-white'
                }`}>
                  {scaleAmount(ingredient.amount)} {ingredient.unit} {ingredient.name}
                </span>
                {ingredient.isOptional && (
                  <span className="text-xs text-amber-500">(optional)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-950 dark:text-white mb-4">Zubereitung</h2>
          <div className="space-y-4">
            {recipe.steps.map((step, index) => (
              <div
                key={step.id || index}
                onClick={() => toggleStepComplete(step.id || `${index}`)}
                className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                  completedSteps.has(step.id || `${index}`)
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-amber-50 dark:bg-gray-900 hover:bg-amber-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  completedSteps.has(step.id || `${index}`)
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
                }`}>
                  {completedSteps.has(step.id || `${index}`) ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <p className={`leading-relaxed ${
                    completedSteps.has(step.id || `${index}`)
                      ? 'text-green-700 line-through'
                      : 'text-amber-950 dark:text-white'
                  }`}>
                    {step.description}
                  </p>
                  {step.duration && (
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                      <Clock className="w-4 h-4" />
                      {step.duration} min
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-yellow-800 mb-2">Notizen</h2>
            <p className="text-yellow-700">{recipe.notes}</p>
          </div>
        )}

        {/* Source */}
        {recipe.source && (
          <div className="text-sm text-amber-600 dark:text-gray-400">
            Quelle: {recipe.source}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          Link kopiert!
        </div>
      )}
      {showAddToListToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Zur Einkaufsliste hinzugefügt!
        </div>
      )}
    </div>
  );
};

export default RecipeDetailPage;
