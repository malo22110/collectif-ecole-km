const fs = require('fs');
let timeline = JSON.parse(fs.readFileSync('data/timeline.json', 'utf8'));

timeline[0].produits = ["Mission AMO ADAC actée", "Programme fonctionnel initial (3 classes, BCD, sanitaires)"];
timeline[0].conservable = true;

timeline[1].produits = ["Accord écrit de l'Architecte des Bâtiments de France (ABF) pour l'extension"];
timeline[1].conservable = false; // The ABF agreement is specific to this architectural plan (extension)

timeline[2].produits = ["Contrat de Maîtrise d'œuvre (68 750 € HT)", "Diagnostics géomètre", "Diagnostics amiante/radon", "Diagnostics structurels"];
timeline[2].conservable = true; // Diags are generally conservable for the existing building

timeline[3].produits = ["Arrêtés de subventions Département (99 405 €) et Région (60 450 €)"];
timeline[3].conservable = false; // Tied to the specific project

timeline[4].produits = ["Avant-Projet Sommaire (APS)", "Plans de masse et esquisses", "Études thermiques (ALECOB/ACTEE+)"];
timeline[4].conservable = false; // Tailor-made for this project

timeline[5].produits = ["Avant-Projet Définitif (APD)", "Coupes détaillées", "Allotissement et chiffrage des 2 phases"];
timeline[5].conservable = false; // Completely lost if project changes

fs.writeFileSync('data/timeline.json', JSON.stringify(timeline, null, 2));
