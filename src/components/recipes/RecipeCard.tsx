import React from 'react';
import { Heart, Clock, ChefHat, Users, Flame } from 'lucide-react';

export interface Recipe {
  id: string;
  title: string;
  image?: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  dietLabels: string[];
  isFavorite: boolean;
  category?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  compact?: boolean;
}

const difficultyLabels: Record<string, { label: string; color: string; icon: number }> = {
  easy: { label: 'Einfach', color: '#22c55e', icon: 1 },
  medium: { label: 'Mittel', color: '#f59e0b', icon: 2 },
  hard: { label: 'Schwer', color: '#ef4444', icon: 3 },
};

const dietLabelColors: Record<string, string> = {
  vegetarian: '#22c55e',
  vegan: '#16a34a',
  glutenFree: '#f59e0b',
  dairyFree: '#3b82f6',
  keto: '#8b5cf6',
  lowCarb: '#06b6d4',
  highProtein: '#f97316',
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onToggleFavorite,
  compact = false,
}) => {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const difficulty = difficultyLabels[recipe.difficulty];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(recipe.id);
  };

  if (compact) {
    return (
      <div
        onClick={() => onPress(recipe)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            backgroundColor: recipe.image ? 'transparent' : '#f3f4f6',
            backgroundImage: recipe.image ? `url(${recipe.image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {!recipe.image && <ChefHat size={24} color="#9ca3af" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: '#1f2937',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {recipe.title}
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            <Clock size={12} />
            <span>{totalTime} Min</span>
            <span style={{ color: difficulty.color }}>{difficulty.label}</span>
          </div>
        </div>
        <button
          onClick={handleFavoriteClick}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Heart
            size={20}
            fill={recipe.isFavorite ? '#ef4444' : 'none'}
            color={recipe.isFavorite ? '#ef4444' : '#9ca3af'}
          />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onPress(recipe)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Image Container */}
      <div
        style={{
          position: 'relative',
          height: '180px',
          backgroundColor: recipe.image ? 'transparent' : '#f3f4f6',
          backgroundImage: recipe.image ? `url(${recipe.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!recipe.image && <ChefHat size={48} color="#d1d5db" />}
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
          }}
        >
          <Heart
            size={20}
            fill={recipe.isFavorite ? '#ef4444' : 'none'}
            color={recipe.isFavorite ? '#ef4444' : '#6b7280'}
          />
        </button>

        {/* Difficulty Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '6px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            color: difficulty.color,
          }}
        >
          {Array.from({ length: difficulty.icon }).map((_, i) => (
            <Flame key={i} size={12} fill={difficulty.color} />
          ))}
          <span>{difficulty.label}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {recipe.title}
        </h3>

        {/* Meta Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '12px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} />
            <span>{totalTime} Min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={14} />
            <span>{recipe.servings} Port.</span>
          </div>
        </div>

        {/* Diet Labels */}
        {recipe.dietLabels.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '12px',
            }}
          >
            {recipe.dietLabels.slice(0, 3).map((label) => (
              <span
                key={label}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: `${dietLabelColors[label] || '#6b7280'}20`,
                  color: dietLabelColors[label] || '#6b7280',
                  textTransform: 'capitalize',
                }}
              >
                {label === 'glutenFree'
                  ? 'Glutenfrei'
                  : label === 'dairyFree'
                  ? 'Laktosefrei'
                  : label === 'highProtein'
                  ? 'High Protein'
                  : label === 'lowCarb'
                  ? 'Low Carb'
                  : label}
              </span>
            ))}
            {recipe.dietLabels.length > 3 && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                }}
              >
                +{recipe.dietLabels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
