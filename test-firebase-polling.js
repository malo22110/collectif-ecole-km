const { initializeApp } = require('firebase/app');
const { initializeFirestore } = require('firebase/firestore');
const { collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  projectId: "collectif-ecole-km",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function test() {
  console.log("Starting addDoc with Long Polling...");
  try {
    const docRef = await addDoc(collection(db, "membres"), {
      prenom: "Test",
      nom: "Polling",
      email: "test@test.com",
      dateInscription: new Date().toISOString(),
      status: "pending"
    });
    console.log("Success! ID:", docRef.id);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

test();
