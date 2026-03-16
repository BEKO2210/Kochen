import React, { useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Calendar,
  LayoutTemplate,
  RotateCcw
} from 'lucide-react';
import { DayColumn } from './DayColumn';
import { PlannerTemplates } from './PlannerTemplates';
import { usePlannerStore } from '../../store/plannerStore';
import { useRecipeStore } from '../../store/recipeStore';
import { formatDate, getWeekDates, getWeekKey, addDays } from '../../utils/dateUtils';
import { WeekPlan, DayPlan, MealType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack'
};

export const WeekPlanner: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [targetWeekStart, setTargetWeekStart] = useState<Date | null>(null);
  
  const { 
    getWeekPlan, 
    updateDayPlan, 
    copyWeek,
    applyTemplate 
  } = usePlannerStore();
  
  const { recipes } = useRecipeStore();
  
  const weekDates = getWeekDates(currentWeekStart);
  const weekKey = getWeekKey(currentWeekStart);
  const weekPlan = getWeekPlan(weekKey);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  }, []);

  const handleMealSelect = useCallback((date: string, mealType: MealType, recipeId: string | null, servings?: number) => {
    updateDayPlan(weekKey, date, mealType, recipeId, servings);
  }, [weekKey, updateDayPlan]);

  const handleCopyWeek = useCallback(() => {
    if (targetWeekStart) {
      const targetWeekKey = getWeekKey(targetWeekStart);
      copyWeek(weekKey, targetWeekKey);
      setShowCopyDialog(false);
      setTargetWeekStart(null);
    }
  }, [weekKey, targetWeekStart, copyWeek]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    applyTemplate(weekKey, templateId);
    setShowTemplates(false);
  }, [weekKey, applyTemplate]);

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="week-planner">
      {/* Header */}
      <div className="week-planner__header">
        <div className="week-planner__nav">
          <button 
            className="week-planner__nav-btn"
            onClick={() => navigateWeek('prev')}
            aria-label="Vorherige Woche"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="week-planner__title">
            <Calendar size={20} />
            <span>
              KW {getWeekNumber(currentWeekStart)} - {formatDate(currentWeekStart, 'MMMM yyyy')}
            </span>
          </div>
          
          <button 
            className="week-planner__nav-btn"
            onClick={() => navigateWeek('next')}
            aria-label="Nächste Woche"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="week-planner__actions">
          <button 
            className="week-planner__action-btn"
            onClick={goToCurrentWeek}
            title="Zur aktuellen Woche"
          >
            <RotateCcw size={18} />
            <span>Heute</span>
          </button>
          
          <button 
            className="week-planner__action-btn"
            onClick={() => setShowTemplates(true)}
            title="Vorlage anwenden"
          >
            <LayoutTemplate size={18} />
            <span>Vorlagen</span>
          </button>
          
          <button 
            className="week-planner__action-btn"
            onClick={() => setShowCopyDialog(true)}
            title="Woche kopieren"
          >
            <Copy size={18} />
            <span>Kopieren</span>
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="week-planner__grid">
        {weekDates.map((date, index) => {
          const dateKey = formatDate(date, 'yyyy-MM-dd');
          const dayPlan = weekPlan?.days[dateKey] || {};
          const isToday = formatDate(new Date(), 'yyyy-MM-dd') === dateKey;
          
          return (
            <DayColumn
              key={dateKey}
              date={date}
              dayLabel={weekDays[index]}
              isToday={isToday}
              dayPlan={dayPlan}
              mealTypes={MEAL_TYPES}
              mealLabels={MEAL_LABELS}
              recipes={recipes}
              onMealSelect={handleMealSelect}
            />
          );
        })}
      </div>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Wochenvorlagen"
        size="large"
      >
        <PlannerTemplates onSelect={handleApplyTemplate} />
      </Modal>

      {/* Copy Week Dialog */}
      <Modal
        isOpen={showCopyDialog}
        onClose={() => {
          setShowCopyDialog(false);
          setTargetWeekStart(null);
        }}
        title="Woche kopieren"
        size="small"
      >
        <div className="copy-week-dialog">
          <p className="copy-week-dialog__text">
            Wähle die Zielwoche, in die der aktuelle Wochenplan kopiert werden soll:
          </p>
          
          <div className="copy-week-dialog__weeks">
            {[-2, -1, 1, 2, 3, 4].map(offset => {
              const weekStart = addDays(currentWeekStart, offset * 7);
              const weekNum = getWeekNumber(weekStart);
              const isSelected = targetWeekStart && 
                formatDate(targetWeekStart, 'yyyy-MM-dd') === formatDate(weekStart, 'yyyy-MM-dd');
              
              return (
                <button
                  key={offset}
                  className={`copy-week-dialog__week-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setTargetWeekStart(weekStart)}
                >
                  <span className="copy-week-dialog__week-num">KW {weekNum}</span>
                  <span className="copy-week-dialog__week-date">
                    {formatDate(weekStart, 'dd.MM.')} - {formatDate(addDays(weekStart, 6), 'dd.MM.')}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="copy-week-dialog__actions">
            <Button variant="secondary" onClick={() => setShowCopyDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCopyWeek}
              disabled={!targetWeekStart}
            >
              Kopieren
            </Button>
          </div>
        </div>
      </Modal>
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
