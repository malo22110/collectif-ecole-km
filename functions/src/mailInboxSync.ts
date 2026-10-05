import { randomUUID } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import { smtpPassword } from "./mailTransport";
import {
  getInboxMessageId,
  getMailMessageIndexId,
  MAX_INBOX_ATTACHMENT_BYTES,
  MAX_INBOX_ATTACHMENTS,
  MAX_INBOX_MESSAGE_BYTES,
  normalizeInboxText,
  sanitizeInboxFileName,
} from "./mailInboxUtils";

const MAILBOX_PATH = "INBOX";
const MAX_MESSAGES_PER_SYNC = 25;
const MAX_TOTAL_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const LOCK_DURATION_MS = 10 * 60 * 1000;

function getSender(parsed: Awaited<ReturnType<typeof simpleParser>>) {
  const sender = parsed.from?.value[0];
  return {
    name: (sender?.name || "").slice(0, 200),
    email: (sender?.address || "").slice(0, 320),
  };
}

function getReceivedDate(
  parsedDate: Date | undefined,
  internalDate: Date | string | undefined,
) {
  const candidate =
    parsedDate || (internalDate ? new Date(internalDate) : new Date());
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

export async function syncInfomaniakInbox() {
  if (process.env.IMAP_SYNC_ENABLED !== "true") {
    logger.info("Synchronisation IMAP désactivée par configuration.");
    return;
  }

  const firestore = getFirestore("ecole-db");
  const stateRef = firestore
    .collection("mailInboxSyncState")
    .doc("infomaniakInbox");
  const lockToken = randomUUID();
  const acquired = await firestore.runTransaction(async (transaction) => {
    const state = await transaction.get(stateRef);
    const lockExpiresAt = state.get("lockExpiresAt") as Timestamp | undefined;
    if (lockExpiresAt && lockExpiresAt.toMillis() > Date.now()) return false;
    transaction.set(
      stateRef,
      {
        lockToken,
        lockExpiresAt: Timestamp.fromMillis(Date.now() + LOCK_DURATION_MS),
      },
      { merge: true },
    );
    return true;
  });

  if (!acquired) {
    logger.info(
      "Une synchronisation de la boîte de réception est déjà en cours.",
    );
    return;
  }

  const imapHost =
    process.env.IMAP_HOST || process.env.SMTP_HOST || "mail.infomaniak.com";
  const imapPort = Number(process.env.IMAP_PORT || 993);
  const imapUser =
    process.env.IMAP_USER ||
    process.env.SMTP_USER ||
    "contact@collectif-ecole-km.fr";
  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapPort === 993,
    auth: { user: imapUser, pass: smtpPassword.value() },
    logger: false,
  });
  const bucket = getStorage().bucket(
    process.env.FIREBASE_STORAGE_BUCKET ||
      "collectif-ecole-km.firebasestorage.app",
  );
  let lock: Awaited<ReturnType<typeof client.getMailboxLock>> | undefined;

  try {
    await client.connect();
    lock = await client.getMailboxLock(MAILBOX_PATH, { readOnly: true });
    const openedMailbox = client.mailbox;
    if (!openedMailbox)
      throw new Error("La boîte de réception IMAP n’est pas ouverte.");
    const uidValidity = Number(openedMailbox.uidValidity || 0);
    if (!uidValidity)
      throw new Error("Le serveur IMAP n’a pas fourni UIDVALIDITY.");

    const stateSnapshot = await stateRef.get();
    const stateUidValidity = Number(stateSnapshot.get("uidValidity") || 0);
    const lastUid =
      stateUidValidity === uidValidity
        ? Number(stateSnapshot.get("lastUid") || 0)
        : 0;
    const searchResult = await client.search(
      { uid: `${lastUid + 1}:*` },
      { uid: true },
    );
    const uids = (Array.isArray(searchResult) ? searchResult : [])
      .filter((uid) => Number.isInteger(uid) && uid > lastUid)
      .sort((first, second) => first - second)
      .slice(0, MAX_MESSAGES_PER_SYNC);

    for (const uid of uids) {
      try {
        const metadata = await client.fetchOne(
          uid,
          {
            uid: true,
            envelope: true,
            internalDate: true,
            size: true,
          },
          { uid: true },
        );

        if (!metadata) {
          await saveCursor(stateRef, lockToken, uidValidity, uid);
          continue;
        }

        const externalMessageId = metadata.envelope?.messageId;
        const inboxMessageId = getInboxMessageId(
          externalMessageId,
          uidValidity,
          uid,
        );
        const inboxRef = firestore.collection("mailInbox").doc(inboxMessageId);
        if ((await inboxRef.get()).exists) {
          await saveCursor(stateRef, lockToken, uidValidity, uid);
          continue;
        }

        if ((metadata.size || 0) > MAX_INBOX_MESSAGE_BYTES) {
          await createInboxMessage(inboxRef, {
            from: {
              name: "",
              email: metadata.envelope?.from?.[0]?.address || "",
            },
            subject: (metadata.envelope?.subject || "Message reçu").slice(
              0,
              500,
            ),
            receivedAt: Timestamp.fromDate(
              metadata.internalDate
                ? new Date(metadata.internalDate)
                : new Date(),
            ),
            text: "Ce message dépasse la taille maximale prise en charge par la boîte de réception du site.",
            messageId: externalMessageId || "",
            references: [],
            attachments: [],
            omittedAttachmentCount: 0,
            isRead: false,
            syncStatus: "message-too-large",
            imapUid: uid,
            imapUidValidity: uidValidity,
            createdAt: FieldValue.serverTimestamp(),
          });
          await saveCursor(stateRef, lockToken, uidValidity, uid);
          continue;
        }

        const fullMessage = await client.fetchOne(
          uid,
          {
            uid: true,
            source: { maxLength: MAX_INBOX_MESSAGE_BYTES + 1 },
          },
          { uid: true },
        );
        if (
          !fullMessage ||
          !fullMessage.source ||
          fullMessage.source.byteLength > MAX_INBOX_MESSAGE_BYTES
        ) {
          throw new Error("Le contenu du message dépasse la limite de taille.");
        }

        const parsed = await simpleParser(fullMessage.source);
        const attachments: Array<{
          id: string;
          fileName: string;
          contentType: string;
          size: number;
          storagePath: string;
        }> = [];
        let totalAttachmentBytes = 0;
        let omittedAttachmentCount = 0;

        for (const attachment of parsed.attachments || []) {
          if (
            attachments.length >= MAX_INBOX_ATTACHMENTS ||
            attachment.size < 1 ||
            attachment.size > MAX_INBOX_ATTACHMENT_BYTES ||
            totalAttachmentBytes + attachment.size > MAX_TOTAL_ATTACHMENT_BYTES
          ) {
            omittedAttachmentCount += 1;
            continue;
          }

          const attachmentId = randomUUID();
          const fileName = sanitizeInboxFileName(attachment.filename);
          const contentType = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(
            attachment.contentType,
          )
            ? attachment.contentType.toLowerCase()
            : "application/octet-stream";
          const storagePath = `mailInbox/${inboxMessageId}/attachments/${attachmentId}`;
          await bucket.file(storagePath).save(attachment.content, {
            resumable: false,
            metadata: {
              contentType,
              cacheControl: "private, no-store",
              metadata: { inboxMessageId, attachmentId },
            },
          });
          totalAttachmentBytes += attachment.size;
          attachments.push({
            id: attachmentId,
            fileName,
            contentType,
            size: attachment.size,
            storagePath,
          });
        }

        const sender = getSender(parsed);
        const references = Array.isArray(parsed.references)
          ? parsed.references
              .slice(-10)
              .map((value) => String(value).slice(0, 500))
          : parsed.references
            ? [String(parsed.references).slice(0, 500)]
            : [];
        const inReplyTo =
          typeof parsed.inReplyTo === "string"
            ? parsed.inReplyTo.slice(0, 998)
            : "";
        const threadId = await resolveThreadId(
          firestore,
          [inReplyTo, ...references],
          inboxMessageId,
        );
        try {
          await createInboxMessage(inboxRef, {
            from: sender,
            subject: (parsed.subject || "(sans objet)").slice(0, 500),
            receivedAt: Timestamp.fromDate(
              getReceivedDate(parsed.date, metadata.internalDate),
            ),
            text: normalizeInboxText(parsed.text),
            messageId: String(
              parsed.messageId || externalMessageId || "",
            ).slice(0, 998),
            inReplyTo,
            threadId,
            references,
            attachments,
            omittedAttachmentCount,
            isRead: false,
            syncStatus: "stored",
            imapUid: uid,
            imapUidValidity: uidValidity,
            createdAt: FieldValue.serverTimestamp(),
          });
        } catch (error) {
          await Promise.all(
            attachments.map((item) =>
              bucket
                .file(item.storagePath)
                .delete({ ignoreNotFound: true })
                .catch(() => undefined),
            ),
          );
          throw error;
        }

        const receivedMessageId = getMailMessageIndexId(
          parsed.messageId || externalMessageId,
        );
        if (receivedMessageId) {
          await firestore
            .collection("mailMessageIndex")
            .doc(receivedMessageId)
            .set({ threadId, inboxMessageId });
        }

        await saveCursor(stateRef, lockToken, uidValidity, uid);
      } catch (error) {
        logger.error(
          "Échec de synchronisation d’un message IMAP; la prochaine exécution réessaiera.",
          {
            uid,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          },
        );
        break;
      }
    }

    logger.info("Synchronisation IMAP terminée.", {
      importedMessages: uids.length,
    });
  } catch (error) {
    logger.error("Échec de synchronisation de la boîte IMAP.", error);
  } finally {
    lock?.release();
    if (client.usable) await client.logout().catch(() => undefined);
    await firestore
      .runTransaction(async (transaction) => {
        const state = await transaction.get(stateRef);
        if (state.get("lockToken") === lockToken) {
          transaction.set(
            stateRef,
            { lockToken: null, lockExpiresAt: Timestamp.fromMillis(0) },
            { merge: true },
          );
        }
      })
      .catch((error) =>
        logger.error(
          "Impossible de libérer le verrou de synchronisation IMAP.",
          error,
        ),
      );
  }
}

