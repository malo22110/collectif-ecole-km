const fs = require('fs');
let code = fs.readFileSync('app/historique/page.tsx', 'utf8');

// I need to import ShieldCheck at the top if it's not already imported in page.tsx
if (!code.includes('ShieldCheck')) {
  code = code.replace('import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info } from "lucide-react";',
                      'import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info, ShieldCheck } from "lucide-react";');
}

const targetDivEnd = `              </div>
            </div>
          </div>`;

const stressTestJSX = `

          {/* STRESS TEST */}
          <div className="mt-20 mb-12">
            <h3 className="text-2xl font-bold text-stone-900 mb-6 text-center flex items-center justify-center gap-3">
              <ShieldCheck size={28} className="text-amber-500" />
              Stress Test : La matrice des risques
            </h3>
            <p className="text-stone-600 text-center max-w-3xl mx-auto mb-10">
              L'intégration d'un scénario du pire pour chaque option permet de démontrer que l'Option 1 est non seulement la plus rentable en temps normal, mais aussi la plus résiliente face aux imprévus.
            </p>

            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl">
              <table className="w-full text-left bg-white border-collapse">
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

            <div className="mt-8 bg-stone-100 p-6 md:p-8 rounded-3xl border border-stone-200">
              <p className="text-stone-700 mb-4 leading-relaxed">
                <strong className="text-emerald-700">L'Option 1 est la seule qui survit à son propre scénario catastrophe.</strong> Même si l'État (DETR) se retire à la dernière minute, la commune conserve l'appui de la Région et du Département (159 855 €), ne jette pas les 127 110 € d'études déjà réglés, et peut absorber le reste à charge grâce à l'emprunt de 400 000 € validé par le percepteur.
              </p>
              <p className="text-stone-700 leading-relaxed">
                À l'inverse, le moindre grain de sable dans les Options 2, 3 ou 4 fait immédiatement dérailler le budget de la commune au-delà de ses capacités de financement, tout en laissant le problème sanitaire du radon non résolu.
              </p>
            </div>
          </div>`;

const replaceTarget = `              </div>
            </div>
          </div>`;

const parts = code.split(replaceTarget);
if (parts.length >= 2) {
  // we want to append stressTestJSX after the FIRST occurrence of the end of "Conclusion Financière"
  code = parts[0] + replaceTarget + stressTestJSX + parts.slice(1).join(replaceTarget);
  fs.writeFileSync('app/historique/page.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to find target");
}
