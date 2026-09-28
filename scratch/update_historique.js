import fs from 'fs';

let content = fs.readFileSync('app/historique/page.tsx', 'utf8');

const enjeuxHTML = `
        {/* ENJEUX FINANCIERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">
            <TrendingDown className="text-emerald-600" />
            Aperçu des enjeux financiers
          </h2>
          <div className="space-y-6">
            
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0"><AlertCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">🔎 Zoom Financier : Comprendre les 127 110 € d'études et le risque de perte réelle (70 000 €)</strong>
                <p className="text-stone-600 text-sm mb-3">
                  Il est crucial de clarifier les chiffres liés aux études d'ingénierie pour sortir des approximations. Trois montants différents existent, ils sont tous justes mais ne correspondent pas à la même chose :
                </p>
                <ul className="space-y-3 text-sm text-stone-600 list-none pl-0">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <div>
                      <strong>127 110 € HT (Le montant provisionné dans les PV)* :</strong> C'est la somme historique annoncée et figée dans les conseils municipaux à partir de septembre 2025. Elle représente l'enveloppe globale que la mairie a budgétée à ce moment-là. <em>(C'est ce chiffre avec un astérisque qui figure dans la frise chronologique ci-dessous par souci de fidélité aux PV).</em>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <div>
                      <strong>133 533 € HT (Le détail réel jusqu'à la fin du chantier) :</strong> C'est le coût total exhaustif de toutes les études si le projet va à son terme. L'analyse des devis montre que cette somme, bien qu'impressionnante (24 % des travaux), est incontournable :
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-stone-500">
                        <li><em>Obligations légales et sécurité (25 622 €) :</em> diagnostics amiante/plomb, géotechnique, radon, sécurité SPS, bureau de contrôle.</li>
                        <li><em>Conception et pilotage (87 600 €) :</em> Architectes, bureaux d'études fluides/structure (60 500 €) et AMO Kerlotec (27 100 €).</li>
                        <li><em>Passeport stratégique (19 200 €) :</em> Démarche Bâtiment Durable Breton (BDB), exigée pour débloquer les 60 450 € de la Région.</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <div>
                      <strong>~ 70 000 € HT (Le risque de perte sèche immédiate) :</strong> C'est le montant des prestations <em>effectivement réalisées à ce jour</em> (stade APD). Si la mairie annule le projet demain, elle ne paiera pas 133 000 €, mais elle devra obligatoirement payer ces 70 000 € au titre du "service fait" (diagnostics achevés, AMO, honoraires d'architectes dus à l'étape APD s'élevant à environ 19 438 €). <strong>C'est cet argent qui sera jeté par les fenêtres en cas d'abandon.</strong>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><CheckCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">Subventions actées ou déposées : 340 000 €</strong>
                <p className="text-stone-600 text-sm mb-2">Le plan de financement repose sur trois leviers exigeant une rénovation globale (baisse de 40 % de la consommation d'énergie) :</p>
                <ul className="space-y-2 text-sm text-stone-600 list-disc pl-5">
                  <li><strong>Département des Côtes-d'Armor (Sécurisé) : 99 405 €</strong></li>
                  <li><strong>Région Bretagne (Sécurisé sous condition) : 60 450 €</strong> (Conditionné à la démarche BDB abordée plus haut).</li>
                  <li><strong>État - DETR / DSIL (Dossier déposé) : 180 145 €</strong> (Dossier n° 21386559 basé sur le projet ciblé à 550 000 € HT).</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0"><BookOpen size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">L'évolution de l'estimation de la maîtrise d'œuvre (APD) : 735 489,05 € HT</strong>
                <p className="text-stone-600 text-sm">Alors que la commande initiale visait un projet à 550 000 € HT, les chiffrages successifs de l'Avant-Projet Définitif (APD) ont atteint 735 489 € HT (615 278 € pour la Phase 1 et 120 210 € pour la Phase 2), nécessitant le recadrage budgétaire actuel.</p>
              </div>
            </div>
          </div>
          <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
`;

