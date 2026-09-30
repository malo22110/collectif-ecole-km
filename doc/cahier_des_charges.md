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
