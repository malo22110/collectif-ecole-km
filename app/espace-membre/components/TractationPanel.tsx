"use client";

// [SPEC-TRACTATION-01] One campaign list shared by map users; members join and track only their own visits.
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowDownToLine, Check, ChevronDown, Loader2, Users } from "lucide-react";
import { auth } from "@/lib/firebase";

type Place = { id: string; nom: string; foyers: number };
type Campaign = {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
  lieuDits: Place[];
  attachment: { fileName: string; contentType: string; size: number } | null;
  joined: boolean;
  visitedIds: string[];
};
type PageData = { campaigns: Campaign[]; canCreate: boolean; showStatistics: boolean; nextCursor: string | null };

interface TractationPanelProps {
  onCanCreateChange?: (canCreate: boolean) => void;
  onStatisticsVisibleChange?: (visible: boolean) => void;
}

async function request(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

export default function TractationPanel({ onCanCreateChange, onStatisticsVisibleChange }: TractationPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [replacementFiles, setReplacementFiles] = useState<Record<string, File | null>>({});

  const load = useCallback(async (currentUser: User, cursor?: string | null) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const data = await request(currentUser, `/api/tractation${query}`) as PageData;
    setCampaigns(previous => cursor ? [...previous, ...data.campaigns] : data.campaigns);
    setCanCreate(data.canCreate);
    setNextCursor(data.nextCursor);
    onCanCreateChange?.(data.canCreate);
    onStatisticsVisibleChange?.(data.showStatistics === true);
  }, [onCanCreateChange, onStatisticsVisibleChange]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }
      void load(currentUser).catch(err => {
        if (active) setError(err instanceof Error ? err.message : "Impossible de charger les campagnes.");
      }).finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; unsubscribe(); };
  }, [load]);

  const join = async (campaignId: string) => {
    if (!user) return;
    setBusy(campaignId); setError("");
    try {
      await request(user, `/api/tractation/${campaignId}/join`, { method: "POST" });
      setCampaigns(previous => previous.map(campaign => campaign.id === campaignId ? { ...campaign, joined: true } : campaign));
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de rejoindre la campagne."); }
    finally { setBusy(""); }
  };

  const markVisited = async (campaign: Campaign, place: Place, visited: boolean) => {
    if (!user) return;
    const key = `${campaign.id}:${place.id}`;
    setBusy(key); setError("");
    try {
      await request(user, `/api/tractation/${campaign.id}/visits/${place.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visited })
      });
      setCampaigns(previous => previous.map(item => item.id !== campaign.id ? item : {
        ...item,
        visitedIds: visited ? Array.from(new Set([...item.visitedIds, place.id])): item.visitedIds.filter(id => id !== place.id)
      }));
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible d'enregistrer le passage."); }
    finally { setBusy(""); }
  };

  const download = async (campaign: Campaign) => {
    if (!user || !campaign.attachment) return;
    setBusy(`download:${campaign.id}`); setError("");
    try {
      const response = await fetch(`/api/tractation/${campaign.id}/document`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store"
      });
      if (!response.ok) throw new Error("Impossible de télécharger le document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = objectUrl; link.download = campaign.attachment.fileName; link.click(); URL.revokeObjectURL(objectUrl);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de télécharger le document."); }
    finally { setBusy(""); }
  };

  const replaceDocument = async (campaignId: string) => {
    if (!user || !replacementFiles[campaignId]) return;
    const selectedFile = replacementFiles[campaignId]!;
    if (selectedFile.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      setError("Choisissez un PDF ou une image de 10 Mio maximum.");
      return;
    }
    const key = `upload:${campaignId}`;
    setBusy(key); setError("");
    try {
      await request(user, `/api/tractation/${campaignId}/document`, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type, "X-File-Name": encodeURIComponent(selectedFile.name) },
        body: selectedFile
      });
      setReplacementFiles(previous => ({ ...previous, [campaignId]: null }));
      await load(user);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible d'envoyer le document."); }
    finally { setBusy(""); }
  };

  return (
    <section className="space-y-3 border-t border-stone-200 pt-4" aria-labelledby="ongoing-campaigns-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ongoing-campaigns-title" className="text-lg font-bold text-stone-900">Campagnes en cours</h2>
        <span className="text-xs text-stone-500">{campaigns.length}</span>
      </div>
      {error && <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {loading ? <p role="status" className="py-6 text-center text-sm text-stone-500"><Loader2 size={17} className="mr-2 inline animate-spin" />Chargement…</p>
        : campaigns.length === 0 ? <p className="border-y border-stone-200 py-6 text-sm text-stone-600">Aucune campagne en cours.</p>
        : <div className="divide-y divide-stone-200 border-y border-stone-200">{campaigns.map(campaign => (
          <details key={campaign.id} className="group py-3">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3">
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-stone-900">{campaign.title}</span><span className="text-xs text-stone-500">{campaign.lieuDits.length} lieux · {campaign.joined ? `${campaign.visitedIds.length} visités` : "ouverte aux membres"}</span></span>
              {campaign.joined && <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">Inscrit</span>}
              <ChevronDown size={17} className="shrink-0 text-stone-500 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-3 py-3 pl-0 sm:pl-12">
              <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{campaign.message}</p>
              {!campaign.joined && <button type="button" onClick={() => void join(campaign.id)} disabled={busy === campaign.id} className="btn-primary min-h-10 px-4 py-2 text-sm"><Users size={16} />{busy === campaign.id ? "Inscription…" : "Rejoindre cette campagne"}</button>}
              {campaign.attachment && <button type="button" onClick={() => void download(campaign)} disabled={busy === `download:${campaign.id}`} className="btn-secondary min-h-10 px-3 py-2 text-sm"><ArrowDownToLine size={16} />Télécharger le document</button>}
              {campaign.joined && <fieldset><legend className="mb-2 text-sm font-semibold text-stone-800">Mes passages</legend><div className="grid gap-1 sm:grid-cols-2">{campaign.lieuDits.map(place => <label key={place.id} className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-stone-50"><input type="checkbox" checked={campaign.visitedIds.includes(place.id)} disabled={busy === `${campaign.id}:${place.id}`} onChange={event => void markVisited(campaign, place, event.currentTarget.checked)} className="size-4 accent-emerald-700" /><span className="text-sm">{place.nom}</span>{busy === `${campaign.id}:${place.id}` && <Loader2 size={14} className="ml-auto animate-spin" />}</label>)}</div></fieldset>}
              {canCreate && <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-end"><label className="input-label min-w-0 flex-1">{campaign.attachment ? "Remplacer le document" : "Ajouter un document"}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => setReplacementFiles(previous => ({ ...previous, [campaign.id]: event.currentTarget.files?.[0] || null }))} className="mt-1 block w-full text-sm" /></label><button type="button" onClick={() => void replaceDocument(campaign.id)} disabled={!replacementFiles[campaign.id] || busy === `upload:${campaign.id}`} className="btn-secondary min-h-10 px-3 py-2 text-sm"><ArrowDownToLine size={15} />Envoyer</button></div>}
            </div>
          </details>
        ))}</div>}
      {nextCursor && <button type="button" onClick={() => user && void load(user, nextCursor)} className="btn-secondary min-h-10 w-full py-2 text-sm">Charger d’autres campagnes</button>}
    </section>
  );
}
