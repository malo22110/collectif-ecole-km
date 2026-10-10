# Campagnes de tractation

Les responsables tractation et les administrateurs peuvent clôturer une campagne active depuis ses informations.

La clôture passe le statut de `active` à `closed` dans une transaction et enregistre l’auteur ainsi que la date. La campagne disparaît de la liste des campagnes en cours et apparaît dans la section **Campagnes archivées** du hub, triée par date de clôture et paginée par 20. L’archive est consultable en lecture seule; les jointures, réservations et passages restent conservés. Les routes de jointure, réservation, mise à jour des passages, calcul d’itinéraire et téléversement refusent ensuite la campagne clôturée.

La confirmation dans l’interface avertit que les tournées en cours ne pourront plus être poursuivies. La clôture n’est pas réversible depuis l’interface.

Identifiants de spécification : `[SPEC-TRACTATION-14]` et `[SPEC-TRACTATION-15]`.

Test ciblé : `npm run test:tractation`.