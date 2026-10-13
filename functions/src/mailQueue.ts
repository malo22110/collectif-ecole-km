type ScheduledTimestamp = {
  toDate: () => Date;
};

export function isMailDueForDelivery(
  scheduledAt: ScheduledTimestamp | Date | null | undefined,
  now: Date,
): boolean {
  if (scheduledAt == null) return true;

  const scheduledDate = scheduledAt instanceof Date ? scheduledAt : scheduledAt.toDate();
  return Number.isFinite(scheduledDate.getTime()) && scheduledDate <= now;
}

// [SPEC-MAIL-03] A daily SMTP cap pauses the campaign rather than failing each recipient.
export function isDailySmtpQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const smtpError = error as { responseCode?: unknown; response?: unknown };
  return (
    smtpError.responseCode === 451 &&
    typeof smtpError.response === "string" &&
    /maximum number of sent emails within a 24-hours period/i.test(smtpError.response)
  );
}

// [SPEC-MAIL-03] A manual retry cannot overlap an active send or silently omit failures.
export function canRetryFailedRecipients(
  status: string | undefined,
  failedCount: number,
  pendingCount: number,
  selectedCount: number,
): boolean {
  return (
    (status === "partial" || status === "error") &&
    selectedCount > 0 &&
    selectedCount <= 1000 &&
    pendingCount === 0 &&
    failedCount === selectedCount
  );
}
