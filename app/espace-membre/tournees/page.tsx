"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Heart,
  Info,
  Loader2,
  MapPinned,
  Plus,
  Settings2,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { TourLieuDit } from "@/lib/tourneeGeo";
import MemberPlacePreferences from "@/app/espace-membre/components/MemberPlacePreferences";
import TractationPanel, {
  type CampaignMapState,
} from "@/app/espace-membre/components/TractationPanel";

const OpenStreetMap = dynamic(() => import("./OpenStreetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70dvh] min-h-[440px] items-center justify-center bg-stone-100 text-sm text-stone-500">
      Chargement de la carte…
    </div>
  ),
});

type HubView = "loading" | "setup" | "campaigns" | "campaign" | "campaignInfo" | "preferences";
type PrivatePreferences = {
  favoritePlaceIds: string[];
  setupComplete: boolean;
};
type RoadRoute = {
  geometry: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
};

export default function TourneesPage() {
  const [locations, setLocations] = useState<TourLieuDit[]>([]);
  const [campaignMap, setCampaignMap] = useState<CampaignMapState | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<TourLieuDit | null>(null);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<HubView>("loading");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [missionMode, setMissionMode] = useState(false);
  const [downloadingCampaignDocument, setDownloadingCampaignDocument] = useState(false);
  const mapPlaceAdder = useRef<((placeId: string) => void) | null>(null);
  const [canCreateCampaign, setCanCreateCampaign] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(null);
  const [roadRouteLoading, setRoadRouteLoading] = useState(false);
  const [roadRouteError, setRoadRouteError] = useState("");
  const [roadRouteRetry, setRoadRouteRetry] = useState(0);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setPageError("Connectez-vous avec un compte membre validé pour consulter les campagnes.");
        setView("campaigns");
        return;
      }
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [placesResponse, preferencesResponse] = await Promise.all([
          fetch("/api/tournees", { headers, cache: "no-store" }),
          fetch("/api/member-place-preferences", {
            headers,
            cache: "no-store",
          }),
        ]);
        const [placesData, preferencesData] = await Promise.all([
          placesResponse.json(),
          preferencesResponse.json(),
        ]);
        if (!placesResponse.ok)
          throw new Error(placesData.error || "Impossible de charger la carte.");
        if (!preferencesResponse.ok)
          throw new Error(preferencesData.error || "Impossible de charger vos préférences.");
        if (!active) return;
        setLocations(placesData.locations || []);
        const preferences = preferencesData as PrivatePreferences;
        setFavoritePlaceIds(preferences.favoritePlaceIds || []);
        setView(preferences.setupComplete ? "campaigns" : "setup");
      } catch (loadError) {
        if (!active) return;
        setPageError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger l’espace campagnes.",
        );
        setView("campaigns");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const mapLocations = useMemo(() => {
    if (!campaignMap) return [];
    const includedIds = new Set(campaignMap.placeIds);
    return locations.filter((place) => includedIds.has(place.id));
  }, [campaignMap, locations]);
  const favoriteSet = useMemo(() => new Set(favoritePlaceIds), [favoritePlaceIds]);
  const routePlaceKey = campaignMap?.routePlaceIds.join("|") || "";

  useEffect(() => {
    if (view !== "campaign" || !currentUser || !campaignMap?.origin || !routePlaceKey) {
      setRoadRoute(null);
      setRoadRouteError("");
      setRoadRouteLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setRoadRoute(null);
    setRoadRouteError("");
    setRoadRouteLoading(true);

    void (async () => {
      try {
        const response = await fetch(
          `/api/tractation/${encodeURIComponent(campaignMap.campaignId)}/directions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await currentUser.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ origin: campaignMap.origin }),
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(result?.error || "Impossible de calculer l’itinéraire routier.");
        if (
          !Array.isArray(result?.geometry) ||
          !result.geometry.every(
            (point: unknown) =>
              Array.isArray(point) && point.length === 2 && point.every(Number.isFinite),
          )
        ) {
          throw new Error("Le service routier a renvoyé un tracé invalide.");
        }
        if (active)
          setRoadRoute({
            geometry: result.geometry as Array<[number, number]>,
            distanceMeters: Number(result.distanceMeters) || 0,
            durationSeconds: Number(result.durationSeconds) || 0,
          });
      } catch (routeError) {
        if (active && !(routeError instanceof DOMException && routeError.name === "AbortError")) {
          setRoadRouteError(
            routeError instanceof Error
              ? routeError.message
              : "Impossible de calculer l’itinéraire routier.",
          );
        }
      } finally {
        if (active) setRoadRouteLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    view,
    currentUser,
    campaignMap?.campaignId,
    campaignMap?.origin?.lat,
    campaignMap?.origin?.lon,
    routePlaceKey,
    roadRouteRetry,
  ]);

  const toggleFavorite = useCallback(
    async (placeId: string) => {
      if (!currentUser) return;
      try {
        const headers = {
          Authorization: `Bearer ${await currentUser.getIdToken()}`,
        };
        const currentResponse = await fetch("/api/member-place-preferences", {
          headers,
          cache: "no-store",
        });
        if (!currentResponse.ok) throw new Error("Impossible de charger vos favoris.");
        const current = await currentResponse.json();
        const favorites: string[] = Array.isArray(current.favoritePlaceIds)
          ? current.favoritePlaceIds
          : [];
        const nextFavorites = favorites.includes(placeId)
          ? favorites.filter((id) => id !== placeId)
          : favorites.length < 20
            ? [...favorites, placeId]
            : favorites;
        if (nextFavorites.length === favorites.length && !favorites.includes(placeId))
          throw new Error("Vous pouvez enregistrer jusqu’à 20 lieux favoris.");
        const saveResponse = await fetch("/api/member-place-preferences", {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            favoritePlaceIds: nextFavorites,
            setupComplete: true,
            savedAddress: current.savedAddress || null,
          }),
        });
        if (!saveResponse.ok) throw new Error("Impossible d’enregistrer ce favori.");
        setFavoritePlaceIds(nextFavorites);
        setPageError("");
      } catch (favoriteError) {
        setPageError(
          favoriteError instanceof Error
            ? favoriteError.message
            : "Impossible d’enregistrer ce favori.",
        );
      }
    },
    [currentUser],
  );

  const handleCanCreateChange = useCallback(
    (allowed: boolean) => setCanCreateCampaign(allowed),
    [],
  );
  const handleStatisticsVisibleChange = useCallback(
    (visible: boolean) => setShowStatistics(visible),
    [],
  );
  const handleCampaignMapChange = useCallback(
    (state: CampaignMapState | null) => setCampaignMap(state),
    [],
  );
  const registerMapPlaceAdder = useCallback((handler: (placeId: string) => void) => {
    mapPlaceAdder.current = handler;
  }, []);
  const handleFavoritesChange = useCallback((ids: string[]) => setFavoritePlaceIds(ids), []);
  const completeSetup = useCallback(() => setView("campaigns"), []);
  const openCampaign = useCallback((campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCampaignMap(null);
    setMissionMode(false);
    setView("campaign");
    setSelectedPlace(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const backToCampaigns = useCallback(() => {
    setSelectedCampaignId(null);
    setCampaignMap(null);
    setMissionMode(false);
    setSelectedPlace(null);
    setView("campaigns");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const title =
    view === "campaign"
      ? campaignMap?.title || "Campagne"
      : view === "campaignInfo"
        ? campaignMap?.title || "Infos sur la tournée"
        : view === "preferences"
          ? "Mes lieux favoris"
          : "Campagnes en cours";

  const downloadCampaignDocument = async () => {
    if (!currentUser || !campaignMap?.attachment || !campaignMap.campaignId) return;
    setDownloadingCampaignDocument(true);
    setPageError("");
    try {
      const response = await fetch(`/api/tractation/${campaignMap.campaignId}/document`, {
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossible de télécharger le document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = campaignMap.attachment.fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Impossible de télécharger le document.",
      );
    } finally {
      setDownloadingCampaignDocument(false);
    }
  };

  return (
    <main
      className={`min-h-full bg-stone-50 p-4 sm:p-5 md:p-8 ${view === "campaign" ? "pb-[calc(7rem+env(safe-area-inset-bottom))]" : "pb-[max(2rem,env(safe-area-inset-bottom))]"}`}
    >
      <div
        className={`mx-auto w-full ${view === "campaign" ? "max-w-7xl space-y-4" : "max-w-4xl space-y-5"}`}
      >
        {view === "loading" ? (
          <div
            role="status"
            className="flex min-h-[55vh] items-center justify-center gap-3 text-sm text-stone-600"
          >
            <Loader2 size={20} className="animate-spin" />
            Préparation de votre espace…
          </div>
        ) : view === "setup" ? (
          <MemberPlacePreferences
            places={locations.map(({ id, nom }) => ({ id, nom }))}
            favoritePlaceIds={favoritePlaceIds}
            onFavoritesChange={handleFavoritesChange}
            onboarding
            onSetupComplete={completeSetup}
          />
        ) : (
          <>
            <header className="flex min-h-14 items-center gap-3 border-b border-stone-200 pb-3">
              {view !== "campaigns" && (
                <button
                  type="button"
                  onClick={() =>
                    view === "campaignInfo"
                      ? setView("campaign")
                      : view === "campaign"
                        ? backToCampaigns()
                        : setView("campaigns")
                  }
                  aria-label={
                    view === "campaignInfo"
                      ? "Retour à la tournée"
                      : view === "campaign"
                        ? "Retour aux campagnes"
                        : "Retour aux campagnes en cours"
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700"
                >
                  <ArrowLeft size={19} aria-hidden="true" />
                </button>
              )}
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                <MapPinned size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-black text-stone-900 sm:text-2xl">{title}</h1>
                <p className="mt-0.5 text-xs text-stone-600">
                  {view === "campaign"
                    ? "Carte et actions de cette campagne"
                    : view === "preferences"
                      ? "Sélection privée, modifiable à tout moment"
                      : "Choisissez une action près de chez vous"}
                </p>
              </div>
              {view === "campaigns" && canCreateCampaign && (
                <Link
                  href="/espace-membre/tournees/nouvelle-campagne"
                  aria-label="Créer une campagne"
                  className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-800 text-white"
                >
                  <Plus size={21} aria-hidden="true" />
                </Link>
              )}
              {view === "campaigns" && (
                <button
                  type="button"
                  onClick={() => setView("preferences")}
                  aria-label="Modifier mes lieux favoris"
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700"
                >
                  <Settings2 size={19} aria-hidden="true" />
                </button>
              )}
              {view === "campaign" && campaignMap && (
                <button
                  type="button"
                  onClick={() => setView("campaignInfo")}
                  aria-label="Infos sur la tournée"
                  title="Infos sur la tournée"
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700"
                >
                  <Info size={20} aria-hidden="true" />
                </button>
              )}
            </header>

            {pageError && (
              <p
                role="alert"
                className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              >
                {pageError}
              </p>
            )}

            {view === "campaigns" && (
              <section className="space-y-4" aria-label="Campagnes disponibles">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-800">Vos lieux favoris</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {favoritePlaceIds.length
                        ? `${favoritePlaceIds.length} lieu(x) enregistré(s)`
                        : "Aucun favori pour le moment"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("preferences")}
                    className="min-h-11 shrink-0 px-3 text-sm font-semibold text-emerald-900 underline underline-offset-2"
                  >
                    <Heart size={15} aria-hidden="true" className="mr-1 inline" />
                    Modifier
                  </button>
                </div>
                <TractationPanel
                  favoritePlaceIds={favoritePlaceIds}
                  onCanCreateChange={handleCanCreateChange}
                  onStatisticsVisibleChange={handleStatisticsVisibleChange}
                  onCampaignSelect={openCampaign}
                />
              </section>
            )}

            {view === "campaignInfo" && campaignMap && (
              <section id="campaign-info" className="mx-auto w-full max-w-3xl space-y-5">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-sm font-semibold uppercase text-emerald-800">
                    Informations de la campagne
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                    {campaignMap.message}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
                  <span>{campaignMap.places.length} secteurs ciblés</span>
                  <span>
                    {
                      Object.values(campaignMap.assignmentStatuses).filter(
                        (assignment) => assignment.status === "completed",
                      ).length
                    }{" "}
                    secteurs terminés
                  </span>
                </div>
                <section aria-labelledby="campaign-info-places" className="space-y-2">
                  <h2 id="campaign-info-places" className="font-bold text-stone-900">
                    Secteurs concernés
                  </h2>
                  <ul className="max-h-[45dvh] divide-y divide-stone-200 overflow-y-auto border-y border-stone-200">
                    {campaignMap.places.map((place) => (
                      <li
                        key={place.id}
                        className="flex min-h-12 items-center justify-between gap-3 py-2"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-stone-800">
                          {place.nom}
                        </span>
                        <span className="shrink-0 text-xs text-stone-500">
                          {place.foyers} foyers
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                {campaignMap.attachment && (
                  <button
                    type="button"
                    onClick={() => void downloadCampaignDocument()}
                    disabled={downloadingCampaignDocument}
                    className="btn-secondary min-h-11 px-4 py-2 text-sm"
                  >
                    {downloadingCampaignDocument ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowDownToLine size={16} aria-hidden="true" />
                    )}
                    {downloadingCampaignDocument
                      ? "Téléchargement…"
                      : campaignMap.attachment.fileName}
                  </button>
                )}
              </section>
            )}

            {view === "preferences" && (
              <MemberPlacePreferences
                places={locations.map(({ id, nom }) => ({ id, nom }))}
                favoritePlaceIds={favoritePlaceIds}
                onFavoritesChange={handleFavoritesChange}
              />
            )}

            {view === "campaign" && (
              <>
                <section id="places-map-section" className="scroll-mt-3 space-y-3">
                  {campaignMap?.routePlaceIds.length ? (
                    <div
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-4 border-blue-700 bg-blue-50 px-3 py-2 text-sm text-blue-950"
                      role="status"
                      aria-live="polite"
                    >
                      {roadRouteLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          Calcul de l’itinéraire dans l’ordre de votre tournée…
                        </>
                      ) : roadRoute ? (
                        <>
                          <MapPinned size={16} aria-hidden="true" />
                          <strong>
                            {(roadRoute.distanceMeters / 1000).toLocaleString("fr-FR", {
                              maximumFractionDigits: 1,
                            })}{" "}
                            km
                          </strong>
                          <span>·</span>
                          <strong>{Math.round(roadRoute.durationSeconds / 60)} min</strong>
                          <span className="text-xs">· ordre de la tournée respecté</span>
                        </>
                      ) : roadRouteError ? (
                        <>
                          <span>{roadRouteError}</span>
                          <button
                            type="button"
                            onClick={() => setRoadRouteRetry((value) => value + 1)}
                            className="font-semibold underline underline-offset-2"
                          >
                            Réessayer
                          </button>
                        </>
                      ) : !campaignMap.origin ? (
                        <span>
                          Définissez votre position de départ pour tracer la route. L’ordre des
                          étapes restera celui de votre tournée.
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {!campaignMap ? (
                    <div
                      role="status"
                      className="flex h-[70dvh] min-h-[440px] items-center justify-center gap-3 rounded-lg bg-stone-100 text-sm text-stone-500"
                    >
                      <Loader2 size={19} className="animate-spin" />
                      Chargement des secteurs…
                    </div>
                  ) : (
                    <OpenStreetMap
                      locations={mapLocations}
                      origin={campaignMap.origin}
                      originLabel="Départ de votre tournée"
                      favoritePlaceIds={favoritePlaceIds}
                      routePlaceIds={campaignMap.routePlaceIds}
                      assignmentStatuses={campaignMap.assignmentStatuses}
                      campaignMode
                      missionMode={missionMode}
                      campaignJoined={campaignMap.joined}
                      onAddToRoute={(placeId) => mapPlaceAdder.current?.(placeId)}
                      routeGeometry={roadRoute?.geometry}
                      showHouseholdCounts={showStatistics}
                      selectedPlace={selectedPlace}
                      onSelectPlace={setSelectedPlace}
                    />
                  )}
                  <div
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600"
                    aria-label="Légende de la carte"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="size-3 rounded-full border-2 border-blue-800 bg-blue-400" />
                      Disponible
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-3 rounded-full border-2 border-stone-600 bg-stone-300" />
                      Pris
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-3 rounded-full border-2 border-emerald-700 bg-emerald-400" />
                      Terminé
                    </span>
                    {showStatistics && (
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 rounded-full border-2 border-amber-800 bg-amber-300" />
                        Favori
                      </span>
                    )}
                  </div>
                </section>
                <TractationPanel
                  favoritePlaceIds={favoritePlaceIds}
                  onCanCreateChange={handleCanCreateChange}
                  onStatisticsVisibleChange={handleStatisticsVisibleChange}
                  onCampaignMapChange={handleCampaignMapChange}
                  selectedMapPlace={selectedPlace}
                  selectedCampaignId={selectedCampaignId}
                  showCampaignDetails={false}
                  onMissionModeChange={setMissionMode}
                  onCampaignSelect={openCampaign}
                  onRegisterMapPlaceAdder={registerMapPlaceAdder}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
