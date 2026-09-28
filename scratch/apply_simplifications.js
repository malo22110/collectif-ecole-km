import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

// 1. Wrap the financial details boxes in {!isSimplified && ... }
content = content.replace(/<div className="space-y-3 mb-6">/g, '{!isSimplified && (\n              <div className="space-y-3 mb-6">');
content = content.replace(/<\/div>\s*<div className="pt-4 border-t/g, '</div>\n              )}\n              <div className="pt-4 border-t');

// 2. Wrap the stress test matrix in {!isSimplified ? (...) : (...)}
const stressTestRegex = /(<div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">[\s\S]*?<\/table>\s*<\/div>)/;
content = content.replace(stressTestRegex, `{!isSimplified ? (
              <>
                $1
              </>
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-stone-700 text-center text-lg">
                <p>La matrice complète des risques démontre que l'<strong>Option 1 (L'ajustement)</strong> est la seule stratégie qui évite les surcoûts explosifs, sécurise le calendrier des travaux et garantit la santé des enfants sans perdre les 340 000 € de subventions.</p>
              </div>
            )}`);

fs.writeFileSync('app/historique/page.tsx', content);
console.log("Simplifications applied!");
