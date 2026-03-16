import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Users, 
  ChefHat,
  Clock,
  Flame,
  GripVertical
} from 'lucide-react';
import { Recipe, MealType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MealSlotProps {
  mealType: MealType;
  label: string;
  recipe: Recipe | null;
  servings?: number;
  date: string;
  recipes: Recipe[];
  onSelect: (recipeId: string | null, servings?: number) => void;
  onClear: () => void;
}

export const MealSlot: React.FC<MealSlotProps> = ({
  mealType,
  label,
  recipe,
  servings,
  recipes,
  onSelect,
  onClear
}) => {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServings, setSelectedServings] = useState(servings || 2);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);

  // Filter recipes based on search and meal type
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMealType = !mealType || r.mealType === mealType || !r.mealType;
    return matchesSearch && matchesMealType;
  });

  const handleRecipeClick = () => {
    if (recipe) {
      // If recipe exists, show options to change or remove
      setShowRecipeModal(true);
    } else {
      setShowRecipeModal(true);
    }
  };

  const handleRecipeSelect = (selectedRecipe: Recipe) => {
    setSelectedRecipe(selectedRecipe);
    setSelectedServings(selectedRecipe.servings || 2);
  };

  const handleConfirmSelection = () => {
    if (selectedRecipe) {
      onSelect(selectedRecipe.id, selectedServings);
      setShowRecipeModal(false);
      setSelectedRecipe(null);
      setSearchQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (recipe) {
      e.dataTransfer.setData('application/json', JSON.stringify({
        recipeId: recipe.id,
        servings: servings || recipe.servings || 2,
        sourceMealType: mealType
      }));
      setIsDragging(true);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const { recipeId, servings: droppedServings } = JSON.parse(data);
      onSelect(recipeId, droppedServings);
    }
    setIsDragging(false);
  };

  // Get meal type icon/color
  const getMealTypeStyle = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return { color: '#f59e0b', bgColor: '#fef3c7' };
      case 'lunch':
        return { color: '#10b981', bgColor: '#d1fae5' };
      case 'dinner':
        return { color: '#6366f1', bgColor: '#e0e7ff' };
      case 'snack':
        return { color: '#ec4899', bgColor: '#fce7f3' };
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const style = getMealTypeStyle(mealType);

  return (
    <>
      <div
        ref={slotRef}
        className={`meal-slot ${recipe ? 'meal-slot--filled' : 'meal-slot--empty'} ${isDragging ? 'meal-slot--dragging' : ''}`}
        style={{ 
          borderLeftColor: style.color,
          backgroundColor: recipe ? style.bgColor : undefined 
        }}
        onClick={handleRecipeClick}
        draggable={!!recipe}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag Handle */}
        {recipe && (
          <div className="meal-slot__drag-handle">
            <GripVertical size={14} />
          </div>
        )}

        {/* Meal Type Indicator */}
        <div 
          className="meal-slot__type-indicator"
          style={{ backgroundColor: style.color }}
        />

        {/* Content */}
        <div className="meal-slot__content">
          {recipe ? (
            <>
              <div className="meal-slot__recipe-info">
                <span className="meal-slot__recipe-name">{recipe.name}</span>
                <div className="meal-slot__recipe-meta">
                  {recipe.prepTime && (
                    <span className="meal-slot__meta-item">
                      <Clock size={12} />
                      {recipe.prepTime} min
                    </span>
                  )}
                  {recipe.calories && (
                    <span className="meal-slot__meta-item">
                      <Flame size={12} />
                      {recipe.calories} kcal
                    </span>
                  )}
                </div>
              </div>
              <div className="meal-slot__servings">
                <Users size={14} />
                <span>{servings || recipe.servings || 2}</span>
              </div>
              <button 
                className="meal-slot__clear-btn"
                onClick={handleClear}
                aria-label="Rezept entfernen"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="meal-slot__empty-content">
                <Plus size={16} style={{ color: style.color }} />
                <span className="meal-slot__label">{label}</span>
              </div>
              <span className="meal-slot__add-hint">Hinzufügen</span>
            </>
          )}
        </div>
      </div>

      {/* Recipe Selection Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => {
          setShowRecipeModal(false);
          setSelectedRecipe(null);
          setSearchQuery('');
        }}
        title={recipe ? `${label} ändern` : `${label} hinzufügen`}
        size="large"
      >
        <div className="meal-slot-modal">
          {/* Search */}
          <div className="meal-slot-modal__search">
            <Input
              type="text"
              placeholder="Rezepte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<ChefHat size={18} />}
              autoFocus
            />
          </div>

          {/* Selected Recipe Info */}
          {selectedRecipe && (
            <div className="meal-slot-modal__selected">
              <div className="meal-slot-modal__selected-info">
                <h4>{selectedRecipe.name}</h4>
                <p>{selectedRecipe.description || 'Keine Beschreibung'}</p>
              </div>
              <div className="meal-slot-modal__servings">
                <label>Portionen:</label>
                <div className="meal-slot-modal__servings-control">
                  <button 
                    onClick={() => setSelectedServings(Math.max(1, selectedServings - 1))}
                  >
                    -
                  </button>
                  <span>{selectedServings}</span>
                  <button 
                    onClick={() => setSelectedServings(selectedServings + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recipe List */}
          <div className="meal-slot-modal__recipes">
            {filteredRecipes.length === 0 ? (
              <div className="meal-slot-modal__empty">
                <ChefHat size={48} />
                <p>Keine Rezepte gefunden</p>
              </div>
            ) : (
              filteredRecipes.map((r) => (
                <button
                  key={r.id}
                  className={`meal-slot-modal__recipe-card ${selectedRecipe?.id === r.id ? 'selected' : ''}`}
                  onClick={() => handleRecipeSelect(r)}
                >
                  {r.image && (
                    <img 
                      src={r.image} 
                      alt={r.name}
                      className="meal-slot-modal__recipe-image"
                    />
                  )}
                  <div className="meal-slot-modal__recipe-details">
                    <h4>{r.name}</h4>
                    <div className="meal-slot-modal__recipe-meta">
                      {r.prepTime && <span>{r.prepTime} min</span>}
                      {r.calories && <span>{r.calories} kcal</span>}
                      <span>{r.servings || 2} Port.</span>
                    </div>
                    {r.tags && r.tags.length > 0 && (
                      <div className="meal-slot-modal__recipe-tags">
                        {r.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="meal-slot-modal__actions">
            {recipe && (
              <Button 
                variant="danger" 
                onClick={() => {
                  onClear();
                  setShowRecipeModal(false);
                }}
              >
                Entfernen
              </Button>
            )}
            <div className="meal-slot-modal__actions-spacer" />
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowRecipeModal(false);
                setSelectedRecipe(null);
                setSearchQuery('');
              }}
            >
              Abbrechen
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmSelection}
              disabled={!selectedRecipe}
            >
              {recipe ? 'Aktualisieren' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
