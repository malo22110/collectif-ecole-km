import { FieldValue } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";
import { reimbursementInputSchema } from "@/lib/treasuryModel";
import {
  authorizeTreasuryMember,
  reimbursementRequestsRef,
  treasuryConfigRef,
  treasuryBucket,
  treasuryErrorResponse,
  readTreasuryBody,
  TreasuryRouteError,
} from "@/lib/treasuryServer";
import {
  detectSupportedUploadType,
  MAX_ARTICLE_ATTACHMENT_BYTES,
  sanitizeUploadFileName,
} from "@/lib/uploadValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FORM_BYTES = MAX_ARTICLE_ATTACHMENT_BYTES + 64 * 1024;

function matchesExistingRequest(
  data: FirebaseFirestore.DocumentData,
  memberUid: string,
  input: {
    amountCents: number;
    publicLabel: string;
    description: string;
    occurredOn: string;
    receiptSha256: string;
  },
) {
  const receipt = data.receipt && typeof data.receipt === "object" ? data.receipt : {};
  return (
    data.submittedByUid === memberUid &&
    data.amountCents === input.amountCents &&
    data.publicLabel === input.publicLabel &&
    data.description === input.description &&
    data.occurredOn === input.occurredOn &&
    receipt.sha256 === input.receiptSha256
  );
}

function serializeRequest(document: FirebaseFirestore.QueryDocumentSnapshot, includeMember: boolean) {
  const data = document.data();
  const receipt = data.receipt && typeof data.receipt === "object" ? data.receipt : {};
  const createdAtMillis =
    data.createdAt && typeof data.createdAt.toMillis === "function" ? data.createdAt.toMillis() : null;
  return {
    id: document.id,
    amountCents: data.amountCents,
    publicLabel: data.publicLabel,
    description: data.description,
    occurredOn: data.occurredOn,
    status: data.status,
    rejectionReason: data.rejectionReason || null,
    paidOn: data.paidOn || null,
    createdAtMillis,
    receiptAvailable: typeof receipt.storagePath === "string",
    receiptFileName: typeof receipt.fileName === "string" ? receipt.fileName : null,
    ...(includeMember
      ? {
          submittedByName: data.submittedByName || "Membre",
          submittedByEmail: data.submittedByEmail || "",
        }
      : {}),
  };
}

