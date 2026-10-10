"use client";

// [SPEC-ACTION-BOARD-01] Shared proposals prepare collective work without transferring municipal decision authority.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  LoaderCircle,
  Pencil,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  ACTION_POLES,
  ACTION_POLE_LABELS,
  ACTION_STATUS_LABELS,
  ACTION_STATUSES,
  type ActionPole,
  type ActionStatus,
} from "@/lib/actionBoard";

type BoardAction = {
  id: string;
  pole: ActionPole;
  title: string;
  description: string;
  nextStep: string;
  status: ActionStatus;
  statusNote: string;
  createdByName: string;
  updatedByName: string;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
  canEdit: boolean;
};

type ActionDraft = { pole: ActionPole; title: string; description: string; nextStep: string };
type BoardResponse = { actions: BoardAction[]; canCoordinate: boolean; hasMore: boolean; nextCursor: string | null };

const EMPTY_DRAFT: ActionDraft = { pole: "chantiers", title: "", description: "", nextStep: "" };
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

const NEXT_STATUSES: Record<ActionStatus, ActionStatus[]> = {
  proposition: ["a_etudier", "suspendue"],
  a_etudier: ["proposition", "a_discuter_commune", "suspendue"],
  a_discuter_commune: ["a_etudier", "transmise_commune", "suspendue"],
  transmise_commune: ["attente_retour", "a_etudier", "suspendue"],
  attente_retour: ["a_etudier", "realisee", "suspendue"],
  realisee: ["a_etudier"],
  suspendue: ["a_etudier", "proposition"],
};

async function authorizedRequest<T>(user: User, url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "La requête a échoué.");
  return result as T;
}

function statusClass(status: ActionStatus) {
  if (status === "realisee") return "bg-emerald-100 text-emerald-900";
  if (status === "suspendue") return "bg-stone-200 text-stone-700";
  if (status === "attente_retour" || status === "transmise_commune") return "bg-sky-100 text-sky-900";
  if (status === "proposition") return "bg-amber-100 text-amber-950";
  return "bg-stone-100 text-stone-700";
}

function formatDate(value: number | null) {
  if (!value) return "Date indisponible";
  return DATE_FORMAT.format(new Date(value));
}

