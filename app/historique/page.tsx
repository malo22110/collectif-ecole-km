"use client";
import React, { useState } from "react";
import Link from "next/link";
import UserAvatar from "../components/UserAvatar";
import Comments from "../components/Comments";
import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info, ShieldCheck, MessageCircle } from "lucide-react";
import timelineEvents from "@/data/timeline.json";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const CommentBadge = ({ topic, count, onOpen }: { topic: string, count: number, onOpen: () => void }) => {
  const label = count > 0 ? `${count} commentaire${count > 1 ? 's' : ''}` : 'Commenter';
  return (
    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(); }}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 rounded-full text-sm font-medium transition-colors border border-stone-200 shadow-sm"
      >
        <MessageCircle size={16} />
        <span>{label}</span>
      </button>
    </div>
  );
};

export default function HistoriquePage() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "commentaires"), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const topic = doc.data().topic || "Général";
        counts[topic] = (counts[topic] || 0) + 1;
      });
      setCommentCounts(counts);
    });
    return () => unsubscribe();
  }, []);

  const [isSimplified, setIsSimplified] = useState(false);
  const [activeStep, setActiveStep] = useState<any>(null);

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
          <div className="font-bold text-stone-900 hidden sm:block">Le Collectif</div>
          <div className="flex items-center gap-4">
            <Link href="/petition" className="text-sm font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full hover:bg-emerald-200 transition-colors">
              Pétition
            </Link>
            <UserAvatar />
          </div>
        </div>
      
        {/* Toggle intégré au header pour garantir qu'il soit sticky */}
        <div className="bg-stone-50/95 backdrop-blur-md border-t border-stone-200 py-2">
          <div className="max-w-5xl mx-auto px-4 flex justify-center">
            <div className="inline-flex bg-stone-200/50 p-1 rounded-full items-center border border-stone-200 shadow-inner">
              <button
                onClick={() => setIsSimplified(true)}
                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Version Courte (Résumé)
              </button>
              <button
                onClick={() => setIsSimplified(false)}
                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Détails Complets
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Spacer to prevent content from hiding under the new taller header */}
      <div className="h-8"></div>


      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-auto">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p>
            Ce document de synthèse est <strong>en cours de validation par la communauté</strong>. 
            Les membres du collectif peuvent apporter leurs corrections et débattre en utilisant les boutons "Commenter" disponibles à chaque section, ou dans l'espace général en bas de page.
          </p>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique & Analyse du Projet</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et analyse financière complète basée exclusivement sur les actes officiels de la mairie (procès-verbaux du conseil municipal, arrêtés de subventions, et dossiers de demande à l'État).
        </p>
        
        
        {/* ENJEUX FINANCIERS */}
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
                <strong className="text-stone-900 block text-lg mb-2">🔎 Zoom Financier : Comprendre les 127 110 € d'études et le risque de perte réelle (70 000 €)</strong>
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
                      <strong>~ 70 000 € HT (Le risque de perte sèche immédiate) :</strong> C'est le montant des prestations <em>effectivement réalisées à ce jour</em> (stade APD). Si la mairie annule le projet demain, elle ne paiera pas 133 000 €, mais elle devra obligatoirement payer ces 70 000 € au titre du "service fait" (diagnostics achevés, AMO, honoraires d'architectes dus à l'étape APD s'élevant à environ 19 438 €). <strong>C'est cet argent qui sera jeté par les fenêtres en cas d'abandon.</strong>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
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

            <div className="flex items-start gap-3">
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
                  <strong className="block mb-2 flex items-center gap-2 text-rose-900"><AlertCircle size={20} /> Le risque immédiat : ~ 70 000 €</strong>
                  <p className="text-sm">C'est le coût des études (diagnostics, architectes) <strong>déjà réalisées</strong> à ce jour. Si on abandonne l'école, la mairie devra quand même payer cette somme (règle légale du "service fait"). 70 000 € d'argent public seront perdus dans le vide.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 md:p-6 rounded-xl border border-emerald-200">
                  <strong className="block mb-2 flex items-center gap-2 text-emerald-900"><CheckCircle size={20} /> La solution (Option 1)</strong>
                  <p className="text-sm">Continuer le projet d'ajustement permet de rentabiliser ces 70 000 € et de sécuriser <strong>340 000 € de subventions</strong>, ramenant le reste à charge des travaux à environ 212 000 €, ce qui est largement dans la capacité de la commune.</p>
                </div>
              </div>
            )}
