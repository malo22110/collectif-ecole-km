import React, { useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  Info,
  ExternalLink,
  X,
  ChevronRight,
} from "lucide-react";
import CommentBadge from "./CommentBadge";

export interface TimelineBlockProps {
  data: {
    items: any[];
  };
  context?: any;
}

const HighlightTerms = ({ text }: { text: string }) => {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
    />
  );
};

export default function TimelineBlock({ data, context }: TimelineBlockProps) {
  const [activeStep, setActiveStep] = useState<any>(null);
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};

  return (
    <>
      <div className="mb-20 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">
          La Frise Chronologique
        </h2>
        <div className="relative py-8">
          <div className="absolute left-[19px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-stone-200"></div>
          <div className="space-y-12">
            {data.items.map((event, index) => {
              const isEven = index % 2 === 0;
              const textToShow =
                isSimplified && event.simplifiedDescription
                  ? event.simplifiedDescription
                  : event.description;

              return (
                <div
                  key={index}
                  className="relative flex flex-col md:flex-row md:items-start md:justify-center group"
                >
                  <div
                    className={`absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full ${event.color || "bg-emerald-500"} ring-4 ring-stone-50 z-10`}
                  ></div>
                  {!isEven && <div className="hidden md:block md:w-1/2"></div>}
                  <div
                    className={`w-full md:w-1/2 pl-12 ${isEven ? "md:pl-0 md:pr-12 md:text-right" : "md:pl-12 md:pr-0"}`}
                  >
                    <div
                      onClick={() => setActiveStep(event)}
                      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative text-left"
                    >
                      <div className="text-sm font-bold text-emerald-600 mb-1 flex items-center gap-1.5 md:inline-flex">
                        <Clock size={14} className="md:hidden" /> {event.date}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mb-2 flex items-center flex-wrap gap-2">
                        {event.title}
                      </h3>
                      <p className="text-stone-600 mb-3 leading-relaxed md:text-left">
                        <HighlightTerms text={textToShow} />
                      </p>

                      {/* Financial Box */}
                      {event.budget && (
                        <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm md:text-left text-left">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-stone-500 shrink-0">Études :</span>
                              <span className="font-medium text-stone-800 text-right">
                                {event.budget.etudes}
                              </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-stone-500 shrink-0">Travaux :</span>
                              <span className="font-medium text-stone-800 text-right">
                                {event.budget.travaux}
                              </span>
                            </div>
                            <div className="pt-2 mt-1 border-t border-stone-200 flex justify-between items-start gap-4">
                              <span className="font-bold text-stone-900 shrink-0">
                                Total estimé :
                              </span>
                              <span className="font-bold text-emerald-700 text-right">
                                {event.budget.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                        {event.sourceUrl && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(encodeURI(event.sourceUrl), "_blank");
                            }}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            <span>PV {event.sourceLabel}</span>
                            <ExternalLink size={14} />
                          </span>
                        )}
                        <span className="text-xs font-bold text-stone-400 group-hover:text-emerald-600 transition-colors flex items-center gap-1 ml-auto">
                          Détails <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-2 w-full flex justify-end">
                      <CommentBadge
                        topic={`Chronologie : ${event.date}`}
                        count={commentCounts[`Chronologie : ${event.date}`] || 0}
                        onOpen={() => setActiveTopic(`Chronologie : ${event.date}`)}
                      />
                    </div>
                  </div>
                  {isEven && <div className="hidden md:block md:w-1/2"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {activeStep && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 text-left"
          onClick={() => setActiveStep(null)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50">
              <div className="text-emerald-700 font-bold flex items-center gap-2">
                <Clock size={18} />
                {activeStep.date}
              </div>
              <button
                onClick={() => setActiveStep(null)}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors bg-white shadow-sm border border-stone-200"
              >
                <X size={20} className="text-stone-600" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-2xl font-bold text-stone-900 mb-6">{activeStep.title}</h3>

              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1">
                  <Info size={14} /> Ce qu'il faut retenir
                </h4>
                <p className="text-stone-700 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl leading-relaxed">
                  <HighlightTerms
                    text={activeStep.simplifiedDescription || activeStep.description}
                  />
                </p>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1">
                  <BookOpen size={14} /> Détails Administratifs
                </h4>
                <p className="text-stone-600 leading-relaxed p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <HighlightTerms text={activeStep.description} />
                </p>
              </div>

              {activeStep.produits && activeStep.produits.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1">
                    <CheckCircle size={14} /> Éléments produits à cette étape
                  </h4>
                  <ul className="space-y-2 mb-3">
                    {activeStep.produits.map((prod: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0"></div>
                        {prod}
                      </li>
                    ))}
                  </ul>
                  {activeStep.conservable !== undefined && (
                    <div
                      className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg border ${activeStep.conservable ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
                    >
                      {activeStep.conservable ? (
                        <CheckCircle size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-rose-600" />
                      )}
                      {activeStep.conservable
                        ? "Conservable en cas de nouveau projet"
                        : "Perte totale : inexploitable sur un autre projet"}
                    </div>
                  )}
                </div>
              )}

              {activeStep.sourceUrl && activeStep.sourceUrl !== "#" && (
                <div className="mt-8 pt-8 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">
                    Document Source
                  </h4>
                  <a
                    href={encodeURI(activeStep.sourceUrl)}
                    target="_blank"
                    className="flex items-center justify-between p-4 bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md text-stone-800 rounded-xl transition-all font-medium group"
                  >
                    <span>PV : {activeStep.sourceLabel}</span>
                    <ExternalLink
                      size={18}
                      className="text-amber-600 group-hover:scale-110 transition-transform"
                    />
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
