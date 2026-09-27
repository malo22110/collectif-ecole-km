"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Printer, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
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
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between text-stone-100">
          <Link href="/" className="flex items-center gap-2 hover:text-white font-medium transition-colors">
            <ArrowLeft size={20} />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3">
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-4">Espace Membre</h1>
          <p className="text-lg text-stone-600">Bienvenue dans votre espace d'action. Vous trouverez ici tous les outils pour mobiliser autour de vous.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar Action */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer size={32} />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Kit de porte-à-porte</h2>
              <p className="text-sm text-stone-600 mb-6">
                Imprimez la version papier de la pétition pour la faire signer à vos voisins et amis.
              </p>
              <Link 
                href="/espace-membre/imprimer" 
                target="_blank"
                className="btn-primary w-full justify-center flex items-center gap-2"
              >
                <Printer size={18} /> Imprimer la pétition
              </Link>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
              <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Consignes
              </h3>
              <ul className="text-sm text-emerald-800 space-y-2 list-disc pl-4">
                <li>Demandez à écrire <strong>en MAJUSCULES</strong> pour faciliter notre saisie.</li>
                <li>Le <strong>lien avec l'école</strong> est crucial pour le Sous-Préfet.</li>
                <li>Ramenez les feuilles remplies à Axelle ou Malo.</li>
              </ul>
            </div>
          </div>

          {/* Cheat Sheet */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-stone-100">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
                  <FileText size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">L'Antisèche du Collectif</h2>
                  <p className="text-stone-500 font-medium">Opération Porte-à-Porte 🚪</p>
                </div>
              </div>

              <div className="prose prose-stone max-w-none prose-h3:text-lg prose-h3:font-bold prose-h3:text-emerald-800 prose-p:text-stone-600 prose-li:text-stone-600">
                <div className="bg-blue-50 text-blue-900 p-4 rounded-xl mb-8 border border-blue-100">
                  <p className="font-bold flex items-center gap-2 mb-1">🎯 Votre objectif :</p>
                  <p className="mb-3">Convaincre en 2 minutes chrono et faire signer la pétition.</p>
                  <p className="font-bold flex items-center gap-2 mb-1">💡 La règle d'or :</p>
                  <p className="mb-0">Restez souriant, factuel et ne rentrez pas dans les querelles du conseil municipal. On parle uniquement de l'avenir de l'école et du portefeuille de NOTRE commune.</p>
                </div>

                <h3 className="flex items-center gap-2 mt-8 mb-4 border-b pb-2"><span className="text-2xl">🗣️</span> 1. L'ACCROCHE (Pour passer le pas de la porte)</h3>
                <p className="italic bg-stone-50 p-4 rounded-xl border border-stone-200 font-medium text-stone-700">
                  "Bonjour ! Je suis [Prénom], du collectif citoyen pour l'école de Kergrist-Moëlou. Je passe vous voir car la rénovation de notre école est totalement bloquée suite à un vote secret au conseil municipal. On a lancé une pétition pour exiger des explications, et surtout... pour éviter à la commune de jeter 127 000 € déjà dépensés à la poubelle et de perdre 340 000 € de subventions ! Vous avez 2 minutes ?"
                </p>

                <h3 className="flex items-center gap-2 mt-10 mb-4 border-b pb-2"><span className="text-2xl">💥</span> 2. LES 3 ARGUMENTS CHOCS (Le cœur du problème)</h3>
                
                <h4 className="font-bold text-stone-900 text-base mb-2">1️⃣ L'absurdité du vote (Le déclencheur)</h4>
                <p>
                  "Lors d'un vote à bulletin secret, une majorité d'élus a refusé de payer une petite facture d'ajustement de 2 170 € à l'architecte. Le problème, c'est qu'en bloquant cet avenant, ils bloquent tout le dossier de financement et nous font perdre 340 000 € d'aides de l'État, de la Région et du Département. C'est un suicide financier pour la commune."
                </p>

                <h4 className="font-bold text-stone-900 text-base mb-2 mt-6">2️⃣ Le mythe du projet "pharaonique" (La vérité sur le projet)</h4>
                <p>
                  "Ceux qui ont voté contre justifient leur blocage en disant que le projet coûte plus de 735 000 €. C'est faux ! L'architecte s'était effectivement trompée dans son devis, mais le projet que nous défendons ramène justement le budget à 550 000 €, comme c'était prévu au départ et validé par le Sous-préfet. La facture qu'ils ont refusé de voter servait justement à forcer l'architecte à baisser son prix !"
                </p>

                <h4 className="font-bold text-stone-900 text-base mb-2 mt-6">3️⃣ Le piège de l'annulation (Le gouffre financier du Plan B)</h4>
                <p>
                  "Certains élus voudraient tout annuler pour faire du bricolage, mais ils ne vous disent pas le vrai coût. Si on abandonne le projet global, on jette par les fenêtres 127 110 € d'études déjà réalisées qu'il faudra payer de toute façon. En plus, faire de petits travaux annule d'office toutes nos subventions, car l'État et la Région exigent de vraies économies d'énergie (40 %). Au final, ce sont nos impôts qui paieront ces rustines à 100 %."
                </p>

                <h3 className="flex items-center gap-2 mt-10 mb-4 border-b pb-2"><span className="text-2xl">🛡️</span> 3. FAQ EXPRESS (Pour contrer les objections)</h3>
                
                <div className="space-y-6">
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <p className="font-bold text-red-800 flex gap-2 mb-2"><XCircle className="shrink-0" size={20}/> Objection 1 : "La commune n'a pas les moyens de payer un tel projet, ça va ruiner notre budget !"</p>
                    <p className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={20}/> <span className="font-medium">La parade :</span> "C'est faux. Le percepteur du Trésor public a formellement validé une capacité d'emprunt de 400 000 € pour notre commune, et nous dégageons un excédent de fonctionnement de plus de 176 000 €. Si on sauve nos 340 000 € de subventions, le reste à charge réel de l'école n'est que de 212 000 €. C'est une dépense totalement absorbable qui laisse une large marge de manœuvre pour financer le reste des projets du village."</p>
                  </div>

                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <p className="font-bold text-red-800 flex gap-2 mb-2"><XCircle className="shrink-0" size={20}/> Objection 2 : "On n'a qu'à faire uniquement les 50 000 € de travaux d'urgence pour le radon, ça suffira."</p>
                    <p className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={20}/> <span className="font-medium">La parade :</span> "Mauvaise idée. Si on fait juste ça, l'État ne verse AUCUNE aide. On paiera 50 000 € de notre poche + les 127 000 € d'études déjà faites qu'on jette à la poubelle. Total : 177 000 € gâchés, tout ça pour garder une école qui restera une passoire thermique."</p>
                  </div>

                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <p className="font-bold text-red-800 flex gap-2 mb-2"><XCircle className="shrink-0" size={20}/> Objection 3 : "Pourquoi se presser ?"</p>
                    <p className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={20}/> <span className="font-medium">La parade :</span> "Parce que la subvention de l'État (la DETR, soit plus de 180 000 €) est soumise à un délai très strict. Le dossier a été déposé. Si le conseil municipal ne débloque pas la situation maintenant, le dossier sera purement et simplement annulé et l'argent partira dans une autre commune."</p>
                  </div>
                </div>

                <h3 className="flex items-center gap-2 mt-10 mb-4 border-b pb-2"><span className="text-2xl">✍️</span> 4. LA CONCLUSION (L'Appel à l'action)</h3>
                <p className="italic bg-emerald-50 p-4 rounded-xl border border-emerald-200 font-medium text-emerald-900">
                  "C'est pour ça qu'on se mobilise au sein du collectif. On ne prend pas parti dans les guerres internes du conseil municipal, on demande juste du bon sens : réunir une commission transparente, remettre les vrais chiffres sur la table, et sauver l'argent de la commune. Vous pouvez signer la pétition juste ici pour nous soutenir ?"
                </p>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
