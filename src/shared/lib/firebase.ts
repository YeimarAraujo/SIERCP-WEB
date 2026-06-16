import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    initializeFirestore,
    type Firestore,
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Force long-polling for the Firestore transport. The default WebChannel
// (gRPC-over-WebSocket) stream corrupts its internal target state under
// Next.js dev (StrictMode double-mount + hot-reload), throwing
// "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9 / b815)".
// initializeFirestore throws if Firestore was already initialized for this
// app (hot reload), so fall back to getFirestore in that case.
function createDb(): Firestore {
    try {
        return initializeFirestore(app, {
            experimentalForceLongPolling: true,
        });
    } catch {
        return getFirestore(app);
    }
}
const db = createDb();
const rtdb = getDatabase(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Secondary app used to create Firebase Auth users without switching the
// admin's primary session (createUserWithEmailAndPassword switches currentUser).
export function getSecondaryAuth() {
    if (typeof window === 'undefined') return null;
    const existing = getApps().find((a) => a.name === 'secondary');
    const secondaryApp = existing ?? initializeApp(firebaseConfig, 'secondary');
    return getAuth(secondaryApp);
}

export { app, auth, db, rtdb, storage, functions };
export default app;