type ScheduledTimestamp = {
  toDate: () => Date;
};

export function isMailDueForDelivery(
  scheduledAt: ScheduledTimestamp | Date | null | undefined,
  now: Date
): boolean {
  if (scheduledAt == null) return true;

  const scheduledDate = scheduledAt instanceof Date ? scheduledAt : scheduledAt.toDate();
  return Number.isFinite(scheduledDate.getTime()) && scheduledDate <= now;
}