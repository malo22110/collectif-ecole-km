import React from "react";
import { Info } from "lucide-react";
import CommentBadge from "./CommentBadge";

export default function ConclusionBlock({ data, context }: any) {
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <div className="bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl mx-4 md:mx-auto max-w-3xl mb-8 text-left">
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
  );
}
