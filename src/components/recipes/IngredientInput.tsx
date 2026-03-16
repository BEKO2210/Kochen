import React, { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

export interface IngredientInputData {
  id: string;
  amount: string;
  unit: string;
  name: string;
  optional: boolean;
}

interface IngredientInputProps {
  ingredients: IngredientInputData[];
  onChange: (ingredients: IngredientInputData[]) => void;
  error?: string;
}

const units = [
  { value: 'piece', label: 'Stück' },
  { value: 'gram', label: 'Gramm (g)' },
  { value: 'kilogram', label: 'Kilogramm (kg)' },
  { value: 'milliliter', label: 'Milliliter (ml)' },
  { value: 'liter', label: 'Liter (l)' },
  { value: 'teaspoon', label: 'Teelöffel (TL)' },
  { value: 'tablespoon', label: 'Esslöffel (EL)' },
  { value: 'cup', label: 'Tasse' },
  { value: 'pinch', label: 'Prise' },
  { value: 'bunch', label: 'Bund' },
  { value: 'can', label: 'Dose' },
  { value: 'package', label: 'Packung' },
  { value: 'slice', label: 'Scheibe' },
  { value: 'clove', label: 'Zehe' },
];

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onChange,
  error,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addIngredient = () => {
    const newIngredient: IngredientInputData = {
      id: generateId(),
      amount: '',
      unit: 'gram',
      name: '',
      optional: false,
    };
    onChange([...ingredients, newIngredient]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onChange(newIngredients);
  };

  const updateIngredient = (index: number, field: keyof IngredientInputData, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    onChange(newIngredients);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newIngredients = [...ingredients];
    const draggedItem = newIngredients[draggedIndex];
    newIngredients.splice(draggedIndex, 1);
    newIngredients.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onChange(newIngredients);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Zutaten
        </label>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {ingredients.length} Zutat{ingredients.length !== 1 ? 'en' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ingredients.map((ingredient, index) => (
          <div
            key={ingredient.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: draggedIndex === index ? '#eff6ff' : '#f9fafb',
              borderRadius: '10px',
              border: error && !ingredient.name ? '1px solid #fecaca' : '1px solid #e5e7eb',
              cursor: 'grab',
              transition: 'background-color 0.2s, box-shadow 0.2s',
            }}
          >
            {/* Drag Handle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#9ca3af',
                cursor: 'grab',
              }}
            >
              <GripVertical size={18} />
            </div>

            {/* Amount Input */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="Menge"
              value={ingredient.amount}
              onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
              style={{
                width: '70px',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                textAlign: 'center',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />

            {/* Unit Select */}
            <select
              value={ingredient.unit}
              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
              style={{
                width: '110px',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              {units.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>

            {/* Name Input */}
            <input
              type="text"
              placeholder="Zutat eingeben..."
              value={ingredient.name}
              onChange={(e) => updateIngredient(index, 'name', e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: error && !ingredient.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error && !ingredient.name ? '#ef4444' : '#d1d5db';
              }}
            />

            {/* Optional Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6b7280',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={ingredient.optional}
                onChange={(e) => updateIngredient(index, 'optional', e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              Opt.
            </label>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeIngredient(index)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#9ca3af',
                transition: 'color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={addIngredient}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '12px',
          marginTop: '12px',
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: '#6b7280',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e5e7eb';
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        <Plus size={18} />
        Zutat hinzufügen
      </button>
    </div>
  );
};

export default IngredientInput;
