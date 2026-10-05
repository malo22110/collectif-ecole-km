import { auth } from "@/lib/firebase";
import type { CmsPageData } from "@/lib/cmsRevisionModel";

const API_PATH = "/api/admin/cms-revisions";

async function requestCmsRevisions<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Connectez-vous pour consulter l’historique.");

  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "La demande a échoué.");
  return result as T;
}

export async function publishCmsPageRevision(
  data: CmsPageData,
  origin: "visual" | "expert" | "draft",
): Promise<{ version: number }> {
  return requestCmsRevisions(API_PATH, {
    method: "POST",
    body: JSON.stringify({ data, origin }),
  });
}

export interface CmsRevisionSummary {
  id: string;
  version: number;
  createdAt: string | null;
  changedBy: string;
  origin: "visual" | "expert" | "draft" | "restore";
}

export async function loadCmsPageRevisions(cursor?: string): Promise<{
  revisions: CmsRevisionSummary[];
  nextCursor: string | null;
}> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return requestCmsRevisions(`${API_PATH}${query}`);
}

export async function restoreCmsPageRevision(
  revisionId: string,
): Promise<{ version: number }> {
  return requestCmsRevisions(API_PATH, {
    method: "PUT",
    body: JSON.stringify({ revisionId }),
  });
}
