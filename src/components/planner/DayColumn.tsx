import React from 'react';
import { Plus } from 'lucide-react';
import { MealSlot } from './MealSlot';
import { DayPlan, MealType, Recipe } from '../../types';
import { formatDate, isToday as checkIsToday } from '../../utils/dateUtils';

interface DayColumnProps {
  date: Date;
  dayLabel: string;
  isToday: boolean;
  dayPlan: DayPlan;
  mealTypes: MealType[];
  mealLabels: Record<MealType, string>;
  recipes: Recipe[];
  onMealSelect: (date: string, mealType: MealType, recipeId: string | null, servings?: number) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayLabel,
  isToday,
  dayPlan,
  mealTypes,
  mealLabels,
  recipes,
  onMealSelect
}) => {
  const dateKey = formatDate(date, 'yyyy-MM-dd');
  const dayNumber = formatDate(date, 'd');
  const monthName = formatDate(date, 'MMM');

  return (
    <div className={`day-column ${isToday ? 'day-column--today' : ''}`}>
      {/* Day Header */}
      <div className="day-column__header">
        <div className="day-column__day-info">
          <span className="day-column__day-label">{dayLabel}</span>
          <div className={`day-column__date ${isToday ? 'day-column__date--today' : ''}`}>
            <span className="day-column__day-number">{dayNumber}</span>
            <span className="day-column__month">{monthName}</span>
          </div>
        </div>
        {isToday && <span className="day-column__today-badge">Heute</span>}
      </div>

      {/* Meal Slots */}
      <div className="day-column__meals">
        {mealTypes.map((mealType) => {
          const mealSlot = dayPlan[mealType];
          const recipe = mealSlot?.recipeId 
            ? recipes.find(r => r.id === mealSlot.recipeId) 
            : null;

          return (
            <MealSlot
              key={mealType}
              mealType={mealType}
              label={mealLabels[mealType]}
              recipe={recipe}
              servings={mealSlot?.servings}
              date={dateKey}
              recipes={recipes}
              onSelect={(recipeId, servings) => onMealSelect(dateKey, mealType, recipeId, servings)}
              onClear={() => onMealSelect(dateKey, mealType, null)}
            />
          );
        })}
      </div>
    </div>
  );
};
