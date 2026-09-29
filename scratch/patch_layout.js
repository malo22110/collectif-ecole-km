const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');
code = code.replace(
  '        {/* RENDU DES BLOCS (CMS) */}',
  '      </div>\n\n      <div className="w-full">\n        {/* RENDU DES BLOCS (CMS) */}'
);
code = code.replace(
  '        {/* BOUTON COMMENTAIRE GLOBAL */}',
  '      </div>\n\n      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">\n        {/* BOUTON COMMENTAIRE GLOBAL */}'
);
fs.writeFileSync('app/historique/page.tsx', code);
