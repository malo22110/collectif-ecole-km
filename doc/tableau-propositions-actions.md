# Tableau « Propositions & actions »

## Fonctionnement

Tous les membres validés peuvent consulter le tableau et soumettre une proposition dans l’un des quatre pôles : chantiers participatifs, expertise et mécénat, projets annexes, recherche de fonds. Une proposition contient un titre, une description du besoin et une prochaine étape possible.

Son auteur peut la corriger tant qu’elle est au statut « Nouvelle proposition ». Les administrateurs et gestionnaires des rôles coordonnent ensuite les états de suivi : « À instruire », « À discuter avec la commune », « Transmise à la commune », « En attente d’un retour », « Réalisée » ou « Suspendue ». Les transitions ne permettent pas de sauter directement d’une idée à « Réalisée ».

## Limite institutionnelle

Le tableau organise la préparation et le suivi du travail bénévole. Il ne constitue ni une commission officielle, ni un vote, ni une décision municipale. « Transmise à la commune » signifie qu’une proposition a été rapportée comme transmise par un membre coordinateur; le conseil municipal conserve ses compétences de décision.

## Accès et données

- Les routes vérifient l’authentification Firebase et le statut membre validé.
- Les nouvelles propositions sont créées avec un auteur issu du profil validé; l’état initial est imposé côté serveur.
- La liste est paginée par lots de 50 et les corps de requête sont limités en taille.
- Les coordonnées personnelles et liens sont refusés dans les champs partagés.
- Les données sont écrites par Firebase Admin dans `memberActionBoard`; aucun accès Firestore direct client n’est accordé.
- L’édition est limitée à l’auteur d’une proposition encore nouvelle. Le changement d’état est réservé aux administrateurs et gestionnaires des rôles.

Identifiants de spécification : `[SPEC-ACTION-BOARD-01]` à `[SPEC-ACTION-BOARD-03]`.

Tests ciblés : `npm run test:action-board`.