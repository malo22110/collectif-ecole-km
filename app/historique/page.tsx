"use client";
import React, { useState } from "react";
import Link from "next/link";
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
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-center gap-3 text-sm font-medium shadow-sm max-w-2xl mx-auto">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p>
            Ce document de synthèse est <strong>en cours de validation par la communauté</strong>. 
            Les membres du collectif peuvent apporter leurs corrections dans l'espace commentaire en bas de page.
          </p>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Historique & Analyse du Projet</h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Chronologie des décisions et analyse financière complète basée sur les procès-verbaux officiels du conseil municipal.
        </p>
        
        {/* ENJEUX FINANCIERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left max-w-3xl mx-auto p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">
            <TrendingDown className="text-emerald-600" />
            Aperçu des enjeux financiers
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0"><AlertCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Engagements et études d'ingénierie : 127 110 € HT</strong>
                <span className="text-stone-600 text-sm">Formellement engagés auprès des prestataires (architectes, AMO, audits énergétiques) et dus au titre du service fait.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><CheckCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Subventions actées menacées d'annulation : 159 855 €</strong>
                <span className="text-stone-600 text-sm">Sécurisés (99 405 € du Département des Côtes-d'Armor et 60 450 € de la Région Bretagne).</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0"><BookOpen size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Montant arrêté du projet (APD) : 735 489,05 € HT</strong>
                <span className="text-stone-600 text-sm">615 278,09 € HT pour la Phase 1 (Classes, garderie, chaufferie, préau) et 120 210,96 € HT pour la Phase 2 (Salle de motricité).</span>
              </div>
            </div>
          </div>
        </div>
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
          <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
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
            Évaluation financière des 4 options stratégiques basée sur les capacités réelles de la commune (emprunt de 400 000 € validé par le Trésor public, excédent 2025 de 176 103 €) et les exigences de subvention de l'État.
          </p>
          
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="md:absolute md:top-0 md:right-0 bg-emerald-500 text-white font-bold px-4 py-1.5 md:px-6 md:py-2 md:rounded-bl-2xl rounded-lg inline-block mb-4 md:mb-0 text-sm shadow-sm">
              Option Recommandée
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
              <CheckCircle size={28} className="text-emerald-500" />
              Option 1 : Optimisation de l'APD (Projet Révisé)
            </h3>
            <p className="text-stone-600 mb-6">
              Conserver l'Avant-Projet Définitif actuel en le révisant à la baisse (conservation des menuiseries, dalle béton simple, réseau SCIC Koad COB), pour rester sous la barre des 800 000 € demandée par le Sous-préfet.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Dépenses & Pertes</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Travaux révisés Phase 1</span>
                  <span className="font-bold">~ 550 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Avenant d'architecte (coût de la décision)</span>
                  <span className="font-bold text-rose-600">+ 2 170 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Études antérieures gâchées (perte sèche)</span>
                  <span className="font-bold text-emerald-600">0 €</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (À engager avant déc. 2026)</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région <span className="text-xs text-stone-400">(précisément 159 855 €)</span></span>
                  <span className="font-bold text-emerald-600">~ 160 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">DETR État (30% de 550k€)</span>
                  <span className="font-bold text-emerald-600">165 000 €</span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-emerald-200/60">
                <div className="text-xl md:text-2xl text-emerald-900 font-black">Bilan net pour la commune</div>
                <div className="text-3xl md:text-4xl font-black text-emerald-700 whitespace-nowrap">
                  227 170 € HT
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 mb-6 text-sm border border-emerald-200">
                <strong className="text-emerald-900 block mb-2">Détail de l'équation financière :</strong>
                <div className="space-y-1 font-mono text-emerald-800 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2"><span>Coût total du projet :</span><span className="whitespace-nowrap text-right">552 170 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-700/70"><span>(550 000 € de travaux + 2 170 € d'avenant)</span></div>
                  <div className="flex justify-between gap-2 text-emerald-600 pt-2"><span>Total des aides :</span><span className="whitespace-nowrap text-right">- 325 000 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-600/70"><span>(160 000 € Région/Dép. + 165 000 € DETR)</span></div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between font-bold border-t border-emerald-200/60 pt-2 mt-2 text-base text-emerald-900"><span>Reste à charge réel :</span><span className="whitespace-nowrap text-right">= 227 170 € HT</span></div>
                </div>
              </div>
              <div className="space-y-4 text-sm md:text-base text-emerald-900/90 leading-relaxed">
                <p>
                  <strong className="text-emerald-950 block mb-1">Faisabilité financière :</strong>
                  Ce reste à charge est parfaitement absorbable et sécurisé. Il ne consomme qu'un peu plus de la moitié de la capacité d'emprunt de 400 000 € formellement validée par le Trésor public le 8 avril 2026.
                </p>
                <p>
                  <strong className="text-emerald-950 block mb-1">Avantage collatéral :</strong>
                  Cela préserve une marge de manœuvre intacte d'environ 170 000 € d'emprunt pour financer le reste du programme municipal (voirie, Maison Bonhomme), sans même avoir besoin de puiser dans la totalité de l'excédent budgétaire de 2025.
                </p>
              </div>
            </div>
            <CommentBadge topic="Option 1" count={commentCounts["Option 1"] || 0} onOpen={() => setActiveTopic("Option 1")} />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Abandon de l'APD et table rase
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Rompre les contrats, jeter 100% des plans de l'existant, et repartir de zéro pour faire du « bricolage ».
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes sèches (études jetées)</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation contractuelle</span>
                  <span className="font-bold text-rose-600">~4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouvelles études + Travaux radon</span>
                  <span className="font-bold text-rose-600">~80 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions (Région, Dép, État)</span>
                  <span className="font-bold text-amber-600">0 € (Perdues)</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900 leading-tight">Reste à charge<br/><span className="text-[10px] font-normal">(dont 131k€ pure perte)</span></span>
                <span className="text-2xl font-bold text-rose-600">~211 110 €</span>
              </div>
              <CommentBadge topic="Option 2" count={commentCounts["Option 2"] || 0} onOpen={() => setActiveTopic("Option 2")} />
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <XCircle size={24} className="text-rose-500" />
                Option 3 : Abandon Total
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Geler l'opération, perdre l'ingénierie payée et repousser à la prochaine mandature.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Frais de résiliation architecte</span>
                  <span className="font-bold text-rose-600">~4 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Ingénierie facturée pour service fait</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions annulées</span>
                  <span className="font-bold text-rose-600">- 159 855 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût d'un futur projet (2030)</span>
                  <span className="font-bold">&gt; 800 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Argent jeté sans travaux</span>
                <span className="text-2xl font-bold text-rose-600">131 110 € HT</span>
              </div>
              <CommentBadge topic="Option 3" count={commentCounts["Option 3"] || 0} onOpen={() => setActiveTopic("Option 3")} />
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-500" />
                Option 4 : Le Saupoudrage
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Mise aux normes stricte (radon, élec) sans vision thermique ni pédagogique. Effet "Subvention Zéro".
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Travaux d'urgence (Budget 2026)</span>
                  <span className="font-bold text-rose-600">50 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Pertes sèches (Études jetées)</span>
                  <span className="font-bold text-rose-600">127 110 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Subventions (Non éligible)</span>
                  <span className="font-bold text-rose-600">0 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Futurs travaux inévitables</span>
                  <span className="font-bold">&gt; à chiffrer</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900">Coût net (Rafistolage)</span>
                <span className="text-2xl font-bold text-rose-600">177 110 € HT</span>
              </div>
              <CommentBadge topic="Option 4" count={commentCounts["Option 4"] || 0} onOpen={() => setActiveTopic("Option 4")} />
            </div>
          </div>

          {/* STRESS TEST */}
          <div className="mt-20 mb-12">
            <h3 className="text-2xl font-bold text-stone-900 mb-6 text-center flex items-center justify-center gap-3">
              <ShieldCheck size={28} className="text-amber-500" />
              Stress Test : La matrice des risques
            </h3>
            <p className="text-stone-600 text-center max-w-3xl mx-auto mb-10">
              L'intégration d'un scénario du pire pour chaque option permet de démontrer que l'Option 1 est non seulement la plus rentable en temps normal, mais aussi la plus résiliente face aux imprévus.
            </p>

            <div className="md:hidden flex items-center justify-center gap-2 text-amber-800 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm font-medium border border-amber-200">
              <div className="animate-pulse"><ChevronRight size={18} /></div>
              Faites glisser le tableau vers la droite
            </div>
            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
              <table className="w-full text-left bg-white border-collapse min-w-[1020px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[200px]">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[300px]">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 min-w-[220px]">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors  border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top ">
                      <div className="font-bold text-stone-900 mb-1">1. Optimisation APD</div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">Recommandée</span>
                    </td>
                    <td className="p-4 align-top text-stone-700 ">
                      <strong className="text-stone-900 block mb-1">Refus de la subvention DETR (État).</strong> Le dossier est déposé à temps (avant déc 2026), mais la Préfecture refuse l'aide faute de crédits.
                    </td>
                    <td className="p-4 align-top text-stone-700 ">
                      Perte estimée de ~150 000 €. Les 159 855 € (Région/Département) sont conservés. Les 127 110 € d'études payées sont pleinement exploités.
                    </td>
                    <td className="p-4 align-top ">
                      <div className="font-bold text-emerald-700 mb-1 text-base">~380 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le projet reste sous le plafond d'emprunt (400 k€). Le bâtiment est rénové.</div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-stone-50 transition-colors  border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 ">2. Refonte totale / Table rase<br/><span className="text-xs font-normal text-stone-500">(Piste de l'opposition)</span></td>
                    <td className="p-4 align-top text-stone-700 ">
                      <strong className="text-stone-900 block mb-1">Perte intégrale des financements + Pénalités.</strong> La rupture des contrats en cours entraîne l'annulation des 159 855 € d'aides acquises. Le délai DETR est raté.
                    </td>
                    <td className="p-4 align-top text-stone-700 ">
                      127 110 € d'études payés en pure perte (service fait). + ~4 000 € de pénalités. + ~35 000 € pour de nouvelles études. Les aides (État, Région, Département) tombent à 0 €.
                    </td>
                    <td className="p-4 align-top ">
                      <div className="font-bold text-rose-600 mb-1 text-base">&gt; 500 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le plafond d'emprunt de 400 000 € est explosé juste pour financer des rustines et des études jetées.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors  border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 ">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700 ">
                      <strong className="text-stone-900 block mb-1">Fermeture administrative + Inflation.</strong> L'abandon fige les travaux. Le délai légal de 3 ans pour le radon expire. Le Préfet ferme l'école.
                    </td>
                    <td className="p-4 align-top text-stone-700 ">
                      127 110 € d'études payés pour rien. Le futur projet (2030) coûtera au minimum 15 % plus cher à cause de l'inflation de la construction.
                    </td>
                    <td className="p-4 align-top ">
                      <div className="font-bold text-rose-600 mb-1 text-base">&gt; 850 000 € HT</div>
                      <div className="text-stone-600 text-xs">Crise politique majeure, enfants scolarisés hors commune, finances exsangues.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors  border-stone-200 mb-4 md:mb-0 pb-4 md:pb-0">
                    <td className="p-4 align-top font-bold text-stone-900 ">4. Le Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700 ">
                      <strong className="text-stone-900 block mb-1">Échec de la mise aux normes.</strong> Les 50 000 € provisionnés sont dépensés dans des rustines (dalle/VMC basique), mais les mesures radon restent &gt; 300 Bq/m³.
                    </td>
                    <td className="p-4 align-top text-stone-700 ">
                      Les 50 000 € sont perdus. L'État exige des travaux lourds. Aucune subvention versée car ce n'est pas une rénovation globale.
                    </td>
                    <td className="p-4 align-top ">
                      <div className="font-bold text-rose-600 mb-1 text-base">177 110 € HT</div>
                      <div className="text-stone-600 text-xs">De pure perte (Études + rustines). Obligation de tout recommencer à zéro.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-stone-800 text-stone-100 p-8 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg">
              <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Conclusion Financière & Résilience
              </h4>
              <div className="space-y-4">
                <div className="bg-stone-900 border border-stone-700 p-5 rounded-xl text-stone-300">
                  <strong className="text-rose-400 block mb-2 text-lg">Le comparatif financier (Option 1 vs Option 2)</strong>
                  <p className="mb-4">
                    L'Option 2 (Table rase de l'existant) place immédiatement la commune dans un <strong>déficit comptable de près de 290 000 € avant même d'avoir posé le moindre parpaing</strong>. En rejetant l'APD actuel (qui se concentre déjà uniquement sur le bâtiment historique), la commune est juridiquement tenue de payer les 127 110 € d'études réalisées, tout en provoquant l'annulation mécanique des 159 855 € de subventions conditionnées à ce projet précis. À cela s'ajoute l'impossibilité matérielle de monter un nouveau dossier avant la date butoir de la DETR fixée à décembre 2026. L'Option 2 n'est donc pas une économie, mais un gouffre qui obligera la commune à autofinancer à 100 % de futures réparations, <strong>saturant instantanément sa capacité d'emprunt de 400 000 €</strong>.
                  </p>
                  <p>
                    <strong className="text-emerald-400">L'Option 1 (Optimisation) est la seule stratégie qui valorise le capital déjà investi.</strong> En acceptant l'avenant de 2 170 € HT, la commune finalise les économies demandées par le Sous-préfet, valide les 127 110 € d'ingénierie passée, et sécurise un plan de financement couvert à plus de 60 % par des aides publiques. Avec un reste à charge avoisinant les 230 000 € (dont 176 000 € absorbables par l'excédent de fonctionnement de 2025), la commune obtient un outil scolaire aux normes pour les trente prochaines années, tout en préservant une large part de sa capacité d'emprunt pour les autres chantiers du mandat.
                  </p>
                </div>
                <div className="bg-stone-900 border border-stone-700 p-5 rounded-xl text-stone-300">
                  <strong className="text-emerald-400 block mb-2 text-lg">Bilan face aux imprévus</strong>
                  <p>
                    L'Option 1 est également la seule à démontrer une résilience totale face aux imprévus. Même dans l'hypothèse extrême où l'État se désengagerait au dernier moment (refus de la DETR), le maintien du projet garantit la sauvegarde des subventions régionales et départementales, maintenant le reste à charge sous le seuil d'alerte des finances communales.<br/><br/>
                    Le moindre accroc dans l'Option 2 fait au contraire dérailler le budget de la commune au-delà du soutenable, la laissant seule face au risque de fermeture administrative liée au radon.
                  </p>
                </div>
              </div>
              <CommentBadge topic="Stress Test (Risques)" count={commentCounts["Stress Test (Risques)"] || 0} onOpen={() => setActiveTopic("Stress Test (Risques)")} />
            </div>
          </div>
        </div>
      </div>
    
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
              <p className="text-sm text-stone-600">Un expert technique ou financier embauché par la mairie pour l'aider à définir le projet, choisir les architectes et suivre le chantier.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">Maîtrise d'Œuvre (Architectes)</h3>
              <p className="text-sm text-stone-600">L'équipe chargée de concevoir les plans de l'école et de diriger les travaux.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APS & APD</h3>
              <p className="text-sm text-stone-600"><strong>APS :</strong> Avant-Projet Sommaire (Esquisses et 1er chiffrage).<br/><strong>APD :</strong> Avant-Projet Définitif (Plans détaillés et budget final).</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">DETR</h3>
              <p className="text-sm text-stone-600"><strong>Dotation d’Équipement des Territoires Ruraux.</strong> Subvention majeure de l'État indispensable au projet, avec une date butoir d'engagement fin 2026.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">SCIC (Koad COB)</h3>
              <p className="text-sm text-stone-600"><strong>Société Coopérative d'Intérêt Collectif.</strong> Le réseau de chaleur au bois local auquel l'école pourrait se raccorder.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">ABF</h3>
              <p className="text-sm text-stone-600"><strong>Architecte des Bâtiments de France.</strong> Autorité qui s'assure que le projet respecte le patrimoine et l'architecture locale.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">APE</h3>
              <p className="text-sm text-stone-600"><strong>Association des Parents d'Élèves.</strong> Représentants très impliqués dans la concertation pour l'école.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">BCD</h3>
              <p className="text-sm text-stone-600"><strong>Bibliothèque Centre Documentaire.</strong> Espace lecture et bibliothèque dédié aux enfants au sein de l'école.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
              <h3 className="font-bold text-stone-900 mb-2">ADAC & CAUE & ALECOB</h3>
              <p className="text-sm text-stone-600">Agences départementales (ADAC, CAUE) et locale (ALECOB) apportant leur expertise technique, d'urbanisme ou énergétique au projet.</p>
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
