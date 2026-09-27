const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Extract Historique Section
const historiqueStart = code.indexOf('{/* Section Historique & Analyse Financière */}');
const historiqueEnd = code.indexOf('{articles.length > 0 && (');

if (historiqueStart === -1 || historiqueEnd === -1) {
  console.log("Could not find Historique section boundaries.");
  process.exit(1);
}

let historiqueSection = code.substring(historiqueStart, historiqueEnd);

// Remove the label "Dossier Spécial"
const labelRegex = /<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold mb-6">[\s\S]*?Dossier Spécial\s*<\/div>/;
historiqueSection = historiqueSection.replace(labelRegex, '');

// 2. Extract Charte Section
const charteStart = code.indexOf('{/* Charte Section */}');
const charteEnd = code.indexOf('{/* Arguments Grid (Pétition focus) */}');

if (charteStart === -1 || charteEnd === -1) {
  console.log("Could not find Charte section boundaries.");
  process.exit(1);
}

const charteSection = code.substring(charteStart, charteEnd);

// 3. Remove both sections from the original code
code = code.replace(charteSection, '');
code = code.replace(historiqueSection, '');

// 4. Determine where to insert them
// Hero section ends before historiqueStart
const heroEnd = code.indexOf('</section>', code.indexOf('{/* Hero Section */}')) + '</section>'.length;

const beforeHero = code.substring(0, heroEnd);
const afterHero = code.substring(heroEnd);

// Assemble new code: Hero -> Charte -> Historique
const newCode = beforeHero + '\n\n        ' + charteSection + '\n        ' + historiqueSection + afterHero.trimStart();

fs.writeFileSync(path, newCode);
console.log('Sections reordered successfully.');

