"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PetitionPapier() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { 
            background-color: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 1cm; }
          /* Ensure rows don't break across pages */
          tr { break-inside: avoid; page-break-inside: avoid; }
          /* Ensure header repeats on each page */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}} />
      <div className="bg-white min-h-screen text-black font-sans p-4 md:p-8 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
        
        <div className="print:hidden mb-8 text-center flex justify-center gap-4">
          <button 
            onClick={() => window.print()}
            className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-emerald-700"
          >
            <Printer size={20} /> Lancer l'impression (A4)
          </button>
          <button 
            onClick={() => window.close()}
            className="bg-stone-200 text-stone-800 px-6 py-3 rounded-full font-bold hover:bg-stone-300"
          >
            Fermer
          </button>
        </div>

        <div>
          {/* Header qui ne s'imprime qu'au tout début */}
          <div className="border-b-2 border-black pb-4 mb-4 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Pétition citoyenne</h1>
            <h2 className="text-xl font-bold">Rénovation de l'école de Kergrist-Moëlou : valorisons les études engagées vers un projet maîtrisé</h2>
          </div>

          <div className="text-sm leading-snug mb-6 text-justify space-y-2">
            <p className="font-bold border border-black p-2 bg-white">
              Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation déjà engagé, afin d'aboutir à une solution économe (retour à l'enveloppe de 550 000 € HT) et adaptée aux capacités de la commune, plutôt qu'à un blocage ou un abandon qui contraindrait à repartir de zéro.
            </p>
            <ul className="list-disc pl-5 mt-2">
              <li><strong>Un projet déjà mature :</strong> L'état d'avancement des études permet de démarrer sans repartir de zéro.</li>
              <li><strong>La préservation de l'argent public :</strong> 127 110 € de fonds communaux ont déjà été engagés. Abandonner le projet transforme cet argent en pure perte.</li>
              <li><strong>Le risque sur les subventions :</strong> Le dossier actuel sécurise 340 000 € d'aides. Un abandon nous ferait perdre définitivement cette manne financière.</li>
              <li><strong>L'urgence :</strong> Différer les travaux repousse la livraison et fragilise l'accueil des enfants.</li>
              <li><strong>Les contraintes sanitaires :</strong> Les diagnostics imposent des travaux urgents (radon, amiante, électricité, PMR).</li>
            </ul>
          </div>

          <div className="border-2 border-black p-2 font-bold text-center uppercase tracking-widest text-sm mb-4">
            ⚠️ Merci d'écrire lisiblement EN MAJUSCULES ⚠️
          </div>

          {/* SINGLE SMART TABLE */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-white font-bold">
                <th className="border border-black p-2 w-[5%]">N°</th>
                <th className="border border-black p-2 w-[25%]">PRÉNOM ET NOM</th>
                <th className="border border-black p-2 w-[20%]">COMMUNE DE RÉSIDENCE</th>
                <th className="border border-black p-2 w-[35%]">LIEN AVEC L'ÉCOLE (Parent, Habitant, Ancien...)</th>
                <th className="border border-black p-2 w-[15%]">SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 60 }).map((_, i) => (
                <tr key={i} className="h-12 break-inside-avoid">
                  <td className="border border-black p-1 text-center text-gray-500 font-medium">{i + 1}</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-8 text-xs text-center text-gray-600 font-bold border-t border-gray-300 pt-4 break-inside-avoid">
            Pétition lancée par le Collectif citoyen pour la rénovation de l'école de Kergrist-Moëlou.<br/>
            Les données collectées serviront uniquement à valider le soutien citoyen à cette démarche.
          </div>
        </div>
      </div>
    </>
  );
}
