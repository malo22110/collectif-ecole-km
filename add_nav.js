const fs = require('fs');

function addFaqNav(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');

  // For app/page.tsx
  const target1 = '<a href="/historique" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:flex items-center gap-1.5"><Search size={16} /> Historique & Analyse</a>';
  const newLink1 = '<a href="/faq" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">FAQ</a>\n            ' + target1;
  
  if (code.includes(target1) && !code.includes('href="/faq"')) {
    code = code.replace(target1, newLink1);
  }

  // Also import HelpCircle maybe? Not used in page.tsx header though.

  fs.writeFileSync(filepath, code);
}

addFaqNav('app/page.tsx');
addFaqNav('app/historique/page.tsx');
addFaqNav('app/actualites/page.tsx');

console.log("Success add nav");
