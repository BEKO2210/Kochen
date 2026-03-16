import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Clock,
  Users,
  ChefHat,
  Edit3,
  Trash2,
  Play,
  Flame,
  Share2,
  Printer,
  ShoppingCart,
} from 'lucide-react';
import { ServingsScaler } from './ServingsScaler';

export interface Ingredient {
  id: string;
  amount: number;
  unit: string;
  name: string;
  optional: boolean;
}

export interface Step {
  id: string;
  order: number;
  description: string;
  timerMinutes?: number;
}

export interface RecipeDetailData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  dietLabels: string[];
  category?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  notes?: string;
  source?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipeDetailProps {
  recipe: RecipeDetailData;
  onBack: () => void;
  onEdit: (recipe: RecipeDetailData) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartCooking: (recipe: RecipeDetailData) => void;
  onAddToShoppingList: (ingredients: Ingredient[]) => void;
  onShare: (recipe: RecipeDetailData) => void;
}

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Einfach', color: '#22c55e' },
  medium: { label: 'Mittel', color: '#f59e0b' },
  hard: { label: 'Schwer', color: '#ef4444' },
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

const unitAbbreviations: Record<string, string> = {
  piece: 'Stk',
  gram: 'g',
  kilogram: 'kg',
  milliliter: 'ml',
  liter: 'l',
  teaspoon: 'TL',
  tablespoon: 'EL',
  cup: 'Tasse',
  pinch: 'Prise',
  bunch: 'Bund',
  can: 'Dose',
  package: 'Pck',
  slice: 'Scheibe',
  clove: 'Zehe',
};

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  onStartCooking,
  onAddToShoppingList,
  onShare,
}) => {
  const [currentServings, setCurrentServings] = useState(recipe.servings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const totalTime = recipe.prepTime + recipe.cookTime;
  const difficulty = difficultyLabels[recipe.difficulty];
  const scalingFactor = currentServings / recipe.servings;

  const scaleAmount = (amount: number): string => {
    const scaled = amount * scalingFactor;
    if (scaled < 0.1) return scaled.toFixed(2);
    if (scaled < 1) return scaled.toFixed(1);
    if (scaled % 1 === 0) return scaled.toString();
    return scaled.toFixed(1);
  };

  const toggleIngredientCheck = (id: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIngredients(newChecked);
  };

  const toggleStepComplete = (id: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedSteps(newCompleted);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(recipe.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
        >
          <ArrowLeft size={18} />
          Zurück
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onShare(recipe)}
            style={{
              padding: '10px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            <Share2 size={18} color="#6b7280" />
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            <Printer size={18} color="#6b7280" />
          </button>
          <button
            onClick={() => onEdit(recipe)}
            style={{
              padding: '10px',
              backgroundColor: '#dbeafe',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }}
          >
            <Edit3 size={18} color="#3b82f6" />
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px',
              backgroundColor: showDeleteConfirm ? '#fee2e2' : '#f3f4f6',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = showDeleteConfirm ? '#fecaca' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showDeleteConfirm ? '#fee2e2' : '#f3f4f6';
            }}
          >
            <Trash2 size={18} color={showDeleteConfirm ? '#ef4444' : '#6b7280'} />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
            Möchtest du dieses Rezept wirklich löschen?
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ffffff',
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* Hero Image */}
      <div
        style={{
          position: 'relative',
          height: '300px',
          backgroundColor: recipe.image ? 'transparent' : '#f3f4f6',
          backgroundImage: recipe.image ? `url(${recipe.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        {!recipe.image && <ChefHat size={64} color="#d1d5db" />}
        
        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(recipe.id)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart
            size={24}
            fill={recipe.isFavorite ? '#ef4444' : 'none'}
            color={recipe.isFavorite ? '#ef4444' : '#6b7280'}
          />
        </button>

        {/* Difficulty Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            color: difficulty.color,
          }}
        >
          <Flame size={14} fill={difficulty.color} />
          <span>{difficulty.label}</span>
        </div>
      </div>

      {/* Title & Description */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
            color: '#1f2937',
            lineHeight: 1.3,
          }}
        >
          {recipe.title}
        </h1>
        {recipe.description && (
          <p
            style={{
              margin: '12px 0 0 0',
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            {recipe.description}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#6b7280" />
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Vorbereitung</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {recipe.prepTime} Min
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} color="#6b7280" />
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Kochen</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {recipe.cookTime} Min
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#6b7280" />
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Gesamt</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {totalTime} Min
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#6b7280" />
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Portionen</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              {recipe.servings}
            </div>
          </div>
        </div>
      </div>

      {/* Diet Labels */}
      {recipe.dietLabels.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {recipe.dietLabels.map((label) => (
              <span
                key={label}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: `${dietLabelColors[label] || '#6b7280'}15`,
                  color: dietLabelColors[label] || '#6b7280',
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
          </div>
        </div>
      )}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start Cooking Button */}
      <button
        onClick={() => onStartCooking(recipe)}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#22c55e',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: '32px',
          transition: 'background-color 0.2s, transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#16a34a';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#22c55e';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Play size={20} fill="#ffffff" />
        Koch-Modus starten
      </button>

      {/* Servings Scaler */}
      <div style={{ marginBottom: '32px' }}>
        <ServingsScaler
          originalServings={recipe.servings}
          currentServings={currentServings}
          onChange={setCurrentServings}
        />
      </div>

      {/* Ingredients Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            Zutaten
          </h2>
          <button
            onClick={() => onAddToShoppingList(recipe.ingredients)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#dbeafe',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#3b82f6',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }}
          >
            <ShoppingCart size={14} />
            Zur Einkaufsliste
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {recipe.ingredients.map((ingredient, index) => (
            <div
              key={ingredient.id}
              onClick={() => toggleIngredientCheck(ingredient.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderBottom:
                  index < recipe.ingredients.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                backgroundColor: checkedIngredients.has(ingredient.id)
                  ? '#f0fdf4'
                  : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: checkedIngredients.has(ingredient.id)
                    ? '2px solid #22c55e'
                    : '2px solid #d1d5db',
                  backgroundColor: checkedIngredients.has(ingredient.id)
                    ? '#22c55e'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {checkedIngredients.has(ingredient.id) && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: checkedIngredients.has(ingredient.id)
                      ? '#22c55e'
                      : '#374151',
                    textDecoration: checkedIngredients.has(ingredient.id)
                      ? 'line-through'
                      : 'none',
                  }}
                >
                  {scaleAmount(ingredient.amount)}{' '}
                  {unitAbbreviations[ingredient.unit] || ingredient.unit}{' '}
                  {ingredient.name}
                </span>
                {ingredient.optional && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginLeft: '8px',
                    }}
                  >
                    (optional)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          Zubereitung
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recipe.steps.map((step, index) => (
            <div
              key={step.id}
              onClick={() => toggleStepComplete(step.id)}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                backgroundColor: completedSteps.has(step.id)
                  ? '#f0fdf4'
                  : '#ffffff',
                borderRadius: '12px',
                border: completedSteps.has(step.id)
                  ? '1px solid #bbf7d0'
                  : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: completedSteps.has(step.id)
                    ? '#22c55e'
                    : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {completedSteps.has(step.id) ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: completedSteps.has(step.id) ? '#22c55e' : '#374151',
                    textDecoration: completedSteps.has(step.id)
                      ? 'line-through'
                      : 'none',
                  }}
                >
                  {step.description}
                </p>
                {step.timerMinutes && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '10px',
                      padding: '6px 12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#d97706',
                    }}
                  >
                    <Clock size={14} />
                    {step.timerMinutes} Min Timer
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fef9c3',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: '#854d0e',
            }}
          >
            Notizen
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#a16207',
              lineHeight: 1.6,
            }}
          >
            {recipe.notes}
          </p>
        </div>
      )}

      {/* Nutrition Info */}
      {recipe.nutrition && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: '#166534',
            }}
          >
            Nährwerte (pro Portion)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {recipe.nutrition.calories && (
              <div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>Kalorien</div>
                <div
                  style={{ fontSize: '16px', fontWeight: 600, color: '#166534' }}
                >
                  {recipe.nutrition.calories} kcal
                </div>
              </div>
            )}
            {recipe.nutrition.protein && (
              <div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>Protein</div>
                <div
                  style={{ fontSize: '16px', fontWeight: 600, color: '#166534' }}
                >
                  {recipe.nutrition.protein}g
                </div>
              </div>
            )}
            {recipe.nutrition.carbs && (
              <div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>Kohlenhydrate</div>
                <div
                  style={{ fontSize: '16px', fontWeight: 600, color: '#166534' }}
                >
                  {recipe.nutrition.carbs}g
                </div>
              </div>
            )}
            {recipe.nutrition.fat && (
              <div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>Fett</div>
                <div
                  style={{ fontSize: '16px', fontWeight: 600, color: '#166534' }}
                >
                  {recipe.nutrition.fat}g
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source & Dates */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
        }}
      >
        {recipe.source && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Quelle: </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {recipe.source}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Erstellt: </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {formatDate(recipe.createdAt)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Bearbeitet: </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {formatDate(recipe.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
