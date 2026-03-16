import { create } from 'zustand';

// Timer-Interface
export interface Timer {
  id: string;
  name: string;
  duration: number; // in Sekunden
  remaining: number; // in Sekunden
  isRunning: boolean;
  createdAt: number;
}

// Recipe-Interface (vereinfacht für Cooking Mode)
export interface CookingRecipe {
  id: string;
  title: string;
  image?: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: {
    id: string;
    name: string;
    amount: number;
    unit: string;
    optional?: boolean;
  }[];
  steps: {
    id: string;
    order: number;
    description: string;
    duration?: number; // optionale Schritt-Dauer in Minuten
    tip?: string;
  }[];
}

// Interface für CookingState
export interface CookingState {
  // Recipe & Step State
  currentRecipe: CookingRecipe | null;
  currentStep: number;
  isCookingMode: boolean;

  // Timer State
  activeTimers: Timer[];

  // Ingredient Check State
  checkedIngredients: string[];

  // Feature States
  isSpeaking: boolean;
  wakeLockActive: boolean;

  // Actions - Cooking Mode
  startCooking: (recipe: CookingRecipe) => void;
  exitCooking: () => void;

  // Actions - Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  resetSteps: () => void;

  // Actions - Timer
  addTimer: (name: string, durationMinutes: number) => string;
  removeTimer: (timerId: string) => void;
  startTimer: (timerId: string) => void;
  pauseTimer: (timerId: string) => void;
  resetTimer: (timerId: string) => void;
  tickTimer: (timerId: string) => void;
  clearAllTimers: () => void;

  // Actions - Ingredients
  toggleIngredient: (ingredientId: string) => void;
  checkAllIngredients: () => void;
  uncheckAllIngredients: () => void;
  setCheckedIngredients: (ingredientIds: string[]) => void;

  // Actions - Features
  toggleSpeech: () => void;
  setSpeech: (enabled: boolean) => void;
  toggleWakeLock: () => void;
  setWakeLock: (enabled: boolean) => void;
}

