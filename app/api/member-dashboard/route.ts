import { adminDb } from "@/lib/firebaseAdmin";
import { authorizeActionBoardMember } from "@/lib/actionBoardServer";
import { tractationDb } from "@/lib/tractationServer";
import { buildMemberDashboardSummary } from "@/lib/memberDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CAMPAIGNS = 3;
const MAX_PENDING_EXPENSES = 50;
const MAX_ACTIVE_ACTIONS = 100;
const ACTIVE_ACTION_STATUSES = [
  "proposition",
  "a_etudier",
  "a_discuter_commune",
  "transmise_commune",
  "attente_retour",
];

type Settled<T> = { ok: true; value: T } | { ok: false };

async function settle<T>(load: () => Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await load() };
  } catch {
    return { ok: false };
  }
}

// [SPEC-DASHBOARD-01] Return bounded, member-authorized summaries without loading the map or private request details.
export async function GET(request: Request) {
  const authorization = await authorizeActionBoardMember(request);
  if (!authorization.member) return authorization.response;

  const now = new Date();
  const meetingsQuery = adminDb
    .collection("memberMeetings")
    .where("status", "==", "published")
    .where("startsAt", ">=", now.toISOString())
    .orderBy("startsAt", "asc")
    .limit(20);
  const campaignsQuery = tractationDb
    .collection("tractationCampaigns")
    .where("status", "==", "active")
    .limit(MAX_CAMPAIGNS + 1);
  const expensesQuery = adminDb
    .collection("reimbursementRequests")
    .where("submittedByUid", "==", authorization.member.uid)
    .where("status", "==", "pending")
    .limit(MAX_PENDING_EXPENSES + 1);
  const actionsQuery = adminDb
    .collection("memberActionBoard")
    .where("status", "in", ACTIVE_ACTION_STATUSES)
    .limit(MAX_ACTIVE_ACTIONS + 1);

  const [meetingsResult, campaignsResult, expensesResult, actionsResult] = await Promise.all([
    settle(() => meetingsQuery.get()),
    settle(async () => {
      const snapshot = await campaignsQuery.get();
      const documents = snapshot.docs.slice(0, MAX_CAMPAIGNS);
      const campaigns = await Promise.all(documents.map(async (document) => {
        const participant = await document.ref
          .collection("participants")
          .doc(authorization.member!.uid)
          .get();
        return {
          id: document.id,
          title: String(document.get("title") || "Campagne de tractation"),
          joined: participant.exists,
        };
      }));
      return { campaigns, more: snapshot.size > MAX_CAMPAIGNS };
    }),
    settle(() => expensesQuery.get()),
    settle(() => actionsQuery.get()),
  ]);

  const meetingDocuments = meetingsResult.ok ? meetingsResult.value.docs : [];
  const campaignData = campaignsResult.ok ? campaignsResult.value : { campaigns: [], more: false };
  const expenseDocuments = expensesResult.ok ? expensesResult.value.docs : [];
  const actionDocuments = actionsResult.ok ? actionsResult.value.docs : [];

  const summary = buildMemberDashboardSummary(
    {
      meetings: meetingDocuments.map((document) => ({
        id: document.id,
        title: String(document.get("title") || "Réunion du collectif"),
        startsAt: String(document.get("startsAt") || ""),
        location: String(document.get("location") || ""),
        status: String(document.get("status") || ""),
        deleted: Boolean(document.get("deletedAt")),
      })),
      campaigns: campaignData.campaigns,
      moreCampaigns: campaignData.more,
      pendingExpenseCount: Math.min(expenseDocuments.length, MAX_PENDING_EXPENSES),
      morePendingExpenses: expenseDocuments.length > MAX_PENDING_EXPENSES,
      actions: actionDocuments.slice(0, MAX_ACTIVE_ACTIONS).map((document) => ({
        status: String(document.get("status") || ""),
        deleted: Boolean(document.get("deletedAt")),
      })),
      moreActiveActions: actionDocuments.length > MAX_ACTIVE_ACTIONS,
      roles: authorization.member.roles,
    },
    now.getTime(),
  );

  return Response.json(
    {
      ...summary,
      available: {
        meetings: meetingsResult.ok,
        campaigns: campaignsResult.ok,
        expenses: expensesResult.ok,
        actions: actionsResult.ok,
        teams: true,
      },
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}