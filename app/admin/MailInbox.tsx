"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Inbox, Loader2, RefreshCw, Send } from "lucide-react";
import { auth } from "@/lib/firebase";

interface InboxSummary {
  id: string;
  threadId: string;
  messageCount: number;
  from: { name: string; email: string };
  subject: string;
  receivedAt: string | null;
  preview: string;
  isRead: boolean;
  attachmentCount: number;
  omittedAttachmentCount: number;
}

interface InboxMessage extends InboxSummary {
  text: string;
  attachments: Array<{
    id: string;
    fileName: string;
    contentType: string;
    size: number;
  }>;
  references: string[];
  syncStatus: string;
}

interface InboxReply {
  id: string;
  messageId: string;
  text: string;
  status: "pending" | "sending" | "sent" | "error";
  createdAt: string | null;
  sentAt: string | null;
  sentByEmail: string;
}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

function formatDate(value: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export default function MailInbox() {
  const [messages, setMessages] = useState<InboxSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [threadMessages, setThreadMessages] = useState<InboxMessage[]>([]);
  const [replies, setReplies] = useState<InboxReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const loadMessages = useCallback(async (cursor?: string | null) => {
    setError("");
    setLoading(true);
    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=25` : "?limit=25";
      const result = (await authorizedFetch(`/api/mail-inbox${query}`)) as {
        items: InboxSummary[];
        nextCursor: string | null;
      };
      const grouped = new Map<string, InboxSummary>();
      for (const item of result.items) {
        const existing = grouped.get(item.threadId);
        if (!existing) grouped.set(item.threadId, item);
        else
          grouped.set(item.threadId, {
            ...existing,
            messageCount: Math.max(existing.messageCount, item.messageCount),
          });
      }
      setMessages((current) => {
        const groupedItems = Array.from(grouped.values());
        const combined = cursor ? [...current, ...groupedItems] : groupedItems;
        const unique = new Map<string, InboxSummary>();
        combined.forEach((item) => {
          const existing = unique.get(item.threadId);
          if (!existing || (item.receivedAt || "") > (existing.receivedAt || ""))
            unique.set(item.threadId, item);
          else
            unique.set(item.threadId, {
              ...existing,
              messageCount: Math.max(existing.messageCount, item.messageCount),
            });
        });
        return Array.from(unique.values());
      });
      setNextCursor(result.nextCursor);
      setLoadedAt(new Date().toISOString());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger la boîte de réception.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessage = useCallback(async (messageId: string) => {
    setSelectedId(messageId);
    setLoadingDetail(true);
    setError("");
    try {
      const result = (await authorizedFetch(
        `/api/mail-inbox/${encodeURIComponent(messageId)}`,
      )) as {
        message: InboxMessage;
        messages: InboxMessage[];
        replies: InboxReply[];
      };
      setSelectedMessage(result.message);
      setThreadMessages(result.messages || [result.message]);
      setReplies(result.replies);
      if (!result.message.isRead) {
        await authorizedFetch(`/api/mail-inbox/${encodeURIComponent(messageId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        window.dispatchEvent(new Event("mail-inbox-updated"));
        setSelectedMessage((current) =>
          current?.id === messageId ? { ...current, isRead: true } : current,
        );
        setThreadMessages((current) => current.map((message) => ({ ...message, isRead: true })));
        setMessages((current) =>
          current.map((message) =>
            message.threadId === result.message.threadId ? { ...message, isRead: true } : message,
          ),
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Impossible de charger ce message.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const toggleRead = async () => {
    if (!selectedMessage) return;
    const isRead = !selectedMessage.isRead;
    setError("");
    try {
      await authorizedFetch(`/api/mail-inbox/${encodeURIComponent(selectedMessage.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      window.dispatchEvent(new Event("mail-inbox-updated"));
      setSelectedMessage((current) => (current ? { ...current, isRead } : current));
      setThreadMessages((current) => current.map((message) => ({ ...message, isRead })));
      setMessages((current) =>
        current.map((message) =>
          message.threadId === selectedMessage.threadId ? { ...message, isRead } : message,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Impossible de mettre à jour ce message.",
      );
    }
  };

  const downloadAttachment = async (
    messageId: string,
    attachment: InboxMessage["attachments"][number],
  ) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
      const response = await fetch(
        `/api/mail-inbox/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error("Impossible de télécharger cette pièce jointe.");
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Impossible de télécharger cette pièce jointe.",
      );
    }
  };

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;
    setSendingReply(true);
    setError("");
    try {
      await authorizedFetch(`/api/mail-inbox/${encodeURIComponent(selectedMessage.id)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      setReplyText("");
      const result = (await authorizedFetch(
        `/api/mail-inbox/${encodeURIComponent(selectedMessage.id)}`,
      )) as {
        message: InboxMessage;
        messages: InboxMessage[];
        replies: InboxReply[];
      };
      setSelectedMessage(result.message);
      setThreadMessages(result.messages || [result.message]);
      setReplies(result.replies);
    } catch (replyError) {
      setError(
        replyError instanceof Error ? replyError.message : "Impossible d’envoyer la réponse.",
      );
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <section className="space-y-4" aria-label="Boîte de réception du collectif">
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
            <Inbox size={19} aria-hidden="true" />
            Réception
          </h3>
          <p className="text-xs text-stone-500">
            Synchronisation automatique toutes les 5 minutes
            {loadedAt ? ` · actualisé ${formatDate(loadedAt)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMessages()}
          disabled={loading}
          className="btn-secondary min-h-10 px-3 py-2 text-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.4fr)]">
        <div className="min-w-0 border-y border-stone-200">
          {loading && messages.length === 0 ? (
            <p role="status" className="py-8 text-center text-sm text-stone-500">
              <Loader2 className="mr-2 inline animate-spin" size={16} />
              Chargement des messages…
            </p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Aucun message reçu pour le moment.
            </p>
          ) : (
            <ul className="max-h-[65vh] divide-y divide-stone-200 overflow-y-auto">
              {messages.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => void loadMessage(message.id)}
                    aria-current={selectedId === message.id ? "true" : undefined}
                    className={`w-full min-w-0 p-3 text-left hover:bg-stone-50 ${selectedId === message.id ? "bg-emerald-50" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {!message.isRead && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-emerald-700"
                          aria-label="Non lu"
                        />
                      )}
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${message.isRead ? "font-medium text-stone-700" : "font-bold text-stone-900"}`}
                      >
                        {message.from.name || message.from.email || "Expéditeur inconnu"}
                      </span>
                      <time className="shrink-0 text-[11px] text-stone-500">
                        {formatDate(message.receivedAt)}
                      </time>
                    </span>
                    <span className="mt-1 block truncate text-sm text-stone-800">
                      {message.subject}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-stone-500">
                      {message.preview || "(message sans texte)"}
                    </span>
                    {message.messageCount > 1 && (
                      <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                        {message.messageCount} messages dans le fil
                      </span>
                    )}
                    {message.attachmentCount > 0 && (
                      <span className="mt-1 block text-[11px] text-stone-500">
                        {message.attachmentCount} pièce(s) jointe(s)
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {nextCursor && (
            <button
              type="button"
              onClick={() => void loadMessages(nextCursor)}
              disabled={loading}
              className="min-h-11 w-full border-t border-stone-200 px-3 text-sm font-semibold text-emerald-800 hover:bg-stone-50"
            >
              Charger les messages précédents
            </button>
          )}
        </div>

        <div className="min-w-0 border-y border-stone-200">
          {loadingDetail ? (
            <p role="status" className="py-10 text-center text-sm text-stone-500">
              <Loader2 className="mr-2 inline animate-spin" size={16} />
              Chargement du message…
            </p>
          ) : !selectedMessage ? (
            <p className="py-10 text-center text-sm text-stone-500">
              Sélectionne un message pour le lire.
            </p>
          ) : (
            <article className="space-y-4 py-3">
              <header className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3">
                <h4 className="min-w-0 flex-1 break-words text-base font-bold text-stone-900">
                  {selectedMessage.subject}
                </h4>
                <button
                  type="button"
                  onClick={() => void toggleRead()}
                  className="min-h-9 shrink-0 px-2 text-xs font-semibold text-emerald-800 underline underline-offset-2"
                >
                  Marquer le fil {selectedMessage.isRead ? "non lu" : "comme lu"}
                </button>
              </header>

              <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
                {threadMessages.map((message) => (
                  <section key={message.id} className="space-y-3 border-b border-stone-200 pb-4">
                    <header className="space-y-1">
                      <p className="break-all text-sm text-stone-700">
                        <strong>{message.from.name || ""}</strong>
                        {message.from.name ? " · " : ""}
                        {message.from.email}
                      </p>
                      <time className="block text-xs text-stone-500">
                        {formatDate(message.receivedAt)}
                      </time>
                    </header>
                    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-800">
                      {message.text || "(message sans texte)"}
                    </div>
                    {message.attachments.length > 0 && (
                      <section aria-label="Pièces jointes" className="space-y-1">
                        <ul className="divide-y divide-stone-200 border-y border-stone-200">
                          {message.attachments.map((attachment) => (
                            <li
                              key={attachment.id}
                              className="flex min-h-11 items-center gap-2 py-1"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                                {attachment.fileName}{" "}
                                <span className="text-xs text-stone-500">
                                  ({Math.ceil(attachment.size / 1024)} Ko)
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => void downloadAttachment(message.id, attachment)}
                                aria-label={`Télécharger ${attachment.fileName}`}
                                className="grid size-10 place-items-center rounded text-emerald-800 hover:bg-emerald-50"
                              >
                                <ArrowDownToLine size={17} aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {message.omittedAttachmentCount > 0 && (
                      <p role="status" className="text-xs text-amber-800">
                        {message.omittedAttachmentCount} pièce(s) jointe(s) trop volumineuse(s) non
                        stockée(s).
                      </p>
                    )}
                    {message.syncStatus === "message-too-large" && (
                      <p role="status" className="text-xs text-amber-800">
                        Le message complet dépasse la limite de stockage; seul son en-tête est
                        visible.
                      </p>
                    )}
                    {replies
                      .filter((reply) => reply.messageId === message.id)
                      .map((reply) => (
                        <div key={reply.id} className="border-l-2 border-emerald-400 pl-3 py-1">
                          <p className="whitespace-pre-wrap break-words text-sm text-stone-700">
                            {reply.text}
                          </p>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {reply.status === "sent"
                              ? `Envoyée ${formatDate(reply.sentAt)}`
                              : reply.status === "error"
                                ? "Échec d’envoi"
                                : "Envoi en cours"}{" "}
                            · {reply.sentByEmail}
                          </p>
                        </div>
                      ))}
                  </section>
                ))}
              </div>

              <form onSubmit={sendReply} className="space-y-2 border-t border-stone-200 pt-3">
                <label htmlFor="mail-inbox-reply" className="text-sm font-semibold text-stone-800">
                  Répondre à {selectedMessage.from.email}
                </label>
                <textarea
                  id="mail-inbox-reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  maxLength={12000}
                  required
                  rows={5}
                  className="input-base resize-y"
                  placeholder="Écris ta réponse…"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-stone-500">Envoyée depuis l’adresse du collectif.</p>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-primary min-h-10 px-4 py-2 text-sm"
                  >
                    <Send size={15} />
                    {sendingReply ? "Envoi…" : "Répondre"}
                  </button>
                </div>
              </form>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
