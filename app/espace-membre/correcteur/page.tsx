"use client";

import React, { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  ShieldAlert,
  Search,
  PenLine,
  Save,
  X,
  Check,
  Download,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import {
  findPotentialPetitionDuplicatePairs,
  groupPetitionSigners,
} from "@/lib/petitionSignerGroups";
import { calculatePetitionStats } from "@/functions/src/petitionStats";

// [SPEC-CORRECTEUR-01] Seuls les membres avec le rôle 'correcteur' ou 'admin' peuvent accéder à cette page
// et modifier les entrées de la pétition (prenom, nom, ville, qualite, email).

type Signature = {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
  ville: string;
  qualite: string;
  source?: "papier" | "en ligne" | "accord_collectif";
  createdAt?: string;
  potentialDuplicate?: boolean;
  potentialDuplicateCandidates?: string[];
};

export default function CorrecteurPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Signature>>({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
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
          new Date(a.createdAt || 0).getTime(),
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
          .includes(q),
    );
  }, [signatures, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const potentialDuplicatePairs = useMemo(() => {
    const groupedSigners = groupPetitionSigners(
      signatures.map((signature) => ({
        id: signature.id,
        prenom: signature.prenom || "",
        nom: signature.nom || "",
        ville: signature.ville || "",
        qualite: signature.qualite || "",
        signature: signature.email || "",
        source: signature.source || "en ligne",
        potentialDuplicate: false,
      })),
    );
    return findPotentialPetitionDuplicatePairs(groupedSigners);
  }, [signatures]);
  const petitionStats = useMemo(
    () => calculatePetitionStats(signatures),
    [signatures],
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

  const handleExport = async () => {
    const user = auth.currentUser;
    if (!user) {
      setExportError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    setExporting(true);
    setExportError("");
    try {
      const response = await fetch("/api/signatures/export", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "L'export a échoué.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `signataires-petition-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "L'export a échoué.",
      );
    } finally {
      setExporting(false);
    }
  };

  // [SPEC-CORRECTEUR-04] A reviewer chooses and confirms one exact record; deleting a duplicate pair is never automatic.
  const handleDeleteDuplicate = async (signatureId: string) => {
    const signature = signatures.find((item) => item.id === signatureId);
    if (!signature) return;
    const signerName =
      `${signature.prenom} ${signature.nom}`.trim() || "ce signataire";
    if (
      !window.confirm(
        `Supprimer définitivement l’entrée de ${signerName} (${signature.source || "en ligne"}) ? Cette action est irréversible.`,
      )
    )
      return;

    setDeletingId(signatureId);
    setDeleteError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const response = await fetch(
        `/api/signatures/${encodeURIComponent(signatureId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmed: true }),
          cache: "no-store",
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(result?.error || "La suppression a échoué.");
      setSignatures((current) =>
        current.filter((item) => item.id !== signatureId),
      );
      if (editingId === signatureId) cancelEdit();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cette entrée.",
      );
    } finally {
      setDeletingId(null);
    }
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={18}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="input-base py-2 pl-10 text-sm"
              aria-label="Rechercher parmi les signataires"
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            {exporting ? "Préparation…" : "Exporter tous les signataires (CSV)"}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          {filtered.length} entrée(s)
        </p>
        {exportError && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700">
            {exportError}
          </p>
        )}
      </div>

      <section
        className="border-b border-amber-200 bg-amber-50/70 px-4 py-4 md:px-8"
        aria-labelledby="signature-duplicate-analysis-title"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2
              id="signature-duplicate-analysis-title"
              className="font-bold text-stone-900"
            >
              Doublons potentiels · {potentialDuplicatePairs.length} paire(s)
            </h2>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              Rapprochements de noms identiques ou proches dans une même
              commune. Ce sont des alertes à vérifier, jamais une fusion
              automatique. Les signatures papier, en ligne et accords de
              principe sont comparés ensemble.
            </p>
            {deleteError && (
              <p
                role="alert"
                className="mt-2 text-sm font-semibold text-rose-800"
              >
                {deleteError}
              </p>
            )}
            {potentialDuplicatePairs.length > 0 && (
              <ul className="mt-3 max-h-80 divide-y divide-amber-200 overflow-y-auto border-y border-amber-200">
                {potentialDuplicatePairs.slice(0, 100).map((pair) => (
                  <li
                    key={`${pair.firstRow}:${pair.secondRow}`}
                    className="flex flex-col gap-2 py-3 text-sm text-stone-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold">
                        {pair.first.prenom} {pair.first.nom}
                      </span>
                      <span className="text-stone-600">
                        {" "}
                        ({pair.first.ville || "commune non précisée"},{" "}
                        {pair.first.source === "papier"
                          ? "papier"
                          : pair.first.source === "accord_collectif"
                            ? "accord de principe"
                            : "en ligne"}
                        )
                      </span>
                      <span className="mx-2 text-amber-800" aria-hidden="true">
                        ↔
                      </span>
                      <span className="font-semibold">
                        {pair.second.prenom} {pair.second.nom}
                      </span>
                      <span className="text-stone-600">
                        {" "}
                        ({pair.second.ville || "commune non précisée"},{" "}
                        {pair.second.source === "papier"
                          ? "papier"
                          : pair.second.source === "accord_collectif"
                            ? "accord de principe"
                            : "en ligne"}
                        )
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {pair.first.id && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteDuplicate(pair.first.id!)
                          }
                          disabled={Boolean(deletingId)}
                          aria-label={`Supprimer l’entrée ${pair.first.prenom} ${pair.first.nom} (${pair.first.source || "en ligne"})`}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded border border-rose-300 px-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === pair.first.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} aria-hidden="true" />
                          )}
                          Supprimer cette entrée
                        </button>
                      )}
                      {pair.second.id && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteDuplicate(pair.second.id!)
                          }
                          disabled={Boolean(deletingId)}
                          aria-label={`Supprimer l’entrée ${pair.second.prenom} ${pair.second.nom} (${pair.second.source || "en ligne"})`}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded border border-rose-300 px-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === pair.second.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} aria-hidden="true" />
                          )}
                          Supprimer cette entrée
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {potentialDuplicatePairs.length > 100 && (
              <p className="mt-2 text-xs font-medium text-amber-900">
                Affichage des 100 premières paires sur{" "}
                {potentialDuplicatePairs.length}. Utilise la recherche pour
                examiner un nom précis.
              </p>
            )}
            {potentialDuplicatePairs.length === 0 && (
              <p className="mt-2 text-sm text-stone-600">
                Aucune paire candidate détectée.
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        className="border-b border-stone-200 bg-white px-4 py-4 md:px-8"
        aria-labelledby="petition-statistics-title"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="petition-statistics-title"
            className="font-bold text-stone-900"
          >
            Statistiques de la pétition
          </h2>
          <span className="text-sm font-semibold text-stone-700">
            {petitionStats.total} signataire(s) au total
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="border-l-2 border-emerald-700 pl-3">
            <dt className="text-xs text-stone-500">
              Habitants de Kergrist-Moëlou
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-emerald-900">
              {petitionStats.habitantsKergrist}{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.habitantsKergristPercent.toLocaleString(
                  "fr-FR",
                  { maximumFractionDigits: 1 },
                )}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-stone-300 pl-3">
            <dt className="text-xs text-stone-500">
              Parents d’élèves (catégorie)
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-stone-900">
              {petitionStats.parentsEleves}{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.parentsElevesPercent.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-stone-300 pl-3">
            <dt className="text-xs text-stone-500">Communes voisines</dt>
            <dd className="mt-0.5 text-lg font-bold text-stone-900">
              {petitionStats.communesVoisines}{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.communesVoisinesPercent.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-stone-300 pl-3">
            <dt className="text-xs text-stone-500">Autres soutiens</dt>
            <dd className="mt-0.5 text-lg font-bold text-stone-900">
              {petitionStats.autres}{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.autresPercent.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-amber-500 pl-3">
            <dt className="text-xs text-stone-500">
              Qualité déclarée « parent d’élève »*
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-stone-900">
              {petitionStats.declaredParentOfPupilQuality}{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.declaredParentOfPupilQualityPercent.toLocaleString(
                  "fr-FR",
                  { maximumFractionDigits: 1 },
                )}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-amber-700 pl-3">
            <dt className="text-xs text-stone-500">
              Signataires / 47 parents au total*
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-amber-900">
              {petitionStats.declaredParentOfPupilQuality} / 47{" "}
              <span className="text-sm font-semibold">
                (
                {petitionStats.parentSignersOfKnownParentsPercent.toLocaleString(
                  "fr-FR",
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                )}
                %)
              </span>
            </dd>
          </div>
          <div className="border-l-2 border-emerald-700 pl-3">
            <dt className="text-xs text-stone-500">
              Habitants / base électorale estimée*
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-emerald-900">
              {petitionStats.habitantsKergrist} / 539{" "}
              <span className="text-sm font-semibold">
                (
                {(
                  petitionStats.kergristElectorateEstimatePercent ?? 0
                ).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                %)
              </span>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-stone-500">
          * La part / 47 compare les qualités déclarées « Parent d’élève » au
          nombre total de parents communiqué (47); elle ne confirme pas
          l’identité de parent. La part électorale utilise une base estimée de
          539 habitants en âge de voter, à confirmer et actualiser.
        </p>
        <details className="mt-3 text-xs text-stone-600">
          <summary className="min-h-10 cursor-pointer py-2 font-semibold text-stone-700">
            Règles de classement
          </summary>
          <ol className="list-decimal space-y-1 pl-5 leading-5">
            <li>
              Kergrist si la commune contient « kergrist » ou si le lien
              contient « habitant(e) de Kergrist ».
            </li>
            <li>
              Sinon, parent d’élève si le lien déclaré contient à la fois «
              parent » et « élève »; l’accent est ignoré.
            </li>
            <li>
              Sinon, commune voisine si le lien contient « voisine » ou qu’une
              commune non vide est renseignée.
            </li>
            <li>
              Toutes les autres entrées sont classées « Autres soutiens ».
              Chaque entrée est comptée une seule fois, selon cette priorité.
            </li>
          </ol>
        </details>
      </section>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-stone-100/90 backdrop-blur-sm shadow-sm z-10 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3 md:px-6 font-semibold">Prénom</th>
              <th className="p-3 md:px-6 font-semibold">Nom</th>
              <th className="p-3 md:px-6 font-semibold hidden md:table-cell">
                Lien avec l'école
              </th>
              <th className="p-3 md:px-6 font-semibold hidden lg:table-cell">
                Commune
              </th>
              <th className="p-3 md:px-6 font-semibold hidden xl:table-cell">
                E-mail
              </th>
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
              ),
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
