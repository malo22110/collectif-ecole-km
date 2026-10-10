import { z } from "zod";
import { canManageMemberEntity } from "./memberEntityAccess.ts";

export const ACTION_BOARD_PAGE_SIZE = 50;

export const ACTION_POLES = [
  "chantiers",
  "expertise",
  "projets_annexes",
  "financements",
] as const;

export const ACTION_POLE_LABELS: Record<(typeof ACTION_POLES)[number], string> = {
  chantiers: "Chantiers participatifs",
  expertise: "Expertise et mécénat",
  projets_annexes: "Projets annexes",
  financements: "Recherche de fonds",
};

export const ACTION_STATUSES = [
  "proposition",
  "a_etudier",
  "a_discuter_commune",
  "transmise_commune",
  "attente_retour",
  "realisee",
  "suspendue",
] as const;

export const ACTION_STATUS_LABELS: Record<(typeof ACTION_STATUSES)[number], string> = {
  proposition: "Nouvelle proposition",
  a_etudier: "À instruire",
  a_discuter_commune: "À discuter avec la commune",
  transmise_commune: "Transmise à la commune",
  attente_retour: "En attente d’un retour",
  realisee: "Réalisée",
  suspendue: "Suspendue",
};

const publicText = z.string().trim().refine((value) => !/@|https?:\/\//i.test(value), {
  message: "N’incluez pas d’adresse e-mail ou de lien dans le tableau partagé.",
});
const nonBlankText = (min: number, max: number) => publicText.min(min).max(max);

// [SPEC-ACTION-BOARD-01] All members may submit a bounded proposal; statuses are assigned server-side.
export const actionCreateSchema = z
  .object({
    pole: z.enum(ACTION_POLES),
    title: nonBlankText(5, 100),
    description: nonBlankText(15, 1200),
    nextStep: publicText.max(240).default(""),
    meetingId: z.string().regex(/^[A-Za-z0-9_-]{20,150}$/).nullable().default(null),
  })
  .strict();

export const actionEditSchema = z
  .object({
    pole: z.enum(ACTION_POLES),
    title: nonBlankText(5, 100),
    description: nonBlankText(15, 1200),
    nextStep: publicText.max(240),
    meetingId: z.string().regex(/^[A-Za-z0-9_-]{20,150}$/).nullable(),
  })
  .strict();

export const actionTransitionSchema = z
  .object({
    status: z.enum(ACTION_STATUSES),
    statusNote: publicText.max(400).default(""),
  })
  .strict();

export type ActionPole = (typeof ACTION_POLES)[number];
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export function canManageAction(ownerUid: string, actorUid: string, actorCanCoordinate: boolean) {
  return canManageMemberEntity(ownerUid, actorUid, actorCanCoordinate);
}

const ALLOWED_TRANSITIONS: Record<ActionStatus, readonly ActionStatus[]> = {
  proposition: ["a_etudier", "suspendue"],
  a_etudier: ["proposition", "a_discuter_commune", "suspendue"],
  a_discuter_commune: ["a_etudier", "transmise_commune", "suspendue"],
  transmise_commune: ["attente_retour", "a_etudier", "suspendue"],
  attente_retour: ["a_etudier", "realisee", "suspendue"],
  realisee: ["a_etudier"],
  suspendue: ["a_etudier", "proposition"],
};

export function canTransitionAction(currentStatus: ActionStatus, nextStatus: ActionStatus) {
  return currentStatus !== nextStatus && ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}