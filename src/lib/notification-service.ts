import { getToken, onMessage, type Messaging } from 'firebase/messaging';
import { getMessaging } from 'firebase/messaging';
import { app } from './firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserModel } from '@/models/user';

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
    if (typeof window === 'undefined') return null;
    
    if (!messagingInstance) {
        try {
            messagingInstance = getMessaging(app);
        } catch {
            console.warn('Firebase Messaging not available');
            return null;
        }
    }
    return messagingInstance;
}

export const NotificationService = {
    async requestPermission(): Promise<string | null> {
        const messaging = getMessagingInstance();
        if (!messaging) return null;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return null;
            }

            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.warn('VAPID key not configured');
                return null;
            }

            const token = await getToken(messaging, { vapidKey });
            if (token) {
                console.log('FCM token obtained:', token.substring(0, 20) + '...');
                return token;
            }
            return null;
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    },

    onForegroundMessage(callback: (payload: { notification?: { title?: string; body?: string; imageUrl?: string }; data?: Record<string, string> }) => void): () => void {
        const messaging = getMessagingInstance();
        if (!messaging) return () => {};

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            callback(payload as { notification?: { title?: string; body?: string; imageUrl?: string }; data?: Record<string, string> });
        });

        return unsubscribe;
    },

    async saveTokenToFirestore(userId: string, token: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                fcmTokensUpdatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    },

    async markAppInstalled(userId: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                appInstalled: true,
            });
        } catch (error) {
            console.error('Error marking app as installed:', error);
        }
    },

    isSupported(): boolean {
        return typeof window !== 'undefined' && 
               'Notification' in window && 
               'serviceWorker' in navigator;
    },

    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    },
};

export function showLocalNotification(title: string, options?: NotificationOptions): void {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/images/logov3.png',
            badge: '/images/logov3.png',
            ...options,
        });
    }
}

export type { UserModel };