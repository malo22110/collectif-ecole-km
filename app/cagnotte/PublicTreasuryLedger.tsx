"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PAYPAL_URL = "https://paypal.me/collectifecolekm";
const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });

type PublicEntry = {
  id: string;
  kind: "opening" | "contribution" | "expense";
  amountCents: number;
  label: string;
  occurredOn: string;
};

type PublicSnapshot = {
  summary: {
    initialized: boolean;
    balanceCents: number;
    contributionsCents: number;
    expensesCents: number;
  };
  entries: PublicEntry[];
  hasMore: boolean;
  nextCursor: string | null;
};

function formatDate(value: string) {
  return DATE.format(new Date(`${value}T12:00:00.000Z`));
}

export default function PublicTreasuryLedger({
  initialSnapshot,
}: {
  initialSnapshot: PublicSnapshot | null;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadMore = async () => {
    if (!snapshot?.nextCursor || loading) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(
        `/api/treasury/public?cursor=${encodeURIComponent(snapshot.nextCursor)}`,
        { cache: "no-store" },
      );
      const next = (await response.json()) as PublicSnapshot & { error?: string };
      if (!response.ok) throw new Error(next.error || "Impossible de charger la suite du registre.");
      setSnapshot((current) =>
        current
          ? {
              ...next,
              entries: [...current.entries, ...next.entries],
            }
          : next,
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
            <ArrowLeft size={18} aria-hidden="true" /> Retour au site
          </Link>
          <span className="text-sm font-bold text-stone-700">Le collectif · Kergrist-Moëlou</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase text-emerald-800">Cagnotte du collectif</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-900 sm:text-5xl">
              Une noisette pour faire avancer le collectif.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-stone-600">
              Prenez un café, prenez un gâteau… et, si le cœur vous en dit, laissez une noisette.
              Votre participation libre finance les petits frais du collectif et les avances de ses
              membres.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:flex-row sm:text-left lg:flex-col lg:text-center">
            <div className="rounded-xl bg-white p-2" aria-label="QR code PayPal du collectif">
              <QRCodeSVG value={PAYPAL_URL} size={148} level="M" title="Ouvrir la cagnotte PayPal" />
            </div>
            <div className="min-w-0 flex-1 lg:flex-none">
              <h2 className="font-bold text-stone-900">Contribuer par PayPal</h2>
              <p className="mt-1 break-all text-sm text-stone-600">paypal.me/collectifecolekm</p>
              <p className="mt-1 text-sm font-semibold text-stone-700">Identifiant : @collectifecolekm</p>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                Pour éviter les frais, sélectionnez « Transfert entre proches » si cette option est
                proposée; vérifiez les conditions et frais affichés par PayPal avant de confirmer.
              </p>
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-4 min-h-11 w-full px-4 py-2 text-sm sm:w-auto"
              >
                Ouvrir PayPal <ArrowUp size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-9" aria-labelledby="balance-heading">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="shrink-0 text-emerald-700" size={22} aria-hidden="true" />
            <h2 id="balance-heading" className="text-xl font-bold text-stone-900">
              État de la cagnotte
            </h2>
          </div>

          {snapshot ? (
            <>
              <div className="grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-3">
                <div className="bg-white p-5 sm:p-6">
                  <p className="text-sm font-semibold text-stone-600">Solde publié</p>
                  <p className="mt-2 text-3xl font-black text-emerald-800">
                    {snapshot.summary.initialized
                      ? EUR.format(snapshot.summary.balanceCents / 100)
                      : "En cours d’initialisation"}
                  </p>
                </div>
                <div className="bg-white p-5 sm:p-6">
                  <p className="text-sm font-semibold text-stone-600">Contributions enregistrées</p>
                  <p className="mt-2 text-2xl font-bold text-stone-900">
                    {EUR.format(snapshot.summary.contributionsCents / 100)}
                  </p>
                </div>
                <div className="bg-white p-5 sm:p-6">
                  <p className="text-sm font-semibold text-stone-600">Dépenses remboursées</p>
                  <p className="mt-2 text-2xl font-bold text-stone-900">
                    {EUR.format(snapshot.summary.expensesCents / 100)}
                  </p>
                </div>
              </div>
              {!snapshot.summary.initialized && (
                <p className="mt-3 text-sm text-amber-800">
                  Le solde sera affiché après le rapprochement initial du compte par un responsable.
                </p>
              )}
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Le registre est momentanément indisponible. Réessayez dans quelques instants.
            </p>
          )}
        </section>

        <section className="border-t border-stone-200 py-9" aria-labelledby="ledger-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="ledger-heading" className="text-2xl font-bold text-stone-900">
                Registre des opérations
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Les noms des contributeurs et les justificatifs ne sont pas publiés.
              </p>
            </div>
          </div>

          {snapshot?.entries.length ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] border-collapse text-left">
                  <thead className="bg-stone-100 text-xs uppercase text-stone-600">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-bold">Date</th>
                      <th scope="col" className="px-5 py-3 font-bold">Opération</th>
                      <th scope="col" className="px-5 py-3 text-right font-bold">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {snapshot.entries.map((entry) => {
                      const outgoing = entry.kind === "expense";
                      const Icon = outgoing ? ArrowUp : ArrowDown;
                      return (
                        <tr key={entry.id} className="text-sm">
                          <td className="whitespace-nowrap px-5 py-4 text-stone-600">{formatDate(entry.occurredOn)}</td>
                          <td className="px-5 py-4 font-semibold text-stone-800">
                            <span className={`mr-2 inline-flex size-8 align-middle items-center justify-center rounded-full ${outgoing ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                              <Icon size={16} aria-hidden="true" />
                            </span>
                            {entry.label}
                          </td>
                          <td className={`whitespace-nowrap px-5 py-4 text-right font-bold ${outgoing ? "text-stone-800" : "text-emerald-800"}`}>
                            {outgoing ? "−" : "+"}{EUR.format(entry.amountCents / 100)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
              {snapshot ? "Aucune opération publiée pour le moment." : "Le registre sera affiché ici dès qu’il sera disponible."}
            </p>
          )}

          {loadError && <p className="mt-3 text-sm text-rose-700" role="alert">{loadError}</p>}
          {snapshot?.hasMore && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="btn-secondary mt-4 min-h-11 px-4 py-2 text-sm"
            >
              {loading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
              {loading ? "Chargement…" : "Afficher les opérations précédentes"}
            </button>
          )}
        </section>

        <section className="border-t border-stone-200 py-7 text-sm leading-6 text-stone-600">
          <p>
            Le solde et les opérations sont mis à jour par les responsables après rapprochement des
              fonds PayPal et espèces et validation des justificatifs. Le site n’est pas connecté
              directement à PayPal.
          </p>
          <p className="mt-4 text-xs text-stone-500">Collectif citoyen bénévole · Kergrist-Moëlou (22110)</p>
        </section>
      </div>
    </main>
  );
}