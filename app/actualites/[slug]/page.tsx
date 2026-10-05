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

// Revalider le cache toutes les 60 secondes pour éviter de rester bloqué sur une erreur 404
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Fonction utilitaire pour trouver un article par slug, avec fallback sur l'ID.
 */
async function getArticleBySlugOrId(slugOrId: string) {
  let docSnap = null;

  // 1. Chercher par slug (nouveau format)
  const querySnap = await adminDb
    .collection("articles")
    .where("slug", "==", slugOrId)
    .limit(1)
    .get();
  if (!querySnap.empty) {
    docSnap = querySnap.docs[0];
  } else {
    // 2. Fallback par ID (anciens articles)
    docSnap = await adminDb.collection("articles").doc(slugOrId).get();
  }

  return docSnap;
}

/**
 * [SPEC-OG-01] Génère les meta OpenGraph dynamiquement pour chaque article.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const docSnap = await getArticleBySlugOrId(slug);

    if (!docSnap || !docSnap.exists) {
      return {
        title: "Article introuvable | École de Kergrist-Moëlou",
      };
    }

    const article = docSnap.data()!;
    const siteUrl = "https://collectif-ecole-km.fr";
    const articleUrl = `${siteUrl}/actualites/${slug}`;

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
  const { slug } = await params;

  let articleId = slug;

  try {
    const docSnap = await getArticleBySlugOrId(slug);

    if (!docSnap || !docSnap.exists) {
      notFound();
    }

    const status = docSnap.data()?.status || "published";
    if (status !== "published") {
      notFound();
    }

    // On passe toujours le VRAI ID Firestore au composant client pour qu'il le charge sans changer sa logique
    articleId = docSnap.id;
  } catch {
    notFound();
  }

  return <ArticlePageClient id={articleId} />;
}
