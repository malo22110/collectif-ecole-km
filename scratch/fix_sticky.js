import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

// The current code has:
//       </header>
// 
//       {/* Barre collante pour le toggle */}
//       <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 py-3 mb-8">
//         <div className="max-w-5xl mx-auto px-4 flex justify-center">
//             <div className="inline-flex bg-stone-100 p-1 rounded-full items-center border border-stone-200 shadow-inner">
//               <button
//                 onClick={() => setIsSimplified(true)}
//                 className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
//               >
//                 Version Courte (Résumé)
//               </button>
//               <button
//                 onClick={() => setIsSimplified(false)}
//                 className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
//               >
//                 Détails Complets
//               </button>
//             </div>
//         </div>
//       </div>

// Let's replace the `</header>` and the sticky bar with a new block inside the header.
const regex = /<\/header>\s*\{\/\* Barre collante pour le toggle \*\/\}\s*<div className="sticky top-16 z-30 bg-white\/80 backdrop-blur-md border-b border-stone-200 py-3 mb-8">\s*<div className="max-w-5xl mx-auto px-4 flex justify-center">\s*<div className="inline-flex bg-stone-100 p-1 rounded-full items-center border border-stone-200 shadow-inner">\s*<button\s*onClick=\{\(\) => setIsSimplified\(true\)\}\s*className=\{`px-6 py-1\.5 rounded-full text-sm font-bold transition-all duration-200 \$\{isSimplified \? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'\}`\}\s*>\s*Version Courte \(Résumé\)\s*<\/button>\s*<button\s*onClick=\{\(\) => setIsSimplified\(false\)\}\s*className=\{`px-6 py-1\.5 rounded-full text-sm font-bold transition-all duration-200 \$\{!isSimplified \? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'\}`\}\s*>\s*Détails Complets\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `
        {/* Toggle intégré au header pour garantir qu'il soit sticky */}
        <div className="bg-stone-50/95 backdrop-blur-md border-t border-stone-200 py-2">
          <div className="max-w-5xl mx-auto px-4 flex justify-center">
            <div className="inline-flex bg-stone-200/50 p-1 rounded-full items-center border border-stone-200 shadow-inner">
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
        </div>
      </header>
      
      {/* Spacer to prevent content from hiding under the new taller header */}
      <div className="h-8"></div>
`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('app/historique/page.tsx', content);
  console.log("Sticky header fixed!");
} else {
  console.log("Could not find the sticky bar pattern.");
}
