const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.firebasestorage.app",
  messagingSenderId: "1006373112548",
  appId: "1:1006373112548:web:fe34fca6b0a96dd3003af1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ecole-db');

async function run() {
  console.log("Analyse des signatures de la base de données...");
  
  const snap = await getDocs(collection(db, "signatures"));
  
  const emailMap = new Map();
  let validSignatures = [];
  
  snap.forEach(d => {
    const data = d.data();
    if (!data.email) return;
    const email = data.email.toLowerCase().trim();
    if (!emailMap.has(email)) {
      emailMap.set(email, []);
    }
    emailMap.get(email).push({ id: d.id, ...data });
  });

  let duplicateCount = 0;
  for (const [email, docs] of emailMap.entries()) {
    if (docs.length > 1) {
      console.log(`\nDoublon détecté pour: ${email}`);
      docs.forEach(d => console.log(` - ID: ${d.id}, Date: ${d.createdAt?.toDate?.()}`));
      duplicateCount += (docs.length - 1);
    }
    // We sort docs to get the most recent ones just for the "recent" array, 
    // but here we just take the first one (oldest) as valid for our count
    validSignatures.push(docs[0]);
  }

  console.log(`\nBilan:`);
  console.log(`Total de documents 'signatures' actuels : ${snap.size}`);
  console.log(`Nombre de signatures réelles uniques : ${validSignatures.length}`);
  console.log(`Doublons persistants nécessitant suppression : ${duplicateCount}`);

  // Calcul du nouveau tableau 'recent'
  validSignatures.sort((a, b) => {
    const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
    return timeB - timeA; // Plus récent en premier
  });
  
  const recentNames = validSignatures.slice(0, 10).map(s => {
    const prenom = s.prenom || "Anonyme";
    const nom = s.nom || "";
    const qualite = s.qualite ? ` (${s.qualite})` : "";
    const initiale = nom ? nom.charAt(0).toUpperCase() + "." : "";
    return `${prenom} ${initiale}${qualite}`.trim();
  });

  console.log("\nMise à jour de stats/petition...");
  try {
    await setDoc(doc(db, "stats", "petition"), {
      count: validSignatures.length,
      recent: recentNames,
      updatedAt: new Date()
    }, { merge: true });
    console.log("Compteur stats/petition mis à jour avec le nombre exact !");
  } catch (err) {
    console.error("Erreur lors de la mise à jour:", err);
  }

  if (duplicateCount > 0) {
    console.log("\n⚠️ Il vous reste des doublons à supprimer manuellement dans l'interface Firebase (collection 'signatures'), car je n'ai pas les droits d'administration pour les supprimer.");
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
