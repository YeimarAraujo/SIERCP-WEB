import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from '../src/lib/firebase-config';

const app = initializeApp(config);
const db = getFirestore(app);

const code = process.argv[2];
const name = process.argv[3];

if (!code || !name) {
    console.log('Usage: ts-node add-institution.ts <code> <name>');
    process.exit(1);
}

async function addInstitution() {
    try {
        await setDoc(doc(db, 'institutions', code), {
            name,
            createdAt: serverTimestamp(),
        });
        console.log(`Institution ${name} with code ${code} created successfully!`);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

addInstitution();
