export type HomeActionPlanStatus = "completed" | "current" | "upcoming";

export interface HomeActionPlanEntry {
  date: string;
  title: string;
  description: string;
  status: HomeActionPlanStatus;
  linkUrl?: string;
}

export function getNextHomeActionPlanEntry(
  entries: HomeActionPlanEntry[],
): HomeActionPlanEntry | undefined {
  return (
    entries.find((entry) => entry.status === "upcoming") ??
    entries.find((entry) => entry.status === "current")
  );
}

export const DEFAULT_HOME_ACTION_PLAN: HomeActionPlanEntry[] = [
  {
    date: "Samedi 26 Septembre",
    title: "Réunion de lancement",
    description:
      "Lancement officiel avec déjà 51 personnes mobilisées, en présence du Maire et de 3 adjoints, pour poser les bases de notre démarche citoyenne.",
    status: "completed",
  },
  {
    date: "Collecte terminée",
    title: "Pétition citoyenne →",
    description:
      "La pétition citoyenne a accompagné la demande d’une révision budgétaire concertée. Elle est désormais close.",
    status: "completed",
    linkUrl: "/petition",
  },
  {
    date: "Après le vote du conseil",
    title: "Retour chez l’architecte",
    description:
      "Le dossier est retravaillé pour entrer dans l’enveloppe prévue. Les prochaines étapes seront précisées lorsque les informations seront disponibles.",
    status: "upcoming",
  },
];

export function sanitizeHomeActionPlanLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const link = value.trim();
  if (link.startsWith("/") && !link.startsWith("//")) return link;

  try {
    const parsed = new URL(link);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeHomeActionPlan(value: unknown): HomeActionPlanEntry[] {
  if (!Array.isArray(value)) return DEFAULT_HOME_ACTION_PLAN.map((item) => ({ ...item }));

  return value.flatMap((candidate): HomeActionPlanEntry[] => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date.trim().slice(0, 120) : "";
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 180) : "";
    const description =
      typeof item.description === "string" ? item.description.trim().slice(0, 2000) : "";
    if (!date || !title || !description) return [];

    const status: HomeActionPlanStatus =
      item.status === "completed" || item.status === "current" ? item.status : "upcoming";
    const linkUrl = sanitizeHomeActionPlanLink(item.linkUrl);

    return [
      {
        date,
        title,
        description,
        status,
        ...(linkUrl ? { linkUrl } : {}),
      },
    ];
  });
}
