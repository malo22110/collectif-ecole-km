"use client";

import { useEffect, useState } from "react";
import { History, LoaderCircle, RotateCcw } from "lucide-react";
import {
  loadCmsPageRevisions,
  restoreCmsPageRevision,
  type CmsRevisionSummary,
} from "@/lib/cmsRevisionClient";

function formatRevisionDate(value: string | null): string {
  if (!value) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CmsRevisionHistory({ onRestored }: { onRestored: () => void }) {
  const [revisions, setRevisions] = useState<CmsRevisionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (cursor?: string) => {
    setError(null);
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const result = await loadCmsPageRevisions(cursor);
      setRevisions(current => cursor ? [...current, ...result.revisions] : result.revisions);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger l’historique.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const handleRestore = async (revision: CmsRevisionSummary) => {
    const date = formatRevisionDate(revision.createdAt);
    const confirmed = window.confirm(
      `Restaurer la version ${revision.version} du ${date} ? La version actuellement publiée sera également conservée dans l’historique.`
    );
    if (!confirmed) return;

    setRestoringId(revision.id);
    setError(null);
    try {
      await restoreCmsPageRevision(revision.id);
      setRestoringId(null);
      await loadPage();
      onRestored();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Impossible de restaurer cette version.");
      setRestoringId(null);
    }
  };

  if (loading) {
    return <p className="flex items-center gap-2 py-5 text-sm text-stone-600"><LoaderCircle size={16} className="animate-spin" /> Chargement de l’historique…</p>;
  }

  return (
    <section aria-labelledby="cms-revision-heading" className="border-t border-stone-200">
      <div className="flex items-center gap-3 border-b border-stone-200 py-4">
        <History size={18} className="text-emerald-700" aria-hidden="true" />
        <div>
          <h3 id="cms-revision-heading" className="font-bold text-stone-900">Versions enregistrées</h3>
          <p className="text-sm text-stone-600">Chaque sauvegarde conserve la version précédente et peut être restaurée.</p>
        </div>
      </div>

      {error && <p role="alert" className="my-4 border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      {revisions.length === 0 ? (
        <p className="py-5 text-sm text-stone-600">Aucune version antérieure n’a encore été archivée.</p>
      ) : (
        <ol className="divide-y divide-stone-200" aria-label="Versions antérieures du document fiscal">
          {revisions.map(revision => (
            <li key={revision.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">Version {revision.version}</p>
                <p className="text-sm text-stone-600">
                  {formatRevisionDate(revision.createdAt)}
                  {revision.changedBy ? ` · ${revision.changedBy}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRestore(revision)}
                disabled={restoringId !== null}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60"
                aria-label={`Restaurer la version ${revision.version} du ${formatRevisionDate(revision.createdAt)}`}
              >
                {restoringId === revision.id ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                Restaurer
              </button>
            </li>
          ))}
        </ol>
      )}

      {nextCursor && (
        <button
          type="button"
          onClick={() => void loadPage(nextCursor)}
          disabled={loadingMore}
          className="my-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-60"
        >
          {loadingMore && <LoaderCircle size={16} className="animate-spin" />}
          Charger les versions précédentes
        </button>
      )}
    </section>
  );
}