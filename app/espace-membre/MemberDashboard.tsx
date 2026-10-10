"use client";

// [SPEC-DASHBOARD-01] Show concise, member-specific status from the validated dashboard endpoint.
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  MapPinned,
  ReceiptText,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type DashboardMeeting = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
};

type DashboardCampaign = {
  id: string;
  title: string;
  joined: boolean;
};

type DashboardData = {
  nextMeeting: DashboardMeeting | null;
  campaigns: DashboardCampaign[];
  moreCampaigns: boolean;
  pendingExpenseCount: number;
  morePendingExpenses: boolean;
  activeActionCount: number;
  moreActiveActions: boolean;
  teamRoles: Array<{ key: string; label: string }>;
  available: {
    meetings: boolean;
    campaigns: boolean;
    expenses: boolean;
    actions: boolean;
    teams: boolean;
  };
};

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

async function loadDashboard(user: User): Promise<DashboardData> {
  const response = await fetch("/api/member-dashboard", {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Impossible de charger le tableau de bord.");
  return result as DashboardData;
}

function Unavailable() {
  return <p className="mt-4 text-sm text-stone-500">Statut temporairement indisponible.</p>;
}

export default function MemberDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError("Connectez-vous avec un compte membre validé.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      void loadDashboard(user)
        .then((result) => {
          if (active) setData(result);
        })
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger le tableau de bord.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl p-4 md:p-8" role="status">
        <p className="inline-flex min-h-12 items-center gap-2 text-sm text-stone-600">
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> Chargement du tableau de bord…
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-8">
        <h1 className="text-3xl font-black text-stone-900">Tableau de bord</h1>
        <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error || "Les informations du tableau de bord sont momentanément indisponibles."}</p>
        <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="btn-secondary min-h-10 px-4 py-2 text-sm">
          Réessayer <ArrowRight size={16} aria-hidden="true" />
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 p-4 md:p-8 md:pt-10">
      <header className="border-b border-stone-200 pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-emerald-800">Espace membre · collectif</p>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 md:text-4xl">Tableau de bord</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Les prochains rendez-vous, campagnes et actions à suivre.</p>
      </header>

      {error && <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4" aria-label="État du collectif">
        <article className="flex min-h-52 flex-col rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-sky-100 text-sky-900"><CalendarDays size={19} aria-hidden="true" /></span>
            <h2 className="font-bold text-stone-900">Prochaine réunion</h2>
          </div>
          {!data.available.meetings ? <Unavailable /> : data.nextMeeting ? (
            <>
              <p className="mt-4 font-semibold text-stone-900">{data.nextMeeting.title}</p>
              <p className="mt-1 text-sm text-stone-600">{DATE_TIME.format(new Date(data.nextMeeting.startsAt))}</p>
              {data.nextMeeting.location && <p className="mt-1 text-sm text-stone-600">{data.nextMeeting.location}</p>}
            </>
          ) : <p className="mt-4 text-sm text-stone-600">Aucune réunion publiée à venir.</p>}
          <Link href={data.nextMeeting ? `/espace-membre/reunions?meeting=${encodeURIComponent(data.nextMeeting.id)}` : "/espace-membre/reunions"} className="mt-auto inline-flex min-h-10 items-end gap-2 pt-4 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            Ouvrir l’agenda <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="flex min-h-52 flex-col rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-900"><MapPinned size={19} aria-hidden="true" /></span>
            <h2 className="font-bold text-stone-900">Campagnes en cours</h2>
          </div>
          {!data.available.campaigns ? <Unavailable /> : data.campaigns.length ? (
            <>
              <ul className="mt-3 space-y-2">
                {data.campaigns.map((campaign) => (
                  <li key={campaign.id} className="flex items-start gap-2 text-sm text-stone-700">
                    {campaign.joined ? <Check size={16} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" /> : <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden="true" />}
                    <span>{campaign.title}{campaign.joined && <span className="block text-xs text-emerald-800">Vous participez</span>}</span>
                  </li>
                ))}
              </ul>
              {data.moreCampaigns && <p className="mt-2 text-xs text-stone-500">D’autres campagnes sont actives.</p>}
            </>
          ) : <p className="mt-4 text-sm text-stone-600">Aucune campagne active pour le moment.</p>}
          <Link href="/espace-membre/tournees" className="mt-auto inline-flex min-h-10 items-end gap-2 pt-4 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            Voir la carte et les campagnes <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="flex min-h-52 flex-col rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-rose-100 text-rose-900"><Wallet size={19} aria-hidden="true" /></span>
            <h2 className="font-bold text-stone-900">Demandes de frais</h2>
          </div>
          {!data.available.expenses ? <Unavailable /> : (
            <p className="mt-4 text-sm text-stone-700">
              {data.pendingExpenseCount
                ? `${data.morePendingExpenses ? "50+" : data.pendingExpenseCount} demande${data.pendingExpenseCount === 1 && !data.morePendingExpenses ? "" : "s"} en attente de validation.`
                : "Aucune demande en attente de validation."}
            </p>
          )}
          <Link href="/espace-membre/remboursements" className="mt-auto inline-flex min-h-10 items-end gap-2 pt-4 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            Ouvrir la trésorerie <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="flex min-h-52 flex-col rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><Wrench size={19} aria-hidden="true" /></span>
            <h2 className="font-bold text-stone-900">Propositions à suivre</h2>
          </div>
          {!data.available.actions ? <Unavailable /> : (
            <p className="mt-4 text-sm text-stone-700">
              {data.activeActionCount
                ? `${data.moreActiveActions ? "100+" : data.activeActionCount} proposition${data.activeActionCount === 1 && !data.moreActiveActions ? "" : "s"} active${data.activeActionCount === 1 && !data.moreActiveActions ? "" : "s"}.`
                : "Aucune proposition active."}
            </p>
          )}
          <Link href="/espace-membre/actions" className="mt-auto inline-flex min-h-10 items-end gap-2 pt-4 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            Ouvrir le tableau <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" aria-label="Équipes et accès rapides">
        <article className={`rounded-lg border p-5 ${data.available.teams && data.teamRoles.length === 0 ? "border-emerald-300 bg-emerald-50/60" : "border-stone-200 bg-white"}`}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-teal-100 text-teal-900"><Users size={19} aria-hidden="true" /></span>
            <h2 className="font-bold text-stone-900">Mes équipes</h2>
          </div>
          {!data.available.teams ? <Unavailable /> : data.teamRoles.length ? (
            <>
              <p className="mt-4 text-sm text-stone-600">Vous participez à {data.teamRoles.length} équipe{data.teamRoles.length === 1 ? "" : "s"}.</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.teamRoles.map((role) => <li key={role.key} className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700">{role.label}</li>)}
              </ul>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-stone-700">Vous n’avez rejoint aucune équipe pour le moment.</p>
              <p className="mt-1 text-sm text-stone-600">Choisissez un rôle qui correspond à vos envies et disponibilités.</p>
            </>
          )}
          <Link href="/espace-membre/equipe" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            {data.teamRoles.length ? "Voir les équipes" : "Découvrir les équipes"} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="font-bold text-stone-900">Accès rapides</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/espace-membre/competences" className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-900">
              <span className="inline-flex items-center gap-2"><Users size={16} aria-hidden="true" /> Compétences</span><ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/espace-membre/actions" className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-900">
              <span className="inline-flex items-center gap-2"><Wrench size={16} aria-hidden="true" /> Propositions</span><ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/espace-membre/remboursements" className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-900">
              <span className="inline-flex items-center gap-2"><ReceiptText size={16} aria-hidden="true" /> Frais</span><ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/espace-membre/reunions" className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-700 hover:text-emerald-900">
              <span className="inline-flex items-center gap-2"><Clock3 size={16} aria-hidden="true" /> Réunions</span><ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}