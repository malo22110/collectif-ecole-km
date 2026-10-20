import { z } from "zod";

export class NewsletterApiError extends Error {
  readonly httpStatus: number;
  readonly fields: string[];
  readonly codes: string[];
  constructor(httpStatus: number, fields: string[], codes: string[]) {
    super(
      `Infomaniak refuse la requête (HTTP ${httpStatus})${fields.length ? ` : ${fields.join(", ")}` : ""}.`,
    );
    this.name = "NewsletterApiError";
    this.httpStatus = httpStatus;
    this.fields = fields;
    this.codes = codes;
  }
}

export const newsletterGroupSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  subscribed_count: z.number().int().nonnegative().optional(),
});

export const newsletterSubscriberSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().trim().toLowerCase().email(),
  status: z.string().min(1),
  groups: z.array(newsletterGroupSchema).optional(),
});
export const newsletterCampaignSchema = z.object({
  id: z.number().int().positive(),
  subject: z.string(),
  status: z.string(),
});
export type NewsletterSubscriber = z.infer<typeof newsletterSubscriberSchema>;

export function selectNewsletterRecipients(
  subscribers: NewsletterSubscriber[],
  suppressedEmails: readonly string[],
  groupId?: number,
) {
  const suppressed = new Set(suppressedEmails.map((email) => email.trim().toLowerCase()));
  return Array.from(
    new Set(
      subscribers
        .filter(
          (subscriber) =>
            subscriber.status === "active" &&
            !suppressed.has(subscriber.email) &&
            (groupId === undefined || subscriber.groups?.some((group) => group.id === groupId)),
        )
        .map((subscriber) => subscriber.email),
    ),
  );
}

export const newsletterDraftSchema = z
  .object({
    subject: z.string().trim().min(1).max(240),
    body: z.string().trim().min(1).max(20000),
    html: z.string().trim().min(1).max(60000).optional(),
    requestId: z.string().uuid(),
    groupId: z.number().int().positive(),
  })
  .strict();

// [SPEC-NEWSLETTER-CAMPAIGN-02] Never retry a potentially scheduled campaign automatically.
export function canRunNewsletterAction(
  state: string,
  action: "test" | "schedule",
  contentVersion?: number,
): boolean {
  return (
    contentVersion === 2 &&
    (action === "test" ? state === "draft" || state === "tested" : state === "tested")
  );
}

export function remainingNewsletterAudience(snapshot: string[], active: string[]): string[] {
  const eligible = new Set(active);
  return Array.from(new Set(snapshot)).filter((email) => eligible.has(email));
}

// [SPEC-NEWSLETTER-CAMPAIGN-01] Infomaniak requires inactive selectors explicitly too.
export function newsletterRecipientPayload(groupId: number) {
  z.number().int().positive().parse(groupId);
  return {
    all_subscribers: false,
    emails: [],
    expert: { id: 0, conditions: null },
    groups: { include: [groupId], exclude: [] },
    segments: { include: [], exclude: [] },
  };
}

const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    result: z.literal("success"),
    data: z.array(item),
    page: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
  });

