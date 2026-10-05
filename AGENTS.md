# RÈGLES DE DÉVELOPPEMENT (AGENT.md)

Ce document définit les standards stricts à respecter pour toute intervention sur le projet.

## 1. Accessibilité (a11y) stricte

- Tout élément interactif doit être accessible au clavier.
- Les balises ARIA (aria-hidden, aria-label, aria-describedby) doivent être utilisées de manière appropriée.
- Les contrastes de couleurs doivent respecter les normes WCAG AA minimum.

## 2. Spécifications et Traçabilité (spec-id)

- Chaque règle métier ou implémentation technique doit être documentée avec un identifiant unique (ex: `[SPEC-AUTH-01]`).
- Les commentaires dans le code et les tests doivent référencer ces `spec-id`.

## 3. Tests Unitaires

- Tout composant, fonction utilitaire ou logique métier complexe doit être couvert par des tests unitaires (ex: Jest / React Testing Library / Vitest).
- Les tests unitaires doivent cibler spécifiquement les comportements définis par les `spec-id`.

## 4. Tests End-to-End (E2E)

- Les parcours critiques doivent être couverts par des tests E2E (ex: Playwright / Cypress).
- Les tests E2E doivent impérativement correspondre et référencer les `spec-id` testés.

## 5. Fichiers Temporaires et Scripts "One-Off"

- **Règle absolue : Ne JAMAIS créer de fichiers temporaires (ex: `fix_*.js`, `test.json`, etc.) à la racine du projet ou dans les dossiers versionnés par Git.**
- Toute "tambouille", script utilitaire d'exécution unique, ou fichier de log généré par l'agent doit impérativement être créé dans un répertoire non versionné (idéalement le dossier `.gemini/antigravity/brain/<id>/scratch/` dédié à l'agent, ou a minima un dossier ignoré par `.gitignore`). Il ne faut pas polluer le dépôt Git de l'utilisateur.

## 6. Workflow de validation

- **Règle absolue : Toujours tester localement avant de push.**
- Aucun commit ne doit être effectué sans s'assurer que le code compile, que les tests passent et que le comportement attendu est validé en environnement de développement.

## 7. Bonnes Pratiques Firebase & Firestore

- **Contraintes d'Unicité :** Firestore n'a pas de contrainte d'unicité native sur les champs. Pour forcer l'unicité (ex: un seul vote par email, un seul compte par email), il FAUT utiliser la valeur unique comme ID du document (Document ID = email), ou utiliser une transaction côté serveur (Cloud Functions) avec un document de "réservation" (lock).
- **Synchronisation des Statistiques & Compteurs :** Le client (navigateur) NE DOIT JAMAIS calculer et écraser des données statistiques globales (risque élevé de désynchronisation et de "race conditions"). Les agrégations (ex: nombre de signatures, calcul des totaux) doivent impérativement être déportées sur des **Cloud Functions** (`onDocumentWritten`, `onDocumentCreated`) ou utiliser `FieldValue.increment()`.
- **Transactions :** Pour toute mise à jour dépendant d'un état précédent, utiliser des transactions Firestore (`runTransaction`) côté client ou backend pour garantir l'atomicité.
- **Sécurité Infaillible (`firestore.rules`) :**
  - **Principe du moindre privilège :** Par défaut, tout doit être bloqué (`match /{document=**} { allow read, write: if false; }`).
  - **Droits Administrateur :** Utiliser une fonction robuste `isAdmin()` basée sur la vérification stricte de l'email via le token d'authentification (`request.auth.token.email`).
  - **Vérification d'Identité :** Un utilisateur ne peut créer/modifier un document le concernant QUE SI l'email soumis correspond à son token d'authentification (`request.resource.data.email == request.auth.token.email`).
  - Ne jamais se fier aux données envoyées par le client sans validation rigoureuse des champs dans les règles.
