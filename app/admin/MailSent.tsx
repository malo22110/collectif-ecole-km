"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  SendHorizontal,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";

interface SentSummary {
  id: string;
  subject: string;
  target: string;
  testMode: boolean;
  status: string;
  createdAt: string | null;
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  recipientCount: number;
  recipientStatus: Record<string, number>;
}

interface SentDetail extends SentSummary {
  recipients: Array<{
    email: string;
    name: string;
    status: string;
    error?: string;
    sentAt: string | null;
  }>;
}

async function authorizedFetch(url: string) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

function formatDate(value: string | null) {
  if (!value) return "En attente";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

const audienceLabels: Record<string, string> = {
  all: "Tous (hors presse)",
  membres: "Membres",
  signataires: "Signataires",
  membres_non_signataires: "Membres non-signataires",
  journalistes: "Journalistes",
  individuel: "Un membre",
};

const deliveryStatusLabels: Record<string, string> = {
  preparing: "Préparation des destinataires",
  pending: "En attente du traitement SMTP",
  sending: "Envoi SMTP en cours",
  sent: "Accepté par le serveur SMTP",
  partial: "Envoi partiel : certains destinataires ont échoué",
  error: "Échec de l’envoi SMTP",
};

export default function MailSent() {
  const [items, setItems] = useState<SentSummary[]>([]);
  const [selected, setSelected] = useState<SentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const result = (await authorizedFetch("/api/mail-outbox?limit=50")) as {
        items: SentSummary[];
      };
      setItems(result.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les messages envoyés.",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshSelected = useCallback(async (mailId: string) => {
    try {
      const result = (await authorizedFetch(
        `/api/mail-outbox/${encodeURIComponent(mailId)}`,
      )) as { message: SentDetail };
      setSelected((current) =>
        current?.id === mailId ? result.message : current,
      );
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Impossible d’actualiser l’état de cet envoi.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (
      !items.some((item) =>
        ["preparing", "pending", "sending"].includes(item.status),
      )
    )
      return;
    const intervalId = window.setInterval(() => {
      void load(true);
      if (selected) void refreshSelected(selected.id);
    }, 15_000);
    return () => window.clearInterval(intervalId);
  }, [items, load, refreshSelected, selected]);

  const selectMessage = async (item: SentSummary) => {
    await refreshSelected(item.id);
  };

  return (
    <section className="space-y-4" aria-label="Messages envoyés">
      {error && (
        <p
          role="alert"
          className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-stone-900">
            <SendHorizontal size={19} aria-hidden="true" />
            Envoyés
          </h3>
          <p className="text-xs text-stone-500">
            Historique et état de livraison par destinataire
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="btn-secondary min-h-10 px-3 py-2 text-sm"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Actualiser
        </button>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 border-y border-stone-200">
          {loading && items.length === 0 ? (
            <p
              role="status"
              className="py-8 text-center text-sm text-stone-500"
            >
              <Loader2 className="mr-2 inline animate-spin" size={16} />
              Chargement…
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Aucun message envoyé.
            </p>
          ) : (
            <ul className="max-h-[65vh] divide-y divide-stone-200 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void selectMessage(item)}
                    aria-current={selected?.id === item.id ? "true" : undefined}
                    className={`w-full min-w-0 p-3 text-left hover:bg-stone-50 ${selected?.id === item.id ? "bg-emerald-50" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.status === "sent" ? (
                        <CheckCircle2
                          size={15}
                          className="shrink-0 text-emerald-700"
                          aria-label="Accepté par SMTP"
                        />
                      ) : item.status === "error" ||
                        item.status === "partial" ? (
                        <XCircle
                          size={15}
                          className="shrink-0 text-rose-700"
                          aria-label="Échec ou envoi partiel"
                        />
                      ) : (
                        <Clock3
                          size={15}
                          className="shrink-0 text-amber-700"
                          aria-label={
                            deliveryStatusLabels[item.status] || "En attente"
                          }
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                        {item.subject}
                      </span>
                      <time className="shrink-0 text-[11px] text-stone-500">
                        {formatDate(item.createdAt)}
                      </time>
                    </span>
                    <span className="mt-1 block truncate text-xs text-stone-500">
                      {item.testMode
                        ? "Test personnel"
                        : audienceLabels[item.target] || item.target}{" "}
                      · {item.sentCount}/{item.recipientCount} envoyé(s)
                      {item.failedCount
                        ? ` · ${item.failedCount} échec(s)`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0 border-y border-stone-200">
          {!selected ? (
            <p className="py-10 text-center text-sm text-stone-500">
              Sélectionne un envoi pour voir les destinataires.
            </p>
          ) : (
            <article className="space-y-4 py-3">
              <header className="space-y-1 border-b border-stone-200 pb-3">
                <h4 className="break-words text-base font-bold text-stone-900">
                  {selected.subject}
                </h4>
                <p className="text-xs text-stone-500">
                  {selected.testMode
                    ? "Test personnel"
                    : audienceLabels[selected.target] || selected.target}{" "}
                  · Créé le {formatDate(selected.createdAt)}
                </p>
                <p className="text-xs text-stone-700">
                  État :{" "}
                  {deliveryStatusLabels[selected.status] || selected.status} ·{" "}
                  {selected.sentCount} accepté(s) par SMTP,{" "}
                  {selected.failedCount} échec(s), {selected.recipientCount}{" "}
                  destinataire(s)
                </p>
              </header>
              <ul className="max-h-[52vh] divide-y divide-stone-200 overflow-y-auto">
                {selected.recipients.map((recipient, index) => (
                  <li
                    key={`${recipient.email}-${index}`}
                    className="flex min-h-11 items-center gap-2 py-2 text-sm"
                  >
                    {recipient.status === "sent" ? (
                      <CheckCircle2
                        size={15}
                        className="shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                    ) : recipient.status === "error" ? (
                      <XCircle
                        size={15}
                        className="shrink-0 text-rose-700"
                        aria-hidden="true"
                      />
                    ) : (
                      <Clock3
                        size={15}
                        className="shrink-0 text-amber-700"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-stone-800">
                      {recipient.name ? `${recipient.name} · ` : ""}
                      {recipient.email}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {recipient.status === "sent"
                        ? formatDate(recipient.sentAt)
                        : recipient.status === "error"
                          ? "Échec"
                          : "En attente"}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
