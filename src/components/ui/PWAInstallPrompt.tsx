import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, ChefHat, Smartphone } from 'lucide-react';

// Type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  title?: string;
  description?: string;
  dismissDuration?: number; // Duration in days to remember dismissal
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'card' | 'minimal';
}

const STORAGE_KEY = 'pwa-install-prompt-dismissed';

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  title = 'KochPlan installieren',
  description = 'Fügen Sie KochPlan zu Ihrem Startbildschirm hinzu für schnellen Zugriff, auch offline.',
  dismissDuration = 7,
  onInstall,
  onDismiss,
  className = '',
  variant = 'banner',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Check if prompt was recently dismissed
  const checkDismissed = useCallback((): boolean => {
    try {
      const dismissedData = localStorage.getItem(STORAGE_KEY);
      if (!dismissedData) return false;

      const { timestamp, duration } = JSON.parse(dismissedData);
      const dismissedDate = new Date(timestamp);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      return daysSinceDismissed < duration;
    } catch {
      return false;
    }
  }, []);

  // Save dismissal to localStorage
  const saveDismissal = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: new Date().toISOString(), duration: dismissDuration })
      );
    } catch (error) {
      console.error('Failed to save dismissal:', error);
    }
  }, [dismissDuration]);

  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Check if recently dismissed
      if (checkDismissed()) return;

      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsVisible(false);
    };

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkDismissed]);

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      onInstall?.();
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  // Handle dismiss button click
  const handleDismiss = () => {
    saveDismissal();
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't render if not visible or already installed
  if (!isVisible || isInstalled) return null;

  // Banner variant
  if (variant === 'banner') {
    return (
      <div
        className={`
          fixed bottom-20 left-4 right-4
          bg-white dark:bg-gray-800
          rounded-xl
          shadow-xl
          border border-gray-200 dark:border-gray-700
          p-4
          z-50
          animate-slide-up
          ${className}
        `}
        role="dialog"
        aria-label="App-Installation"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-orange-600 dark:text-orange-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
            
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleInstall}
                className="
                  flex items-center gap-2
                  px-4 py-2
                  bg-orange-500 hover:bg-orange-600
                  text-white text-sm font-medium
                  rounded-lg
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  active:scale-95
                "
              >
                <Download className="w-4 h-4" />
                Installieren
              </button>
              
              <button
                onClick={handleDismiss}
                className="
                  px-4 py-2
                  text-gray-600 dark:text-gray-400
                  text-sm font-medium
                  hover:text-gray-800 dark:hover:text-gray-200
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg
                "
              >
                Später
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="
              flex-shrink-0
              p-1
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg
            "
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={`
          bg-gradient-to-br from-orange-500 to-orange-600
          rounded-2xl
          p-6
          text-white
          shadow-xl
          ${className}
        `}
        role="dialog"
        aria-label="App-Installation"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-orange-100 text-sm">{description}</p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="
              p-1
              text-orange-200 hover:text-white
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg
            "
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <button
          onClick={handleInstall}
          className="
            w-full mt-5
            flex items-center justify-center gap-2
            px-4 py-3
            bg-white text-orange-600
            font-semibold
            rounded-xl
            transition-all
            hover:bg-orange-50
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-500
            active:scale-[0.98]
          "
        >
          <Download className="w-5 h-5" />
          Jetzt installieren
        </button>
      </div>
    );
  }

  // Minimal variant
  return (
    <div
      className={`
        inline-flex items-center gap-3
        bg-orange-50 dark:bg-orange-900/20
        border border-orange-200 dark:border-orange-800
        rounded-lg
        px-3 py-2
        ${className}
      `}
      role="dialog"
      aria-label="App-Installation"
    >
      <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      <span className="text-sm text-orange-800 dark:text-orange-200">
        {title}
      </span>
      <button
        onClick={handleInstall}
        className="
          text-sm font-medium
          text-orange-600 dark:text-orange-400
          hover:text-orange-700 dark:hover:text-orange-300
          underline underline-offset-2
          focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1
        "
      >
        Installieren
      </button>
      <button
        onClick={handleDismiss}
        className="
          p-0.5
          text-orange-400 hover:text-orange-600 dark:hover:text-orange-300
          focus:outline-none focus:ring-2 focus:ring-orange-500 rounded
        "
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook to check if app can be installed
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return { canInstall, isInstalled };
};

export default PWAInstallPrompt;
