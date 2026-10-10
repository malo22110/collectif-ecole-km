import { TreasuryRouteError, getTreasuryPublicSnapshot, treasuryErrorResponse } from "@/lib/treasuryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [SPEC-TREASURY-02] Only the public ledger projection is exposed; private requests and receipts never leave the server.
export async function GET(request: Request) {
  try {
    const cursor = new URL(request.url).searchParams.get("cursor") || undefined;
    if (cursor && !/^[A-Za-z0-9_-]{1,150}$/.test(cursor)) {
      throw new TreasuryRouteError(400, "Curseur de page invalide.");
    }
    return Response.json(await getTreasuryPublicSnapshot(cursor), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return treasuryErrorResponse(error, "Impossible de charger la trésorerie publique.");
  }
}