const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Use the same config as your app
const firebaseConfig = {
    apiKey: "AIzaSyDuNfQy-lhnKo_0-VjwxAMaXEiwGOEog6E",
    authDomain: "siercp.firebaseapp.com",
    projectId: "siercp",
    storageBucket: "siercp.firebasestorage.app",
    messagingSenderId: "153485090858",
    appId: "1:153485090858:web:1ef9810ca0e4a2d3aba353",
    databaseURL: "https://siercp-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
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
