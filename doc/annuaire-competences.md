# Annuaire de compétences

## Utilité

L’annuaire aide les membres validés à identifier des volontaires pour préparer les actions du collectif : chantiers et technique, projets autour de l’école, appui administratif et financements, communication et numérique.

Les compétences et disponibilités sont autodéclarées. Elles ne constituent ni une certification, ni une autorisation d’intervention sur le bâtiment, ni un engagement de la commune.

## Contrôle par chaque membre

- Le profil n’apparaît pas dans l’annuaire avant activation explicite de « Afficher mon profil ».
- Le membre choisit jusqu’à huit compétences dans le catalogue et une disponibilité indicative.
- Un champ facultatif permet d’indiquer un métier ou une expérience utile; aucun employeur n’est demandé. Cette information n’est visible que si le membre publie son profil.
- La présentation libre est facultative et limitée à 180 caractères; les courriels et liens y sont refusés.
- Le partage de l’adresse e-mail est un consentement séparé. Sans ce choix, aucune coordonnée n’est retournée aux autres membres.
- Le membre peut retirer son profil ou son consentement au contact en enregistrant de nouvelles préférences.

## Architecture et accès

- Les profils sont stockés dans `memberSkillsDirectory/{uid}` et ne sont jamais lus directement par les SDK clients.
- Les API vérifient le jeton Firebase et le statut validé, limitent les payloads et revalident l’adhésion des profils visibles.
- La réponse publique du répertoire ne contient ni UID Firebase ni adresse e-mail, sauf pour les profils dont le propriétaire a activé le partage de contact; elle reste réservée aux membres validés.
- Les règles Firestore actuelles refusent par défaut l’accès client direct à cette nouvelle collection.

Tests ciblés : `npm run test:member-skills`.