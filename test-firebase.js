const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  projectId: "collectif-ecole-km",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Starting addDoc...");
  try {
    const docRef = await addDoc(collection(db, "membres"), {
      prenom: "Test",
      nom: "Local",
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
