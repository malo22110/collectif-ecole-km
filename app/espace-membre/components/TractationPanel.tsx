"use client";

// [SPEC-TRACTATION-01] One campaign list shared by map users; members join and track only their own visits.
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpRight, Check, ChevronDown, Compass, Heart, Loader2, MapPinned, Users } from "lucide-react";
import { auth } from "@/lib/firebase";
import { buildTourRouteSegments, type GeoPoint } from "@/lib/tourneeGeo";

type Place = { id: string; nom: string; foyers: number; lat: number | null; lon: number | null; hasCoordinates: boolean };
type PlaceAssignment = { status: "claimed" | "completed"; isMine: boolean };
type Campaign = {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
  lieuDits: Place[];
  attachment: { fileName: string; contentType: string; size: number } | null;
  joined: boolean;
  assignedPlaces: Record<string, PlaceAssignment>;
  myRoutePlaceIds: string[];
};
type PageData = { campaigns: Campaign[]; canCreate: boolean; showStatistics: boolean; nextCursor: string | null };

export type CampaignMapState = {
  campaignId: string;
  title: string;
  placeIds: string[];
  assignmentStatuses: Record<string, "claimed" | "completed">;
  routePlaceIds: string[];
  origin: GeoPoint | null;
};

interface TractationPanelProps {
  favoritePlaceIds: string[];
  suggestionOrigin?: GeoPoint | null;
  onCanCreateChange?: (canCreate: boolean) => void;
  onStatisticsVisibleChange?: (visible: boolean) => void;
  onCampaignMapChange?: (campaign: CampaignMapState | null) => void;
}

async function request(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

function googleMapsRouteUrl(origin: GeoPoint, destination: GeoPoint, waypoints: GeoPoint[]) {
  const query = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: "driving"
  });
  if (waypoints.length) query.set("waypoints", waypoints.map(point => `${point.lat},${point.lon}`).join("|"));
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

