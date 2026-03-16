/**
 * Service Worker Event Handlers
 * Manages PWA install prompts and online/offline status
 */

// Type definitions for PWA install prompt
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

export interface InstallPromptState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
}

export type InstallPromptCallback = (state: InstallPromptState) => void;
export type OnlineStatusCallback = (isOnline: boolean) => void;

class ServiceWorkerHandler {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private installCallbacks: InstallPromptCallback[] = [];
  private onlineCallbacks: OnlineStatusCallback[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupInstallPrompt();
    this.setupOnlineStatus();
    this.checkInstalledStatus();
  }

  /**
   * Setup beforeinstallprompt event handler
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Notify all listeners
      this.notifyInstallListeners();

      console.log('[SW Handler] Install prompt captured');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;

      // Notify all listeners
      this.notifyInstallListeners();

      console.log('[SW Handler] App installed successfully');
    });
  }

  /**
   * Setup online/offline event handlers
   */
  private setupOnlineStatus(): void {
    const handleOnline = (): void => {
      this.isOnline = true;
      this.notifyOnlineListeners();
      console.log('[SW Handler] App is online');
    };

    const handleOffline = (): void => {
      this.isOnline = false;
      this.notifyOnlineListeners();
      console.log('[SW Handler] App is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * Check if app is already installed
   */
  private checkInstalledStatus(): void {
    // Check if running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    this.isInstalled = isStandalone;

    if (isStandalone) {
      console.log('[SW Handler] App is running in standalone mode');
    }
  }

  /**
   * Notify all install prompt listeners
   */
  private notifyInstallListeners(): void {
    const state: InstallPromptState = {
      deferredPrompt: this.deferredPrompt,
      isInstallable: this.deferredPrompt !== null,
      isInstalled: this.isInstalled,
    };

    this.installCallbacks.forEach((callback) => callback(state));
  }

  /**
   * Notify all online status listeners
   */
  private notifyOnlineListeners(): void {
    this.onlineCallbacks.forEach((callback) => callback(this.isOnline));
  }

  /**
   * Subscribe to install prompt changes
   */
  public onInstallPromptChange(callback: InstallPromptCallback): () => void {
    this.installCallbacks.push(callback);

    // Immediately notify with current state
    callback({
      deferredPrompt: this.deferredPrompt,
      isInstallable: this.deferredPrompt !== null,
      isInstalled: this.isInstalled,
    });

    // Return unsubscribe function
    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) {
        this.installCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to online status changes
   */
  public onOnlineStatusChange(callback: OnlineStatusCallback): () => void {
    this.onlineCallbacks.push(callback);

    // Immediately notify with current state
    callback(this.isOnline);

    // Return unsubscribe function
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger the install prompt
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[SW Handler] No deferred prompt available');
      return false;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;

    // Clear the deferred prompt
    this.deferredPrompt = null;

    // Notify listeners
    this.notifyInstallListeners();

    return outcome === 'accepted';
  }

  /**
   * Get current install state
   */
  public getInstallState(): InstallPromptState {
    return {
      deferredPrompt: this.deferredPrompt,
      isInstallable: this.deferredPrompt !== null,
      isInstalled: this.isInstalled,
    };
  }

  /**
   * Get current online status
   */
  public isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Dismiss the install prompt (hide without installing)
   */
  public dismissInstallPrompt(): void {
    // We don't actually dismiss the browser prompt, just hide our UI
    // The deferred prompt remains available
    console.log('[SW Handler] Install prompt dismissed by user');
  }
}

// Create singleton instance
export const swHandler = new ServiceWorkerHandler();

// Utility functions for direct use
export const isOnline = (): boolean => navigator.onLine;

export const isPWAInstalled = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

export const canInstallPWA = (): boolean => {
  return swHandler.getInstallState().isInstallable;
};

export const promptPWAInstall = async (): Promise<boolean> => {
  return swHandler.promptInstall();
};

export default ServiceWorkerHandler;
