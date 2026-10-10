"use client";

// [SPEC-DASHBOARD-01] Keep the member dashboard focused on the main hubs.
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, UserRoundCog, Newspaper, MapPinned, Users, Wrench } from "lucide-react";

export default function EspaceMembreDashboard() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 md:pt-10">
      <header className="mb-8">
        <h1 className="mb-3 text-3xl font-black tracking-tight text-stone-900 md:text-5xl">
          Tableau de bord
        </h1>
        <p className="text-base text-stone-600 md:text-lg">
          Votre quartier général pour la mobilisation sur le terrain.
        </p>
        <Link
          href="/presentation-membres"
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          <BookOpen size={17} aria-hidden="true" /> Découvrir les outils de l’espace membre
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <section
        className="flex flex-col gap-4 border-y border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="map-campaigns-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900">
            <MapPinned size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="map-campaigns-title" className="font-bold text-stone-900">
              Carte & campagnes
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Explorez les lieux-dits, choisissez vos favoris et rejoignez une campagne.
            </p>
          </div>
        </div>
        <Link
          href="/espace-membre/tournees"
          className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto"
        >
          Ouvrir la carte <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-y border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="petition-hub-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="petition-hub-title" className="font-bold text-stone-900">
              La pétition
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Signataires, membres à relancer, numérisation et outils de pétition.
            </p>
          </div>
        </div>
        <Link
          href="/espace-membre/petition"
          className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto"
        >
          Ouvrir le hub Pétition <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="team-entry-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900">
            <UserRoundCog size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="team-entry-title" className="font-bold text-stone-900">
              Les équipes du collectif
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Découvrez les équipes et demandez le rôle qui vous intéresse.
            </p>
          </div>
        </div>
        <Link
          href="/espace-membre/equipe"
          className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto"
        >
          Voir les équipes et choisir mes rôles <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="skills-entry-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="skills-entry-title" className="font-bold text-stone-900">
              Annuaire de compétences
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Trouvez des volontaires et indiquez les savoir-faire que vous souhaitez partager.
            </p>
          </div>
        </div>
        <Link
          href="/espace-membre/competences"
          className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto"
        >
          Ouvrir l’annuaire <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="actions-board-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-900">
            <Wrench size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="actions-board-title" className="font-bold text-stone-900">Propositions & actions</h2>
            <p className="mt-1 text-sm text-stone-600">Rassemblez les idées, besoins et prochaines étapes par pôle.</p>
          </div>
        </div>
        <Link href="/espace-membre/actions" className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto">
          Ouvrir le tableau <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="meetings-entry-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-900">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="meetings-entry-title" className="font-bold text-stone-900">Agenda & comptes rendus</h2>
            <p className="mt-1 text-sm text-stone-600">Préparez les réunions, proposez des sujets et retrouvez les notes partagées.</p>
          </div>
        </div>
        <Link href="/espace-membre/reunions" className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto">
          Ouvrir l’agenda <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section
        className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="redaction-entry-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-900">
            <Newspaper size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="redaction-entry-title" className="font-bold text-stone-900">
              Pôle rédaction
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Articles, FAQ et informations presse, selon vos rôles.
            </p>
          </div>
        </div>
        <Link
          href="/espace-membre/redaction"
          className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto"
        >
          Ouvrir le pôle rédaction <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
