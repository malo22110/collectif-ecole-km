"use client";

// [SPEC-MEMBER-MEETINGS-01] Shared internal agenda and meeting notes; publication stays under coordinator control.
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  LoaderCircle,
  MapPin,
  MessageSquarePlus,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import type { AgendaItem, AgendaSuggestionStatus, MeetingUpdate } from "@/lib/memberMeetings";

type Meeting = MeetingUpdate & {
  id: string;
  status: "draft" | "published";
  createdByName: string;
  updatedAtMillis: number | null;
  canEdit: boolean;
  canDelete: boolean;
};
type MeetingSuggestion = {
  id: string;
  text: string;
  createdByName: string;
  status: AgendaSuggestionStatus;
  createdAtMillis: number | null;
  canEdit: boolean;
  canDelete: boolean;
};
type LinkedAction = {
  id: string;
  pole: string;
  title: string;
  status: string;
  nextStep: string;
  updatedAtMillis: number | null;
};
type MeetingListResponse = { meetings: Meeting[]; canCoordinate: boolean; hasMore: boolean; nextCursor: string | null };
type SuggestionListResponse = { suggestions: MeetingSuggestion[] };
type MeetingActionsResponse = { actions: LinkedAction[] };

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });

function toLocalInput(value?: string) {
  const date = value ? new Date(value) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

async function authorizedRequest<T>(user: User, url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "La requête a échoué.");
  return result as T;
}

