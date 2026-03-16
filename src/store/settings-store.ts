import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Settings Types
export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'de' | 'en';

// Interface für SettingsState
export interface SettingsState {
  // Appearance
  theme: Theme;

  // Language
  language: Language;

  // Recipe Defaults
  defaultServings: number;

  // Notifications
  notifications: boolean;
  timerSound: boolean;
  hapticFeedback: boolean;

  // Actions - Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Actions - Language
  setLanguage: (language: Language) => void;

  // Actions - Servings
  setDefaultServings: (servings: number) => void;
  incrementDefaultServings: () => void;
  decrementDefaultServings: () => void;

  // Actions - Notifications
  toggleNotifications: () => void;
  toggleTimerSound: () => void;
  toggleHapticFeedback: () => void;

  // Actions - Reset
  resetSettings: () => void;
}

// Default Settings
const defaultSettings = {
  theme: 'auto' as Theme,
  language: 'de' as Language,
  defaultServings: 4,
  notifications: true,
  timerSound: true,
  hapticFeedback: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial State
      theme: defaultSettings.theme,
      language: defaultSettings.language,
      defaultServings: defaultSettings.defaultServings,
      notifications: defaultSettings.notifications,
      timerSound: defaultSettings.timerSound,
      hapticFeedback: defaultSettings.hapticFeedback,

      // Actions - Theme
      setTheme: (theme) => {
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => {
          const themes: Theme[] = ['light', 'dark', 'auto'];
          const currentIndex = themes.indexOf(state.theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          return { theme: themes[nextIndex] };
        });
      },

      // Actions - Language
      setLanguage: (language) => {
        set({ language });
      },

      // Actions - Servings
      setDefaultServings: (servings) => {
        // Stelle sicher, dass servings zwischen 1 und 20 liegt
        const clampedServings = Math.max(1, Math.min(20, servings));
        set({ defaultServings: clampedServings });
      },

      incrementDefaultServings: () => {
        set((state) => ({
          defaultServings: Math.min(20, state.defaultServings + 1),
        }));
      },

      decrementDefaultServings: () => {
        set((state) => ({
          defaultServings: Math.max(1, state.defaultServings - 1),
        }));
      },

      // Actions - Notifications
      toggleNotifications: () => {
        set((state) => ({ notifications: !state.notifications }));
      },

      toggleTimerSound: () => {
        set((state) => ({ timerSound: !state.timerSound }));
      },

      toggleHapticFeedback: () => {
        set((state) => ({ hapticFeedback: !state.hapticFeedback }));
      },

      // Actions - Reset
      resetSettings: () => {
        set({ ...defaultSettings });
      },
    }),
    {
      name: 'kochplan-settings-store',
      // Alle Settings werden persistiert
    }
  )
);

// Selector-Hooks für bessere Performance
export const useTheme = () => useSettingsStore((state) => state.theme);
export const useLanguage = () => useSettingsStore((state) => state.language);
export const useDefaultServings = () =>
  useSettingsStore((state) => state.defaultServings);
export const useNotifications = () =>
  useSettingsStore((state) => state.notifications);
export const useTimerSound = () => useSettingsStore((state) => state.timerSound);
export const useHapticFeedback = () =>
  useSettingsStore((state) => state.hapticFeedback);

// Hilfs-Selectors
export const useIsDarkMode = () =>
  useSettingsStore((state) => {
    if (state.theme === 'auto') {
      // Prüfe System-Präferenz (nur im Browser verfügbar)
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    }
    return state.theme === 'dark';
  });

export const useEffectiveTheme = () =>
  useSettingsStore((state) => {
    if (state.theme === 'auto') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light';
    }
    return state.theme;
  });

// Hook für System-Theme-Änderungen zu lauschen
export const listenToSystemThemeChanges = (
  callback: (isDark: boolean) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
};
