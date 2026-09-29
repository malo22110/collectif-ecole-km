// Just a skeleton to test ideas
const fs = require('fs');

const pageData = {
  title: "Historique & Analyse du Projet",
  subtitle: "Chronologie des décisions et analyse financière complète basée exclusivement sur les actes officiels de la mairie (procès-verbaux du conseil municipal, arrêtés de subventions, et dossiers de demande à l'État).",
  blocks: [
    {
      id: "b1",
      type: "alert",
      style: "warning",
      content: "Ce document de synthèse est **en cours de validation par la communauté**. Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons \"Commenter\" disponibles à chaque section, ou dans l'espace général en bas de page."
    },
    {
      id: "b2",
      type: "alert",
      style: "info",
      title: "📌 Transparence et périmètre de l'analyse",
      content: "L'étude financière et la chronologie présentées ci-dessous s'appuient rigoureusement sur les actes officiels et les contrats validés jusqu'en mars 2026..."
    },
    // We can map the financial overview to a custom block or rich text
    {
      id: "b3",
      type: "financial_overview",
      // ...
    },
    {
      id: "b4",
      type: "timeline",
      items: [] // fetch from timeline.json
    },
    {
      id: "b5",
      type: "lexicon",
      items: []
    }
  ]
};

console.log(JSON.stringify(pageData, null, 2));
