import admin from 'firebase-admin';

if (!admin.apps.length) {
    const key = process.env.FIREBASE_ADMIN_KEY;

    if (!key) throw new Error('FIREBASE_ADMIN_KEY no está definida en .env.local');

    const serviceAccount = JSON.parse(key);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();