import fs from 'fs';
const content = fs.readFileSync('app/historique/page.tsx', 'utf8');
const startIndex = content.indexOf('{/* ANALYSE GLOBALE */}');
const endIndex = content.indexOf('{/* LEXIQUE */}');
if (startIndex !== -1 && endIndex !== -1) {
  fs.writeFileSync('scratch/analyse.txt', content.substring(startIndex, endIndex));
  console.log("Extracted analysis block.");
} else {
  console.log("Could not find the bounds.");
}
