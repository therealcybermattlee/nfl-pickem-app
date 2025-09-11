/**
 * PWA Helper Functions
 * Handles PWA installation, updates, and offline capabilities
 */

import { Workbox } from 'workbox-window';
import React from 'react';

export interface PWAInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAHelper {
  private wb: Workbox | null = null;
  private deferredPrompt: PWAInstallEvent | null = null;
  private updateAvailable = false;
  private updateCallbacks: ((updateAvailable: boolean) => void)[] = [];

  constructor() {
    this.initServiceWorker();
    this.setupInstallPrompt();
  }

  private initServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      this.wb = new Workbox('/sw.js');

      // Listen for service worker updates
      this.wb.addEventListener('waiting', () => {
        this.updateAvailable = true;
        this.notifyUpdateCallbacks();
      });

      // Handle offline/online status
      this.wb.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          // Service worker has been updated, reload the page
          window.location.reload();
        }
      });

      // Register the service worker
      this.wb.register().catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e as PWAInstallEvent;
    });
  }

  private notifyUpdateCallbacks() {
    this.updateCallbacks.forEach((callback) => callback(this.updateAvailable));
  }

  /**
   * Check if the app can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Check if the app is already installed
   */
  isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true
    );
  }

  /**
   * Prompt user to install the app
   */
  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    // Show the prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    // Clear the deferredPrompt
    this.deferredPrompt = null;

    return outcome;
  }

  /**
   * Check if there's an update available
   */
  hasUpdate(): boolean {
    return this.updateAvailable;
  }

  /**
   * Apply the available update
   */
  applyUpdate(): void {
    if (this.wb && this.updateAvailable) {
      this.wb.messageSkipWaiting();
    }
  }

  /**
   * Register a callback for update notifications
   */
  onUpdateAvailable(callback: (updateAvailable: boolean) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Check if the app is currently offline
   */
  isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get the current network status
   */
  getNetworkStatus(): 'online' | 'offline' | 'slow' {
    if (!navigator.onLine) return 'offline';
    
    // @ts-ignore - Connection API is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      if (slowConnections.includes(connection.effectiveType)) {
        return 'slow';
      }
    }
    
    return 'online';
  }

  /**
   * Cache critical game data for offline use
   */
  async cacheGameData(gameData: any[]): Promise<boolean> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('game-data-v1');
        const response = new Response(JSON.stringify(gameData), {
          headers: { 'content-type': 'application/json' },
        });
        await cache.put('/api/games/offline', response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cache game data:', error);
      return false;
    }
  }

  /**
   * Get cached game data when offline
   */
  async getCachedGameData(): Promise<any[] | null> {
    try {
      if ('caches' in window) {
        const cache = await caches.open('game-data-v1');
        const response = await cache.match('/api/games/offline');
        if (response) {
          return await response.json();
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached game data:', error);
      return null;
    }
  }

  /**
   * Queue pick submission for when back online
   */
  async queuePickSubmission(pickData: any): Promise<boolean> {
    try {
      const queueKey = 'pick-submission-queue';
      const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      const newQueue = [...existingQueue, { ...pickData, timestamp: Date.now() }];
      localStorage.setItem(queueKey, JSON.stringify(newQueue));
      return true;
    } catch (error) {
      console.error('Failed to queue pick submission:', error);
      return false;
    }
  }

  /**
   * Process queued pick submissions when back online
   */
  async processQueuedPicks(): Promise<void> {
    try {
      const queueKey = 'pick-submission-queue';
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      
      if (queue.length === 0) return;

      // Process each queued pick
      for (const pick of queue) {
        try {
          const response = await fetch('/api/picks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(pick),
          });

          if (response.ok) {
            console.log('Successfully synced queued pick:', pick);
          } else {
            console.error('Failed to sync pick:', pick);
          }
        } catch (error) {
          console.error('Error syncing pick:', error);
        }
      }

      // Clear the queue
      localStorage.removeItem(queueKey);
    } catch (error) {
      console.error('Failed to process queued picks:', error);
    }
  }

  /**
   * Setup offline/online event listeners
   */
  setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is back online');
      this.processQueuedPicks();
    });

    window.addEventListener('offline', () => {
      console.log('App is now offline');
    });
  }

  /**
   * Show notification if supported
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
        return true;
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }
    return false;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

// Create singleton instance
export const pwaHelper = new PWAHelper();

// Utility functions for React components
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState(pwaHelper.getNetworkStatus());

  React.useEffect(() => {
    const updateStatus = () => setStatus(pwaHelper.getNetworkStatus());
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return status;
};

export default pwaHelper;