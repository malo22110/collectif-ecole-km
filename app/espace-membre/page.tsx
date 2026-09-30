"use client";

import React, { useState, useEffect } from "react";
import { Printer, CheckCircle2, XCircle, FileText, UserCog } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EspaceMembreDashboard() {
  const [membre, setMembre] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u && u.email) {
        const docRef = doc(db, "membres", u.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMembre(docSnap.data());
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleRequest = async (role: string) => {
    if (!auth.currentUser?.email) return;
    try {
      await updateDoc(doc(db, "membres", auth.currentUser.email), {
        roleRequest: role
      });
      setMembre({ ...membre, roleRequest: role });
      alert("Votre demande a bien été envoyée aux administrateurs.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la demande de rôle.");
    }
  };

  return (

    <div className="p-4 md:p-8 md:pt-10 max-w-5xl mx-auto w-full">
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl md:text-5xl font-black text-stone-900 mb-3 tracking-tight">Tableau de bord</h1>
        <p className="text-lg md:text-xl text-stone-600">Votre quartier général pour la mobilisation sur le terrain.</p>
      </div>

      <div className="space-y-6 md:space-y-10">
        

        {/* Role Request */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-6 print:hidden">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCog size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-stone-900 mb-1">Rôles dans le collectif</h2>
            <p className="text-stone-600 text-base mb-3">
              Votre rôle actuel : <strong className="uppercase text-stone-800">{membre?.role || 'Membre standard'}</strong>
            </p>
            {membre?.roleRequest ? (
              <p className="text-amber-600 font-medium text-sm">
                ⏳ Demande en attente pour le rôle "{membre.roleRequest}".
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => handleRoleRequest('redacteur')}
                  className="text-sm text-stone-700 bg-white border border-stone-300 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Demander l'accès Rédacteur (Articles)
                </button>
                <button 
                  onClick={() => handleRoleRequest('admin')}
                  className="text-sm text-stone-700 bg-white border border-stone-300 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Demander l'accès Administrateur
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action : Print Petition (Top) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-6 print:hidden">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Printer size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-stone-900 mb-1">Pétition Papier</h2>
            <p className="text-stone-600 text-base">
              Imprimez la version papier pour récolter des signatures lors de votre porte-à-porte.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0">
            <Link 
              href="/espace-membre/imprimer" 
              target="_blank"
              className="btn-primary justify-center flex items-center gap-2 py-3 px-6 text-base w-full md:w-auto shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white"
            >
              <Printer size={20} /> Imprimer le document
            </Link>
          </div>
        </div>
        
        {/* Consignes */}
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 flex flex-col md:flex-row gap-4 items-start md:items-center print:hidden">
          <div className="font-black text-emerald-900 flex items-center gap-2 shrink-0 text-lg">
            <span className="bg-emerald-200 w-8 h-8 rounded-full flex items-center justify-center text-emerald-800">i</span>
            Consignes :
          </div>
          <ul className="text-emerald-800 space-y-2 md:space-y-0 md:flex md:gap-6 flex-wrap text-sm md:text-base font-medium">
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600"/> Demandez si la personne a déjà signé en ligne</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600"/> L'adresse complète ou le numéro de téléphone ne sont PAS obligatoires</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600"/> La signature est indispensable</li>
          </ul>
        </div>

        {/* Anti-sèche (Argumentaire) */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-stone-900 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 print:bg-white print:text-stone-900 print:border-b print:border-stone-200">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
                <FileText className="text-emerald-400 print:text-stone-900" size={32} />
                L'Anti-Sèche du Collectif
              </h2>
              <p className="text-stone-400 text-sm md:text-base print:text-stone-600">L'argumentaire complet et vérifié pour convaincre sur le terrain.</p>
            </div>
            <button onClick={() => window.print()} className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors print:hidden">
              <Printer size={16} /> Imprimer l'anti-sèche
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 md:space-y-12">
            
            <div className="print:break-inside-avoid">
              <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                <span className="bg-amber-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">🛡️</span> FAQ Express (Spécial Porte-à-Porte)
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 print:gap-4 print:grid-cols-1">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300 print:break-inside-avoid">
                  <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"La commune n'a pas les moyens !"</span></div>
                  <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="text-base md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>Faux.</strong> Le Trésor public nous autorise 400 000 € d'emprunt. Une fois les aides déduites, le projet optimisé coûte 212 000 €. C'est largement finançable sans toucher à notre excédent.</span></div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300 print:break-inside-avoid">
                  <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"On ferait des économies en annulant tout."</span></div>
                  <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="text-base md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>C’est un gouffre.</strong> Si on annule, la loi nous oblige à payer au moins 70 000 €* d'études déjà réalisées, pour zéro travaux. En prime, on perd nos subventions.</span></div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300 print:break-inside-avoid">
                  <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Pourquoi ne pas repartir de zéro ?"</span></div>
                  <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="text-base md:text-lg leading-relaxed print:text-sm print:text-stone-900"><strong>Pire option.</strong> On jette l'argent déjà dépensé, et faire "plus petit" annule toutes nos aides (qui exigent une vraie rénovation thermique).</span></div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 print:bg-white print:p-4 print:border-stone-300 print:break-inside-avoid">
                  <div className="font-bold text-rose-700 flex gap-2 mb-3"><XCircle className="shrink-0" size={24}/> <span className="text-lg">"Faisons juste les urgences pour le radon."</span></div>
                  <div className="text-emerald-800 flex gap-2"><CheckCircle2 className="shrink-0" size={24}/> <span className="text-base md:text-lg leading-relaxed print:text-sm print:text-stone-900">Sans aide globale, la facture sera d'au moins 120 000 € (50 000 € travaux + 70 000 €* d'études jetées). Tout ça pour garder une passoire thermique.</span></div>
                </div>
              </div>
            </div>

            <div className="print:break-inside-avoid">
              <h3 className="flex items-center gap-3 text-xl md:text-2xl font-black text-stone-900 mb-6 pb-2 border-b-2 border-stone-100 print:mb-3">
                <span className="bg-amber-100 p-2 rounded-xl text-2xl print:bg-white print:p-0">✍️</span> La conclusion
              </h3>
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 md:p-8 rounded-r-2xl print:bg-white print:p-4">
                <p className="text-lg md:text-xl font-bold text-emerald-900 leading-relaxed italic print:text-base print:text-stone-900">
                  "On veut juste protéger les finances de la commune et offrir une école saine. Il faut réunir une commission, valider l'Option 1 pour garder nos subventions. Vous pouvez signer la pétition pour appuyer cette démarche ?"
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
