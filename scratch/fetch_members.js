const admin = require('../functions/node_modules/firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function getMembers() {
  try {
    const snapshot = await db.collection('membres').get();
    const emails = [];
    snapshot.forEach(doc => {
      emails.push({ id: doc.id, ...doc.data() });
    });
    console.log(JSON.stringify(emails, null, 2));
  } catch(e) {
    console.error("ERROR:", e.message);
  }
}
getMembers();
