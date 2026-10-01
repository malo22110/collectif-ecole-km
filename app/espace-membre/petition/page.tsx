"use client";

// [SPEC-PET-HUB-01] One member entry point for petition signatures, follow-up, scanning, and authorized correction.
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowRight, CheckCircle2, FileText, Printer, ScanLine, UserRoundX, Users, XCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";

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
    {
      href: "/espace-membre/numeriser-petition",
      title: "Numériser une pétition papier",
      description: "Scanner une feuille et vérifier les informations avant import.",
      action: "Numériser une feuille",
      icon: ScanLine,
      iconClass: "bg-sky-100 text-sky-900"
    },
    {
      href: "/espace-membre/signataires",
      title: "Signataires",
      description: "Consulter et rechercher les signatures recueillies.",
      action: "Voir les signataires",
      icon: Users,
      iconClass: "bg-emerald-100 text-emerald-900"
    },
    {
      href: "/espace-membre/non-signataires",
      title: "Membres à relancer",
      description: "Retrouver les membres validés qui n’ont pas encore signé.",
      action: "Voir la liste",
      icon: UserRoundX,
      iconClass: "bg-amber-100 text-amber-900"
    }
  ];

  if (canCorrect) {
    cards.push({
      href: "/espace-membre/correcteur",
      title: "Correction des signatures",
      description: "Corriger les informations d’une signature enregistrée.",
      action: "Ouvrir la correction",
      icon: FileText,
      iconClass: "bg-rose-100 text-rose-900"
    });
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl space-y-6 p-4 md:p-8">
      <header className="border-b border-stone-200 pb-5">
        <p className="mb-2 text-sm font-semibold uppercase text-emerald-800">Espace membre</p>
        <h1 className="text-2xl font-black text-stone-900 md:text-3xl">Pétition</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">Signatures, suivi des membres et outils de gestion réunis au même endroit.</p>
      </header>

      {!rolesLoaded ? <p role="status" className="py-8 text-center text-sm text-stone-500">Chargement des accès…</p> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ href, title, description, action, icon: Icon, iconClass }) => (
            <Link key={href} href={href} className="group flex min-h-48 flex-col border border-stone-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
              <span className={`mb-4 grid size-10 place-items-center rounded-lg ${iconClass}`}><Icon size={19} aria-hidden="true" /></span>
              <h2 className="font-bold text-stone-900">{title}</h2>
              <p className="mt-1 flex-1 text-sm leading-5 text-stone-600">{description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">{action}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-5 border-t border-stone-200 pt-5" aria-labelledby="petition-field-tools-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="petition-field-tools-title" className="text-lg font-bold text-stone-900">Sur le terrain</h2>
            <p className="mt-1 text-sm text-stone-600">Les ressources pour présenter la pétition et recueillir des signatures.</p>
          </div>
          <Link href="/espace-membre/imprimer" target="_blank" className="btn-primary min-h-11 w-full px-4 py-2 sm:w-auto">
            <Printer size={17} aria-hidden="true" /> Imprimer la pétition papier
          </Link>
        </div>

        <div className="border-y border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5">
          <h3 className="font-bold text-emerald-950">À retenir pendant la collecte</h3>
          <ul className="mt-3 grid gap-2 text-sm text-emerald-900 md:grid-cols-3">
            <li className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />Demandez si la personne a déjà signé en ligne.</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />L’adresse complète et le téléphone ne sont pas obligatoires.</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />La signature est indispensable pour valider le soutien.</li>
          </ul>
        </div>

        <details className="border-b border-stone-200 pb-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold text-stone-900">
            <span className="inline-flex items-center gap-2"><FileText size={18} className="text-emerald-800" aria-hidden="true" />Argumentaire du collectif</span>
            <span className="text-sm font-normal text-stone-500">Ouvrir</span>
          </summary>
          <div className="space-y-5 pt-4">
            <p className="text-sm text-stone-600">Réponses courtes aux questions fréquentes pendant le porte-à-porte.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="border-l-2 border-rose-300 pl-4">
                <h4 className="flex items-start gap-2 font-semibold text-stone-900"><XCircle size={17} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />« La commune n’a pas les moyens. »</h4>
                <p className="mt-2 flex gap-2 text-sm leading-6 text-stone-700"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" /><span><strong>Faux.</strong> Le Trésor public nous autorise 400 000 € d’emprunt. Une fois les aides déduites, le projet optimisé coûte 212 000 €. C’est largement finançable sans toucher à notre excédent.</span></p>
              </article>
              <article className="border-l-2 border-rose-300 pl-4">
                <h4 className="flex items-start gap-2 font-semibold text-stone-900"><XCircle size={17} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />« On ferait des économies en annulant tout. »</h4>
                <p className="mt-2 flex gap-2 text-sm leading-6 text-stone-700"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" /><span><strong>C’est un gouffre.</strong> Si on annule, la loi nous oblige à payer au moins 70 000 €* d’études déjà réalisées, pour zéro travaux. En prime, on perd nos subventions.</span></p>
              </article>
              <article className="border-l-2 border-rose-300 pl-4">
                <h4 className="flex items-start gap-2 font-semibold text-stone-900"><XCircle size={17} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />« Pourquoi ne pas repartir de zéro ? »</h4>
                <p className="mt-2 flex gap-2 text-sm leading-6 text-stone-700"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" /><span><strong>Pire option.</strong> On jette l’argent déjà dépensé, et faire « plus petit » annule toutes nos aides (qui exigent une vraie rénovation thermique).</span></p>
              </article>
              <article className="border-l-2 border-rose-300 pl-4">
                <h4 className="flex items-start gap-2 font-semibold text-stone-900"><XCircle size={17} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />« Faisons seulement les urgences liées au radon. »</h4>
                <p className="mt-2 flex gap-2 text-sm leading-6 text-stone-700"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-700" aria-hidden="true" /><span>Sans aide globale, la facture sera d’au moins 120 000 € (50 000 € travaux + 70 000 €* d’études jetées). Tout ça pour garder une passoire thermique.</span></p>
              </article>
            </div>
            <blockquote className="border-l-4 border-emerald-600 bg-emerald-50 px-4 py-4 text-sm font-semibold italic leading-6 text-emerald-950 sm:px-5">
              « On veut juste protéger les finances de la commune et offrir une école saine. Il faut réunir une commission, valider l’Option 1 pour garder nos subventions. Vous pouvez signer la pétition pour appuyer cette démarche ? »
            </blockquote>
          </div>
        </details>
      </section>
    </main>
  );
}
