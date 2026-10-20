"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, Search, UserMinus } from "lucide-react";
import { auth } from "@/lib/firebase";

type Suppression = { email: string; createdAt: string | null };
type Page = { items: Suppression[]; nextCursor: string | null; warning?: string | null };

async function request(path: string, email?: string): Promise<Page> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
  const response = await fetch(path, {
    method: email ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(email ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
    ...(email ? { body: JSON.stringify({ email }) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

export default function MailSuppressions() {
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Suppression[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const synchronize = async () => {
    setBusy(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Session expirée.");
      const response = await fetch("/api/newsletter/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Synchronisation impossible.");
      setNotice(
        `Synchronisation : ${data.imported} opposition(s) importée(s), ${data.exported} transmise(s), ${data.activeCount} abonné(s) actif(s).${data.remaining ? ` ${data.remaining} opposition(s) restent à transmettre : relancez la synchronisation.` : ""}`,
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Synchronisation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const load = useCallback(async (next?: string, lookup?: string) => {
    setError("");
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (next) params.set("cursor", next);
      if (lookup) params.set("email", lookup);
      const result = await request(`/api/mail-suppressions?${params}`);
      setItems((previous) => (next ? [...previous, ...result.items] : result.items));
      setCursor(result.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!window.confirm(`Enregistrer la demande de désabonnement de ${email.trim()} ?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request("/api/mail-suppressions", email.trim());
      setNotice(`Désabonnement enregistré pour ${email.trim()}.`);
      setEmail("");
      setSearch("");
      await load();
      if (result.warning) setError(result.warning);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    setError("");
    try {
      let next: string | null = null;
      const emails: string[] = [];
      do {
        const result: Page = await request(
          `/api/mail-suppressions?limit=100${next ? `&cursor=${encodeURIComponent(next)}` : ""}`,
        );
        emails.push(...result.items.map((item) => item.email));
        next = result.nextCursor;
        if (emails.length >= 10000 && next)
          throw new Error("L'export dépasse la limite de sécurité.");
      } while (next);
      const csv =
        "email\r\n" +
        emails
          .map(
            (value) => `"${(/^[=+\-@]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`,
          )
          .join("\r\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "desabonnements-newsletter.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5" aria-label="Désabonnements newsletter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-stone-900">Désabonnements</h3>
        <button
          type="button"
          disabled={busy}
          className="btn-secondary"
          onClick={() => void download()}
        >
          <Download size={16} aria-hidden="true" /> Exporter les exclusions
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        className="btn-secondary"
        onClick={() => void synchronize()}
      >
        <RefreshCw size={16} aria-hidden="true" /> Synchroniser avec Infomaniak
      </button>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      <form onSubmit={(event) => void save(event)} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Adresse à désabonner
          <input
            required
            type="email"
            maxLength={254}
            autoComplete="off"
            className="input-base mt-1 w-full"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary">
          <UserMinus size={16} aria-hidden="true" /> Désabonner
        </button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load(undefined, search.trim());
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="min-w-0 flex-1 text-sm font-medium">
          Rechercher une adresse exclue
          <input
            type="email"
            maxLength={254}
            className="input-base mt-1 w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button type="submit" className="btn-secondary">
          <Search size={16} aria-hidden="true" /> Rechercher
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setSearch("");
            void load();
          }}
        >
          Tout afficher
        </button>
      </form>
      <ul className="divide-y divide-stone-200">
        {items.map((item) => (
          <li key={item.email} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <span className="break-all font-medium text-stone-900">{item.email}</span>
            <span className="text-stone-600">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : ""} ·
              Désabonné
            </span>
          </li>
        ))}
      </ul>
      {!items.length && (
        <p className="text-sm text-stone-600">Aucune adresse exclue dans cette liste.</p>
      )}
      {cursor && (
        <button type="button" className="btn-secondary" onClick={() => void load(cursor)}>
          Voir plus
        </button>
      )}
    </section>
  );
}
