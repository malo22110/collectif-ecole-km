import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebaseAdmin";
import { createNewsletterClient, selectNewsletterRecipients } from "@/lib/infomaniakNewsletter";
import { excludeSuppressedRecipients } from "@/lib/mailSuppressionServer";
import { getMailSuppressionId } from "@/functions/src/mailSuppression";

export function getNewsletterClient() {
  return createNewsletterClient({
    token: process.env.INFOMANIAK_NEWSLETTER_TOKEN || "",
    domainId: process.env.INFOMANIAK_NEWSLETTER_DOMAIN_ID || "",
  });
}

export function getNewsletterSender() {
  const email = process.env.INFOMANIAK_NEWSLETTER_SENDER_EMAIL || "contact@collectif-ecole-km.fr";
  const domain = process.env.INFOMANIAK_NEWSLETTER_SENDER_DOMAIN?.trim() || "collectif-ecole-km.fr";
  if (!z.string().email().safeParse(email).success || email.split("@")[1] !== domain)
    throw new Error("Adresse d'expédition Newsletter invalide.");
  return {
    senderEmail: email,
    senderName: process.env.INFOMANIAK_NEWSLETTER_SENDER_NAME || "Collectif Kergrist-Moëlou",
  };
}

// [SPEC-NEWSLETTER-SYNC-01] Opposition always wins; never import a contact as active.
export async function syncNewsletterSuppressions(uid: string) {
  const client = getNewsletterClient();
  const subscribers = await client.subscribers();
  let imported = 0;
  let exported = 0;
  for (const subscriber of subscribers.filter((item) => item.status === "unsubscribed")) {
    const ref = adminDb.collection("mailSuppressions").doc(getMailSuppressionId(subscriber.email));
    const created = await adminDb.runTransaction(async (transaction) => {
      if ((await transaction.get(ref)).exists) return false;
      transaction.create(ref, {
        email: subscriber.email,
        source: "infomaniak",
        createdAt: FieldValue.serverTimestamp(),
        createdByUid: uid,
      });
      return true;
    });
    if (created) imported++;
  }
  const active = selectNewsletterRecipients(subscribers, []);
  const eligible = await excludeSuppressedRecipients(active.map((email) => ({ email })));
  const allowed = new Set(eligible.map((item) => item.email));
  const toUnsubscribe = subscribers.filter(
    (item) => item.status === "active" && !allowed.has(item.email),
  );
  for (const subscriber of toUnsubscribe.slice(0, 20)) {
    const updated = await client.unsubscribe(subscriber.id);
    if (updated.status !== "unsubscribed" || updated.email !== subscriber.email)
      throw new Error("Le désabonnement distant n'a pas été confirmé.");
    exported++;
  }
  await adminDb
    .collection("newsletterState")
    .doc("infomaniak")
    .set({
      syncedAt: FieldValue.serverTimestamp(),
      syncedByUid: uid,
      imported,
      exported,
      remaining: Math.max(0, toUnsubscribe.length - exported),
    });
  return {
    imported,
    exported,
    remaining: Math.max(0, toUnsubscribe.length - exported),
    activeEmails: eligible.map((item) => item.email),
    total: subscribers.length,
  };
}

export async function getNewsletterAudience(groupId: number) {
  const subscribers = await getNewsletterClient().subscribers();
  return excludeSuppressedRecipients(
    selectNewsletterRecipients(subscribers, [], groupId).map((email) => ({ email })),
  );
}
