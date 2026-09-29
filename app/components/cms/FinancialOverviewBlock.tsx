import React from "react";
import { TrendingDown, AlertCircle, ShieldCheck } from "lucide-react";
import CommentBadge from "./CommentBadge";

export default function FinancialOverviewBlock({ data, context }: any) {
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
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
    </div>
  );
}
