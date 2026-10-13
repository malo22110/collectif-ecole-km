"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Newspaper } from "lucide-react";
import {
  getUnlinkedPressArticles,
  groupPressReleases,
  type PressRelease,
} from "@/lib/pressReleases";

export type HomePressArticle = {
  id: string;
  releaseId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  source?: string;
  date?: string;
  url?: string;
};

function safeArticleUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function Links({ articles }: { articles: HomePressArticle[] }) {
  if (!articles.length) return null;
  return (
    <div className="border-t border-stone-200 pt-5">
      <h4 className="mb-3 text-sm font-bold uppercase text-stone-600">Articles et relais</h4>
      <ul className="grid gap-6 sm:grid-cols-2">
        {articles.map((article) => {
          const href = safeArticleUrl(article.url);
          const imageUrl = safeArticleUrl(article.imageUrl);
          return href ? (
            <li key={article.id} className="min-w-0">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-100 bg-white text-left shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                {imageUrl && (
                  <div className="relative h-[200px] w-full shrink-0 overflow-hidden">
                    <span className="absolute left-3 top-3 z-10 bg-stone-900 px-2 py-1 text-xs font-semibold uppercase text-white shadow-sm">
                      Actualité
                    </span>
                    <img
                      src={imageUrl}
                      alt={article.title || "Article de presse"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <time dateTime={article.date} className="mb-2.5 text-xs text-stone-500">
                    {article.date ? new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Récemment"}
                  </time>
                  <strong className="mb-3 line-clamp-3 text-[1.15rem] font-bold leading-[1.4] text-stone-900 transition-colors group-hover:text-emerald-700">
                    {article.title || "Lire l'article"}
                  </strong>
                  {article.description && (
                    <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-stone-600">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-stone-500">Par {article.source || "Presse Locale"}</span>
                    <span className="flex shrink-0 items-center gap-1 font-bold text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">
                      Lire <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
}

function ReleaseText({ release }: { release: PressRelease }) {
  return (
    <div className="space-y-4 text-stone-700 leading-relaxed whitespace-pre-line">
      {release.body.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

// [SPEC-PRESS-01] The newest dated release owns the lead section; archives retain their own links.
export default function PressHomeSection({ articles }: { articles: HomePressArticle[] }) {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = async (next?: string) => {
    try {
      const response = await fetch(
        `/api/press-releases?limit=20${next ? `&cursor=${encodeURIComponent(next)}` : ""}`,
      );
      if (!response.ok) throw new Error("Communiqués indisponibles");
      const data: { items: PressRelease[]; nextCursor: string | null } = await response.json();
      setReleases((previous) => (next ? [...previous, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  const grouped = groupPressReleases(releases, articles);
  const [latest, ...archives] = grouped;
  const unmatched = getUnlinkedPressArticles(releases, articles, !cursor);

  return (
    <section
      id="presse"
      className="border-b border-stone-200 bg-white px-4 py-12 md:py-16"
      aria-label="Communiqués et revue de presse"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-center gap-3 border-b border-stone-200 pb-5">
          <Newspaper size={25} className="text-emerald-800" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-stone-900">Presse</h2>
        </div>
        {error && (
          <p role="status" className="text-sm text-stone-600">
            Les communiqués sont momentanément indisponibles.
          </p>
        )}
        {latest && (
          <article className="pb-8">
            <p className="mb-2 text-sm font-semibold text-emerald-800">
              Dernier communiqué · <time dateTime={latest.release.date}>{latest.release.date}</time>
            </p>
            <h3 className="mb-5 text-xl font-bold text-stone-900 md:text-2xl">
              {latest.release.title}
            </h3>
            <ReleaseText release={latest.release} />
            <div className="mt-8">
              <Links articles={latest.articles} />
            </div>
          </article>
        )}
        {archives.length > 0 && (
          <div className="border-t border-stone-200 pt-5">
            <h3 className="mb-3 text-lg font-bold text-stone-900">Archives des communiqués</h3>
            {archives.map(({ release, articles: linked }) => (
              <details key={release.id} className="group border-b border-stone-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-left font-semibold text-stone-900 focus-visible:outline-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
                  <span>
                    {release.title}{" "}
                    <time
                      dateTime={release.date}
                      className="block text-sm font-normal text-stone-600"
                    >
                      {release.date}
                    </time>
                  </span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="pb-6">
                  <ReleaseText release={release} />
                  <div className="mt-6">
                    <Links articles={linked} />
                  </div>
                </div>
              </details>
            ))}
            {cursor && (
              <button
                type="button"
                className="btn-secondary mt-4"
                onClick={() => void load(cursor)}
              >
                Afficher d'autres archives
              </button>
            )}
          </div>
        )}
        {cursor && archives.length === 0 && (
          <button type="button" className="btn-secondary mt-4" onClick={() => void load(cursor)}>
            Afficher les archives
          </button>
        )}
        {unmatched.length > 0 && (
          <div className="mt-8 border-t border-stone-200 pt-6">
            <h3 className="mb-4 text-lg font-bold text-stone-900">Autres retombées presse</h3>
            <Links articles={unmatched} />
          </div>
        )}
      </div>
    </section>
  );
}
