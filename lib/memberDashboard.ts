export const MEMBER_TEAM_ROLE_LABELS = [
  ["admin", "Administration"],
  ["gestionnaire", "Gestion des rôles"],
  ["tresorier", "Trésorerie"],
  ["redacteur", "Rédaction"],
  ["mail", "E-mailing"],
  ["faq", "FAQ"],
  ["presse", "Presse"],
  ["tractation", "Tractation"],
] as const;

const FINISHED_ACTION_STATUSES = new Set(["realisee", "suspendue"]);

export type DashboardMeeting = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  status: string;
  deleted: boolean;
};

export type DashboardCampaign = {
  id: string;
  title: string;
  joined: boolean;
};

export function buildMemberDashboardSummary(input: {
  meetings: DashboardMeeting[];
  campaigns: DashboardCampaign[];
  moreCampaigns: boolean;
  pendingExpenseCount: number;
  morePendingExpenses: boolean;
  actions: Array<{ status: string; deleted: boolean }>;
  moreActiveActions: boolean;
  roles: string[];
}, now = Date.now()) {
  const nextMeeting = input.meetings
    .filter((meeting) => {
      const startsAt = Date.parse(meeting.startsAt);
      return meeting.status === "published" && !meeting.deleted && Number.isFinite(startsAt) && startsAt >= now;
    })
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))[0] || null;

  const teamRoles = MEMBER_TEAM_ROLE_LABELS
    .filter(([key]) => input.roles.includes(key))
    .map(([key, label]) => ({ key, label }));

  return {
    nextMeeting,
    campaigns: input.campaigns.slice(0, 3),
    moreCampaigns: input.moreCampaigns || input.campaigns.length > 3,
    pendingExpenseCount: Math.max(0, input.pendingExpenseCount),
    morePendingExpenses: input.morePendingExpenses,
    activeActionCount: input.actions.filter(
      (action) => !action.deleted && !FINISHED_ACTION_STATUSES.has(action.status),
    ).length,
    moreActiveActions: input.moreActiveActions,
    teamRoles,
  };
}