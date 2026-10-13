# Communiqués et revue de presse

[SPEC-PRESS-01] Dans l'espace membre, le pôle Presse crée un communiqué avec un titre, un texte et une date éditoriale choisie dans le formulaire. L'enregistrement le rend visible sur l'accueil : le plus récent par date est présenté en premier, les précédents sont consultables dans les archives repliables.

La revue de presse conserve ses articles dans la collection `presse`. Lors de la création ou modification d'un article, sélectionner le communiqué auquel il se rapporte. Ses aperçus (image Open Graph, titre et résumé quand ils sont disponibles) apparaissent alors auprès de ce communiqué sur l'accueil. Les anciens liens non rattachés restent visibles sous « Autres retombées presse » jusqu'à leur classement.

[SPEC-PRESS-02] La lecture des communiqués est publique, paginée et sans données d'envoi. Leur création et modification passent par une API serveur réservée aux administrateurs ou aux membres validés disposant du rôle `presse`. La collection `pressReleases` n'est pas directement accessible via les règles Firestore ; les données des journalistes et les campagnes d'envoi restent privées.

[SPEC-PRESS-03] Après enregistrement, le bouton « Envoyer » place le texte du communiqué dans la file d'envoi SMTP existante pour les adresses de la liste des journalistes. Une confirmation précède l'action. Chaque communiqué ne peut créer qu'une seule campagne de presse ; l'acceptation par SMTP, les échecs et le quota suivent la logique habituelle des campagnes. Modifier un communiqué après avoir demandé l'envoi modifie la version publique, pas le message déjà placé dans la file. Pour envoyer une nouvelle version, créer un nouveau communiqué.

Les anciens emails de campagne ne sont pas convertis automatiquement en communiqués. Après mise en ligne, recréer l'ancien texte avec sa date dans l'interface presse et associer les articles historiques concernés : jusque-là, seuls les articles non rattachés restent visibles sur l'accueil. Aucun email n'est envoyé lors de cette reprise éditoriale.
