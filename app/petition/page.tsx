"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSignature } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// [SPEC-PET-CLOSE-01] The petition remains a read-only archive; no signature form is mounted.
export default function PetitionPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => onSnapshot(doc(db, "stats", "petition"), snapshot => {
    const value = snapshot.data()?.count;
    if (typeof value === "number") setCount(value);
  }), []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="relative min-h-[55vh] bg-emerald-950 text-white flex items-end">
        <img src="/images/hero_petition.jpg" alt="École de Kergrist-Moëlou" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-emerald-950/80" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-12 pt-20 md:pb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-12 focus-visible:outline-2 focus-visible:outline-white"><ArrowLeft size={18} /> Accueil</Link>
          <p className="text-emerald-200 font-semibold mb-3">Pétition citoyenne · collecte terminée</p>
          <h1 className="text-4xl md:text-5xl font-bold max-w-3xl mb-5">Pétition Citoyenne pour la Sauvegarde de l&apos;École</h1>
          <p className="text-lg text-emerald-50 max-w-2xl">Valorisons les études engagées vers un projet maîtrisé.</p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 py-12 grid gap-10 md:grid-cols-[1fr_240px]">
        <div className="space-y-5">
          <h2 className="text-2xl font-bold">Ce que demandait la pétition</h2>
          <p className="text-stone-700 leading-relaxed">Rappel de la demande portée par la pétition pendant la collecte :</p>
          <blockquote className="border-l-4 border-emerald-600 bg-emerald-50 px-5 py-4 text-stone-900 leading-relaxed">
            Nous demandons la poursuite et la réévaluation à la baisse du dossier de rénovation déjà engagé, afin d&apos;aboutir à une solution économe (retour à l&apos;enveloppe de 550 000 € HT) et adaptée aux capacités de la commune, plutôt qu&apos;à un blocage ou un abandon qui contraindrait à repartir de zéro.
          </blockquote>
          <h2 className="text-2xl font-bold">La pétition est close</h2>
          <p className="text-stone-700 leading-relaxed">Il n’est plus possible de signer en ligne ni de déposer de nouvelles signatures papier. Les signatures recueillies restent prises en compte dans le bilan de cette mobilisation.</p>
          <p className="text-stone-700 leading-relaxed">L’étape suivante est le travail de l’architecte pour faire entrer le projet dans l’enveloppe. Les caractéristiques et le calendrier du projet seront précisés lorsque les informations seront publiées.</p>
          <Link href="/historique" className="inline-flex items-center gap-2 text-emerald-800 font-semibold underline underline-offset-4 hover:text-emerald-950">Suivre l’avancement du dossier</Link>
        </div>
        <div className="border-l-4 border-emerald-600 pl-5 self-start" aria-label="Bilan des signatures">
          <FileSignature className="text-emerald-700 mb-3" aria-hidden="true" />
          <p className="text-4xl font-bold tabular-nums">{count ?? "—"}</p>
          <p className="text-stone-600">signatures recueillies</p>
        </div>
      </div>
    </main>
  );
}