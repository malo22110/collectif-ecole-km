import React, { useState } from "react";
import { TrendingDown, AlertCircle, ShieldCheck, Info } from "lucide-react";
import CommentBadge from "./CommentBadge";

export interface FinancialBlockProps {
  data?: any; 
  context?: any;
}

export default function FinancialBlock({ data, context }: FinancialBlockProps) {
  const [isSimplified, setIsSimplified] = useState(false);
  
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
      
      {/* Toggle simplifié local */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-stone-100 p-1 rounded-full items-center border border-stone-200">
          <button
            onClick={() => setIsSimplified(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}
          >
            Résumé
          </button>
          <button
            onClick={() => setIsSimplified(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}
          >
            Détails
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">
        <TrendingDown className="text-emerald-600" />
        Aperçu des enjeux financiers
      </h2>
      <div className="space-y-6">
        {!isSimplified ? (
          <>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0"><AlertCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">🔎 Zoom Financier : Comprendre les 127 110 € d'études et le risque de perte réelle (plus de 70 000 €)</strong>
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
                      <strong>Plus de 70 000 € (La perte sèche minimale en cas d'annulation totale aujourd'hui) :</strong> C'est la somme due pour le travail DÉJÀ réalisé, commandé et achevé. Si le projet s'arrêtait demain, la commune devrait régler ces factures et n'aurait plus d'argent pour refaire d'autres études ou des travaux. (Calcul arrêté à mars 2026, hors indemnités de rupture anticipée).
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><ShieldCheck size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">💰 Comment est financé le projet (Phase 1) ?</strong>
                <p className="text-stone-600 text-sm mb-4">
                  Sur l'estimation APS de la Phase 1 (765 778 € HT), la commune a réussi à lever un niveau de subvention exceptionnel (plus de 60%).
                </p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <ul className="space-y-2 text-sm text-stone-600">
                    <li className="flex justify-between border-b border-stone-200 pb-2"><span>Budget total Phase 1 (Travaux + Études) :</span> <strong className="text-stone-900">765 778 € HT</strong></li>
                    <li className="flex justify-between border-b border-stone-200 pb-2 text-emerald-700"><span>Aides de l'État (DETR/Fonds Vert) :</span> <strong>- 206 726 €</strong></li>
                    <li className="flex justify-between border-b border-stone-200 pb-2 text-emerald-700"><span>Aide de la Région (BDB) :</span> <strong>- 60 450 €</strong></li>
                    <li className="flex justify-between border-b border-stone-200 pb-2 text-emerald-700"><span>Aide du Département :</span> <strong>- 74 504 €</strong></li>
                    <li className="flex justify-between border-b border-stone-200 pb-2 text-emerald-700"><span>Fonds de Concours CCKB :</span> <strong>- 35 000 €</strong></li>
                    <li className="flex justify-between border-b border-stone-200 pb-2 text-stone-500"><span>TVA Récupérée (FCTVA) :</span> <strong>~ - 125 000 €</strong></li>
                    <li className="flex justify-between pt-2 text-base">
                      <span className="font-bold text-stone-900">Reste à charge réel pour la commune :</span> 
                      <strong className="text-emerald-700">~ 264 000 €</strong>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">Capacité d'emprunt (Trésor Public)</span>
                    <strong className="text-stone-900 bg-white px-3 py-1 rounded-lg border border-stone-200">400 000 €</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
            </div>
          </>
        ) : (
          <div className="bg-emerald-50 text-emerald-900 p-5 rounded-xl text-sm leading-relaxed border border-emerald-100">
            <strong>L'essentiel :</strong> Le projet est largement financé par des subventions de l'État, de la Région et du Département (plus de 340 000 €). La commune a la capacité d'emprunter 400 000 €, ce qui couvre largement le reste à charge d'environ 264 000 €. 
            <br/><br/>
            <strong>Le danger :</strong> Annuler le projet maintenant coûterait au moins 70 000 € à la commune (études déjà réalisées), pour aucun résultat, et ferait perdre toutes les subventions.
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-stone-200">
        <h3 className="text-xl font-bold text-stone-900 mb-6">STRESS TEST : Évaluation des risques</h3>
        <p className="text-sm text-stone-600 mb-6">
          Voici ce qui se passe techniquement et financièrement si le projet est annulé ou modifié, en fonction des 4 scénarios qui s'offrent à la commune aujourd'hui :
        </p>

        <div className="overflow-x-auto pb-4">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 text-sm">
                <th className="p-4 font-bold border-b border-stone-200 w-1/4">Scénario</th>
                <th className="p-4 font-bold border-b border-stone-200 w-1/3">Risque Principal</th>
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
                <td className="p-4 align-top text-stone-700">plus de 70 000 € d'études perdues<br/>+ frais de rupture<br/>+ relance d'études complètes.</td>
                <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 150 000 € HT</strong><div className="text-stone-600 text-xs">Dépense à 100% à la charge de la commune.</div></td>
              </tr>
              <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                <td className="p-4 align-top font-bold text-stone-900">3. Abandon total</td>
                <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Maintien des non-conformités.</strong> Le bâtiment reste exposé au radon.</td>
                <td className="p-4 align-top text-stone-700">plus de 70 000 € d'études payées en pure perte.<br/>Majoration future du coût des travaux (inflation).</td>
                <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 74 000 € HT (immédiat)</strong><div className="text-stone-600 text-xs">Surcoûts reportés sur les exercices futurs.</div></td>
              </tr>
              <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                <td className="p-4 align-top font-bold text-stone-900">4. Le Saupoudrage</td>
                <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Inefficacité des interventions.</strong> Les travaux isolés ne règlent pas les désordres thermiques.</td>
                <td className="p-4 align-top text-stone-700">50 000 € de travaux<br/>+ plus de 70 000 € d'études perdues.</td>
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
          {!isSimplified ? (
            <div className="text-stone-800 space-y-4 text-sm">
              <p>Toute analyse budgétaire rigoureuse menée sur ce dossier aboutit à la même conclusion technique et financière : l'Option 1 (l'ajustement à l'enveloppe initiale de 550 000 € HT) est la seule voie viable pour la commune, pour trois raisons mathématiques et légales :</p>
              <ol className="list-decimal pl-5 space-y-3 font-medium text-stone-700">
                <li><strong>La valorisation des dépenses engagées :</strong> La commune a déjà contracté pour au minimum 70 000 € d'études et de diagnostics facturables au titre du service fait à ce stade du projet. Choisir l'abandon ou la refonte revient à solder ces factures avec les impôts locaux pour obtenir un résultat matériel nul. L'Option 1 est la seule qui transforme cette dépense inéluctable en investissement utile.</li>
                <li><strong>L'effet levier des subventions :</strong> Les 340 000 € d'aides extérieures sont strictement conditionnés à une rénovation globale générant 40 % d'économie d'énergie. Abandonner l'Avant-Projet Définitif annule mécaniquement ces aides. Faire "moins cher" en rafistolant ou "repartir de zéro" obligerait la commune à payer la totalité des futurs travaux sur ses fonds propres, ce qui saturerait instantanément sa capacité d'emprunt de 400 000 €.</li>
                <li><strong>L'incompressibilité des normes :</strong> Le bâtiment souffre de vulnérabilités légales et sanitaires avérées (radon, accessibilité, amiante/plomb, isolation). Le saupoudrage n'est qu'un expédient temporaire. L'État finira par exiger une mise aux normes complète, obligeant la commune à relancer un projet global dans quelques années, avec des coûts d'ingénierie à repayer de zéro et des coûts de construction gonflés par l'inflation.</li>
              </ol>
              <div className="mt-6 pt-6 border-t border-emerald-200 font-bold text-emerald-800 text-base">
                Mathématiquement, le refus de l'Option 1 revient à endetter le village pour régler des frais d'architectes et des indemnités d'abandon, tout en conservant une école qui se dégrade. À l'inverse, l'Option 1 protège les finances locales en faisant financer plus de 60 % du chantier par la Région, le Département et l'État.
              </div>
            </div>
          ) : (
            <div className="text-emerald-900 font-bold text-base md:text-lg leading-relaxed bg-white/50 p-4 rounded-xl">
              Refuser l'Option 1 revient à endetter le village d'au minimum 70 000 € dans le vide pour des plans inutilisés, tout en gardant une école qui se dégrade et perd ses subventions. À l'inverse, l'Option 1 protège les finances de la commune en faisant financer plus de 60 % du chantier par l'État, la Région et le Département.
            </div>
          )}
        </div>
        <div className="mt-6">
          <CommentBadge topic="Stress Test (Risques)" count={commentCounts["Stress Test (Risques)"] || 0} onOpen={() => setActiveTopic("Stress Test (Risques)")} />
        </div>
      </div>
    </div>
  );
}
