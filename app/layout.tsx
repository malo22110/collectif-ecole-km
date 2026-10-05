import type { Metadata } from "next";
import heroImage from "../public/images/hero.jpg";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://collectif-ecole-km.fr"),
  title: "Un nid tout neuf pour nos écureuils | École de Kergrist-Moëlou",
  description:
    "Collectif citoyen pour la rénovation concertée, responsable et durable de l'école de Kergrist-Moëlou (22110).",
  openGraph: {
    title: "Un nid tout neuf pour nos écureuils | École de Kergrist-Moëlou",
    description:
      "Collectif citoyen pour la rénovation concertée, responsable et durable de l'école de Kergrist-Moëlou (22110).",
    images: [
      {
        url: heroImage.src,
        width: 1200,
        height: 630,
        alt: "École de Kergrist-Moëlou",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
