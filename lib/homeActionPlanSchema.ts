import { z } from "zod";
import { sanitizeHomeActionPlanLink } from "./homeActionPlan.ts";

const homeActionPlanEntrySchema = z
  .object({
    date: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(2000),
    status: z.enum(["completed", "current", "upcoming"]),
    linkUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .refine((value) => !value || sanitizeHomeActionPlanLink(value) !== undefined),
  })
  .strict();

export const homeActionPlanDraftSchema = z
  .object({ homeActionPlan: z.array(homeActionPlanEntrySchema).max(100) })
  .strict();
