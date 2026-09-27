const fs = require('fs');

let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// Fix the Option Recommandée badge
const badgeTarget = `<div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold px-6 py-2 rounded-bl-2xl">
              Option Recommandée
            </div>`;
const badgeReplacement = `<div className="md:absolute md:top-0 md:right-0 bg-emerald-500 text-white font-bold px-4 py-1.5 md:px-6 md:py-2 md:rounded-bl-2xl rounded-lg inline-block mb-4 md:mb-0 text-sm shadow-sm">
              Option Recommandée
            </div>`;

code = code.replace(badgeTarget, badgeReplacement);

// Fix the Stress Test table for mobile
const tableTarget = `<div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
              <table className="w-full text-left bg-white border-collapse min-w-[800px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-stone-900 mb-1">1. Optimisation APD</div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Recommandée</span>
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Refus de la subvention DETR (État).</strong> Le dossier est déposé à temps (avant déc 2026), mais la Préfecture refuse l'aide faute de crédits.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte estimée de ~150 000 €. Les 159 855 € (Région/Département) sont conservés.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-emerald-700 mb-1">~380 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le projet reste sous le plafond d'emprunt (400k€). Le bâtiment est rénové.</div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">2. Refonte partielle</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Annulation des aides acquises + Surcoût technique.</strong> Région et Département jugent que l'abandon de l'extension dénature trop le projet initial et annulent les 159 855 €.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte de 160 000 € d'aides. Les nouvelles études (35 000 €) révèlent des surcoûts d'adaptation sur l'ancien bâtiment.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">~540 000 € HT</div>
                      <div className="text-stone-600 text-xs">La commune explose son plafond de 400 000 €.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">3. Ne rien faire (Fermeture)</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Poursuites légales et obligation de mise aux normes.</strong> L'inspection du travail ou la Préfecture ordonne la fermeture pour mise en danger (radon, sécurité).
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Les 127 110 € d'études sont une pure perte. Obligation de réaliser des travaux de mise aux normes en urgence sans aucune subvention.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">Fermeture + Pure perte</div>
                      <div className="text-stone-600 text-xs">Au moins 127 110 € gaspillés pour absolument rien.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Effet "Subvention Zéro".</strong> Les petits travaux de colmatage ne rentrent pas dans les critères de rénovation globale. 
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Annulation immédiate des 160 000 € d'aides acquises. Le coût des travaux d'urgence repose 100% sur la commune.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">~177 000 € HT</div>
                      <div className="text-stone-600 text-xs">A payé 177 000 € pour garder un bâtiment vétuste et mal isolé.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>`;

const tableReplacement = `<div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">
              {/* Petite flèche animée pour inciter au scroll */}
              <div className="animate-bounce-x"><ChevronRight size={18} /></div>
              Faites glisser le tableau vers la droite
            </div>
            
            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12 bg-white">
              <table className="w-full text-left bg-white border-collapse min-w-[800px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-stone-900 mb-1">1. Optimisation APD</div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">Recommandée</span>
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      <strong className="text-stone-900 block mb-1">Refus de la subvention DETR (État).</strong> Le dossier est déposé à temps (avant déc 2026), mais la Préfecture refuse l'aide faute de crédits.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte estimée de ~150 000 €. Les 159 855 € (Région/Département) sont conservés.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-emerald-700 mb-1 text-base">~380 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le projet reste sous le plafond d'emprunt (400k€). Le bâtiment est rénové.</div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">2. Refonte partielle</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong className="text-stone-900 block mb-1">Annulation des aides acquises + Surcoût technique.</strong> Région et Département jugent que l'abandon de l'extension dénature trop le projet initial et annulent les 159 855 €.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte de 160 000 € d'aides. Les nouvelles études (35 000 €) révèlent des surcoûts d'adaptation sur l'ancien bâtiment.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1 text-base">~540 000 € HT</div>
                      <div className="text-stone-600 text-xs">La commune explose son plafond de 400 000 €.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">3. Ne rien faire (Fermeture)</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong className="text-stone-900 block mb-1">Poursuites légales et obligation de mise aux normes.</strong> L'inspection du travail ou la Préfecture ordonne la fermeture pour mise en danger (radon, sécurité).
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Les 127 110 € d'études sont une pure perte. Obligation de réaliser des travaux de mise aux normes en urgence sans aucune subvention.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1 text-base">Fermeture + Pure perte</div>
                      <div className="text-stone-600 text-xs">Au moins 127 110 € gaspillés pour absolument rien.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong className="text-stone-900 block mb-1">Effet "Subvention Zéro".</strong> Les petits travaux de colmatage ne rentrent pas dans les critères de rénovation globale. 
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Annulation immédiate des 160 000 € d'aides acquises. Le coût des travaux d'urgence repose 100% sur la commune.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1 text-base">~177 000 € HT</div>
                      <div className="text-stone-600 text-xs">La commune paye 177 000 € pour garder un bâtiment vétuste et mal isolé.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>`;

if (!code.includes('animate-bounce-x')) {
  code = code.replace(tableTarget, tableReplacement);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log('UI updated for stress test mobile view.');
} else {
  console.log('Already updated stress test');
}