// [SPEC-NEWSLETTER-API-01] Fixed upstream, private token and validated replies; no SMTP fallback.
export function createNewsletterClient(
  config: { token: string; domainId: string },
  transport: typeof fetch = fetch,
) {
  if (!config.token || !/^\d+$/.test(config.domainId))
    throw new Error("Configuration Newsletter absente ou invalide.");
  const base = `https://api.infomaniak.com/1/newsletters/${config.domainId}`;
  const request = async (path: string, method = "GET", body?: unknown): Promise<unknown> => {
    const response = await transport(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.body) throw new Error("Réponse Newsletter vide.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) {
          await reader.cancel();
          throw new Error("Réponse Newsletter trop volumineuse.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder().decode(buffer);
    let result: unknown;
    try {
      result = JSON.parse(text);
    } catch {
      if (!response.ok) throw new NewsletterApiError(response.status, [], []);
      throw new Error("Réponse Newsletter invalide.");
    }
    if (!response.ok) {
      const fields = new Set<string>();
      const codes = new Set<string>();
      const visit = (value: unknown, depth = 0) => {
        if (depth > 5 || !value || typeof value !== "object") return;
        for (const [key, item] of Object.entries(value).slice(0, 50)) {
          if (
            ["field", "attribute", "code"].includes(key) &&
            typeof item === "string" &&
            /^[A-Za-z0-9_.-]{1,100}$/.test(item)
          ) {
            (key === "code" ? codes : fields).add(item);
          }
          if (
            /^(recipients|email_from_addr|email_from_name|content_html|subject|lang)(\.[A-Za-z0-9_]+)*$/.test(
              key,
            )
          )
            fields.add(key);
          visit(item, depth + 1);
        }
      };
      visit(result);
      throw new NewsletterApiError(response.status, Array.from(fields), Array.from(codes));
    }
    return result;
  };
  return {
    async subscribers(): Promise<NewsletterSubscriber[]> {
      const subscribers: NewsletterSubscriber[] = [];
      for (let page = 1; page <= 100; page++) {
        const result = pageSchema(newsletterSubscriberSchema).parse(
          await request(`/subscribers?page=${page}&per_page=100&with=groups`),
        );
        if (result.page !== page || result.pages > 100)
          throw new Error("Pagination Newsletter invalide ou trop volumineuse.");
        subscribers.push(...result.data);
        if (subscribers.length > 10000)
          throw new Error("Trop d'abonnés pour cette synchronisation.");
        if (page >= result.pages) return subscribers;
      }
      throw new Error("Synchronisation Newsletter incomplète.");
    },
    async groups() {
      const groups: z.infer<typeof newsletterGroupSchema>[] = [];
      for (let page = 1; page <= 100; page++) {
        const result = pageSchema(newsletterGroupSchema).parse(
          await request(`/groups?page=${page}&per_page=100&with=subscribed_count`),
        );
        if (result.page !== page || result.pages > 100)
          throw new Error("Pagination des groupes invalide.");
        groups.push(...result.data);
        if (groups.length > 10000) throw new Error("Trop de groupes.");
        if (page >= result.pages) return groups;
      }
      throw new Error("Lecture des groupes incomplète.");
    },
    async unsubscribe(id: number) {
      if (!Number.isSafeInteger(id) || id < 1) throw new Error("Identifiant abonné invalide.");
      return z
        .object({ result: z.literal("success"), data: newsletterSubscriberSchema })
        .parse(await request(`/subscribers/${id}`, "PUT", { status: "unsubscribed" })).data;
    },
    async campaigns(page: number) {
      if (!Number.isInteger(page) || page < 1 || page > 100) throw new Error("Page invalide.");
      return pageSchema(newsletterCampaignSchema).parse(
        await request(`/campaigns?page=${page}&per_page=25`),
      );
    },
    async campaign(id: number) {
      if (!Number.isSafeInteger(id) || id < 1) throw new Error("Campagne invalide.");
      return z
        .object({ result: z.literal("success"), data: newsletterCampaignSchema })
        .parse(await request(`/campaigns/${id}`)).data;
    },
    async createCampaign(input: {
      subject: string;
      html: string;
      senderEmail: string;
      senderName: string;
      emails: string[];
      groupId: number;
    }) {
      if (!input.emails.length) throw new Error("Aucun abonné actif.");
      return z.object({ result: z.literal("success"), data: newsletterCampaignSchema }).parse(
        await request("/campaigns", "POST", {
          subject: input.subject,
          content_html: input.html,
          email_from_addr: input.senderEmail,
          email_from_name: input.senderName,
          lang: "fr_FR",
          recipients: newsletterRecipientPayload(input.groupId),
          tracking_link: false,
          tracking_opening: false,
          unsub_link: true,
        }),
      ).data;
    },
    async updateRecipients(id: number, groupId: number) {
      if (!Number.isSafeInteger(id) || id < 1)
        throw new Error("Campagne ou destinataires invalides.");
      return z.object({ result: z.literal("success"), data: newsletterCampaignSchema }).parse(
        await request(`/campaigns/${id}`, "PUT", {
          recipients: newsletterRecipientPayload(groupId),
        }),
      ).data;
    },
    async testCampaign(id: number, email: string) {
      if (!Number.isSafeInteger(id) || id < 1) throw new Error("Campagne invalide.");
      z.string().email().parse(email);
      const result = z
        .object({ result: z.literal("success"), data: z.boolean() })
        .parse(await request(`/campaigns/${id}/test`, "POST", { email }));
      if (!result.data) throw new Error("Le test n'a pas été confirmé par Infomaniak.");
      return true;
    },
    async scheduleCampaign(id: number, timestamp: number) {
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(timestamp))
        throw new Error("Programmation invalide.");
      const result = z
        .object({ result: z.literal("success"), data: z.boolean() })
        .parse(await request(`/campaigns/${id}/schedule`, "PUT", { started_at: timestamp }));
      if (!result.data) throw new Error("La programmation n'a pas été confirmée par Infomaniak.");
      return true;
    },
  };
}
