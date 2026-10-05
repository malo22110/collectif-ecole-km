import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
  classifyPetitionAgreementMember,
  type ExistingPetitionEntry,
} from "@/lib/petitionAgreementEligibility";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = new Set([
  "lecam.malo@gmail.com",
  "contact@collectif-ecole-km.fr",
  "collectif.ecole.km@gmail.com",
]);
const MAX_MEMBERS = 1000;
const PETITION_CLOSED: boolean = true;
const requestSchema = z
  .object({
    emails: z
      .array(z.string().trim().email().max(320))
      .min(1)
      .max(100)
      .refine(
        (emails) => new Set(emails.map((email) => email.toLowerCase())).size === emails.length,
        "Les membres ne doivent pas être répétés.",
      ),
    confirmedConsent: z.literal(true),
  })
  .strict();

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
  const data = member.data();
  const roles = Array.isArray(data?.roles) ? data.roles : data?.role ? [data.role] : [];
  if (
    !ADMIN_EMAILS.has(decodedToken.email.toLowerCase()) &&
    (!member.exists || !roles.includes("admin"))
  ) {
    return {
      response: NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 }),
    };
  }
  return { admin: { uid: decodedToken.uid, email: decodedToken.email } };
}

export async function GET(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.admin) return authorization.response;

  try {
    const [membersSnapshot, signaturesSnapshot] = await Promise.all([
      adminDb
        .collection("membres")
        .where("status", "==", "validated")
        .limit(MAX_MEMBERS + 1)
        .get(),
      adminDb.collection("signatures").select("email", "source").limit(20001).get(),
    ]);
    if (membersSnapshot.size > MAX_MEMBERS) {
      return NextResponse.json(
        { error: "La liste dépasse la limite de chargement." },
        { status: 413 },
      );
    }
    if (signaturesSnapshot.size > 20000) {
      return NextResponse.json(
        { error: "La liste des signatures dépasse la limite de vérification." },
        { status: 413 },
      );
    }

    const existingOnlineSignatures = new Set(
      signaturesSnapshot.docs
        .filter((document) => document.data().source !== "accord_collectif")
        .map((document) =>
          String(document.data().email || document.id)
            .toLowerCase()
            .trim(),
        ),
    );
    const existingAgreements = new Set(
      signaturesSnapshot.docs
        .filter((document) => document.data().source === "accord_collectif")
        .map((document) =>
          String(document.data().email || document.id)
            .toLowerCase()
            .trim(),
        ),
    );

    let alreadySignedCount = 0;
    let hasAgreementCount = 0;
    let possiblePaperMatchCount = 0;
    const signatures: ExistingPetitionEntry[] = signaturesSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        email: String(data.email || document.id),
        source: String(data.source || "en ligne"),
        prenom: String(data.prenom || ""),
        nom: String(data.nom || ""),
        ville: String(data.ville || ""),
      };
    });

    const classifiedMembers = membersSnapshot.docs.flatMap((document) => {
      const data = document.data();
      const email = String(data.email || document.id)
        .trim()
        .toLowerCase();
      if (!z.string().email().safeParse(email).success) return [];
      const member = {
        email,
        prenom: String(data.prenom || ""),
        nom: String(data.nom || ""),
        ville: String(data.ville || data.commune || ""),
      };
      const eligibility = classifyPetitionAgreementMember(member, signatures);
      if (eligibility.isAlreadySigned || existingOnlineSignatures.has(email)) alreadySignedCount++;
      if (eligibility.hasAgreement || existingAgreements.has(email)) hasAgreementCount++;
      if (eligibility.hasPotentialPaperSignature) possiblePaperMatchCount++;
      return [
        {
          ...member,
          ...eligibility,
        },
      ];
    });
    const members = classifiedMembers
      .filter((member) => member.available)
      .sort(
        (first, second) =>
          first.nom.localeCompare(second.nom, "fr") ||
          first.prenom.localeCompare(second.prenom, "fr"),
      );

    return NextResponse.json(
      {
        members,
        summary: {
          validated: membersSnapshot.size,
          alreadySigned: alreadySignedCount,
          hasAgreement: hasAgreementCount,
          possiblePaperMatch: possiblePaperMatchCount,
          available: members.length,
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur lors du chargement des accords de pétition:", error);
    return NextResponse.json({ error: "Impossible de charger les membres." }, { status: 500 });
  }
}

// [SPEC-PET-AGREEMENT-01] Record only admin-confirmed collective assent, with an explicit non-signature provenance.
export async function POST(request: Request) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.admin) return authorization.response;
  // [SPEC-PET-CLOSE-01] Admin SDK bypasses Firestore rules: collective assent creation is closed too.
  if (PETITION_CLOSED)
    return NextResponse.json(
      {
        error: "La pétition est close : aucun nouvel accord ne peut être enregistré.",
      },
      { status: 410 },
    );
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Format de requête invalide." }, { status: 415 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 24_000) {
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 24_000)
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    let value: unknown;
    try {
      value = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }
    const parsed = requestSchema.safeParse(value);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Sélectionnez des membres et confirmez leur accord." },
        { status: 400 },
      );

    const emails = parsed.data.emails.map((email) => email.toLowerCase());
    const memberRefs = emails.map((email) => adminDb.collection("membres").doc(email));
    const signatureRefs = emails.map((email) => adminDb.collection("signatures").doc(email));
    const paperSignaturesSnapshot = await adminDb
      .collection("signatures")
      .where("source", "==", "papier")
      .select("prenom", "nom", "ville", "email", "source")
      .limit(5001)
      .get();
    if (paperSignaturesSnapshot.size > 5000) {
      return NextResponse.json(
        {
          error: "Trop de signatures papier pour vérifier sûrement les doublons.",
        },
        { status: 413 },
      );
    }
    const paperSignatures: ExistingPetitionEntry[] = paperSignaturesSnapshot.docs.map(
      (document) => {
        const data = document.data();
        return {
          email: String(data.email || document.id),
          source: "papier",
          prenom: String(data.prenom || ""),
          nom: String(data.nom || ""),
          ville: String(data.ville || ""),
        };
      },
    );
    const results = await adminDb.runTransaction(async (transaction) => {
      const memberSnapshots = await Promise.all(
        memberRefs.map((reference) => transaction.get(reference)),
      );
      const signatureSnapshots = await Promise.all(
        signatureRefs.map((reference) => transaction.get(reference)),
      );
      const invalidMember = memberSnapshots.find(
        (snapshot) => !snapshot.exists || snapshot.get("status") !== "validated",
      );
      if (invalidMember)
        throw Object.assign(new Error("Un ou plusieurs membres ne sont plus validés."), {
          status: 409,
        });

      const alreadySigned = signatureSnapshots.flatMap((snapshot, index) => {
        if (!snapshot.exists) return [];
        const source = snapshot.get("source");
        return source === "accord_collectif" ? [] : [emails[index]];
      });
      if (alreadySigned.length)
        throw Object.assign(new Error("Un ou plusieurs membres ont déjà signé individuellement."), {
          status: 409,
          emails: alreadySigned,
        });

      const alreadyRecorded: string[] = [];
      for (let index = 0; index < memberSnapshots.length; index++) {
        const memberSnapshot = memberSnapshots[index];
        const signatureSnapshot = signatureSnapshots[index];
        const email = emails[index];
        const member = memberSnapshot.data()!;
        const agreementEligibility = classifyPetitionAgreementMember(
          {
            email,
            prenom: String(member.prenom || ""),
            nom: String(member.nom || ""),
            ville: String(member.ville || member.commune || ""),
          },
          paperSignatures,
        );
        if (agreementEligibility.hasPotentialPaperSignature) {
          throw Object.assign(
            new Error(
              "Un membre sélectionné correspond peut-être à une signature papier. Vérifie la liste papier avant d’enregistrer son accord.",
            ),
            { status: 409 },
          );
        }
        if (signatureSnapshot.exists && signatureSnapshot.get("source") === "accord_collectif") {
          alreadyRecorded.push(email);
          continue;
        }
        transaction.create(signatureRefs[index], {
          prenom: String(member.prenom || ""),
          nom: String(member.nom || ""),
          email,
          ville: String(member.ville || member.commune || ""),
          qualite:
            "Membre du collectif — accord de principe à la pétition lors de la réunion fondatrice",
          source: "accord_collectif",
          consentBasis: "adhesion_collectif_reunion_fondatrice",
          potentialDuplicate: false,
          recordedByUid: authorization.admin!.uid,
          recordedByEmail: authorization.admin!.email,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      return {
        recorded: emails.filter((email) => !alreadyRecorded.includes(email)),
        alreadyRecorded,
      };
    });

    return NextResponse.json(results, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const message =
      error instanceof Error ? error.message : "Impossible d’enregistrer les accords.";
    if (status === 500)
      console.error("Erreur lors de l’enregistrement des accords de pétition:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
