import * as admin from 'firebase-admin';
admin.initializeApp({
  projectId: "collectif-ecole-km",
});
const db = admin.firestore();
const timelineData = require('../../data/timeline.json');

const pageData = {
  header: {
    title: "Historique & Analyse du Projet",
    subtitle: "Chronologie des décisions et analyse financière complète basée exclusivement sur les actes officiels de la mairie (procès-verbaux du conseil municipal, arrêtés de subventions, et dossiers de demande à l'État)."
  },
  alerts: [
    {
      type: "warning",
      text: "Ce document de synthèse est **en cours de validation par la communauté**. Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons \"Commenter\" disponibles à chaque section, ou dans l'espace général en bas de page."
    },
    {
      type: "info",
      title: "📌 Transparence et périmètre de l'analyse",
      text: "L'étude financière et la chronologie présentées ci-dessous s'appuient rigoureusement sur les actes officiels et les contrats validés jusqu'en mars 2026, date de fin de la précédente mandature. Le collectif a désormais pour mission de se rapprocher de l'actuelle municipalité afin d'obtenir les éventuelles factures et délibérations des six derniers mois (d'avril à septembre 2026). Ces documents permettront d'actualiser le chiffrage exact des dépenses déjà engagées, sachant que toute nouvelle facture réglée depuis le printemps ne fera qu'augmenter le montant de la perte sèche estimée aujourd'hui à plus de 70 000 €."
    }
  ],
  lexicon: [
    { title: "AMO (Assistant à Maîtrise d'Ouvrage)", desc: "Expert technique/financier accompagnant la mairie dans le pilotage du projet et la recherche de subventions." },
    { title: "Maîtrise d'Œuvre (Architectes, BET)", desc: "Équipe concevant les plans et dirigeant les travaux." },
    { title: "APS & APD", desc: "**APS :** Avant-Projet Sommaire (Esquisses/1er chiffrage).<br/>**APD :** Avant-Projet Définitif (Plans détaillés/Budget final)." },
    { title: "DETR / DSIL", desc: "Subvention de l'État exigeant des performances énergétiques strictes. L'école est éligible via le Fonds Vert." },
    { title: "BDB (Bâtiment Durable Breton)", desc: "Démarche qualitative valorisant l'écoconstruction, conditionnant les 60 450 € d'aides régionales." },
    { title: "SCIC (Koad COB)", desc: "Réseau local de chaleur au bois." }
  ],
  timeline: timelineData
};

async function run() {
  await db.collection("pages").doc("historique").set(pageData);
  console.log("Seed successful");
}
run().catch(console.error);
