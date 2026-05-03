const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Read .env.local values
const fs = require('fs');
const envContent = fs.readFileSync('C:/siercp-web/.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
});

const firebaseConfig = {
    apiKey: envVars['NEXT_PUBLIC_FIREBASE_API_KEY'],
    authDomain: envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
    projectId: envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
    storageBucket: envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
    appId: envVars['NEXT_PUBLIC_FIREBASE_APP_ID'],
    databaseURL: envVars['NEXT_PUBLIC_FIREBASE_DATABASE_URL'],
};

console.log('Using project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const code = process.argv[2];
const name = process.argv[3];

if (!code || !name) {
    console.log('Usage: node scripts/add-institution-simple.js <code> <name>');
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
