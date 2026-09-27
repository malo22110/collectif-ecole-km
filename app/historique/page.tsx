"use client";
import React, { useState } from "react";
import Link from "next/link";
import Comments from "../components/Comments";
import { ArrowLeft, ExternalLink, AlertCircle, Clock, TrendingDown, CheckCircle, XCircle, BookOpen, X, ChevronRight, Info, ShieldCheck } from "lucide-react";
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
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
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

      </div>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-12">
        {/* ANALYSE GLOBALE */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Analyse Comparative Détaillée</h2>
          <p className="text-stone-600 text-center max-w-2xl mx-auto mb-10">
            Évaluation financière des 4 options stratégiques basée sur les capacités réelles de la commune (emprunt de 400 000 € validé par le Trésor public, excédent 2025 de 176 103 €) et les exigences de subvention de l'État.
          </p>
          
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold px-6 py-2 rounded-bl-2xl">
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
                  <span className="font-bold">550 000 €</span>
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
                <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-2">Aides sécurisées (Avant déc. 2026)</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Département & Région</span>
                  <span className="font-bold text-emerald-600">160 000 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">DETR État (30% de 550k€)</span>
                  <span className="font-bold text-emerald-600">165 000 €</span>
                </div>
              </div>
            </div>
            <div className="mt-8 bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-emerald-900 font-bold mb-1">Bilan net pour la commune</div>
                <div className="text-sm text-emerald-800">
                  Le reste à charge (227k€) est couvert à 75% par l'excédent 2025 (176k€). L'emprunt résiduel n'est que de ~51 000 €.
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-700 whitespace-nowrap">
                227 170 € HT
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-3">
                <AlertCircle size={24} className="text-amber-500" />
                Option 2 : Refonte a minima
              </h3>
              <p className="text-sm text-stone-600 mb-6 min-h-[60px]">
                Abandon de l'extension. Nouveau projet ciblé sur l'isolation et les normes urgentes.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Nouveaux honoraires d'études</span>
                  <span className="font-bold text-rose-600">35 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Perte sèche (études extension jetées)</span>
                  <span className="font-bold text-rose-600">~60 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Aides espérées (DETR 2026 perdue)</span>
                  <span className="font-bold text-amber-600">~80 000 €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Coût des travaux</span>
                  <span className="font-bold">380 000 €</span>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                <span className="text-sm font-bold text-stone-900">Reste à charge</span>
                <span className="text-2xl font-bold text-stone-900">~335 000 € HT</span>
              </div>
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

            <div className="overflow-x-auto shadow-sm border border-stone-200 rounded-2xl mb-12">
              <table className="w-full text-left bg-white border-collapse min-w-[800px]">
                <thead className="bg-stone-100 text-stone-700 text-sm">
                  <tr>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Option</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Le Cas Critique (Pire scénario)</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Conséquence & Impact Financier</th>
                    <th className="p-4 font-bold border-b border-stone-200 w-1/4">Résultat Final (Reste à charge)</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100">
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-stone-900 mb-1">1. Optimisation APD</div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Recommandée</span>
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Refus de la subvention DETR (État).</strong> Le dossier est déposé à temps (avant déc 2026), mais la Préfecture refuse l'aide faute de crédits.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte estimée de ~150 000 €. Les 159 855 € (Région/Département) sont conservés.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-emerald-700 mb-1">~380 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le projet reste sous le plafond d'emprunt (400k€). Le bâtiment est rénové.</div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">2. Refonte partielle</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Annulation des aides acquises + Surcoût technique.</strong> Région et Département jugent que l'abandon de l'extension dénature trop le projet initial et annulent les 159 855 €.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Perte de 160 000 € d'aides. Les nouvelles études (35 000 €) révèlent des surcoûts d'adaptation sur l'ancien bâtiment.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">&gt; 450 000 € HT</div>
                      <div className="text-stone-600 text-xs">Le plafond d'emprunt de 400 000 € est explosé. La commune bloque ses autres investissements.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">3. Abandon total</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Fermeture administrative + Inflation.</strong> L'abandon fige les travaux. Le délai légal de 3 ans pour le radon expire. Le Préfet ferme l'école.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      127 110 € d'études payés pour rien. Le futur projet (2030) coûtera au minimum 15% plus cher à cause de l'inflation.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">&gt; 850 000 € HT</div>
                      <div className="text-stone-600 text-xs">Crise politique majeure, enfants scolarisés hors commune, finances exsangues.</div>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 align-top font-bold text-stone-900">4. Saupoudrage</td>
                    <td className="p-4 align-top text-stone-700">
                      <strong>Échec de la mise aux normes.</strong> Les 50 000 € sont dépensés dans des rustines (dalle/VMC basique), mais les mesures radon restent supérieures à 300 Bq/m³.
                    </td>
                    <td className="p-4 align-top text-stone-700">
                      Les 50 000 € sont perdus. L'État exige des travaux lourds. Aucune subvention versée car ce n'est pas une rénovation globale.
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-rose-600 mb-1">177 110 € HT</div>
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
                <p>
                  L'Option 1 est l'unique trajectoire rationnelle sur le plan comptable. Refuser l'avenant de 2 170 € HT pour ajuster les plans détruit mécaniquement <strong>127 110 €</strong> d'études déjà réalisées au titre du "service fait", et rend caduques plus de <strong>300 000 € d'aides</strong> de l'État, de la Région et du Département.
                </p>
                <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl text-stone-300">
                  <strong className="text-rose-400 block mb-1">Le comparatif fatal (Option 4 vs Option 1) :</strong>
                  Avec le "saupoudrage" (Option 4), la commune sort <strong>177 000 €</strong> de sa trésorerie pour ne récolter qu'une passoire thermique rafistolée, sans régler le problème de fond, en perdant 160 000 € d'aides à tout jamais.<br/><br/>
                  Avec l'Option 1 (Optimisation), la commune sort <strong>227 000 €</strong> (dont 176k€ financés par l'excédent 2025). Pour une différence d'à peine 50 000 € par rapport au rafistolage toxique, la commune obtient un bâtiment totalement rénové, aux normes pour 30 ans, et économe en chauffage.
                </div>
                <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl text-stone-300">
                  <strong className="text-amber-400 block mb-1">Bilan face aux imprévus :</strong>
                  <strong className="text-emerald-400">L'Option 1 est la seule qui survit à son propre scénario catastrophe.</strong> Même si l'État (DETR) se retire à la dernière minute, la commune conserve l'appui de la Région et du Département (159 855 €), ne jette pas les 127 110 € d'études déjà réglés, et peut absorber le reste à charge grâce à l'emprunt de 400 000 € validé par le percepteur.<br/><br/>
                  À l'inverse, le moindre grain de sable dans les Options 2, 3 ou 4 fait immédiatement dérailler le budget de la commune au-delà de ses capacités de financement, tout en laissant le problème sanitaire du radon non résolu.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
            {/* ESPACE COMMENTAIRES */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Comments />
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
