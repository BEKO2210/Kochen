import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface Timer {
  id: string;
  label: string;
  duration: number; // in Sekunden
  remaining: number; // in Sekunden
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface TimerPreset {
  label: string;
  duration: number; // in Sekunden
}

export interface UseTimerReturn {
  // State
  timers: Timer[];
  activeTimers: Timer[];
  completedTimers: Timer[];
  pausedTimers: Timer[];

  // CRUD
  addTimer: (label: string, duration: number) => string;
  removeTimer: (id: string) => boolean;
  removeAllTimers: () => void;
  removeCompletedTimers: () => void;

  // Timer Control
  startTimer: (id: string) => boolean;
  pauseTimer: (id: string) => boolean;
  resumeTimer: (id: string) => boolean;
  stopTimer: (id: string) => boolean;
  resetTimer: (id: string) => boolean;

  // Timer Info
  getTimer: (id: string) => Timer | undefined;
  getFormattedTime: (id: string) => string;

  // Presets
  presets: TimerPreset[];
  addPreset: (preset: TimerPreset) => void;
  removePreset: (label: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'kochplan_timers';
const PRESETS_KEY = 'kochplan_timer_presets';

const DEFAULT_PRESETS: TimerPreset[] = [
  { label: '🥚 Ei weich', duration: 180 }, // 3 Minuten
  { label: '🥚 Ei mittel', duration: 300 }, // 5 Minuten
  { label: '🥚 Ei hart', duration: 420 }, // 7 Minuten
  { label: '🍝 Nudeln al dente', duration: 480 }, // 8 Minuten
  { label: '🍝 Nudeln weich', duration: 600 }, // 10 Minuten
  { label: '🍚 Reis', duration: 900 }, // 15 Minuten
  { label: '🥔 Kartoffeln', duration: 1200 }, // 20 Minuten
  { label: '⏱️ 5 Minuten', duration: 300 },
  { label: '⏱️ 10 Minuten', duration: 600 },
  { label: '⏱️ 15 Minuten', duration: 900 },
  { label: '⏱️ 20 Minuten', duration: 1200 },
  { label: '⏱️ 30 Minuten', duration: 1800 },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generiert eine eindeutige ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formatiert Sekunden in MM:SS
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Lädt Timer aus dem LocalStorage
 */
const loadTimersFromStorage = (): Timer[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((timer: Timer) => ({
      ...timer,
      createdAt: new Date(timer.createdAt),
      startedAt: timer.startedAt ? new Date(timer.startedAt) : null,
      completedAt: timer.completedAt ? new Date(timer.completedAt) : null,
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Timer:', error);
    return [];
  }
};

/**
 * Speichert Timer im LocalStorage
 */
const saveTimersToStorage = (timers: Timer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.error('Fehler beim Speichern der Timer:', error);
  }
};

/**
 * Lädt Presets aus dem LocalStorage
 */
const loadPresetsFromStorage = (): TimerPreset[] => {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (!stored) return DEFAULT_PRESETS;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Fehler beim Laden der Presets:', error);
    return DEFAULT_PRESETS;
  }
};

/**
 * Speichert Presets im LocalStorage
 */
const savePresetsToStorage = (presets: TimerPreset[]): void => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Fehler beim Speichern der Presets:', error);
  }
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook zur Verwaltung mehrerer Timer
 * Unterstützt Start, Pause, Resume, Reset und Benachrichtigungen
 *
 * @example
 * ```tsx
 * const { timers, addTimer, startTimer, getFormattedTime } = useTimer();
 *
 * const id = addTimer('Nudeln', 600);
 * startTimer(id);
 *
 * return <div>{getFormattedTime(id)}</div>;
 * ```
 */
export function useTimer(): UseTimerReturn {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>(DEFAULT_PRESETS);
  const intervalRefs = useRef<Map<string, number>>(new Map());

  // Initial laden
  useEffect(() => {
    const loadedTimers = loadTimersFromStorage();
    const loadedPresets = loadPresetsFromStorage();
    setTimers(loadedTimers);
    setPresets(loadedPresets);
  }, []);

  // Speichern bei Änderungen
  useEffect(() => {
    saveTimersToStorage(timers);
  }, [timers]);

  useEffect(() => {
    savePresetsToStorage(presets);
  }, [presets]);

  // Timer-Intervalle verwalten
  useEffect(() => {
    timers.forEach((timer) => {
      if (timer.isRunning && !intervalRefs.current.has(timer.id)) {
        const intervalId = window.setInterval(() => {
          setTimers((prev) => {
            const timerIndex = prev.findIndex((t) => t.id === timer.id);
            if (timerIndex === -1) return prev;

            const currentTimer = prev[timerIndex];
            const newRemaining = currentTimer.remaining - 1;

            if (newRemaining <= 0) {
              // Timer abgelaufen
              window.clearInterval(intervalId);
              intervalRefs.current.delete(timer.id);

              // Benachrichtigung anzeigen
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Timer abgelaufen!', {
                  body: currentTimer.label,
                  icon: '/icon-192x192.png',
                });
              }

              const newTimers = [...prev];
              newTimers[timerIndex] = {
                ...currentTimer,
                remaining: 0,
                isRunning: false,
                isCompleted: true,
                completedAt: new Date(),
              };
              return newTimers;
            }

            const newTimers = [...prev];
            newTimers[timerIndex] = {
              ...currentTimer,
              remaining: newRemaining,
            };
            return newTimers;
          });
        }, 1000);

        intervalRefs.current.set(timer.id, intervalId);
      } else if (!timer.isRunning && intervalRefs.current.has(timer.id)) {
        const intervalId = intervalRefs.current.get(timer.id);
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        intervalRefs.current.delete(timer.id);
      }
    });

    return () => {
      intervalRefs.current.forEach((intervalId) => {
        window.clearInterval(intervalId);
      });
      intervalRefs.current.clear();
    };
  }, [timers]);

  // Benachrichtigungs-Permission anfordern
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Abgeleitete States
  const activeTimers = timers.filter((t) => t.isRunning);
  const completedTimers = timers.filter((t) => t.isCompleted);
  const pausedTimers = timers.filter((t) => t.isPaused);

  /**
   * Fügt einen neuen Timer hinzu
   */
  const addTimer = useCallback((label: string, duration: number): string => {
    const id = generateId();
    const newTimer: Timer = {
      id,
      label,
      duration,
      remaining: duration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
    };

    setTimers((prev) => [...prev, newTimer]);
    return id;
  }, []);

  /**
   * Entfernt einen Timer
   */
  const removeTimer = useCallback((id: string): boolean => {
    let removed = false;

    setTimers((prev) => {
      const timer = prev.find((t) => t.id === id);
      if (timer) {
        removed = true;
        // Interval stoppen falls läuft
        const intervalId = intervalRefs.current.get(id);
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalRefs.current.delete(id);
        }
      }
      return prev.filter((t) => t.id !== id);
    });

    return removed;
  }, []);

  /**
   * Entfernt alle Timer
   */
  const removeAllTimers = useCallback((): void => {
    // Alle Intervalle stoppen
    intervalRefs.current.forEach((intervalId) => {
      window.clearInterval(intervalId);
    });
    intervalRefs.current.clear();

    setTimers([]);
  }, []);

  /**
   * Entfernt alle abgeschlossenen Timer
   */
  const removeCompletedTimers = useCallback((): void => {
    setTimers((prev) => prev.filter((t) => !t.isCompleted));
  }, []);

  /**
   * Startet einen Timer
   */
  const startTimer = useCallback((id: string): boolean => {
    let started = false;

    setTimers((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;

      const timer = prev[index];
      if (timer.isRunning || timer.isCompleted) return prev;

      started = true;
      const newTimers = [...prev];
      newTimers[index] = {
        ...timer,
        isRunning: true,
        isPaused: false,
        startedAt: timer.startedAt || new Date(),
      };
      return newTimers;
    });

    return started;
  }, []);

  /**
   * Pausiert einen Timer
   */
  const pauseTimer = useCallback((id: string): boolean => {
    let paused = false;

    setTimers((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;

      const timer = prev[index];
      if (!timer.isRunning) return prev;

      paused = true;
      const newTimers = [...prev];
      newTimers[index] = {
        ...timer,
        isRunning: false,
        isPaused: true,
      };
      return newTimers;
    });

    return paused;
  }, []);

  /**
   * Setzt einen pausierten Timer fort
   */
  const resumeTimer = useCallback((id: string): boolean => {
    return startTimer(id);
  }, [startTimer]);

  /**
   * Stoppt einen Timer
   */
  const stopTimer = useCallback((id: string): boolean => {
    let stopped = false;

    setTimers((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;

      const timer = prev[index];
      if (!timer.isRunning) return prev;

      stopped = true;
      const newTimers = [...prev];
      newTimers[index] = {
        ...timer,
        isRunning: false,
        isPaused: false,
      };
      return newTimers;
    });

    return stopped;
  }, []);

  /**
   * Setzt einen Timer zurück
   */
  const resetTimer = useCallback((id: string): boolean => {
    let reset = false;

    setTimers((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;

      const timer = prev[index];
      reset = true;

      // Interval stoppen falls läuft
      const intervalId = intervalRefs.current.get(id);
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalRefs.current.delete(id);
      }

      const newTimers = [...prev];
      newTimers[index] = {
        ...timer,
        remaining: timer.duration,
        isRunning: false,
        isPaused: false,
        isCompleted: false,
        completedAt: null,
      };
      return newTimers;
    });

    return reset;
  }, []);

  /**
   * Holt einen Timer anhand der ID
   */
  const getTimer = useCallback(
    (id: string): Timer | undefined => {
      return timers.find((t) => t.id === id);
    },
    [timers]
  );

  /**
   * Formatiert die verbleibende Zeit eines Timers
   */
  const getFormattedTime = useCallback(
    (id: string): string => {
      const timer = timers.find((t) => t.id === id);
      if (!timer) return '00:00';
      return formatTime(timer.remaining);
    },
    [timers]
  );

  /**
   * Fügt ein Preset hinzu
   */
  const addPreset = useCallback((preset: TimerPreset): void => {
    setPresets((prev) => {
      // Prüfen ob bereits vorhanden
      if (prev.some((p) => p.label === preset.label)) {
        return prev;
      }
      return [...prev, preset];
    });
  }, []);

  /**
   * Entfernt ein Preset
   */
  const removePreset = useCallback((label: string): void => {
    setPresets((prev) => prev.filter((p) => p.label !== label));
  }, []);

  return {
    timers,
    activeTimers,
    completedTimers,
    pausedTimers,
    addTimer,
    removeTimer,
    removeAllTimers,
    removeCompletedTimers,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    getTimer,
    getFormattedTime,
    presets,
    addPreset,
    removePreset,
  };
}

export default useTimer;
