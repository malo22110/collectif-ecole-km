# Envoi des emails avec le domaine du collectif

Les fonctions Firebase envoient les emails de bienvenue, les liens magiques, les campagnes et les réponses de la boîte via Nodemailer/SMTP Infomaniak. Une synchronisation IMAP périodique copie les nouveaux messages de la boîte vers une boîte de réception interne, visible uniquement par les administrateurs et le rôle `mail`. Le mot de passe de la boîte est un secret Firebase et ne doit jamais être placé dans un fichier versionné.

## Adresse d’envoi

La configuration par défaut utilise `contact@collectif-ecole-km.fr`, également comme adresse de réponse. Vérifier d’abord que cette boîte ou cet alias existe dans Infomaniak et qu’il est autorisé à envoyer des messages.

## Configuration des fonctions

Copier `functions/.env.example` vers `functions/.env`, puis vérifier l’utilisateur, l’adresse d’expédition et les options IMAP. Ce fichier est ignoré par Git. La synchronisation IMAP lit `INBOX` toutes les cinq minutes; elle importe le texte brut, conserve jusqu’à cinq pièces jointes de 4 Mio chacune dans Cloud Storage privé, et déduplique par Message-ID/UID IMAP.

Configurer le mot de passe de la boîte dans Firebase Secret Manager, sans le saisir dans le dépôt :

```sh
firebase functions:secrets:set SMTP_PASSWORD
firebase deploy --only functions
```

La commande demande le secret interactivement. Le même secret sert au SMTP et à l’IMAP de la même boîte. Pour l’émulateur seulement, placer `SMTP_PASSWORD=...` dans `functions/.secret.local`; ce fichier est aussi ignoré par Git.

Les réglages SMTP par défaut sont `mail.infomaniak.com`, port `587` avec STARTTLS. Le port `465` active TLS implicite si la configuration Infomaniak le demande.

## Campagnes et quota d'envoi

[SPEC-MAIL-03] Infomaniak applique un quota par adresse sur une fenêtre glissante de 24 heures (selon l'offre : 200 ou 500 e-mails). Les envois effectués depuis d'autres applications utilisant la même adresse comptent également. Voir [les limites Infomaniak](https://faq.infomaniak.com/2065). Pour des campagnes récurrentes plus volumineuses, prévoir un service de newsletter adapté.

Si le serveur renvoie `451 4.3.0` pour le quota quotidien, la campagne s'arrête : les destinataires restants restent en attente et une reprise automatique est programmée 24 heures plus tard. Le statut « envoyé » signifie seulement que le serveur SMTP a accepté le message, pas qu'il a été livré en boîte de réception.

Pour une campagne antérieure à cette gestion du quota, les destinataires concernés ont été marqués en échec. Après déploiement des fonctions **et** de l'application, attendre qu'une capacité d'envoi se libère, puis ouvrir la campagne dans l'onglet « Envoyés » et cliquer sur « Relancer les N échecs ». Seuls ces destinataires sont remis en file : ceux déjà acceptés par SMTP ne reçoivent pas de doublon. Ne pas recréer une campagne « Tous » pour tenter cette reprise. Le déploiement du correctif seul ne relance pas les échecs passés.

## Authentification du domaine

Dans le Manager Infomaniak, ouvrir la configuration du service Mail du domaine et publier les enregistrements SPF et DKIM indiqués pour le domaine. Ne pas créer un deuxième enregistrement SPF : si un TXT SPF existe déjà, fusionner les mécanismes autorisés dans un seul enregistrement.

Configurer également les enregistrements MX exactement comme indiqués par Infomaniak. La liste DNS fournie le 1er octobre 2026 ne montrait pas de MX; sans MX valide, les messages ne seront pas acheminés vers la boîte et la synchronisation IMAP restera vide.

Conserver l’enregistrement DMARC existant en `p=reject` une fois SPF et DKIM autorisant Infomaniak; utiliser l’alignement relâché pour SPF et DKIM. Ne pas envoyer depuis `@collectif-ecole-km.fr` avant que ces mécanismes passent l’authentification.

Après publication des DNS, envoyer un message de test vers plusieurs fournisseurs et vérifier SPF, DKIM et DMARC dans les en-têtes reçus. Le changement de serveur seul ne suffit pas à éviter les spams : la configuration DNS et la réputation du domaine comptent aussi.

## Authentification par lien

Les liens magiques de `/connexion` sont générés par Firebase Admin mais expédiés par le même SMTP. L’URL d’action doit rester sur un domaine autorisé dans Firebase Authentication et le lien revient sur `/connexion` pour finaliser la session.

## Mot de passe Gmail précédent

Après validation du basculement, retirer `GMAIL_PASSWORD` du fichier local `functions/.env` et révoquer l’ancien mot de passe d’application Gmail dans les paramètres de sécurité du compte.
