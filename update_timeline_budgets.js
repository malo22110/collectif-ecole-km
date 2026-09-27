const fs = require('fs');

const timeline = JSON.parse(fs.readFileSync('data/timeline.json', 'utf8'));

const budgets = [
  {
    "etudes": "Non chiffré globalement à ce stade (AMO en cours)",
    "travaux": "Non chiffré à ce stade",
    "total": "Non chiffré"
  },
  {
    "etudes": "En cours d'évaluation",
    "travaux": "Non chiffré à ce stade",
    "total": "Non chiffré"
  },
  {
    "etudes": "~68 750 € HT (Honoraires architectes)",
    "travaux": "576 500 € HT (Prévisionnel)",
    "total": "~645 250 € HT (Prévisionnel)"
  },
  {
    "etudes": "127 110 € HT (Bilan acté et engagé)",
    "travaux": "En cours de réévaluation",
    "total": "127 110 € HT + (Travaux en réévaluation)"
  },
  {
    "etudes": "127 110 € HT",
    "travaux": "706 500 € HT (Tranche ferme 617 500 € + optionnelle 89 000 €)",
    "total": "833 610 € HT"
  },
  {
    "etudes": "127 110 € HT",
    "travaux": "735 488 € HT (Phase 1: 615 278 € + Phase 2: 120 210 €)",
    "total": "862 598 € HT"
  },
  {
    "etudes": "127 110 € HT",
    "travaux": "Cible imposée sous 800 000 € TTC (soit ~666 000 € HT)",
    "total": "Cible globale sous 800 000 € TTC"
  },
  {
    "etudes": "127 110 € HT",
    "travaux": "En cours de réduction (Cible visée : ~500 000 € à 550 000 € HT)",
    "total": "~627 110 € à 677 110 € HT"
  },
  {
    "etudes": "127 110 € HT (figés) + 2 170 € HT (avenant refusé)",
    "travaux": "Bloqué",
    "total": "Bloqué"
  }
];

// Special text update for Octobre 2025 as requested
timeline[4].description = "Validation par le conseil municipal de la tranche ferme d'un montant de 617 500 € HT. Cette enveloppe intègre notamment 41 000 € HT de travaux obligatoires pour le traitement du radon. Les travaux de la salle de motricité (89 000 € HT) s'y ajoutent sous forme de tranche optionnelle.";

for (let i = 0; i < timeline.length; i++) {
  timeline[i].budget = budgets[i];
}

fs.writeFileSync('data/timeline.json', JSON.stringify(timeline, null, 2));
console.log('Timeline budgets updated.');
