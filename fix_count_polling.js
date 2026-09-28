const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, initializeFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.firebasestorage.app",
  messagingSenderId: "1006373112548",
  appId: "1:1006373112548:web:fe34fca6b0a96dd3003af1",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, 'ecole-db');

async function run() {
  console.log("Analyse des signatures avec Long Polling...");
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
  let normalizedCount = 0;
  for (const [email, docs] of emailMap.entries()) {
    if (docs.length > 1) {
      console.log(`\nDoublon détecté pour: ${email}`);
      docs.forEach(d => console.log(` - ID: ${d.id}`));
      duplicateCount += (docs.length - 1);
    }
    const signature = docs[0];
    
    // Normalisation de la ville
    const oldVille = signature.ville || "";
    if (oldVille.toLowerCase().includes("kergrist") && oldVille !== "Kergrist-Moëlou") {
      signature.ville = "Kergrist-Moëlou";
      normalizedCount++;
      // Update in database!
      try {
        await setDoc(doc(db, "signatures", signature.id), { ville: "Kergrist-Moëlou" }, { merge: true });
        console.log(`Normalisé: "${oldVille}" -> "Kergrist-Moëlou" pour ${signature.id}`);
      } catch(err) {
        console.error(`Erreur de normalisation pour ${signature.id}:`, err);
      }
    }
    
    validSignatures.push(signature);
  }

  console.log(`\nBilan:`);
  console.log(`Total de documents 'signatures' actuels : ${snap.size}`);
  console.log(`Nombre de signatures réelles uniques : ${validSignatures.length}`);
  console.log(`Nombre de villes normalisées vers Kergrist-Moëlou : ${normalizedCount}`);

  // Calcul du nouveau tableau 'recent'
  validSignatures.sort((a, b) => {
    const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
    const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
    return timeB - timeA;
  });
  
  const recentNames = validSignatures.slice(0, 10).map(s => {
    const prenom = s.prenom || "Anonyme";
    const nom = s.nom || "";
    const qualite = s.qualite ? ` (${s.qualite})` : "";
    const initiale = nom ? nom.charAt(0).toUpperCase() + "." : "";
    return `${prenom} ${initiale}${qualite}`.trim();
  });

  // Calcul des statistiques
  let habitantsKergrist = 0;
  let parentsEleves = 0;
  let communesVoisines = 0;
  let autres = 0;

  validSignatures.forEach(s => {
    const q = (s.qualite || "").toLowerCase();
    const v = (s.ville || "").toLowerCase();
    
    // Habitant de Kergrist (par qualité ou ville)
    if (q.includes("habitant(e) de kergrist") || v.includes("kergrist")) {
      habitantsKergrist++;
    } 
    // Parent d'élève
    else if (q.includes("parent")) {
      parentsEleves++;
    }
    // Commune voisine (par qualité ou autre commune)
    else if (q.includes("voisine") || (v && !v.includes("kergrist"))) {
      communesVoisines++;
    } 
    else {
      autres++;
    }
  });

  const breakdown = {
    habitantsKergrist,
    parentsEleves,
    communesVoisines,
    autres
  };

  console.log("\nMise à jour de stats/petition avec breakdown...");
  console.log(breakdown);
  
  try {
    await setDoc(doc(db, "stats", "petition"), {
      count: validSignatures.length,
      recent: recentNames,
      breakdown,
      updatedAt: new Date()
    }, { merge: true });
    console.log("Compteur stats/petition mis à jour avec le nombre exact et les stats !");
  } catch (err) {
    console.error("Erreur lors de la mise à jour:", err);
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
