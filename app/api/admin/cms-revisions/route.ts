import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
  buildCmsRevisionSnapshot,
  buildVersionedCmsPageData,
  buildVersionedHomeActionPlanData,
  type CmsPageData,
} from "@/lib/cmsRevisionModel";
import { homeActionPlanDraftSchema } from "@/lib/homeActionPlanSchema";

export const dynamic = "force-dynamic";

const PAGE_ID = "historique";
const MAX_BODY_BYTES = 900_000;
const PAGE_SIZE = 20;
const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);

const publishSchema = z
  .object({
    data: z.record(z.string(), z.unknown()),
    origin: z.enum(["visual", "expert", "draft"]),
    scope: z.literal("homeActionPlan").optional(),
  })
  .strict();
const restoreSchema = z
  .object({
    revisionId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  })
  .strict();

class RevisionOperationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function authorizeAdmin(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token)
    return {
      response: NextResponse.json({ error: "Authentification requise." }, { status: 401 }),
    };

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return {
      response: NextResponse.json({ error: "Session invalide." }, { status: 401 }),
    };
  }
  if (!decodedToken.email)
    return {
      response: NextResponse.json({ error: "Adresse e-mail absente du compte." }, { status: 401 }),
    };

  const member = await adminDb.collection("membres").doc(decodedToken.email).get();
  const memberData = member.data();
  const roles = Array.isArray(memberData?.roles)
    ? memberData.roles
    : memberData?.role
      ? [memberData.role]
      : [];
  if (
    !ADMIN_EMAILS.has(decodedToken.email.toLowerCase()) &&
    (!member.exists || !roles.includes("admin"))
  ) {
    return {
      response: NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 }),
    };
  }
  return { admin: { email: decodedToken.email } };
}

async function readJsonBody(
  request: Request,
): Promise<{ body: unknown } | { response: NextResponse }> {
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return {
      response: NextResponse.json({ error: "Format de requête invalide." }, { status: 415 }),
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return {
      response: NextResponse.json(
        { error: "Le document dépasse la taille autorisée." },
        { status: 413 },
      ),
    };
  }

  const reader = request.body?.getReader();
  if (!reader)
    return {
      response: NextResponse.json({ error: "Corps de requête manquant." }, { status: 400 }),
    };
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return {
        response: NextResponse.json(
          { error: "Le document dépasse la taille autorisée." },
          { status: 413 },
        ),
      };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { body: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return {
      response: NextResponse.json({ error: "JSON invalide." }, { status: 400 }),
    };
  }
}

function isCmsPageData(value: unknown): value is CmsPageData {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function GET(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.admin) return authorization.response;

  try {
    const pageRef = adminDb.collection("pages").doc(PAGE_ID);
    const revisionsRef = pageRef.collection("revisions");
    const cursor = new URL(request.url).searchParams.get("cursor");
    let query = revisionsRef.orderBy("createdAt", "desc").limit(PAGE_SIZE + 1);
    if (cursor) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(cursor)) {
        return NextResponse.json({ error: "Curseur invalide." }, { status: 400 });
      }
      const cursorSnapshot = await revisionsRef.doc(cursor).get();
      if (!cursorSnapshot.exists)
        return NextResponse.json({ error: "Curseur introuvable." }, { status: 400 });
      query = query.startAfter(cursorSnapshot);
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const revisions = snapshot.docs.slice(0, PAGE_SIZE).map((revision) => {
      const data = revision.data();
      return {
        id: revision.id,
        version: typeof data.version === "number" ? data.version : 0,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        changedBy: typeof data.changedBy === "string" ? data.changedBy : "",
        origin: data.origin,
      };
    });

    return NextResponse.json(
      {
        revisions,
        nextCursor: hasMore ? snapshot.docs[PAGE_SIZE - 1].id : null,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur lors du chargement des révisions CMS:", error);
    return NextResponse.json({ error: "Impossible de charger les révisions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.admin) return authorization.response;

  const parsedBody = await readJsonBody(request);
  if ("response" in parsedBody) return parsedBody.response;
  const parsed = publishSchema.safeParse(parsedBody.body);
  if (!parsed.success)
    return NextResponse.json({ error: "Document ou origine invalide." }, { status: 400 });

  let scopedPlan: z.infer<typeof homeActionPlanDraftSchema> | null = null;
  if (parsed.data.scope) {
    if (parsed.data.origin !== "draft") {
      return NextResponse.json(
        { error: "Cette portée est réservée aux brouillons." },
        { status: 400 },
      );
    }
    const plan = homeActionPlanDraftSchema.safeParse(parsed.data.data);
    if (!plan.success) {
      return NextResponse.json(
        { error: "Le plan d’action proposé est invalide." },
        { status: 400 },
      );
    }
    scopedPlan = plan.data;
  }

  try {
    const pageRef = adminDb.collection("pages").doc(PAGE_ID);
    const revisionRef = pageRef.collection("revisions").doc();
    const version = await adminDb.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(pageRef);
      if (!currentSnapshot.exists)
        throw new RevisionOperationError("Document fiscal introuvable.", 404);

      const currentData = currentSnapshot.data() as CmsPageData;
      const nextData = scopedPlan
        ? buildVersionedHomeActionPlanData(currentData, scopedPlan)
        : buildVersionedCmsPageData(currentData, parsed.data.data);
      transaction.create(revisionRef, {
        ...buildCmsRevisionSnapshot(currentData, authorization.admin.email, parsed.data.origin),
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(pageRef, nextData);
      return nextData.version as number;
    });
    return NextResponse.json({ version });
  } catch (error) {
    if (error instanceof RevisionOperationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur lors de la sauvegarde du document fiscal:", error);
    return NextResponse.json({ error: "Impossible de sauvegarder le document." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.admin) return authorization.response;

  const parsedBody = await readJsonBody(request);
  if ("response" in parsedBody) return parsedBody.response;
  const parsed = restoreSchema.safeParse(parsedBody.body);
  if (!parsed.success) return NextResponse.json({ error: "Révision invalide." }, { status: 400 });

  try {
    const pageRef = adminDb.collection("pages").doc(PAGE_ID);
    const revisionsRef = pageRef.collection("revisions");
    const selectedRevisionRef = revisionsRef.doc(parsed.data.revisionId);
    const backupRef = revisionsRef.doc();
    const version = await adminDb.runTransaction(async (transaction) => {
      const [currentSnapshot, selectedRevision] = await Promise.all([
        transaction.get(pageRef),
        transaction.get(selectedRevisionRef),
      ]);
      if (!currentSnapshot.exists)
        throw new RevisionOperationError("Document fiscal introuvable.", 404);
      if (!selectedRevision.exists) throw new RevisionOperationError("Révision introuvable.", 404);

      const currentData = currentSnapshot.data() as CmsPageData;
      const selectedData = selectedRevision.get("data");
      if (!isCmsPageData(selectedData))
        throw new RevisionOperationError("Cette révision est invalide.", 409);

      const nextData = buildVersionedCmsPageData(currentData, selectedData);
      transaction.create(backupRef, {
        ...buildCmsRevisionSnapshot(currentData, authorization.admin.email, "restore"),
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(pageRef, nextData);
      return nextData.version as number;
    });
    return NextResponse.json({ version });
  } catch (error) {
    if (error instanceof RevisionOperationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erreur lors de la restauration du document fiscal:", error);
    return NextResponse.json({ error: "Impossible de restaurer cette révision." }, { status: 500 });
  }
}
