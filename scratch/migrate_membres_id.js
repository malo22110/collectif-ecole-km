import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = { projectId: 'ecole-kergrist' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  const snap = await getDocs(collection(db, "membres"));
  let migrated = 0;
  
  for (const d of snap.docs) {
    if (!d.id.includes('@')) { // It's an auto-generated ID
      const data = d.data();
      const email = data.email.trim().toLowerCase();
      
      console.log(`Migrating ${d.id} -> ${email}`);
      await setDoc(doc(db, "membres", email), data);
      await deleteDoc(doc(db, "membres", d.id));
      migrated++;
    }
  }
  console.log(`Migrated ${migrated} members.`);
}

migrate().catch(console.error);
