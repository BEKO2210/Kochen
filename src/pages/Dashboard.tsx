import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Heart,
  Calendar,
  ShoppingCart,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Utensils,
} from 'lucide-react';
import { RecipeCard } from '../components/ui/RecipeCard';
import { useRecipes } from '../hooks/useRecipes';
import { useMealPlanner, getDayName } from '../hooks/useMealPlanner';
import { useSettingsStore } from '../store/settings-store';
import { Recipe, DayOfWeek } from '../types';

interface TodaysMeal {
  mealType: string;
  recipeName: string;
  recipeId: string;
  servings: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { recipes, favoriteRecipes, isLoading: recipesLoading } = useRecipes();
  const { plannedMeals, getMealsForDay, isLoading: plannerLoading } = useMealPlanner();
  const { defaultServings } = useSettingsStore();
  
  const [todaysMeals, setTodaysMeals] = useState<TodaysMeal[]>([]);
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    favorites: 0,
    plannedThisWeek: 0,
    quickRecipes: 0,
  });

  // Get today's day name
  const getTodayDayName = (): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return days[today];
  };

  // Load today's meals from planner
  useEffect(() => {
    const today = getTodayDayName();
    const meals = getMealsForDay(today);
    
    const formattedMeals: TodaysMeal[] = meals.map(meal => ({
      mealType: meal.mealType === 'breakfast' ? 'Frühstück' :
                meal.mealType === 'lunch' ? 'Mittagessen' :
                meal.mealType === 'dinner' ? 'Abendessen' : 'Snack',
      recipeName: meal.recipe.title,
      recipeId: meal.recipe.id,
      servings: meal.servings,
    }));
    
    setTodaysMeals(formattedMeals);
  }, [plannedMeals, getMealsForDay]);

  // Generate suggestions
  useEffect(() => {
    if (recipes.length > 0) {
      // Quick recipes (under 30 min)
      const quick = recipes.filter(r => r.prepTime + r.cookTime <= 30).slice(0, 3);
      
      // Random suggestions from favorites or highly rated
      const favoritesOrGood = recipes.filter(r => r.isFavorite || (r.rating && r.rating >= 4));
      const shuffled = [...favoritesOrGood].sort(() => 0.5 - Math.random());
      
      setSuggestions(quick.length > 0 ? quick : shuffled.slice(0, 3));
    }
  }, [recipes]);

  // Calculate stats
  useEffect(() => {
    setStats({
      totalRecipes: recipes.length,
      favorites: favoriteRecipes.length,
      plannedThisWeek: plannedMeals.length,
      quickRecipes: recipes.filter(r => r.prepTime + r.cookTime <= 30).length,
    });
  }, [recipes, favoriteRecipes, plannedMeals]);

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleStartCooking = (recipeId: string) => {
    navigate(`/cooking/${recipeId}`);
  };

  const isLoading = recipesLoading || plannerLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-amber-700">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-8 h-8" />
            <h1 className="text-2xl font-bold">KochPlan</h1>
          </div>
          <p className="text-orange-100">
            {new Date().toLocaleDateString('de-DE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={BookOpen}
            value={stats.totalRecipes}
            label="Rezepte"
            color="bg-blue-500"
            onClick={() => navigate('/recipes')}
          />
          <StatCard
            icon={Heart}
            value={stats.favorites}
            label="Favoriten"
            color="bg-red-500"
            onClick={() => navigate('/recipes?favorites=true')}
          />
          <StatCard
            icon={Calendar}
            value={stats.plannedThisWeek}
            label="Geplant"
            color="bg-green-500"
            onClick={() => navigate('/planner')}
          />
          <StatCard
            icon={Clock}
            value={stats.quickRecipes}
            label="Schnell (< 30min)"
            color="bg-purple-500"
            onClick={() => navigate('/recipes?maxTime=30')}
          />
        </section>

        {/* Today's Meals */}
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Heutige Mahlzeiten
            </h2>
            <button
              onClick={() => navigate('/planner')}
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Zum Planer
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {todaysMeals.length > 0 ? (
            <div className="space-y-3">
              {todaysMeals.map((meal, index) => (
                <div
                  key={index}
                  onClick={() => handleRecipeClick(meal.recipeId)}
                  className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-amber-600 font-medium">{meal.mealType}</p>
                    <p className="font-semibold text-amber-950">{meal.recipeName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCooking(meal.recipeId);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Kochen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-amber-50 rounded-xl">
              <Calendar className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <p className="text-amber-700 mb-2">Noch nichts für heute geplant</p>
              <button
                onClick={() => navigate('/planner')}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Wochenplan öffnen
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={ShoppingCart}
            label="Einkaufsliste"
            description="Zutaten für die Woche"
            onClick={() => navigate('/shopping')}
            color="bg-green-500"
          />
          <QuickActionButton
            icon={Sparkles}
            label="Zufälliges Rezept"
            description="Lass dich inspirieren"
            onClick={() => {
              if (recipes.length > 0) {
                const random = recipes[Math.floor(Math.random() * recipes.length)];
                handleRecipeClick(random.id);
              }
            }}
            color="bg-purple-500"
          />
        </section>

        {/* Favorites */}
        {favoriteRecipes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-amber-950 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Deine Favoriten
              </h2>
              <button
                onClick={() => navigate('/recipes?favorites=true')}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Alle anzeigen
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoriteRecipes.slice(0, 4).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={{
                    id: recipe.id,
                    title: recipe.title,
                    prepTime: recipe.prepTime + recipe.cookTime,
                    servings: recipe.servings,
                    tags: recipe.tags,
                    isFavorite: recipe.isFavorite,
                    difficulty: recipe.difficulty,
                  }}
                  variant="compact"
                  onClick={() => handleRecipeClick(recipe.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-amber-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Was koche ich heute?
              </h2>
              <button
                onClick={() => {
                  const shuffled = [...recipes].sort(() => 0.5 - Math.random());
                  setSuggestions(shuffled.slice(0, 3));
                }}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Neue Vorschläge
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestions.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={{
                    id: recipe.id,
                    title: recipe.title,
                    prepTime: recipe.prepTime + recipe.cookTime,
                    servings: recipe.servings,
                    tags: recipe.tags,
                    isFavorite: recipe.isFavorite,
                    difficulty: recipe.difficulty,
                  }}
                  variant="default"
                  onClick={() => handleRecipeClick(recipe.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State for New Users */}
        {recipes.length === 0 && (
          <section className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 text-center">
            <ChefHat className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-950 mb-2">
              Willkommen bei KochPlan!
            </h2>
            <p className="text-amber-700 mb-6 max-w-md mx-auto">
              Starte deine kulinarische Reise. Füge deine ersten Rezepte hinzu oder importiere sie aus dem Internet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/recipes/new')}
                className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                Erstes Rezept erstellen
              </button>
              <button
                onClick={() => navigate('/recipes')}
                className="px-6 py-3 bg-white text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-colors"
              >
                Rezept importieren
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// Helper Components

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, value, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
  >
    <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-amber-950">{value}</p>
    <p className="text-sm text-amber-600">{label}</p>
  </button>
);

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  color 
}) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="font-semibold text-amber-950">{label}</p>
      <p className="text-sm text-amber-600">{description}</p>
    </div>
  </button>
);

export default Dashboard;
