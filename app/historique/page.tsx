import React from "react";
import timelineEvents from "@/data/timeline.json";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertCircle, Clock } from "lucide-react";

export default function HistoriquePage() {
  

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
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique de la Rénovation</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et des engagements financiers actés par l'ancienne municipalité, 
          strictement sourcés à partir des procès-verbaux officiels du conseil municipal.
        </p>
        
        <div className="inline-flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left max-w-3xl mx-auto">
          <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={20} />
          <p className="text-sm">
            <strong>Pourquoi cet historique ?</strong> L'objectif est de montrer que des sommes importantes d'argent public (plus de 64 000 €) et beaucoup de temps d'élus ont déjà été dépensés sur ce projet. Repartir de zéro aujourd'hui serait un immense gâchis.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative py-8">
          {/* Ligne centrale */}
          <div className="absolute left-[19px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-stone-200"></div>

          <div className="space-y-12">
            {timelineEvents.map((event, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className="relative flex flex-col md:flex-row md:items-start md:justify-center">
                  {/* Point */}
                  <div className={`absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full ${event.color} ring-4 ring-stone-50 z-10`}></div>
                  
                  {/* Contenu */}
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
            
            {/* Status Actuel / Attente */}
            <div className="relative flex flex-col md:flex-row md:items-start md:justify-center pt-8">
              <div className="absolute left-[12px] md:left-1/2 md:-ml-2 top-9 w-4 h-4 rounded-full bg-stone-300 ring-4 ring-stone-50 z-10 animate-pulse"></div>
              <div className="hidden md:block md:w-1/2"></div>
              <div className="w-full md:w-1/2 pl-12 md:pl-12">
                <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm inline-block">
                  <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
                    <Clock size={18} className="text-stone-400" />
                    En attente de mise à jour...
                  </div>
                  <p className="text-sm text-stone-600">
                    Nous sommes actuellement dans l'attente de la publication des nouveaux procès-verbaux par la nouvelle municipalité pour mettre à jour le statut officiel du projet.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
