# Tableau de bord membre

Le tableau de bord présente les informations opérationnelles utiles à un membre : prochaine réunion publiée, campagnes de tractation actives, demandes de frais en attente, propositions à suivre et équipes rejointes.

## Données et accès

- La route `/api/member-dashboard` exige une session Firebase valide et une adhésion membre validée.
- Les résultats ne contiennent que des résumés; aucune description de frais, pièce justificative ou donnée d’un autre profil n’est renvoyée.
- Les campagnes et demandes sont bornées à 3 affichées, 50 demandes en attente et 100 propositions actives. Un indicateur signale les résultats supplémentaires.
- La prochaine réunion est la plus proche réunion publiée à venir; les brouillons et réunions retirées sont ignorés.
- Les équipes affichées proviennent des rôles actifs du profil membre. Le rôle de correcteur de pétition n’est plus considéré comme une équipe active.
- Chaque indicateur peut être indisponible indépendamment des autres afin qu’une source en erreur ne bloque pas le tableau complet.

## Pétition archivée

Le hub et les rôles liés à la pétition sont retirés du tableau de bord, de la navigation membre et des équipes proposées. Les routes, pages et données existantes sont conservées pour permettre une réactivation ultérieure.

Identifiants de spécification : `[SPEC-DASHBOARD-01]` à `[SPEC-DASHBOARD-03]`.

Tests ciblés : `npm run test:member-dashboard`.