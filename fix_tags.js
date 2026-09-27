const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Replace the mess before <section> with a single </div>
code = code.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">/g,
  '</div>\n    <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">'
);

fs.writeFileSync('app/historique/page.tsx', code);
