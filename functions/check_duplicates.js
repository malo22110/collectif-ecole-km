const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with default project
initializeApp({
  projectId: 'collectif-ecole-km'
});

const db = getFirestore('ecole-db');

async function analyzeMembres() {
  console.log("Analyzing 'membres' collection in ecole-db...");
  try {
    const snapshot = await db.collection('membres').get();
    console.log(`Total documents in 'membres': ${snapshot.size}`);

    const emailMap = new Map();
    const duplicates = [];
    const membersList = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const rawEmail = data.email || '';
      const cleanEmail = rawEmail.trim().toLowerCase();

      membersList.push({
        id: doc.id,
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        cleanEmail,
        status: data.status,
        dateInscription: data.dateInscription
      });

      if (!cleanEmail) {
        console.warn(`[WARN] Document ${doc.id} has no email!`, data);
        return;
      }

      if (emailMap.has(cleanEmail)) {
        emailMap.get(cleanEmail).push({ id: doc.id, ...data });
        duplicates.push(cleanEmail);
      } else {
        emailMap.set(cleanEmail, [{ id: doc.id, ...data }]);
      }
    });

    console.log("\n--- MEMBER SUMMARY ---");
    console.log(`Unique emails: ${emailMap.size}`);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️ FOUND ${duplicates.length} DUPLICATE EMAIL(S):`);
      duplicates.forEach(email => {
        console.log(`\nEmail: ${email}`);
        emailMap.get(email).forEach(m => {
          console.log(`  - Doc ID: ${m.id} | Name: ${m.prenom} ${m.nom} | Status: ${m.status} | Date: ${m.dateInscription}`);
        });
      });
    } else {
      console.log("\n✅ No duplicate emails found in 'membres'!");
    }

    // Also check signatures collection for comparison
    const sigSnap = await db.collection('signatures').get();
    console.log(`\nTotal documents in 'signatures': ${sigSnap.size}`);

  } catch (err) {
    console.error("Error analyzing DB:", err);
  }
}

analyzeMembres();
