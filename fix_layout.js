const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

const targetStart = '{/* ANALYSE GLOBALE */}';
const targetEnd = '<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">';

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

const newAnalyse = `        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Analyse Comparative Détaillée</h2>
          <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10">
            Évaluation financière des 4 options stratégiques basée sur les capacités réelles de la commune (emprunt de 400 000 € validé par le Trésor public, excédent 2025 de 176 103 €) et les exigences de subvention de l'État.
          </p>
          
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold px-6 py-2 rounded-bl-2xl">
              Option Recommandée
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
              <CheckCircle size={28} className="text-emerald-500" />
              Option 1 : Optimisation de l'APD (Projet Révisé)
            </h3>
            <p className="text-stone-600 mb-6">
              Conserver l'Avant-Projet Définitif actuel en le révisant à la baisse (conservation des menuiseries, dalle béton simple, réseau SCIC Koad COB), pour rester sous la barre des 800 000 € demandée par le Sous-préfet.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Dépenses & Pertes</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Travaux révisés Phase 1</span>
                  <span className="font-bold">550 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Avenant d'architecte (coût de la décision)</span>
                  <span className="font-bold text-rose-600">+ 2 170 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Études antérieures gâchées (perte sèche)</span>
                  <span className="font-bold text-emerald-600">0 €</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (Avant déc. 2026)</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région</span>
                  <span className="font-bold text-emerald-600">160 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">DETR État (30% de 550k€)</span>
                  <span className="font-bold text-emerald-600">165 000 €</span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-emerald-900 font-bold mb-1">Bilan net pour la commune</div>
                <div className="text-sm text-emerald-800">
                  Le reste à charge (227k€) est couvert à 75% par l'excédent 2025 (176k€). L'emprunt résiduel n'est que de ~51 000 €.
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-700 whitespace-nowrap">
                227 170 € HT
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
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
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <XCircle size={24} className="text-rose-500" />
                Option 3 : Abandon Total
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Geler l'opération, perdre l'ingénierie payée et repousser à la prochaine mandature.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation architecte</span>
                  <span className="font-bold text-rose-600">~4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Ingénierie facturée pour service fait</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions annulées</span>
                  <span className="font-bold text-rose-600">- 159 855 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût d'un futur projet (2030)</span>
                  <span className="font-bold">&gt; 800 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Argent jeté sans travaux</span>
                <span className="text-2xl font-bold text-rose-600">131 110 € HT</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-500" />
                Option 4 : Le Saupoudrage
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Mise aux normes stricte (radon, élec) sans vision thermique ni pédagogique. Effet "Subvention Zéro".
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Travaux d'urgence (Budget 2026)</span>
                  <span className="font-bold text-rose-600">50 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes sèches (Études jetées)</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions (Non éligible)</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Futurs travaux inévitables</span>
                  <span className="font-bold">&gt; à chiffrer</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Coût net (Rafistolage)</span>
                <span className="text-2xl font-bold text-rose-600">177 110 € HT</span>
              </div>
            </div>
          </div>

          {/* STRESS TEST */}
          <div className="mt-20 mb-12">
            <h3 className="text-2xl font-bold text-stone-900 mb-6 text-center flex items-center justify-center gap-3">
              <ShieldCheck size={28} className="text-amber-500" />
              Stress Test : La matrice des risques
            </h3>
            <p className="text-stone-600 text-center max-w-3xl mx-auto mb-10">
              L'intégration d'un scénario du pire pour chaque option permet de démontrer que l'Option 1 est non seulement la plus rentable en temps normal, mais aussi la plus résiliente face aux imprévus.
            </p>

            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
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
                      <div className="font-bold text-rose-600 mb-1">&gt; 450 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le plafond d'emprunt de 400 000 € est explosé. La commune bloque ses autres investissements.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Fermeture administrative + Inflation.</strong> L'abandon fige les travaux. Le délai légal de 3 ans pour le radon expire. Le Préfet ferme l'école.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      127 110 € d'études payés pour rien. Le futur projet (2030) coûtera au minimum 15% plus cher à cause de l'inflation.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">&gt; 850 000 € HT</div>
                      <div className="text-stone-600 text-xs">Crise politique majeure, enfants scolarisés hors commune, finances exsangues.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">4. Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Échec de la mise aux normes.</strong> Les 50 000 € sont dépensés dans des rustines (dalle/VMC basique), mais les mesures radon restent supérieures à 300 Bq/m³.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Les 50 000 € sont perdus. L'État exige des travaux lourds. Aucune subvention versée car ce n'est pas une rénovation globale.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">177 110 € HT</div>
                      <div className="text-stone-600 text-xs">De pure perte (Études + rustines). Obligation de tout recommencer à zéro.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-stone-800 text-stone-100 p-8 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg">
              <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Conclusion Financière & Résilience
              </h4>
              <div className="space-y-4">
                <p>
                  L'Option 1 est l'unique trajectoire rationnelle sur le plan comptable. Refuser l'avenant de 2 170 € HT pour ajuster les plans détruit mécaniquement <strong>127 110 €</strong> d'études déjà réalisées au titre du "service fait", et rend caduques plus de <strong>300 000 € d'aides</strong> de l'État, de la Région et du Département.
                </p>
                <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl text-stone-300">
                  <strong className="text-rose-400 block mb-1">Le comparatif fatal (Option 4 vs Option 1) :</strong>
                  Avec le "saupoudrage" (Option 4), la commune sort <strong>177 000 €</strong> de sa trésorerie pour ne récolter qu'une passoire thermique rafistolée, sans régler le problème de fond, en perdant 160 000 € d'aides à tout jamais.<br/><br/>
                  Avec l'Option 1 (Optimisation), la commune sort <strong>227 000 €</strong> (dont 176k€ financés par l'excédent 2025). Pour une différence d'à peine 50 000 € par rapport au rafistolage toxique, la commune obtient un bâtiment totalement rénové, aux normes pour 30 ans, et économe en chauffage.
                </div>
                <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl text-stone-300">
                  <strong className="text-amber-400 block mb-1">Bilan face aux imprévus :</strong>
                  <strong className="text-emerald-400">L'Option 1 est la seule qui survit à son propre scénario catastrophe.</strong> Même si l'État (DETR) se retire à la dernière minute, la commune conserve l'appui de la Région et du Département (159 855 €), ne jette pas les 127 110 € d'études déjà réglés, et peut absorber le reste à charge grâce à l'emprunt de 400 000 € validé par le percepteur.<br/><br/>
                  À l'inverse, le moindre grain de sable dans les Options 2, 3 ou 4 fait immédiatement dérailler le budget de la commune au-delà de ses capacités de financement, tout en laissant le problème sanitaire du radon non résolu.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      `;

code = code.substring(0, startIndex) + newAnalyse + code.substring(endIndex);
fs.writeFileSync('app/historique/page.tsx', code);
console.log("Success rewrite");
