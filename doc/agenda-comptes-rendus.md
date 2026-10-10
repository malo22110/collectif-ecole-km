# Agenda et comptes rendus du collectif

Les propositions du tableau d’actions peuvent être rattachées à une réunion publiée. Depuis une réunion, les membres peuvent consulter les propositions associées et leur état de suivi.
## Fonctionnement

Les administrateurs et gestionnaires des rôles peuvent créer des réunions, préparer un ordre du jour et rédiger les notes de travail du collectif. Ils choisissent de conserver le rendez-vous en brouillon (visible aux coordinateurs seulement) ou de le publier aux membres validés. L’auteur d’une réunion peut modifier ou retirer sa réunion; les coordinateurs peuvent gérer toutes les réunions. Le retrait la masque de l’agenda sans effacer les suggestions et propositions qui lui étaient associées.

Avant une réunion publiée à venir, chaque membre validé peut proposer un point. Son auteur peut consulter, modifier ou retirer son point tant qu’il est en attente; les autres membres ne voient pas cette suggestion avant son examen. Les coordinateurs peuvent gérer les points en attente de tous les membres et décider de les accepter ou de les écarter. Un point accepté est ajouté atomiquement à l’ordre du jour; une suggestion ne signifie pas que le sujet est accepté par la commune.

Après une réunion, les coordinateurs peuvent compléter les notes partagées et les prochaines étapes discutées par le collectif. Aucun texte n’est présenté comme procès-verbal municipal, décision officielle ou engagement de la commune.

## Accès et limites

- L’accès aux réunions publiées, à la soumission de suggestions et aux notes demande une adhésion validée.
- La création et la publication des réunions ainsi que les décisions d’acceptation/refus des suggestions sont réservées aux coordinateurs.
- La modification et le retrait d’une réunion sont ouverts à son auteur et aux coordinateurs; les suggestions en attente sont modifiables et supprimables par leur auteur ou un coordinateur.
- Les textes sont bornés et les e-mails/liens sont refusés dans les contenus partagés.
- Les réponses sont paginées (50 réunions) et les propositions d’ordre du jour sont bornées.
- Toutes les écritures et lectures passent par Firebase Admin côté serveur; aucun droit Firestore client n’est ajouté.

> La commission extra-municipale reste une proposition de cadre. Cet agenda organise le travail interne du collectif et ne préjuge pas de sa création.

Tests ciblés : `npm run test:member-meetings`.

Identifiants de spécification : `[SPEC-MEMBER-MEETINGS-01]` à `[SPEC-MEMBER-MEETINGS-07]`.