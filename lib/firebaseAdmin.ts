/**
 * Firebase Admin SDK — initialisation côté serveur (Server Components uniquement).
 * Utilise la clé de service stockée dans secrets/ (non versionnée).
 *
 * [SPEC-OG-01] Nécessaire pour generateMetadata() dans les routes d'articles.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Option A : JSON inline via variable d'environnement (recommandé pour la prod/CI)
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else if (serviceAccountPath) {
    // Option B : chemin vers le fichier JSON local (développement)
    // Utilisation de fs pour éviter le "require() dynamique" qui fait crasher Webpack
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Option C : Fallback sur les credentials par défaut (ADC)
    // C'est ce qui sera utilisé en production sur Firebase App Hosting / Cloud Run
    app = initializeApp();
  }

  return app;
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = require("firebase-admin/auth").getAuth(adminApp);

