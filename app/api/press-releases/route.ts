import { FieldValue } from "firebase-admin/firestore";
import { pressReleaseSchema } from "@/lib/pressReleases";
import { authorizePressStaff, pressDb } from "@/lib/pressServer";
import { mailInboxErrorResponse, readMailInboxJsonBody } from "@/lib/mailInboxServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-PRESS-01] Public content is bounded and contains no journalist or delivery metadata.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const isStaffRequest = Boolean(request.headers.get("Authorization"));
  if (isStaffRequest) {
    const staff = await authorizePressStaff(request);
    if (staff.response) return staff.response;
  }
  const limit = Number(url.searchParams.get("limit") || 20);
  const cursor = url.searchParams.get("cursor");
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    (cursor && !/^[A-Za-z0-9_-]{1,200}$/.test(cursor))
  )
    return Response.json({ error: "Pagination invalide." }, { status: 400 });
  try {
    let query = pressDb.collection("pressReleases").orderBy("date", "desc");
    if (cursor) {
      const last = await pressDb.collection("pressReleases").doc(cursor).get();
      if (!last.exists) return Response.json({ error: "Curseur invalide." }, { status: 400 });
      query = query.startAfter(last);
    }
    const snapshot = await query.limit(limit + 1).get();
    const page = snapshot.docs.slice(0, limit);
    const mailRefs = isStaffRequest
      ? page
          .filter((item) => item.get("mailId"))
          .map((item) => pressDb.collection("mailOutbox").doc(item.get("mailId")))
      : [];
    const deliveries = mailRefs.length ? await pressDb.getAll(...mailRefs) : [];
    const deliveryById = new Map(deliveries.map((item) => [item.id, item]));
    return Response.json(
      {
        items: page.map((item) => {
          const mail = deliveryById.get(item.get("mailId"));
          return {
            id: item.id,
            title: item.get("title"),
            body: item.get("body"),
            date: item.get("date"),
            ...(isStaffRequest
              ? {
                  mailId: item.get("mailId") || null,
                  delivery: mail?.exists
                    ? {
                        status: mail.get("status"),
                        sentCount: mail.get("sentCount"),
                        failedCount: mail.get("failedCount"),
                        recipientCount: mail.get("recipientCount"),
                      }
                    : null,
                }
              : {}),
          };
        }),
        nextCursor: snapshot.size > limit ? page.at(-1)?.id || null : null,
      },
      { headers: { "Cache-Control": isStaffRequest ? "private, no-store" : "public, max-age=60" } },
    );
  } catch (error) {
    console.error("Lecture des communiqués impossible", error);
    return Response.json({ error: "Impossible de charger les communiqués." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const staff = await authorizePressStaff(request);
  if (staff.response) return staff.response;
  if (!request.headers.get("Content-Type")?.includes("application/json"))
    return Response.json({ error: "Format invalide." }, { status: 415 });
  try {
    const payload = pressReleaseSchema.safeParse(await readMailInboxJsonBody(request, 35_000));
    if (!payload.success)
      return Response.json({ error: "Titre, date ou contenu invalide." }, { status: 400 });
    const ref = pressDb.collection("pressReleases").doc();
    await ref.create({
      ...payload.data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: staff.uid,
    });
    return Response.json({ id: ref.id, ...payload.data }, { status: 201 });
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible d'enregistrer le communiqué.");
  }
}
