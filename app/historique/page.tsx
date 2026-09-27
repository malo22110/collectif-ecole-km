"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info } from "lucide-react";
import timelineEvents from "@/data/timeline.json";

// A simple interactive Tooltip component that works on mobile (tap to show) and desktop (hover)
const TermTooltip = ({ children, tooltip }: { children: React.ReactNode, tooltip: string }) => {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.stopPropagation(); setShow(!show); }}
    >
      <span className="border-b border-dashed border-emerald-500 text-emerald-700 cursor-help font-medium">
        {children}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-stone-900 text-white text-xs p-3 rounded-lg shadow-xl z-50 normal-case font-normal text-left pointer-events-none">
          {tooltip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></span>
        </span>
      )}
    </span>
  );
};

// Helper for tooltips/highlighting using React nodes instead of dangerouslySetInnerHTML
const HighlightTerms = ({ text }: { text: string }) => {
  if (!text) return null;
  
  const terms = [
    { word: "AMO", tooltip: "Assistant à Maîtrise d'Ouvrage : Expert qui aide la mairie à piloter le projet." },
    { word: "Maîtrise d'œuvre", tooltip: "Les architectes et ingénieurs qui conçoivent et dirigent les travaux." },
    { word: "APS", tooltip: "Avant-Projet Sommaire : Premières esquisses et budget global." },
    { word: "APD", tooltip: "Avant-Projet Définitif : Plans détaillés et budget final." },
    { word: "Bâtiments de France", tooltip: "Architecte des Bâtiments de France (ABF) : Protège le patrimoine historique." },
    { word: "Tranche optionnelle", tooltip: "Travaux prévus mais qui ne seront réalisés que si le budget le permet." },
    { word: "Tranche conditionnelle", tooltip: "Travaux prévus mais qui ne seront réalisés que si le budget le permet." }
  ];

  // We'll split the text by all terms
  // Create a regex that matches any of the terms
  const regex = new RegExp(`(${terms.map(t => t.word).join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        const foundTerm = terms.find(t => t.word.toLowerCase() === part.toLowerCase());
        if (foundTerm) {
          return <TermTooltip key={i} tooltip={foundTerm.tooltip}>{part}</TermTooltip>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default function HistoriquePage() {
  const [isSimplified, setIsSimplified] = useState(false);
  const [activeStep, setActiveStep] = useState<any | null>(null);

  return (
    <main className="min-h-screen bg-stone-50 pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
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
        {/* Toggle Détails */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-stone-200 p-1 rounded-full items-center">
            <button
              onClick={() => setIsSimplified(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Résumé
            </button>
            <button
              onClick={() => setIsSimplified(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Détails : On
            </button>
          </div>
        </div>

        {/* TIMELINE SECTION */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">La Frise Chronologique</h2>
          <div className="relative py-8">
            <div className="absolute left-[19px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-stone-200"></div>
            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const isEven = index % 2 === 0;
                const textToShow = isSimplified && event.simplifiedDescription ? event.simplifiedDescription : event.description;
                
                return (
                  <div key={index} className="relative flex flex-col md:flex-row md:items-start md:justify-center group">
                    <div className={`absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full ${event.color} ring-4 ring-stone-50 z-10`}></div>
                    {!isEven && <div className="hidden md:block md:w-1/2"></div>}
                    <div className={`w-full md:w-1/2 pl-12 ${isEven ? 'md:pl-0 md:pr-12 md:text-right' : 'md:pl-12 md:pr-0'}`}>
                      
                      <div 
                        onClick={() => setActiveStep(event)}
                        className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                      >
                        <div className="text-sm font-bold text-emerald-600 mb-1">{event.date}</div>
                        <h3 className="text-xl font-bold text-stone-900 mb-2">{event.title}</h3>
                        <p className="text-stone-600 mb-3 leading-relaxed md:text-left">
                          <HighlightTerms text={textToShow} />
                        </p>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                          {event.sourceUrl && (
                            <span 
                              onClick={(e) => { e.stopPropagation(); window.open(encodeURI(event.sourceUrl), '_blank'); }}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
                            >
                              <ExternalLink size={14} />
                              {event.sourceLabel}
                            </span>
                          )}
                          {!event.sourceUrl && <span></span>}
                          <span className="text-emerald-600 flex items-center gap-1 text-sm font-medium">
                            Détails <ChevronRight size={16}/>
                          </span>
                        </div>
                      </div>

                    </div>
                    {isEven && <div className="hidden md:block md:w-1/2"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">Analyse Globale de la Situation</h2>
          
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 md:p-8 mb-12">
            <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
              <TrendingDown className="text-rose-600" />
              Perte financière sèche immédiate : ~290 000 €
            </h3>
            <p className="text-rose-800 mb-4">
              Si la commune décide d'abandonner l'opération en cours pour repartir sur un projet totalement différent, la perte financière sèche immédiate est estimée à au moins <strong>289 465 €</strong>.
            </p>
            <ul className="space-y-4 text-rose-800">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                <div>
                  <strong>127 110 € HT d'études perdues à 100%</strong> : Sommes engagées au titre du service fait (art. L. 2191-1).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                <div>
                  <strong>159 855 € de subventions envolées</strong> : Aides département/région liées au projet technique actuel.
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
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 1 : Optimisation</h4>
              <p className="text-sm text-stone-600 mb-4">Révision ciblée à la baisse (allotissement fin, ajustement des matériaux).</p>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-emerald-600">~190 000 € à 240 000 € HT</div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm opacity-90">
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 2 : Refonte a minima</h4>
              <p className="text-sm text-stone-600 mb-4">Abandon de l'extension, nouvelle maîtrise d'œuvre simplifiée.</p>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-stone-900">300k à 415k € HT</div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm opacity-90">
              <h4 className="text-lg font-bold text-stone-900 mb-4">Option 3 : Nouveau projet</h4>
              <p className="text-sm text-stone-600 mb-4">Arrêt complet et reconstruction neuve ailleurs ou table rase.</p>
              <div className="pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-500 mb-1">Coût net mairie</div>
                <div className="text-xl font-bold text-rose-600">&gt; 750 000 € HT</div>
              </div>
            </div>
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
              <p className="text-sm text-stone-600">Un expert technique ou financier embauché par la mairie pour l'aider à définir le projet, choisir les architectes et suivre le chantier.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes)</h3>
              <p className="text-sm text-stone-600">L'équipe chargée de concevoir les plans de l'école et de diriger les travaux.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS :</strong> Esquisses et 1er chiffrage.<br/><strong>APD :</strong> Plans détaillés et budget final.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-2">Tranche conditionnelle</h3>
              <p className="text-sm text-stone-600">Travaux dessinés sur les plans mais qui ne seront construits que si le budget le permet (ex: salle de motricité).</p>
            </div>
          </div>
        </div>
      </section>

      {/* SIDE PANEL (DRAWER) */}
      {activeStep && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setActiveStep(null)}>
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50">
              <div className="text-emerald-700 font-bold flex items-center gap-2">
                <Clock size={18} />
                {activeStep.date}
              </div>
              <button onClick={() => setActiveStep(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors bg-white shadow-sm border border-stone-200">
                <X size={20} className="text-stone-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-2xl font-bold text-stone-900 mb-6">{activeStep.title}</h3>
              
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1"><Info size={14}/> Ce qu'il faut retenir</h4>
                <p className="text-stone-700 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl leading-relaxed">
                  <HighlightTerms text={activeStep.simplifiedDescription || activeStep.description} />
                </p>
              </div>

              
              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1"><BookOpen size={14}/> Détails Administratifs</h4>
                <p className="text-stone-600 leading-relaxed p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <HighlightTerms text={activeStep.description} />
                </p>
              </div>

              {activeStep.produits && activeStep.produits.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1"><CheckCircle size={14}/> Éléments produits à cette étape</h4>
                  <ul className="space-y-2 mb-3">
                    {activeStep.produits.map((prod: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0"></div>
                        {prod}
                      </li>
                    ))}
                  </ul>
                  {activeStep.conservable !== undefined && (
                    <div className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg border ${activeStep.conservable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                      {activeStep.conservable ? <CheckCircle size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}
                      {activeStep.conservable 
                        ? "Conservable en cas de nouveau projet" 
                        : "Perte totale : inexploitable sur un autre projet"}
                    </div>
                  )}
                </div>
              )}


              {activeStep.sourceUrl && activeStep.sourceUrl !== "#" && (
                <div className="mt-8 pt-8 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">Document Source</h4>
                  <a 
                    href={encodeURI(activeStep.sourceUrl)} 
                    target="_blank" 
                    className="flex items-center justify-between p-4 bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md text-stone-800 rounded-xl transition-all font-medium group"
                  >
                    <span>PV : {activeStep.sourceLabel}</span>
                    <ExternalLink size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
