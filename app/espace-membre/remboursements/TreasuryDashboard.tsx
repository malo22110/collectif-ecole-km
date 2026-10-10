"use client";

// [SPEC-TREASURY-06] Members submit documented advances; only server-authorized treasurers/admins can manage requests.
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  Clock3,
  Download,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { PUBLIC_EXPENSE_CATEGORIES } from "@/lib/treasuryModel";

type Reimbursement = {
  id: string;
  amountCents: number;
  publicLabel: string;
  description: string;
  occurredOn: string;
  status: "pending" | "approved" | "rejected" | "paid";
  rejectionReason: string | null;
  paidOn: string | null;
  createdAtMillis: number | null;
  receiptAvailable: boolean;
  receiptFileName: string | null;
  submittedByName?: string;
  submittedByEmail?: string;
};

type DashboardData = {
  canManage: boolean;
  initialized: boolean;
  balanceCents: number;
  requests: Reimbursement[];
  truncated: boolean;
};

const EURO = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" });
const TODAY = new Date().toISOString().slice(0, 10);
const REIMBURSEMENT_IDEMPOTENCY_STORAGE_KEY = "treasury-reimbursement-submission";
const CONTRIBUTION_IDEMPOTENCY_STORAGE_KEY = "treasury-contribution-submission";

function getSessionSubmissionKey(storageKey: string, uid: string) {
  const scopedStorageKey = `${storageKey}:${uid}`;
  let key = sessionStorage.getItem(scopedStorageKey);
  if (!key || !/^[0-9a-f-]{36}$/i.test(key)) {
    key = crypto.randomUUID();
    sessionStorage.setItem(scopedStorageKey, key);
  }
  return key;
}

function clearSessionSubmissionKey(storageKey: string, uid?: string) {
  if (uid) sessionStorage.removeItem(`${storageKey}:${uid}`);
}

function parseEuroCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, cents = ""] = normalized.split(".");
  const amount = Number(euros) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount <= 1_000_000 ? amount : null;
}

function dateLabel(value: string) {
  return DATE.format(new Date(`${value}T12:00:00.000Z`));
}

async function authorizedRequest<T>(user: User, url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data as T;
}

async function loadDashboard(user: User) {
  return authorizedRequest<DashboardData>(user, "/api/treasury/requests");
}

function statusText(status: Reimbursement["status"]) {
  if (status === "pending") return "À examiner";
  if (status === "approved") return "Validée, à rembourser";
  if (status === "paid") return "Remboursée";
  return "Refusée";
}

