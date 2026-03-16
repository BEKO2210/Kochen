import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ShoppingCart,
  AlertCircle,
  Sparkles,
  List,
  ArrowRight
} from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useRecipeStore } from '../../store/recipeStore';
import { useShoppingStore } from '../../store/shoppingStore';
import { formatDate, getWeekDates, getWeekKey, addDays } from '../../utils/dateUtils';
import { Recipe, Ingredient, ShoppingListItem } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

// Abteilungszuordnung für Zutaten
const INGREDIENT_DEPARTMENTS: Record<string, string> = {
  // Obst & Gemüse
  'apfel': 'Obst & Gemüse', 'banane': 'Obst & Gemüse', 'tomate': 'Obst & Gemüse',
  'gurke': 'Obst & Gemüse', 'karotte': 'Obst & Gemüse', 'zwiebel': 'Obst & Gemüse',
  'knoblauch': 'Obst & Gemüse', 'kartoffel': 'Obst & Gemüse', 'salat': 'Obst & Gemüse',
  'spinat': 'Obst & Gemüse', 'paprika': 'Obst & Gemüse', 'zucchini': 'Obst & Gemüse',
  'aubergine': 'Obst & Gemüse', 'brokkoli': 'Obst & Gemüse', 'blumenkohl': 'Obst & Gemüse',
  'zitrone': 'Obst & Gemüse', 'lime': 'Obst & Gemüse', 'orange': 'Obst & Gemüse',
  'beere': 'Obst & Gemüse', 'erdbeere': 'Obst & Gemüse', 'blaubeere': 'Obst & Gemüse',
  'avocado': 'Obst & Gemüse', 'mango': 'Obst & Gemüse', 'ananas': 'Obst & Gemüse',
  
  // Fleisch & Fisch
  'hähnchen': 'Fleisch & Fisch', 'rind': 'Fleisch & Fisch', 'schwein': 'Fleisch & Fisch',
  'lachs': 'Fleisch & Fisch', 'thunfisch': 'Fleisch & Fisch', 'garnelen': 'Fleisch & Fisch',
  'fisch': 'Fleisch & Fisch', 'filet': 'Fleisch & Fisch', 'schnitzel': 'Fleisch & Fisch',
  'hackfleisch': 'Fleisch & Fisch', 'wurst': 'Fleisch & Fisch', 'speck': 'Fleisch & Fisch',
  
  // Milch & Käse
  'milch': 'Milch & Käse', 'sahne': 'Milch & Käse', 'joghurt': 'Milch & Käse',
  'butter': 'Milch & Käse', 'käse': 'Milch & Käse', 'mozzarella': 'Milch & Käse',
  'parmesan': 'Milch & Käse', 'feta': 'Milch & Käse', 'ei': 'Milch & Käse',
  'eier': 'Milch & Käse', 'quark': 'Milch & Käse', 'frischkäse': 'Milch & Käse',
  
  // Brot & Backwaren
  'brot': 'Brot & Backwaren', 'brötchen': 'Brot & Backwaren', 'toast': 'Brot & Backwaren',
  'mehl': 'Brot & Backwaren', 'hefe': 'Brot & Backwaren', 'backpulver': 'Brot & Backwaren',
  
  // Nudeln & Reis
  'nudel': 'Nudeln & Reis', 'pasta': 'Nudeln & Reis', 'spaghetti': 'Nudeln & Reis',
  'reis': 'Nudeln & Reis', 'couscous': 'Nudeln & Reis', 'quinoa': 'Nudeln & Reis',
  'bulgur': 'Nudeln & Reis', 'haferflocken': 'Nudeln & Reis',
  
  // Gewürze & Saucen
  'salz': 'Gewürze & Saucen', 'pfeffer': 'Gewürze & Saucen', 'öl': 'Gewürze & Saucen',
  'essig': 'Gewürze & Saucen', 'sojasauce': 'Gewürze & Saucen', 'tomatenmark': 'Gewürze & Saucen',
  'senf': 'Gewürze & Saucen', 'ketchup': 'Gewürze & Saucen', 'mayonnaise': 'Gewürze & Saucen',
  'kräuter': 'Gewürze & Saucen', 'basilikum': 'Gewürze & Saucen', 'oregano': 'Gewürze & Saucen',
  'petersilie': 'Gewürze & Saucen', 'koriander': 'Gewürze & Saucen', 'kreuzkümmel': 'Gewürze & Saucen',
  'paprika': 'Gewürze & Saucen', 'curry': 'Gewürze & Saucen',
  
  // Dosen & Konserven
  'dose': 'Dosen & Konserven', 'konserven': 'Dosen & Konserven', 'bohnen': 'Dosen & Konserven',
  'kichererbsen': 'Dosen & Konserven', 'linsen': 'Dosen & Konserven', 'mais': 'Dosen & Konserven',
  
  // Tiefkühl
  'tiefkühl': 'Tiefkühl', ' TK-': 'Tiefkühl', 'spinat tk': 'Tiefkühl',
  
  // Getränke
  'wasser': 'Getränke', 'saft': 'Getränke', 'limonade': 'Getränke',
};

