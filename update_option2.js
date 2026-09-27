const fs = require('fs');

const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace Option 2 Card
const option2CardTarget = `<div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Refonte a minima
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Abandon de l'extension. Nouveau projet ciblé sur l'isolation et les normes urgentes.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouveaux honoraires d'études</span>
                  <span className="font-bold text-rose-600">35 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Perte sèche (études extension jetées)</span>
                  <span className="font-bold text-rose-600">~60 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Aides espérées (DETR 2026 perdue)</span>
                  <span className="font-bold text-amber-600">~80 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût des travaux</span>
                  <span className="font-bold">380 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-stone-900">Reste à charge</span>
                <span className="text-2xl font-bold text-stone-900">~335 000 € HT</span>
              </div>
            </div>`;

const option2CardReplacement = `<div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Abandon de l'APD et table rase
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Rompre les contrats, jeter 100% des plans de l'existant, et repartir de zéro pour faire du « bricolage ».
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes sèches (études jetées)</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation contractuelle</span>
                  <span className="font-bold text-rose-600">~4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouvelles études + Travaux radon</span>
                  <span className="font-bold text-rose-600">~80 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions (Région, Dép, État)</span>
                  <span className="font-bold text-amber-600">0 € (Perdues)</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900 leading-tight">Reste à charge<br/><span className="text-[10px] font-normal">(dont 131k€ pure perte)</span></span>
                <span className="text-2xl font-bold text-rose-600">~211 110 €</span>
              </div>
            </div>`;


// Replace Option 2 Stress Test Row
const option2StressTarget = `<tr className="hover:bg-stone-50 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 block md:table-cell">2. Refonte partielle</td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Annulation des aides acquises + Surcoût technique.</strong> Région et Département jugent que l'abandon de l'extension dénature trop le projet initial et annulent les 159 855 €.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      Perte de 160 000 € d'aides. Les nouvelles études (35 000 €) révèlent des surcoûts d'adaptation sur l'ancien bâtiment.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-rose-600 mb-1 text-base">~540 000 € HT</div>
                      <div className="text-stone-600 text-xs">La commune explose son plafond de 400 000 €.</div>
                    </td>
                  </tr>`;

const option2StressReplacement = `<tr className="hover:bg-stone-50 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 block md:table-cell">2. Abandon de l'APD et table rase</td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Annulation de plein droit des aides acquises.</strong> Casser l'APD (rénovation globale) pour des travaux isolés annule les 159 855 €. La DETR n'est plus déposée dans les temps.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      La commune doit décaisser plus de 130 000 € HT (études jetées + pénalités) en pure perte, perd 310 000 € d'aides (État/Région), et autofinance 100% des futures rustines sanitaires.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-rose-600 mb-1 text-base">~211 110 € HT</div>
                      <div className="text-stone-600 text-xs">Paiement 100% par la commune. Résultat technique (isolation, confort) nul.</div>
                    </td>
                  </tr>`;

if (!code.includes('Abandon de l\'APD et table rase')) {
  code = code.replace(option2CardTarget, option2CardReplacement);
  code = code.replace(option2StressTarget, option2StressReplacement);
  fs.writeFileSync(path, code);
  console.log('Option 2 updated successfully.');
} else {
  console.log('Option 2 already updated.');
}
