# Agenda et comptes rendus du collectif

Les propositions du tableau d’actions peuvent être rattachées à une réunion publiée. Depuis une réunion, les membres peuvent consulter les propositions associées et leur état de suivi.
## Fonctionnement

Les administrateurs et gestionnaires des rôles peuvent créer des réunions, préparer un ordre du jour et rédiger les notes de travail du collectif. Ils choisissent de conserver le rendez-vous en brouillon (visible aux coordinateurs seulement) ou de le publier aux membres validés.

Avant une réunion publiée à venir, chaque membre validé peut proposer un point. Les suggestions restent privées aux coordinateurs jusqu’à leur examen. Un point accepté est ajouté atomiquement à l’ordre du jour; une suggestion ne signifie pas que le sujet est accepté par la commune.

Après une réunion, les coordinateurs peuvent compléter les notes partagées et les prochaines étapes discutées par le collectif. Aucun texte n’est présenté comme procès-verbal municipal, décision officielle ou engagement de la commune.

## Accès et limites

- L’accès aux réunions publiées, à la soumission de suggestions et aux notes demande une adhésion validée.
- Création, modification, publication et traitement des suggestions sont réservés aux administrateurs et gestionnaires des rôles.
- Les textes sont bornés et les e-mails/liens sont refusés dans les contenus partagés.
- Les réponses sont paginées (50 réunions) et les propositions d’ordre du jour sont bornées.
- Toutes les écritures et lectures passent par Firebase Admin côté serveur; aucun droit Firestore client n’est ajouté.

> La commission extra-municipale reste une proposition de cadre. Cet agenda organise le travail interne du collectif et ne préjuge pas de sa création.

Tests ciblés : `npm run test:member-meetings`.