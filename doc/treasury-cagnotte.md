# Cagnotte et remboursements

## Parcours public

La page `/cagnotte` publie le solde du registre, les contributions, les dépenses remboursées et les opérations datées. Le registre est paginé; les opérations plus anciennes restent consultables. Le QR code est généré localement et pointe vers `https://paypal.me/collectifecolekm`.

PayPal n’est pas connecté au site. Un administrateur rapproche les fonds réellement disponibles (solde PayPal et espèces conservées dans la caisse), initialise le registre, puis enregistre manuellement chaque contribution reçue. Les noms des contributeurs, les notes internes, les descriptions détaillées et les reçus ne sont jamais inclus dans la réponse publique.

## Initialisation et opérations

1. Attribuer le rôle **Trésorier** : le membre le demande dans **Espace membre > L’équipe**, puis un gestionnaire des rôles ou un administrateur approuve la demande dans **Demandes de rôles**. L’entrée **Trésorerie** apparaît ensuite dans son menu membre.
2. Saisir le total réel des fonds disponibles (PayPal et espèces) et la date du rapprochement initial. Cette opération est unique.
3. Enregistrer manuellement les contributions PayPal, espèces ou autres, avec leur date. Les notes éventuellement saisies restent internes.
4. Un membre validé soumet une avance avec montant, date, détail privé, catégorie publique et justificatif PDF/JPEG/PNG/WebP de 10 Mio maximum. Tant qu’elle est encore à examiner, son auteur peut annuler sa demande depuis la liste de ses demandes; cette action est définitive.
5. Un trésorier ou administrateur consulte le justificatif, approuve ou refuse la demande avec motif. Après le virement réel, un autre trésorier ou administrateur indique la date effective et marque la demande remboursée. Le demandeur ne peut pas approuver ou payer sa propre demande.
6. L’inscription de la dépense et la mise à jour des totaux sont transactionnelles et idempotentes : une demande payée ne peut pas être comptabilisée une seconde fois.

Les dépenses ne sont publiées qu’au moment où elles sont marquées remboursées. Le registre public n’expose qu’une catégorie prédéfinie, la date et le montant; les justificatifs restent stockés sous `treasury/receipts/` et servis par une route authentifiée au demandeur ou à un administrateur.

## Données et sécurité

- Firestore : base `ecole-db`, collections `treasuryConfig`, `treasuryEntries` et `reimbursementRequests`.
- Tous les accès aux nouvelles données passent par Firebase Admin côté serveur. Les routes vérifient le jeton révocable, le statut membre validé et l’adresse email vérifiée pour toute gestion de trésorerie. Les rôles `tresorier` et `admin` peuvent initialiser le solde, ajouter une contribution et traiter les demandes; `tresorier` n’accorde aucun accès à l’administration générale.
- Les règles Firestore existantes restent en refus par défaut pour ces nouvelles collections. Les règles Storage ne sont pas élargies; les reçus utilisent le bucket privé et une route de téléchargement avec contrôle de propriétaire/administrateur.
- Les montants sont stockés en centimes entiers. Le libellé public est une catégorie fermée pour éviter la publication accidentelle d’informations personnelles.

Identifiants de spécification couverts par les tests et routes : `[SPEC-TREASURY-01]` à `[SPEC-TREASURY-08]`.

Tests ciblés : `npm run test:treasury`.