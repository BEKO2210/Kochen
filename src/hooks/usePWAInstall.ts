import { useState, useEffect, useCallback } from 'react';

/**
 * Interface für das BeforeInstallPromptEvent
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Rückgabe-Interface für den usePWAInstall Hook
 */
export interface UsePWAInstallReturn {
  /** Ob die Installation verfügbar ist */
  isInstallable: boolean;
  /** Ob die App bereits installiert ist */
  isInstalled: boolean;
  /** Funktion zum Auslösen des Installations-Prompts */
  install: () => Promise<boolean>;
  /** Plattformen, die unterstützt werden */
  platforms: string[];
}

/**
 * Hook zur Verwaltung der PWA-Installation
 * Erfasst das BeforeInstallPromptEvent und ermöglicht das Auslösen des Installationsdialogs
 *
 * @example
 * ```tsx
 * const { isInstallable, isInstalled, install } = usePWAInstall();
 *
 * if (isInstallable) {
 *   <button onClick={install}>App installieren</button>
 * }
 * ```
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    // Prüfen, ob die App bereits installiert ist (iOS Safari oder Display-Mode)
    const checkInstalled = (): boolean => {
      // iOS: standalone mode
      if (window.navigator.standalone === true) {
        return true;
      }
      // Android/Chrome: display-mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      return false;
    };

    setIsInstalled(checkInstalled());

    /**
     * Handler für das beforeinstallprompt Event
     * Wird ausgelöst, wenn die App installiert werden kann
     */
    const handleBeforeInstallPrompt = (event: Event): void => {
      // Event verhindern, damit es später ausgelöst werden kann
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setPlatforms(promptEvent.platforms);
    };

    /**
     * Handler für das appinstalled Event
     * Wird ausgelöst, nachdem die App installiert wurde
     */
    const handleAppInstalled = (): void => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setPlatforms([]);
    };

    // Event Listener registrieren
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Löst den Installations-Prompt aus
   * @returns Promise<boolean> - true wenn akzeptiert, false wenn abgelehnt
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('Installation nicht verfügbar');
      return false;
    }

    try {
      // Prompt anzeigen
      await installPrompt.prompt();

      // Auf Benutzerentscheidung warten
      const choiceResult = await installPrompt.userChoice;

      // Prompt zurücksetzen
      setInstallPrompt(null);
      setPlatforms([]);

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Fehler bei der Installation:', error);
      return false;
    }
  }, [installPrompt]);

  return {
    isInstallable: installPrompt !== null,
    isInstalled,
    install,
    platforms,
  };
}

export default usePWAInstall;
