import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export const revalidate = 3600; // Rafraichir le sitemap toutes les heures (3600 secondes)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://collectif-ecole-km.fr";

  // 1. Pages statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/actualites`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/historique`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cagnotte`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/petition`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // 2. Pages dynamiques (Articles)
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const articlesSnap = await adminDb
      .collection("articles")
      .where("status", "==", "published")
      .get();

    dynamicRoutes = articlesSnap.docs.map((doc) => {
      const data = doc.data();
      const slugOrId = data.slug || doc.id;

      // On essaie de parser la date, sinon on met la date du jour
      let lastMod = new Date();
      if (data.publishedAt) {
        try {
          lastMod = new Date(data.publishedAt);
        } catch (e) {
          // fallback
        }
      }

      return {
        url: `${baseUrl}/actualites/${slugOrId}`,
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error("Erreur lors de la génération du sitemap pour les articles:", error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
