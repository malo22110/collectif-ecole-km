import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Ces informations se trouvent dans Firebase Console > Paramètres du projet (Roue crantée) > Général > Vos applications
const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.firebasestorage.app",
  messagingSenderId: "1006373112548",
  appId: "1:1006373112548:web:fe34fca6b0a96dd3003af1",
  measurementId: "G-HTX7EN9MVE",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
