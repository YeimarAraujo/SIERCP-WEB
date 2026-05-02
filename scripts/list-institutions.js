const { initializeApp, getApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app;
try {
    app = getApp();
} catch (e) {
    app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

async function listInstitutions() {
    try {
        const snap = await getDocs(collection(db, 'institutions'));
        if (snap.empty) {
            console.log('No institutions found');
        } else {
            console.log('📋 Existing institutions:');
            snap.docs.forEach(doc => {
                console.log(`  Code: "${doc.id}" | Name: "${doc.data().name}"`);
            });
        }
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

listInstitutions();
