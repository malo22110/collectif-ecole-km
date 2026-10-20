import { adminDb } from "@/lib/firebaseAdmin";
import { filterSuppressedRecipients } from "@/functions/src/mailSuppression";

// [SPEC-MAIL-OPT-OUT-01] Check private suppression records in bounded batches, failing closed.
export async function excludeSuppressedRecipients<T extends { email: string }>(
  recipients: T[],
): Promise<T[]> {
  return filterSuppressedRecipients(recipients, async (ids) => {
    const snapshots = await adminDb.getAll(
      ...ids.map((id) => adminDb.collection("mailSuppressions").doc(id)),
    );
    return snapshots.map((snapshot) => snapshot.exists);
  });
}
