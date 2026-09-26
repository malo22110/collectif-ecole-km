import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Un nid tout neuf pour nos écureuils | École de Kergrist-Moëlou",
  description: "Collectif citoyen pour la rénovation concertée, responsable et durable de l'école de Kergrist-Moëlou (22110).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