export default function TreasuryDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [paidDates, setPaidDates] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setError("Connectez-vous avec un compte membre validé.");
        setLoading(false);
        return;
      }
      void loadDashboard(currentUser)
        .then((result) => {
          if (active) setData(result);
        })
        .catch((loadError) => {
          if (active)
            setError(loadError instanceof Error ? loadError.message : "Impossible de charger les demandes.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refresh = async () => {
    if (!user) return;
    setData(await loadDashboard(user));
  };

  const handleSubmitReimbursement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const amountCents = parseEuroCents(String(form.get("amount") || ""));
    const receipt = form.get("receipt");
    if (!amountCents || !(receipt instanceof File) || receipt.size === 0) {
      setError("Indiquez un montant valide et joignez un justificatif.");
      return;
    }
    const publicLabel = String(form.get("publicLabel") || "");
    const description = String(form.get("description") || "");
    const occurredOn = String(form.get("occurredOn") || "");
    const submissionKey = getSessionSubmissionKey(REIMBURSEMENT_IDEMPOTENCY_STORAGE_KEY, user.uid);

    setSaving(true);
    setError("");
    setNotice("");
    const payload = new FormData();
    payload.set("submissionId", submissionKey);
    payload.set("amountCents", String(amountCents));
    payload.set("publicLabel", publicLabel);
    payload.set("description", description);
    payload.set("occurredOn", occurredOn);
    payload.set("receipt", receipt);
    try {
      await authorizedRequest(user, "/api/treasury/requests", { method: "POST", body: payload });
      clearSessionSubmissionKey(REIMBURSEMENT_IDEMPOTENCY_STORAGE_KEY, user.uid);
      event.currentTarget.reset();
      await refresh();
      setNotice("Votre demande avec justificatif a été transmise aux responsables.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Envoi impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const amountCents = parseEuroCents(String(form.get("amount") || ""));
    if (amountCents === null) {
      setError("Saisissez un solde entre 0 € et 10 000 €.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await authorizedRequest(user, "/api/treasury/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, occurredOn: form.get("occurredOn") }),
      });
      await refresh();
      setNotice("Le solde initial est enregistré.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const amountCents = parseEuroCents(String(form.get("amount") || ""));
    if (!amountCents) {
      setError("Saisissez un montant valide.");
      return;
    }
    const occurredOn = String(form.get("occurredOn") || "");
    const method = String(form.get("method") || "paypal");
    const note = String(form.get("note") || "");
    const contributionKey = getSessionSubmissionKey(CONTRIBUTION_IDEMPOTENCY_STORAGE_KEY, user.uid);
    setSaving(true);
    setError("");
    try {
      await authorizedRequest(user, "/api/treasury/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: contributionKey,
          amountCents,
          occurredOn,
          method,
          note,
        }),
      });
      clearSessionSubmissionKey(CONTRIBUTION_IDEMPOTENCY_STORAGE_KEY, user.uid);
      event.currentTarget.reset();
      await refresh();
      setNotice("La contribution est ajoutée au registre public.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (
    request: Reimbursement,
    action: "approve" | "reject" | "pay",
  ) => {
    if (!user) return;
    const reason = rejectionReasons[request.id]?.trim() || "";
    if (action === "reject" && reason.length < 5) {
      setError("Ajoutez un motif de refus d’au moins 5 caractères.");
      return;
    }
    if (action === "pay" && !paidDates[request.id]) {
      setError("Indiquez la date effective du remboursement.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await authorizedRequest(user, `/api/treasury/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reject" ? { rejectionReason: reason } : {}),
          ...(action === "pay" ? { paidOn: paidDates[request.id] } : {}),
        }),
      });
      await refresh();
      setNotice(
        action === "approve"
          ? "La demande est approuvée; elle pourra être marquée payée après le virement."
          : action === "reject"
            ? "La demande a été refusée avec son motif."
            : "Le remboursement est inscrit au registre public.",
      );
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Action impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptDownload = async (request: Reimbursement) => {
    if (!user) return;
    setError("");
    try {
      const response = await fetch(`/api/treasury/requests/${request.id}/receipt`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Téléchargement impossible.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = request.receiptFileName || "justificatif";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Téléchargement impossible.");
    }
  };

  if (loading) {
    return <div className="p-8 text-stone-600" role="status">Chargement de la trésorerie…</div>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-8 md:pt-10">
      <header className="border-b border-stone-200 pb-6">
        <Link href="/espace-membre" className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-800">
          <ArrowLeft size={17} aria-hidden="true" /> Tableau de bord
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 md:text-4xl">Trésorerie du collectif</h1>
        <p className="mt-2 max-w-3xl text-stone-600">
          Déclarez une avance faite pour le collectif avec son justificatif. Le reçu est accessible
          uniquement à son auteur, aux trésoriers et aux administrateurs.
        </p>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{notice}</p>}

      {data?.canManage && (
        <section className="space-y-5 border-b border-stone-200 pb-8" aria-labelledby="treasury-admin-heading">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-800" size={22} aria-hidden="true" />
            <div>
              <h2 id="treasury-admin-heading" className="text-xl font-bold text-stone-900">Gestion du registre</h2>
              {data.initialized && <p className="text-sm text-stone-600">Solde publié : {EURO.format(data.balanceCents / 100)}</p>}
            </div>
          </div>

          {!data.initialized ? (
            <form onSubmit={handleInitialize} className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block text-sm font-semibold text-stone-800">
                Total des fonds disponibles (€)
                <input name="amount" type="number" min="0" max="10000" step="0.01" required className="input-base mt-2" />
              </label>
              <label className="block text-sm font-semibold text-stone-800">
                Date du rapprochement
                <input name="occurredOn" type="date" defaultValue={TODAY} required className="input-base mt-2" />
              </label>
              <button type="submit" disabled={saving} className="btn-primary min-h-11 px-4 py-2 text-sm">
                <Wallet size={17} aria-hidden="true" /> Initialiser le registre
              </button>
              <p className="text-sm text-amber-950 sm:col-span-3">Additionnez les fonds disponibles sur PayPal et dans la caisse en espèces. Cette valeur ne sera pas récupérée automatiquement.</p>
            </form>
          ) : (
            <form onInput={() => clearSessionSubmissionKey(CONTRIBUTION_IDEMPOTENCY_STORAGE_KEY, user?.uid)} onSubmit={handleContribution} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <label className="block text-sm font-semibold text-stone-800">
                Contribution reçue (€)
                <input name="amount" type="number" min="0.01" max="10000" step="0.01" required className="input-base mt-2" />
              </label>
              <label className="block text-sm font-semibold text-stone-800">
                Date de réception
                <input name="occurredOn" type="date" defaultValue={TODAY} required className="input-base mt-2" />
              </label>
              <label className="block text-sm font-semibold text-stone-800">
                Moyen
                <select name="method" defaultValue="paypal" className="input-base mt-2">
                  <option value="paypal">PayPal</option>
                  <option value="especes">Espèces</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <button type="submit" disabled={saving} className="btn-primary min-h-11 px-4 py-2 text-sm">
                <CircleDollarSign size={17} aria-hidden="true" /> Ajouter la contribution
              </button>
              <label className="block text-sm font-medium text-stone-700 sm:col-span-2 lg:col-span-4">
                Note interne facultative
                <input name="note" maxLength={300} className="input-base mt-2" />
                <span className="mt-1 block text-xs font-normal text-stone-500">Cette note ne sera jamais affichée dans le registre public.</span>
              </label>
            </form>
          )}
        </section>
      )}

      <section className="border-b border-stone-200 pb-8" aria-labelledby="request-heading">
          <div className="mb-4 flex items-center gap-3">
            <ReceiptText className="text-emerald-800" size={22} aria-hidden="true" />
            <h2 id="request-heading" className="text-xl font-bold text-stone-900">Demander un remboursement</h2>
          </div>
          <form onInput={() => clearSessionSubmissionKey(REIMBURSEMENT_IDEMPOTENCY_STORAGE_KEY, user?.uid)} onSubmit={handleSubmitReimbursement} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <label className="block text-sm font-semibold text-stone-800">
              Montant avancé (€)
              <input name="amount" type="number" min="0.01" max="10000" step="0.01" required className="input-base mt-2" />
            </label>
            <label className="block text-sm font-semibold text-stone-800">
              Date de la dépense
              <input name="occurredOn" type="date" defaultValue={TODAY} required className="input-base mt-2" />
            </label>
            <label className="block text-sm font-semibold text-stone-800 md:col-span-2">
              Libellé qui apparaîtra dans le registre public
              <select name="publicLabel" required defaultValue="" className="input-base mt-2">
                <option value="" disabled>Choisir une catégorie publique</option>
                {PUBLIC_EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-stone-500">Le détail privé et le justificatif ne seront pas publiés.</span>
            </label>
            <label className="block text-sm font-semibold text-stone-800 md:col-span-2">
              Détail pour les responsables
              <textarea name="description" minLength={5} maxLength={500} required rows={3} className="input-base mt-2 resize-y" />
              <span className="mt-1 block text-xs font-normal text-stone-500">Ce détail reste privé et n’est pas publié.</span>
            </label>
            <label className="block text-sm font-semibold text-stone-800 md:col-span-2">
              Facture ou ticket de caisse
              <input name="receipt" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required className="mt-2 block min-h-12 w-full rounded-xl border border-stone-300 bg-white p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-semibold file:text-stone-700" />
              <span className="mt-1 block text-xs font-normal text-stone-500">PDF, JPEG, PNG ou WebP · 10 Mio maximum.</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary min-h-12 w-full px-5 py-3 md:col-span-2 md:w-fit">
              {saving ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
              Envoyer la demande
            </button>
          </form>
      </section>

      <section aria-labelledby="requests-heading">
        <div className="mb-4 flex items-center gap-3">
          <Clock3 className="text-emerald-800" size={22} aria-hidden="true" />
          <h2 id="requests-heading" className="text-xl font-bold text-stone-900">
            {data?.canManage ? "Demandes à traiter" : "Mes demandes"}
          </h2>
        </div>
        {data?.truncated && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Les 100 demandes les plus récentes sont affichées.</p>}
        {!data?.requests.length ? (
          <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">Aucune demande pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {data.requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-stone-900">{request.publicLabel}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.status === "paid" ? "bg-emerald-100 text-emerald-900" : request.status === "rejected" ? "bg-rose-100 text-rose-900" : request.status === "approved" ? "bg-sky-100 text-sky-900" : "bg-amber-100 text-amber-950"}`}>
                        {statusText(request.status)}
                      </span>
                    </div>
                    {data.canManage && <p className="mt-1 text-sm text-stone-600">{request.submittedByName} · {request.submittedByEmail}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{request.description}</p>
                    <p className="mt-2 text-xs text-stone-500">Dépense du {dateLabel(request.occurredOn)}{request.paidOn ? ` · Remboursée le ${dateLabel(request.paidOn)}` : ""}</p>
                    {request.rejectionReason && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">Motif du refus : {request.rejectionReason}</p>}
                  </div>
                  <p className="shrink-0 text-2xl font-black text-stone-900">{EURO.format(request.amountCents / 100)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                  {request.receiptAvailable && (
                    <button type="button" onClick={() => void handleReceiptDownload(request)} className="btn-secondary min-h-10 px-3 py-2 text-sm">
                      <Download size={16} aria-hidden="true" /> Télécharger le justificatif
                    </button>
                  )}
                    {data.canManage && request.status === "pending" && request.submittedByEmail !== user?.email && (
                    <>
                      <button type="button" disabled={saving} onClick={() => void handleDecision(request, "approve")} className="btn-primary min-h-10 px-3 py-2 text-sm">
                        <Check size={16} aria-hidden="true" /> Approuver
                      </button>
                      <label className="min-w-[200px] flex-1 text-xs font-semibold text-stone-600">
                        Motif de refus
                        <input value={rejectionReasons[request.id] || ""} onChange={(event) => setRejectionReasons((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={300} className="input-base mt-1 min-h-10 text-sm" />
                      </label>
                      <button type="button" disabled={saving} onClick={() => void handleDecision(request, "reject")} className="btn-secondary min-h-10 border-rose-200 px-3 py-2 text-sm text-rose-800 hover:bg-rose-50">
                        <X size={16} aria-hidden="true" /> Refuser
                      </button>
                    </>
                  )}
                  {data.canManage && request.status === "approved" && request.submittedByEmail !== user?.email && (
                    <>
                      <label className="text-xs font-semibold text-stone-600">
                        Date effective du remboursement
                        <input type="date" value={paidDates[request.id] || TODAY} onChange={(event) => setPaidDates((current) => ({ ...current, [request.id]: event.target.value }))} className="input-base mt-1 min-h-10 text-sm" />
                      </label>
                      <button type="button" disabled={saving} onClick={() => void handleDecision(request, "pay")} className="btn-primary min-h-10 px-3 py-2 text-sm">
                        <CircleDollarSign size={16} aria-hidden="true" /> Marquer comme remboursée
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}