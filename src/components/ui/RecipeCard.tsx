/**
 * RecipeCard Komponente
 * 
 * Eine wiederverwendbare Karte zur Anzeige von Rezepten.
 * Unterstützt verschiedene Varianten und den Kitchen Mode.
 * 
 * @example
 * <RecipeCard
 *   recipe={{
 *     id: '1',
 *     title: 'Spaghetti Carbonara',
 *     image: '/images/carbonara.jpg',
 *     prepTime: 30,
 *     servings: 4,
 *     tags: ['Pasta', 'Schnell'],
 *     isFavorite: false
 *   }}
 *   onFavoriteToggle={(id) => console.log('Toggle favorite:', id)}
 * />
 */

import { useState } from 'react';
import { Clock, Users, Heart, ChefHat } from './icons';

// ============================================
// Types
// ============================================

export interface Recipe {
  id: string;
  title: string;
  image?: string;
  imageUrl?: string;
  prepTime: number; // in Minuten
  servings: number;
  tags?: string[];
  isFavorite?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
}

export interface RecipeCardProps {
  recipe: Recipe;
  variant?: 'default' | 'compact' | 'featured' | 'horizontal';
  isKitchenMode?: boolean;
  onClick?: (recipe: Recipe) => void;
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

// ============================================
// Helpers
// ============================================

function getRecipeImage(recipe: Recipe): string | undefined {
  return recipe.image || recipe.imageUrl;
}

// ============================================
// Component
// ============================================

export function RecipeCard({
  recipe,
  variant = 'default',
  isKitchenMode = false,
  onClick,
  onFavoriteToggle,
  className = '',
}: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const isFavorite = recipe.isFavorite ?? false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(recipe.id);
  };

  const handleClick = () => {
    onClick?.(recipe);
  };

  // Kitchen Mode Styles
  if (isKitchenMode) {
    return (
      <KitchenModeCard
        recipe={recipe}
        isFavorite={isFavorite}
        onFavoriteClick={handleFavoriteClick}
        onClick={handleClick}
        className={className}
      />
    );
  }

  // Varianten
  switch (variant) {
    case 'compact':
      return (
        <CompactCard
          recipe={recipe}
          isFavorite={isFavorite}
          onFavoriteClick={handleFavoriteClick}
          onClick={handleClick}
          className={className}
        />
      );
    case 'featured':
      return (
        <FeaturedCard
          recipe={recipe}
          isFavorite={isFavorite}
          onFavoriteClick={handleFavoriteClick}
          onClick={handleClick}
          className={className}
        />
      );
    case 'horizontal':
      return (
        <HorizontalCard
          recipe={recipe}
          isFavorite={isFavorite}
          onFavoriteClick={handleFavoriteClick}
          onClick={handleClick}
          className={className}
        />
      );
    default:
      return (
        <DefaultCard
          recipe={recipe}
          isFavorite={isFavorite}
          imageError={imageError}
          onImageError={() => setImageError(true)}
          onFavoriteClick={handleFavoriteClick}
          onClick={handleClick}
          className={className}
        />
      );
  }
}

// ============================================
// Sub-Components
// ============================================

function DefaultCard({
  recipe,
  isFavorite,
  imageError,
  onImageError,
  onFavoriteClick,
  onClick,
  className,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  imageError: boolean;
  onImageError: () => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
  className: string;
}) {
  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-md overflow-hidden
        hover:shadow-lg hover:scale-[1.02]
        transition-all duration-200 cursor-pointer
        ${className}
      `}
    >
      {/* Bild */}
      <div className="aspect-video bg-amber-100 relative">
        {getRecipeImage(recipe) && !imageError ? (
          <img
            src={getRecipeImage(recipe)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={onImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-amber-300" />
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={onFavoriteClick}
          className={`
            absolute top-3 right-3
            w-10 h-10 rounded-full
            flex items-center justify-center
            transition-all duration-150
            ${isFavorite 
              ? 'bg-orange-500 text-white' 
              : 'bg-white/90 text-amber-700 hover:bg-white'
            }
          `}
          aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart 
            className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} 
          />
        </button>
        
        {/* Schwierigkeits-Badge */}
        {recipe.difficulty && (
          <DifficultyBadge difficulty={recipe.difficulty} />
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-amber-950 line-clamp-2">
          {recipe.title}
        </h3>
        
        {/* Meta-Infos */}
        <div className="flex items-center gap-4 mt-2 text-sm text-amber-700">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {recipe.prepTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {recipe.servings} Pers.
          </span>
        </div>
        
        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Rating */}
        {recipe.rating && (
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < recipe.rating! 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function CompactCard({
  recipe,
  isFavorite,
  onFavoriteClick,
  onClick,
  className,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
  className: string;
}) {
  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm p-4
        hover:shadow-md transition-shadow duration-200 cursor-pointer
        flex items-center gap-4
        ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-amber-950 truncate">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-amber-700">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {recipe.prepTime} min
          </span>
        </div>
      </div>
      
      <button
        onClick={onFavoriteClick}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-colors duration-150
          ${isFavorite 
            ? 'bg-orange-100 text-orange-500' 
            : 'bg-amber-50 text-amber-400 hover:bg-amber-100'
          }
        `}
        aria-label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>
    </article>
  );
}

