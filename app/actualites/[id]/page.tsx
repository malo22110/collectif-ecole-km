/**
 * [SPEC-OG-01] Route dynamique pour les articles : /actualites/[id]
 *
 * Server Component : génère les meta OpenGraph côté serveur pour chaque article.
 * Les crawlers Facebook, Twitter, LinkedIn, WhatsApp, Telegram voient les bonnes
 * balises meta même sans exécuter JavaScript.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebaseAdmin";
import ArticlePageClient from "./ArticlePageClient";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * [SPEC-OG-01] Génère les meta OpenGraph dynamiquement pour chaque article.
 * Appelé côté serveur avant le rendu — garantit les bonnes meta pour les crawlers.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const docSnap = await adminDb.collection("articles").doc(id).get();

    if (!docSnap.exists) {
      return {
        title: "Article introuvable | École de Kergrist-Moëlou",
      };
    }

    const article = docSnap.data()!;
    const siteUrl = "https://collectif-ecole-km.web.app";
    const articleUrl = `${siteUrl}/actualites/${id}`;

    // Extrait un texte brut depuis le HTML du contenu (pour la description OG)
    const rawText = (article.content || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const description = article.excerpt || rawText.slice(0, 160) || article.title;

    const image = article.imageUrl || `${siteUrl}/images/hero.jpg`;

    return {
      title: `${article.title} | École de Kergrist-Moëlou`,
      description,
      openGraph: {
        title: article.title,
        description,
        url: articleUrl,
        siteName: "Collectif École Kergrist-Moëlou",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        type: "article",
        locale: "fr_FR",
        publishedTime: article.publishedAt
          ? new Date(article.publishedAt).toISOString()
          : undefined,
        authors: ["Collectif École Kergrist-Moëlou"],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images: [image],
      },
      alternates: {
        canonical: articleUrl,
      },
    };
  } catch (error) {
    console.error("generateMetadata error:", error);
    return {
      title: "Article | École de Kergrist-Moëlou",
    };
  }
}

/**
 * Server Component shell — passe l'id au Client Component qui fetch les données.
 */
export default async function ArticlePage({ params }: Props) {
  const { id } = await params;

  // Vérifier que l'article existe côté serveur (pour le 404 propre)
  try {
    const docSnap = await adminDb.collection("articles").doc(id).get();
    if (!docSnap.exists || docSnap.data()?.status !== "published") {
      notFound();
    }
  } catch {
    notFound();
  }

  return <ArticlePageClient id={id} />;
}
