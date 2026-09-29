import React from "react";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import CommentBadge from "./CommentBadge";

export default function OptionsComparisonBlock({ data, context }: any) {
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <div className="mb-20 max-w-5xl mx-auto px-4 text-left">
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
          {!isSimplified && (
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
          )}
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
          {!isSimplified && (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Pertes (Service fait facturable)</span>
              <span className="font-bold text-rose-600">plus de 70 000 €</span>
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
          )}
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
          {!isSimplified && (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Pertes (Service fait facturable)</span>
              <span className="font-bold text-rose-600">plus de 70 000 €</span>
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
          )}
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
          {!isSimplified && (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Travaux d'urgence</span>
              <span className="font-bold text-rose-600">50 000 €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Pertes (Études abandonnées)</span>
              <span className="font-bold text-rose-600">plus de 70 000 €</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
              <span className="text-stone-600">Subventions</span>
              <span className="font-bold text-rose-600">0 €</span>
            </div>
          </div>
          )}
          <div className="pt-4 border-t border-stone-100 flex items-end justify-between mt-auto">
            <span className="text-sm font-bold text-rose-900">Coût net</span>
            <span className="text-xl font-bold text-rose-600">~ 120 000 € HT</span>
          </div>
        </div>
      </div>
      <CommentBadge topic="Options de financement" count={commentCounts["Options de financement"] || 0} onOpen={() => setActiveTopic("Options de financement")} />
    </div>
  );
}
