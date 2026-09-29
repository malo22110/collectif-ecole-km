/**
 * [SPEC-OG-01] Redirection de l'ancienne URL /actualites?id=xxx
 * vers la nouvelle URL canonique /actualites/[id].
 *
 * Assure la compatibilité avec les liens déjà partagés.
 */

import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function ActualitesRedirectPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (id) {
    // Redirection permanente (301) vers la nouvelle URL canonique
    redirect(`/actualites/${id}`);
  }

  // Si pas d'id, retour à l'accueil
  redirect("/");
}
