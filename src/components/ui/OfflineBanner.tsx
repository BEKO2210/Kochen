import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  showReconnectMessage?: boolean;
  reconnectDuration?: number; // Duration in ms to show reconnect message
  position?: 'top' | 'bottom';
  className?: string;
  onRetry?: () => void;
}

type ConnectionStatus = 'online' | 'offline' | 'reconnected';

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showReconnectMessage = true,
  reconnectDuration = 3000,
  position = 'top',
  className = '',
  onRetry,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  // Check initial online status
  const checkOnlineStatus = useCallback((): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }, []);

  useEffect(() => {
    // Set initial status
    setStatus(checkOnlineStatus() ? 'online' : 'offline');

    const handleOffline = () => {
      setStatus('offline');
      setWasOffline(true);
    };

    const handleOnline = () => {
      if (wasOffline && showReconnectMessage) {
        setStatus('reconnected');
        // Hide reconnect message after duration
        setTimeout(() => {
          setStatus('online');
          setWasOffline(false);
        }, reconnectDuration);
      } else {
        setStatus('online');
        setWasOffline(false);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkOnlineStatus, wasOffline, showReconnectMessage, reconnectDuration]);

  // Handle retry action
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload page
      window.location.reload();
    }
  };

  // Don't render if online and no reconnect message needed
  if (status === 'online') return null;

  const positionClasses = position === 'top'
    ? 'fixed top-0 left-0 right-0'
    : 'fixed bottom-0 left-0 right-0';

  // Offline state
  if (status === 'offline') {
    return (
      <div
        className={`
          ${positionClasses}
          bg-red-500
          text-white
          px-4 py-3
          z-[100]
          shadow-lg
          ${className}
        `}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <WifiOff className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Keine Internetverbindung</p>
              <p className="text-sm text-red-100">
                Einige Funktionen sind möglicherweise nicht verfügbar
              </p>
            </div>
          </div>
          
          {onRetry && (
            <button
              onClick={handleRetry}
              className="
                flex items-center gap-2
                px-4 py-2
                bg-white/20 hover:bg-white/30
                rounded-lg
                text-sm font-medium
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-white/50
                active:scale-95
              "
            >
              <RefreshCw className="w-4 h-4" />
              Neu laden
            </button>
          )}
        </div>
      </div>
    );
  }

  // Reconnected state
  if (status === 'reconnected') {
    return (
      <div
        className={`
          ${positionClasses}
          bg-green-500
          text-white
          px-4 py-3
          z-[100]
          shadow-lg
          animate-fade-in
          ${className}
        `}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Wifi className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-medium">
            Verbindung wiederhergestellt
          </p>
        </div>
      </div>
    );
  }

  return null;
};

// Compact version for inline use
interface OfflineIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showLabel = true,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => setIsOnline(true);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2 py-1
        bg-red-100 dark:bg-red-900/30
        text-red-700 dark:text-red-400
        text-xs font-medium
        rounded-full
        ${className}
      `}
      role="status"
    >
      <CloudOff className="w-3 h-3" aria-hidden="true" />
      {showLabel && 'Offline'}
    </span>
  );
};

// Hook to track online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      if (!online) setWasOffline(true);
    };

    checkStatus();

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { isOnline, wasOffline };
};

export default OfflineBanner;
