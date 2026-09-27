"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PenTool, CheckCircle2, AlertCircle, Users, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PetitionPage() {
  const [formData, setFormData] = useState({ prenom: "", nom: "", email: "", ville: "" });
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
            Non à un budget insoutenable, Oui à une rénovation responsable ! Demandez avec nous la création d'une commission extra-municipale.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content (Texte de la pétition) */}
          <div className="flex-1 bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4">
              Texte de la pétition
            </h2>
            <div className="prose prose-stone max-w-none text-stone-700 space-y-6">
              <p><strong>À l'attention de Madame la Maire et des membres du Conseil Municipal de Kergrist-Moëlou,</strong></p>
              
              <p>
                Nous, citoyennes et citoyens, parents d'élèves, habitants de Kergrist-Moëlou et alentours, exprimons notre profonde inquiétude face à la gestion actuelle du projet de réhabilitation de notre école communale.
              </p>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl text-amber-900 my-8">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Nos constats
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Le projet a dérapé à <strong>735 000 € HT</strong> (contre 550 000 € votés initialement).</li>
                  <li>Le refus d'un avenant d'architecte de 2 170 € bloque actuellement toute avancée et menace <strong>340 000 € de subventions</strong> publiques.</li>
                  <li>L'abandon du projet ("table rase") ou le "saupoudrage" de petits travaux détruirait l'éligibilité aux aides, créant un déficit comptable majeur.</li>
                </ul>
              </div>

              <p>
                L'école est le cœur battant de notre commune. Son avenir ne peut être hypothéqué par des décisions précipitées ou des blocages administratifs qui compromettent la sécurité financière du village.
              </p>

              <h3 className="text-xl font-bold text-stone-900 mt-8 mb-4">Ce que nous demandons :</h3>
              <ol className="list-decimal pl-5 space-y-4 font-medium text-stone-800">
                <li><strong>La création immédiate d'une commission extra-municipale</strong> intégrant des citoyens et des parents d'élèves pour garantir la transparence du projet.</li>
                <li><strong>Le retour à l'enveloppe budgétaire initiale de 550 000 € HT</strong> (Option 1), seule garante de l'obtention des 340 000 € d'aides (État, Région, Département).</li>
                <li><strong>La reprise immédiate du dialogue</strong> avec le cabinet d'architectes pour finaliser les plans et lancer les travaux avant l'échéance des subventions (décembre 2026).</li>
              </ol>

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
