import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  ChefHat,
} from 'lucide-react';
import { useRecipes, Recipe, Ingredient, RecipeStep } from '../hooks/useRecipes';
import { Button } from '../components/ui/Button';

const CATEGORIES = [
  'Hauptgericht', 'Vorspeise', 'Beilage', 'Dessert', 'Frühstück',
  'Snack', 'Suppe', 'Salat', 'Getränk', 'Sonstiges',
];

const DIFFICULTIES: { value: Recipe['difficulty']; label: string }[] = [
  { value: 'easy', label: 'Einfach' },
  { value: 'medium', label: 'Mittel' },
  { value: 'hard', label: 'Schwer' },
];

const UNITS = ['g', 'kg', 'ml', 'L', 'Stk', 'EL', 'TL', 'Prise', 'Bund', 'Scheiben', 'Tasse', 'Dose', 'Packung'];

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const RecipeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getRecipeById, addRecipe, updateRecipe } = useRecipes();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>('easy');
  const [category, setCategory] = useState('Hauptgericht');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateId(), name: '', amount: 0, unit: 'g' },
  ]);
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: generateId(), order: 1, description: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // Load existing recipe for editing
  useEffect(() => {
    if (id) {
      const recipe = getRecipeById(id);
      if (recipe) {
        setTitle(recipe.title);
        setDescription(recipe.description);
        setImageUrl(recipe.imageUrl || '');
        setServings(recipe.servings);
        setPrepTime(recipe.prepTime);
        setCookTime(recipe.cookTime);
        setDifficulty(recipe.difficulty);
        setCategory(recipe.category);
        setTags(recipe.tags.join(', '));
        setNotes(recipe.notes || '');
        setSource(recipe.source || '');
        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ id: generateId(), name: '', amount: 0, unit: 'g' }]);
        setSteps(recipe.steps.length > 0 ? recipe.steps : [{ id: generateId(), order: 1, description: '' }]);
      } else {
        navigate('/recipes');
      }
    }
  }, [id]);

  const addIngredient = () => {
    setIngredients(prev => [...prev, { id: generateId(), name: '', amount: 0, unit: 'g' }]);
  };

  const removeIngredient = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { id: generateId(), order: prev.length + 1, description: '' }]);
  };

  const removeStep = (idx: number) => {
    if (steps.length > 1) {
      setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
    }
  };

  const updateStep = (idx: number, field: string, value: string | number | undefined) => {
    setSteps(prev => prev.map((step, i) => i === idx ? { ...step, [field]: value } : step));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const validIngredients = ingredients.filter(ing => ing.name.trim());
      const validSteps = steps.filter(step => step.description.trim());
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        servings,
        prepTime,
        cookTime,
        difficulty,
        category,
        tags: tagList,
        ingredients: validIngredients,
        steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
        notes: notes.trim() || undefined,
        source: source.trim() || undefined,
        isFavorite: isEditing ? (getRecipeById(id!)?.isFavorite ?? false) : false,
      };

      if (isEditing && id) {
        await updateRecipe(id, recipeData);
        navigate(`/recipes/${id}`);
      } else {
        const newRecipe = await addRecipe(recipeData);
        navigate(`/recipes/${newRecipe.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-amber-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-amber-700" />
            </button>
            <h1 className="text-xl font-bold text-amber-950">
              {isEditing ? 'Rezept bearbeiten' : 'Neues Rezept'}
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={!title.trim() || saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Speichern
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-amber-950 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Grunddaten
          </h2>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Spaghetti Carbonara"
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Rezepts..."
              rows={3}
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Bild-URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Kategorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Schwierigkeit</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      difficulty === d.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />Vorbereitung
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={e => setPrepTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                />
                <span className="text-sm text-amber-600">min</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">
                <Clock className="w-3 h-3 inline mr-1" />Kochen
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={cookTime}
                  onChange={e => setCookTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                />
                <span className="text-sm text-amber-600">min</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Portionen</label>
              <input
                type="number"
                min={1}
                max={50}
                value={servings}
                onChange={e => setServings(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Tags (kommagetrennt)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="z.B. Pasta, Schnell, Italienisch"
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
            />
          </div>
        </section>

        {/* Ingredients */}
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-amber-950">Zutaten</h2>
            <button
              onClick={addIngredient}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Zutat
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <input
                  type="number"
                  value={ing.amount || ''}
                  onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="Menge"
                  className="w-20 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                />
                <select
                  value={ing.unit}
                  onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-20 px-2 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  type="text"
                  value={ing.name}
                  onChange={e => updateIngredient(idx, 'name', e.target.value)}
                  placeholder="Zutat"
                  className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                />
                <button
                  onClick={() => removeIngredient(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={ingredients.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-amber-950">Zubereitungsschritte</h2>
            <button
              onClick={addStep}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schritt
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={step.description}
                    onChange={e => updateStep(idx, 'description', e.target.value)}
                    placeholder={`Schritt ${idx + 1} beschreiben...`}
                    rows={2}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <input
                      type="number"
                      min={0}
                      value={step.duration || ''}
                      onChange={e => updateStep(idx, 'duration', parseInt(e.target.value) || undefined)}
                      placeholder="Timer (min)"
                      className="w-32 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                  disabled={steps.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Extra */}
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-amber-950">Zusätzliche Infos</h2>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Notizen</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tipps, Varianten, Anmerkungen..."
              rows={3}
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-1">Quelle</label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="z.B. Omas Kochbuch, chefkoch.de..."
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-amber-950"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default RecipeFormPage;
