# Clôture de la pétition

**[SPEC-PET-CLOSE-01]** Après le vote du conseil municipal, la collecte de signatures est terminée. Le dossier retourne chez l'architecte pour être ajusté à l'enveloppe prévue; aucun montant ni calendrier nouveau n'est annoncé avant confirmation.

- La règle Firestore refuse les nouvelles créations dans `signatures`, y compris depuis une ancienne version du formulaire public. Elle a été déployée sur `ecole-db` le 2 octobre 2026.
- Les routes d'import papier et d'accord de principe refusent les nouvelles écritures par Admin SDK. Les consultations et corrections autorisées des signatures historiques restent possibles.
- L'accueil et la page pétition présentent la nouvelle étape du dossier; la pétition demeure consultable comme archive sans formulaire. Le hub membre ne propose plus de collecte.
- L'archive conserve le titre, le sous-titre et un rappel de la demande de poursuite et de réévaluation à la baisse vers l'enveloppe de 550 000 € HT, distinct de l'avancement actuel du projet.

La fermeture des routes serveur et l'actualisation des pages publiques ne prennent effet en production qu'après le déploiement de l'application App Hosting. Le déploiement des règles Firestore seul n'empêche pas les anciennes routes Admin SDK encore en production de créer des documents.