async function resolveThreadId(
  firestore: FirebaseFirestore.Firestore,
  references: string[],
  fallbackThreadId: string,
) {
  for (const messageId of references.slice().reverse()) {
    const indexId = getMailMessageIndexId(messageId);
    if (!indexId) continue;
    const index = await firestore
      .collection("mailMessageIndex")
      .doc(indexId)
      .get();
    const threadId = index.get("threadId");
    if (typeof threadId === "string" && threadId) return threadId;
  }
  return fallbackThreadId;
}

async function createInboxMessage(
  reference: FirebaseFirestore.DocumentReference,
  data: FirebaseFirestore.DocumentData,
) {
  await getFirestore("ecole-db").runTransaction(async (transaction) => {
    const existing = await transaction.get(reference);
    if (!existing.exists) transaction.create(reference, data);
  });
}

async function saveCursor(
  reference: FirebaseFirestore.DocumentReference,
  lockToken: string,
  uidValidity: number,
  lastUid: number,
) {
  await getFirestore("ecole-db").runTransaction(async (transaction) => {
    const state = await transaction.get(reference);
    if (state.get("lockToken") !== lockToken)
      throw new Error("Le verrou IMAP a expiré.");
    transaction.set(reference, { uidValidity, lastUid }, { merge: true });
  });
}
