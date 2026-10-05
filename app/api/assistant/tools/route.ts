import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyValidatedMember } from "@/lib/validatedMemberAccess";
import { searchCouncilMinutes } from "@/lib/assistantMinutes";
import { searchOfficialSources } from "@/lib/assistantOfficialSources";
import {
  extractPublishedArticleText,
  pickCmsBlocks,
  sanitizeStructuredCmsData,
} from "@/lib/assistantCmsContext";
import { isAssistantToolName } from "@/lib/assistantTools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;
const MAX_ARTICLES = 5;
const MAX_MINUTES_FILE_BYTES = 2 * 1024 * 1024;
const requestSchema = z
  .object({
    name: z.string().trim().min(1).max(64),
    args: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
const councilMinutesArgsSchema = z.object({ query: z.string().trim().min(2).max(180) }).strict();
const officialSourcesArgsSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .refine(
        (value) => !/@|https?:\/\/|www\.|(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}/i.test(value),
        "Ne transmettez aucune coordonnée personnelle.",
      ),
  })
  .strict();

async function readRequestJson(request: Request): Promise<unknown> {
  if (!request.body)
    throw Object.assign(new Error("Corps de requête manquant."), {
      status: 400,
    });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error("Appel d’outil trop volumineux."), {
        status: 413,
      });
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(
      Buffer.concat(
        chunks.map((chunk) => Buffer.from(chunk)),
        totalBytes,
      ).toString("utf8"),
    ) as unknown;
  } catch {
    throw Object.assign(new Error("Corps JSON invalide."), { status: 400 });
  }
}

function timestampToIso(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = (value.toDate as () => Date)();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return typeof value === "string" ? value.slice(0, 40) : null;
}

async function executeReadOnlyTool(name: string) {
  if (!isAssistantToolName(name))
    throw Object.assign(new Error("Outil assistant inconnu."), { status: 400 });

  if (name === "get_financial_ledger") {
    const snapshot = await adminDb.collection("pages").doc("historique").get();
    if (!snapshot.exists) return { source: "CMS /historique", found: false, blocks: [] };
    return {
      source: "CMS /historique",
      found: true,
      retrievedAt: new Date().toISOString(),
      data: pickCmsBlocks(
        snapshot.data(),
        ["financial_overview", "options_comparison", "timeline"],
        28000,
      ),
    };
  }

  if (name === "get_action_plan") {
    const snapshot = await adminDb.collection("pages").doc("historique").get();
    if (!snapshot.exists) return { source: "CMS /historique", found: false, blocks: [] };
    return {
      source: "CMS /historique",
      found: true,
      retrievedAt: new Date().toISOString(),
      data: pickCmsBlocks(snapshot.data(), ["timeline", "alert", "conclusion", "text"], 26000),
    };
  }

  if (name === "get_latest_articles") {
    const snapshot = await adminDb
      .collection("articles")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(MAX_ARTICLES)
      .select("title", "excerpt", "content", "publishedAt", "slug")
      .get();
    return {
      source: "CMS /actualites (articles publiés)",
      retrievedAt: new Date().toISOString(),
      articles: snapshot.docs.map((document) => {
        const article = document.data();
        return {
          title: String(article.title || "Article sans titre").slice(0, 240),
          publishedAt: timestampToIso(article.publishedAt),
          path: `/actualites/${String(article.slug || document.id).slice(0, 180)}`,
          content: extractPublishedArticleText(article, 4000),
        };
      }),
    };
  }

  if (name === "search_council_minutes" || name === "search_official_sources")
    throw new Error("Une requête de recherche est nécessaire.");

  const [petitionSnapshot, membersSnapshot] = await Promise.all([
    adminDb.collection("stats").doc("petition").get(),
    adminDb.collection("stats").doc("membres").get(),
  ]);
  const petition = petitionSnapshot.data();
  const members = membersSnapshot.data();
  return {
    source: "Statistiques publiques agrégées",
    retrievedAt: new Date().toISOString(),
    petition: petition
      ? sanitizeStructuredCmsData(
          {
            count: petition.count,
            breakdown: petition.breakdown,
            updatedAt: timestampToIso(petition.updatedAt),
          },
          4000,
        )
      : null,
    validatedMembers: members
      ? sanitizeStructuredCmsData(
          {
            count: members.count,
            updatedAt: timestampToIso(members.updatedAt),
          },
          1000,
        )
      : null,
  };
}

// [SPEC-ASSISTANT-CMS-02] Execute one allowlisted, read-only CMS tool per authenticated request; never expose signature documents.
export async function POST(request: Request) {
  const access = await verifyValidatedMember(request);
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Format de requête invalide." }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES)
    return Response.json({ error: "Appel d’outil trop volumineux." }, { status: 413 });

  try {
    const body = requestSchema.safeParse(await readRequestJson(request));
    if (!body.success) return Response.json({ error: "Appel d’outil invalide." }, { status: 400 });
    if (!isAssistantToolName(body.data.name))
      return Response.json({ error: "Cet outil n’est pas autorisé." }, { status: 400 });
    let result: unknown;
    if (body.data.name === "search_council_minutes") {
      const args = councilMinutesArgsSchema.safeParse(body.data.args);
      if (!args.success)
        return Response.json(
          {
            error: "La recherche dans les procès-verbaux doit contenir entre 2 et 180 caractères.",
          },
          { status: 400 },
        );
      const minutesPath = path.resolve(process.cwd(), "public/context.txt");
      const metadata = await stat(minutesPath);
      if (!metadata.isFile() || metadata.size > MAX_MINUTES_FILE_BYTES) {
        return Response.json(
          {
            error: "Le corpus des procès-verbaux dépasse la taille autorisée.",
          },
          { status: 503 },
        );
      }
      const corpus = await readFile(minutesPath, "utf8");
      result = searchCouncilMinutes(corpus, args.data.query);
    } else if (body.data.name === "search_official_sources") {
      const args = officialSourcesArgsSchema.safeParse(body.data.args);
      if (!args.success)
        return Response.json(
          {
            error: "La recherche institutionnelle doit contenir entre 3 et 120 caractères.",
          },
          { status: 400 },
        );
      result = await searchOfficialSources(args.data.query);
    } else {
      if (Object.keys(body.data.args || {}).length > 0)
        return Response.json({ error: "Cet outil n’accepte aucun argument." }, { status: 400 });
      result = await executeReadOnlyTool(body.data.name);
    }

    return Response.json(
      { result },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      const requestError = error as { status: number; message?: unknown };
      return Response.json(
        { error: String(requestError.message || "Appel d’outil invalide.") },
        { status: requestError.status },
      );
    }
    console.error("Échec d’exécution d’un outil CMS de l’assistant.", error);
    return Response.json(
      { error: "La source CMS demandée est temporairement indisponible." },
      { status: 503 },
    );
  }
}
