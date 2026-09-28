const admin = require('firebase-admin');

// Remplacez par le chemin vers votre clé de service si nécessaire, 
// ou utilisez les credentials par défaut (marche si exécuté via firebase-tools ou avec Application Default Credentials)
const serviceAccount = require('./firebase-adminsdk.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log("Analyse de la collection 'signatures' en cours...");
  
  const signaturesRef = db.collection('signatures');
  const snapshot = await signaturesRef.get();
  
  const emailMap = new Map();
  let duplicates = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.email) return;
    
    const email = data.email.trim().toLowerCase();
    
    if (!emailMap.has(email)) {
      emailMap.set(email, [doc]);
    } else {
      emailMap.get(email).push(doc);
    }
  });

  for (const [email, docs] of emailMap.entries()) {
    if (docs.length > 1) {
      console.log(`\nDoublons trouvés pour l'email: ${email} (${docs.length} signatures)`);
      
      // Trier par date de création (le plus ancien en premier)
      docs.sort((a, b) => {
        const dateA = a.data().createdAt ? a.data().createdAt.toDate() : new Date(0);
        const dateB = b.data().createdAt ? b.data().createdAt.toDate() : new Date(0);
        return dateA - dateB;
      });

      // Le premier est l'original, les autres sont des doublons
      const original = docs[0];
      const copies = docs.slice(1);
      
      console.log(`  - Original conservé : ID = ${original.id}`);
      
      for (const copy of copies) {
        console.log(`  - Suppression du doublon : ID = ${copy.id}`);
        // await db.collection('signatures').doc(copy.id).delete();
        duplicates.push(copy);
      }
    }
  }

  console.log(`\nAnalyse terminée. ${duplicates.length} doublons trouvés au total.`);
  
  if (duplicates.length > 0) {
    console.log("Suppression des doublons en cours...");
    const batch = db.batch();
    duplicates.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log("Les doublons ont été supprimés avec succès !");
  } else {
    console.log("Aucun doublon à supprimer.");
  }
}

run().catch(console.error);
