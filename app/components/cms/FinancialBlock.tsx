import React, { useState } from "react";
import { TrendingDown, AlertCircle, ShieldCheck } from "lucide-react";

export interface FinancialBlockProps {
  data?: any; // Pour l'instant on gère en interne pour ne pas sur-complexifier la BDD tout de suite
}

export default function FinancialBlock({ data }: FinancialBlockProps) {
  const [isSimplified, setIsSimplified] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
      
      {/* Toggle simplifié local au bloc financier (ou contrôlé globalement) */}
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
                  Il est crucial de clarifier les chiffres liés aux études d'ingénierie. Trois montants différents existent :
                </p>
                <ul className="space-y-3 text-sm text-stone-600 list-none pl-0">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <div><strong>127 110 € HT (Le montant provisionné dans les PV)* :</strong> Enveloppe globale budgétée en septembre 2025.</div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <div>
                      <strong>133 533 € HT (Le détail réel jusqu'à la fin du chantier) :</strong> Coût total exhaustif si le projet va à son terme (diagnostics, architectes, AMO, démarche BDB).
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <div>
                      <strong>Plus de 70 000 € (La perte sèche minimale en cas d'annulation totale aujourd'hui) :</strong> C'est la somme due pour le travail DÉJÀ réalisé. (Calcul arrêté à mars 2026).
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><ShieldCheck size={18} /></div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">💰 Comment est financé le projet (Phase 1) ?</strong>
                <ul className="space-y-2 text-sm text-stone-600">
                  <li><strong>Budget total (Phase 1) :</strong> 765 778 € HT</li>
                  <li><strong>Aides & Subventions acquises :</strong> 341 680 € (DETR, Région, Département)</li>
                  <li><strong>Fonds de Concours CCKB :</strong> 35 000 €</li>
                  <li><strong>TVA Récupérée (FCTVA) :</strong> ~125 000 €</li>
                  <li className="pt-2 border-t border-stone-100 mt-2 font-bold text-stone-800">Reste à charge réel pour la commune : ~ 264 000 €</li>
                  <li className="text-emerald-600">Capacité d'emprunt autorisée : 400 000 €</li>
                </ul>
              </div>
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
