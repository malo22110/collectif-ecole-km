import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { isPotentialPetitionDuplicate, type PetitionIdentity } from "@/lib/petitionDuplicates";
import { formatPaperSignatureEmail } from "@/lib/paperSignature";

export const dynamic = "force-dynamic";

const entrySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  ville: z.string().trim().max(120),
  qualite: z.string().trim().max(160),
  confidence: z.number().min(0).max(100)
}).strict();

const requestSchema = z.object({
  action: z.enum(["review", "import"]),
  entries: z.array(entrySchema).min(1).max(60)
}).strict();

async function readJsonBody(request: Request): Promise<{ value?: unknown; tooLarge: boolean }> {
  const reader = request.body?.getReader();
  if (!reader) return { tooLarge: false };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > 128_000) {
      await reader.cancel();
      return { tooLarge: true };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(body)), tooLarge: false };
  } catch {
    return { tooLarge: false };
  }
}

type ExistingSigner = PetitionIdentity & {
  id: string;
  source: string;
};

function getIdentity(fullName: string, ville: string): PetitionIdentity {
  return {
    fullName: fullName.trim(),
    ville: /^km$/i.test(ville.trim()) ? "Kergrist-Moëlou" : ville.trim()
  };
}

async function verifyMember(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: NextResponse.json({ error: "Authentification requise." }, { status: 401 }) };

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token, true);
  } catch {
    return { error: NextResponse.json({ error: "Session invalide." }, { status: 401 }) };
  }

  if (!decodedToken.email) {
    return { error: NextResponse.json({ error: "Adresse e-mail absente du compte." }, { status: 401 }) };
  }

  const memberSnapshot = await adminDb.collection("membres").doc(decodedToken.email).get();
  const memberData = memberSnapshot.data();
  const roles = Array.isArray(memberData?.roles)
    ? memberData.roles
    : memberData?.role
      ? [memberData.role]
      : [];
  const isValidatedMember = memberSnapshot.exists && memberData?.status === "validated";

  if (!isValidatedMember && !roles.includes("admin")) {
    return { error: NextResponse.json({ error: "Accès réservé aux membres validés." }, { status: 403 }) };
  }

  const memberName = [memberData?.prenom, memberData?.nom]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");

  return {
    uid: decodedToken.uid,
    memberName: memberName || (typeof decodedToken.name === "string" ? decodedToken.name : "")
  };
}

async function loadExistingSigners(): Promise<ExistingSigner[] | null> {
  const snapshot = await adminDb.collection("signatures")
    .select("prenom", "nom", "ville", "source")
    .limit(5001)
    .get();

  if (snapshot.size > 5000) return null;

  return snapshot.docs.map(document => {
    const data = document.data();
    return {
      id: document.id,
      fullName: [data.prenom, data.nom].filter(Boolean).join(" "),
      ville: String(data.ville || ""),
      source: data.source === "papier" ? "papier" : "en ligne"
    };
  });
}

export async function POST(request: Request) {
  // [SPEC-PET-SCAN-01] La photo reste locale; seuls les champs révisés sont envoyés pour aperçu ou import.
  try {
    if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Format de requête invalide." }, { status: 415 });
    }

    const authorization = await verifyMember(request);
    if ("error" in authorization) return authorization.error;

    const body = await readJsonBody(request);
    if (body.tooLarge) {
      return NextResponse.json({ error: "Le lot dépasse la taille autorisée." }, { status: 413 });
    }

    const parsed = requestSchema.safeParse(body.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Vérifiez les champs de chaque ligne (nom, commune et lien)." }, { status: 400 });
    }

    const entries = parsed.data.entries.map(entry => ({
      ...entry,
      ...getIdentity(entry.fullName, entry.ville)
    }));
    const existingSigners = await loadExistingSigners();
    if (!existingSigners) {
      return NextResponse.json({ error: "La liste est trop volumineuse pour vérifier les doublons. Contactez un administrateur." }, { status: 503 });
    }

    if (parsed.data.action === "review") {
      const matches = entries.map((entry, entryIndex) => {
        const existingMatches = existingSigners
          .filter(signer => isPotentialPetitionDuplicate(entry, signer))
          .map(signer => ({ fullName: signer.fullName, ville: signer.ville, source: signer.source }));
        const sameBatchMatches = entries
          .filter((other, otherIndex) => otherIndex !== entryIndex && isPotentialPetitionDuplicate(entry, other))
          .map(other => ({ fullName: other.fullName, ville: other.ville, source: "même lot" }));

        return { entryIndex, candidates: [...existingMatches, ...sameBatchMatches].slice(0, 8) };
      }).filter(match => match.candidates.length > 0);

      return NextResponse.json({ matches }, {
        headers: { "Cache-Control": "private, no-store, max-age=0" }
      });
    }

    const signatures = adminDb.collection("signatures");
    const references = entries.map(() => signatures.doc());
    const importBatchId = adminDb.collection("signatureImports").doc().id;
    const batch = adminDb.batch();
    let potentialDuplicateCount = 0;

    entries.forEach((entry, index) => {
      const existingMatches = existingSigners
        .filter(signer => isPotentialPetitionDuplicate(entry, signer))
        .map(signer => signer.id);
      const sameBatchMatches = entries
        .map((other, otherIndex) => ({ other, otherIndex }))
        .filter(({ other, otherIndex }) => otherIndex !== index && isPotentialPetitionDuplicate(entry, other))
        .map(({ otherIndex }) => references[otherIndex].id);
      const duplicateCandidates = Array.from(new Set([...existingMatches, ...sameBatchMatches])).slice(0, 20);
      const potentialDuplicate = duplicateCandidates.length > 0;
      if (potentialDuplicate) potentialDuplicateCount++;

      batch.set(references[index], {
        prenom: entry.fullName,
        nom: "",
        email: formatPaperSignatureEmail(authorization.memberName),
        ville: entry.ville,
        qualite: entry.qualite,
        source: "papier",
        scanBatchId: importBatchId,
        scanConfidence: entry.confidence,
        potentialDuplicate,
        potentialDuplicateCandidates: duplicateCandidates,
        createdBy: authorization.uid,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    return NextResponse.json({
      importedCount: entries.length,
      potentialDuplicateCount,
      importBatchId
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" }
    });
  } catch (error) {
    console.error("Erreur lors de l'import des signatures papier:", error);
    return NextResponse.json({ error: "Impossible de traiter ce lot de signatures." }, { status: 500 });
  }
}