/**
 * Firebase Admin SDK — initialisation côté serveur (Server Components uniquement).
 * Utilise la clé de service stockée dans secrets/ (non versionnée).
 *
 * [SPEC-OG-01] Nécessaire pour generateMetadata() dans les routes d'articles.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./secrets/firebase-service-account.json";
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = initializeApp({ 
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } else {
      const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
      if (fs.existsSync(absolutePath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
        app = initializeApp({ 
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
      } else {
        // Fallback ultime (ex: Cloud Run / App Hosting via ADC)
        app = initializeApp({
          projectId: "collectif-ecole-km" // Hardcodé pour éviter l'erreur NOT_FOUND si l'ADC ne trouve pas le bon projet
        });
      }
    }
  } catch (error) {
    console.warn("Erreur lors de l'initialisation de firebase-admin, fallback sur ADC:", error);
    app = initializeApp({ projectId: "collectif-ecole-km" });
  }

  return app;
}

export const adminApp = getAdminApp();
// IMPORTANT: Le projet utilise une base de données nommée "ecole-db", pas la "(default)"
export const adminDb = getFirestore(adminApp, 'ecole-db');
export const adminAuth = getAuth(adminApp);

