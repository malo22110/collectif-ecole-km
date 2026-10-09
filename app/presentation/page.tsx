import type { Metadata } from "next";
import PresentationDeck from "./PresentationDeck";

export const metadata: Metadata = {
  title: "Cap sur l’avenir | Rénovation de l’école de Kergrist-Moëlou",
  description:
    "Présentation de la feuille de route citoyenne pour la rénovation de l’école de Kergrist-Moëlou.",
  robots: { index: false, follow: false },
};

export default function PresentationPage() {
  return <PresentationDeck />;
}