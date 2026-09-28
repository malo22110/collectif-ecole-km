import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const regex = /<div className="mt-16 bg-stone-900 rounded-3xl p-6 md:p-10 shadow-xl overflow-hidden relative">.*?(?=<div className="mt-6">)/s;

const newDesign = `<div className="mt-16 bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden relative">
            <h3 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-600" />
              Stress Test : La matrice des risques
            </h3>
            
            <div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">
              <div className="animate-pulse"><ChevronRight size={18} /></div>
              Faites glisser le tableau vers la droite
            </div>
            
            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
              <table className="w-full text-left bg-white border-collapse min-w-[1020px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[200px]">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Scénario Défavorable</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[220px]">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">1. Ajustement (550k€)</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Refus de la subvention de l'État.</strong> La Préfecture instruit le dossier mais ne verse pas l'aide faute de crédits.</td>
                    <td className="p-4 align-top text-stone-700">Perte de 180 145 €.<br/>Les 159 855 € (Région/Département) sont conservés. L'ingénierie est valorisée.</td>
                    <td className="p-4 align-top"><strong className="text-emerald-700 text-base block mb-1">~ 392 000 € HT</strong><div className="text-stone-600 text-xs">Le reste à charge frôle le plafond (400 k€), mais l'école est intégralement rénovée.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">2. Refonte totale</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Perte intégrale des financements.</strong> L'abandon des objectifs thermiques (40%) annule toutes les aides.</td>
                    <td className="p-4 align-top text-stone-700">~ 70 000 € d'études perdues<br/>+ frais de rupture<br/>+ relance d'études complètes.</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 150 000 € HT</strong><div className="text-stone-600 text-xs">Dépense à 100% à la charge de la commune.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Maintien des non-conformités.</strong> Le bâtiment reste exposé au radon.</td>
                    <td className="p-4 align-top text-stone-700">~ 70 000 € d'études payées en pure perte.<br/>Majoration future du coût des travaux (inflation).</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 74 000 € HT (immédiat)</strong><div className="text-stone-600 text-xs">Surcoûts reportés sur les exercices futurs.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Inefficacité des interventions.</strong> Les travaux isolés ne règlent pas les désordres thermiques.</td>
                    <td className="p-4 align-top text-stone-700">50 000 € de travaux<br/>+ ~ 70 000 € d'études perdues.</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">~ 120 000 € HT</strong><div className="text-stone-600 text-xs">Trésorerie absorbée sans pérenniser le bâtiment.</div></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl">
              <h4 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <Info size={24} className="text-emerald-700" />
                Conclusion Objective : Pourquoi l'Option 1 s'impose
              </h4>
              <div className="text-stone-800 space-y-4 text-sm">
                <p>Toute analyse budgétaire rigoureuse menée sur ce dossier aboutit à la même conclusion technique et financière : l'Option 1 (l'ajustement à l'enveloppe initiale de 550 000 € HT) est la seule voie viable pour la commune, pour trois raisons mathématiques et légales :</p>
                <ol className="list-decimal pl-5 space-y-3 font-medium text-stone-700">
                  <li><strong>La valorisation des dépenses engagées :</strong> La commune a déjà contracté pour environ 70 000 € d'études et de diagnostics facturables au titre du service fait à ce stade du projet. Choisir l'abandon ou la refonte revient à solder ces factures avec les impôts locaux pour obtenir un résultat matériel nul. L'Option 1 est la seule qui transforme cette dépense inéluctable en investissement utile.</li>
                  <li><strong>L'effet levier des subventions :</strong> Les 340 000 € d'aides extérieures sont strictement conditionnés à une rénovation globale générant 40 % d'économie d'énergie. Abandonner l'Avant-Projet Définitif annule mécaniquement ces aides. Faire "moins cher" en rafistolant ou "repartir de zéro" obligerait la commune à payer la totalité des futurs travaux sur ses fonds propres, ce qui saturerait instantanément sa capacité d'emprunt de 400 000 €.</li>
                  <li><strong>L'incompressibilité des normes :</strong> Le bâtiment souffre de vulnérabilités légales et sanitaires avérées (radon, accessibilité, amiante/plomb, isolation). Le saupoudrage n'est qu'un expédient temporaire. L'État finira par exiger une mise aux normes complète, obligeant la commune à relancer un projet global dans quelques années, avec des coûts d'ingénierie à repayer de zéro et des coûts de construction gonflés par l'inflation.</li>
                </ol>
                <div className="mt-6 pt-6 border-t border-emerald-200 font-bold text-emerald-800 text-base">
                  Mathématiquement, le refus de l'Option 1 revient à endetter le village pour régler des frais d'architectes et des indemnités d'abandon, tout en conservant une école qui se dégrade. À l'inverse, l'Option 1 protège les finances locales en faisant financer plus de 60 % du chantier par la Région, le Département et l'État.
                </div>
              </div>
            </div>
            `;

if (content.match(regex)) {
  content = content.replace(regex, newDesign);
  fs.writeFileSync('app/historique/page.tsx', content);
  console.log("Updated table design correctly.");
} else {
  console.log("Regex not matched!");
}