// Hilfsfunktion für Timer-ID
const generateTimerId = (): string => {
  return `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useCookingStore = create<CookingState>()((set, get) => ({
  // Initial State
  currentRecipe: null,
  currentStep: 0,
  isCookingMode: false,
  activeTimers: [],
  checkedIngredients: [],
  isSpeaking: false,
  wakeLockActive: false,

  // Actions - Cooking Mode
  startCooking: (recipe) => {
    set({
      currentRecipe: recipe,
      currentStep: 0,
      isCookingMode: true,
      checkedIngredients: [],
      activeTimers: [],
    });
  },

  exitCooking: () => {
    set({
      currentRecipe: null,
      currentStep: 0,
      isCookingMode: false,
      checkedIngredients: [],
      activeTimers: [],
      isSpeaking: false,
      wakeLockActive: false,
    });
  },

  // Actions - Navigation
  nextStep: () => {
    const { currentRecipe, currentStep } = get();
    if (currentRecipe && currentStep < currentRecipe.steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (stepIndex) => {
    const { currentRecipe } = get();
    if (
      currentRecipe &&
      stepIndex >= 0 &&
      stepIndex < currentRecipe.steps.length
    ) {
      set({ currentStep: stepIndex });
    }
  },

  resetSteps: () => {
    set({ currentStep: 0 });
  },

  // Actions - Timer
  addTimer: (name, durationMinutes) => {
    const id = generateTimerId();
    const duration = durationMinutes * 60; // Konvertiere zu Sekunden

    set((state) => ({
      activeTimers: [
        ...state.activeTimers,
        {
          id,
          name,
          duration,
          remaining: duration,
          isRunning: false,
          createdAt: Date.now(),
        },
      ],
    }));

    return id;
  },

  removeTimer: (timerId) => {
    set((state) => ({
      activeTimers: state.activeTimers.filter((timer) => timer.id !== timerId),
    }));
  },

  startTimer: (timerId) => {
    set((state) => ({
      activeTimers: state.activeTimers.map((timer) =>
        timer.id === timerId ? { ...timer, isRunning: true } : timer
      ),
    }));
  },

  pauseTimer: (timerId) => {
    set((state) => ({
      activeTimers: state.activeTimers.map((timer) =>
        timer.id === timerId ? { ...timer, isRunning: false } : timer
      ),
    }));
  },

  resetTimer: (timerId) => {
    set((state) => ({
      activeTimers: state.activeTimers.map((timer) =>
        timer.id === timerId
          ? { ...timer, remaining: timer.duration, isRunning: false }
          : timer
      ),
    }));
  },

  tickTimer: (timerId) => {
    set((state) => ({
      activeTimers: state.activeTimers.map((timer) => {
        if (timer.id === timerId && timer.isRunning && timer.remaining > 0) {
          return { ...timer, remaining: timer.remaining - 1 };
        }
        return timer;
      }),
    }));
  },

  clearAllTimers: () => {
    set({ activeTimers: [] });
  },

  // Actions - Ingredients
  toggleIngredient: (ingredientId) => {
    set((state) => {
      const isChecked = state.checkedIngredients.includes(ingredientId);
      return {
        checkedIngredients: isChecked
          ? state.checkedIngredients.filter((id) => id !== ingredientId)
          : [...state.checkedIngredients, ingredientId],
      };
    });
  },

  checkAllIngredients: () => {
    const { currentRecipe } = get();
    if (currentRecipe) {
      set({
        checkedIngredients: currentRecipe.ingredients.map((ing) => ing.id),
      });
    }
  },

  uncheckAllIngredients: () => {
    set({ checkedIngredients: [] });
  },

  setCheckedIngredients: (ingredientIds) => {
    set({ checkedIngredients: ingredientIds });
  },

  // Actions - Features
  toggleSpeech: () => {
    set((state) => ({ isSpeaking: !state.isSpeaking }));
  },

  setSpeech: (enabled) => {
    set({ isSpeaking: enabled });
  },

  toggleWakeLock: () => {
    set((state) => ({ wakeLockActive: !state.wakeLockActive }));
  },

  setWakeLock: (enabled) => {
    set({ wakeLockActive: enabled });
  },
}));

// Selector-Hooks für bessere Performance
export const useCurrentRecipe = () => useCookingStore((state) => state.currentRecipe);
export const useCurrentStep = () => useCookingStore((state) => state.currentStep);
export const useIsCookingMode = () => useCookingStore((state) => state.isCookingMode);
export const useActiveTimers = () => useCookingStore((state) => state.activeTimers);
export const useCheckedIngredients = () => useCookingStore((state) => state.checkedIngredients);
export const useIsSpeaking = () => useCookingStore((state) => state.isSpeaking);
export const useWakeLockActive = () => useCookingStore((state) => state.wakeLockActive);

// Hilfs-Selectors
export const useTotalSteps = () =>
  useCookingStore((state) => state.currentRecipe?.steps.length ?? 0);

export const useProgressPercentage = () =>
  useCookingStore((state) => {
    const total = state.currentRecipe?.steps.length ?? 0;
    if (total === 0) return 0;
    return ((state.currentStep + 1) / total) * 100;
  });

export const useIsFirstStep = () =>
  useCookingStore((state) => state.currentStep === 0);

export const useIsLastStep = () =>
  useCookingStore((state) => {
    const total = state.currentRecipe?.steps.length ?? 0;
    return state.currentStep === total - 1;
  });

export const useRunningTimersCount = () =>
  useCookingStore(
    (state) => state.activeTimers.filter((t) => t.isRunning).length
  );

export const useCompletedTimersCount = () =>
  useCookingStore(
    (state) => state.activeTimers.filter((t) => t.remaining === 0).length
  );
