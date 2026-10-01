import assert from "node:assert/strict";
import test from "node:test";
import {
  getInboxMessageId,
  MAX_INBOX_ATTACHMENT_BYTES,
  MAX_INBOX_ATTACHMENTS,
  MAX_INBOX_MESSAGE_BYTES,
  getMailMessageIndexId,
  normalizeInboxText,
  sanitizeInboxFileName
} from "../functions/src/mailInboxUtils.ts";

// [SPEC-MAIL-02] Incoming message identity is deterministic to make repeated IMAP syncs idempotent.
test("produit une clé stable à partir du Message-ID ou de l’UID IMAP", () => {
  assert.equal(getInboxMessageId("<reply@example.test>", 42, 7), getInboxMessageId("<reply@example.test>", 91, 8));
  assert.equal(getInboxMessageId(undefined, 42, 7), getInboxMessageId(undefined, 42, 7));
  assert.notEqual(getInboxMessageId(undefined, 42, 7), getInboxMessageId(undefined, 43, 7));
});

// [SPEC-MAIL-04] Message-ID matching is case-insensitive and never stores raw identifiers as document IDs.
test("indexe les Message-ID de manière stable et privée", () => {
  assert.equal(getMailMessageIndexId("<reply@example.test>"), getMailMessageIndexId(" <REPLY@example.test> "));
  assert.equal(getMailMessageIndexId(""), "");
  assert.match(getMailMessageIndexId("<reply@example.test>"), /^[a-f0-9]{64}$/);
});

// [SPEC-MAIL-02] Bound inbound messages and sanitize display metadata before storage.
test("borne les emails entrants et nettoie les noms des pièces jointes", () => {
  assert.equal(MAX_INBOX_MESSAGE_BYTES, 8 * 1024 * 1024);
  assert.equal(MAX_INBOX_ATTACHMENT_BYTES, 4 * 1024 * 1024);
  assert.equal(MAX_INBOX_ATTACHMENTS, 5);
  assert.equal(normalizeInboxText(`safe\0${"x".repeat(60_000)}`).length, 50_000);
  assert.equal(sanitizeInboxFileName("../../rapport.pdf"), "_.._rapport.pdf");
});