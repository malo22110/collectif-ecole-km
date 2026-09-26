import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Ces informations se trouvent dans Firebase Console > Paramètres du projet (Roue crantée) > Général > Vos applications
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
