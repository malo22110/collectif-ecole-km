import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import {
  authorizeMailInboxStaff,
  mailInboxDb,
  mailInboxErrorResponse,
  readMailInboxJsonBody,
} from "@/lib/mailInboxServer";
import {
  getPersonalTestRecipient,
  resolveMailRecipients,
  type MailAudience,
  type MailRecipientSource,
} from "@/lib/mailOutboxUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECIPIENTS = 1000;
const MAX_MEMBERS = 1000;
const targetSchema = z.enum([
  "all",
  "membres",
  "signataires",
  "membres_non_signataires",
  "journalistes",
  "individuel",
]);
const createMailSchema = z
  .object({
    subject: z.string().trim().min(1).max(240),
    html: z.string().min(1).max(30000),
    testMode: z.boolean(),
    target: targetSchema,
    recipientId: z.string().trim().min(1).max(200).optional(),
    scheduledAt: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.target === "individuel" && !data.recipientId) {
      context.addIssue({
        code: "custom",
        path: ["recipientId"],
        message: "Choisis un destinataire.",
      });
    }
  });

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function getRecipients(target: MailAudience, selectedId?: string) {
  const firestore = mailInboxDb;
  if (target === "individuel") {
    const member = selectedId ? await firestore.collection("membres").doc(selectedId).get() : null;
    const data = member?.data();
    const email = normalizeEmail(data?.email);
    if (!member?.exists || data?.status !== "validated" || data?.emailBounced === true || !email) {
      throw Object.assign(
        new Error("Le destinataire doit être un membre validé, joignable et non signalé en échec."),
        { status: 400 },
      );
    }
    return resolveMailRecipients("individuel", {
      members: [{ email, name: [data.prenom, data.nom].filter(Boolean).join(" ") }],
    });
  }

  const sources: {
    members: MailRecipientSource[];
    signers: MailRecipientSource[];
    journalists: MailRecipientSource[];
  } = { members: [], signers: [], journalists: [] };
  if (["all", "membres", "membres_non_signataires"].includes(target)) {
    const memberSnapshot = await firestore
      .collection("membres")
      .where("status", "==", "validated")
      .limit(MAX_MEMBERS + 1)
      .get();
    if (memberSnapshot.size > MAX_MEMBERS)
      throw Object.assign(new Error("Le nombre de membres dépasse la limite d’envoi."), {
        status: 413,
      });
    sources.members = memberSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        email: data.email || document.id,
        name: [data.prenom, data.nom].filter(Boolean).join(" "),
        emailBounced: data.emailBounced,
      };
    });
    if (target !== "membres") {
      const signatureSnapshot = await firestore
        .collection("signatures")
        .select("email", "prenom", "nom")
        .limit(MAX_RECIPIENTS + 1)
        .get();
      if (signatureSnapshot.size > MAX_RECIPIENTS)
        throw Object.assign(new Error("Le registre de signatures dépasse la limite de calcul."), {
          status: 413,
        });
      sources.signers = signatureSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          email: data.email || document.id,
          name: `${String(data.prenom || "")} ${String(data.nom || "")}`.trim(),
        };
      });
    }
  } else if (target === "signataires") {
    const snapshot = await firestore
      .collection("signatures")
      .select("email", "prenom", "nom")
      .limit(MAX_RECIPIENTS + 1)
      .get();
    if (snapshot.size > MAX_RECIPIENTS)
      throw Object.assign(new Error("Le nombre de signataires dépasse la limite d’envoi."), {
        status: 413,
      });
    sources.signers = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        email: data.email || document.id,
        name: `${String(data.prenom || "")} ${String(data.nom || "")}`.trim(),
      };
    });
  } else if (target === "journalistes") {
    const snapshot = await firestore
      .collection("journalistes")
      .select("email", "nom")
      .limit(MAX_RECIPIENTS + 1)
      .get();
    if (snapshot.size > MAX_RECIPIENTS)
      throw Object.assign(new Error("Le nombre de journalistes dépasse la limite d’envoi."), {
        status: 413,
      });
    sources.journalists = snapshot.docs.map((document) => {
      const data = document.data();
      return { email: data.email, name: data.nom };
    });
  }
  return resolveMailRecipients(target, sources);
}

