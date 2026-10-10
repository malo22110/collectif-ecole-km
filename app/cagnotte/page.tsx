import type { Metadata } from "next";
import PublicTreasuryLedger from "./PublicTreasuryLedger";
import { getTreasuryPublicSnapshot } from "@/lib/treasuryServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La cagnotte du collectif | Un nid tout neuf pour nos écureuils",
  description:
    "Consultez les contributions et dépenses du collectif citoyen pour la rénovation de l’école de Kergrist-Moëlou.",
};

export default async function CagnottePage() {
  let initialSnapshot = null;
  try {
    initialSnapshot = await getTreasuryPublicSnapshot();
  } catch (error) {
    console.error("Impossible de charger le registre public de la cagnotte:", error);
  }
  return <PublicTreasuryLedger initialSnapshot={initialSnapshot} />;
}