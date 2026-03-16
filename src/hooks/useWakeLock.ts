import { useState, useEffect, useCallback, useRef } from 'react';

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: Error | null;
}

interface UseWakeLockReturn extends WakeLockState {
  request: () => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Hook for managing the Screen Wake Lock API
 * Prevents the screen from turning off while cooking
 */
export function useWakeLock(): UseWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check for Wake Lock API support
  useEffect(() => {
    const supported = 'wakeLock' in navigator;
    setIsSupported(supported);
  }, []);

  // Handle visibility change - re-acquire wake lock when tab becomes visible
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current === null && isActive) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setIsActive(true);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to re-acquire wake lock'));
          setIsActive(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, isActive]);

  // Request wake lock
  const request = useCallback(async () => {
    if (!isSupported) {
      setError(new Error('Wake Lock API is not supported'));
      return;
    }

    try {
      // Release existing wake lock if any
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      wakeLockRef.current = await navigator.wakeLock.request('screen');
      
      // Listen for release events
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });

      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to acquire wake lock'));
      setIsActive(false);
      wakeLockRef.current = null;
    }
  }, [isSupported]);

  // Release wake lock
  const release = useCallback(async () => {
    if (!isSupported) return;

    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      setIsActive(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to release wake lock'));
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // Ignore release errors on unmount
        });
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
  };
}

export default useWakeLock;
