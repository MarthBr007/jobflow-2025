// PWA utilities for JobFlow
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: ReadonlyArray<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

// PWA Installation Hook
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
            }
        };

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        checkInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return false;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstallable(false);
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to install app:', error);
            return false;
        }
    };

    return {
        isInstallable,
        isInstalled,
        installApp,
    };
}

// Offline Detection Hook
export function useOfflineDetection() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

// Push Notifications
export class PushNotificationManager {
    private static instance: PushNotificationManager;
    private registration: ServiceWorkerRegistration | null = null;

    private constructor() {
        this.initializeServiceWorker();
    }

    static getInstance(): PushNotificationManager {
        if (!PushNotificationManager.instance) {
            PushNotificationManager.instance = new PushNotificationManager();
        }
        return PushNotificationManager.instance;
    }

    private async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered');
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    async subscribeToPush(): Promise<PushSubscription | null> {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return null;
        }

        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            // Send subscription to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });

            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return null;
        }
    }

    async sendNotification(title: string, options?: NotificationOptions) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge.png',
                ...options,
            });
        }
    }
}

// Offline Storage for Time Tracking
export class OfflineTimeTracker {
    private static readonly STORAGE_KEY = 'jobflow_offline_entries';

    static saveEntry(entry: {
        id: string;
        action: 'START' | 'END' | 'BREAK_START' | 'BREAK_END';
        timestamp: string;
        projectId?: string;
        userId: string;
    }) {
        const existingEntries = this.getEntries();
        existingEntries.push(entry);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingEntries));
    }

    static getEntries() {
        const entries = localStorage.getItem(this.STORAGE_KEY);
        return entries ? JSON.parse(entries) : [];
    }

    static clearEntries() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    static async syncEntries() {
        const entries = this.getEntries();
        if (entries.length === 0) return;

        try {
            const response = await fetch('/api/time-tracking/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries }),
            });

            if (response.ok) {
                this.clearEntries();
                console.log('✅ Offline entries synced successfully');
            }
        } catch (error) {
            console.error('❌ Failed to sync offline entries:', error);
        }
    }
}

// Background Sync Hook
export function useBackgroundSync() {
    const isOnline = useOfflineDetection();

    useEffect(() => {
        if (isOnline) {
            // Sync offline data when coming back online
            OfflineTimeTracker.syncEntries();
        }
    }, [isOnline]);

    return { isOnline };
}

// Geolocation for Location-based Clock In/Out
export function useGeolocation() {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        accuracy: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
                setLoading(false);
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
            }
        );
    };

    return {
        location,
        error,
        loading,
        getCurrentLocation,
    };
}

// Quick actions for PWA shortcuts
export const pwaQuickActions = {
    startTimeTracking: () => {
        window.location.href = '/dashboard/time-tracking?action=start';
    },

    viewProjects: () => {
        window.location.href = '/dashboard/projects';
    },

    openChat: () => {
        window.location.href = '/dashboard/chat';
    },
};

export default PushNotificationManager; 