# Cahier des Charges - Site Web "Un nid tout neuf pour nos écureuils"

## 1. Présentation du projet
**Nom du collectif :** Un nid tout neuf pour nos écureuils
**Objectif :** Informer et mobiliser les citoyens et les parents d'élèves autour de la rénovation de l'école de Kergrist-Moëlou, suite à l'arrêt du projet. 
**Vocation du site :** Servir de vitrine pour le collectif, héberger la pétition, récolter des soutiens, et informer de l'avancée du projet via un espace administrable.

## 2. Architecture Technique
* **Frontend :** Framework Next.js (React), stylisé avec Tailwind CSS. 
* **Déploiement :** Génération statique (Single Page Application) hébergée sur Firebase Hosting.
* **Backend (BaaS) :** Firebase (Firestore pour la base de données, Firebase Auth pour l'authentification de l'administrateur).
* **Communication :** Firebase Extension "Trigger Email" pour l'envoi d'e-mails transactionnels (confirmation de signature, etc.).

## 3. Interface Publique (Vitrine)
Une page unique (Landing Page) structurée en plusieurs sections :
1. **En-tête (Header) :** Navigation, identité du collectif et boutons d'action.
2. **Hero Section :** Message fort, compteur dynamique du nombre d'adhérents validés, bouton vers la pétition.
3. **Charte du collectif :** 5 principes fondamentaux (Apolitique, Pour l'école, Basé sur les faits, Action collective, Dialogue).
4. **Pétition (Arguments) :** Détail des 4 urgences (Projet mature, finances, subventions, urgences sanitaires).
5. **Plan d'action (Timeline) :** Historique et prochaines étapes de la mobilisation.
6. **Communiqué de presse :** Texte officiel rédigé par le collectif.
7. **Formulaire d'adhésion :** Récolte des données (Nom, Prénom, Email, Téléphone). Soumission enregistrée avec un statut "en attente".

## 4. Espace d'Administration (Zone Sécurisée)
Accessible via la route `/admin`, cet espace est protégé par mot de passe et réservé aux gestionnaires du collectif.
### Phase 1 : Gestion des Adhésions (MVP)
* **Système d'authentification :** Connexion via email/mot de passe (Firebase Auth).
* **Validation des membres :** 
  * Liste des candidatures "en attente" avec bouton "Valider" ou "Rejeter".
  * Le passage au statut "validé" incrémente automatiquement le compteur public affiché sur la page d'accueil.
  * *Optionnel :* Le passage au statut "validé" déclenche l'envoi du mail de bienvenue.
* **[SPEC-PET-EXPORT-01] Extraction de la pétition :** Depuis l'administration, les administrateurs peuvent générer une feuille imprimable horodatée des signatures associées à Kergrist-Moëlou. L'extraction suit le filtre de la statistique publique, place le courriel déclaré dans la colonne « Signature / courriel fourni », et n'est ni mise en cache ni enregistrée par l'application.
* **[SPEC-PET-SCAN-01] Numérisation papier :** Un membre validé peut photographier une page de pétition depuis l'espace membre. La reconnaissance est effectuée par Gemini uniquement après consentement explicite; chaque ligne doit être relue et corrigée si nécessaire avant la vérification des doublons.
* **[SPEC-PET-SCAN-02] Doublons potentiels :** Le serveur compare les noms normalisés et la commune, avec une tolérance d'une faute OCR lorsque la commune correspond. Les signatures importées restent distinctes, portent la provenance « papier » et les correspondances possibles sont marquées `potentialDuplicate` avec leurs références internes; aucune fusion automatique n'est effectuée.
* **[SPEC-PET-SCAN-03] Lecture assistée Gemini :** L'option Firebase AI Logic / Gemini Developer API (`gemini-3.8-flash`) est facultative et ne s'exécute qu'au clic explicite sur « Envoyer la photo et scanner » : le tableau recadré est transmis à Google pour analyse, selon les conditions Google applicables au compte configuré. L'interface indique que la photo n'est pas publiée ni visible par les membres, et que l'application ne la stocke pas; le détail du transfert apparaît sous le bouton. La réponse JSON est validée, puis chaque champ doit être relu avant vérification des doublons et import.
* **[SPEC-PET-SCAN-04] Provenance des signatures papier :** Lors de l'import, le champ `email` contient le marqueur `Signature papier - Prénom Nom` construit à partir du profil du membre authentifié qui a numérisé la page; cette mention ne constitue pas une adresse e-mail du signataire.
* **[SPEC-PET-SCAN-05] Résumé public des signataires :** Le bloc « Derniers signataires » n'affiche jamais le nom complet d'une signature papier; il présente le libellé générique « Signataire papier ».
* **[SPEC-PET-SCAN-06] Action finale accessible sur mobile :** Dans la vue de numérisation, le contenu défile avec une marge inférieure suffisante pour que l'action finale reste accessible au-dessus des barres système et de la zone sûre du téléphone.
* **[SPEC-MEMBERS-NONSIGN-01] Membres n'ayant pas signé :** Tout membre validé peut consulter dans l'espace membre la liste des membres validés sans signature correspondante, selon le même rapprochement d'adresses normalisées que la campagne e-mail. La comparaison est effectuée côté serveur; seuls les prénoms et noms sont retournés, jamais les adresses e-mail.
* **[SPEC-CORRECTEUR-EXPORT-01] Export du registre :** Les membres avec le rôle `correcteur` et les administrateurs peuvent télécharger tous les signataires en CSV UTF-8 compatible Excel/Google Sheets. L'export inclut les coordonnées et les marqueurs de provenance/doublon; il est autorisé côté serveur et neutralise les cellules susceptibles d'être interprétées comme formules.
* **[SPEC-TOURNEE-01] Carte des lieux-dits :** Les 106 secteurs et leur nombre agrégé de foyers sont cartographiés avec OpenStreetMap. Les secteurs à zéro foyer portent un statut visuel distinct; les lieux sans coordonnées sont listés séparément et ne sont pas placés arbitrairement sur la carte. Les marqueurs indiquent des repères de lieux-dits, pas des domiciles.
* **[SPEC-TOURNEE-02] Accès à la carte :** Seuls les membres validés et les administrateurs peuvent consulter les lieux-dits via l'API de l'application; les clients n'accèdent pas directement aux collections Firestore.
* **[SPEC-TOURNEE-03] Recherche de proximité :** Un membre peut saisir une adresse géocodée par la Base Adresse Nationale, y compris dans une commune voisine ou ailleurs en France. Cette recherche ne conserve pas l'adresse; la page affiche les trois secteurs géolocalisés de Kergrist-Moëlou les plus proches et un lien d'itinéraire GPS. La mémorisation facultative avec consentement explicite est spécifiée par `[SPEC-TOURNEE-04]`.
* **[SPEC-TOURNEE-04] Favoris et adresse privée :** Lors de la première visite de la carte ou des campagnes, un membre peut choisir jusqu'à 20 lieux-dits favoris, à partir des trois suggestions proches de son adresse ou par recherche manuelle. Les favoris sont mis en évidence sur la carte et réutilisables pour composer une campagne. La mémorisation de l'adresse reconnue par la Base Adresse Nationale est facultative et soumise à un consentement explicite; elle est enregistrée dans `memberPrivate/{uid}`, jamais dans le profil membre, et n'est accessible que via une API authentifiée. L'étape peut être ignorée et les préférences restent modifiables.
* **[SPEC-TOURNEE-05] Navigation d'une tournée de campagne :** Une tournée est préparée dans une campagne par un participant inscrit, uniquement à partir des lieux ciblés par celle-ci. Le membre sélectionne et ordonne les lieux disponibles avant de les réserver ensemble; la carte de campagne n'affiche que ses lieux et leur état partagé. Le départ peut provenir d'une adresse recherchée ou de la position GPS demandée explicitement. Il reste en mémoire de page et n'est jamais enregistré. Avant l'ouverture d'un itinéraire, l'interface précise que Google Maps recevra le départ et les étapes. Les longues tournées sont divisées en tronçons consécutifs de quatre lieux au maximum pour les liens mobiles.
* **[SPEC-TRACTATION-01] Participation et lieux de campagne :** Tout membre validé peut rejoindre une campagne active. Les membres peuvent consulter pour chaque lieu ciblé s'il est disponible, réservé ou terminé. Seuls les participants inscrits peuvent prendre un lieu ou gérer leur propre réservation, conformément à `[SPEC-TRACTATION-04]`.
* **[SPEC-TRACTATION-04] Réservation partagée des lieux :** Dans une campagne, un participant peut réserver atomiquement un lieu ciblé afin d'éviter les passages en double. Tous les membres voient si un lieu est disponible, pris ou terminé, sans voir l'identité de la personne qui l'a réservé. Seul le titulaire peut marquer le lieu comme terminé ou libérer sa réservation; les conflits de réservation sont refusés côté serveur.
* **[SPEC-TRACTATION-05] Réservation atomique d'une tournée :** Un participant inscrit peut sélectionner et ordonner de un à 200 lieux disponibles d'une campagne. Le serveur valide l'appartenance des lieux et réserve toute la liste dans une seule transaction; en cas de conflit, aucune réservation partielle n'est créée. L'ordre est partagé pour afficher la tournée du participant, tandis que l'identité du titulaire reste privée. Chaque étape est marquée terminée par son titulaire via la transition définie dans `[SPEC-TRACTATION-04]`.
* **[SPEC-TRACTATION-02] Création de campagne :** La création est réservée aux membres validés ayant le rôle `tractation` ou `admin`. Depuis la vue Carte & campagnes, un bouton ouvre une sous-vue dédiée avec formulaire. Le rôle `tractation` est attribué par un gestionnaire ou un administrateur via le circuit de demande de rôles existant. Une campagne comprend un titre, un message informatif, au moins un lieu-dit et un document facultatif.
* **[SPEC-TRACTATION-03] Documents de campagne :** Un responsable tractation peut joindre une image JPEG/PNG/WebP ou un PDF de 10 Mio maximum. Les objets restent privés dans Cloud Storage; les membres validés les téléchargent via une route authentifiée, sans URL publique permanente.
* **[SPEC-MOBILISATION-01] Carte et campagnes réunies :** L'espace membre présente la recherche d'adresse, la carte, la liste des lieux-dits, les favoris et les campagnes en cours dans une vue unique, utilisable sur mobile. Un membre peut marquer un favori depuis un repère cartographique ou une ligne de résultat. Seuls les responsables tractation voient les statistiques agrégées et le formulaire de création; tous les membres validés peuvent rejoindre une campagne.
* **[SPEC-EQUIPE-02] Demandes de rôles depuis les équipes :** Le tableau de bord propose un seul accès à l'annuaire des équipes. Chaque équipe, y compris vide, apparaît dans une carte avec ses membres et l'action de demande correspondante. Un membre qui possède déjà le rôle ne voit pas de bouton de demande; une demande en attente est indiquée sans permettre un doublon. Les rôles restent attribués par le circuit d'approbation existant.
* **[SPEC-PET-HUB-02] Ressources terrain :** L'impression de la pétition papier, les consignes de collecte et l'argumentaire vérifié sont regroupés dans le hub Pétition; le tableau de bord conserve uniquement son point d'entrée vers ce hub.
* **[SPEC-REDACTION-HUB-01] Pôle rédaction :** Le tableau de bord et le menu membre proposent un accès unique aux outils Articles, FAQ et Presse. Le hub n’affiche à chaque membre que les outils accordés par ses rôles `redacteur`, `faq`, `presse` ou `admin`; les pages outils conservent leurs contrôles d’accès propres.
* **[SPEC-ARTICLE-ATTACHMENTS-01] Pièces jointes d’article :** Les rédacteurs et administrateurs peuvent joindre jusqu’à 10 fichiers PDF/JPEG/PNG/WebP de 10 Mio chacun. Le serveur contrôle le rôle, l’auteur des brouillons, la taille et la signature réelle du fichier; les fichiers restent sans URL publique permanente. Ils sont téléchargeables par tous depuis un article publié, et les brouillons restent réservés à leur rédacteur ou aux administrateurs.

### Phase 2 : Gestion de Contenu (À venir)
* **Actualités / News :** Interface pour publier des petites brèves ou des articles sur l'avancée des négociations.
* **Partage de documents :** Possibilité d'uploader et de mettre à disposition des fichiers (PDFs des études, compte-rendu de conseil municipal, etc.).

## 5. Modèle de Données (Firestore)
* **[SPEC-ASSISTANT-CMS-02] Outils CMS de l’assistant :** L’assistant utilise le function calling Firebase AI Logic. Gemini choisit parmi des outils de lecture dédiés au Livre des comptes et aux blocs financiers, aux actualités publiées, aux compteurs agrégés de pétition/membres et à la chronologie/actions. Chaque appel est exécuté côté serveur après authentification, via une liste blanche et des lectures Firestore bornées; seuls les résultats utiles et structurés sont renvoyés au modèle. La collection nominative des signatures n’est jamais accessible à ces outils. Aucune copie intégrale du CMS n’est chargée dans le prompt initial.
* **[SPEC-ASSISTANT-CMS-03] Recherche dans les procès-verbaux :** Pour répondre aux questions historiques sur les conseils municipaux, l’assistant recherche à la demande dans le corpus documentaire `public/context.txt`, séparé par procès-verbal. L’outil authentifié accepte une requête bornée et ne transmet au modèle que quelques extraits classés, le titre source et leur numéro de ligne; il ne charge jamais le corpus complet dans la conversation. Les coordonnées directes et liens présents dans les extraits sont masqués. Le corpus correspond à la version déployée du fichier et doit être redéployé pour intégrer une mise à jour documentaire.
* **[SPEC-ASSISTANT-CHARTER-01] Charte de Nut :** L’instruction système de Nut reprend les cinq piliers du collectif (neutralité politique, intérêt de l’école, rigueur factuelle, action collective et dialogue), les missions de modération, rédaction et pédagogie, et adapte les formats presse, articles et e-mails. Elle impose la vérification des chiffres/dates dans les sources disponibles, le contrôle collégial des décisions, la citation des pages CMS et le refus d’inventer des références légales. Aucun montant ni état de concertation n’est figé dans la consigne.
* **[SPEC-ASSISTANT-AVATAR-01] Portrait de Nut :** Le chat affiche la mascotte du collectif dans l’en-tête, les réponses et l’attente de réponse. L’avatar garde une taille fixe; le nom de l’auteur reste disponible aux lecteurs d’écran sans répéter la description de l’image.
* **[SPEC-ASSISTANT-LEGAL-01] Sources juridiques officielles :** Un outil authentifié recherche à la demande jusqu’à trois fiches du portail gouvernemental `www.collectivites-locales.gouv.fr`; il renvoie leurs URL, extraits limités et date de consultation. Requête bornée, hôte fixe, HTTPS, redirections refusées, réponse HTML et taille limitées. Ce portail documente les collectivités mais ne confirme pas à lui seul l’état du droit : l’API Légifrance nécessitant un accès dédié et ses pages étant inaccessibles ici, Nut ne peut certifier un article de code en vigueur ni le règlement annuel exact d’une aide sans texte officiel vérifié. Il signale cette limite, donne l’avertissement demandé et propose de consulter le DAC 22 ou la préfecture; la réponse ne remplace pas un conseil juridique.
* **Collection `membres` :**
  * `prenom` (string)
  * `nom` (string)
  * `email` (string)
  * `telephone` (string)
  * `dateInscription` (timestamp)
  * `status` (string: "pending", "validated", "rejected")
* **Collection `mail` (Gérée par Trigger Email) :**
  * `to` (string)
  * `message` (object : subject, html)
* **Collection `articles` (Phase 2) :**
  * Contenu existant de l’article (`title`, `slug`, `content`, `publishedAt`, `status`, `authorEmail`); `attachments` est une liste de métadonnées (`id`, `fileName`, `contentType`, `extension`, `size`) sans chemin Storage ni jeton de téléchargement.
* **Collection `tractationCampaigns` :**
  * `title`, `message`, `createdByUid`, `createdByName`, `status`, `createdAt`, `updatedAt`.
  * `lieuDits` : liste figée des lieux ciblés (`id`, `nom`, `foyers`). `attachment` contient les métadonnées et le chemin privé Storage, ou `null`.
  * Sous-collection `participants/{uid}` : identité d'affichage et date d'inscription; sous-collection `visits/{lieuDitId}` : passage propre au membre, avec date et nom du lieu.
* **Collection `memberPrivate` :**
  * Document ID = UID Firebase Auth; contient `favoritePlaceIds`, `placePreferencesSetupComplete`, l'adresse `homeAddress` seulement avec consentement, et `updatedAt`.
  * La lecture et l'écriture client directes sont interdites; les membres validés passent par l'API serveur, qui ne retourne que leur propre document.
