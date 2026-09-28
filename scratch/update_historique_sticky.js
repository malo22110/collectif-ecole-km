import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

// 1. Remove the old toggle
const oldToggleRegex = /\{\/\* Toggle Détails \*\/\}\s*<div className="flex justify-center mb-12">\s*<div className="inline-flex bg-stone-200 p-1 rounded-full items-center">.*?<\/div>\s*<\/div>/s;
content = content.replace(oldToggleRegex, '');

// 2. Insert the sticky toggle right under the header
const headerRegex = /<\/header>/;
const stickyToggle = `</header>

      {/* Barre collante pour le toggle */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 py-3 mb-8">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
            <div className="inline-flex bg-stone-100 p-1 rounded-full items-center border border-stone-200 shadow-inner">
              <button
                onClick={() => setIsSimplified(true)}
                className={\`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 \${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
              >
                Version Courte (Résumé)
              </button>
              <button
                onClick={() => setIsSimplified(false)}
                className={\`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 \${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
              >
                Détails Complets
              </button>
            </div>
        </div>
      </div>`;

content = content.replace(headerRegex, stickyToggle);

fs.writeFileSync('app/historique/page.tsx', content);
console.log("Sticky toggle inserted!");
