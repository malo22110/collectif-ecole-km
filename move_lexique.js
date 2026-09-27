const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const lexiqueRegex = /<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">[\s\S]*?<\/section>/;
const lexiqueMatch = code.match(lexiqueRegex);

if (lexiqueMatch) {
  const lexiqueBlock = lexiqueMatch[0];
  
  // Remove it from the bottom
  code = code.replace(lexiqueRegex, '');

  // Modify the lexiqueBlock styling slightly so it fits the intro container (no big gray section padding)
  const newLexiqueBlock = lexiqueBlock
    .replace('<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">', '<div className="mb-12">')
    .replace('</section>', '</div>')
    .replace('<h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">', '<h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center justify-center md:justify-start gap-2">')
    .replace('<div className="max-w-4xl mx-auto px-4">', '<div className="text-left">');

  // Insert before {/* ENJEUX FINANCIERS */}
  code = code.replace('{/* ENJEUX FINANCIERS */}', newLexiqueBlock + '\n\n        {/* ENJEUX FINANCIERS */}');
  
  fs.writeFileSync(path, code);
  console.log('Lexique moved successfully.');
} else {
  console.log('Lexique not found.');
}

