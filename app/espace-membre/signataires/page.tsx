"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import UserAvatar from "../../components/UserAvatar";

type Signature = {
  id: string;
  prenom: string;
  nom: string;
  ville: string;
  qualite: string;
  createdAt: string;
};

export default function SignatairesPage() {
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const token = await u.getIdToken();
          const res = await fetch("/api/signatures", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Erreur d'accès.");
          } else {
            const data = await res.json();
            setSignatures(data.signatures);
          }
        } catch (err) {
          setError("Erreur de connexion.");
        }
      } else {
        setError("Non connecté.");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between text-stone-100">
          <Link href="/espace-membre" className="flex items-center gap-2 hover:text-white font-medium transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour à l'espace membre</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8 md:pt-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-3 flex items-center gap-3">
            <Users className="text-emerald-600" size={36} />
            Liste des Signataires
          </h1>
          <p className="text-lg text-stone-600">
            Consultation de la liste des signatures. Par mesure de confidentialité, les adresses e-mail sont masquées.
          </p>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-stone-200 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-emerald-500" />
            Chargement des signataires...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <span className="font-bold text-stone-900">Total : {signatures.length} signataires</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-500 text-sm border-b border-stone-100">
                    <th className="p-4 font-medium">Prénom Nom</th>
                    <th className="p-4 font-medium">Lien avec l'école</th>
                    <th className="p-4 font-medium">Commune</th>
                    <th className="p-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {signatures.map((sig, idx) => (
                    <tr key={sig.id || idx} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 font-semibold text-stone-900">{sig.prenom} {sig.nom}</td>
                      <td className="p-4 text-stone-600 text-sm">{sig.qualite}</td>
                      <td className="p-4 text-stone-600 text-sm">{sig.ville}</td>
                      <td className="p-4 text-stone-500 text-sm text-right">
                        {sig.createdAt ? new Date(sig.createdAt).toLocaleDateString("fr-FR") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