export async function GET(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 25);
  const cursor = url.searchParams.get("cursor");
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    return Response.json({ error: "Limite invalide." }, { status: 400 });

  try {
    let query = mailInboxDb.collection("mailOutbox").orderBy("createdAt", "desc");
    if (cursor) {
      const cursorDocument = await mailInboxDb.collection("mailOutbox").doc(cursor).get();
      if (!cursorDocument.exists)
        return Response.json({ error: "Curseur invalide." }, { status: 400 });
      query = query.startAfter(cursorDocument);
    }
    const snapshot = await query.limit(limit + 1).get();
    const docs = snapshot.docs.slice(0, limit);
    const items = docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        subject: String(data.subject || "(sans objet)"),
        target: String(data.target || "all"),
        testMode: data.testMode === true,
        status: String(data.status || "pending"),
        createdAt: data.createdAt?.toDate?.().toISOString?.() || null,
        sentAt: data.sentAt?.toDate?.().toISOString?.() || null,
        sentCount: Number(data.sentCount || 0),
        failedCount: Number(data.failedCount || 0),
        recipientCount: Number(data.recipientCount || 0),
        recipientStatus: {
          pending: Number(data.pendingCount || 0),
          sent: Number(data.sentCount || 0),
          error: Number(data.failedCount || 0),
        },
      };
    });
    return Response.json(
      {
        items,
        nextCursor: snapshot.docs.length > limit ? docs.at(-1)?.id || null : null,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de charger les messages envoyés.");
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeMailInboxStaff(request);
  if (!authorization.staff) return authorization.response;
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json"))
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });

  try {
    const payload = createMailSchema.safeParse(await readMailInboxJsonBody(request, 40_000));
    if (!payload.success)
      return Response.json(
        { error: "Vérifie l’objet, le contenu et le destinataire." },
        { status: 400 },
      );
    const recipients = payload.data.testMode
      ? getPersonalTestRecipient(authorization.staff.email)
      : await getRecipients(payload.data.target, payload.data.recipientId);
    if (!recipients.length)
      return Response.json(
        { error: "Aucun destinataire éligible pour cette audience." },
        { status: 400 },
      );
    if (recipients.length > MAX_RECIPIENTS)
      return Response.json({ error: "Trop de destinataires pour un envoi." }, { status: 413 });

    const scheduledDate = payload.data.scheduledAt ? new Date(payload.data.scheduledAt) : null;
    const mailRef = mailInboxDb.collection("mailOutbox").doc();
    await mailRef.create({
      subject: payload.data.subject,
      html: payload.data.html,
      target: payload.data.target,
      testMode: payload.data.testMode,
      recipientCount: recipients.length,
      pendingCount: recipients.length,
      sentCount: 0,
      failedCount: 0,
      status: "preparing",
      ...(scheduledDate ? { scheduledAt: Timestamp.fromDate(scheduledDate) } : {}),
      createdByUid: authorization.staff.uid,
      createdByEmail: authorization.staff.email,
      createdAt: FieldValue.serverTimestamp(),
    });
    for (let offset = 0; offset < recipients.length; offset += 400) {
      const batch = mailInboxDb.batch();
      recipients.slice(offset, offset + 400).forEach((recipient) => {
        batch.create(mailRef.collection("recipients").doc(), recipient);
      });
      await batch.commit();
    }
    await mailRef.update({
      status: "pending",
      queuedAt: FieldValue.serverTimestamp(),
    });
    return Response.json(
      { id: mailRef.id, recipientCount: recipients.length, status: "pending" },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return mailInboxErrorResponse(error, "Impossible de placer cet e-mail dans la file d’envoi.");
  }
}
