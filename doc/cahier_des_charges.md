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
* **[SPEC-MEMBERS-NONSIGN-01] Membres n'ayant pas signé :** Tout membre validé peut consulter dans l'espace membre la liste des membres validés sans signature correspondante, selon le même rapprochement d'adresses normalisées que la campagne e-mail. La comparaison est effectuée côté serveur; seuls les prénoms et noms sont retournés, jamais les adresses e-mail.
* **[SPEC-CORRECTEUR-EXPORT-01] Export du registre :** Les membres avec le rôle `correcteur` et les administrateurs peuvent télécharger tous les signataires en CSV UTF-8 compatible Excel/Google Sheets. L'export inclut les coordonnées et les marqueurs de provenance/doublon; il est autorisé côté serveur et neutralise les cellules susceptibles d'être interprétées comme formules.
* **[SPEC-TOURNEE-01] Carte des lieux-dits :** Les 106 secteurs et leur nombre agrégé de foyers sont cartographiés avec OpenStreetMap. Les secteurs à zéro foyer portent un statut visuel distinct; les lieux sans coordonnées sont listés séparément et ne sont pas placés arbitrairement sur la carte. Les marqueurs indiquent des repères de lieux-dits, pas des domiciles.
* **[SPEC-TOURNEE-02] Accès à la carte :** Seuls les membres validés et les administrateurs peuvent consulter les lieux-dits via l'API de l'application; les clients n'accèdent pas directement aux collections Firestore.
* **[SPEC-TOURNEE-03] Recherche de proximité :** Un membre peut saisir une adresse géocodée par la Base Adresse Nationale, y compris dans une commune voisine ou ailleurs en France. Cette recherche ne conserve pas l'adresse; la page affiche les trois secteurs géolocalisés de Kergrist-Moëlou les plus proches et un lien d'itinéraire GPS. La mémorisation facultative avec consentement explicite est spécifiée par `[SPEC-TOURNEE-04]`.
* **[SPEC-TOURNEE-04] Favoris et adresse privée :** Lors de la première visite de la carte ou des campagnes, un membre peut choisir jusqu'à 20 lieux-dits favoris, à partir des trois suggestions proches de son adresse ou par recherche manuelle. Les favoris sont mis en évidence sur la carte et réutilisables pour composer une campagne. La mémorisation de l'adresse reconnue par la Base Adresse Nationale est facultative et soumise à un consentement explicite; elle est enregistrée dans `memberPrivate/{uid}`, jamais dans le profil membre, et n'est accessible que via une API authentifiée. L'étape peut être ignorée et les préférences restent modifiables.
* **[SPEC-TRACTATION-01] Participation et passages :** Tout membre validé peut rejoindre une campagne active. Après inscription, il peut valider ou annuler ses propres passages uniquement dans les lieux-dits sélectionnés pour cette campagne. Les passages et l'identité du participant ne sont pas exposés aux autres membres.
* **[SPEC-TRACTATION-02] Création de campagne :** La création est réservée aux membres validés ayant le rôle `tractation` ou `admin`. Depuis la vue Carte & campagnes, un bouton ouvre une sous-vue dédiée avec formulaire. Le rôle `tractation` est attribué par un gestionnaire ou un administrateur via le circuit de demande de rôles existant. Une campagne comprend un titre, un message informatif, au moins un lieu-dit et un document facultatif.
* **[SPEC-TRACTATION-03] Documents de campagne :** Un responsable tractation peut joindre une image JPEG/PNG/WebP ou un PDF de 10 Mio maximum. Les objets restent privés dans Cloud Storage; les membres validés les téléchargent via une route authentifiée, sans URL publique permanente.
* **[SPEC-MOBILISATION-01] Carte et campagnes réunies :** L'espace membre présente la recherche d'adresse, la carte, la liste des lieux-dits, les favoris et les campagnes en cours dans une vue unique, utilisable sur mobile. Un membre peut marquer un favori depuis un repère cartographique ou une ligne de résultat. Seuls les responsables tractation voient les statistiques agrégées et le formulaire de création; tous les membres validés peuvent rejoindre une campagne.
* **[SPEC-EQUIPE-02] Demandes de rôles depuis les équipes :** Le tableau de bord propose un seul accès à l'annuaire des équipes. Chaque équipe, y compris vide, apparaît dans une carte avec ses membres et l'action de demande correspondante. Un membre qui possède déjà le rôle ne voit pas de bouton de demande; une demande en attente est indiquée sans permettre un doublon. Les rôles restent attribués par le circuit d'approbation existant.
* **[SPEC-PET-HUB-02] Ressources terrain :** L'impression de la pétition papier, les consignes de collecte et l'argumentaire vérifié sont regroupés dans le hub Pétition; le tableau de bord conserve uniquement son point d'entrée vers ce hub.
* **[SPEC-REDACTION-HUB-01] Pôle rédaction :** Le tableau de bord et le menu membre proposent un accès unique aux outils Articles, FAQ et Presse. Le hub n’affiche à chaque membre que les outils accordés par ses rôles `redacteur`, `faq`, `presse` ou `admin`; les pages outils conservent leurs contrôles d’accès propres.

### Phase 2 : Gestion de Contenu (À venir)
* **Actualités / News :** Interface pour publier des petites brèves ou des articles sur l'avancée des négociations.
* **Partage de documents :** Possibilité d'uploader et de mettre à disposition des fichiers (PDFs des études, compte-rendu de conseil municipal, etc.).

## 5. Modèle de Données (Firestore)
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
  * `titre` (string), `contenu` (string), `date` (timestamp), `auteur` (string).
* **Collection `tractationCampaigns` :**
  * `title`, `message`, `createdByUid`, `createdByName`, `status`, `createdAt`, `updatedAt`.
  * `lieuDits` : liste figée des lieux ciblés (`id`, `nom`, `foyers`). `attachment` contient les métadonnées et le chemin privé Storage, ou `null`.
  * Sous-collection `participants/{uid}` : identité d'affichage et date d'inscription; sous-collection `visits/{lieuDitId}` : passage propre au membre, avec date et nom du lieu.
* **Collection `memberPrivate` :**
  * Document ID = UID Firebase Auth; contient `favoritePlaceIds`, `placePreferencesSetupComplete`, l'adresse `homeAddress` seulement avec consentement, et `updatedAt`.
  * La lecture et l'écriture client directes sont interdites; les membres validés passent par l'API serveur, qui ne retourne que leur propre document.
