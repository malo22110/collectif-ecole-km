const fs = require('fs');
const path = 'app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Boundaries for Historique
const historiqueStart = code.indexOf('{/* Section Historique & Analyse Financière */}');
const historiqueEnd = code.indexOf('{articles.length > 0 && (');
const originalHistoriqueSection = code.substring(historiqueStart, historiqueEnd);

// Boundaries for Charte
const charteStart = code.indexOf('{/* Charte Section */}');
const charteEnd = code.indexOf('{/* Arguments Grid (Pétition focus) */}');
const originalCharteSection = code.substring(charteStart, charteEnd);

// 1. Remove from code
code = code.replace(originalCharteSection, '');
code = code.replace(originalHistoriqueSection, '');

// 2. Modify Historique
const labelRegex = /<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold mb-6">[\s\S]*?Dossier Spécial\s*<\/div>/;
let newHistoriqueSection = originalHistoriqueSection.replace(labelRegex, '');

// 3. Find insertion point (end of Hero)
const heroEnd = code.indexOf('</section>', code.indexOf('{/* Hero Section */}')) + '</section>'.length;
const beforeHero = code.substring(0, heroEnd);
const afterHero = code.substring(heroEnd);

// 4. Assemble: Hero -> Charte -> Historique
const newCode = beforeHero + '\n\n        ' + originalCharteSection + '\n        ' + newHistoriqueSection + afterHero.trimStart();

fs.writeFileSync(path, newCode);
console.log('Reordered safely!');
