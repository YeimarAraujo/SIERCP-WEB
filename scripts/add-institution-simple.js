// Quick script to add an institution to Firestore
// Run with: node scripts/add-institution-simple.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const code = process.argv[2];
const name = process.argv[3];

if (!code || !name) {
    console.log('Usage: node scripts/add-institution-simple.js <code> <name>');
    console.log('Example: node scripts/add-institution-simple.js UPC-VALLEDUPAR "Universidad Popular del Cesar"');
    process.exit(1);
}

async function add() {
    try {
        await setDoc(doc(db, 'institutions', code), {
            name,
            createdAt: serverTimestamp(),
        });
        console.log(`✅ Institution "${name}" with code "${code}" created!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

add();
