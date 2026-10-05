"use client";

/**
 * [SPEC-OG-01] Client Component de la page article — gère l'interactivité.
 * Reçoit l'id depuis le Server Component parent (page.tsx).
 */

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Paperclip, Download } from "lucide-react";
import ShareButton from "@/app/components/ShareButton";

interface Props {
  id: string;
}

export default function ArticlePageClient({ id }: Props) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <main className="min-h-screen bg-stone-50 pb-20 overflow-x-hidden">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 pt-12">
        <div className="mb-8">
          {article.imageUrl && (
            <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-8 shadow-sm">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 mb-6 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-stone-500 font-medium pb-8 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(article.publishedAt || Date.now()).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2">
              <User size={16} />
              Collectif École Kergrist
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              {Math.max(1, Math.ceil((article.content?.length || 0) / 1000))} min de lecture
            </div>
          </div>
        </div>

        <div
          dangerouslySetInnerHTML={{ __html: article.content || "" }}
          className="prose prose-stone prose-lg md:prose-xl max-w-none prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-headings:font-bold prose-img:rounded-xl"
        />

        {Array.isArray(article.attachments) && article.attachments.length > 0 && (
          <section
            className="mt-10 border-y border-stone-200 py-6"
            aria-labelledby="article-attachments-heading"
          >
            <h2
              id="article-attachments-heading"
              className="flex items-center gap-2 text-lg font-bold text-stone-900"
            >
              <Paperclip size={19} aria-hidden="true" />
              Documents joints
            </h2>
            <ul className="mt-3 divide-y divide-stone-200">
              {article.attachments.map(
                (attachment: { id: string; fileName: string; size: number }) => (
                  <li key={attachment.id}>
                    <a
                      href={`/api/articles/${encodeURIComponent(article.id)}/attachments?attachmentId=${encodeURIComponent(attachment.id)}`}
                      className="flex min-h-12 items-center gap-3 py-2 text-sm font-medium text-emerald-900 hover:text-emerald-700"
                    >
                      <Download size={17} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 break-words">{attachment.fileName}</span>
                      <span className="shrink-0 text-xs font-normal text-stone-500">
                        {Math.ceil(attachment.size / 1024)} Ko
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

        <div className="mt-12 pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-stone-500 font-medium">
            Cet article vous a intéressé ? Partagez-le autour de vous :
          </p>
          <ShareButton
            url={`https://collectif-ecole-km.fr/actualites/${article.slug || article.id}`}
            title={article.title}
            text="Découvrez cet article sur la mobilisation pour l'école de Kergrist-Moëlou !"
            variant="secondary"
          />
        </div>
      </article>

      <div className="max-w-3xl mx-auto px-4 mt-20">
        <div className="bg-emerald-50 rounded-3xl p-8 md:p-12 text-center border border-emerald-100">
          <h3 className="text-2xl font-bold text-emerald-900 mb-4">
            Envie de soutenir le projet ?
          </h3>
          <p className="text-emerald-800 mb-8 max-w-lg mx-auto">
            Rejoignez le collectif et participez activement à la construction de l'avenir de l'école
            de Kergrist-Moëlou.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/#rejoindre"
              className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
            >
              Rejoindre le collectif
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
