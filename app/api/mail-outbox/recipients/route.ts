import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
} from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MEMBERS = 1000;

// [SPEC-MAIL-03] Search eligible validated members server-side for reusable recipient autocomplete.
export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const query = (new URL(request.url).searchParams.get("q") || "")
    .trim()
    .toLocaleLowerCase("fr");
  if (query.length < 2 || query.length > 120) {
    return Response.json(
      { items: [] },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  try {
    const snapshot = await mailInboxDb
      .collection("membres")
      .where("status", "==", "validated")
      .limit(MAX_MEMBERS + 1)
      .get();
    if (snapshot.size > MAX_MEMBERS) {
      return Response.json(
        { error: "La recherche dépasse sa limite de sécurité." },
        { status: 413 },
      );
    }
    const items = snapshot.docs
      .flatMap((document) => {
        const data = document.data();
        const email = String(data.email || document.id)
          .trim()
          .toLowerCase();
        if (!email || data.emailBounced === true) return [];
        const name = [data.prenom, data.nom]
          .filter((value) => typeof value === "string" && value.trim())
          .join(" ");
        const searchText = `${name} ${email}`.toLocaleLowerCase("fr");
        if (!searchText.includes(query)) return [];
        return [
          {
            id: document.id,
            label: name || email,
            description: email,
            value: email,
          },
        ];
      })
      .slice(0, 12);
    return Response.json(
      { items },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(
      error,
      "Impossible de rechercher les destinataires.",
    );
  }
}
