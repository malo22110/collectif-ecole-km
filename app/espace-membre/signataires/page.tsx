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
    <div className="flex flex-col h-full w-full bg-stone-50">
      <div className="p-4 md:p-8 border-b border-stone-200 bg-white">
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 mb-2 flex items-center gap-3">
          <Users className="text-emerald-600" size={28} />
          Liste des Signataires
        </h1>
        <p className="text-stone-500 text-sm md:text-base">
          Consultation de la liste complète. Les adresses e-mail sont masquées par mesure de confidentialité.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-500 min-h-[50vh]">
          <Loader2 className="animate-spin w-10 h-10 mb-4 text-emerald-500" />
          Chargement des signataires...
        </div>
      ) : error ? (
        <div className="m-8 bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
          {error}
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-4 md:px-8 py-4 bg-white border-b border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher par nom..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-base pl-10 py-2 text-sm"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <select 
                value={filterVille} 
                onChange={e => setFilterVille(e.target.value)}
                className="input-base flex-1 md:flex-none py-2 text-sm cursor-pointer"
              >
                <option value="">Toutes les communes</option>
                {villesUniques.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              <select 
                value={filterQualite} 
                onChange={e => setFilterQualite(e.target.value)}
                className="input-base flex-1 md:flex-none py-2 text-sm cursor-pointer"
              >
                <option value="">Tous les liens</option>
                {qualitesUniques.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          
          <div className="px-4 md:px-8 py-3 bg-stone-50 border-b border-stone-200 flex justify-between items-center text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">
            <span>{filteredSignatures.length} résultat(s) trouvés</span>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-100/90 backdrop-blur-sm shadow-sm z-10">
                <tr className="text-stone-500 text-xs uppercase tracking-wider">
                  <th className="p-4 md:px-8 font-semibold">Prénom Nom</th>
                  <th className="p-4 md:px-8 font-semibold">Lien avec l'école</th>
                  <th className="p-4 md:px-8 font-semibold">Commune</th>
                  <th className="p-4 md:px-8 font-semibold text-right">Date de signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {currentItems.length > 0 ? (
                  currentItems.map((sig, idx) => (
                    <tr key={sig.id || idx} className="hover:bg-emerald-50/50 transition-colors group">
                      <td className="p-4 md:px-8 font-medium text-stone-900">{sig.prenom} {sig.nom}</td>
                      <td className="p-4 md:px-8 text-stone-600 text-sm">{sig.qualite}</td>
                      <td className="p-4 md:px-8 text-stone-600 text-sm">{sig.ville}</td>
                      <td className="p-4 md:px-8 text-stone-500 text-sm text-right whitespace-nowrap">
                        {sig.createdAt ? new Date(sig.createdAt).toLocaleDateString("fr-FR", {day: 'numeric', month: 'long', year: 'numeric'}) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-stone-500">
                      Aucun signataire ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 md:px-8 border-t border-stone-200 bg-white flex items-center justify-between shrink-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 disabled:opacity-50 disabled:bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm font-medium text-stone-600 bg-stone-100 px-4 py-1.5 rounded-full">
                Page {currentPage} sur {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 disabled:opacity-50 disabled:bg-stone-50 hover:bg-stone-100 transition-colors"
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
