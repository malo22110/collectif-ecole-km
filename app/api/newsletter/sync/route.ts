import { authorizeMailInboxStaff, mailInboxErrorResponse } from "@/lib/mailInboxServer";
import { syncNewsletterSuppressions } from "@/lib/newsletterServer";

export const runtime = "nodejs";
export const maxDuration = 60;

// [SPEC-NEWSLETTER-SYNC-01] Explicit staff action, and repeated again before scheduling.
export async function POST(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  try {
    const { imported, exported, remaining, total, activeEmails } = await syncNewsletterSuppressions(
      authorization.staff.uid,
    );
    return Response.json(
      { imported, exported, remaining, total, activeCount: activeEmails.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error(
      "Synchronisation Newsletter impossible",
      error instanceof Error ? error.name : "unknown",
    );
    return mailInboxErrorResponse(
      new Error("Newsletter unavailable"),
      "Synchronisation incomplète. Aucune campagne ne doit être programmée avant résolution.",
    );
  }
}