const analyseHTML = `
        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Analyse Comparative Détaillée</h2>
          <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10">
            Évaluation financière des 4 options stratégiques basée sur la capacité d'emprunt de 400 000 € et les obligations de subventions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col h-full md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold px-4 py-1.5 md:px-6 md:py-2 rounded-bl-2xl text-sm shadow-sm">
                Recommandée
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <CheckCircle size={24} className="text-emerald-500" />
                Option 1 : L'ajustement (550 000 €)
              </h3>
              <p className="text-sm text-stone-600 mb-6 flex-grow">
                L'avenant de 2 170 € permet d'intégrer les modifications techniques visant à ramener le coût des travaux au budget de 550 000 € HT déposé en Préfecture.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Travaux révisés Phase 1</span>
                  <span className="font-bold">~ 550 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Avenant technique</span>
                  <span className="font-bold text-rose-600">+ 2 170 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Études gâchées</span>
                  <span className="font-bold text-emerald-600">0 €</span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between text-sm">
                  <span className="text-stone-600 font-bold">Sous-total Dépenses</span>
                  <span className="font-bold text-stone-900">552 170 €</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-stone-600">Département & Région</span>
                  <span className="font-bold text-emerald-600">159 855 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">DETR État</span>
                  <span className="font-bold text-emerald-600">180 145 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-emerald-200 flex items-center justify-between bg-emerald-50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 mt-2">
                <span className="text-lg font-black text-emerald-900">Reste à charge</span>
                <span className="text-2xl font-black text-emerald-700">212 170 € HT</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Refonte totale
              </h3>
              <p className="text-sm text-stone-600 mb-6 flex-grow">
                Résiliation des contrats en cours et relance d'un nouveau projet réduit.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes (Service fait facturable)</span>
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation</span>
                  <span className="font-bold text-rose-600">~ 4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouvelles études + Travaux</span>
                  <span className="font-bold text-rose-600">~ 80 000 € min.</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                  <span className="text-stone-600">Subventions</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between mt-auto">
                <span className="text-sm font-bold text-amber-900">Reste à charge</span>
                <span className="text-xl font-bold text-amber-600">~ 154 000 € HT min.</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <XCircle size={24} className="text-rose-500" />
                Option 3 : Abandon de l'opération
              </h3>
              <p className="text-sm text-stone-600 mb-6 flex-grow">
                Gel total des travaux et report à une date indéterminée.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes (Service fait facturable)</span>
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation</span>
                  <span className="font-bold text-rose-600">~ 4 000 €</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                  <span className="text-stone-600">Subventions</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between mt-auto">
                <span className="text-sm font-bold text-rose-900">Reste à charge immédiat</span>
                <span className="text-xl font-bold text-rose-600">~ 74 000 € HT</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-500" />
                Option 4 : Le Saupoudrage
              </h3>
              <p className="text-sm text-stone-600 mb-6 flex-grow">
                Travaux d'urgence (radon, électricité) sans traitement de l'enveloppe thermique.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Travaux d'urgence</span>
                  <span className="font-bold text-rose-600">50 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes (Études abandonnées)</span>
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                  <span className="text-stone-600">Subventions</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between mt-auto">
                <span className="text-sm font-bold text-rose-900">Coût net</span>
                <span className="text-xl font-bold text-rose-600">~ 120 000 € HT</span>
              </div>
            </div>
          </div>
          <CommentBadge topic="Options de financement" count={commentCounts["Options de financement"] || 0} onOpen={() => setActiveTopic("Options de financement")} />

          <div className="mt-16 bg-stone-900 rounded-3xl p-6 md:p-10 shadow-xl overflow-hidden relative">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-400" />
              Stress Test : La matrice des risques
            </h3>
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-stone-700 text-stone-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-bold">Option</th>
                    <th className="p-4 font-bold">Scénario Défavorable</th>
                    <th className="p-4 font-bold">Impact Financier</th>
                    <th className="p-4 font-bold">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-stone-300">
                  <tr className="border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
                    <td className="p-4 font-bold text-white align-top">1. Ajustement (550k€)</td>
                    <td className="p-4 align-top"><strong>Refus de la subvention de l'État.</strong> La Préfecture instruit le dossier mais ne verse pas l'aide faute de crédits.</td>
                    <td className="p-4 align-top">Perte de 180 145 €.<br/>Les 159 855 € (Région/Département) sont conservés. L'ingénierie est valorisée.</td>
                    <td className="p-4 align-top"><strong className="text-white text-lg block mb-1">~ 392 000 € HT</strong>Le reste à charge frôle le plafond (400 k€), mais l'école est intégralement rénovée.</td>
                  </tr>
                  <tr className="border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
                    <td className="p-4 font-bold text-white align-top">2. Refonte totale</td>
                    <td className="p-4 align-top"><strong>Perte intégrale des financements.</strong> L'abandon des objectifs thermiques (40%) annule toutes aides.</td>
                    <td className="p-4 align-top">~ 70 000 € d'études perdues<br/>+ frais de rupture<br/>+ relance d'études complètes.</td>
                    <td className="p-4 align-top"><strong className="text-rose-400 text-lg block mb-1">&gt; 150 000 € HT</strong>Dépense à 100% à la charge de la commune.</td>
                  </tr>
                  <tr className="border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
                    <td className="p-4 font-bold text-white align-top">3. Abandon total</td>
                    <td className="p-4 align-top"><strong>Maintien des non-conformités.</strong> Le bâtiment reste exposé au radon.</td>
                    <td className="p-4 align-top">~ 70 000 € d'études payées en pure perte.<br/>Majoration future du coût des travaux (inflation).</td>
                    <td className="p-4 align-top"><strong className="text-rose-400 text-lg block mb-1">&gt; 74 000 € HT (immédiat)</strong>Surcoûts reportés sur les exercices futurs.</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50 transition-colors">
                    <td className="p-4 font-bold text-white align-top">4. Le Saupoudrage</td>
                    <td className="p-4 align-top"><strong>Inefficacité des interventions.</strong> Les travaux isolés ne règlent pas les désordres thermiques.</td>
                    <td className="p-4 align-top">50 000 € de travaux<br/>+ ~ 70 000 € d'études perdues.</td>
                    <td className="p-4 align-top"><strong className="text-rose-400 text-lg block mb-1">~ 120 000 € HT</strong>Trésorerie absorbée sans pérenniser le bâtiment.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-stone-800/50 border border-stone-700 p-6 md:p-8 rounded-2xl">
              <h4 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Info size={24} />
                Conclusion Objective : Pourquoi l'Option 1 s'impose
              </h4>
              <div className="text-stone-300 space-y-4">
                <p>Toute analyse budgétaire rigoureuse menée sur ce dossier aboutit à la même conclusion technique et financière : l'Option 1 (l'ajustement à l'enveloppe initiale de 550 000 € HT) est la seule voie viable pour la commune, pour trois raisons mathématiques et légales :</p>
                <ol className="list-decimal pl-5 space-y-3 font-medium text-stone-200">
                  <li><strong>La valorisation des dépenses engagées :</strong> La commune a déjà contracté pour environ 70 000 € d'études et de diagnostics facturables au titre du service fait à ce stade du projet. Choisir l'abandon ou la refonte revient à solder ces factures avec les impôts locaux pour obtenir un résultat matériel nul. L'Option 1 est la seule qui transforme cette dépense inéluctable en investissement utile.</li>
                  <li><strong>L'effet levier des subventions :</strong> Les 340 000 € d'aides extérieures sont strictement conditionnés à une rénovation globale générant 40 % d'économie d'énergie. Abandonner l'Avant-Projet Définitif annule mécaniquement ces aides. Faire "moins cher" en rafistolant ou "repartir de zéro" obligerait la commune à payer la totalité des futurs travaux sur ses fonds propres, ce qui saturerait instantanément sa capacité d'emprunt de 400 000 €.</li>
                  <li><strong>L'incompressibilité des normes :</strong> Le bâtiment souffre de vulnérabilités légales et sanitaires avérées (radon, accessibilité, amiante/plomb, isolation). Le saupoudrage n'est qu'un expédient temporaire. L'État finira par exiger une mise aux normes complète, obligeant la commune à relancer un projet global dans quelques années, avec des coûts d'ingénierie à repayer de zéro et des coûts de construction gonflés par l'inflation.</li>
                </ol>
                <div className="mt-6 pt-6 border-t border-stone-700 font-bold text-emerald-300">
                  Mathématiquement, le refus de l'Option 1 revient à endetter le village pour régler des frais d'architectes et des indemnités d'abandon, tout en conservant une école qui se dégrade. À l'inverse, l'Option 1 protège les finances locales en faisant financer plus de 60 % du chantier par la Région, le Département et l'État.
                </div>
              </div>
            </div>
            <div className="mt-6">
              <CommentBadge topic="Stress Test (Risques)" count={commentCounts["Stress Test (Risques)"] || 0} onOpen={() => setActiveTopic("Stress Test (Risques)")} />
            </div>
          </div>
        </div>
      </div>
`;

