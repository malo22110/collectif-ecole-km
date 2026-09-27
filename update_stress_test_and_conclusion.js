const fs = require('fs');

const path = 'app/historique/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. REPLACEMENT FOR STRESS TEST TABLE BODY
const tbodyTargetStart = '<tbody className="text-sm divide-y divide-stone-100">';
const tbodyTargetEnd = '</tbody>';
const tbodyStartIndex = code.indexOf(tbodyTargetStart);
const tbodyEndIndex = code.indexOf(tbodyTargetEnd, tbodyStartIndex) + tbodyTargetEnd.length;

if (tbodyStartIndex !== -1 && tbodyEndIndex !== -1) {
  const newTbody = `<tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-stone-900 mb-1">1. Optimisation APD</div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">Recommandée</span>
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Refus de la subvention DETR (État).</strong> Le dossier est déposé à temps (avant déc 2026), mais la Préfecture refuse l'aide faute de crédits.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      Perte estimée de ~150 000 €. Les 159 855 € (Région/Département) sont conservés. Les 127 110 € d'études payées sont pleinement exploités.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-emerald-700 mb-1 text-base">~380 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le projet reste sous le plafond d'emprunt (400 k€). Le bâtiment est rénové.</div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-stone-50 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 block md:table-cell">2. Refonte totale / Table rase<br/><span className="text-xs font-normal text-stone-500">(Piste de l'opposition)</span></td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Perte intégrale des financements + Pénalités.</strong> La rupture des contrats en cours entraîne l'annulation des 159 855 € d'aides acquises. Le délai DETR est raté.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      127 110 € d'études payés en pure perte (service fait). + ~4 000 € de pénalités. + ~35 000 € pour de nouvelles études. Les aides (État, Région, Département) tombent à 0 €.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-rose-600 mb-1 text-base">&gt; 500 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le plafond d'emprunt de 400 000 € est explosé juste pour financer des rustines et des études jetées.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 block md:table-cell">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Fermeture administrative + Inflation.</strong> L'abandon fige les travaux. Le délai légal de 3 ans pour le radon expire. Le Préfet ferme l'école.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      127 110 € d'études payés pour rien. Le futur projet (2030) coûtera au minimum 15 % plus cher à cause de l'inflation de la construction.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-rose-600 mb-1 text-base">&gt; 850 000 € HT</div>
                      <div className="text-stone-600 text-xs">Crise politique majeure, enfants scolarisés hors commune, finances exsangues.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors block md:table-row border-b md:border-none border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 block md:table-cell">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      <strong className="text-stone-900 block mb-1">Échec de la mise aux normes.</strong> Les 50 000 € provisionnés sont dépensés dans des rustines (dalle/VMC basique), mais les mesures radon restent &gt; 300 Bq/m³.
                    </td>
                    <td className="p-4 align-top text-stone-700 block md:table-cell">
                      Les 50 000 € sont perdus. L'État exige des travaux lourds. Aucune subvention versée car ce n'est pas une rénovation globale.
                    </td>
                    <td className="p-4 align-top block md:table-cell">
                      <div className="font-bold text-rose-600 mb-1 text-base">177 110 € HT</div>
                      <div className="text-stone-600 text-xs">De pure perte (Études + rustines). Obligation de tout recommencer à zéro.</div>
                    </td>
                  </tr>
                </tbody>`;
  
  code = code.substring(0, tbodyStartIndex) + newTbody + code.substring(tbodyEndIndex);
}

// 2. REPLACEMENT FOR CONCLUSION
const conclusionTargetStart = '<div className="space-y-4">';
const conclusionSearchStart = code.lastIndexOf(conclusionTargetStart); // because there are multiple space-y-4, but this is the last one in the file under Conclusion
const conclusionTargetEnd = '</div>\n            </div>\n          </div>\n        </div>\n      </div>';
const conclusionEndIndex = code.indexOf('</div>\n            </div>\n          </div>\n        </div>\n      </div>', conclusionSearchStart);

if (conclusionSearchStart !== -1 && conclusionEndIndex !== -1) {
  const newConclusion = `<div className="space-y-4">
                <div className="bg-stone-900 border border-stone-700 p-5 rounded-xl text-stone-300">
                  <strong className="text-rose-400 block mb-2 text-lg">Le comparatif financier (Option 1 vs Option 2)</strong>
                  <p className="mb-4">
                    L'Option 2 (Table rase de l'existant) place immédiatement la commune dans un <strong>déficit comptable de près de 290 000 € avant même d'avoir posé le moindre parpaing</strong>. En rejetant l'APD actuel (qui se concentre déjà uniquement sur le bâtiment historique), la commune est juridiquement tenue de payer les 127 110 € d'études réalisées, tout en provoquant l'annulation mécanique des 159 855 € de subventions conditionnées à ce projet précis. À cela s'ajoute l'impossibilité matérielle de monter un nouveau dossier avant la date butoir de la DETR fixée à décembre 2026. L'Option 2 n'est donc pas une économie, mais un gouffre qui obligera la commune à autofinancer à 100 % de futures réparations, <strong>saturant instantanément sa capacité d'emprunt de 400 000 €</strong>.
                  </p>
                  <p>
                    <strong className="text-emerald-400">L'Option 1 (Optimisation) est la seule stratégie qui valorise le capital déjà investi.</strong> En acceptant l'avenant de 2 170 € HT, la commune finalise les économies demandées par le Sous-préfet, valide les 127 110 € d'ingénierie passée, et sécurise un plan de financement couvert à plus de 60 % par des aides publiques. Avec un reste à charge avoisinant les 230 000 € (dont 176 000 € absorbables par l'excédent de fonctionnement de 2025), la commune obtient un outil scolaire aux normes pour les trente prochaines années, tout en préservant une large part de sa capacité d'emprunt pour les autres chantiers du mandat.
                  </p>
                </div>
                <div className="bg-stone-900 border border-stone-700 p-5 rounded-xl text-stone-300">
                  <strong className="text-emerald-400 block mb-2 text-lg">Bilan face aux imprévus</strong>
                  <p>
                    L'Option 1 est également la seule à démontrer une résilience totale face aux imprévus. Même dans l'hypothèse extrême où l'État se désengagerait au dernier moment (refus de la DETR), le maintien du projet garantit la sauvegarde des subventions régionales et départementales, maintenant le reste à charge sous le seuil d'alerte des finances communales.<br/><br/>
                    Le moindre accroc dans l'Option 2 fait au contraire dérailler le budget de la commune au-delà du soutenable, la laissant seule face au risque de fermeture administrative liée au radon.
                  </p>
                </div>
              </div>`;

  code = code.substring(0, conclusionSearchStart) + newConclusion + code.substring(conclusionEndIndex);
  fs.writeFileSync(path, code);
  console.log('Stress test table and conclusion updated successfully.');
} else {
  console.log('Error finding conclusion section bounds.');
}
