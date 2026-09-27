"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PenTool, CheckCircle2, AlertCircle, Users, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PetitionPage() {
  const [formData, setFormData] = useState({ prenom: "", nom: "", email: "", ville: "", qualite: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [stats, setStats] = useState({ count: 0, recent: [] as string[] });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "stats", "petition"), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as { count: number; recent: string[] });
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      await addDoc(collection(db, "signatures"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header Héro */}
      <div className="bg-emerald-800 text-emerald-50 py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-700/50 rounded-2xl mb-6 ring-1 ring-emerald-400/30">
            <PenTool className="text-emerald-300 w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight">
            Pétition Citoyenne pour la Sauvegarde de l'École
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Valorisons les études engagées vers un projet maîtrisé.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content (Texte de la pétition) */}
          <div className="flex-1 bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4">
              Rénovation de l'école : valorisons les études engagées vers un projet maîtrisé
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 space-y-6">
              <p className="text-lg font-medium text-stone-800 leading-relaxed border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-3 pr-4 rounded-r-xl">
                Nous demandons la réévaluation technique et budgétaire du dossier de rénovation engagé, afin d'aboutir à une solution économe et adaptée aux capacités de la commune, plutôt qu'à un abandon qui contraindrait à repartir de zéro.
              </p>
              
              <ul className="space-y-6 mt-8 list-none pl-0">
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Un projet déjà mature :</strong>
                    l'état d'avancement des études et des diagnostics techniques permet de démarrer sans repartir de zéro.
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">La préservation des finances publiques :</strong>
                    entre 100 000 et 160 000 € de fonds communaux ont déjà été engagés ; abandonner le projet actuel transformerait ces investissements en pure perte pour la commune.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Le risque sur les subventions :</strong>
                    les calendriers d'attribution des aides financières sont stricts ; tout redémarrage à blanc ferait perdre les financements mobilisables à court terme.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">L'urgence du calendrier des travaux :</strong>
                    différer la réhabilitation repousse la livraison de plusieurs années et fragilise l'accueil des enfants.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Les contraintes réglementaires :</strong>
                    les diagnostics imposent des travaux incontournables (gestion du radon, désamiantage ou confinement de l'amiante, remise aux normes de l'électricité, réfection des sanitaires et mise en conformité de l'accessibilité PMR).
                  </div>
                </li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-900 my-8 shadow-sm">
                <p className="font-medium text-center">
                  Repartir de zéro repousserait le traitement de ces impératifs prioritaires pour la santé et la sécurité des enfants.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <p className="text-sm text-stone-500 italic">
                  Pour comprendre en détail les enjeux financiers, consultez notre dossier de synthèse :
                </p>
                <Link href="/historique" className="btn-secondary whitespace-nowrap text-sm flex items-center gap-2">
                  <FileText size={16} /> Lire l'historique complet
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar (Form & Stats) */}
          <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
            
            {/* Stats Card */}
            <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-lg border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users size={120} />
              </div>
              <div className="relative z-10">
                <div className="text-emerald-400 font-bold mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Mobilisation en cours
                </div>
                <div className="text-6xl font-black mb-2 tracking-tighter">
                  {stats.count}
                </div>
                <div className="text-emerald-100 font-medium">
                  citoyens ont déjà signé la pétition.
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">Merci pour votre signature !</h3>
                  <p className="text-stone-600">Votre voix compte pour l'avenir de l'école.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-stone-900 mb-6">Je signe la pétition</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Prénom</label>
                        <input 
                          type="text" required 
                          value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})}
                          className="input-base" placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className="input-label">Nom</label>
                        <input 
                          type="text" required 
                          value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}
                          className="input-base" placeholder="Dupont"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Adresse e-mail</label>
                      <input 
                        type="email" required 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="input-base" placeholder="jean.dupont@email.com"
                      />
                    </div>
                    <div>
                      <label className="input-label">Votre lien avec l'école (Optionnel)</label>
                      <input 
                        type="text" 
                        value={formData.qualite} onChange={e => setFormData({...formData, qualite: e.target.value})}
                        className="input-base" placeholder="ex: Habitant, Parent d'élève, Ancien élève..."
                      />
                    </div>
                    <div>
                      <label className="input-label">Commune (Optionnel)</label>
                      <input 
                        type="text" 
                        value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})}
                        className="input-base" placeholder="Kergrist-Moëlou"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={status === "submitting"}
                      className="btn-primary w-full justify-center mt-2 py-4 text-lg"
                    >
                      {status === "submitting" ? "Enregistrement..." : "Signer la pétition"}
                    </button>
                    <p className="text-xs text-stone-400 text-center mt-4">
                      Vos données ne seront pas revendues. Elles servent uniquement à valider l'authenticité des signatures.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Recent Signers */}
            {stats.recent.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 mb-4 uppercase tracking-wider">Derniers signataires</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.recent.map((name, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
