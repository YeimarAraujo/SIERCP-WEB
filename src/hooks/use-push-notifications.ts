'use client';

import { useEffect, useCallback, useRef } from 'react';
import { NotificationService, showLocalNotification } from '@/lib/notification-service';
import { useAuthStore } from '@/stores/auth-store';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppPromptState {
    deferredPrompt: BeforeInstallPromptEvent | null;
    showAppBanner: boolean;
    dismissed: boolean;
    installAttempted: boolean;
}

interface AppPromptActions {
    setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void;
    showBanner: () => void;
    dismissBanner: () => void;
    markInstallAttempted: () => void;
    reset: () => void;
}

type BeforeInstallPromptEvent = Event & {
    platforms: string[];
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt: () => Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export const useAppBannerStore = create<AppPromptState & AppPromptActions>()(
    persist(
        (set) => ({
            deferredPrompt: null,
            showAppBanner: false,
            dismissed: false,
            installAttempted: false,

            setDeferredPrompt: (event) => set({ deferredPrompt: event }),

            showBanner: () => set({ showAppBanner: true }),

            dismissBanner: () => set({ dismissed: true, showAppBanner: false }),

            markInstallAttempted: () => set({ installAttempted: true, showAppBanner: false }),

            reset: () => set({
                deferredPrompt: null,
                showAppBanner: false,
                dismissed: false,
                installAttempted: false,
            }),
        }),
        {
            name: 'siercp-app-banner',
            partialize: (state) => ({ dismissed: state.dismissed }),
        }
    )
);

export async function setupAppBanner(): Promise<() => void> {
    if (typeof window === 'undefined') return () => {};

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        useAppBannerStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
        useAppBannerStore.getState().showBanner();
    };

    const handleAppInstalled = () => {
        useAppBannerStore.getState().reset();
        const userId = useAuthStore.getState().user?.uid;
        if (userId) {
            NotificationService.markAppInstalled(userId);
        }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
    };
}

export async function installApp(): Promise<boolean> {
    const { deferredPrompt } = useAppBannerStore.getState();
    
    if (!deferredPrompt) {
        console.warn('No deferred prompt available');
        return false;
    }

    try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        useAppBannerStore.getState().markInstallAttempted();
        
        return outcome === 'accepted';
    } catch (error) {
        console.error('Error installing app:', error);
        return false;
    }
}

export function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as { standalone?: boolean }).standalone === true;
}

export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function usePushNotifications() {
    const user = useAuthStore((state) => state.user);
    const permission = NotificationService.getPermissionStatus();
    const supported = NotificationService.isSupported();
    const tokenRef = useRef<string | null>(null);

    const requestPermission = useCallback(async (): Promise<string | null> => {
        if (!user?.uid) {
            console.warn('No user logged in, cannot save FCM token');
            return null;
        }

        const token = await NotificationService.requestPermission();
        if (token) {
            tokenRef.current = token;
            await NotificationService.saveTokenToFirestore(user.uid, token);
        }
        return token;
    }, [user?.uid]);

    useEffect(() => {
        if (permission !== 'granted' || !user?.uid) return;

        let isMounted = true;

        const setupNotifications = async () => {
            const token = await NotificationService.requestPermission();
            if (token && isMounted) {
                tokenRef.current = token;
                await NotificationService.saveTokenToFirestore(user.uid, token);
            }

            const unsubscribe = NotificationService.onForegroundMessage((payload) => {
                const { title, body, imageUrl } = payload.notification || {};
                if (title) {
                    showLocalNotification(title, { body, icon: imageUrl });
                }
            });

            return unsubscribe;
        };

        let cleanupFn: (() => void) | undefined;

        setupNotifications().then((cleanup) => {
            cleanupFn = cleanup;
        });

        return () => {
            isMounted = false;
            cleanupFn?.();
        };
    }, [user?.uid, permission]);

    return {
        permission,
        supported,
        token: tokenRef.current,
        requestPermission,
    };
}

export function useAppBanner() {
    const { showAppBanner, dismissed, installAttempted } = useAppBannerStore();
    const mobile = isMobileDevice();
    const standalone = isStandalone();

    useEffect(() => {
        if (standalone || installAttempted) return;
        const cleanupPromise = setupAppBanner();
        
        return () => {
            cleanupPromise.then((cleanup) => cleanup());
        };
    }, [standalone, installAttempted]);

    const shouldShow = showAppBanner && !dismissed && !standalone;

    const dismiss = useCallback(() => {
        useAppBannerStore.getState().dismissBanner();
    }, []);

    const install = useCallback(async () => {
        const success = await installApp();
        return success;
    }, []);

    return {
        shouldShow,
        isMobile: mobile,
        isStandalone: standalone,
        dismiss,
        install,
    };
}