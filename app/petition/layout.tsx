import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pétition Citoyenne | Un nid tout neuf pour nos écureuils",
  description:
    "Signez la pétition citoyenne pour la sauvegarde de l'école de Kergrist-Moëlou et demander la réévaluation du budget de rénovation.",
  openGraph: {
    title: "Pétition : Sauvons le projet de rénovation de l'école de Kergrist-Moëlou",
    description:
      "Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation engagé, afin d'aboutir à une solution économe plutôt qu'à un abandon. Signez la pétition !",
    images: [
      {
        url: "https://collectif-ecole-km.web.app/images/hero_petition.jpg",
        width: 1200,
        height: 630,
        alt: "Enfants à l'école de Kergrist-Moëlou",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

export default function PetitionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