export default function MeetingsHub() {
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [canCoordinate, setCanCoordinate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, MeetingSuggestion[]>>({});
  const [linkedActions, setLinkedActions] = useState<Record<string, LinkedAction[]>>({});
  const [expandedActionsMeeting, setExpandedActionsMeeting] = useState<string | null>(null);
  const [loadingActionsMeeting, setLoadingActionsMeeting] = useState<string | null>(null);
  const [suggestionPanel, setSuggestionPanel] = useState<string | null>(null);
  const [busySuggestion, setBusySuggestion] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [suggestionEdits, setSuggestionEdits] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalInput());
  const [location, setLocation] = useState("");
  const [agendaText, setAgendaText] = useState("");
  const [minutes, setMinutes] = useState("");
  const [publishOnSave, setPublishOnSave] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setError("Connectez-vous avec un compte membre validé pour consulter l’agenda.");
        setLoading(false);
        return;
      }
      void authorizedRequest<MeetingListResponse>(currentUser, "/api/member-meetings")
        .then((result) => {
          if (!active) return;
          setMeetings(Array.isArray(result.meetings) ? result.meetings : []);
          setCanCoordinate(result.canCoordinate === true);
          setHasMore(result.hasMore === true);
          setNextCursor(result.nextCursor || null);
        })
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger l’agenda.");
        })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || meetings.length === 0) return;
    const targetId = new URLSearchParams(window.location.search).get("meeting");
    if (!targetId || expandedActionsMeeting === targetId || !meetings.some((meeting) => meeting.id === targetId)) return;
    setExpandedActionsMeeting(targetId);
    if (linkedActions[targetId]) return;
    setLoadingActionsMeeting(targetId);
    void authorizedRequest<MeetingActionsResponse>(user, `/api/member-meetings/${targetId}/actions`)
      .then((result) => setLinkedActions((current) => ({ ...current, [targetId]: result.actions || [] })))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Impossible de charger les actions liées."))
      .finally(() => setLoadingActionsMeeting(null));
  }, [user, meetings, expandedActionsMeeting, linkedActions]);

  const refresh = async () => {
    if (!user) return;
    const result = await authorizedRequest<MeetingListResponse>(user, "/api/member-meetings");
    setMeetings(Array.isArray(result.meetings) ? result.meetings : []);
    setCanCoordinate(result.canCoordinate === true);
    setHasMore(result.hasMore === true);
    setNextCursor(result.nextCursor || null);
  };

  const loadMore = async () => {
    if (!user || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await authorizedRequest<MeetingListResponse>(user, `/api/member-meetings?cursor=${encodeURIComponent(nextCursor)}`);
      setMeetings((current) => [...current, ...(Array.isArray(result.meetings) ? result.meetings : [])]);
      setHasMore(result.hasMore === true);
      setNextCursor(result.nextCursor || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les réunions précédentes.");
    } finally { setLoadingMore(false); }
  };

  const resetForm = () => {
    setTitle("");
    setStartsAt(toLocalInput());
    setLocation("");
    setAgendaText("");
    setMinutes("");
    setPublishOnSave(false);
    setEditingId(null);
    setShowForm(false);
  };

  const editMeeting = (meeting: Meeting) => {
    setEditingId(meeting.id);
    setTitle(meeting.title);
    setStartsAt(toLocalInput(meeting.startsAt));
    setLocation(meeting.location);
    setAgendaText(meeting.agendaItems.map((item) => item.text).join("\n"));
    setMinutes(meeting.minutes);
    setPublishOnSave(false);
    setShowForm(true);
  };

  const saveMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setNotice("");
    const agendaItems: AgendaItem[] = agendaText
      .split("\n")
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ id: crypto.randomUUID(), text }));
    const data = { title, startsAt: fromLocalInput(startsAt), location, agendaItems, minutes };
    try {
      if (editingId) {
        await authorizedRequest(user, `/api/member-meetings/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", data }),
        });
        setNotice("La réunion et ses notes sont enregistrées.");
      } else {
        await authorizedRequest(user, "/api/member-meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, publish: publishOnSave }),
        });
        setNotice(publishOnSave ? "La réunion est publiée aux membres." : "Le brouillon est enregistré; il reste visible aux coordinateurs.");
      }
      resetForm();
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer la réunion.");
    } finally { setSaving(false); }
  };

  const publishDraft = async (meeting: Meeting) => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      await refresh();
      setNotice("La réunion est maintenant visible aux membres validés.");
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Impossible de publier la réunion.");
    } finally { setSaving(false); }
  };

  const toggleSuggestions = async (meeting: Meeting) => {
    if (suggestionPanel === meeting.id) {
      setSuggestionPanel(null);
      return;
    }
    setSuggestionPanel(meeting.id);
    if (suggestions[meeting.id] || !user) return;
    try {
      const result = await authorizedRequest<SuggestionListResponse>(user, `/api/member-meetings/${meeting.id}/suggestions`);
      setSuggestions((current) => ({ ...current, [meeting.id]: result.suggestions || [] }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les propositions d’ordre du jour.");
    }
  };

  const toggleLinkedActions = async (meeting: Meeting) => {
    if (expandedActionsMeeting === meeting.id) {
      setExpandedActionsMeeting(null);
      return;
    }
    setExpandedActionsMeeting(meeting.id);
    if (linkedActions[meeting.id] || !user) return;
    setLoadingActionsMeeting(meeting.id);
    setError("");
    try {
      const result = await authorizedRequest<MeetingActionsResponse>(user, `/api/member-meetings/${meeting.id}/actions`);
      setLinkedActions((current) => ({ ...current, [meeting.id]: result.actions || [] }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les actions liées.");
    } finally { setLoadingActionsMeeting(null); }
  };

  const submitSuggestion = async (meeting: Meeting) => {
    if (!user) return;
    const text = suggestionText[meeting.id]?.trim() || "";
    if (text.length < 5) {
      setError("Décrivez le point en au moins cinq caractères.");
      return;
    }
    setBusySuggestion(meeting.id);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setSuggestionText((current) => ({ ...current, [meeting.id]: "" }));
      const result = await authorizedRequest<SuggestionListResponse>(user, `/api/member-meetings/${meeting.id}/suggestions`);
      setSuggestions((current) => ({ ...current, [meeting.id]: result.suggestions || [] }));
      setNotice("Votre proposition d’ordre du jour a été transmise aux coordinateurs.");
    } catch (suggestError) {
      setError(suggestError instanceof Error ? suggestError.message : "Impossible de transmettre ce point.");
    } finally { setBusySuggestion(null); }
  };

  const saveSuggestionEdit = async (meeting: Meeting, suggestion: MeetingSuggestion) => {
    if (!user) return;
    const text = (suggestionEdits[suggestion.id] || "").trim();
    if (text.length < 5) {
      setError("Décrivez le point en au moins cinq caractères.");
      return;
    }
    setBusySuggestion(suggestion.id);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", data: { text } }),
      });
      const result = await authorizedRequest<SuggestionListResponse>(user, `/api/member-meetings/${meeting.id}/suggestions`);
      setSuggestions((current) => ({ ...current, [meeting.id]: result.suggestions || [] }));
      setEditingSuggestion(null);
      setNotice("La proposition d’ordre du jour a été modifiée.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible de modifier cette proposition.");
    } finally {
      setBusySuggestion(null);
    }
  };

  const deleteSuggestion = async (meeting: Meeting, suggestion: MeetingSuggestion) => {
    if (!user || !window.confirm("Retirer cette proposition d’ordre du jour ?")) return;
    setBusySuggestion(suggestion.id);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}/suggestions/${suggestion.id}`, { method: "DELETE" });
      const result = await authorizedRequest<SuggestionListResponse>(user, `/api/member-meetings/${meeting.id}/suggestions`);
      setSuggestions((current) => ({ ...current, [meeting.id]: result.suggestions || [] }));
      setNotice("La proposition d’ordre du jour a été retirée.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de retirer cette proposition.");
    } finally {
      setBusySuggestion(null);
    }
  };

  const deleteMeeting = async (meeting: Meeting) => {
    if (!user || !window.confirm(`Retirer « ${meeting.title} » de l’agenda partagé ?`)) return;
    setSaving(true);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}`, { method: "DELETE" });
      await refresh();
      setNotice("La réunion a été retirée de l’agenda. Les propositions liées restent conservées au tableau.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de supprimer cette réunion.");
    } finally {
      setSaving(false);
    }
  };

  const decideSuggestion = async (meeting: Meeting, suggestion: MeetingSuggestion, status: "accepted" | "rejected") => {
    if (!user) return;
    setBusySuggestion(suggestion.id);
    setError("");
    try {
      await authorizedRequest(user, `/api/member-meetings/${meeting.id}/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await authorizedRequest<SuggestionListResponse>(user, `/api/member-meetings/${meeting.id}/suggestions`);
      setSuggestions((current) => ({ ...current, [meeting.id]: result.suggestions || [] }));
      if (status === "accepted") await refresh();
      setNotice(status === "accepted" ? "Le point a été ajouté à l’ordre du jour." : "La proposition a été écartée.");
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Impossible de traiter la proposition.");
    } finally { setBusySuggestion(null); }
  };

  if (loading) return <main className="mx-auto max-w-5xl p-6 text-sm text-stone-600" role="status">Chargement de l’agenda…</main>;

  const now = Date.now();
  const upcomingMeetings = meetings.filter((meeting) => meeting.status === "published" && Date.parse(meeting.startsAt) >= now);
  const pastMeetings = meetings.filter((meeting) => meeting.status === "published" && Date.parse(meeting.startsAt) < now);
  const draftMeetings = meetings.filter((meeting) => meeting.status === "draft");

  const renderMeeting = (meeting: Meeting) => {
    const isUpcoming = Date.parse(meeting.startsAt) >= now;
    const pendingSuggestions = (suggestions[meeting.id] || []).filter((suggestion) => suggestion.status === "pending");
    return (
      <article key={meeting.id} className="border-y border-stone-200 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-stone-900">{meeting.title}</h3>
              {meeting.status === "draft" && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-950">Brouillon</span>}
            </div>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{DATE_TIME.format(new Date(meeting.startsAt))}</span>
              {meeting.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{meeting.location}</span>}
            </p>
          </div>
          {(meeting.canEdit || meeting.canDelete) && <div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => editMeeting(meeting)} className="btn-secondary min-h-9 self-start px-3 py-1.5 text-xs"><Save size={14} /> Modifier</button>{meeting.canDelete && <button type="button" disabled={saving} onClick={() => void deleteMeeting(meeting)} className="btn-secondary min-h-9 self-start border-rose-200 px-3 py-1.5 text-xs text-rose-800 hover:bg-rose-50"><Trash2 size={14} aria-hidden="true" /> Supprimer</button>}</div>}
        </div>

        {meeting.agendaItems.length > 0 && (
          <div className="mt-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-stone-800"><ClipboardList size={15} /> Ordre du jour</h4>
            <ol className="mt-2 space-y-1.5 pl-5 text-sm text-stone-700 marker:font-semibold marker:text-emerald-800">
              {meeting.agendaItems.map((item) => <li key={item.id}>{item.text}</li>)}
            </ol>
          </div>
        )}

        {meeting.status === "published" && (
          <div className="mt-3">
            <button type="button" onClick={() => void toggleLinkedActions(meeting)} className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-emerald-800">
              <ClipboardList size={14} /> Actions liées {expandedActionsMeeting === meeting.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedActionsMeeting === meeting.id && (
              <div className="mt-2 space-y-2 border-l-2 border-emerald-300 pl-3">
                {loadingActionsMeeting === meeting.id ? (
                  <p className="text-xs text-stone-500">Chargement des actions…</p>
                ) : (linkedActions[meeting.id] || []).length ? (
                  (linkedActions[meeting.id] || []).map((action) => (
                    <div key={action.id} className="rounded-lg bg-stone-50 p-3">
                      <p className="text-sm font-semibold text-stone-900">{action.title}</p>
                      <p className="mt-1 text-xs text-stone-600">{action.pole} · {action.status.replaceAll("_", " ")}</p>
                      {action.nextStep && <p className="mt-1 text-xs text-stone-600">Prochaine étape : {action.nextStep}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500">Aucune proposition n’est encore reliée à cette réunion.</p>
                )}
              </div>
            )}
          </div>
        )}

        {meeting.minutes && (
          <div className="mt-4 border-l-2 border-emerald-600 bg-emerald-50/60 px-4 py-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-950"><FileText size={15} /> Notes de réunion</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{meeting.minutes}</p>
            <p className="mt-2 text-xs text-stone-500">Compte rendu interne du collectif; ne vaut pas procès-verbal municipal.</p>
          </div>
        )}

        {meeting.status === "draft" && canCoordinate && (
          <button type="button" disabled={saving} onClick={() => void publishDraft(meeting)} className="btn-primary mt-4 min-h-10 px-3 py-2 text-sm"><Check size={15} /> Publier aux membres</button>
        )}

        {meeting.status === "published" && isUpcoming && (
          <div className="mt-4 border-t border-stone-100 pt-4">
            <label className="block text-xs font-bold text-stone-700">Proposer un point à l’ordre du jour
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <input value={suggestionText[meeting.id] || ""} onChange={(event) => setSuggestionText((current) => ({ ...current, [meeting.id]: event.target.value }))} maxLength={240} className="input-base min-h-10 flex-1 text-sm" placeholder="Un sujet à préparer ensemble…" />
                <button type="button" disabled={busySuggestion === meeting.id} onClick={() => void submitSuggestion(meeting)} className="btn-secondary min-h-10 px-3 py-2 text-sm"><Send size={14} /> Suggérer</button>
              </div>
            </label>
          </div>
        )}

        {meeting.status === "published" && (
          <div className="mt-3">
            <button type="button" onClick={() => void toggleSuggestions(meeting)} className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-emerald-800"><MessageSquarePlus size={14} /> {canCoordinate ? "Suggestions d’ordre du jour" : "Mes propositions d’ordre du jour"} ({pendingSuggestions.length || "voir"})</button>
            {suggestionPanel === meeting.id && (
              <div className="mt-2 space-y-2 border-l-2 border-amber-300 pl-3">
                {!pendingSuggestions.length ? <p className="text-xs text-stone-500">{canCoordinate ? "Aucune proposition en attente." : "Vous n’avez pas de proposition en attente."}</p> : pendingSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex flex-col gap-2 rounded-lg bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {editingSuggestion === suggestion.id ? <textarea value={suggestionEdits[suggestion.id] ?? suggestion.text} onChange={(event) => setSuggestionEdits((current) => ({ ...current, [suggestion.id]: event.target.value }))} maxLength={240} rows={2} className="input-base min-h-10 text-sm" aria-label="Modifier le point proposé" /> : <p className="text-sm text-stone-800">{suggestion.text}<span className="mt-1 block text-xs text-stone-500">Proposé par {suggestion.createdByName}</span></p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {suggestion.canEdit && (editingSuggestion === suggestion.id ? <><button type="button" disabled={busySuggestion === suggestion.id} onClick={() => void saveSuggestionEdit(meeting, suggestion)} className="btn-primary min-h-9 px-2.5 py-1 text-xs"><Save size={13} /> Enregistrer</button><button type="button" onClick={() => setEditingSuggestion(null)} className="btn-secondary min-h-9 px-2.5 py-1 text-xs">Annuler</button></> : <button type="button" disabled={busySuggestion === suggestion.id} onClick={() => { setSuggestionEdits((current) => ({ ...current, [suggestion.id]: suggestion.text })); setEditingSuggestion(suggestion.id); }} className="btn-secondary min-h-9 px-2.5 py-1 text-xs"><Save size={13} /> Modifier</button>)}
                      {suggestion.canDelete && <button type="button" disabled={busySuggestion === suggestion.id} onClick={() => void deleteSuggestion(meeting, suggestion)} className="btn-secondary min-h-9 border-rose-200 px-2.5 py-1 text-xs text-rose-800 hover:bg-rose-50"><Trash2 size={13} aria-hidden="true" /> Retirer</button>}
                      {canCoordinate && <><button type="button" disabled={busySuggestion === suggestion.id} onClick={() => void decideSuggestion(meeting, suggestion, "accepted")} className="btn-primary min-h-9 px-2.5 py-1 text-xs"><Check size={13} /> Ajouter</button><button type="button" disabled={busySuggestion === suggestion.id} onClick={() => void decideSuggestion(meeting, suggestion, "rejected")} className="btn-secondary min-h-9 px-2.5 py-1 text-xs"><X size={13} /> Écarter</button></>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 p-4 md:p-8 md:pt-10">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/espace-membre" className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-800"><ArrowLeft size={16} /> Tableau de bord</Link>
          <p className="mb-2 text-sm font-bold uppercase text-emerald-800">Coordination interne</p>
          <h1 className="text-3xl font-black text-stone-900 md:text-4xl">Agenda & comptes rendus</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Préparons les échanges, partageons les notes utiles et transformons les réunions en prochaines étapes suivies.</p>
        </div>
        {canCoordinate && <button type="button" onClick={() => { setEditingId(null); setTitle(""); setStartsAt(toLocalInput()); setLocation(""); setAgendaText(""); setMinutes(""); setPublishOnSave(false); setShowForm((current) => !current); }} className="btn-primary min-h-11 w-full px-4 py-2 sm:w-auto"><Plus size={17} /> Nouvelle réunion</button>}
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}

      {showForm && (canCoordinate || editingId !== null) && (
        <section className="border-y border-emerald-200 bg-emerald-50/40 py-5">
          <form onSubmit={(event) => void saveMeeting(event)} className="mx-auto grid max-w-4xl gap-4 px-4 sm:grid-cols-2 sm:px-6">
            <div className="sm:col-span-2"><h2 className="text-lg font-bold text-stone-900">{editingId ? "Modifier la réunion" : "Préparer une réunion"}</h2><p className="mt-1 text-xs text-stone-600">Les notes restent internes au collectif et ne remplacent pas un procès-verbal officiel.</p></div>
            <label className="text-sm font-semibold text-stone-800">Titre<input required minLength={5} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="input-base mt-2 min-h-11" placeholder="Réunion de préparation du collectif" /></label>
            <label className="text-sm font-semibold text-stone-800">Date et heure<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="input-base mt-2 min-h-11" /></label>
            <label className="text-sm font-semibold text-stone-800 sm:col-span-2">Lieu ou modalité <span className="font-normal text-stone-500">(facultatif)</span><input maxLength={160} value={location} onChange={(event) => setLocation(event.target.value)} className="input-base mt-2 min-h-11" placeholder="Salle communale / visioconférence" /></label>
            <label className="text-sm font-semibold text-stone-800 sm:col-span-2">Ordre du jour <span className="font-normal text-stone-500">(un point par ligne)</span><textarea rows={4} value={agendaText} onChange={(event) => setAgendaText(event.target.value)} className="input-base mt-2 resize-y" placeholder={"Point à préparer\nQuestions à partager avec la commune"} /></label>
            <label className="text-sm font-semibold text-stone-800 sm:col-span-2">Compte rendu / notes <span className="font-normal text-stone-500">(à remplir après la réunion)</span><textarea maxLength={6000} rows={5} value={minutes} onChange={(event) => setMinutes(event.target.value)} className="input-base mt-2 resize-y" placeholder="Échanges, propositions et prochaines étapes convenues entre les membres…" /></label>
            {!editingId && <label className="flex items-start gap-3 text-sm text-stone-700 sm:col-span-2"><input type="checkbox" checked={publishOnSave} onChange={(event) => setPublishOnSave(event.target.checked)} className="mt-0.5 size-4 accent-emerald-700" /><span><strong>Publier immédiatement aux membres</strong><small className="mt-1 block text-xs text-stone-500">Sinon, la réunion restera en brouillon, visible aux coordinateurs.</small></span></label>}
            <p className="flex items-start gap-2 text-xs leading-5 text-stone-600 sm:col-span-2"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-800" /> Ce document est un compte rendu de travail du collectif, pas un procès-verbal municipal; il ne crée pas de décision pour la commune.</p>
            <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={resetForm} className="btn-secondary min-h-10 px-4 py-2">Annuler</button><button type="submit" disabled={saving} className="btn-primary min-h-10 px-4 py-2">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer</button></div>
          </form>
        </section>
      )}

      <section aria-labelledby="upcoming-heading">
        <div className="mb-2 border-b border-stone-200 pb-3"><p className="text-xs font-bold uppercase text-stone-500">Prochains rendez-vous</p><h2 id="upcoming-heading" className="mt-1 text-xl font-bold text-stone-900">À venir</h2></div>
        {upcomingMeetings.length ? upcomingMeetings.map(renderMeeting) : <p className="border-b border-stone-200 py-6 text-sm text-stone-600">Aucune réunion publiée à venir.</p>}
      </section>

      {canCoordinate && draftMeetings.length > 0 && <section aria-labelledby="draft-heading"><div className="mb-2 border-b border-stone-200 pb-3"><p className="text-xs font-bold uppercase text-amber-800">Coordination</p><h2 id="draft-heading" className="mt-1 text-xl font-bold text-stone-900">Brouillons</h2></div>{draftMeetings.map(renderMeeting)}</section>}

      <section aria-labelledby="past-heading">
        <div className="mb-2 border-b border-stone-200 pb-3"><p className="text-xs font-bold uppercase text-stone-500">Archives de travail</p><h2 id="past-heading" className="mt-1 text-xl font-bold text-stone-900">Réunions passées</h2></div>
        {pastMeetings.length ? pastMeetings.map(renderMeeting) : <p className="border-b border-stone-200 py-6 text-sm text-stone-600">Les comptes rendus apparaîtront ici après les réunions publiées.</p>}
        {hasMore && <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="btn-secondary mt-4 min-h-10 px-4 py-2 text-sm">{loadingMore ? <LoaderCircle size={15} className="animate-spin" /> : null} Charger les réunions précédentes <ChevronRight size={15} /></button>}
      </section>

      <footer className="border-t border-stone-200 pt-4 text-xs leading-5 text-stone-500">Espace de préparation interne aux membres validés. Les comptes rendus ne remplacent pas les procès-verbaux et décisions de la commune.</footer>
    </main>
  );
}