// [SPEC-TREASURY-05] Members see only their requests; admins get a bounded review queue.
export async function GET(request: Request) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;

  try {
    const requestsQuery = authorization.member.canManageTreasury
      ? reimbursementRequestsRef.orderBy("createdAt", "desc").limit(100)
      : reimbursementRequestsRef
          .where("submittedByUid", "==", authorization.member.uid)
          .orderBy("createdAt", "desc")
          .limit(50);
    const [requestsSnapshot, summarySnapshot] = await Promise.all([
      requestsQuery.get(),
      treasuryConfigRef.get(),
    ]);
    const summary = summarySnapshot.data();
    return Response.json(
      {
        canManage: authorization.member.canManageTreasury,
        initialized: summary?.initialized === true,
        balanceCents:
          (Number(summary?.openingBalanceCents) || 0) +
          (Number(summary?.contributionsCents) || 0) -
          (Number(summary?.expensesCents) || 0),
        requests: requestsSnapshot.docs.map((document) =>
          serializeRequest(document, authorization.member.canManageTreasury),
        ),
        truncated: authorization.member.canManageTreasury && requestsSnapshot.size === 100,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible de charger les demandes de remboursement.");
  }
}

// [SPEC-TREASURY-06] A validated member submits a bounded request with a verified private receipt.
export async function POST(request: Request) {
  const authorization = await authorizeTreasuryMember(request);
  if (!authorization.member) return authorization.response;

  try {
    const multipartType = request.headers.get("content-type") || "";
    if (!multipartType.toLowerCase().startsWith("multipart/form-data;")) {
      throw new TreasuryRouteError(415, "Le formulaire et son justificatif sont requis.");
    }

    const body = await readTreasuryBody(request, MAX_FORM_BYTES);
    let formData: FormData;
    try {
      formData = await new Request("http://localhost/api/treasury/requests", {
        method: "POST",
        headers: { "Content-Type": multipartType },
        body: new Uint8Array(body),
      }).formData();
    } catch {
      throw new TreasuryRouteError(400, "Le formulaire de remboursement est invalide.");
    }

    const parsed = reimbursementInputSchema.safeParse({
      submissionId: formData.get("submissionId"),
      amountCents: Number(formData.get("amountCents")),
      publicLabel: formData.get("publicLabel"),
      description: formData.get("description"),
      occurredOn: formData.get("occurredOn"),
    });
    if (!parsed.success) {
      throw new TreasuryRouteError(400, "Vérifiez le montant, la date et les libellés saisis.");
    }
    const { amountCents, description, occurredOn, publicLabel, submissionId } = parsed.data;
    const requestRef = reimbursementRequestsRef.doc(submissionId);
    const receiptValue = formData.get("receipt");
    if (!(receiptValue instanceof File) || receiptValue.size < 1) {
      throw new TreasuryRouteError(400, "Ajoutez une facture ou un ticket de caisse.");
    }
    if (receiptValue.size > MAX_ARTICLE_ATTACHMENT_BYTES) {
      throw new TreasuryRouteError(413, "Le justificatif ne doit pas dépasser 10 Mio.");
    }

    const receiptBytes = Buffer.from(await receiptValue.arrayBuffer());
    const detectedType = detectSupportedUploadType(receiptBytes);
    if (!detectedType || (receiptValue.type && receiptValue.type !== detectedType.contentType)) {
      throw new TreasuryRouteError(415, "Utilisez un PDF ou une image JPEG, PNG ou WebP valide.");
    }
    const receiptSha256 = createHash("sha256").update(receiptBytes).digest("hex");
    const requestSignature = { ...parsed.data, receiptSha256 };
    const existingRequest = await requestRef.get();
    if (existingRequest.exists) {
      if (!matchesExistingRequest(existingRequest.data()!, authorization.member.uid, requestSignature)) {
        throw new TreasuryRouteError(409, "Cette clé d’envoi a déjà été utilisée.");
      }
      return Response.json({ ok: true, id: requestRef.id, alreadySubmitted: true });
    }

    const storagePath = `treasury/receipts/${requestRef.id}/${randomUUID()}.${detectedType.extension}`;
    const file = treasuryBucket.file(storagePath);
    const fileName = sanitizeUploadFileName(receiptValue.name || "justificatif");

    await file.save(receiptBytes, {
      resumable: false,
      metadata: {
        contentType: detectedType.contentType,
        cacheControl: "private, no-store",
        metadata: { requestId: requestRef.id, uploadedByUid: authorization.member.uid },
      },
    });

    try {
      await requestRef.create({
        amountCents,
        publicLabel,
        description,
        occurredOn,
        status: "pending",
        submittedByUid: authorization.member.uid,
        submittedByEmail: authorization.member.email,
        submittedByName: authorization.member.displayName,
        receipt: {
          fileName,
          contentType: detectedType.contentType,
          size: receiptBytes.byteLength,
          sha256: receiptSha256,
          storagePath,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      await file.delete({ ignoreNotFound: true }).catch(() => undefined);
      const concurrentRequest = await requestRef.get().catch(() => null);
      if (
        concurrentRequest?.exists &&
        matchesExistingRequest(concurrentRequest.data()!, authorization.member.uid, requestSignature)
      ) {
        return Response.json({ ok: true, id: requestRef.id, alreadySubmitted: true });
      }
      throw error;
    }

    return Response.json({ ok: true, id: requestRef.id }, { status: 201 });
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible d’envoyer la demande de remboursement.");
  }
}