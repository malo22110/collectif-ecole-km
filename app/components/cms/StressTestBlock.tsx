import React from "react";
import { ShieldCheck, ChevronRight } from "lucide-react";
import CommentBadge from "./CommentBadge";

export default function StressTestBlock({ data, context }: any) {
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mt-16 bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden relative text-left mb-8">
        <h3 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-3">
          <ShieldCheck size={28} className="text-emerald-600" />
          Stress Test : La matrice des risques
        </h3>
        
        {!isSimplified ? (
          <>
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
          </>
        ) : (
          <div className="bg-emerald-50 text-emerald-900 p-5 rounded-xl text-sm leading-relaxed border border-emerald-100">
            <strong>Résumé du Stress Test :</strong> Quel que soit le scénario, abandonner ou refaire le projet à zéro coûte <strong>plus cher</strong> à la commune que de continuer, en raison des 70 000 € d'études déjà réalisées qu'il faudra payer en pure perte, et des 340 000 € de subventions qui seront annulées. L'Option 1 (Ajustement) est la seule viable financièrement.
          </div>
        )}
        <div className="mt-6">
          <CommentBadge topic="Stress Test (Risques)" count={commentCounts["Stress Test (Risques)"] || 0} onOpen={() => setActiveTopic("Stress Test (Risques)")} />
        </div>
      </div>
    </div>
  );
}
