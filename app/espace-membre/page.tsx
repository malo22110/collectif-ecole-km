"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Printer, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText, Target, Lightbulb, Handshake, Info, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import UserAvatar from "../components/UserAvatar";

export default function EspaceMembre() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center">Chargement...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Accès restreint</h1>
          <p className="text-stone-600 mb-6">Vous devez être membre du collectif pour accéder à cette page.</p>
          <Link href="/" className="btn-primary w-full justify-center">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between text-stone-100">
          <Link href="/" className="flex items-center gap-2 hover:text-white font-medium transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 md:pt-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-stone-900 mb-3 tracking-tight">Espace Membre</h1>
          <p className="text-lg md:text-xl text-stone-600">Votre quartier général pour la mobilisation sur le terrain.</p>
        </div>

        <div className="space-y-6 md:space-y-12">
          
          {/* Action : Print Petition (Top) */}
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border border-stone-200 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shrink-0">
              <Printer size={40} className="md:w-12 md:h-12" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black text-stone-900 mb-2">Pétition Papier</h2>
              <p className="text-stone-600 mb-4 md:mb-0 text-base md:text-lg">
                Imprimez la version papier pour récolter des signatures lors de votre porte-à-porte.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0">
              <Link 
                href="/espace-membre/imprimer" 
                target="_blank"
                className="btn-primary justify-center flex items-center gap-2 py-4 px-8 text-lg w-full md:w-auto shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white"
              >
                <Printer size={24} /> Imprimer le document
              </Link>
            </div>
          </div>
          
          {/* Consignes */}
          <div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border-2 border-emerald-200 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">
            <div className="font-black text-emerald-900 flex items-center gap-2 shrink-0 text-xl">
              <AlertTriangle size={28} /> Consignes clés
            </div>
            <ul className="text-emerald-900 flex-1 space-y-3 md:space-y-0 md:flex md:flex-wrap gap-x-8 gap-y-4 list-none text-base md:text-lg font-medium">
              <li className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div> Faire écrire <strong>en MAJUSCULES</strong></li>
              <li className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div> Ne pas oublier le <strong>lien avec l'école</strong></li>
              <li className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div> Remettre les feuilles à Axelle / Malo</li>
            </ul>
          </div>

          {/* Cheat Sheet */}
          <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 p-6 md:p-10 text-white flex items-center gap-4">
              <div className="bg-amber-400 text-stone-900 p-3 md:p-4 rounded-2xl shrink-0">
                <FileText size={32} />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-1">L'Antisèche</h2>
                <p className="text-stone-400 font-medium md:text-lg">Votre guide pour le Porte-à-Porte 🚪</p>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-12">
              
              {/* Objectif & Règle */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3 text-blue-900 font-black text-lg">
                    <Target size={24} className="text-blue-600" /> Votre objectif
                  </div>
                  <p className="text-blue-800 md:text-lg">Convaincre en 2 minutes chrono et faire signer la pétition.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3 text-amber-900 font-black text-lg">
                    <Lightbulb size={24} className="text-amber-600" /> La règle d'or
                  </div>
                  <p className="text-amber-800 md:text-lg">Restez souriant, factuel. Pas de querelles politiques. On parle d'avenir et du portefeuille de la commune.</p>
                </div>
              </div>

              {/* Accroche */}
              <div>
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100">
                  <span className="bg-stone-100 p-2 rounded-xl text-2xl">🗣️</span> 1. L'Accroche
                </h3>
                <div className="bg-stone-50 border-l-4 border-stone-900 p-6 md:p-8 rounded-r-2xl">
                  <p className="text-lg md:text-xl italic font-medium text-stone-700 leading-relaxed">
                    "Bonjour ! Je suis [Prénom], du collectif citoyen pour l'école de Kergrist-Moëlou. Je passe vous voir car la rénovation de notre école est totalement bloquée suite à un vote secret au conseil municipal. On a lancé une pétition pour exiger des explications, et surtout... pour éviter à la commune de jeter 127 000 € à la poubelle et de perdre 340 000 € de subventions ! Vous avez 2 minutes ?"
                  </p>
                </div>
              </div>

              {/* 3 Arguments */}
              <div>
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100">
                  <span className="bg-rose-100 p-2 rounded-xl text-2xl">💥</span> 2. Les 3 arguments chocs
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                      <span className="text-emerald-600">1️⃣</span> L'absurdité du vote (Le déclencheur)
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed">
                      "Lors d'un vote à bulletin secret, une majorité d'élus a refusé de payer un ajustement de 2 170 € à l'architecte. Le problème, c'est qu'en bloquant cet avenant, ils bloquent tout le dossier et nous font perdre 340 000 € d'aides. C'est un suicide financier pour la commune."
                    </p>
                  </div>

                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                      <span className="text-emerald-600">2️⃣</span> Le mythe du projet "pharaonique"
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed">
                      "Ceux qui bloquent disent que le projet coûte 735 000 €. C'est faux ! L'architecte s'était trompée, mais le projet que nous défendons ramène le budget à 550 000 €, comme prévu au départ. La facture qu'ils ont refusé de voter servait justement à forcer l'architecte à baisser son prix !"
                    </p>
                  </div>

                  <div className="bg-white border-2 border-stone-100 p-6 md:p-8 rounded-2xl shadow-sm">
                    <h4 className="font-black text-stone-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                      <span className="text-emerald-600">3️⃣</span> Le piège de l'annulation
                    </h4>
                    <p className="text-stone-600 md:text-lg leading-relaxed">
                      "Si on abandonne le projet, on jette 127 110 € d'études déjà réalisées qu'il faudra payer de toute façon. En plus, faire du 'bricolage' annule nos subventions (qui exigent 40% d'économies d'énergie). Au final, ce sont nos impôts qui paieront ces rustines à 100 %."
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Express */}
              <div>
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100">
                  <span className="bg-blue-100 p-2 rounded-xl text-2xl">🛡️</span> 3. FAQ Express
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Ça va ruiner notre budget !"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed">Faux. Le Trésor public valide un emprunt de 400 000 €, et on a 176 000 € d'excédent. Avec les 340 000 € d'aides, le reste à charge est de 212 000 €. C'est largement absorbable.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Faisons juste les urgences (radon) à 50 000€"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed">Si on fait ça, l'État ne verse AUCUNE aide. On paiera 50 000 € + les 127 000 € d'études gâchées = 177 000 € de notre poche pour une passoire thermique.</span></div>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 md:col-span-2">
                    <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Pourquoi se presser ?"</span></div>
                    <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="md:text-lg leading-relaxed">La DETR (180 000 €) est soumise à un délai très strict. Si le conseil ne débloque pas la situation maintenant, l'argent partira dans une autre commune.</span></div>
                  </div>
                </div>
              </div>

              {/* Conclusion */}
              <div>
                <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100">
                  <span className="bg-amber-100 p-2 rounded-xl text-2xl">✍️</span> 4. La conclusion
                </h3>
                <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 md:p-8 rounded-r-2xl">
                  <p className="text-lg md:text-xl font-bold text-emerald-900 leading-relaxed italic">
                    "C'est pour ça qu'on se mobilise. On ne prend pas parti dans les guerres internes, on demande juste du bon sens : réunir une commission, mettre les vrais chiffres sur la table, et sauver l'argent de la commune. Vous pouvez signer la pétition pour nous soutenir ?"
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
