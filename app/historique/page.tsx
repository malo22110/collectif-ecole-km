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
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0"><AlertCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Engagements et études d'ingénierie : 127 110 € HT</strong>
                <span className="text-stone-600 text-sm">Formellement engagés auprès des prestataires (architectes, AMO, audits énergétiques) et dus par la commune au titre de la règle comptable du "service fait".</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0"><CheckCircle size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Subventions actées ou déposées : 340 000 €</strong>
                <span className="text-stone-600 text-sm">Le plan de financement repose sur trois leviers documentés par des actes administratifs officiels. Ces financements exigent une rénovation globale (dont une baisse stricte de 40 % de la consommation d'énergie).<br/><br/><strong>Département des Côtes-d'Armor (Sécurisé) : 99 405 €</strong><br/>Montant acté par l'arrêté officiel du Contrat de Territoire 2022-2027, signé par le Président du Conseil départemental le 17 novembre 2023.<br/><br/><strong>Région Bretagne (Sécurisé sous condition) : 60 450 €</strong><br/>Montant acté par la notification du dispositif « Bien vivre partout en Bretagne » (courrier du Président du Conseil régional du 7 juin 2024). Le versement est strictement conditionné à l'atteinte d'un gain énergétique minimum de 40 % et à l'utilisation de matériaux biosourcés ou d'énergies renouvelables.<br/><br/><strong>État - DETR / DSIL (Dossier déposé) : 180 145 €</strong><br/>Demande de subvention officiellement enregistrée en Préfecture le 13 décembre 2024 (Dossier n° 21386559) basée sur le projet ciblé à 550 000 € HT. Le cahier des charges du Fonds Vert de l'État exige également une réduction d'au moins 40 % de la consommation d'énergie finale pour être éligible.</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0"><BookOpen size={18} /></div>
              <div>
                <strong className="text-stone-900 block">Le dérapage de la maîtrise d'œuvre (APD) : 735 489,05 € HT</strong>
                <span className="text-stone-600 text-sm">Alors que la commande officielle de la mairie et le dossier de subvention exigeaient un projet à 550 000 € HT, l'architecte a présenté en novembre 2025 un projet dérapant à 735 489 € HT (615 278 € pour la Phase 1 et 120 210 € pour la Phase 2).</span>
              </div>
            </div>
          </div>
          <CommentBadge topic="Enjeux financiers" count={commentCounts["Enjeux financiers"] || 0} onOpen={() => setActiveTopic("Enjeux financiers")} />
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
            Évaluation financière des 4 options stratégiques basée sur les capacités réelles de la commune (emprunt de 400 000 € validé par le Trésor public) et les critères stricts des subventions (obligation d'atteindre 40 % d'économie d'énergie).
          </p>
          
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="md:absolute md:top-0 md:right-0 bg-emerald-500 text-white font-bold px-4 py-1.5 md:px-6 md:py-2 md:rounded-bl-2xl rounded-lg inline-block mb-4 md:mb-0 text-sm shadow-sm">
              Option Recommandée
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-3">
              <CheckCircle size={28} className="text-emerald-500" />
              Option 1 : Le retour à l'enveloppe initiale (Le seul projet conforme)
            </h3>
            <p className="text-stone-600 mb-6">
              Ce projet n'est pas un "Plan B". L'enveloppe de 550 000 € HT est le budget exact que la mairie avait elle-même voté et déposé en Préfecture en décembre 2024. Le dérapage à 735 000 € est une erreur de maîtrise d'œuvre. L'avenant de 2 170 € sert uniquement à obliger l'architecte à corriger sa copie pour rentrer dans nos clous et sauver les 340 000 € d'aides.
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
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées et déposées</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région</span>
                  <span className="font-bold text-emerald-600">159 855 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">DETR État (Dossier déposé)</span>
                  <span className="font-bold text-emerald-600">180 145 €</span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-emerald-200/60">
                <div className="text-xl md:text-2xl text-emerald-900 font-black">Bilan net pour la commune</div>
                <div className="text-3xl md:text-4xl font-black text-emerald-700 whitespace-nowrap">
                  212 170 € HT
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 mb-6 text-sm border border-emerald-200">
                <strong className="text-emerald-900 block mb-2">Détail de l'équation financière :</strong>
                <div className="space-y-1 font-mono text-emerald-800 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2"><span>Coût total du projet :</span><span className="whitespace-nowrap text-right">552 170 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-700/70"><span>(550 000 € de travaux + 2 170 € d'avenant)</span></div>
                  <div className="flex justify-between gap-2 text-emerald-600 pt-2"><span>Total des aides :</span><span className="whitespace-nowrap text-right">- 340 000 €</span></div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-emerald-600/70"><span>(159 855 € Région/Dép. + 180 145 € DETR)</span></div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between font-bold border-t border-emerald-200/60 pt-2 mt-2 text-base text-emerald-900"><span>Reste à charge réel :</span><span className="whitespace-nowrap text-right">= 212 170 € HT</span></div>
                </div>
              </div>
              <div className="space-y-4 text-sm md:text-base text-emerald-900/90 leading-relaxed">
                <p>
                  <strong className="text-emerald-950 block mb-1">Faisabilité financière :</strong>
                  Ce reste à charge est parfaitement absorbable et sécurisé. Il consomme à peine la moitié de la capacité d'emprunt de 400 000 € validée par le Trésor public.
                </p>
                <p>
                  <strong className="text-emerald-950 block mb-1">Conformité écologique :</strong>
                  C'est l'unique option qui garantit les 40 % d'économie d'énergie exigés par la Région et le Fonds Vert de l'État pour le versement des subventions.
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
                <div className="flex flex-col text-sm">
                  <div className="flex justify-between"><span className="text-stone-600">Subventions (Région, Dép, État)</span><span className="font-bold text-amber-600">0 €</span></div>
                  <span className="text-[10px] text-stone-500 mt-1 leading-tight">Les financeurs exigent 40 % d'économie d'énergie et une rénovation globale. Un projet rustine annule les aides d'office.</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-rose-900 leading-tight">Reste à charge<br/><span className="text-[10px] font-normal max-w-[150px] inline-block">La commune paie sans aide, pour une passoire à refaire dans 5 ans.</span></span>
                <div className="text-right"><span className="text-2xl font-bold text-rose-600">~211 110 € HT</span><span className="block text-sm font-medium text-rose-500/80 -mt-1">(Minimum)</span></div>
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
                  <span className="font-bold text-rose-600">- 340 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût d'un futur projet (2030)</span>
                  <span className="font-bold">&gt; 800 000 € <span className="font-normal text-[10px] text-stone-500 block">(inflation)</span></span>
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
                <div className="flex flex-col text-sm">
                  <div className="flex justify-between"><span className="text-stone-600">Subventions (Non éligible)</span><span className="font-bold text-rose-600">0 €</span></div>
                  <span className="text-[10px] text-stone-500 mt-1 leading-tight">Ne répond pas aux exigences d'économie d'énergie du Fonds Vert et de la Région.</span>
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
                      <strong className="text-stone-900 block mb-1">Perte intégrale des financements + Pénalités.</strong> La rupture des contrats en cours et la perte de l'ambition thermique (40% d'économie) entraîne l'annulation des 340 000 € d'aides.
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
                      Les 50 000 € sont perdus. L'État exige des travaux lourds. Aucune subvention versée car les 40% d'économies d'énergie ne sont pas atteints.
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
                    L'Option 2 (Table rase) ou 4 (Saupoudrage) place immédiatement la commune dans un <strong>déficit comptable majeur avant même d'avoir posé le moindre parpaing</strong>. En rejetant l'APD actuel, la commune est juridiquement tenue de payer les 127 110 € d'études réalisées. Plus grave encore, faire de petits travaux détruit l'éligibilité du projet aux critères de la Région et de l'État (qui exigent strictement une baisse de 40 % de la consommation d'énergie). Cela provoque l'annulation mécanique des 340 000 € de subventions déjà actées ou déposées. Ces options ne sont pas des économies, ce sont des gouffres qui satureront instantanément la capacité d'emprunt de 400 000 €.
                  </p>
                  <p>
                    <strong className="text-emerald-400">L'Option 1 (Optimisation) est la seule stratégie rationnelle.</strong> En acceptant l'avenant de 2 170 € HT, la commune contraint l'architecte à revenir au budget de 550 000 € HT déposé initialement en Préfecture. Cela valide les 127 110 € d'ingénierie passée et sécurise un plan de financement couvert à plus de 60 % par des aides publiques. Avec un reste à charge avoisinant les 212 000 €, la commune obtient un outil scolaire aux normes pour les trente prochaines années, tout en préservant la moitié de sa capacité d'emprunt pour les autres chantiers du mandat.
                  </p>
                </div>
                <div className="bg-stone-900 border border-stone-700 p-5 rounded-xl text-stone-300">
                  <strong className="text-emerald-400 block mb-2 text-lg">Bilan face aux imprévus</strong>
                  <p>
                    L'Option 1 est également la seule à démontrer une résilience totale face aux imprévus. Même dans l'hypothèse extrême où l'État refuserait la DETR au dernier moment, le maintien du projet garantit la sauvegarde des subventions régionales et départementales, maintenant le reste à charge sous le plafond des 400 000 € autorisés par le percepteur.<br/><br/>
                    Le moindre accroc dans les autres options fait au contraire dérailler le budget de la commune au-delà du soutenable.
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
