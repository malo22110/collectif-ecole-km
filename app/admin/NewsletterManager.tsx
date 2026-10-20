"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarClock, Eye, MailCheck, RefreshCw, Save } from "lucide-react";
import { auth } from "@/lib/firebase";
import NewsletterEditor from "./NewsletterEditor";

type Draft = {
  id: string;
  subject: string;
  body: string;
  previewHtml?: string;
  contentVersion?: number;
  state: string;
  remoteId: number | null;
  recipientCount: number;
  scheduledAt: string | null;
  groupName?: string | null;
};
type RemoteCampaign = { id: number; subject: string; status: string };
type Group = { id: number; name: string; subscribed_count?: number };
type CampaignPage = {
  items: RemoteCampaign[];
  drafts: Draft[];
  nextPage: number | null;
  groups: Group[];
};

const states: Record<string, string> = {
  creating: "Création en cours",
  draft: "Brouillon",
  testing: "Test en cours",
  tested: "Test envoyé",
  scheduling: "Programmation en cours",
  scheduled: "Programmé",
  "review-required": "Vérification requise dans Infomaniak",
  rejected: "Création refusée par Infomaniak",
};

async function api<T>(path: string, body?: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(result?.error || "L'opération Newsletter a échoué.");
    Object.assign(error, { retryAllowed: result?.retryAllowed === true });
    throw error;
  }
  return result;
}

