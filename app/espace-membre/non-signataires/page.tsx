"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserRoundX } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface MemberName {
  name: string;
}

export default function NonSignatairesPage() {
  const [members, setMembers] = useState<MemberName[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        setError("Vous devez être connecté pour consulter cette liste.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/signatures/non-signataires", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          cache: "no-store"
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger la liste.");
        setMembers(data.members);
        setCount(data.count);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    if (!normalizedSearch) return members;
    return members.filter(member => member.name.toLocaleLowerCase("fr").includes(normalizedSearch));
  }, [members, search]);

  return (
    <main className="min-h-full overflow-y-auto bg-stone-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-stone-200 pb-5">
          <h1 className="flex items-center gap-3 text-2xl font-black text-stone-900 md:text-3xl">
            <UserRoundX className="text-amber-700" size={30} /> Membres n'ayant pas signé
          </h1>
          <p className="mt-2 text-sm text-stone-600">Membres validés dont l'adresse ne figure pas parmi les signatures de la pétition.</p>
        </header>

        {loading ? (
          <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-stone-600">
            <Loader2 className="animate-spin text-emerald-700" size={22} /> Chargement de la liste…
          </div>
        ) : error ? (
          <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-stone-700">{count} membre(s) n'ayant pas signé</p>
              <label className="relative block w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Filtrer par nom…"
                  aria-label="Filtrer les membres par nom"
                  className="input-base py-2 pl-10 text-sm"
                />
              </label>
            </div>

            <ul className="divide-y divide-stone-200 border-b border-stone-200 bg-white">
              {filteredMembers.length > 0 ? filteredMembers.map((member, index) => (
                <li key={`${member.name}-${index}`} className="px-4 py-3 text-sm font-medium text-stone-800 md:px-6">
                  {member.name}
                </li>
              )) : (
                <li className="px-4 py-10 text-center text-sm text-stone-500 md:px-6">
                  {members.length === 0 ? "Tous les membres validés ont signé." : "Aucun membre ne correspond à cette recherche."}
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}