/**
 * KochPlan - Type Definitions
 */

// ============================================
// INGREDIENT TYPES
// ============================================

export interface Ingredient {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  category?: string;
}

// ============================================
// RECIPE STEP TYPES
// ============================================

export interface StepIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  id?: string;
  instruction: string;
  timerMinutes?: number;
  tip?: string;
  ingredients?: StepIngredient[];
  image?: string;
  order: number;
}

// ============================================
// RECIPE TYPES
// ============================================

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  image?: string;
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  notes?: string;
  source?: string;
  sourceUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// COOKING MODE TYPES
// ============================================

export interface TimerInfo {
  id: string;
  minutes: number;
  label: string;
  startTime: number;
  isRunning: boolean;
}

export interface CookingState {
  currentStepIndex: number;
  completedSteps: Set<number>;
  activeTimers: TimerInfo[];
  checkedIngredients: Set<string>;
  isChecklistOpen: boolean;
  isTimerPanelOpen: boolean;
}

// ============================================
// MEAL PLAN TYPES
// ============================================

export interface MealPlanEntry {
  id: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId: string;
  recipe?: Recipe;
  servings: number;
  notes?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  entries: MealPlanEntry[];
}

// ============================================
// SHOPPING LIST TYPES
// ============================================

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeIds: string[];
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Date;
  items: ShoppingListItem[];
}

// ============================================
// USER PREFERENCES
// ============================================

export interface UserPreferences {
  defaultServings: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  voiceEnabled: boolean;
  wakeLockEnabled: boolean;
  timerSoundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface RecipeFilter {
  search?: string;
  category?: string;
  difficulty?: ('easy' | 'medium' | 'hard')[];
  maxTime?: number;
  ingredients?: string[];
  tags?: string[];
}

export interface SortOption {
  field: 'title' | 'createdAt' | 'totalTimeMinutes' | 'difficulty';
  direction: 'asc' | 'desc';
}
