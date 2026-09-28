"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, serverTimestamp, getDocs, query, where, getCountFromServer, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PenTool, CheckCircle2, AlertCircle, Users, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import UserAvatar from "../components/UserAvatar";
import ShareButton from "../components/ShareButton";
import { ArrowLeft } from "lucide-react";

export default function PetitionPage() {
  const [formData, setFormData] = useState({ prenom: "", nom: "", email: "", ville: "", qualite: "", qualiteAutre: "", honeypot: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  
  useEffect(() => {
    try {
      if (localStorage.getItem("petition_signed")) {
        setStatus("success");
      }
    } catch (e) {}
  }, []);
  const [stats, setStats] = useState({ count: 0, recent: [] as string[] });
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const unsubStats = onSnapshot(doc(db, "stats", "petition"), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as { count: number; recent: string[] });
      }
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setIsMember(true);
        // Try to fetch member details
        try {
          const q = query(collection(db, 'membres'), where('email', '==', user.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const memberData = snap.docs[0].data();
            setFormData(prev => ({
              ...prev,
              email: user.email || "",
              prenom: memberData.prenom || "",
              nom: memberData.nom || ""
            }));
          } else {
            setFormData(prev => ({ ...prev, email: user.email || "" }));
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsMember(false);
      }
    });

    return () => {
      unsubStats();
      unsubAuth();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      

      const { qualiteAutre, ...rest } = formData;
      const cleanEmail = (formData.email || "").trim().toLowerCase();
      const payload: any = { ...rest, email: cleanEmail, createdAt: serverTimestamp() };
      
      if (payload.qualite === "Autre" && qualiteAutre) {
        payload.qualite = qualiteAutre;
      }
      
      try {
        await setDoc(doc(db, "signatures", cleanEmail), payload);
      } catch (err: any) {
        if (err.code === 'permission-denied' || err.code === 'already-exists') {
          alert("Cette adresse e-mail a déjà été utilisée pour signer la pétition.");
          setStatus("idle");
          return;
        }
        throw err;
      }

      // Auto-mise à jour du compteur public d'un coup
      try {
        const snapCount = await getCountFromServer(collection(db, "signatures"));
        const realCount = snapCount.data().count;
        const statsRef = doc(db, "stats", "petition");
        const statsSnap = await getDoc(statsRef);
        const currentRecent = statsSnap.exists() ? (statsSnap.data().recent || []) : [];
        const newName = `${payload.prenom} ${payload.nom.charAt(0)}.${payload.qualite ? ` (${payload.qualite})` : ''}`;
        
        await setDoc(statsRef, {
          count: realCount,
          recent: [newName, ...currentRecent.filter((n: string) => n !== newName)].slice(0, 10),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Auto-sync stats petition:", e);
      }

      setStatus("success");
      try {
        localStorage.setItem("petition_signed", "true");
      } catch (e) {}
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-emerald-900 border-b border-emerald-800/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between text-emerald-100">
          <Link href="/" className="flex items-center gap-2 hover:text-white font-medium transition-colors text-sm">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserAvatar />
          </div>
        </div>
      </header>
      
      {/* Header Héro */}
      <div className="bg-emerald-900 text-emerald-50 py-20 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero_petition.jpg" alt="Enfants à l'école de Kergrist-Moëlou" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-emerald-900/75 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent pointer-events-none" />
        </div>
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
              Rénovation de l'école de Kergrist-Moëlou : valorisons les études engagées vers un projet maîtrisé
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 space-y-6">
              <p className="text-lg font-medium text-stone-800 leading-relaxed border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-3 pr-4 rounded-r-xl">
                Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation déjà engagé, afin d'aboutir à une solution économe (retour à l'enveloppe de 550 000 € HT) et adaptée aux capacités de la commune, plutôt qu'à un blocage ou un abandon qui contraindrait à repartir de zéro.
              </p>
              
              <ul className="space-y-6 mt-8 list-none pl-0">
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Un projet déjà mature :</strong>
                    L'état d'avancement des études, des plans et des diagnostics techniques permet de démarrer les travaux sans repartir d'une page blanche. L'objectif est d'optimiser ce qui existe, pas de tout recommencer.
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">La préservation de l'argent public :</strong>
                    Exactement 127 110 € de fonds communaux ont déjà été engagés dans les études obligatoires (architectes, diagnostics) et devront être payés (règle du service fait). Refuser de voter la mise à jour de 2 170 € demandée par l'architecte pour baisser le coût des travaux conduit à bloquer le projet et transforme ces 127 110 € d'argent public en pure perte pour la commune.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Le risque critique sur les subventions :</strong>
                    Le dossier actuel permet de sécuriser 340 000 € d'aides (État, Région, Département). Ces financements exigent strictement un projet global assurant 40 % d'économie d'énergie et sont soumis à des calendriers très stricts (décembre 2026 pour l'État). Un abandon ou de petits "travaux rustines" nous feraient perdre définitivement cette manne financière. La mairie devra alors tout payer à 100 %.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">L'urgence du calendrier des travaux :</strong>
                    Différer la réhabilitation repousse la livraison de plusieurs années (avec l'inflation inévitable des coûts de construction) et fragilise durablement les conditions d'apprentissage et l'accueil de nos enfants.
                  </div>
                </li>

                <li className="flex gap-4">
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={24} />
                  <div>
                    <strong className="text-stone-900 block mb-1">Les contraintes réglementaires et sanitaires :</strong>
                    Les diagnostics imposent des travaux incontournables et urgents : gestion du radon, désamiantage du préau, remise aux normes de l'électricité, isolation d'un bâtiment très énergivore, réfection des sanitaires par l'intérieur et mise en conformité de l'accessibilité PMR.
                  </div>
                </li>
              </ul>
              
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-amber-900 my-8 shadow-sm">
                <p className="font-medium text-center">
                  Repartir de zéro ou geler le projet repousserait dangereusement le traitement de ces impératifs prioritaires pour la santé et la sécurité des enfants.
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
                  <p className="text-stone-600 mb-8">Votre voix compte pour l'avenir de l'école.</p>
                  
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-3">La mobilisation continue !</h4>
                    <p className="text-sm text-emerald-800 mb-6">Partagez la pétition autour de vous pour donner plus de poids à notre demande.</p>
                    <ShareButton 
                      url="https://collectif-ecole-km.fr/petition" 
                      title="Pétition : Sauvons le projet de rénovation de l'école de Kergrist-Moëlou" 
                      text="Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation engagé, afin d'aboutir à une solution économe plutôt qu'à un abandon." 
                      variant="primary" 
                      className="w-full justify-center inline-flex items-center gap-2 font-bold px-6 py-4 rounded-2xl transition-all text-base border"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-stone-900 mb-6">Je signe la pétition</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Honeypot Field */}
                    <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
                      <label htmlFor="a_t_h_n_y_p_t"></label>
                      <input 
                        type="text" 
                        id="a_t_h_n_y_p_t"
                        name="a_t_h_n_y_p_t"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.honeypot} 
                        onChange={e => setFormData({...formData, honeypot: e.target.value})}
                      />
                    </div>
                    
                    {isMember && (
                      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-sm flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} />
                        Vous êtes identifié(e) comme membre du collectif.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Prénom</label>
                        <input 
                          type="text" required 
                          value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})}
                          className={`input-base ${isMember ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : ''}`} placeholder="Jean"
                          readOnly={isMember && !!formData.prenom}
                        />
                      </div>
                      <div>
                        <label className="input-label">Nom</label>
                        <input 
                          type="text" required 
                          value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}
                          className={`input-base ${isMember ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : ''}`} placeholder="Dupont"
                          readOnly={isMember && !!formData.nom}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Adresse e-mail</label>
                      <input 
                        type="email" required 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className={`input-base ${isMember ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : ''}`} placeholder="jean.dupont@email.com"
                        readOnly={isMember && !!formData.email}
                      />
                    </div>
                    <div>
                      <label className="input-label">
                        Commune de résidence
                        <span className="block text-xs text-stone-500 font-normal mt-0.5">Très important pour prouver la proximité géographique.</span>
                      </label>
                      <input 
                        type="text" required
                        value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})}
                        className="input-base" placeholder="Ex: Kergrist-Moëlou"
                      />
                    </div>
                    <div>
                      <label className="input-label">Votre lien avec l'école</label>
                      <select 
                        required
                        value={formData.qualite === "Autre" ? "Autre" : formData.qualite} 
                        onChange={e => setFormData({...formData, qualite: e.target.value})}
                        className="input-base"
                      >
                        <option value="" disabled>Sélectionnez une option</option>
                        <option value="Habitant(e) de Kergrist-Moëlou">Habitant(e) de Kergrist-Moëlou</option>
                        <option value="Parent d'élève (actuel ou futur)">Parent d'élève (actuel ou futur)</option>
                        <option value="Ancien(ne) élève">Ancien(ne) élève</option>
                        <option value="Ancien membre de l'équipe éducative ou du personnel">Ancien membre de l'équipe éducative ou du personnel</option>
                        <option value="Habitant(e) d'une commune voisine">Habitant(e) d'une commune voisine (1/3 des élèves sont extérieurs)</option>
                        <option value="Autre">Autre (précisez)</option>
                      </select>
                      
                      {formData.qualite === "Autre" && (
                        <div className="mt-3">
                          <input 
                            type="text" required
                            onChange={e => setFormData({...formData, qualiteAutre: e.target.value})}
                            className="input-base" placeholder="Précisez votre lien..."
                          />
                        </div>
                      )}
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
