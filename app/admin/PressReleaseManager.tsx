"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Save, Send, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import type { PressRelease } from "@/lib/pressReleases";

type EditableRelease = PressRelease & {
  mailId?: string | null;
  delivery?: {
    status: string;
    sentCount: number;
    failedCount: number;
    recipientCount: number;
  } | null;
};
type PressForm = Pick<PressRelease, "title" | "body" | "date">;

const emptyForm = (): PressForm => ({
  title: "",
  body: "",
  date: new Date().toLocaleDateString("en-CA"),
});

export default function PressReleaseManager({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<EditableRelease[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PressForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (path: string, init?: RequestInit) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Votre session a expiré. Reconnectez-vous.");
    const response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "L'opération a échoué.");
    return result;
  };

  const load = async (next?: string) => {
    try {
      const result = await request(
        `/api/press-releases?limit=50${next ? `&cursor=${encodeURIComponent(next)}` : ""}`,
      );
      setItems((previous) => (next ? [...previous, ...result.items] : result.items));
      setCursor(result.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les communiqués.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request(
        editingId === "new"
          ? "/api/press-releases"
          : `/api/press-releases/${encodeURIComponent(editingId!)}`,
        {
          method: editingId === "new" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      setEditingId(null);
      setNotice("Communiqué enregistré.");
      await load();
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const send = async (release: EditableRelease) => {
    if (
      !window.confirm(
        `Envoyer « ${release.title} » à tous les journalistes enregistrés ? Cet envoi ne pourra pas être répété.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await request(`/api/press-releases/${encodeURIComponent(release.id)}/send`, {
        method: "POST",
      });
      setNotice(`Envoi placé dans la file pour ${result.recipientCount} journaliste(s).`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d'envoyer le communiqué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="space-y-5 border-b border-stone-200 pb-8"
      aria-label="Communiqués de presse"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-stone-900">Communiqués de presse</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingId("new");
            setForm(emptyForm());
            setError("");
          }}
        >
          <Plus size={17} aria-hidden="true" /> Nouveau communiqué
        </button>
      </div>
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
      {editingId && (
        <form
          onSubmit={(event) => void save(event)}
          className="space-y-3 border-l-4 border-emerald-700 bg-stone-50 p-4"
        >
          <label className="block text-sm font-medium">
            Titre
            <input
              required
              maxLength={240}
              className="input-base mt-1 w-full"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium">
            Date du communiqué
            <input
              required
              type="date"
              className="input-base mt-1 w-full"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium">
            Texte
            <textarea
              required
              maxLength={30000}
              rows={12}
              className="input-base mt-1 w-full whitespace-pre-wrap"
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              <Save size={16} aria-hidden="true" /> Enregistrer
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="btn-secondary">
              <X size={16} aria-hidden="true" /> Annuler
            </button>
          </div>
        </form>
      )}
      <ul className="divide-y divide-stone-200">
        {items.map((release) => (
          <li key={release.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-stone-900">{release.title}</h3>
              <time dateTime={release.date} className="text-sm text-stone-500">
                {release.date}
              </time>
              <p className="text-xs text-stone-600">
                {release.delivery
                  ? `Envoi ${release.delivery.status} · ${release.delivery.sentCount}/${release.delivery.recipientCount} accepté(s) par SMTP${release.delivery.failedCount ? ` · ${release.delivery.failedCount} échec(s)` : ""}`
                  : release.mailId
                    ? "Envoi en préparation"
                    : "Pas encore envoyé aux journalistes"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                title="Modifier le communiqué"
                aria-label={`Modifier ${release.title}`}
                className="btn-secondary p-2"
                onClick={() => {
                  setEditingId(release.id);
                  setForm({ title: release.title, date: release.date, body: release.body });
                }}
              >
                <Edit2 size={17} aria-hidden="true" />
              </button>
              {!release.mailId && (
                <button
                  type="button"
                  disabled={busy}
                  className="btn-primary"
                  onClick={() => void send(release)}
                >
                  <Send size={17} aria-hidden="true" /> Envoyer
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {cursor && (
        <button type="button" className="btn-secondary" onClick={() => void load(cursor)}>
          Voir plus
        </button>
      )}
    </section>
  );
}
