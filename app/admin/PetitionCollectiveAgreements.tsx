"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { Check, Loader2, RefreshCw, Users } from "lucide-react";

interface EligibleMember {
  email: string;
  prenom: string;
  nom: string;
  ville: string;
  isAlreadySigned: boolean;
  hasAgreement: boolean;
  available: boolean;
}

interface MemberSummary {
  validated: number;
  alreadySigned: number;
  hasAgreement: number;
  possiblePaperMatch: number;
  available: number;
}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "La requête a échoué.");
  return result;
}

export default function PetitionCollectiveAgreements() {
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [summary, setSummary] = useState<MemberSummary>({ validated: 0, alreadySigned: 0, hasAgreement: 0, possiblePaperMatch: 0, available: 0 });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authorizedFetch("/api/admin/petition-agreements") as { members: EligibleMember[]; summary: MemberSummary };
      setMembers(result.members);
      setSummary(result.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les membres.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return members.filter(member => !query || `${member.prenom} ${member.nom} ${member.email} ${member.ville}`.toLocaleLowerCase("fr").includes(query));
  }, [members, search]);

  const toggleMember = (email: string) => {
    setSelectedEmails(current => current.includes(email) ? current.filter(item => item !== email) : [...current, email]);
    setMessage("");
    setError("");
  };

  const toggleFiltered = () => {
    const availableEmails = filteredMembers.filter(member => member.available).map(member => member.email);
    const allSelected = availableEmails.length > 0 && availableEmails.every(email => selectedEmails.includes(email));
    setSelectedEmails(current => allSelected
      ? current.filter(email => !availableEmails.includes(email))
      : Array.from(new Set([...current, ...availableEmails])));
  };

  const recordAgreements = async () => {
    if (!selectedEmails.length || !confirmed) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await authorizedFetch("/api/admin/petition-agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedEmails, confirmedConsent: true })
      }) as { recorded: string[]; alreadyRecorded: string[] };
      setMessage(`${result.recorded.length} accord(s) de principe enregistré(s)${result.alreadyRecorded.length ? `, ${result.alreadyRecorded.length} déjà enregistré(s)` : ""}.`);
      setSelectedEmails([]);
      setConfirmed(false);
      await loadMembers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer les accords.");
    } finally {
      setSaving(false);
    }
  };

  const allFilteredAvailableSelected = filteredMembers.filter(member => member.available).length > 0
    && filteredMembers.filter(member => member.available).every(member => selectedEmails.includes(member.email));

  return (
    <section className="mt-6 space-y-4 border-t border-stone-200 pt-6" aria-labelledby="petition-collective-agreement-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="petition-collective-agreement-title" className="flex items-center gap-2 text-lg font-bold text-stone-900"><Users size={19} aria-hidden="true" />Accords de principe des membres</h3>
          <p className="mt-1 max-w-3xl text-sm text-stone-600">Enregistre séparément l’accord de principe des membres validés, fondé sur l’accord donné lors de la réunion fondatrice. Cela ne crée pas une signature manuscrite ni une signature en ligne.</p>
        </div>
        <button type="button" onClick={() => void loadMembers()} disabled={loading} className="btn-secondary min-h-10 px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Actualiser</button>
      </div>

      {error && <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="border-l-4 border-emerald-700 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>}

      <label className="block text-sm font-medium text-stone-700">
        Rechercher un membre
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, e-mail ou commune" className="input-base mt-1" />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-stone-200 py-2">
        <span className="text-xs text-stone-600">{selectedEmails.length} sélectionné(s) · {summary.available} membre(s) sans signature détectée</span>
        <button type="button" onClick={toggleFiltered} disabled={loading} className="min-h-10 px-2 text-sm font-semibold text-emerald-800 underline underline-offset-2 disabled:opacity-50">
          {allFilteredAvailableSelected ? "Tout désélectionner" : "Sélectionner les membres affichés"}
        </button>
      </div>

      <ul className="max-h-72 divide-y divide-stone-200 overflow-y-auto border-b border-stone-200">
        {loading ? <li role="status" className="py-6 text-center text-sm text-stone-500"><Loader2 className="mr-2 inline animate-spin" size={16} />Chargement des membres…</li>
          : filteredMembers.length === 0 ? <li className="py-6 text-center text-sm text-stone-500">Aucun membre trouvé.</li>
          : filteredMembers.map(member => <li key={member.email} className="flex min-h-12 items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={selectedEmails.includes(member.email)}
              disabled={!member.available || saving}
              onChange={() => toggleMember(member.email)}
              aria-label={`Sélectionner ${member.prenom} ${member.nom}`}
              className="size-4 accent-emerald-700"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-stone-800">{member.prenom} {member.nom}</span>
              <span className="block truncate text-xs text-stone-500">{member.email}{member.ville ? ` · ${member.ville}` : ""}</span>
            </span>
            <span className={`shrink-0 text-xs font-medium ${member.isAlreadySigned ? "text-blue-800" : member.hasAgreement ? "text-emerald-800" : "text-stone-500"}`}>
              {member.isAlreadySigned ? "Signature individuelle déjà enregistrée" : member.hasAgreement ? "Accord déjà enregistré" : "Disponible"}
            </span>
          </li>)}
      </ul>

      {summary.possiblePaperMatch > 0 && <p role="note" className="text-xs leading-5 text-amber-800">{summary.possiblePaperMatch} membre(s) avec une correspondance possible dans les signatures papier sont masqués par précaution. Vérifie ces cas dans le registre avant d’ajouter un accord.</p>}
      {(summary.alreadySigned > 0 || summary.hasAgreement > 0) && <p className="text-xs text-stone-500">Membres déjà signataires : {summary.alreadySigned} · accords de principe déjà enregistrés : {summary.hasAgreement}.</p>}

      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={saving} className="mt-1 size-4 shrink-0 accent-emerald-700" />
        <span>Je confirme que chaque membre sélectionné a bien donné son accord de principe à la pétition dans le cadre de son adhésion au collectif et de la réunion fondatrice.</span>
      </label>

      <button type="button" onClick={() => void recordAgreements()} disabled={saving || loading || !selectedEmails.length || !confirmed} className="btn-primary min-h-11 px-4 py-2 text-sm">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        {saving ? "Enregistrement…" : `Enregistrer ${selectedEmails.length || "les"} accord(s) de principe`}
      </button>
    </section>
  );
}