const fs = require('fs');

const path = 'data/timeline.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const entry = data.find(item => item.date === 'Avril 2026');
if (entry) {
  entry.description = "Le Trésor public confirme la capacité d'emprunt de 400 000 €. Le Sous-préfet indique qu'à 800 000 €, le projet global est trop onéreux pour prétendre à la DETR (à engager avant fin décembre 2026), et demande de le revoir à la baisse. Il confirme néanmoins que des subventions restent possibles pour un projet révisé (100 k€ Département, 60 k€ Région, et 30% de DETR). Vote d'une ligne d'urgence de 50 000 € pour le radon.";
  entry.simplifiedDescription = "Le Trésorier valide la capacité d'emprunt. L'État indique que le projet initial est trop cher pour être subventionné et demande de le réduire, mais confirme que les aides financières (Département, Région, État) restent possibles pour un projet moins coûteux.";
  entry.budget.etudes = "127 110 € HT";
  entry.budget.travaux = "À revoir à la baisse (selon préconisation)";
  entry.budget.total = "Cible globale imposée sous la barre des 800 000 €";
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Updated Avril 2026 successfully.');
} else {
  console.log('Could not find Avril 2026 entry.');
}
