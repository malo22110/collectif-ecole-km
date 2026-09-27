const fs = require('fs');

const timeline = [
  {
    "date": "Juillet 2023 – Décembre 2023",
    "title": "Lancement des études et cadrage",
    "description": "Validation de l'ADAC en tant qu'Assistant à Maîtrise d'Ouvrage (AMO) pour la réhabilitation. Concertation avec les enseignantes, l'APE et le CAUE pour définir les besoins (3 classes, sanitaires, BCD). Premières demandes de subvention.",
    "simplifiedDescription": "La mairie décide de lancer un vrai projet pour l'école avec l'aide de professionnels. On consulte les professeurs et les parents pour lister ce dont les enfants ont besoin.",
    "sourceLabel": "PV du 4 Juil. et 14 Déc. 2023",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2023/10/PV-DU-04072023.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Mission AMO ADAC actée",
      "Programme fonctionnel initial"
    ],
    "conservable": true
  },
  {
    "date": "Mai 2024",
    "title": "Déblocage des contraintes patrimoniales",
    "description": "Après échange avec l'Architecte des Bâtiments de France (ABF), la mairie obtient l'accord écrit pour créer une extension sur la façade arrière sans dénaturer le patrimoine.",
    "simplifiedDescription": "L'expert du patrimoine historique (Bâtiments de France) donne son feu vert pour agrandir l'école par l'arrière sans abîmer le charme du bâtiment.",
    "sourceLabel": "PV de Mai 2024",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2025/04/pv-kergrist-moelou-05-2024.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Accord écrit de l'Architecte des Bâtiments de France (ABF)"
    ],
    "conservable": false
  },
  {
    "date": "Avril 2025 – Juin 2025",
    "title": "Structuration de la maîtrise d'œuvre",
    "description": "Lancement de l'AMO Kerlotec. Choix définitif du cabinet d'architecte Blandine Houssais (en partenariat avec Patine Office) pour 68 750 € HT d'honoraires. Chiffrage prévisionnel des travaux à 576 500 € HT.",
    "simplifiedDescription": "La mairie recrute une équipe d'architectes pour dessiner les plans exacts. Le projet total est alors estimé à environ 576 000 €.",
    "sourceLabel": "PV du 19 Juin 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-19-06-2025.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Contrat de Maîtrise d'œuvre (68 750 € HT)",
      "Diagnostics techniques complets"
    ],
    "conservable": true
  },
  {
    "date": "Septembre 2025",
    "title": "Présentation de l'Avant-Projet Sommaire",
    "description": "Bilan comptable acté : 127 110 € HT d'études sont déjà engagés par contrats. Notification officielle des financements accordés par le Département et la Région, sécurisant fermement 159 855 € de subventions. Le conseil demande un recentrage du coût évalué.",
    "simplifiedDescription": "Excellente nouvelle : 160 000 € de subventions sont décrochés ! Le Conseil constate que 127 000 € d'études sont déjà engagés.",
    "sourceLabel": "PV du 11 Sept. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-du-11-09-2025.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Arrêtés de subventions Département et Région (159 855 €)"
    ],
    "conservable": false
  },
  {
    "date": "Octobre 2025",
    "title": "Validation de l'APS ferme",
    "description": "Validation par le conseil municipal du montant de 617 500 € HT. L'enveloppe intègre notamment 41 000 € HT de travaux obligatoires pour le traitement du radon.",
    "simplifiedDescription": "Les élus votent et valident le budget du projet. Le montant inclut des travaux obligatoires pour protéger les enfants du radon (un gaz toxique).",
    "sourceLabel": "PV du 9 Oct. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-9-10-2025.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Avant-Projet Sommaire (APS) validé",
      "Études thermiques (ALECOB)"
    ],
    "conservable": false
  },
  {
    "date": "Novembre 2025",
    "title": "Validation de l'Avant-Projet Définitif (APD)",
    "description": "Scission stratégique du projet en 2 phases pour alléger les coûts. Phase 1 (Classes, préau, chaufferie) : 615 278 € HT. Phase 2 optionnelle (Motricité) : 120 210 € HT.",
    "simplifiedDescription": "Pour maîtriser le budget d'un coup, le projet est découpé en deux. On fera d'abord les urgences (classes, préau). La salle de motricité est gardée pour plus tard.",
    "sourceLabel": "PV du 27 Nov. 2025",
    "sourceUrl": "https://www.kergrist-moelou.bzh/wp-content/uploads/2026/02/PV-27-11-2025.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Avant-Projet Définitif (APD) validé",
      "Chiffrage des 2 phases"
    ],
    "conservable": false
  },
  {
    "date": "Avril 2026",
    "title": "Cadrage budgétaire de la nouvelle mandature",
    "description": "Le Trésor public confirme la capacité d'emprunt de 400 000 €. Le Sous-préfet demande de maintenir le projet sous 800 000 € TTC pour obtenir 30% de DETR (à engager avant fin décembre 2026), et confirme l'éligibilité aux 160 k€ d'aides (Région, Département). Vote d'une ligne d'urgence de 50 000 € pour le radon.",
    "simplifiedDescription": "Le Trésorier valide la capacité financière pour emprunter. L'État confirme son soutien financier mais impose une condition stricte : le projet doit démarrer avant fin 2026.",
    "sourceLabel": "PV du 28 avril 2026",
    "sourceUrl": "/docs/pvs/CR 28 04 2026.pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Confirmation capacité d'emprunt (400 000 €)",
      "Échéance DETR fixée à fin 2026"
    ],
    "conservable": true
  },
  {
    "date": "Juin 2026",
    "title": "Concertation pour réduire les coûts",
    "description": "Réunion du 22 juin avec l'équipe éducative, le cabinet d'architectes et l'AMO pour simplifier techniquement l'APD : conservation des menuiseries étanches, dalle béton contre le radon sans ventilation complexe, raccordement au réseau de chaleur SCIC Koad COB.",
    "simplifiedDescription": "Élus, professeurs et architectes se réunissent pour trouver des solutions intelligentes afin de baisser le coût final des travaux sans dégrader la qualité pour les enfants.",
    "sourceLabel": "PV du 9 juin 2026",
    "sourceUrl": "/docs/pvs/PV 09 06 2026 (1).pdf",
    "color": "bg-emerald-500",
    "produits": [
      "Pistes concrètes de réduction budgétaire"
    ],
    "conservable": true
  },
  {
    "date": "Septembre 2026",
    "title": "Blocage paradoxal et mobilisation",
    "description": "Rejet du devis complémentaire de 2 170 € HT destiné à finaliser l'allègement budgétaire demandé par le Sous-préfet, bloquant net les études. Le 26 septembre, lancement du collectif citoyen pour réclamer une commission extra-municipale.",
    "simplifiedDescription": "Alors qu'on était sur le point de réduire le coût du projet, le conseil municipal refuse de voter une facture de 2 000 € et bloque tout. Face au risque de perdre l'argent, les citoyens se mobilisent et montent un collectif.",
    "sourceLabel": "Charte du Collectif",
    "sourceUrl": "#",
    "color": "bg-amber-500",
    "produits": [
      "Blocage de l'optimisation budgétaire",
      "Risque d'annulation des subventions"
    ],
    "conservable": false
  }
];

fs.writeFileSync('data/timeline.json', JSON.stringify(timeline, null, 2));
console.log('Timeline updated successfully with new text.');
