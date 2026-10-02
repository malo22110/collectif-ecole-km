"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowRight, FileText, Users } from "lucide-react";
import { auth, db } from "@/lib/firebase";

// [SPEC-PET-CLOSE-01] Member tools preserve review and correction, not new signature collection.
export default function PetitionHubPage() {
  const [canCorrect, setCanCorrect] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user?.email) {
        setCanCorrect(false);
        setRolesLoaded(true);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "membres", user.email));
        const data = snapshot.data();
        const roles = Array.isArray(data?.roles) ? data.roles : (data?.role ? [data.role] : []);
        setCanCorrect(roles.includes("admin") || roles.includes("correcteur"));
      } catch {
        setCanCorrect(false);
      } finally {
        setRolesLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const cards = [
    { href: "/espace-membre/signataires", title: "Signataires", description: "Consulter les signatures recueillies.", action: "Voir le bilan", icon: Users },
    ...(canCorrect ? [{ href: "/espace-membre/correcteur", title: "Correction", description: "Corriger les informations d’une signature existante.", action: "Ouvrir la correction", icon: FileText }] : [])
  ];

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl space-y-6 p-4 md:p-8">
      <header className="border-b border-stone-200 pb-5">
        <p className="mb-2 text-sm font-semibold uppercase text-emerald-800">Espace membre</p>
        <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Pétition close</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">La collecte est terminée après le vote du conseil municipal. Le dossier retourne chez l’architecte pour être ajusté à l’enveloppe prévue. Les signatures restent consultables et rectifiables par les personnes habilitées.</p>
      </header>
      {!rolesLoaded ? <p role="status" className="py-8 text-center text-sm text-stone-500">Chargement des accès…</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(({ href, title, description, action, icon: Icon }) => (
            <Link key={href} href={href} className="group flex min-h-40 flex-col border border-stone-200 bg-white p-5 hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
              <Icon size={20} className="mb-3 text-emerald-800" aria-hidden="true" />
              <h2 className="font-bold text-stone-900">{title}</h2>
              <p className="mt-1 flex-1 text-sm text-stone-600">{description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">{action}<ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}