# Runtime Node.js

[SPEC-RUNTIME-NODE-01] La version Node.js du site Next.js et d'App Hosting est fixée dans `.nvmrc` à `24.22.1` LTS. La contrainte `engines.node` du site exige une version `>=24.22.1 <25`, pour éviter les versions 24 affectées par les avis de sécurité d'octobre 2026.

Les Cloud Functions conservent `engines.node: "22"`, format de runtime attendu par Firebase. Leur version locale est définie séparément dans `functions/.nvmrc` à `22.23.4`. Cloud Functions déploie le runtime géré `nodejs22` ; vérifier que les mises à jour de sécurité de l'image d'exécution sont activées dans Google Cloud et que les fonctions ont été redéployées après le correctif. Le `package-lock.json` Functions conserve la même déclaration majeure.

Firebase App Hosting doit être configuré sur le runtime `nodejs24` avec les mises à jour automatiques d'images de base activées. La configuration du backend App Hosting est définie dans la console Firebase, pas par `runConfig` d'`apphosting.yaml`. Vérifier le runtime sélectionné dans Paramètres du backend avant un déploiement ; le build échouera intentionnellement avec Node 22 ou une version antérieure à 24.22.1.

## Mise à jour locale

Avec nvm, depuis la racine du dépôt :

```sh
nvm install
nvm use
node --version
```

Résultat attendu à la racine : `v24.22.1` ou un patch 24 ultérieur. Dans `functions/`, `nvm use` sélectionne `v22.23.4` ou un patch 22 ultérieur. Lancer les builds depuis chaque contexte avant déploiement.

La mise à jour corrige notamment CVE-2026-111497 (écriture hors limites dans le décodeur Brotli, RCE) ainsi que plusieurs défauts de validation TLS, DNS et crypto. Sources : [avis de sécurité Node.js d'octobre 2026](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), [release Node.js 22.23.4](https://nodejs.org/en/blog/release/v22.23.4), [runtimes Cloud Functions](https://docs.cloud.google.com/functions/docs/runtime-support), [runtimes Firebase App Hosting](https://firebase.google.com/docs/app-hosting/frameworks-tooling#app_hosting_runtimes).