export default function NewsletterManager() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [campaigns, setCampaigns] = useState<RemoteCampaign[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Draft | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [unsubscribeChecked, setUnsubscribeChecked] = useState(false);
  const requestId = useRef<string | null>(null);

  const load = useCallback(async (page = 1) => {
    const result = await api<CampaignPage>(`/api/newsletter/campaigns?page=${page}`);
    setCampaigns((previous) => (page === 1 ? result.items : [...previous, ...result.items]));
    setDrafts(result.drafts);
    setGroups(result.groups);
    setNextPage(result.nextPage);
    setSelected((previous) =>
      previous ? result.drafts.find((draft) => draft.id === previous.id) || null : null,
    );
  }, []);

  const refresh = async (page = 1) => {
    setBusy(true);
    setError("");
    try {
      await load(page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "Chargement impossible."),
    );
  }, [load]);

  const createDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || html.length > 60000 || body.length > 20000) {
      setError("Le message est vide ou dépasse la taille maximale.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    requestId.current ||= crypto.randomUUID();
    try {
      const result = await api<{ recipientCount: number }>("/api/newsletter/campaigns", {
        subject,
        body,
        html,
        groupId: Number(groupId),
        requestId: requestId.current,
      });
      requestId.current = null;
      setSubject("");
      setBody("");
      setHtml("<p></p>");
      setEditorResetKey((previous) => previous + 1);
      setNotice(
        `Brouillon créé chez Infomaniak pour ${result.recipientCount} abonné(s) actif(s). Aucun envoi programmé.`,
      );
      await load();
    } catch (cause) {
      if (cause instanceof Error && "retryAllowed" in cause && cause.retryAllowed === true)
        requestId.current = null;
      setError(cause instanceof Error ? cause.message : "Création impossible.");
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const action = async (draft: Draft, name: "test" | "schedule") => {
    if (
      name === "test" &&
      !window.confirm(
        `Envoyer un test de « ${draft.subject} » uniquement à ${auth.currentUser?.email} ?`,
      )
    )
      return;
    if (
      name === "schedule" &&
      (!scheduledAt ||
        !unsubscribeChecked ||
        !window.confirm(
          `Programmer l'envoi réel de « ${draft.subject} » aux abonnés encore actifs le ${new Date(scheduledAt).toLocaleString("fr-FR")} ?`,
        ))
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ recipientCount?: number }>(
        `/api/newsletter/campaigns/${encodeURIComponent(draft.id)}`,
        {
          action: name,
          ...(name === "schedule"
            ? {
                scheduledAt: new Date(scheduledAt).toISOString(),
                confirm: true,
                unsubscribeChecked: true,
              }
            : {}),
        },
      );
      setNotice(
        name === "test"
          ? "Le test a été envoyé à votre adresse. Infomaniak désactive le lien de désinscription dans les emails de test ; il est activé lors de l'envoi définitif."
          : `Campagne programmée pour ${result.recipientCount} abonné(s).`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6" aria-label="Newsletters Infomaniak">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-stone-900">Newsletter Infomaniak</h3>
        <button
          type="button"
          disabled={busy}
          className="btn-secondary"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} aria-hidden="true" /> Actualiser
        </button>
      </div>
      {error && (
        <p role="alert" className="border-l-4 border-rose-700 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      <form
        onSubmit={(event) => void createDraft(event)}
        className="space-y-4 border-b border-stone-200 pb-6"
      >
        <h4 className="font-semibold text-stone-900">Nouveau brouillon</h4>
        <label className="block text-sm font-medium">
          Groupe destinataire
          <select
            required
            disabled={busy}
            className="input-base mt-1 w-full"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Choisir un groupe Infomaniak</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {group.subscribed_count === undefined
                  ? ""
                  : ` · ${group.subscribed_count} abonné(s)`}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Objet
          <input
            required
            maxLength={240}
            className="input-base mt-1 w-full"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <div className="space-y-2">
          <p className="text-sm font-medium">Message</p>
          <NewsletterEditor
            disabled={busy}
            resetKey={editorResetKey}
            onChange={(content, text) => {
              setHtml(content);
              setBody(text);
            }}
          />
        </div>
        <p className="text-sm text-stone-600">
          Destinataires : abonnés actifs du groupe choisi, hors désabonnements. Aucun membre ni
          signataire n'est ajouté automatiquement.
        </p>
        <button type="submit" disabled={busy} className="btn-primary">
          <Save size={16} aria-hidden="true" /> Créer le brouillon
        </button>
      </form>
      <div>
        <h4 className="mb-3 font-semibold text-stone-900">Brouillons gérés ici</h4>
        {!drafts.length && (
          <p className="text-sm text-stone-600">Aucun brouillon créé depuis le site.</p>
        )}
        <ul className="divide-y divide-stone-200">
          {drafts.map((draft) => (
            <li key={draft.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0 flex-1">
                <strong className="block break-words text-stone-900">{draft.subject}</strong>
                <p className="text-sm text-stone-600">
                  {states[draft.state] || draft.state} ·{" "}
                  {draft.groupName || "Ancien brouillon sans groupe"} · {draft.recipientCount}{" "}
                  abonné(s)
                  {draft.remoteId ? ` · #${draft.remoteId}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary p-2"
                  aria-label={`Voir ${draft.subject}`}
                  title="Voir le brouillon"
                  onClick={() => {
                    setSelected(draft);
                    setUnsubscribeChecked(false);
                  }}
                >
                  <Eye size={17} aria-hidden="true" />
                </button>
                {draft.contentVersion === 2 && ["draft", "tested"].includes(draft.state) && (
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-secondary"
                    onClick={() => void action(draft, "test")}
                  >
                    <MailCheck size={16} aria-hidden="true" /> Test à mon adresse
                  </button>
                )}
                {draft.contentVersion === 2 && draft.state === "tested" && (
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-primary"
                    aria-controls="newsletter-schedule-panel"
                    onClick={() => {
                      setSelected(draft);
                      setUnsubscribeChecked(false);
                      setScheduledAt("");
                      requestAnimationFrame(() => document.getElementById("newsletter-schedule-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                  >
                    <CalendarClock size={16} aria-hidden="true" /> Programmer l'envoi réel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className="space-y-4 border-y border-stone-200 bg-stone-50 p-4">
          <h4 className="break-words font-semibold">{selected.subject}</h4>
          {selected.contentVersion !== 2 && (
            <p role="status" className="text-sm text-amber-900">
              Ancienne version sans le nouveau pied ni le lien de désinscription. Recréez ce
              brouillon avant tout nouvel envoi.
            </p>
          )}
          <iframe
            title={`Aperçu de ${selected.subject}`}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={selected.previewHtml || ""}
            className="h-[520px] w-full rounded border border-stone-200 bg-white"
          />
          {selected.state === "tested" && selected.contentVersion === 2 && (
            <div id="newsletter-schedule-panel" className="space-y-4 border-t border-stone-200 pt-4">
              <h5 className="font-semibold text-stone-900">Envoi réel au groupe « {selected.groupName} » · {selected.recipientCount} abonné(s)</h5>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={unsubscribeChecked}
                  onChange={(event) => setUnsubscribeChecked(event.target.checked)}
                  className="mt-1"
                />
                J'ai vérifié le rendu du message reçu et la présence de la mention de désinscription.
              </label>
              <p className="text-sm text-stone-600">
                Infomaniak désactive le lien de désinscription dans les emails de test. Pour
                vérifier son fonctionnement, effectuez un envoi définitif limité à votre groupe
                « test », pas au groupe « news ».
              </p>
              <label className="block text-sm font-medium">
                Date et heure d'envoi
                <input
                  type="datetime-local"
                  className="input-base mt-1 w-full"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={busy || !unsubscribeChecked || !scheduledAt}
                className="btn-primary"
                onClick={() => void action(selected, "schedule")}
              >
                <CalendarClock size={16} aria-hidden="true" /> Programmer l'envoi réel
              </button>
            </div>
          )}
        </div>
      )}
      <div className="border-t border-stone-200 pt-5">
        <h4 className="mb-3 font-semibold text-stone-900">Campagnes chez Infomaniak</h4>
        <ul className="divide-y divide-stone-200">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <span className="break-words font-medium">{campaign.subject}</span>
              <span className="text-stone-600">
                #{campaign.id} · {campaign.status}
              </span>
            </li>
          ))}
        </ul>
        {nextPage && (
          <button
            type="button"
            disabled={busy}
            className="btn-secondary mt-3"
            onClick={() => void refresh(nextPage)}
          >
            Campagnes suivantes
          </button>
        )}
      </div>
    </section>
  );
}
