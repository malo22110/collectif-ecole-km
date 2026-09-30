"use client";

import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import { ShieldAlert, Search, PenLine, Save, X, Check } from "lucide-react";

// [SPEC-CORRECTEUR-01] Seuls les membres avec le rôle 'correcteur' ou 'admin' peuvent accéder à cette page
// et modifier les entrées de la pétition (prenom, nom, ville, qualite, email).

type Signature = {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  ville: string;
  qualite: string;
  createdAt?: string;
};

export default function CorrecteurPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Signature>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Vérification du rôle au montage
  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) {
      setHasAccess(false);
      return;
    }
    const checkRole = async () => {
      try {
        const snap = await getDoc(doc(db, "membres", email));
        if (snap.exists()) {
          const roles = Array.isArray(snap.data().roles)
            ? snap.data().roles
            : snap.data().role
            ? [snap.data().role]
            : [];
          setHasAccess(roles.includes("admin") || roles.includes("correcteur"));
        } else {
          setHasAccess(false);
        }
      } catch {
        setHasAccess(false);
      }
    };
    checkRole();
  }, []);

  // Chargement temps-réel des signatures
  useEffect(() => {
    if (!hasAccess) return;
    const unsub = onSnapshot(collection(db, "signatures"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Signature[];
      data.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setSignatures(data);
    });
    return () => unsub();
  }, [hasAccess]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return signatures.filter(
      (s) =>
        !q ||
        `${s.prenom} ${s.nom} ${s.ville} ${s.qualite} ${s.email || ""}`
          .toLowerCase()
          .includes(q)
    );
  }, [signatures, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startEdit = (sig: Signature) => {
    setEditingId(sig.id);
    setEditForm({ ...sig });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // [SPEC-CORRECTEUR-02] Seuls les champs prenom, nom, ville, qualite, email sont modifiables.
  // createdAt et id sont immuables.
  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "signatures", editingId), {
        prenom: editForm.prenom?.trim() || "",
        nom: editForm.nom?.trim() || "",
        ville: editForm.ville?.trim() || "",
        qualite: editForm.qualite?.trim() || "",
        email: editForm.email?.trim().toLowerCase() || "",
      });
      setSavedId(editingId);
      setTimeout(() => setSavedId(null), 2000);
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
    }
    setSaving(false);
  };

  // --- Guards ---
  if (hasAccess === null)
    return (
      <div className="p-8 text-center text-stone-500">
        Vérification des droits...
      </div>
    );

  if (!hasAccess)
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-red-700">Accès refusé</h2>
        <p className="text-stone-500">
          Vous n'avez pas les droits pour accéder à cette page.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="p-4 md:p-8 border-b border-stone-200 bg-white">
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 mb-1 flex items-center gap-3">
          <PenLine className="text-emerald-600" size={28} />
          Correcteur de Pétition
        </h1>
        <p className="text-stone-500 text-sm">
          Corrigez les fautes de frappe ou erreurs dans les entrées de la
          pétition. Seuls les champs nom, prénom, ville, lien et e-mail peuvent
          être modifiés.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 md:px-8 bg-white border-b border-stone-200">
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input-base pl-10 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-stone-400 mt-2">
          {filtered.length} entrée(s)
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-stone-100/90 backdrop-blur-sm shadow-sm z-10 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 md:px-6 font-semibold">Prénom</th>
              <th className="p-3 md:px-6 font-semibold">Nom</th>
              <th className="p-3 md:px-6 font-semibold hidden md:table-cell">Lien avec l'école</th>
              <th className="p-3 md:px-6 font-semibold hidden lg:table-cell">Commune</th>
              <th className="p-3 md:px-6 font-semibold hidden xl:table-cell">E-mail</th>
              <th className="p-3 md:px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {currentItems.map((sig) =>
              editingId === sig.id ? (
                // Ligne d'édition
                <tr key={sig.id} className="bg-emerald-50/60">
                  <td className="p-2 md:px-4">
                    <input
                      className="input-base py-1 text-sm"
                      value={editForm.prenom || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, prenom: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 md:px-4">
                    <input
                      className="input-base py-1 text-sm"
                      value={editForm.nom || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nom: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 md:px-4 hidden md:table-cell">
                    <input
                      className="input-base py-1 text-sm"
                      value={editForm.qualite || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, qualite: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 md:px-4 hidden lg:table-cell">
                    <input
                      className="input-base py-1 text-sm"
                      value={editForm.ville || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, ville: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 md:px-4 hidden xl:table-cell">
                    <input
                      type="email"
                      className="input-base py-1 text-sm"
                      value={editForm.email || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 md:px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                        aria-label="Enregistrer"
                      >
                        <Save size={14} />
                        {saving ? "..." : "Enregistrer"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                        aria-label="Annuler"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Ligne de lecture
                <tr
                  key={sig.id}
                  className={`hover:bg-stone-50 transition-colors group ${
                    savedId === sig.id ? "bg-emerald-50" : ""
                  }`}
                >
                  <td className="p-3 md:px-6 font-medium text-stone-900">
                    {savedId === sig.id && (
                      <Check
                        size={14}
                        className="inline mr-1 text-emerald-600"
                      />
                    )}
                    {sig.prenom}
                  </td>
                  <td className="p-3 md:px-6 text-stone-700">{sig.nom}</td>
                  <td className="p-3 md:px-6 text-stone-600 hidden md:table-cell">
                    {sig.qualite}
                  </td>
                  <td className="p-3 md:px-6 text-stone-600 hidden lg:table-cell">
                    {sig.ville}
                  </td>
                  <td className="p-3 md:px-6 text-stone-400 text-xs hidden xl:table-cell">
                    {sig.email ? (
                      <span className="font-mono">{sig.email}</span>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>
                  <td className="p-3 md:px-6 text-right">
                    <button
                      onClick={() => startEdit(sig)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      aria-label={`Éditer l'entrée de ${sig.prenom} ${sig.nom}`}
                    >
                      <PenLine size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 md:px-8 border-t border-stone-200 bg-white flex items-center justify-between shrink-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-100"
          >
            Précédent
          </button>
          <span className="text-sm font-medium text-stone-600 bg-stone-100 px-4 py-1.5 rounded-full">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 disabled:opacity-50 hover:bg-stone-100"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
