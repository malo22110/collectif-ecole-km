const fs = require('fs');
const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix Table Headers
const theadTarget = `<thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>`;

const theadReplacement = `<thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[200px]">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[220px]">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>`;

if (code.includes(theadTarget)) {
  code = code.replace(theadTarget, theadReplacement);
} else {
  // Try regex in case there's slight whitespace difference
  code = code.replace(/<th className="p-4 font-bold border-b border-stone-200 w-1\/4">/g, '<th className="p-4 font-bold border-b border-stone-200 min-w-[220px]">');
}

// 2. Add whitespace-nowrap to prices in equation
const eqTarget = `<div className="space-y-1 font-mono text-emerald-800">
                  <div className="flex justify-between"><span>Coût total du projet :</span><span>552 170 €</span></div>
                  <div className="flex justify-between text-xs text-emerald-700/70"><span>(550 000 € de travaux + 2 170 € d'avenant)</span></div>
                  <div className="flex justify-between text-emerald-600 pt-2"><span>Total des aides :</span><span>- 325 000 €</span></div>
                  <div className="flex justify-between text-xs text-emerald-600/70"><span>(160 000 € Région/Dép. + 165 000 € DETR)</span></div>
                  <div className="flex justify-between font-bold border-t border-emerald-200/60 pt-2 mt-2 text-base text-emerald-900"><span>Reste à charge réel :</span><span>= 227 170 € HT</span></div>
                </div>`;

const eqReplacement = `<div className="space-y-1 font-mono text-emerald-800 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2"><span>Coût total du projet :</span><span className="whitespace-nowrap text-right">552 170 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-700/70"><span>(550 000 € de travaux + 2 170 € d'avenant)</span></div>
                  <div className="flex justify-between gap-2 text-emerald-600 pt-2"><span>Total des aides :</span><span className="whitespace-nowrap text-right">- 325 000 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-600/70"><span>(160 000 € Région/Dép. + 165 000 € DETR)</span></div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between font-bold border-t border-emerald-200/60 pt-2 mt-2 text-base text-emerald-900"><span>Reste à charge réel :</span><span className="whitespace-nowrap text-right">= 227 170 € HT</span></div>
                </div>`;

if (code.includes(eqTarget)) {
  code = code.replace(eqTarget, eqReplacement);
}

// 3. Make the table min-w broader to fit the min-w of columns (200+300+300+220 = 1020px)
code = code.replace(/min-w-\[800px\]/g, 'min-w-[1020px]');

fs.writeFileSync(path, code);
console.log('Mobile wrapping adjustments applied.');
