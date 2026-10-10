import type { Metadata } from "next";
import MemberToolPresentation from "./MemberToolPresentation";

export const metadata: Metadata = {
  title: "Découvrir l’espace membre | Collectif de Kergrist-Moëlou",
  description:
    "Présentation mobile des outils de l’espace membre du collectif : connexion, campagnes, équipes, pétition et trésorerie.",
  robots: { index: false, follow: false },
};

export default function MemberToolsPresentationPage() {
  return <MemberToolPresentation />;
}