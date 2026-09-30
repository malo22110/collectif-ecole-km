"use client";

import React, { useEffect, useState, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Loader2, Search, Filter } from "lucide-react";

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
  
  const [search, setSearch] = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [filterQualite, setFilterQualite] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const filteredSignatures = useMemo(() => {
    return signatures.filter(sig => {
      const matchSearch = search === "" || 
        `${sig.prenom} ${sig.nom}`.toLowerCase().includes(search.toLowerCase());
      const matchVille = filterVille === "" || sig.ville.includes(filterVille);
      const matchQualite = filterQualite === "" || sig.qualite.includes(filterQualite);
      return matchSearch && matchVille && matchQualite;
    });
  }, [signatures, search, filterVille, filterQualite]);

  const totalPages = Math.ceil(filteredSignatures.length / itemsPerPage);
  const currentItems = filteredSignatures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const villesUniques = Array.from(new Set(signatures.map(s => s.ville))).filter(Boolean);
  const qualitesUniques = Array.from(new Set(signatures.map(s => s.qualite))).filter(Boolean);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterVille, filterQualite]);

  return (
    <div className="p-4 md:p-8 md:pt-10 max-w-5xl mx-auto w-full">
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
          
          {/* Filters Bar */}
          <div className="p-6 border-b border-stone-200 bg-stone-50 space-y-4 md:space-y-0 md:flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un nom..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-4">
              <select 
                value={filterVille} 
                onChange={e => setFilterVille(e.target.value)}
                className="px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
              >
                <option value="">Toutes les communes</option>
                {villesUniques.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              <select 
                value={filterQualite} 
                onChange={e => setFilterQualite(e.target.value)}
                className="px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
              >
                <option value="">Tous les liens</option>
                {qualitesUniques.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          
          <div className="p-4 border-b border-stone-100 bg-white flex justify-between items-center text-sm text-stone-500">
            <span className="font-bold text-stone-900">{filteredSignatures.length} résultat(s)</span>
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
                {currentItems.length > 0 ? (
                  currentItems.map((sig, idx) => (
                    <tr key={sig.id || idx} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 font-semibold text-stone-900">{sig.prenom} {sig.nom}</td>
                      <td className="p-4 text-stone-600 text-sm max-w-xs truncate" title={sig.qualite}>{sig.qualite}</td>
                      <td className="p-4 text-stone-600 text-sm">{sig.ville}</td>
                      <td className="p-4 text-stone-500 text-sm text-right whitespace-nowrap">
                        {sig.createdAt ? new Date(sig.createdAt).toLocaleDateString("fr-FR") : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">
                      Aucun signataire ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-stone-50"
              >
                Précédent
              </button>
              <span className="text-sm text-stone-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-stone-50"
              >
                Suivant
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
