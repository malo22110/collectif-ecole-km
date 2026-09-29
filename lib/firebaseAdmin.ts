/**
 * Firebase Admin SDK — initialisation côté serveur (Server Components uniquement).
 * Utilise la clé de service stockée dans secrets/ (non versionnée).
 *
 * [SPEC-OG-01] Nécessaire pour generateMetadata() dans les routes d'articles.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    throw new Error(
      "Firebase Admin SDK : aucune clé de service configurée.\n" +
      "Définissez FIREBASE_SERVICE_ACCOUNT_JSON ou FIREBASE_SERVICE_ACCOUNT_PATH dans .env.local"
    );
  }

  return app;
}

export const adminDb = getFirestore(getAdminApp());
