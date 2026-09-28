import fs from 'fs';

const content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const regex = /\{\/\* ENJEUX FINANCIERS \*\/\}.*?<\/div>[\s]*<\/div>/s;
const match = content.match(regex);
if (match) {
  console.log("Found ENJEUX FINANCIERS");
} else {
  console.log("NOT FOUND");
}
