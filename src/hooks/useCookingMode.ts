import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe, RecipeStep } from './useRecipes';

/**
 * Interface für die Wake Lock API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
 */
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

declare global {
  interface Navigator {
    wakeLock?: WakeLock;
  }
}

/**
 * Rückgabe-Interface für den useCookingMode Hook
 */
export interface UseCookingModeReturn {
  // State
  /** Ob der Koch-Modus aktiv ist */
  isActive: boolean;
  /** Aktuelles Rezept */
  currentRecipe: Recipe | null;
  /** Aktueller Schritt-Index */
  currentStepIndex: number;
  /** Aktueller Schritt */
  currentStep: RecipeStep | null;
  /** Ob Wake Lock aktiv ist */
  isWakeLockActive: boolean;
  /** Ob Wake Lock unterstützt wird */
  isWakeLockSupported: boolean;
  /** Gesamtfortschritt in Prozent */
  progress: number;

  // Aktionen
  /** Startet den Koch-Modus mit einem Rezept */
  startCooking: (recipe: Recipe) => void;
  /** Beendet den Koch-Modus */
  stopCooking: () => void;
  /** Geht zum nächsten Schritt */
  nextStep: () => void;
  /** Geht zum vorherigen Schritt */
  previousStep: () => void;
  /** Springt zu einem bestimmten Schritt */
  goToStep: (index: number) => void;
  /** Aktiviert/deaktiviert Wake Lock */
  toggleWakeLock: () => Promise<void>;
}

/**
 * Hook zur Verwaltung des Koch-Modus
 * Hält den Bildschirm während des Kochens wach (Wake Lock API)
 * und verwaltet den aktuellen Schritt
 *
 * @example
 * ```tsx
 * const {
 *   isActive,
 *   currentStep,
 *   nextStep,
 *   previousStep,
 *   progress
 * } = useCookingMode();
 *
 * if (isActive) {
 *   return <CookingView step={currentStep} onNext={nextStep} />;
 * }
 * ```
 */
export function useCookingMode(): UseCookingModeReturn {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Prüfen, ob Wake Lock unterstützt wird
  const isWakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  /**
   * Berechnet den Fortschritt in Prozent
   */
  const progress = ((): number => {
    if (!currentRecipe || currentRecipe.steps.length === 0) return 0;
    return Math.round(((currentStepIndex + 1) / currentRecipe.steps.length) * 100);
  })();

  /**
   * Holt den aktuellen Schritt
   */
  const currentStep = ((): RecipeStep | null => {
    if (!currentRecipe) return null;
    return currentRecipe.steps[currentStepIndex] || null;
  })();

  /**
   * Fordert einen Wake Lock an
   */
  const requestWakeLock = useCallback(async (): Promise<void> => {
    if (!isWakeLockSupported || !navigator.wakeLock) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsWakeLockActive(true);

      wakeLockRef.current.addEventListener('release', () => {
        setIsWakeLockActive(false);
        wakeLockRef.current = null;
      });
    } catch (error) {
      console.error('Fehler beim Anfordern des Wake Lock:', error);
      setIsWakeLockActive(false);
    }
  }, [isWakeLockSupported]);

  /**
   * Gibt den Wake Lock frei
   */
  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (error) {
        console.error('Fehler beim Freigeben des Wake Lock:', error);
      }
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  }, []);

  /**
   * Toggelt den Wake Lock
   */
  const toggleWakeLock = useCallback(async (): Promise<void> => {
    if (isWakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }, [isWakeLockActive, requestWakeLock, releaseWakeLock]);

  /**
   * Startet den Koch-Modus
   */
  const startCooking = useCallback(
    (recipe: Recipe): void => {
      setCurrentRecipe(recipe);
      setCurrentStepIndex(0);
      setIsActive(true);
      // Automatisch Wake Lock anfordern
      requestWakeLock();
    },
    [requestWakeLock]
  );

  /**
   * Beendet den Koch-Modus
   */
  const stopCooking = useCallback((): void => {
    releaseWakeLock();
    setIsActive(false);
    setCurrentRecipe(null);
    setCurrentStepIndex(0);
  }, [releaseWakeLock]);

  /**
   * Geht zum nächsten Schritt
   */
  const nextStep = useCallback((): void => {
    if (!currentRecipe) return;
    setCurrentStepIndex((prev) => Math.min(prev + 1, currentRecipe.steps.length - 1));
  }, [currentRecipe]);

  /**
   * Geht zum vorherigen Schritt
   */
  const previousStep = useCallback((): void => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  /**
   * Springt zu einem bestimmten Schritt
   */
  const goToStep = useCallback((index: number): void => {
    if (!currentRecipe) return;
    setCurrentStepIndex(Math.max(0, Math.min(index, currentRecipe.steps.length - 1)));
  }, [currentRecipe]);

  // Wake Lock bei Sichtbarkeitsänderung neu anfordern
  useEffect(() => {
    const handleVisibilityChange = async (): Promise<void> => {
      if (document.visibilityState === 'visible' && isActive && !isWakeLockActive) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isWakeLockActive, requestWakeLock]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    isActive,
    currentRecipe,
    currentStepIndex,
    currentStep,
    isWakeLockActive,
    isWakeLockSupported,
    progress,
    startCooking,
    stopCooking,
    nextStep,
    previousStep,
    goToStep,
    toggleWakeLock,
  };
}

export default useCookingMode;
