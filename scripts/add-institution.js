const { initializeApp, getApp } = require('firebase/app');
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
    console.log('Usage: node scripts/add-institution.js <code> <name>');
    process.exit(1);
}

async function addInstitution() {
    try {
        await setDoc(doc(db, 'institutions', code), {
            name,
            createdAt: serverTimestamp(),
        });
        console.log(`✅ Institution "${name}" with code "${code}" created successfully!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

addInstitution();
