import { FieldValue } from "firebase-admin/firestore";
import { pressBodyToHtml, pressReleaseSchema } from "@/lib/pressReleases";
import { authorizePressStaff, pressDb, pressReleaseIdPattern } from "@/lib/pressServer";

export const runtime = "nodejs";

// [SPEC-PRESS-03] Queue once, using a stable campaign ID; SMTP delivery remains asynchronous.
export async function POST(request: Request, context: { params: Promise<{ releaseId: string }> }) {
  const staff = await authorizePressStaff(request);
  if (staff.response) return staff.response;
  const { releaseId } = await context.params;
  if (!pressReleaseIdPattern.test(releaseId))
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  try {
    const releaseRef = pressDb.collection("pressReleases").doc(releaseId);
    const mailRef = pressDb.collection("mailOutbox").doc(`press-${releaseId}`);
    const snapshot = await pressDb
      .collection("journalistes")
      .select("email", "nom")
      .limit(1001)
      .get();
    if (snapshot.size > 1000)
      return Response.json({ error: "Trop de journalistes pour un envoi." }, { status: 413 });
    const recipients = new Map<string, string>();
    for (const document of snapshot.docs) {
      const email = document.get("email");
      if (typeof email !== "string") continue;
      const normalized = email.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
        recipients.set(normalized, String(document.get("nom") || "").slice(0, 200));
    }
    if (!recipients.size)
      return Response.json(
        { error: "Aucun journaliste avec une adresse valide." },
        { status: 400 },
      );

    const claimed = await pressDb.runTransaction(async (transaction) => {
      const [release, mail] = await transaction.getAll(releaseRef, mailRef);
      if (!release.exists) return "missing";
      if (release.get("mailId") || mail.exists) return "already-sent";
      const content = pressReleaseSchema.safeParse({
        title: release.get("title"),
        body: release.get("body"),
        date: release.get("date"),
      });
      if (!content.success) return "invalid";
      transaction.create(mailRef, {
        subject: content.data.title,
        html: pressBodyToHtml(content.data.body),
        target: "journalistes",
        pressReleaseId: releaseId,
        recipientCount: recipients.size,
        pendingCount: recipients.size,
        sentCount: 0,
        failedCount: 0,
        status: "preparing",
        createdByUid: staff.uid,
        createdByEmail: staff.email,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(releaseRef, { mailId: mailRef.id });
      return "claimed";
    });
    if (claimed !== "claimed")
      return Response.json(
        {
          error:
            claimed === "missing"
              ? "Communiqué introuvable."
              : claimed === "invalid"
                ? "Communiqué invalide."
                : "Ce communiqué a déjà un envoi en cours ou terminé.",
        },
        { status: claimed === "missing" ? 404 : 409 },
      );

    const entries = Array.from(recipients, ([email, name]) => ({ email, name, status: "pending" }));
    for (let offset = 0; offset < entries.length; offset += 400) {
      const batch = pressDb.batch();
      for (const recipient of entries.slice(offset, offset + 400))
        batch.create(mailRef.collection("recipients").doc(), recipient);
      await batch.commit();
    }
    await mailRef.update({ status: "pending", queuedAt: FieldValue.serverTimestamp() });
    return Response.json({ mailId: mailRef.id, recipientCount: recipients.size }, { status: 202 });
  } catch (error) {
    console.error("Envoi presse impossible", error);
    return Response.json(
      {
        error:
          "Impossible de placer le communiqué dans la file d'envoi. Vérifiez son état avant de réessayer.",
      },
      { status: 500 },
    );
  }
}
