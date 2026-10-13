import { FieldValue } from "firebase-admin/firestore";
import { pressReleaseSchema } from "@/lib/pressReleases";
import { authorizePressStaff, pressDb, pressReleaseIdPattern } from "@/lib/pressServer";
import { mailInboxErrorResponse, readMailInboxJsonBody } from "@/lib/mailInboxServer";

export const runtime = "nodejs";
type Context = { params: Promise<{ releaseId: string }> };

// [SPEC-PRESS-02] Editing a release does not mutate the previously queued email.
export async function PATCH(request: Request, context: Context) {
  const staff = await authorizePressStaff(request);
  if (staff.response) return staff.response;
  const { releaseId } = await context.params;
  if (!pressReleaseIdPattern.test(releaseId))
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  if (!request.headers.get("Content-Type")?.includes("application/json"))
    return Response.json({ error: "Format invalide." }, { status: 415 });
  try {
    const payload = pressReleaseSchema.safeParse(await readMailInboxJsonBody(request, 35_000));
    if (!payload.success)
      return Response.json({ error: "Titre, date ou contenu invalide." }, { status: 400 });
    const ref = pressDb.collection("pressReleases").doc(releaseId);
    await pressDb.runTransaction(async (transaction) => {
      if (!(await transaction.get(ref)).exists) throw new Error("not-found");
      transaction.update(ref, {
        ...payload.data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: staff.uid,
      });
    });
    return Response.json({ id: releaseId, ...payload.data });
  } catch (error) {
    if (error instanceof Error && error.message === "not-found")
      return Response.json({ error: "Communiqué introuvable." }, { status: 404 });
    return mailInboxErrorResponse(error, "Impossible de modifier le communiqué.");
  }
}
