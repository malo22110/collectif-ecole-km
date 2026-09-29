import React, { useState } from "react";
import { Clock, CheckCircle, XCircle, BookOpen, Info, ExternalLink, X, ChevronRight } from "lucide-react";

export interface TimelineBlockProps {
  data: {
    items: any[];
  };
}

// Composant interne pour remplacer HighlightTerms (à simplifier ou réutiliser)
const HighlightTerms = ({ text }: { text: string }) => {
  return <span dangerouslySetInnerHTML={{ __html: text }} />; // Simplification pour le CMS pour l'instant
};

export default function TimelineBlock({ data }: TimelineBlockProps) {
  const [activeStep, setActiveStep] = useState<any>(null);

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 mb-20 relative">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-stone-200 transform md:-translate-x-1/2"></div>
        <div className="space-y-12">
          {data.items.map((event, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <div key={idx} className={`relative flex items-center justify-between md:justify-normal w-full ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                <div className="hidden md:block w-5/12"></div>
                <div className="z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-4 border-stone-200 shadow-sm shrink-0 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
                  <div className={`w-2.5 h-2.5 rounded-full ${event.color || 'bg-emerald-500'}`}></div>
                </div>
                <div 
                  className={`w-full md:w-5/12 pl-6 md:pl-0 ${isLeft ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}
                >
                  <div 
                    onClick={() => setActiveStep(event)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group text-left"
                  >
                    <span className="text-emerald-600 font-bold text-sm tracking-wide uppercase mb-1 block flex items-center gap-1.5 md:justify-start">
                      <Clock size={14} /> {event.date}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                      {event.simplifiedDescription || event.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-medium text-stone-400 group-hover:text-emerald-600 transition-colors pt-3 border-t border-stone-100">
                      <span>Cliquez pour les détails</span>
                      <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
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
    </>
  );
}
