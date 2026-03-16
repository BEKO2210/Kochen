// ============================================
// KochPlan Store Exports
// ============================================

// Recipe Store
export {
  useRecipeStore,
  useRecipeFilters,
  useRecipeSortBy,
  useRecipeSearchQuery,
  useRecipeViewMode,
  useSelectedCollection,
  useHasActiveFilters,
} from './recipe-store';

export type {
  RecipeCategory,
  DietType,
  TimeFilter,
  DifficultyFilter,
  SortOption,
  ViewMode,
  RecipeFilters,
  RecipeState,
} from './recipe-store';

// Cooking Store
export {
  useCookingStore,
  useCurrentRecipe,
  useCurrentStep,
  useIsCookingMode,
  useActiveTimers,
  useCheckedIngredients,
  useIsSpeaking,
  useWakeLockActive,
  useTotalSteps,
  useProgressPercentage,
  useIsFirstStep,
  useIsLastStep,
  useRunningTimersCount,
  useCompletedTimersCount,
} from './cooking-store';

export type {
  Timer,
  CookingRecipe,
  CookingState,
} from './cooking-store';

// Settings Store
export {
  useSettingsStore,
  useTheme,
  useLanguage,
  useDefaultServings,
  useNotifications,
  useTimerSound,
  useHapticFeedback,
  useIsDarkMode,
  useEffectiveTheme,
  listenToSystemThemeChanges,
} from './settings-store';

export type {
  Theme,
  Language,
  SettingsState,
} from './settings-store';
