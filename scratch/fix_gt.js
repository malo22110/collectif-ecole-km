import fs from 'fs';

const files = [
  'app/historique/page.tsx',
  'app/petition/page.tsx',
  'app/espace-membre/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/> 70 000 €/g, "plus de 70 000 €");
  content = content.replace(/> 70k€/g, "plus de 70k€");
  fs.writeFileSync(file, content);
}
console.log("Fixed JSX syntax errors.");