const lexiqueHTML = `
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Petit Lexique pour tout comprendre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">AMO (Assistant à Maîtrise d'Ouvrage)</h3>
              <p className="text-sm text-stone-600">Expert technique/financier accompagnant la mairie dans le pilotage du projet et la recherche de subventions.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes, BET)</h3>
              <p className="text-sm text-stone-600">Équipe concevant les plans et dirigeant les travaux.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS :</strong> Avant-Projet Sommaire (Esquisses/1er chiffrage).<br/><strong>APD :</strong> Avant-Projet Définitif (Plans détaillés/Budget final).</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">DETR / DSIL</h3>
              <p className="text-sm text-stone-600">Subvention de l'État exigeant des performances énergétiques strictes. L'école est éligible via le Fonds Vert.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">BDB (Bâtiment Durable Breton)</h3>
              <p className="text-sm text-stone-600">Démarche qualitative valorisant l'écoconstruction, conditionnant les 60 450 € d'aides régionales.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">SCIC (Koad COB)</h3>
              <p className="text-sm text-stone-600">Réseau local de chaleur au bois.</p>
            </div>
          </div>
        </div>
      </section>
`;

const rx1 = /\{\/\* ENJEUX FINANCIERS \*\/\}.*?(?=\{\/\* Toggle Détails \*\/})/s;
const rx2 = /\{\/\* ANALYSE GLOBALE \*\/\}.*?(?=\{\/\* ESPACE COMMENTAIRES \*\/})/s;

content = content.replace(rx1, enjeuxHTML + "\n        {/* Toggle Détails */}\n");
content = content.replace(rx2, analyseHTML + "\n\n        {/* ESPACE COMMENTAIRES */}\n");

let startIndex = content.indexOf('<section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">');
let endIndex = content.indexOf('{/* SIDE PANEL (DRAWER) */}', startIndex);
if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + lexiqueHTML + "\n      " + content.substring(endIndex);
}

fs.writeFileSync('app/historique/page.tsx', content);
