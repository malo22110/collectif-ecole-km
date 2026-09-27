const fs = require('fs');

const path = 'data/timeline.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const entry = data.find(item => item.date === 'Octobre 2025');
if (entry) {
  entry.description = "Validation par le conseil municipal du montant de 617 500 € HT. L'enveloppe intègre notamment 41 000 € HT de travaux obligatoires pour le traitement du radon, et place déjà les travaux de la salle de motricité (89 000 € HT) en tranche optionnelle.";
  entry.simplifiedDescription = "Les élus votent et valident le budget initial du projet. Le montant inclut des travaux obligatoires pour protéger les enfants du radon. Pour réduire la facture, la rénovation de la salle de motricité est déjà repoussée à plus tard si les finances le permettent.";
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Updated Octobre 2025 successfully.');
} else {
  console.log('Could not find Octobre 2025 entry.');
}