export default function ActionBoard() {
  const [user, setUser] = useState<User | null>(null);
  const [actions, setActions] = useState<BoardAction[]>([]);
  const [canCoordinate, setCanCoordinate] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft>(EMPTY_DRAFT);
  const [search, setSearch] = useState("");
  const [poleFilter, setPoleFilter] = useState<ActionPole | "">("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "">("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, ActionStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setError("Connectez-vous avec un compte membre validé pour consulter les propositions.");
        setLoading(false);
        return;
      }
      void authorizedRequest<BoardResponse>(currentUser, "/api/action-board")
        .then((result) => {
          if (!active) return;
          setActions(Array.isArray(result.actions) ? result.actions : []);
          setCanCoordinate(result.canCoordinate === true);
          setHasMore(result.hasMore === true);
          setNextCursor(result.nextCursor || null);
        })
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger le tableau.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refresh = async () => {
    if (!user) return;
    const result = await authorizedRequest<BoardResponse>(user, "/api/action-board");
    setActions(Array.isArray(result.actions) ? result.actions : []);
    setCanCoordinate(result.canCoordinate === true);
    setHasMore(result.hasMore === true);
    setNextCursor(result.nextCursor || null);
  };

  const filteredActions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return actions.filter((action) => {
      const matchesQuery = !query || [action.title, action.description, action.nextStep, action.createdByName]
        .some((value) => value.toLocaleLowerCase("fr").includes(query));
      return matchesQuery && (!poleFilter || action.pole === poleFilter) && (!statusFilter || action.status === statusFilter);
    });
  }, [actions, search, poleFilter, statusFilter]);

  const submitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId) {
        await authorizedRequest(user, `/api/action-board/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "edit", data: draft }),
        });
        setNotice("Votre proposition a été mise à jour.");
      } else {
        await authorizedRequest(user, "/api/action-board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        setNotice("Votre proposition a été ajoutée au tableau partagé.");
      }
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      setShowForm(false);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d’enregistrer la proposition.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (action: BoardAction) => {
    setEditingId(action.id);
    setDraft({ pole: action.pole, title: action.title, description: action.description, nextStep: action.nextStep });
    setShowForm(true);
  };

  const transitionAction = async (action: BoardAction) => {
    if (!user) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await authorizedRequest(user, `/api/action-board/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transition",
          data: { status: statusDrafts[action.id] || NEXT_STATUSES[action.status][0], statusNote: statusNotes[action.id] || "" },
        }),
      });
      await refresh();
      setNotice("L’état de suivi a été mis à jour. Cela ne constitue pas une décision de la commune.");
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "Impossible de faire évoluer le suivi.");
    } finally {
      setSaving(false);
    }
  };

  const loadMore = async () => {
    if (!user || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await authorizedRequest<BoardResponse>(user, `/api/action-board?cursor=${encodeURIComponent(nextCursor)}`);
      setActions((current) => [...current, ...(Array.isArray(result.actions) ? result.actions : [])]);
      setHasMore(result.hasMore === true);
      setNextCursor(result.nextCursor || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger la suite.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 p-4 md:p-8 md:pt-10">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/espace-membre" className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-800"><ArrowLeft size={16} /> Tableau de bord</Link>
          <p className="mb-2 text-sm font-bold uppercase text-emerald-800">Travail collectif</p>
          <h1 className="text-3xl font-black text-stone-900 md:text-4xl">Propositions & actions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Rassemblons les idées, les besoins et les prochaines étapes par pôle. Cet espace prépare le dialogue; les décisions restent du ressort du conseil municipal.</p>
        </div>
        <button type="button" onClick={() => { setEditingId(null); setDraft(EMPTY_DRAFT); setShowForm((value) => !value); }} className="btn-primary min-h-11 w-full px-4 py-2 sm:w-auto">
          {showForm && !editingId ? <X size={17} /> : <CirclePlus size={17} />}
          {showForm && !editingId ? "Fermer" : "Nouvelle proposition"}
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}

      {showForm && (
        <section className="border-y border-emerald-200 bg-emerald-50/40 py-5" aria-labelledby="action-form-heading">
          <form onSubmit={(event) => void submitDraft(event)} className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 sm:px-6">
            <div className="sm:col-span-2"><h2 id="action-form-heading" className="text-lg font-bold text-stone-900">{editingId ? "Modifier votre proposition" : "Décrire une proposition"}</h2><p className="mt-1 text-xs text-stone-600">Votre proposition sera visible aux membres validés. Elle n’engage pas la commune.</p></div>
            <label className="text-sm font-semibold text-stone-800">Pôle
              <select required value={draft.pole} onChange={(event) => setDraft((current) => ({ ...current, pole: event.target.value as ActionPole }))} className="input-base mt-2 min-h-11">
                {ACTION_POLES.map((pole) => <option key={pole} value={pole}>{ACTION_POLE_LABELS[pole]}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-stone-800">Titre
              <input required minLength={5} maxLength={100} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="input-base mt-2 min-h-11" placeholder="Ex. Étudier un chantier de nettoyage" />
            </label>
            <label className="text-sm font-semibold text-stone-800 sm:col-span-2">Besoin ou proposition
              <textarea required minLength={15} maxLength={1200} rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="input-base mt-2 resize-y" placeholder="Quel besoin avez-vous repéré ? Qu’aimeriez-vous étudier ou proposer ?" />
            </label>
            <label className="text-sm font-semibold text-stone-800 sm:col-span-2">Prochaine étape possible <span className="font-normal text-stone-500">(facultatif)</span>
              <input maxLength={240} value={draft.nextStep} onChange={(event) => setDraft((current) => ({ ...current, nextStep: event.target.value }))} className="input-base mt-2 min-h-11" placeholder="Ex. Recueillir les contraintes auprès de la commune" />
            </label>
            <p className="flex items-start gap-2 text-xs leading-5 text-stone-600 sm:col-span-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-800" /> Ne saisissez pas de coordonnées personnelles ni de données sensibles. Une proposition publiée est un élément de travail, pas une décision de la commission ou du conseil municipal.</p>
            <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setDraft(EMPTY_DRAFT); }} className="btn-secondary min-h-11 px-4 py-2">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary min-h-11 px-4 py-2">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} {editingId ? "Enregistrer" : "Ajouter au tableau"}</button>
            </div>
          </form>
        </section>
      )}

      <section aria-label="Filtres du tableau" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative"><span className="sr-only">Rechercher une proposition</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input-base min-h-11 pl-9" placeholder="Rechercher dans les actions" /></label>
        <label><span className="sr-only">Filtrer par pôle</span><select value={poleFilter} onChange={(event) => setPoleFilter(event.target.value as ActionPole | "")} className="input-base min-h-11"><option value="">Tous les pôles</option>{ACTION_POLES.map((pole) => <option key={pole} value={pole}>{ACTION_POLE_LABELS[pole]}</option>)}</select></label>
        <label><span className="sr-only">Filtrer par état</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ActionStatus | "")} className="input-base min-h-11"><option value="">Tous les états</option>{ACTION_STATUSES.map((status) => <option key={status} value={status}>{ACTION_STATUS_LABELS[status]}</option>)}</select></label>
      </section>

      <section aria-label="Propositions partagées">
        <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-3"><p className="text-sm font-semibold text-stone-700"><ClipboardList size={16} className="mr-2 inline text-emerald-800" />{filteredActions.length} proposition(s) affichée(s)</p>{canCoordinate && <p className="text-xs font-semibold text-emerald-800">Coordination activée</p>}</div>
        {!filteredActions.length ? (
          <div className="border-y border-stone-200 py-10 text-center"><Wrench className="mx-auto text-stone-400" size={25} /><h2 className="mt-3 font-bold text-stone-900">Pas encore de proposition</h2><p className="mt-1 text-sm text-stone-600">Ajoutez une première idée ou ajustez les filtres.</p></div>
        ) : (
          <ul className="divide-y divide-stone-200 border-y border-stone-200">
            {filteredActions.map((action) => {
              const availableStatuses = NEXT_STATUSES[action.status];
              return (
                <li key={action.id} className="py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700">{ACTION_POLE_LABELS[action.pole]}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${action.status === "realisee" ? "bg-emerald-100 text-emerald-900" : action.status === "suspendue" ? "bg-stone-200 text-stone-700" : action.status === "attente_retour" || action.status === "transmise_commune" ? "bg-sky-100 text-sky-900" : action.status === "proposition" ? "bg-amber-100 text-amber-950" : "bg-stone-100 text-stone-700"}`}>{ACTION_STATUS_LABELS[action.status]}</span>
                      </div>
                      <h2 className="text-lg font-bold text-stone-900">{action.title}</h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{action.description}</p>
                      {action.nextStep && <p className="mt-3 border-l-2 border-amber-400 pl-3 text-sm text-stone-700"><strong>Étape possible :</strong> {action.nextStep}</p>}
                      <p className="mt-3 text-xs text-stone-500">Proposée par {action.createdByName} · mise à jour {formatDate(action.updatedAtMillis)}</p>
                      {action.statusNote && <p className="mt-2 text-sm text-stone-600">Suivi : {action.statusNote}</p>}
                    </div>
                    {action.canEdit && <button type="button" onClick={() => startEdit(action)} className="btn-secondary min-h-10 shrink-0 px-3 py-2 text-sm"><Pencil size={15} /> Modifier</button>}
                  </div>
                  {canCoordinate && availableStatuses.length > 0 && (
                    <div className="mt-4 grid gap-2 border-t border-stone-100 pt-4 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-end">
                      <label className="text-xs font-bold text-stone-600">Faire évoluer le suivi
                        <select value={statusDrafts[action.id] || availableStatuses[0]} onChange={(event) => setStatusDrafts((current) => ({ ...current, [action.id]: event.target.value as ActionStatus }))} className="input-base mt-1 min-h-10 text-sm">{availableStatuses.map((status) => <option key={status} value={status}>{ACTION_STATUS_LABELS[status]}</option>)}</select>
                      </label>
                      <label className="text-xs font-bold text-stone-600">Note de suivi visible aux membres <span className="font-normal">(facultatif)</span>
                        <input maxLength={400} value={statusNotes[action.id] || ""} onChange={(event) => setStatusNotes((current) => ({ ...current, [action.id]: event.target.value }))} className="input-base mt-1 min-h-10 text-sm" placeholder="Ex. transmis pour examen le…" />
                      </label>
                      <button type="button" disabled={saving} onClick={() => void transitionAction(action)} className="btn-secondary min-h-10 px-3 py-2 text-sm">Mettre à jour</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="btn-secondary mt-4 min-h-11 px-4 py-2 text-sm">{loadingMore ? <LoaderCircle size={16} className="animate-spin" /> : null} Charger les propositions suivantes <ChevronDown size={15} /></button>}
      </section>

      <footer className="border-t border-stone-200 pt-5 text-xs leading-5 text-stone-500">Cet outil organise la préparation et le suivi du travail bénévole. Il ne remplace ni une commission officielle, ni une délibération, ni une décision du conseil municipal.</footer>
    </main>
  );
}