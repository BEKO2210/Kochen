import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  Clock,
  Users,
  Flame,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { IngredientInput, IngredientInputData } from './IngredientInput';
import { StepEditor, StepInputData } from './StepEditor';

export interface RecipeFormData {
  id?: string;
  title: string;
  description: string;
  image?: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  dietLabels: string[];
  category: string;
  tags: string[];
  ingredients: IngredientInputData[];
  steps: StepInputData[];
  notes: string;
  source: string;
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const dietOptions = [
  { value: 'vegetarian', label: 'Vegetarisch' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'glutenFree', label: 'Glutenfrei' },
  { value: 'dairyFree', label: 'Laktosefrei' },
  { value: 'keto', label: 'Keto' },
  { value: 'lowCarb', label: 'Low Carb' },
  { value: 'highProtein', label: 'High Protein' },
];

const categories = [
  'Frühstück',
  'Mittagessen',
  'Abendessen',
  'Dessert',
  'Snack',
  'Vorspeise',
  'Hauptgericht',
  'Beilage',
  'Suppe',
  'Salat',
  'Backen',
  'Getränk',
];

const difficultyOptions = [
  { value: 'easy', label: 'Einfach', color: '#22c55e' },
  { value: 'medium', label: 'Mittel', color: '#f59e0b' },
  { value: 'hard', label: 'Schwer', color: '#ef4444' },
];

const generateId = () => `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultFormData: RecipeFormData = {
  title: '',
  description: '',
  prepTime: 15,
  cookTime: 30,
  difficulty: 'medium',
  servings: 4,
  dietLabels: [],
  category: '',
  tags: [],
  ingredients: [],
  steps: [],
  notes: '',
  source: '',
  nutrition: {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  },
};

export const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    ...defaultFormData,
    ...initialData,
    ingredients: initialData?.ingredients?.length
      ? initialData.ingredients
      : [{ id: generateId(), amount: '', unit: 'gram', name: '', optional: false }],
    steps: initialData?.steps?.length
      ? initialData.steps
      : [{ id: generateId(), order: 1, description: '' }],
    nutrition: {
      ...defaultFormData.nutrition,
      ...initialData?.nutrition,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Bitte gib einen Titel ein';
    }

    if (formData.prepTime < 0) {
      newErrors.prepTime = 'Vorbereitungszeit muss positiv sein';
    }

    if (formData.cookTime < 0) {
      newErrors.cookTime = 'Kochzeit muss positiv sein';
    }

    if (formData.servings < 1) {
      newErrors.servings = 'Mindestens 1 Portion';
    }

    const validIngredients = formData.ingredients.filter(
      (ing) => ing.name.trim() && ing.amount
    );
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'Mindestens eine Zutat erforderlich';
    }

    const validSteps = formData.steps.filter((step) => step.description.trim());
    if (validSteps.length === 0) {
      newErrors.steps = 'Mindestens ein Schritt erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof RecipeFormData>(
    field: K,
    value: RecipeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: 'Bild darf maximal 5MB groß sein',
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        updateField('image', result);
        setErrors((prev) => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    updateField('image', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleDietLabel = (label: string) => {
    const newLabels = formData.dietLabels.includes(label)
      ? formData.dietLabels.filter((l) => l !== label)
      : [...formData.dietLabels, label];
    updateField('dietLabels', newLabels);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField(
      'tags',
      formData.tags.filter((t) => t !== tag)
    );
  };

  const handleIngredientsChange = (ingredients: IngredientInputData[]) => {
    updateField('ingredients', ingredients);
    if (errors.ingredients) {
      setErrors((prev) => ({ ...prev, ingredients: '' }));
    }
  };

  const handleStepsChange = (steps: StepInputData[]) => {
    updateField('steps', steps);
    if (errors.steps) {
      setErrors((prev) => ({ ...prev, steps: '' }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {initialData?.id ? 'Rezept bearbeiten' : 'Neues Rezept'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
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
          <X size={20} color="#6b7280" />
        </button>
      </div>

      {/* Image Upload */}
      <div style={{ marginBottom: '24px' }}>
        {imagePreview ? (
          <div
            style={{
              position: 'relative',
              height: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <img
              src={imagePreview}
              alt="Rezeptvorschau"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <button
              type="button"
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
              }}
            >
              <X size={18} color="#ffffff" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: '160px',
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              backgroundColor: '#f9fafb',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
          >
            <Camera size={32} color="#9ca3af" />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Bild hochladen (max. 5MB)
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        {errors.image && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
            {errors.image}
          </p>
        )}
      </div>

      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Titel *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="z.B. Spaghetti Carbonara"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: errors.title ? '1px solid #ef4444' : '1px solid #d1d5db',
            borderRadius: '10px',
            fontSize: '15px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.title ? '#ef4444' : '#d1d5db';
          }}
        />
        {errors.title && (
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Beschreibung
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Kurze Beschreibung des Gerichts..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            fontSize: '15px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
          }}
        />
      </div>

      {/* Time & Servings Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Prep Time */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Vorbereitung
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="0"
              value={formData.prepTime}
              onChange={(e) =>
                updateField('prepTime', parseInt(e.target.value) || 0)
              }
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                border: errors.prepTime
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.prepTime
                  ? '#ef4444'
                  : '#d1d5db';
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              Min
            </span>
          </div>
        </div>

        {/* Cook Time */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            <Flame size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Kochen
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="0"
              value={formData.cookTime}
              onChange={(e) =>
                updateField('cookTime', parseInt(e.target.value) || 0)
              }
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                border: errors.cookTime
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.cookTime
                  ? '#ef4444'
                  : '#d1d5db';
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              Min
            </span>
          </div>
        </div>

        {/* Servings */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
            }}
          >
            <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Portionen
          </label>
          <input
            type="number"
            min="1"
            value={formData.servings}
            onChange={(e) =>
              updateField('servings', parseInt(e.target.value) || 1)
            }
            style={{
              width: '100%',
              padding: '12px 14px',
              border: errors.servings ? '1px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.servings
                ? '#ef4444'
                : '#d1d5db';
            }}
          />
        </div>
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Schwierigkeit
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateField('difficulty', option.value as 'easy' | 'medium' | 'hard')
              }
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor:
                  formData.difficulty === option.value
                    ? `${option.color}15`
                    : '#f9fafb',
                border:
                  formData.difficulty === option.value
                    ? `2px solid ${option.color}`
                    : '2px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color:
                  formData.difficulty === option.value ? option.color : '#6b7280',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (formData.difficulty !== option.value) {
                  e.currentTarget.style.borderColor = option.color;
                  e.currentTarget.style.color = option.color;
                }
              }}
              onMouseLeave={(e) => {
                if (formData.difficulty !== option.value) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Kategorie
        </label>
        <select
          value={formData.category}
          onChange={(e) => updateField('category', e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            fontSize: '15px',
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
          <option value="">Kategorie auswählen...</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Diet Labels */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Ernährungsweise
        </label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {dietOptions.map((option) => {
            const isSelected = formData.dietLabels.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleDietLabel(option.value)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: isSelected ? '#22c55e' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isSelected ? '#ffffff' : '#6b7280',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                {isSelected && (
                  <Check
                    size={12}
                    style={{ display: 'inline', marginRight: '4px' }}
                  />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Tags
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Tag eingeben..."
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '14px',
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
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim()}
            style={{
              padding: '10px 16px',
              backgroundColor: tagInput.trim() ? '#3b82f6' : '#e5e7eb',
              border: 'none',
              borderRadius: '10px',
              cursor: tagInput.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              color: tagInput.trim() ? '#ffffff' : '#9ca3af',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (tagInput.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (tagInput.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Hinzufügen
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#e0e7ff',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#4338ca',
                }}
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: '#4338ca',
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div style={{ marginBottom: '24px' }}>
        <IngredientInput
          ingredients={formData.ingredients}
          onChange={handleIngredientsChange}
          error={errors.ingredients}
        />
      </div>

      {/* Steps */}
      <div style={{ marginBottom: '24px' }}>
        <StepEditor
          steps={formData.steps}
          onChange={handleStepsChange}
          error={errors.steps}
        />
      </div>

      {/* Advanced Section Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: showAdvanced ? '16px' : '24px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
      >
        <span>Erweiterte Optionen</span>
        {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Advanced Section */}
      {showAdvanced && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            marginBottom: '24px',
          }}
        >
          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Tipps, Hinweise, Variationen..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
          </div>

          {/* Source */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Quelle
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => updateField('source', e.target.value)}
              placeholder="z.B. Chefkoch, Familienrezept..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
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
          </div>

          {/* Nutrition */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Nährwerte (pro Portion)
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { key: 'calories', label: 'Kalorien', unit: 'kcal' },
                { key: 'protein', label: 'Protein', unit: 'g' },
                { key: 'carbs', label: 'Kohlenhydrate', unit: 'g' },
                { key: 'fat', label: 'Fett', unit: 'g' },
              ].map((item) => (
                <div key={item.key}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    {item.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.nutrition[item.key as keyof typeof formData.nutrition]}
                      onChange={(e) =>
                        updateField('nutrition', {
                          ...formData.nutrition,
                          [item.key]: e.target.value,
                        })
                      }
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '10px 36px 10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
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
                    <span
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}
                    >
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#22c55e',
            border: 'none',
            borderRadius: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#16a34a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#22c55e';
            }
          }}
        >
          {isLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Save size={18} />
          )}
          {isLoading ? 'Wird gespeichert...' : 'Rezept speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          style={{
            padding: '14px 24px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            color: '#6b7280',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
        >
          Abbrechen
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default RecipeForm;