</div>
          <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">

        {/* Toggle Détails */}


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
                        <h3 className="text-xl font-bold text-stone-900 mb-2 flex items-center flex-wrap gap-2">{event.title}</h3>
                        <p className="text-stone-600 mb-3 leading-relaxed md:text-left">
                          <HighlightTerms text={textToShow} />
                        </p>
                        
                        
                        {/* Financial Box */}
                        {event.budget && (
                          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm">
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-stone-500 shrink-0">Études :</span>
                                <span className="font-medium text-stone-800 text-right">{event.budget.etudes}</span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-stone-500 shrink-0">Travaux :</span>
                                <span className="font-medium text-stone-800 text-right">{event.budget.travaux}</span>
                              </div>
                              <div className="pt-2 mt-1 border-t border-stone-200 flex justify-between items-start gap-4">
                                <span className="font-bold text-stone-900 shrink-0">Total estimé :</span>
                                <span className="font-bold text-emerald-700 text-right">{event.budget.total}</span>
                              </div>
                            </div>
                          </div>
                        )}

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
                        <CommentBadge topic={`Étape : ${event.title}`} count={commentCounts[`Étape : ${event.title}`] || 0} onOpen={() => setActiveTopic(`Étape : ${event.title}`)} />
                      </div>

                    </div>
                    {isEven && <div className="hidden md:block md:w-1/2"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-12">
        
        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
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
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
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
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
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
                  <span className="font-bold text-rose-600">~ 70 000 €</span>
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

          <div className="mt-16 bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden relative">
            <h3 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-3">
              <ShieldCheck size={28} className="text-emerald-600" />
              Stress Test : La matrice des risques
            </h3>
            
            {!isSimplified ? (
              <>
                <div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">
              <div className="animate-pulse"><ChevronRight size={18} /></div>
              Faites glisser le tableau vers la droite
            </div>
            
            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
              <table className="w-full text-left bg-white border-collapse min-w-[1020px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[200px]">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Scénario Défavorable</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[220px]">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">1. Ajustement (550k€)</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Refus de la subvention de l'État.</strong> La Préfecture instruit le dossier mais ne verse pas l'aide faute de crédits.</td>
                    <td className="p-4 align-top text-stone-700">Perte de 180 145 €.<br/>Les 159 855 € (Région/Département) sont conservés. L'ingénierie est valorisée.</td>
                    <td className="p-4 align-top"><strong className="text-emerald-700 text-base block mb-1">~ 392 000 € HT</strong><div className="text-stone-600 text-xs">Le reste à charge frôle le plafond (400 k€), mais l'école est intégralement rénovée.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">2. Refonte totale</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Perte intégrale des financements.</strong> L'abandon des objectifs thermiques (40%) annule toutes les aides.</td>
                    <td className="p-4 align-top text-stone-700">~ 70 000 € d'études perdues<br/>+ frais de rupture<br/>+ relance d'études complètes.</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 150 000 € HT</strong><div className="text-stone-600 text-xs">Dépense à 100% à la charge de la commune.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Maintien des non-conformités.</strong> Le bâtiment reste exposé au radon.</td>
                    <td className="p-4 align-top text-stone-700">~ 70 000 € d'études payées en pure perte.<br/>Majoration future du coût des travaux (inflation).</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">&gt; 74 000 € HT (immédiat)</strong><div className="text-stone-600 text-xs">Surcoûts reportés sur les exercices futurs.</div></td>
                  </tr>
                  <tr className="hover:bg-stone-50 transition-colors border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700"><strong className="text-stone-900 block mb-1">Inefficacité des interventions.</strong> Les travaux isolés ne règlent pas les désordres thermiques.</td>
                    <td className="p-4 align-top text-stone-700">50 000 € de travaux<br/>+ ~ 70 000 € d'études perdues.</td>
                    <td className="p-4 align-top"><strong className="text-rose-600 text-base block mb-1">~ 120 000 € HT</strong><div className="text-stone-600 text-xs">Trésorerie absorbée sans pérenniser le bâtiment.</div></td>
                  </tr>
                </tbody>
              </table>
            </div>
              </>
            ) : (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-stone-700 text-center text-lg">
                <p>La matrice complète des risques démontre que l'<strong>Option 1 (L'ajustement)</strong> est la seule stratégie qui évite les surcoûts explosifs, sécurise le calendrier des travaux et garantit la santé des enfants sans perdre les 340 000 € de subventions.</p>
              </div>
            )}

            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl">
              <h4 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <Info size={24} className="text-emerald-700" />
                Conclusion Objective : Pourquoi l'Option 1 s'impose
              </h4>
              {!isSimplified ? (
                <div className="text-stone-800 space-y-4 text-sm">

                <p>Toute analyse budgétaire rigoureuse menée sur ce dossier aboutit à la même conclusion technique et financière : l'Option 1 (l'ajustement à l'enveloppe initiale de 550 000 € HT) est la seule voie viable pour la commune, pour trois raisons mathématiques et légales :</p>
                <ol className="list-decimal pl-5 space-y-3 font-medium text-stone-700">
                  <li><strong>La valorisation des dépenses engagées :</strong> La commune a déjà contracté pour environ 70 000 € d'études et de diagnostics facturables au titre du service fait à ce stade du projet. Choisir l'abandon ou la refonte revient à solder ces factures avec les impôts locaux pour obtenir un résultat matériel nul. L'Option 1 est la seule qui transforme cette dépense inéluctable en investissement utile.</li>
                  <li><strong>L'effet levier des subventions :</strong> Les 340 000 € d'aides extérieures sont strictement conditionnés à une rénovation globale générant 40 % d'économie d'énergie. Abandonner l'Avant-Projet Définitif annule mécaniquement ces aides. Faire "moins cher" en rafistolant ou "repartir de zéro" obligerait la commune à payer la totalité des futurs travaux sur ses fonds propres, ce qui saturerait instantanément sa capacité d'emprunt de 400 000 €.</li>
                  <li><strong>L'incompressibilité des normes :</strong> Le bâtiment souffre de vulnérabilités légales et sanitaires avérées (radon, accessibilité, amiante/plomb, isolation). Le saupoudrage n'est qu'un expédient temporaire. L'État finira par exiger une mise aux normes complète, obligeant la commune à relancer un projet global dans quelques années, avec des coûts d'ingénierie à repayer de zéro et des coûts de construction gonflés par l'inflation.</li>
                </ol>
                <div className="mt-6 pt-6 border-t border-emerald-200 font-bold text-emerald-800 text-base">
                  Mathématiquement, le refus de l'Option 1 revient à endetter le village pour régler des frais d'architectes et des indemnités d'abandon, tout en conservant une école qui se dégrade. À l'inverse, l'Option 1 protège les finances locales en faisant financer plus de 60 % du chantier par la Région, le Département et l'État.
                </div>
              
                </div>
              ) : (
                <div className="text-emerald-900 font-bold text-base md:text-lg leading-relaxed bg-white/50 p-4 rounded-xl">
                  Refuser l'Option 1 revient à endetter le village d'environ 70 000 € dans le vide pour des plans inutilisés, tout en gardant une école qui se dégrade et perd ses subventions. À l'inverse, l'Option 1 protège les finances de la commune en faisant financer plus de 60 % du chantier par l'État, la Région et le Département.
                </div>
              )}
            </div>
            <div className="mt-6">
              <CommentBadge topic="Stress Test (Risques)" count={commentCounts["Stress Test (Risques)"] || 0} onOpen={() => setActiveTopic("Stress Test (Risques)")} />
            </div>
          </div>
        </div>
      </div>


        {/* ESPACE COMMENTAIRES */}
{/* ESPACE COMMENTAIRES */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Comments topic="Général" />
      </div>
      
      

      
      
      <section className="bg-stone-100 py-16 border-t border-stone-200 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Petit Lexique pour tout comprendre
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">AMO (Assistant à Maîtrise d'Ouvrage)</h3>
              <p className="text-sm text-stone-600">Expert technique/financier accompagnant la mairie dans le pilotage du projet et la recherche de subventions.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes, BET)</h3>
              <p className="text-sm text-stone-600">Équipe concevant les plans et dirigeant les travaux.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS :</strong> Avant-Projet Sommaire (Esquisses/1er chiffrage).<br/><strong>APD :</strong> Avant-Projet Définitif (Plans détaillés/Budget final).</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">DETR / DSIL</h3>
              <p className="text-sm text-stone-600">Subvention de l'État exigeant des performances énergétiques strictes. L'école est éligible via le Fonds Vert.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">BDB (Bâtiment Durable Breton)</h3>
              <p className="text-sm text-stone-600">Démarche qualitative valorisant l'écoconstruction, conditionnant les 60 450 € d'aides régionales.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">SCIC (Koad COB)</h3>
              <p className="text-sm text-stone-600">Réseau local de chaleur au bois.</p>
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


      {/* Commentaires contextuels (Drawer) */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-sm transition-opacity" onClick={() => setActiveTopic(null)}>
          <div className="w-full max-w-md bg-stone-50 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex justify-between items-center z-10 shadow-sm">
              <h3 className="font-bold text-stone-900 flex-1 truncate mr-4">Débat : {activeTopic}</h3>
              <button onClick={() => setActiveTopic(null)} className="p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4">
              <Comments topic={activeTopic} inline={true} />
            </div>
          </div>
        </div>
      )}
    </main>

  );
}
