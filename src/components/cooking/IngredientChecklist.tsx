import React, { useState, useCallback } from 'react';
import { Ingredient } from '../../types';

interface IngredientChecklistProps {
  ingredients: Ingredient[];
  onClose: () => void;
}

interface CheckedIngredient extends Ingredient {
  checked: boolean;
  id: string;
}

export const IngredientChecklist: React.FC<IngredientChecklistProps> = ({
  ingredients,
  onClose,
}) => {
  // Initialize with unique IDs and unchecked state
  const [items, setItems] = useState<CheckedIngredient[]>(
    ingredients.map((ing, index) => ({
      ...ing,
      checked: false,
      id: `ing-${index}-${ing.name}`,
    }))
  );

  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked'>('all');

  // Toggle single ingredient
  const toggleIngredient = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  // Check all ingredients
  const checkAll = useCallback(() => {
    setItems(prev => prev.map(item => ({ ...item, checked: true })));
  }, []);

  // Uncheck all ingredients
  const uncheckAll = useCallback(() => {
    setItems(prev => prev.map(item => ({ ...item, checked: false })));
  }, []);

  // Clear all (uncheck)
  const clearAll = useCallback(() => {
    if (window.confirm('Möchtest du alle Häkchen entfernen?')) {
      uncheckAll();
    }
  }, [uncheckAll]);

  // Get filtered items
  const filteredItems = items.filter(item => {
    if (filter === 'unchecked') return !item.checked;
    if (filter === 'checked') return item.checked;
    return true;
  });

  // Statistics
  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const allChecked = checkedCount === totalCount && totalCount > 0;

  // Format amount display
  const formatAmount = (amount: number, unit: string): string => {
    const formattedAmount = amount % 1 === 0 
      ? amount.toString() 
      : amount.toFixed(2).replace(/\.?0+$/, '');
    return `${formattedAmount} ${unit}`;
  };

  return (
    <div className="ingredient-checklist">
      {/* Header */}
      <div className="ingredient-checklist__header">
        <h2 className="ingredient-checklist__title">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          Zutaten-Checkliste
        </h2>
        <button
          className="ingredient-checklist__close"
          onClick={onClose}
          aria-label="Checkliste schließen"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="ingredient-checklist__progress">
        <div
          className="ingredient-checklist__progress-bar"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
        <span className="ingredient-checklist__progress-text">
          {checkedCount} / {totalCount} abgehakt
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="ingredient-checklist__filters">
        <button
          className={`ingredient-checklist__filter ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Alle ({totalCount})
        </button>
        <button
          className={`ingredient-checklist__filter ${filter === 'unchecked' ? 'active' : ''}`}
          onClick={() => setFilter('unchecked')}
        >
          Offen ({totalCount - checkedCount})
        </button>
        <button
          className={`ingredient-checklist__filter ${filter === 'checked' ? 'active' : ''}`}
          onClick={() => setFilter('checked')}
        >
          Erledigt ({checkedCount})
        </button>
      </div>

      {/* Bulk Actions */}
      <div className="ingredient-checklist__actions">
        <button
          className="ingredient-checklist__action-btn"
          onClick={checkAll}
          disabled={allChecked}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Alle abhaken
        </button>
        <button
          className="ingredient-checklist__action-btn"
          onClick={clearAll}
          disabled={checkedCount === 0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          Alle löschen
        </button>
      </div>

      {/* Ingredients List */}
      <div className="ingredient-checklist__list">
        {filteredItems.length === 0 ? (
          <div className="ingredient-checklist__empty">
            {filter === 'unchecked' ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <p>Alle Zutaten sind bereit!</p>
              </>
            ) : filter === 'checked' ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <p>Noch keine Zutaten abgehakt</p>
              </>
            ) : (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <p>Keine Zutaten vorhanden</p>
              </>
            )}
          </div>
        ) : (
          <ul className="ingredient-checklist__items">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className={`ingredient-checklist__item ${item.checked ? 'checked' : ''}`}
              >
                <label className="ingredient-checklist__label">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleIngredient(item.id)}
                    className="ingredient-checklist__checkbox"
                    aria-label={`${item.name} ${item.checked ? 'abwählen' : 'abhaken'}`}
                  />
                  <span className="ingredient-checklist__checkmark">
                    {item.checked && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="ingredient-checklist__content">
                    <span className="ingredient-checklist__amount">
                      {formatAmount(item.amount, item.unit)}
                    </span>
                    <span className="ingredient-checklist__name">
                      {item.name}
                    </span>
                    {item.notes && (
                      <span className="ingredient-checklist__notes">
                        ({item.notes})
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Continue Button */}
      <div className="ingredient-checklist__footer">
        <button
          className="ingredient-checklist__continue"
          onClick={onClose}
        >
          {allChecked ? (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Los geht's!
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Mit Kochen beginnen
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Compact version for sidebar/inline use
export const CompactIngredientChecklist: React.FC<{
  ingredients: Ingredient[];
  className?: string;
}> = ({ ingredients, className = '' }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback((id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const formatAmount = (amount: number, unit: string): string => {
    const formattedAmount = amount % 1 === 0 
      ? amount.toString() 
      : amount.toFixed(2).replace(/\.?0+$/, '');
    return `${formattedAmount} ${unit}`;
  };

  return (
    <div className={`compact-checklist ${className}`}>
      <ul className="compact-checklist__items">
        {ingredients.map((ing, index) => {
          const id = `compact-ing-${index}-${ing.name}`;
          const isChecked = checkedItems.has(id);
          
          return (
            <li
              key={id}
              className={`compact-checklist__item ${isChecked ? 'checked' : ''}`}
              onClick={() => toggleItem(id)}
            >
              <span className="compact-checklist__checkbox">
                {isChecked && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="compact-checklist__text">
                <span className="compact-checklist__amount">
                  {formatAmount(ing.amount, ing.unit)}
                </span>
                {' '}
                <span className="compact-checklist__name">
                  {ing.name}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