function FeaturedCard({
  recipe,
  isFavorite,
  onFavoriteClick,
  onClick,
  className,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
  className: string;
}) {
  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-lg overflow-hidden
        hover:shadow-xl hover:scale-[1.01]
        transition-all duration-200 cursor-pointer
        ${className}
      `}
    >
      <div className="aspect-[16/10] bg-amber-100 relative">
        {getRecipeImage(recipe) ? (
          <img
            src={getRecipeImage(recipe)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-24 h-24 text-amber-300" />
          </div>
        )}
        
        <button
          onClick={onFavoriteClick}
          className={`
            absolute top-4 right-4
            w-12 h-12 rounded-full
            flex items-center justify-center
            transition-all duration-150
            ${isFavorite 
              ? 'bg-orange-500 text-white' 
              : 'bg-white/90 text-amber-700 hover:bg-white'
            }
          `}
        >
          <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-amber-950">
          {recipe.title}
        </h3>
        
        <div className="flex items-center gap-6 mt-3 text-amber-700">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {recipe.prepTime} Minuten
          </span>
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {recipe.servings} Personen
          </span>
        </div>
        
        {recipe.tags && (
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function HorizontalCard({
  recipe,
  isFavorite,
  onFavoriteClick,
  onClick,
  className,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
  className: string;
}) {
  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-md overflow-hidden
        hover:shadow-lg transition-shadow duration-200 cursor-pointer
        flex
        ${className}
      `}
    >
      <div className="w-32 sm:w-40 bg-amber-100 flex-shrink-0">
        {getRecipeImage(recipe) ? (
          <img
            src={getRecipeImage(recipe)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-amber-300" />
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-amber-950 line-clamp-2">
            {recipe.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-2 text-sm text-amber-700">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.prepTime} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          {recipe.tags && recipe.tags.length > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
              {recipe.tags[0]}
            </span>
          )}
          
          <button
            onClick={onFavoriteClick}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-colors duration-150
              ${isFavorite 
                ? 'bg-orange-100 text-orange-500' 
                : 'bg-amber-50 text-amber-400 hover:bg-amber-100'
              }
            `}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}

function KitchenModeCard({
  recipe,
  isFavorite,
  onFavoriteClick,
  onClick,
  className,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
  className: string;
}) {
  return (
    <article
      onClick={onClick}
      className={`
        bg-neutral-800 rounded-2xl overflow-hidden
        active:bg-neutral-700 transition-colors duration-150 cursor-pointer
        ${className}
      `}
    >
      <div className="aspect-video bg-neutral-700 relative">
        {getRecipeImage(recipe) ? (
          <img
            src={getRecipeImage(recipe)}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-20 h-20 text-neutral-600" />
          </div>
        )}
        
        <button
          onClick={onFavoriteClick}
          className={`
            absolute top-4 right-4
            w-14 h-14 rounded-xl
            flex items-center justify-center
            transition-colors duration-150
            ${isFavorite 
              ? 'bg-orange-500 text-white' 
              : 'bg-neutral-700 text-neutral-400'
            }
          `}
        >
          <Heart className={`w-7 h-7 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-white">
          {recipe.title}
        </h3>
        
        <div className="flex items-center gap-6 mt-4 text-neutral-400 text-lg">
          <span className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            {recipe.prepTime} min
          </span>
          <span className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            {recipe.servings} Pers.
          </span>
        </div>
        
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-5">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-neutral-700 text-white text-base font-medium rounded-xl"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================
// Helper Components
// ============================================

function DifficultyBadge({ difficulty }: { difficulty: Recipe['difficulty'] }) {
  const config = {
    easy: { text: 'Einfach', color: 'bg-green-500' },
    medium: { text: 'Mittel', color: 'bg-yellow-500' },
    hard: { text: 'Schwer', color: 'bg-red-500' },
  };
  
  const { text, color } = config[difficulty || 'easy'];
  
  return (
    <span className={`
      absolute top-3 left-3
      px-2 py-1 text-xs font-medium text-white rounded-full
      ${color}
    `}>
      {text}
    </span>
  );
}

// ============================================
// Export
// ============================================

export default RecipeCard;