export default function TractationPanel({ favoritePlaceIds, suggestionOrigin = null, onCanCreateChange, onStatisticsVisibleChange, onCampaignMapChange }: TractationPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [replacementFiles, setReplacementFiles] = useState<Record<string, File | null>>({});
  const [routeDrafts, setRouteDrafts] = useState<Record<string, string[]>>({});
  const [routeOrigins, setRouteOrigins] = useState<Record<string, GeoPoint | null>>({});
  const [locatingCampaign, setLocatingCampaign] = useState<string | null>(null);
  const [claimingRoute, setClaimingRoute] = useState<string | null>(null);
  const [mapCampaignId, setMapCampaignId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!mapCampaignId) {
      onCampaignMapChange?.(null);
      return;
    }
    const campaign = campaigns.find(item => item.id === mapCampaignId);
    if (!campaign) return;
    const assignmentStatuses = Object.fromEntries(Object.entries(campaign.assignedPlaces || {}).map(([id, assignment]) => [id, assignment.status]));
    onCampaignMapChange?.({
      campaignId: campaign.id,
      title: campaign.title,
      placeIds: campaign.lieuDits.map(place => place.id),
      assignmentStatuses,
      routePlaceIds: campaign.myRoutePlaceIds || [],
      origin: getRouteOrigin(campaign.id)
    });
  }, [mapCampaignId, campaigns, routeOrigins, suggestionOrigin, onCampaignMapChange]);

  const getRouteDraft = (campaign: Campaign) => routeDrafts[campaign.id]
    ?? favoritePlaceIds.filter(id => campaign.lieuDits.some(place => place.id === id && place.hasCoordinates)
      && !campaign.assignedPlaces?.[id]);

  const getRouteOrigin = (campaignId: string) => routeOrigins[campaignId] || suggestionOrigin;

  const getRouteSegments = (campaign: Campaign) => {
    const origin = getRouteOrigin(campaign.id);
    if (!origin) return [];
    const stops = (campaign.myRoutePlaceIds || []).flatMap(id => {
      const place = campaign.lieuDits.find(item => item.id === id);
      return place && Number.isFinite(place.lat) && Number.isFinite(place.lon)
        ? [{ lat: place.lat as number, lon: place.lon as number }]
        : [];
    });
    return buildTourRouteSegments(origin, stops);
  };

  const toggleRouteDraftPlace = (campaign: Campaign, placeId: string) => {
    setRouteDrafts(current => {
      const currentIds = current[campaign.id] ?? getRouteDraft(campaign);
      return {
        ...current,
        [campaign.id]: currentIds.includes(placeId)
          ? currentIds.filter(id => id !== placeId)
          : currentIds.length < 200 ? [...currentIds, placeId] : currentIds
      };
    });
  };

  const moveRouteDraftPlace = (campaign: Campaign, index: number, direction: -1 | 1) => {
    setRouteDrafts(current => {
      const ids = [...(current[campaign.id] ?? getRouteDraft(campaign))];
      const destination = index + direction;
      if (destination < 0 || destination >= ids.length) return current;
      [ids[index], ids[destination]] = [ids[destination], ids[index]];
      return { ...current, [campaign.id]: ids };
    });
  };

  const useCampaignGps = (campaignId: string) => {
    setError("");
    setRouteOrigins(current => ({ ...current, [campaignId]: null }));
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible dans ce navigateur.");
      return;
    }
    setLocatingCampaign(campaignId);
    navigator.geolocation.getCurrentPosition(position => {
      setRouteOrigins(current => ({ ...current, [campaignId]: { lat: position.coords.latitude, lon: position.coords.longitude } }));
      setLocatingCampaign(null);
    }, geoError => {
      setError(geoError.code === geoError.PERMISSION_DENIED
        ? "Autorisez la géolocalisation dans le navigateur pour démarrer la tournée."
        : "Impossible d’obtenir votre position. Réessayez.");
      setLocatingCampaign(null);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };

  // [SPEC-TRACTATION-05] A member takes every selected campaign stop in one atomic request.
  const claimRoute = async (campaign: Campaign) => {
    if (!user) return;
    const routePlaceIds = getRouteDraft(campaign);
    if (!routePlaceIds.length) return;
    setClaimingRoute(campaign.id);
    setError("");
    try {
      await request(user, `/api/tractation/${campaign.id}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lieuDitIds: routePlaceIds })
      });
      setRouteDrafts(current => ({ ...current, [campaign.id]: [] }));
      await load(user);
    } catch (routeError) {
      setError(routeError instanceof Error ? routeError.message : "Impossible de prendre cette tournée.");
      await load(user).catch(() => undefined);
    } finally {
      setClaimingRoute(null);
    }
  };

  const join = async (campaignId: string) => {
    if (!user) return;
    setBusy(campaignId); setError("");
    try {
      await request(user, `/api/tractation/${campaignId}/join`, { method: "POST" });
      setCampaigns(previous => previous.map(campaign => campaign.id === campaignId ? { ...campaign, joined: true } : campaign));
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de rejoindre la campagne."); }
    finally { setBusy(""); }
  };

  const updateAssignment = async (campaign: Campaign, place: Place, action: "claim" | "complete" | "release") => {
    if (!user) return;
    const key = `${campaign.id}:${place.id}`;
    setBusy(key); setError("");
    try {
      const result = await request(user, `/api/tractation/${campaign.id}/places/${place.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action })
      }) as { status: PlaceAssignment["status"] | null; assignedToMe: boolean };
      setCampaigns(previous => previous.map(item => item.id !== campaign.id ? item : {
        ...item,
        assignedPlaces: result.status
          ? { ...item.assignedPlaces, [place.id]: { status: result.status, isMine: result.assignedToMe } }
          : Object.fromEntries(Object.entries(item.assignedPlaces).filter(([id]) => id !== place.id)),
        myRoutePlaceIds: action === "release"
          ? item.myRoutePlaceIds.filter(id => id !== place.id)
          : item.myRoutePlaceIds
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de réserver ce lieu.");
      if (user) await load(user).catch(() => undefined);
    }
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
        : <div className="divide-y divide-stone-200 border-y border-stone-200">{campaigns.map(campaign => {
          const takenCount = Object.keys(campaign.assignedPlaces || {}).length;
          const myRoutePlaceIds = campaign.myRoutePlaceIds || [];
          const routeDraft = getRouteDraft(campaign);
          const routeOrigin = getRouteOrigin(campaign.id);
          const routeSegments = getRouteSegments(campaign);
          const mapIsSelected = mapCampaignId === campaign.id;
          return (
          <details key={campaign.id} className="group py-3">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3">
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-stone-900">{campaign.title}</span><span className="text-xs text-stone-500">{takenCount} sur {campaign.lieuDits.length} lieux pris</span></span>
              {campaign.joined && <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">Inscrit</span>}
              <ChevronDown size={17} className="shrink-0 text-stone-500 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-3 py-3 pl-0 sm:pl-12">
              <button type="button" onClick={() => {
                setMapCampaignId(mapIsSelected ? null : campaign.id);
                document.getElementById("places-map-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }} aria-pressed={mapIsSelected} className="btn-secondary min-h-10 px-3 py-2 text-sm"><MapPinned size={16} />{mapIsSelected ? "Afficher la carte complète" : "Voir les lieux sur la carte"}</button>
              <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{campaign.message}</p>
              {!campaign.joined && <button type="button" onClick={() => void join(campaign.id)} disabled={busy === campaign.id} className="btn-primary min-h-10 px-4 py-2 text-sm"><Users size={16} />{busy === campaign.id ? "Inscription…" : "Rejoindre cette campagne"}</button>}
              {campaign.attachment && <button type="button" onClick={() => void download(campaign)} disabled={busy === `download:${campaign.id}`} className="btn-secondary min-h-10 px-3 py-2 text-sm"><ArrowDownToLine size={16} />Télécharger le document</button>}
              {campaign.joined && myRoutePlaceIds.length === 0 && <div className="space-y-3 border-y border-stone-200 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="text-sm font-semibold text-stone-900">Préparer ma tournée</h3><p className="text-xs text-stone-600">Choisissez et ordonnez les lieux de cette campagne.</p></div>
                  <button type="button" onClick={() => useCampaignGps(campaign.id)} disabled={locatingCampaign === campaign.id} className="btn-secondary min-h-10 px-3 py-2 text-sm"><Compass size={16} />{locatingCampaign === campaign.id ? "Localisation…" : "Départ GPS"}</button>
                </div>
                <p className="text-xs text-stone-600">{routeOrigins[campaign.id] ? "Départ : position GPS, conservée uniquement dans cette page." : suggestionOrigin ? "Départ : adresse recherchée, utilisée uniquement dans cette page." : "Choisissez un départ GPS ou recherchez une adresse sur la carte."}</p>
                <ol className="space-y-1">{routeDraft.map((placeId, index) => {
                  const place = campaign.lieuDits.find(item => item.id === placeId);
                  if (!place) return null;
                  return <li key={placeId} className="flex min-h-11 items-center gap-2 border-b border-stone-100 py-1">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{place.nom}</span>
                    <button type="button" onClick={() => moveRouteDraftPlace(campaign, index, -1)} disabled={index === 0} aria-label={`Monter ${place.nom}`} className="grid size-10 shrink-0 place-items-center rounded text-stone-700 hover:bg-stone-100 disabled:opacity-40"><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => moveRouteDraftPlace(campaign, index, 1)} disabled={index === routeDraft.length - 1} aria-label={`Descendre ${place.nom}`} className="grid size-10 shrink-0 place-items-center rounded text-stone-700 hover:bg-stone-100 disabled:opacity-40"><ArrowDown size={16} /></button>
                  </li>;
                })}</ol>
                <button type="button" onClick={() => void claimRoute(campaign)} disabled={!routeDraft.length || claimingRoute === campaign.id} className="btn-primary min-h-11 px-4 py-2 text-sm"><Check size={16} />{claimingRoute === campaign.id ? "Réservation…" : `Prendre ma tournée (${routeDraft.length})`}</button>
              </div>}
              <fieldset><legend className="mb-2 text-sm font-semibold text-stone-800">Lieux de la campagne</legend><div className="grid gap-1 sm:grid-cols-2">{campaign.lieuDits.map(place => {
                const assignment = campaign.assignedPlaces?.[place.id];
                const isBusy = busy === `${campaign.id}:${place.id}`;
                const routeStep = myRoutePlaceIds.indexOf(place.id);
                return <div key={place.id} className="flex min-h-12 items-center gap-2 rounded-md px-2 hover:bg-stone-50">
                  <label className={`flex min-w-0 flex-1 items-center gap-3 ${campaign.joined && (!assignment || assignment.isMine) ? "cursor-pointer" : "cursor-default"}`}>
                    {!myRoutePlaceIds.length && campaign.joined && !assignment && <input type="checkbox" checked={routeDraft.includes(place.id)} disabled={!place.hasCoordinates || routeDraft.length >= 200 && !routeDraft.includes(place.id)} onChange={() => toggleRouteDraftPlace(campaign, place.id)} aria-label={`${routeDraft.includes(place.id) ? "Retirer de" : "Ajouter à"} ma tournée : ${place.nom}`} className="size-4 accent-emerald-700" />}
                    {routeStep >= 0 && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white">{routeStep + 1}</span>}
                    <span className="min-w-0 truncate text-sm">{place.nom}</span>
                  </label>
                  {assignment && <span className={`shrink-0 text-xs font-medium ${assignment.status === "completed" ? "text-emerald-800" : assignment.isMine ? "text-blue-800" : "text-stone-500"}`}>{assignment.status === "completed" ? "Fait" : assignment.isMine ? "Vous le prenez" : "Pris par un membre"}</span>}
                  {campaign.joined && assignment?.isMine && assignment.status === "claimed" && <button type="button" disabled={isBusy} onClick={() => void updateAssignment(campaign, place, "complete")} className="min-h-10 shrink-0 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">{isBusy ? <Loader2 size={14} className="animate-spin" /> : "Marquer fait"}</button>}
                  {campaign.joined && assignment?.isMine && assignment.status === "claimed" && <button type="button" disabled={isBusy} onClick={() => void updateAssignment(campaign, place, "release")} aria-label={`Libérer ${place.nom}`} className="min-h-10 shrink-0 px-2 text-xs font-semibold text-stone-600 hover:bg-stone-100">Libérer</button>}
                  {campaign.joined && !assignment && !place.hasCoordinates && <button type="button" disabled={isBusy} onClick={() => void updateAssignment(campaign, place, "claim")} className="min-h-10 shrink-0 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">Prendre le lieu</button>}
                  {!assignment && <span className="shrink-0 text-xs text-stone-500">Disponible</span>}
                  {isBusy && <Loader2 size={14} className="shrink-0 animate-spin text-stone-500" />}
                </div>;
              })}</div></fieldset>
              {myRoutePlaceIds.length > 0 && <section className="space-y-2 border-t border-stone-200 pt-3" aria-labelledby={`campaign-route-${campaign.id}`}>
                <h3 id={`campaign-route-${campaign.id}`} className="text-sm font-semibold text-stone-900">Ma tournée · {myRoutePlaceIds.filter(id => campaign.assignedPlaces?.[id]?.status === "completed").length}/{myRoutePlaceIds.length} faits</h3>
                {routeSegments.length > 0 ? <><p className="text-xs leading-5 text-stone-600">Google Maps recevra votre départ et les lieux de chaque étape lorsque vous ouvrirez un itinéraire.</p><div className="flex flex-wrap gap-2">{routeSegments.map((segment, index) => <a key={`${campaign.id}:${index}`} href={googleMapsRouteUrl(segment.origin, segment.destination, segment.waypoints)} target="_blank" rel="noreferrer" className="btn-secondary min-h-10 px-3 py-2 text-sm"><ArrowUpRight size={15} />Ouvrir l’étape {index + 1}/{routeSegments.length}</a>)}</div></> : <p className="text-xs text-stone-600">Définissez un départ GPS ou recherchez une adresse pour ouvrir l’itinéraire.</p>}
              </section>}
              {canCreate && <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-end"><label className="input-label min-w-0 flex-1">{campaign.attachment ? "Remplacer le document" : "Ajouter un document"}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => setReplacementFiles(previous => ({ ...previous, [campaign.id]: event.currentTarget.files?.[0] || null }))} className="mt-1 block w-full text-sm" /></label><button type="button" onClick={() => void replaceDocument(campaign.id)} disabled={!replacementFiles[campaign.id] || busy === `upload:${campaign.id}`} className="btn-secondary min-h-10 px-3 py-2 text-sm"><ArrowDownToLine size={15} />Envoyer</button></div>}
            </div>
          </details>
        );})}</div>}
      {nextCursor && <button type="button" onClick={() => user && void load(user, nextCursor)} className="btn-secondary min-h-10 w-full py-2 text-sm">Charger d’autres campagnes</button>}
    </section>
  );
}
