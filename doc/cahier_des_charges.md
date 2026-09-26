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
