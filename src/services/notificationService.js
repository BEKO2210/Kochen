/**
 * KochPlan Notification Service
 * 
 * Verwaltet Push-Benachrichtigungen, Koch-Timer und Erinnerungen
 */

import { db } from '@/db/database';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.registration = null;
    this.initialized = false;
  }
  
  // ============================================
  // INITIALISIERUNG
  // ============================================
  
  /**
   * Service initialisieren
   */
  async init() {
    if (this.initialized) return true;
    
    if (!('Notification' in window)) {
      console.warn('[Notification] Notifications not supported');
      return false;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.warn('[Notification] Service Worker not supported');
      return false;
    }
    
    this.permission = Notification.permission;
    this.registration = await navigator.serviceWorker.ready;
    this.initialized = true;
    
    console.log('[Notification] Service initialized');
    return true;
  }
  
  // ============================================
  // BERECHTIGUNGEN
  // ============================================
  
  /**
   * Berechtigung für Benachrichtigungen anfragen
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    this.permission = await Notification.requestPermission();
    
    if (this.permission === 'granted') {
      await this.init();
      await this.subscribeToPush();
    }
    
    return this.permission;
  }
  
  /**
   * Prüfen ob Benachrichtigungen erlaubt sind
   */
  isGranted() {
    return this.permission === 'granted';
  }
  
  // ============================================
  // PUSH-SUBSCRIPTION
  // ============================================
  
  /**
   * Push-Subscription erstellen
   */
  async subscribeToPush() {
    if (!this.registration) return null;
    
    try {
      // Prüfen ob bereits subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Neue Subscription erstellen
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          console.warn('[Notification] VAPID public key not configured');
          return null;
        }
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });
      }
      
      // Subscription an Server senden
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('[Notification] Push subscription failed:', error);
      return null;
    }
  }
  
  /**
   * Subscription an Server senden
   */
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('[Notification] Failed to send subscription:', error);
    }
  }
  
  /**
   * Push-Subscription beenden
   */
  async unsubscribeFromPush() {
    if (!this.registration) return;
    
    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      
      // Server informieren
      try {
        await fetch('/api/v1/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      } catch (error) {
        console.error('[Notification] Failed to unsubscribe:', error);
      }
    }
  }
  
  // ============================================
  // LOKALE BENACHRICHTIGUNGEN
  // ============================================
  
  /**
   * Lokale Benachrichtigung anzeigen
   */
  async showNotification(title, options = {}) {
    if (!this.initialized) {
      await this.init();
    }
    
    if (this.permission !== 'granted') {
      console.warn('[Notification] Permission not granted');
      return false;
    }
    
    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'kochplan-notification',
      requireInteraction: false,
      silent: false,
    };
    
    const notificationOptions = { ...defaultOptions, ...options };
    
    try {
      await this.registration.showNotification(title, notificationOptions);
      return true;
    } catch (error) {
      console.error('[Notification] Show notification failed:', error);
      return false;
    }
  }
  
  // ============================================
  // KOCH-TIMER
  // ============================================
  
  /**
   * Koch-Timer erstellen
   */
  async setCookingTimer(recipeId, recipeName, durationMinutes, stepName = '') {
    const timerId = `timer-${Date.now()}`;
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    
    // Timer in IndexedDB speichern
    await db.timers.add({
      recipeId,
      name: stepName || 'Koch-Timer',
      duration: durationMinutes * 60 * 1000,
      startedAt: Date.now(),
      endsAt: endTime,
      isRunning: true,
      isCompleted: false,
    });
    
    // Timer-Notification planen
    await this.scheduleTimerNotification(timerId, recipeName, stepName, endTime, recipeId);
    
    return timerId;
  }
  
  /**
   * Timer-Notification planen
   */
  async scheduleTimerNotification(timerId, recipeName, stepName, endTime, recipeId) {
    const title = 'KochPlan - Timer';
    const body = `${recipeName}: ${stepName || 'Timer'} abgelaufen!`;
    
    // Versuche Notification Trigger API (experimentell)
    if ('showTrigger' in Notification.prototype) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: timerId,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: 'open-recipe', title: 'Rezept öffnen' },
            { action: 'dismiss', title: 'Schließen' },
          ],
          data: { recipeId, timerId },
          showTrigger: new TimestampTrigger(endTime),
        });
        return;
      } catch (error) {
        console.warn('[Notification] Trigger API failed, using fallback:', error);
      }
    }
    
    // Fallback: setTimeout (funktioniert nur wenn App läuft)
    const delay = endTime - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showTimerNotification(title, body, timerId, recipeId);
      }, delay);
    }
  }
  
  /**
   * Timer-Notification anzeigen
   */
  async showTimerNotification(title, body, timerId, recipeId) {
    // Sound abspielen
    this.playTimerSound();
    
    // Notification anzeigen
    await this.showNotification(title, {
      body,
      tag: timerId,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'open-recipe', title: 'Rezept öffnen' },
        { action: 'dismiss', title: 'Schließen' },
      ],
      data: { recipeId, timerId },
    });
    
    // Timer als abgeschlossen markieren
    const timer = await db.timers
      .where('name')
      .equals(body.split(':')[1]?.trim() || 'Koch-Timer')
      .first();
    
    if (timer) {
      await db.timers.update(timer.id, {
        isRunning: false,
        isCompleted: true,
      });
    }
  }
  
  /**
   * Timer-Sound abspielen
   */
  playTimerSound() {
    try {
      const audio = new Audio('/sounds/timer-complete.mp3');
      audio.volume = 0.7;
      audio.play().catch(err => {
        console.warn('[Notification] Could not play sound:', err);
      });
    } catch (error) {
      console.warn('[Notification] Audio not supported:', error);
    }
  }
  
  // ============================================
  // MEAL-PREP ERINNERUNGEN
  // ============================================
  
  /**
   * Meal-Prep Erinnerung planen
   */
  async scheduleMealPrepReminder(mealPlanId, date, mealType, recipeName) {
    const reminderTime = new Date(date);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 Stunde vorher
    
    if (reminderTime < new Date()) {
      console.warn('[Notification] Reminder time is in the past');
      return null;
    }
    
    const reminderId = `prep-${mealPlanId}`;
    
    // In IndexedDB speichern
    await db.settings.put({
      key: `reminder-${reminderId}`,
      value: {
        mealPlanId,
        recipeName,
        mealType,
        scheduledFor: reminderTime.getTime(),
      },
    });
    
    // Notification planen
    const mealTypeLabels = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen',
      dinner: 'Abendessen',
      snack: 'Snack',
    };
    
    const title = 'KochPlan - Meal Prep';
    const body = `Zeit für die Vorbereitung: ${recipeName} (${mealTypeLabels[mealType] || mealType})`;
    
    if ('showTrigger' in Notification.prototype) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: reminderId,
          requireInteraction: false,
          actions: [
            { action: 'open-recipe', title: 'Rezept ansehen' },
            { action: 'dismiss', title: 'OK' },
          ],
          data: { mealPlanId },
          showTrigger: new TimestampTrigger(reminderTime.getTime()),
        });
        return reminderId;
      } catch (error) {
        console.warn('[Notification] Trigger API failed:', error);
      }
    }
    
    // Fallback
    const delay = reminderTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, {
          body,
          tag: reminderId,
          actions: [
            { action: 'open-recipe', title: 'Rezept ansehen' },
            { action: 'dismiss', title: 'OK' },
          ],
          data: { mealPlanId },
        });
      }, delay);
    }
    
    return reminderId;
  }
  
  // ============================================
  // WOCHENPLAN-BENACHRICHTIGUNGEN
  // ============================================
  
  /**
   * Wöchentliche Planungserinnerung planen
   */
  async scheduleWeeklyPlanNotification() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(10, 0, 0, 0);
    
    const title = 'KochPlan - Wochenplanung';
    const body = 'Plane deine Mahlzeiten für die kommende Woche!';
    
    if ('showTrigger' in Notification.prototype) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'weekly-plan',
          requireInteraction: false,
          actions: [
            { action: 'open-plan', title: 'Zum Wochenplan' },
            { action: 'dismiss', title: 'Später' },
          ],
          showTrigger: new TimestampTrigger(nextSunday.getTime()),
        });
        return true;
      } catch (error) {
        console.warn('[Notification] Trigger API failed:', error);
      }
    }
    
    // Periodische Sync-Registrierung
    if ('periodicSync' in this.registration) {
      try {
        await this.registration.periodicSync.register('weekly-plan', {
          minInterval: 7 * 24 * 60 * 60 * 1000, // 7 Tage
        });
      } catch (error) {
        console.warn('[Notification] Periodic sync registration failed:', error);
      }
    }
    
    return false;
  }
  
  // ============================================
  // EINKAUFSLISTEN-ERINNERUNG
  // ============================================
  
  /**
   * Einkaufslisten-Erinnerung planen
   */
  async scheduleShoppingReminder(shoppingListId, listName, reminderTime) {
    const reminderId = `shopping-${shoppingListId}`;
    
    const title = 'KochPlan - Einkaufen';
    const body = `Vergiss nicht: ${listName}`;
    
    if ('showTrigger' in Notification.prototype) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: reminderId,
          requireInteraction: false,
          actions: [
            { action: 'open-list', title: 'Liste öffnen' },
            { action: 'dismiss', title: 'Erledigt' },
          ],
          data: { shoppingListId },
          showTrigger: new TimestampTrigger(reminderTime.getTime()),
        });
        return reminderId;
      } catch (error) {
        console.warn('[Notification] Trigger API failed:', error);
      }
    }
    
    // Fallback
    const delay = reminderTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.showNotification(title, {
          body,
          tag: reminderId,
          actions: [
            { action: 'open-list', title: 'Liste öffnen' },
            { action: 'dismiss', title: 'Erledigt' },
          ],
          data: { shoppingListId },
        });
      }, delay);
    }
    
    return reminderId;
  }
  
  // ============================================
  // BENACHRICHTIGUNGEN VERWALTEN
  // ============================================
  
  /**
   * Alle Benachrichtigungen schließen
   */
  async closeAllNotifications() {
    if (!this.registration) return;
    
    const notifications = await this.registration.getNotifications();
    notifications.forEach(notification => notification.close());
  }
  
  /**
   * Benachrichtigung nach Tag schließen
   */
  async closeNotification(tag) {
    if (!this.registration) return;
    
    const notifications = await this.registration.getNotifications({ tag });
    notifications.forEach(notification => notification.close());
  }
  
  /**
   * Aktive Benachrichtigungen abrufen
   */
  async getActiveNotifications() {
    if (!this.registration) return [];
    
    return this.registration.getNotifications();
  }
  
  // ============================================
  // PERIODIC SYNC
  // ============================================
  
  /**
   * Periodische Synchronisation registrieren
   */
  async registerPeriodicSync(tag, minInterval) {
    if (!('periodicSync' in this.registration)) {
      console.warn('[Notification] Periodic Sync not supported');
      return false;
    }
    
    try {
      await this.registration.periodicSync.register(tag, { minInterval });
      console.log(`[Notification] Periodic sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[Notification] Failed to register periodic sync:', error);
      return false;
    }
  }
  
  /**
   * Periodische Synchronisation abmelden
   */
  async unregisterPeriodicSync(tag) {
    if (!('periodicSync' in this.registration)) return;
    
    try {
      await this.registration.periodicSync.unregister(tag);
      console.log(`[Notification] Periodic sync unregistered: ${tag}`);
    } catch (error) {
      console.error('[Notification] Failed to unregister periodic sync:', error);
    }
  }
  
  // ============================================
  // HELPER
  // ============================================
  
  /**
   * Base64 zu Uint8Array konvertieren (für VAPID)
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Singleton-Instanz
export const notificationService = new NotificationService();

export default notificationService;
