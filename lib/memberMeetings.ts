import { z } from "zod";
import { canManageMemberEntity } from "./memberEntityAccess.ts";

const MAX_AGENDA_ITEMS = 20;
const sharedText = z.string().trim().refine((value) => !/@|https?:\/\//i.test(value), {
  message: "N’incluez pas de coordonnées ou de lien dans ce champ partagé.",
});

const agendaItemSchema = z.object({
  id: z.string().uuid(),
  text: sharedText.min(3).max(180),
  sourceSuggestionId: z.string().regex(/^[A-Za-z0-9_-]{20,150}$/).optional(),
});

const isoDateTime = z.string().datetime({ offset: true });

// [SPEC-MEMBER-MEETINGS-01] Meeting records are internal member notes, not official municipal minutes.
export const meetingInputSchema = z
  .object({
    title: sharedText.min(5).max(120),
    startsAt: isoDateTime,
    location: sharedText.max(160).default(""),
    agendaItems: z.array(agendaItemSchema).max(MAX_AGENDA_ITEMS),
    minutes: sharedText.max(6000).default(""),
    publish: z.boolean().default(false),
  })
  .strict();

export const meetingUpdateSchema = meetingInputSchema.omit({ publish: true });

export const agendaSuggestionSchema = z
  .object({
    text: sharedText.min(5).max(240),
  })
  .strict();

export const agendaSuggestionEditSchema = z
  .object({ text: sharedText.min(5).max(240) })
  .strict();

export const agendaSuggestionDecisionSchema = z
  .object({ status: z.enum(["accepted", "rejected"]) })
  .strict();

export type MeetingInput = z.infer<typeof meetingInputSchema>;
export type MeetingUpdate = z.infer<typeof meetingUpdateSchema>;
export type AgendaItem = z.infer<typeof agendaItemSchema>;
export type AgendaSuggestionStatus = "pending" | "accepted" | "rejected";

export function canSuggestAgenda(status: unknown, startsAt: unknown, now = Date.now()) {
  if (status !== "published" || typeof startsAt !== "string") return false;
  const parsed = Date.parse(startsAt);
  return Number.isFinite(parsed) && parsed > now;
}

export function canPublishMeeting(actorCanCoordinate: boolean, currentStatus: unknown) {
  return actorCanCoordinate && currentStatus === "draft";
}

export function canManageAgendaSuggestion(
  ownerUid: string,
  actorUid: string,
  actorCanCoordinate: boolean,
  status: unknown,
) {
  return status === "pending" && canManageMemberEntity(ownerUid, actorUid, actorCanCoordinate);
}