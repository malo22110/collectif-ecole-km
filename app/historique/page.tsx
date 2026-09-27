"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle , BookOpen} from "lucide-react";
import timelineEvents from "@/data/timeline.json";

export default function HistoriquePage() {
  const [isSimplified, setIsSimplified] = useState(true);

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium transition-colors">
            <ArrowLeft size={20} />
            Retour à l'accueil
          </Link>
          <div className="font-bold text-stone-900">Le Collectif</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique & Analyse du Projet</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et analyse financière complète basée sur les procès-verbaux officiels du conseil municipal.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* TIMELINE SECTION */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">La Frise Chronologique</h2>
          <div className="relative py-8">
            <div className="absolute left-[19px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-stone-200"></div>
            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={index} className="relative flex flex-col md:flex-row md:items-start md:justify-center">
                    <div className={`absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full ${event.color} ring-4 ring-stone-50 z-10`}></div>
                    {!isEven && <div className="hidden md:block md:w-1/2"></div>}
                    <div className={`w-full md:w-1/2 pl-12 ${isEven ? 'md:pl-0 md:pr-12 md:text-right' : 'md:pl-12 md:pr-0'}`}>
                      <div className="text-sm font-bold text-emerald-600 mb-1">{event.date}</div>
                      <h3 className="text-xl font-bold text-stone-900 mb-2">{event.title}</h3>
                      <p className="text-stone-600 mb-3">{event.description}</p>
                      {event.sourceUrl && (
                        <a 
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-600 transition-colors bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm ${isEven ? 'md:flex-row-reverse' : ''}`}
                        >
                          <ExternalLink size={14} />
                          Source : {event.sourceLabel}
                        </a>
                      )}
                    </div>
                    {isEven && <div className="hidden md:block md:w-1/2"></div>}
                  </div>
                );
              })}
              

            </div>
          </div>
        </div>

        {/* ANALYSE GLOBALE SECTION */}
        <div className="border-t border-stone-200 pt-16 mb-20">
          <h2 className="text-3xl font-bold text-stone-900 mb-6 text-center">Analyse Globale : Le Coût d'un Abandon</h2>
          
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 md:p-8 mb-12">
            <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
              <TrendingDown className="text-rose-600" />
              Perte financière sèche immédiate : ~290 000 €
            </h3>
            <p className="text-rose-800 mb-4">
              Si la commune décide d'abandonner l'opération en cours pour repartir sur un projet totalement différent (ou le mettre à l'arrêt), la perte financière sèche immédiate est estimée à au moins <strong>289 465 €</strong>.
            </p>
            <ul className="space-y-4 text-rose-800">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                <div>
                  <strong>127 110 € HT d'études perdues à 100%</strong> : Sommes déjà engagées contractuellement auprès des prestataires (maîtrise d'œuvre, AMO, audits) qui doivent être payées. Ces études sur-mesure sont inexploitables sur un autre projet.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                <div>
                  <strong>159 855 € de subventions envolées</strong> : 99 405 € du Conseil départemental et 60 450 € de la Région. Ces aides sont liées au projet technique actuel.
                </div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-bold text-stone-900 mb-6 text-center">Comparatif des Options Possibles</h3>
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Recommandé
              </div>
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 1 : Optimisation de l'existant</h4>
              <p className="text-sm text-stone-600 mb-4">Révision ciblée à la baisse (allotissement fin, ajustement des matériaux).</p>
              <ul className="text-sm space-y-3 text-stone-700 mb-6">
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500 shrink-0" /> Pertes sèches : 0 €</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500 shrink-0" /> Aides : 160 k€ conservés</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500 shrink-0" /> Livraison : Courte (2027)</li>
              </ul>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-emerald-600">~350 000 € HT</div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm opacity-90">
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 2 : Refonte partielle a minima</h4>
              <p className="text-sm text-stone-600 mb-4">Abandon de l'extension, nouvelle maîtrise d'œuvre simplifiée.</p>
              <ul className="text-sm space-y-3 text-stone-700 mb-6">
                <li className="flex gap-2"><XCircle size={16} className="text-rose-500 shrink-0" /> Pertes sèches : ~60 k€</li>
                <li className="flex gap-2"><XCircle size={16} className="text-amber-500 shrink-0" /> Aides : Très compromises</li>
                <li className="flex gap-2"><XCircle size={16} className="text-amber-500 shrink-0" /> Livraison : Moyenne (fin 2028)</li>
              </ul>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-stone-900">380k à 475k € HT</div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm opacity-90">
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 3 : Abandon total & Nouveau projet</h4>
              <p className="text-sm text-stone-600 mb-4">Arrêt complet et reconstruction neuve ailleurs ou table rase.</p>
              <ul className="text-sm space-y-3 text-stone-700 mb-6">
                <li className="flex gap-2"><XCircle size={16} className="text-rose-500 shrink-0" /> Pertes sèches : ~290 k€</li>
                <li className="flex gap-2"><XCircle size={16} className="text-rose-500 shrink-0" /> Aides : Perdues à 100%</li>
                <li className="flex gap-2"><XCircle size={16} className="text-rose-500 shrink-0" /> Livraison : Longue (2029-2030)</li>
              </ul>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-rose-600">&gt; 750 000 € HT</div>
              </div>
            </div>

          </div>
          
          <div className="mt-12 bg-stone-100 p-6 rounded-2xl text-stone-700 text-sm leading-relaxed">
            <strong>Conclusion :</strong> Refuser de payer un avenant d'études de 2 170 € aujourd'hui expose la commune à une destruction nette de capital public de près de 290 000 €. L'Option 1 (Optimisation de l'existant) est financièrement, techniquement et juridiquement la seule rationnelle.
          </div>
        </div>

      </div>
    
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Petit Lexique pour tout comprendre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">AMO (Assistant à Maîtrise d'Ouvrage)</h3>
              <p className="text-sm text-stone-600">Un expert technique ou financier embauché par la mairie pour l'aider à définir le projet, choisir les architectes et suivre le chantier. Il défend les intérêts de la commune.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes)</h3>
              <p className="text-sm text-stone-600">L'équipe (architectes, ingénieurs) chargée de concevoir les plans de l'école et de diriger les travaux sur le terrain.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS (Avant-Projet Sommaire) :</strong> Les premières esquisses et le premier chiffrage global.<br/><strong>APD (Avant-Projet Définitif) :</strong> Les plans détaillés et le budget figé avant de demander les permis de construire.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Tranche optionnelle / conditionnelle</h3>
              <p className="text-sm text-stone-600">Une partie des travaux qui est dessinée sur les plans mais qui ne sera construite que si la mairie décide plus tard qu'elle a le budget nécessaire (ex: la salle de motricité).</p>
            </div>
          </div>
        </div>
      </section>

      </main>
  );
}
