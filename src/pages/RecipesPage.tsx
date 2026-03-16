import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Download,
  Heart,
  Clock,
  ChefHat,
} from 'lucide-react';
import { RecipeCard } from '../components/ui/RecipeCard';
import { useRecipes, RecipeFilter } from '../hooks/useRecipes';
import { useRecipeImport } from '../hooks/useRecipeImport';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Recipe } from '../types';

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'date' | 'time' | 'favorite';
type SortDirection = 'asc' | 'desc';

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    recipes, 
    filteredRecipes, 
    isLoading, 
    filter, 
    setFilter, 
    clearFilter,
    toggleFavorite,
    allTags,
    allCategories,
    deleteRecipe,
  } = useRecipes();
  const { importFromUrl, isImporting } = useRecipeImport();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [maxTime, setMaxTime] = useState<number | ''>('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const favoritesParam = searchParams.get('favorites');
    const maxTimeParam = searchParams.get('maxTime');
    
    if (favoritesParam === 'true') {
      setFavoritesOnly(true);
      setFilter({ ...filter, onlyFavorites: true });
    }
    
    if (maxTimeParam) {
      const time = parseInt(maxTimeParam, 10);
      setMaxTime(time);
      setFilter({ ...filter, maxPrepTime: time });
    }
  }, []);

  // Apply filters
  useEffect(() => {
    const newFilter: RecipeFilter = {
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
      difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard' | undefined,
      maxPrepTime: maxTime || undefined,
      onlyFavorites: favoritesOnly || undefined,
    };
    setFilter(newFilter);
  }, [searchQuery, selectedTags, selectedCategories, selectedDifficulty, maxTime, favoritesOnly]);

  // Sort recipes
  const sortedRecipes = useMemo(() => {
    const sorted = [...filteredRecipes];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'time':
          comparison = (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime);
          break;
        case 'favorite':
          comparison = (a.isFavorite === b.isFavorite) ? 0 : a.isFavorite ? -1 : 1;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRecipes, sortField, sortDirection]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategories([]);
    setSelectedDifficulty('');
    setMaxTime('');
    setFavoritesOnly(false);
    clearFilter();
    setSearchParams({});
  };

  // Handle import
  const handleImport = async () => {
    if (!importUrl.trim()) return;
    
    try {
      await importFromUrl(importUrl);
      setImportUrl('');
      setShowImportDialog(false);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  // Handle recipe click
  const handleRecipeClick = (recipe: Recipe) => {
    navigate(`/recipes/${recipe.id}`);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (id: string) => {
    await toggleFavorite(id);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Möchtest du dieses Rezept wirklich löschen?')) {
      await deleteRecipe(id);
    }
  };

  // Active filters count
  const activeFiltersCount = 
    selectedTags.length + 
    selectedCategories.length + 
    (selectedDifficulty ? 1 : 0) + 
    (maxTime ? 1 : 0) + 
    (favoritesOnly ? 1 : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-amber-700 dark:text-gray-300">Lade Rezepte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-amber-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-amber-950 dark:text-white flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-orange-500" />
              Rezepte
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                disabled={isImporting}
              >
                <Download className="w-4 h-4 mr-1" />
                Import
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/recipes/new')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Neues Rezept
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <Input
                type="text"
                placeholder="Rezepte suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-amber-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-colors relative ${
                showFilters || activeFiltersCount > 0
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-amber-200 hover:border-orange-300'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="flex border border-amber-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-amber-50 dark:bg-gray-900'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-amber-50 dark:bg-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-amber-100 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Favorites Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  favoritesOnly
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-amber-200 hover:border-amber-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-current' : ''}`} />
                Nur Favoriten
              </button>
            </div>

            {/* Categories */}
            {allCategories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-amber-700 dark:text-gray-300 mb-2">Kategorien</h3>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-100 dark:bg-gray-700 text-amber-700 dark:text-gray-300 hover:bg-amber-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-amber-700 dark:text-gray-300 mb-2">Schwierigkeit</h3>
              <div className="flex flex-wrap gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? '' : diff)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedDifficulty === diff
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-100 dark:bg-gray-700 text-amber-700 dark:text-gray-300 hover:bg-amber-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {diff === 'easy' ? 'Einfach' : diff === 'medium' ? 'Mittel' : 'Schwer'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-amber-700 dark:text-gray-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-100 dark:bg-gray-700 text-amber-700 dark:text-gray-300 hover:bg-amber-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Max Time */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-amber-700 dark:text-gray-300 mb-2">Max. Zeit</h3>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((time) => (
                  <button
                    key={time}
                    onClick={() => setMaxTime(maxTime === time ? '' : time)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                      maxTime === time
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-100 dark:bg-gray-700 text-amber-700 dark:text-gray-300 hover:bg-amber-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {time} min
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-700 dark:text-gray-300">Sortieren nach:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="px-3 py-1.5 rounded-lg border border-amber-200 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="date">Datum</option>
                  <option value="title">Name</option>
                  <option value="time">Zeit</option>
                  <option value="favorite">Favoriten</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 dark:bg-gray-900"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <p className="text-sm text-amber-600 dark:text-gray-400">
          {sortedRecipes.length} {sortedRecipes.length === 1 ? 'Rezept' : 'Rezepte'} gefunden
          {recipes.length !== sortedRecipes.length && ` (von ${recipes.length} insgesamt)`}
        </p>
      </div>

      {/* Recipe Grid/List */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {sortedRecipes.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {sortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: recipe.id,
                  title: recipe.title,
                  image: recipe.imageUrl,
                  prepTime: recipe.prepTime + recipe.cookTime,
                  servings: recipe.servings,
                  tags: recipe.tags,
                  isFavorite: recipe.isFavorite,
                  difficulty: recipe.difficulty,
                  rating: recipe.rating,
                }}
                variant={viewMode === 'list' ? 'horizontal' : 'default'}
                onClick={() => handleRecipeClick(recipe)}
                onFavoriteToggle={() => handleFavoriteToggle(recipe.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ChefHat className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-950 dark:text-white mb-2">
              Keine Rezepte gefunden
            </h3>
            <p className="text-amber-600 dark:text-gray-400 mb-6">
              {searchQuery || activeFiltersCount > 0
                ? 'Versuche andere Suchbegriffe oder Filter'
                : 'Füge dein erstes Rezept hinzu'}
            </p>
            {searchQuery || activeFiltersCount > 0 ? (
              <Button variant="secondary" onClick={handleClearFilters}>
                Filter zurücksetzen
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="primary" onClick={() => navigate('/recipes/new')}>
                  <Plus className="w-4 h-4 mr-1" />
                  Rezept erstellen
                </Button>
                <Button variant="secondary" onClick={() => setShowImportDialog(true)}>
                  <Download className="w-4 h-4 mr-1" />
                  Rezept importieren
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-amber-950 dark:text-white mb-4">
              Rezept importieren
            </h2>
            <p className="text-amber-600 dark:text-gray-400 mb-4">
              Füge die URL eines Rezepts von unterstützten Websites ein.
            </p>
            <Input
              type="url"
              placeholder="https://..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportUrl('');
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!importUrl.trim() || isImporting}
                className="flex-1"
              >
                {isImporting ? 'Importiere...' : 'Importieren'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesPage;
