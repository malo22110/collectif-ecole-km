import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";
import {
  memberSkillsProfileSchema,
  type MemberSkillsProfile,
} from "@/lib/memberSkills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SKILLS_COLLECTION = "memberSkillsDirectory";
const MAX_DIRECTORY_PROFILES = 250;
const MAX_REQUEST_BYTES = 16 * 1024;

type StoredProfile = MemberSkillsProfile & {
  ownerEmail: string;
  updatedAt?: FirebaseFirestore.Timestamp;
};

async function getOwnerEmail(uid: string) {
  const authUser = await adminAuth.getUser(uid);
  if (!authUser.email) throw new Error("Adresse e-mail absente du compte.");
  return authUser.email;
}

async function readJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new Error("Le profil dépasse la taille maximale autorisée.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("Le format de requête doit être JSON.");
  }
  if (!request.body) throw new Error("Le profil est vide.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error("Le profil dépasse la taille maximale autorisée.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")) as unknown;
  } catch {
    throw new Error("Le profil JSON est invalide.");
  }
}

function defaultProfile(): MemberSkillsProfile {
  return {
    skills: [],
    availability: "selon_projet",
    profession: "",
    summary: "",
    directoryVisible: false,
    shareContact: false,
  };
}

function safeProfile(data: FirebaseFirestore.DocumentData | undefined): MemberSkillsProfile {
  if (!data) return defaultProfile();
  const parsed = memberSkillsProfileSchema.safeParse({
    skills: data.skills,
    availability: data.availability,
    profession: data.profession,
    summary: data.summary,
    directoryVisible: data.directoryVisible,
    shareContact: data.shareContact,
  });
  return parsed.success ? parsed.data : defaultProfile();
}

function publicId(uid: string) {
  return createHash("sha256").update(uid).digest("hex").slice(0, 20);
}

async function buildDirectoryResponse(uid: string) {
  const [ownSnapshot, directorySnapshot] = await Promise.all([
    adminDb.collection(SKILLS_COLLECTION).doc(uid).get(),
    adminDb
      .collection(SKILLS_COLLECTION)
      .where("directoryVisible", "==", true)
      .limit(MAX_DIRECTORY_PROFILES)
      .get(),
  ]);

  const directoryDocs = directorySnapshot.docs;
  const memberSnapshots = directoryDocs.length
    ? await adminDb.getAll(
        ...directoryDocs.map((document) => {
          const ownerEmail = document.get("ownerEmail");
          return typeof ownerEmail === "string"
            ? adminDb.collection("membres").doc(ownerEmail)
            : adminDb.collection("membres").doc("__missing_member__");
        }),
      )
    : [];

  const people = directoryDocs.flatMap((document, index) => {
    const member = memberSnapshots[index];
    const stored = document.data() as StoredProfile;
    const profile = safeProfile(stored);
    if (!member?.exists || member.get("status") !== "validated" || !profile.directoryVisible) {
      return [];
    }
    const displayName = [member.get("prenom"), member.get("nom")]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" ");
    if (!displayName || profile.skills.length === 0) return [];
    return [
      {
        id: publicId(document.id),
        displayName,
        skills: profile.skills,
        availability: profile.availability,
        profession: profile.profession,
        summary: profile.summary,
        ...(profile.shareContact && typeof stored.ownerEmail === "string"
          ? { contactEmail: stored.ownerEmail }
          : {}),
      },
    ];
  });

  people.sort((left, right) => left.displayName.localeCompare(right.displayName, "fr"));
  return {
    profile: safeProfile(ownSnapshot.data()),
    people,
    directoryTruncated: directorySnapshot.size === MAX_DIRECTORY_PROFILES,
  };
}

// [SPEC-MEMBER-SKILLS-02] Directory responses are bounded and re-check current validated membership before publishing.
export async function GET(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    return NextResponse.json(
      await buildDirectoryResponse(access.uid),
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur lors du chargement de l’annuaire de compétences:", error);
    return NextResponse.json(
      { error: "Impossible de charger l’annuaire de compétences." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}

// [SPEC-MEMBER-SKILLS-03] Members may update only their own bounded skills profile through this server API.
export async function PUT(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide.";
    const status = message.includes("taille maximale") ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const parsed = memberSkillsProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vérifiez les compétences, la disponibilité et vos choix de visibilité." },
      { status: 400 },
    );
  }

  try {
    const email = await getOwnerEmail(access.uid);
    const memberSnapshot = await adminDb.collection("membres").doc(email).get();
    if (!memberSnapshot.exists || memberSnapshot.get("status") !== "validated") {
      return NextResponse.json({ error: "Accès réservé aux membres validés." }, { status: 403 });
    }

    const profileRef = adminDb.collection(SKILLS_COLLECTION).doc(access.uid);
    await profileRef.set(
      {
        ...parsed.data,
        ownerEmail: email,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: false },
    );

    return NextResponse.json(
      await buildDirectoryResponse(access.uid),
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Erreur lors de l’enregistrement du profil de compétences:", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer votre profil de compétences." },
      { status: 500 },
    );
  }
}