import test from "node:test";
import assert from "node:assert/strict";
import { buildMemberDashboardSummary } from "../lib/memberDashboard.ts";

// [SPEC-DASHBOARD-02] Dashboard summaries contain only current meetings, active work and active teams.
test("choisit la réunion publiée à venir la plus proche", () => {
  const now = Date.parse("2026-10-10T12:00:00Z");
  const summary = buildMemberDashboardSummary({
    meetings: [
      { id: "past", title: "Passée", startsAt: "2026-10-01T12:00:00Z", location: "", status: "published", deleted: false },
      { id: "draft", title: "Brouillon", startsAt: "2026-10-12T12:00:00Z", location: "", status: "draft", deleted: false },
      { id: "deleted", title: "Retirée", startsAt: "2026-10-13T12:00:00Z", location: "", status: "published", deleted: true },
      { id: "later", title: "Plus tard", startsAt: "2026-10-20T12:00:00Z", location: "", status: "published", deleted: false },
      { id: "next", title: "Prochaine", startsAt: "2026-10-12T12:00:00Z", location: "Salle", status: "published", deleted: false },
    ],
    campaigns: [],
    moreCampaigns: false,
    pendingExpenseCount: 0,
    morePendingExpenses: false,
    actions: [],
    moreActiveActions: false,
    roles: [],
  }, now);

  assert.equal(summary.nextMeeting?.id, "next");
});

test("borne les compteurs et exclut les rôles système ou archivés des équipes", () => {
  const summary = buildMemberDashboardSummary({
    meetings: [],
    campaigns: [
      { id: "1", title: "A", joined: true },
      { id: "2", title: "B", joined: false },
      { id: "3", title: "C", joined: false },
      { id: "4", title: "D", joined: false },
    ],
    moreCampaigns: true,
    pendingExpenseCount: 50,
    morePendingExpenses: true,
    actions: [
      { status: "proposition", deleted: false },
      { status: "realisee", deleted: false },
      { status: "a_etudier", deleted: true },
    ],
    moreActiveActions: false,
    roles: ["membre", "correcteur", "tractation", "tresorier"],
  });

  assert.deepEqual(summary.campaigns.map((campaign) => campaign.id), ["1", "2", "3"]);
  assert.equal(summary.moreCampaigns, true);
  assert.equal(summary.pendingExpenseCount, 50);
  assert.equal(summary.morePendingExpenses, true);
  assert.equal(summary.activeActionCount, 1);
  assert.deepEqual(summary.teamRoles.map((role) => role.key), ["tresorier", "tractation"]);
});