interface ListGeneratorProps {
  onComplete: () => void;
}

interface AggregatedItem {
  name: string;
  amount: number;
  unit: string;
  department: string;
  sources: { recipeName: string; amount: number; servings: number }[];
}

export const ListGenerator: React.FC<ListGeneratorProps> = ({ onComplete }) => {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  const [step, setStep] = useState<'select' | 'preview' | 'options'>('select');
  const [listName, setListName] = useState('');
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [mergeExisting, setMergeExisting] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<AggregatedItem[]>([]);

  const { getWeekPlan } = usePlannerStore();
  const { recipes } = useRecipeStore();
  const { createList, lists, activeList, addItemsToList } = useShoppingStore();

  const weekDates = getWeekDates(selectedWeekStart);
  const weekKey = getWeekKey(selectedWeekStart);
  const weekPlan = getWeekPlan(weekKey);

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setSelectedWeekStart(new Date(today.setDate(diff)));
  };

  // Intelligente Zutaten-Aggregation
  const aggregateIngredients = (): AggregatedItem[] => {
    const ingredientMap = new Map<string, AggregatedItem>();

    if (!weekPlan) return [];

    Object.entries(weekPlan.days).forEach(([date, dayPlan]) => {
      Object.entries(dayPlan).forEach(([mealType, mealSlot]) => {
        if (!mealSlot.recipeId) return;

        const recipe = recipes.find(r => r.id === mealSlot.recipeId);
        if (!recipe || !recipe.ingredients) return;

        const scalingFactor = (mealSlot.servings || recipe.servings || 2) / (recipe.servings || 2);

        recipe.ingredients.forEach(ing => {
          const normalizedName = normalizeIngredientName(ing.name);
          const key = `${normalizedName}_${ing.unit}`;

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.amount += ing.amount * scalingFactor;
            existing.sources.push({
              recipeName: recipe.name,
              amount: ing.amount * scalingFactor,
              servings: mealSlot.servings || recipe.servings || 2
            });
          } else {
            ingredientMap.set(key, {
              name: normalizedName,
              amount: ing.amount * scalingFactor,
              unit: ing.unit,
              department: getDepartmentForIngredient(normalizedName),
              sources: [{
                recipeName: recipe.name,
                amount: ing.amount * scalingFactor,
                servings: mealSlot.servings || recipe.servings || 2
              }]
            });
          }
        });
      });
    });

    return Array.from(ingredientMap.values()).sort((a, b) => 
      a.department.localeCompare(b.department) || 
      a.name.localeCompare(b.name)
    );
  };

  // Normalisiere Zutatennamen
  const normalizeIngredientName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/^\d+\s*/, '') // Entferne führende Zahlen
      .replace(/\s+/g, ' '); // Normalisiere Leerzeichen
  };

  // Bestimme Abteilung für Zutat
  const getDepartmentForIngredient = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    for (const [keyword, department] of Object.entries(INGREDIENT_DEPARTMENTS)) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return department;
      }
    }
    
    return 'Sonstiges';
  };

  // Generiere Vorschau
  const handleGeneratePreview = () => {
    const items = aggregateIngredients();
    setGeneratedItems(items);
    setListName(`Einkauf KW ${getWeekNumber(selectedWeekStart)}`);
    setStep('preview');
  };

  // Erstelle Liste
  const handleCreateList = () => {
    const itemsToAdd = generatedItems
      .filter(item => !excludedItems.has(item.name))
      .map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        amount: roundAmount(item.amount),
        unit: item.unit,
        department: item.department,
        checked: false,
        recipeName: item.sources.length === 1 ? item.sources[0].recipeName : undefined
      }));

    if (mergeExisting && activeList) {
      addItemsToList(activeList.id, itemsToAdd);
    } else {
      createList(listName, itemsToAdd);
    }

    onComplete();
  };

  // Runde Mengen sinnvoll
  const roundAmount = (amount: number): number => {
    if (amount < 0.1) return Math.round(amount * 100) / 100;
    if (amount < 1) return Math.round(amount * 10) / 10;
    if (amount < 10) return Math.round(amount * 2) / 2;
    return Math.round(amount);
  };

  // Formatiere Menge
  const formatAmount = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')}`;
    }
    return amount % 1 === 0 ? amount.toString() : amount.toFixed(1).replace(/\.0$/, '');
  };

  // Toggle Item Exclusion
  const toggleItemExclusion = (name: string) => {
    setExcludedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Gruppiere nach Abteilung
  const groupedItems = useMemo(() => {
    const groups: Record<string, AggregatedItem[]> = {};
    generatedItems.forEach(item => {
      if (!groups[item.department]) {
        groups[item.department] = [];
      }
      groups[item.department].push(item);
    });
    return groups;
  }, [generatedItems]);

  const selectedCount = generatedItems.length - excludedItems.size;

  return (
    <div className="list-generator">
      {step === 'select' && (
        <div className="list-generator__select-week">
          <div className="list-generator__intro">
            <Sparkles size={24} />
            <p>
              Wähle die Woche, für die du eine Einkaufsliste generieren möchtest. 
              Die Zutaten aller geplanten Mahlzeiten werden automatisch aggregiert.
            </p>
          </div>

          <div className="list-generator__week-nav">
            <button onClick={() => navigateWeek('prev')}>
              <ChevronLeft size={20} />
            </button>
            <div className="list-generator__week-info">
              <span className="list-generator__week-label">
                KW {getWeekNumber(selectedWeekStart)}
              </span>
              <span className="list-generator__week-range">
                {formatDate(weekDates[0], 'dd.MM.')} - {formatDate(weekDates[6], 'dd.MM.yyyy')}
              </span>
            </div>
            <button onClick={() => navigateWeek('next')}>
              <ChevronRight size={20} />
            </button>
          </div>

          <button className="list-generator__today-btn" onClick={goToCurrentWeek}>
            <Calendar size={16} />
            Zur aktuellen Woche
          </button>

          {/* Wochen-Übersicht */}
          <div className="list-generator__week-preview">
            <h4>Geplante Mahlzeiten:</h4>
            {weekPlan ? (
              <div className="list-generator__meals-count">
                {Object.values(weekPlan.days).reduce((count, day) => 
                  count + Object.values(day).filter(m => m.recipeId).length, 0
                )} Mahlzeiten geplant
              </div>
            ) : (
              <div className="list-generator__no-meals">
                <AlertCircle size={16} />
                Keine Mahlzeiten für diese Woche geplant
              </div>
            )}
          </div>

          <div className="list-generator__actions">
            <Button variant="secondary" onClick={onComplete}>
              Abbrechen
            </Button>
            <Button 
              variant="primary" 
              onClick={handleGeneratePreview}
              disabled={!weekPlan || Object.values(weekPlan.days).every(day => 
                Object.values(day).every(m => !m.recipeId)
              )}
            >
              <Sparkles size={18} />
              Vorschau generieren
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="list-generator__preview">
          <div className="list-generator__preview-header">
            <h3>
              <List size={20} />
              Vorschau ({selectedCount} Artikel)
            </h3>
            <p>Entferne Artikel, die du nicht benötigst</p>
          </div>

          <Input
            label="Name der Einkaufsliste"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="z.B. Wocheneinkauf"
          />

          {lists.length > 0 && (
            <label className="list-generator__merge-option">
              <input
                type="checkbox"
                checked={mergeExisting}
                onChange={(e) => setMergeExisting(e.target.checked)}
              />
              <span>
                Mit bestehender Liste "{activeList?.name}" zusammenführen
              </span>
            </label>
          )}

          <div className="list-generator__items">
            {Object.entries(groupedItems).map(([department, items]) => (
              <div key={department} className="list-generator__department">
                <h4>{department}</h4>
                {items.map(item => (
                  <div 
                    key={item.name}
                    className={`list-generator__item ${excludedItems.has(item.name) ? 'excluded' : ''}`}
                    onClick={() => toggleItemExclusion(item.name)}
                  >
                    <div className="list-generator__item-check">
                      {!excludedItems.has(item.name) && <Check size={16} />}
                    </div>
                    <div className="list-generator__item-info">
                      <span className="list-generator__item-name">{item.name}</span>
                      <span className="list-generator__item-amount">
                        {formatAmount(item.amount)} {item.unit}
                      </span>
                      {item.sources.length > 1 && (
                        <span className="list-generator__item-sources">
                          ({item.sources.length} Rezepte)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="list-generator__actions">
            <Button variant="secondary" onClick={() => setStep('select')}>
              <ChevronLeft size={18} />
              Zurück
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateList}
              disabled={selectedCount === 0 || !listName.trim()}
            >
              <ShoppingCart size={18} />
              Liste erstellen
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Hilfsfunktion für Kalenderwoche
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
