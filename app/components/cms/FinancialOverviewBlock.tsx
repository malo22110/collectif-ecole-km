import React from "react";
import { TrendingDown, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
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
                      <strong>plus de 70 000 € HT (Le risque de perte sèche immédiate) :</strong> C'est le montant des prestations effectivement réalisées à ce jour (stade APD). Si la mairie annule le projet demain, elle ne paiera pas 133 000 €, mais elle devra obligatoirement payer ces 70 000 € au titre du "service fait" (diagnostics achevés, AMO, honoraires d'architectes dus à l'étape APD s'élevant à environ 19 438 €). C'est cet argent qui sera jeté par les fenêtres en cas d'abandon.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
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

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0"><BookOpen size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">L'évolution de l'estimation de la maîtrise d'œuvre (APD) : 735 489,05 € HT</strong>
                <p className="text-stone-600 text-sm">Alors que la commande initiale visait un projet à 550 000 € HT, les chiffrages successifs de l'Avant-Projet Définitif (APD) ont atteint 735 489 € HT (615 278 € pour la Phase 1 et 120 210 € pour la Phase 2), nécessitant le recadrage budgétaire actuel.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-rose-50 text-rose-800 p-4 md:p-6 rounded-xl border border-rose-200">
              <strong className="block mb-2 flex items-center gap-2 text-rose-900"><AlertCircle size={20} /> Le risque immédiat : plus de 70 000 €</strong>
              <p className="text-sm">C'est le coût des études (diagnostics, architectes) <strong>déjà réalisées</strong> à ce jour. Si on abandonne l'école, la mairie devra quand même payer cette somme (règle légale du "service fait"). Au moins 70 000 € d'argent public seront perdus dans le vide.</p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 p-4 md:p-6 rounded-xl border border-emerald-200">
              <strong className="block mb-2 flex items-center gap-2 text-emerald-900"><CheckCircle size={20} /> La solution (Option 1)</strong>
              <p className="text-sm">Continuer le projet d'ajustement permet de rentabiliser ces plus de 70 000 € d'études et de sécuriser <strong>340 000 € de subventions</strong>, ramenant le reste à charge des travaux à environ 212 000 €, ce qui est largement dans la capacité de la commune.</p>
            </div>
          </div>
        )}
      </div>
      <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
    </div>
  );
}
