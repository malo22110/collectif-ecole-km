import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = { projectId: 'ecole-kergrist' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = ['membres', 'signatures', 'commentaires', 'articles', 'presse', 'faqs', 'stats', 'mailOutbox'];

async function backup() {
  const exportData = {};
  for (const colName of collections) {
    console.log(`Backing up ${colName}...`);
    try {
      const snap = await getDocs(collection(db, colName));
      exportData[colName] = {};
      snap.forEach(doc => {
        exportData[colName][doc.id] = doc.data();
      });
      console.log(` -> ${snap.size} documents backed up.`);
    } catch (e) {
      console.error(` -> Error backing up ${colName}:`, e.message);
    }
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `scratch/backup_${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ Backup successfully saved to ${filename}`);
}

backup().catch(console.error);
