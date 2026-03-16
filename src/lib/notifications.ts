/**
 * Notification Utilities
 * Handles browser notifications for cooking timers and reminders
 */

import { Timer } from '../types';

// Check if notifications are supported
export const areNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

// Check current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!areNotificationsSupported()) {
    return 'default';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!areNotificationsSupported()) {
    console.warn('Notifications are not supported in this browser');
    return 'default';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`[Notifications] Permission ${permission}`);
    return permission;
  } catch (error) {
    console.error('[Notifications] Error requesting permission:', error);
    return 'default';
  }
};

// Check if notifications are enabled
export const areNotificationsEnabled = (): boolean => {
  return areNotificationsSupported() && Notification.permission === 'granted';
};

// Show a basic notification
export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!areNotificationsEnabled()) {
    console.warn('[Notifications] Cannot show notification - permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'kochplan-notification',
      requireInteraction: false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('[Notifications] Error showing notification:', error);
    return null;
  }
};

// Show timer notification
export const showTimerNotification = (timer: Timer): Notification | null => {
  const title = timer.recipeName
    ? `Timer: ${timer.recipeName}`
    : 'KochPlan Timer';

  const body = timer.label
    ? `"${timer.label}" ist abgelaufen!`
    : 'Der Timer ist abgelaufen!';

  return showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `timer-${timer.id}`,
    requireInteraction: true,
    actions: [
      {
        action: 'dismiss',
        title: 'Schließen',
      },
    ],
    data: {
      timerId: timer.id,
      type: 'timer-complete',
    },
  });
};

// Show cooking step notification
export const showCookingStepNotification = (
  stepNumber: number,
  totalSteps: number,
  stepDescription: string,
  recipeName: string
): Notification | null => {
  return showNotification(`Schritt ${stepNumber}/${totalSteps}: ${recipeName}`, {
    body: stepDescription.substring(0, 100) + (stepDescription.length > 100 ? '...' : ''),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `cooking-step-${stepNumber}`,
    requireInteraction: false,
    data: {
      stepNumber,
      type: 'cooking-step',
    },
  });
};

// Show meal reminder notification
export const showMealReminderNotification = (
  mealType: string,
  recipeName: string
): Notification | null => {
  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
  };

  const label = mealTypeLabels[mealType] || mealType;

  return showNotification(`Erinnerung: ${label}`, {
    body: `Heute steht "${recipeName}" auf dem Speiseplan!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `meal-reminder-${mealType}`,
    requireInteraction: false,
    data: {
      mealType,
      recipeName,
      type: 'meal-reminder',
    },
  });
};

// Schedule a notification for later (using setTimeout)
interface ScheduledNotification {
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

const scheduledNotifications: Map<string, ScheduledNotification> = new Map();

export const scheduleNotification = (
  id: string,
  delayMs: number,
  title: string,
  options?: NotificationOptions
): boolean => {
  // Cancel any existing notification with this ID
  cancelScheduledNotification(id);

  if (!areNotificationsEnabled()) {
    console.warn('[Notifications] Cannot schedule - notifications not enabled');
    return false;
  }

  const timeoutId = setTimeout(() => {
    showNotification(title, options);
    scheduledNotifications.delete(id);
  }, delayMs);

  scheduledNotifications.set(id, { id, timeoutId });

  console.log(`[Notifications] Scheduled notification "${id}" in ${delayMs}ms`);
  return true;
};

// Cancel a scheduled notification
export const cancelScheduledNotification = (id: string): boolean => {
  const scheduled = scheduledNotifications.get(id);
  if (scheduled) {
    clearTimeout(scheduled.timeoutId);
    scheduledNotifications.delete(id);
    console.log(`[Notifications] Cancelled scheduled notification "${id}"`);
    return true;
  }
  return false;
};

// Schedule a timer notification
export const scheduleTimerNotification = (timer: Timer): boolean => {
  const remainingMs = timer.endTime - Date.now();

  if (remainingMs <= 0) {
    // Timer already expired, show immediately
    showTimerNotification(timer);
    return true;
  }

  const title = timer.recipeName
    ? `Timer: ${timer.recipeName}`
    : 'KochPlan Timer';

  const body = timer.label
    ? `"${timer.label}" ist abgelaufen!`
    : 'Der Timer ist abgelaufen!';

  return scheduleNotification(
    `timer-${timer.id}`,
    remainingMs,
    title,
    {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `timer-${timer.id}`,
      requireInteraction: true,
      data: {
        timerId: timer.id,
        type: 'timer-complete',
      },
    }
  );
};

// Cancel a timer notification
export const cancelTimerNotification = (timerId: string): boolean => {
  return cancelScheduledNotification(`timer-${timerId}`);
};

// Clear all scheduled notifications
export const clearAllScheduledNotifications = (): void => {
  scheduledNotifications.forEach((scheduled) => {
    clearTimeout(scheduled.timeoutId);
  });
  scheduledNotifications.clear();
  console.log('[Notifications] Cleared all scheduled notifications');
};

// Get count of scheduled notifications
export const getScheduledNotificationCount = (): number => {
  return scheduledNotifications.size;
};

// Test notification (for settings page)
export const sendTestNotification = async (): Promise<boolean> => {
  // Request permission if not granted
  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  if (!areNotificationsEnabled()) {
    return false;
  }

  const notification = showNotification('KochPlan Test', {
    body: 'Benachrichtigungen funktionieren! 🎉',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'test-notification',
    requireInteraction: false,
  });

  return notification !== null;
};

// Play notification sound (if enabled)
export const playNotificationSound = async (soundUrl?: string): Promise<void> => {
  try {
    const audio = new Audio(soundUrl || '/sounds/notification.mp3');
    await audio.play();
  } catch (error) {
    console.warn('[Notifications] Could not play notification sound:', error);
  }
};

// Vibrate device (if supported)
export const vibrateDevice = (pattern: number | number[] = [200, 100, 200]): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Show notification with sound and vibration
export const showRichNotification = async (
  title: string,
  options?: NotificationOptions,
  enableSound = true,
  enableVibration = true
): Promise<Notification | null> => {
  const notification = showNotification(title, options);

  if (notification && enableSound) {
    await playNotificationSound();
  }

  if (notification && enableVibration) {
    vibrateDevice();
  }

  return notification;
};

export default {
  areNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  areNotificationsEnabled,
  showNotification,
  showTimerNotification,
  showCookingStepNotification,
  showMealReminderNotification,
  scheduleNotification,
  cancelScheduledNotification,
  scheduleTimerNotification,
  cancelTimerNotification,
  clearAllScheduledNotifications,
  getScheduledNotificationCount,
  sendTestNotification,
  playNotificationSound,
  vibrateDevice,
  showRichNotification,
};
