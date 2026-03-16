import { useState, useEffect, useCallback } from 'react';

/**
 * Rückgabe-Interface für den useOnlineStatus Hook
 */
export interface UseOnlineStatusReturn {
  /** Ob der Browser online ist */
  isOnline: boolean;
  /** Ob der Browser offline ist */
  isOffline: boolean;
  /** Zeitpunkt des letzten Online-Status-Wechsels */
  lastChanged: Date | null;
  /** Anzahl der Verbindungsunterbrechungen in dieser Session */
  disconnectCount: number;
}

/**
 * Hook zur Überwachung des Online/Offline-Status
 * Nutzt die Navigator.onLine API und die online/offline Events
 *
 * @example
 * ```tsx
 * const { isOnline, isOffline, lastChanged } = useOnlineStatus();
 *
 * if (isOffline) {
 *   return <Alert>Keine Internetverbindung</Alert>;
 * }
 * ```
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);
  const [disconnectCount, setDisconnectCount] = useState<number>(0);

  /**
   * Handler für den Online-Event
   */
  const handleOnline = useCallback((): void => {
    setIsOnline(true);
    setLastChanged(new Date());
  }, []);

  /**
   * Handler für den Offline-Event
   */
  const handleOffline = useCallback((): void => {
    setIsOnline(false);
    setLastChanged(new Date());
    setDisconnectCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Initialen Status setzen
    setIsOnline(navigator.onLine);

    // Event Listener registrieren
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastChanged,
    disconnectCount,
  };
}

export default useOnlineStatus;
