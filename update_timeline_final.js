const fs = require('fs');

let timeline = JSON.parse(fs.readFileSync('data/timeline.json', 'utf8'));

// Remove the last event ("Mars 2026 – Septembre 2026")
timeline.pop();

// Add the 3 new events
timeline.push({
  date: "Avril 2026",
  title: "Cadrage budgétaire de la nouvelle mandature",
  description: "Le Trésor public confirme la capacité d'emprunt de 400 000 €. Le Sous-préfet demande de maintenir le projet sous 800 000 € TTC pour obtenir 30% de DETR (à engager avant fin décembre 2026), et confirme l'éligibilité aux 160 k€ d'aides (Région, Département). Vote d'une ligne d'urgence de 50 000 € pour le radon.",
  simplifiedDescription: "Bonne nouvelle : les comptes de la commune sont sains et l'État confirme que nous avons droit aux aides (jusqu'à 30% en plus des 160 000 € déjà obtenus). L'État impose juste de voter le projet avant la fin de l'année 2026.",
  sourceLabel: "PV du 28 avril 2026",
  sourceUrl: "/docs/pvs/CR 28 04 2026.pdf",
  color: "bg-emerald-500",
  produits: ["Confirmation capacité d'emprunt (Trésor Public)", "Maintien de l'éligibilité aux subventions"],
  conservable: true
});

timeline.push({
  date: "Juin 2026",
  title: "Concertation pour réduire les coûts",
  description: "Réunion du 22 juin avec l'équipe éducative, le cabinet d'architectes et l'AMO pour simplifier techniquement l'APD : conservation des menuiseries étanches, dalle béton contre le radon sans ventilation complexe, raccordement au réseau de chaleur SCIC Koad COB.",
  simplifiedDescription: "Élus, professeurs et architectes se réunissent pour trouver des idées afin de baisser le prix des travaux (garder certaines fenêtres, chauffer via le réseau local existant, etc.).",
  sourceLabel: "PV du 9 juin 2026",
  sourceUrl: "/docs/pvs/PV 09 06 2026 (1).pdf",
  color: "bg-emerald-500",
  produits: ["Pistes concrètes de réduction budgétaire", "Maintien de l'équipe de Maîtrise d'œuvre"],
  conservable: true
});

timeline.push({
  date: "Septembre 2026",
  title: "Blocage paradoxal et mobilisation",
  description: "Rejet (8 voix CONTRE, 6 POUR) du devis complémentaire de 2 170 € HT destiné à finaliser l'allègement budgétaire demandé par le Sous-préfet, bloquant net les études. Le 26 septembre, lancement du collectif citoyen pour réclamer une commission extra-municipale.",
  simplifiedDescription: "Paradoxe : la mairie refuse de payer la petite facture de 2 000 € qui servait justement à réduire le coût du projet ! Face à l'abandon du projet qui se profile (et la perte de tout l'argent), les habitants créent le collectif.",
  sourceLabel: "Charte du Collectif",
  sourceUrl: "#",
  color: "bg-amber-500",
  produits: ["Arrêt complet du projet de rénovation", "Risque de caducité imminente de la DETR"],
  conservable: false
});

fs.writeFileSync('data/timeline.json', JSON.stringify(timeline, null, 2));
