"use client";

// [SPEC-TRACTATION-01] One campaign list shared by map users; members join and track only their own visits.
import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpRight,
  Archive,
  Check,
  Compass,
  Heart,
  ListChecks,
  Loader2,
  MapPinned,
  MoreVertical,
  Navigation,
  Pencil,
  Plus,
  Save,
  Users,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { buildTourRouteSegments, type GeoPoint } from "@/lib/tourneeGeo";
import { sortCampaignPlaces } from "@/lib/campaignPlaceSorting";
import { suggestRouteOrder } from "@/lib/routeOrder";

type Place = {
  id: string;
  nom: string;
  foyers: number;
  lat: number | null;
  lon: number | null;
  hasCoordinates: boolean;
};
type PlaceAssignment = {
  status: "claimed" | "completed";
  isMine: boolean;
  memberName?: string;
};
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
type ArchivedCampaign = {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
  closedAt: string | null;
  closedByName: string;
  placeCount: number;
};
type PageData = {
  campaigns: Campaign[];
  places: Place[];
  canCreate: boolean;
  showStatistics: boolean;
  nextCursor: string | null;
};

export type CampaignMapState = {
  campaignId: string;
  title: string;
  message: string;
  joined: boolean;
  placeIds: string[];
  places: Array<Pick<Place, "id" | "nom" | "foyers">>;
  attachment: Campaign["attachment"];
  assignmentStatuses: Record<string, { status: "claimed" | "completed"; memberName?: string }>;
  routePlaceIds: string[];
  previewPlaceIds: string[] | null;
  draftPlaceIds: string[];
  runningRoute: boolean;
  missionActive: boolean;
  origin: GeoPoint | null;
};

interface TractationPanelProps {
  favoritePlaceIds: string[];
  suggestionOrigin?: GeoPoint | null;
  onCanCreateChange?: (canCreate: boolean) => void;
  onStatisticsVisibleChange?: (visible: boolean) => void;
  onCampaignMapChange?: (campaign: CampaignMapState | null) => void;
  onMissionModeChange?: (active: boolean) => void;
  onFirstTourGuideEvent?: (
    event:
      | "select-sectors"
      | "preview-route"
      | "resume-tour"
      | "tour-reserved"
      | "tour-finished"
      | "tour-cancelled",
  ) => void;
  selectedMapPlace?: Pick<Place, "id" | "nom" | "foyers"> | null;
  selectedCampaignId?: string | null;
  showCampaignDetails?: boolean;
  editCampaignRequested?: boolean;
  onCampaignEditClose?: () => void;
  onCampaignSelect?: (campaignId: string) => void;
  onRegisterMapPlaceAdder?: (handler: (placeId: string) => void) => void;
}

class TractationRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly placeId?: string,
  ) {
    super(message);
  }
}

async function request(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new TractationRequestError(
      data?.error || "La requête a échoué.",
      response.status,
      data?.placeId,
    );
  return data;
}

function googleMapsRouteUrl(origin: GeoPoint, destination: GeoPoint, waypoints: GeoPoint[]) {
  const query = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: "driving",
  });
  if (waypoints.length)
    query.set("waypoints", waypoints.map((point) => `${point.lat},${point.lon}`).join("|"));
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

export default function TractationPanel({
  favoritePlaceIds,
  suggestionOrigin = null,
  onCanCreateChange,
  onStatisticsVisibleChange,
  onCampaignMapChange,
  onMissionModeChange,
  onFirstTourGuideEvent,
  selectedMapPlace = null,
  selectedCampaignId = null,
  showCampaignDetails = true,
  editCampaignRequested = false,
  onCampaignEditClose,
  onCampaignSelect,
  onRegisterMapPlaceAdder,
}: TractationPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [archivedCampaigns, setArchivedCampaigns] = useState<ArchivedCampaign[]>([]);
  const [archivedCursor, setArchivedCursor] = useState<string | null>(null);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState("");
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
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
  const [cancellingRoute, setCancellingRoute] = useState<string | null>(null);
  const [routeToCancel, setRouteToCancel] = useState<Campaign | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const [mapCampaignId, setMapCampaignId] = useState<string | null>(null);
  const [missionCampaignId, setMissionCampaignId] = useState<string | null>(null);
  const [missionSheet, setMissionSheet] = useState<"select" | "preview" | "run">("select");
  const [missionPlaceFilter, setMissionPlaceFilter] = useState<"all" | "favorites">("all");
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const routeDetailsTouchStart = useRef<{
    y: number;
    scrollTop: number;
  } | null>(null);
  const missionSheetDragStart = useRef<number | null>(null);
  const locationRequestId = useRef(0);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editPlaceIds, setEditPlaceIds] = useState<string[]>([]);
  const [editPlaceSearch, setEditPlaceSearch] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  useEffect(() => {
    if (!editCampaignRequested || !canCreate || !selectedCampaignId || loading) return;
    const campaign = campaigns.find((item) => item.id === selectedCampaignId);
    if (!campaign || editingCampaignId === campaign.id) return;
    setEditTitle(campaign.title);
    setEditMessage(campaign.message);
    setEditPlaceIds(campaign.lieuDits.map((place) => place.id));
    setEditPlaceSearch("");
    setEditingCampaignId(campaign.id);
  }, [editCampaignRequested, canCreate, selectedCampaignId, loading, campaigns, editingCampaignId]);

  useEffect(() => {
    if (routeToCancel && !cancelDialogRef.current?.open) cancelDialogRef.current?.showModal();
  }, [routeToCancel]);

  const load = useCallback(
    async (currentUser: User, cursor?: string | null) => {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const data = (await request(currentUser, `/api/tractation${query}`)) as PageData;
      setCampaigns((previous) => (cursor ? [...previous, ...data.campaigns] : data.campaigns));
      if (!cursor) setAvailablePlaces(data.places || []);
      setCanCreate(data.canCreate);
      setNextCursor(data.nextCursor);
      onCanCreateChange?.(data.canCreate);
      onStatisticsVisibleChange?.(data.showStatistics === true);
    },
    [onCanCreateChange, onStatisticsVisibleChange],
  );

  const loadArchived = useCallback(async (currentUser: User, cursor?: string | null) => {
    setArchivedLoading(true);
    setArchivedError("");
    try {
      const query = new URLSearchParams({ status: "closed" });
      if (cursor) query.set("cursor", cursor);
      const data = (await request(currentUser, `/api/tractation?${query}`)) as {
        campaigns: ArchivedCampaign[];
        nextCursor: string | null;
      };
      setArchivedCampaigns((previous) =>
        cursor ? [...previous, ...data.campaigns] : data.campaigns,
      );
      setArchivedCursor(data.nextCursor);
    } catch (loadError) {
      setArchivedError(
        loadError instanceof Error ? loadError.message : "Impossible de charger les archives.",
      );
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const getRouteDraft = useCallback(
    (campaign: Campaign) => routeDrafts[campaign.id] ?? [],
    [routeDrafts],
  );

  const getRouteOrigin = useCallback(
    (campaignId: string) => routeOrigins[campaignId] || suggestionOrigin,
    [routeOrigins, suggestionOrigin],
  );

  useEffect(
    () => () => {
      locationRequestId.current += 1;
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      void Promise.all([load(currentUser), loadArchived(currentUser)])
        .catch((err) => {
          if (active)
            setError(err instanceof Error ? err.message : "Impossible de charger les campagnes.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [load, loadArchived]);

  useEffect(() => {
    if (!mapCampaignId) {
      onCampaignMapChange?.(null);
      return;
    }
    const campaign = campaigns.find((item) => item.id === mapCampaignId);
    if (!campaign) return;
    const assignmentStatuses = Object.fromEntries(
      Object.entries(campaign.assignedPlaces || {}).map(([id, assignment]) => [
        id,
        { status: assignment.status, memberName: assignment.memberName },
      ]),
    );
    onCampaignMapChange?.({
      campaignId: campaign.id,
      title: campaign.title,
      message: campaign.message,
      joined: campaign.joined,
      placeIds: campaign.lieuDits.map((place) => place.id),
      places: campaign.lieuDits.map(({ id, nom, foyers }) => ({ id, nom, foyers })),
      attachment: campaign.attachment,
      assignmentStatuses,
      routePlaceIds: campaign.myRoutePlaceIds || [],
      previewPlaceIds:
        missionCampaignId === campaign.id && missionSheet === "preview"
          ? getRouteDraft(campaign)
          : null,
      draftPlaceIds:
        campaign.joined &&
        !campaign.myRoutePlaceIds.some(
          (id) => campaign.assignedPlaces?.[id]?.status === "claimed",
        ) &&
        (missionCampaignId !== campaign.id || missionSheet === "select")
          ? getRouteDraft(campaign)
          : [],
      runningRoute:
        missionCampaignId === campaign.id &&
        missionSheet === "run" &&
        campaign.myRoutePlaceIds.some((id) => campaign.assignedPlaces?.[id]?.status === "claimed"),
      missionActive: missionCampaignId === campaign.id,
      origin: getRouteOrigin(campaign.id),
    });
  }, [
    mapCampaignId,
    campaigns,
    onCampaignMapChange,
    missionCampaignId,
    missionSheet,
    getRouteDraft,
    getRouteOrigin,
  ]);

  useEffect(() => {
    onRegisterMapPlaceAdder?.((placeId) => {
      const campaign = campaigns.find((item) => item.id === selectedCampaignId);
      if (!campaign || !campaign.joined) return;
      const place = campaign.lieuDits.find((item) => item.id === placeId);
      if (!place || !place.hasCoordinates || campaign.assignedPlaces?.[placeId]) return;
      setMissionCampaignId(campaign.id);
      setMapCampaignId(campaign.id);
      onMissionModeChange?.(true);
      onFirstTourGuideEvent?.("select-sectors");
      setMissionSheet("select");
      setShowRouteDetails(false);
      setError("");
      if (missionCampaignId !== campaign.id) locateCampaign(campaign.id);
      setRouteDrafts((current) => {
        const currentIds = current[campaign.id] ?? getRouteDraft(campaign);
        if (currentIds.includes(placeId) || currentIds.length >= 200) return current;
        return { ...current, [campaign.id]: [...currentIds, placeId] };
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(16);
    });
  }, [
    campaigns,
    selectedCampaignId,
    missionCampaignId,
    onRegisterMapPlaceAdder,
    onMissionModeChange,
    onFirstTourGuideEvent,
    getRouteDraft,
  ]);

  useEffect(() => {
    setMapCampaignId(selectedCampaignId);
  }, [selectedCampaignId]);

  useEffect(() => {
    setRouteOrigins({});
  }, [suggestionOrigin]);

  const getRouteSegments = (campaign: Campaign) => {
    const origin = getRouteOrigin(campaign.id);
    if (!origin) return [];
    const stops = (campaign.myRoutePlaceIds || []).flatMap((id) => {
      const place = campaign.lieuDits.find((item) => item.id === id);
      return place && Number.isFinite(place.lat) && Number.isFinite(place.lon)
        ? [{ lat: place.lat as number, lon: place.lon as number }]
        : [];
    });
    return buildTourRouteSegments(origin, stops);
  };

  const missionCampaign = campaigns.find((campaign) => campaign.id === missionCampaignId) || null;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || null;
  const resumableCampaign =
    campaigns.find(
      (campaign) =>
        campaign.id === selectedCampaignId &&
        campaign.joined &&
        campaign.myRoutePlaceIds.length > 0,
    ) || null;
  const resumableRouteInProgress =
    resumableCampaign?.myRoutePlaceIds.some(
      (id) => resumableCampaign.assignedPlaces?.[id]?.status !== "completed",
    ) || false;
  const missionDraft = missionCampaign ? getRouteDraft(missionCampaign) : [];
  const missionRoute = missionCampaign?.myRoutePlaceIds || [];
  const missionNextPlace = missionCampaign
    ? missionRoute.find(
        (placeId) => missionCampaign.assignedPlaces?.[placeId]?.status !== "completed",
      )
    : undefined;
  const missionSelectedPlace =
    missionCampaign?.lieuDits.find((place) => place.id === selectedMapPlace?.id) || null;
  const missionPlaces = missionCampaign
    ? sortCampaignPlaces(
        missionCampaign.lieuDits.filter(
          (place) => missionPlaceFilter === "all" || favoritePlaceIds.includes(place.id),
        ),
        missionCampaign.assignedPlaces,
        getRouteOrigin(missionCampaign.id),
      )
    : [];

  useEffect(() => {
    if (!showRouteDetails || !missionCampaignId) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousRootOverflow = root.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";

    return () => {
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      root.style.overflow = previousRootOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [showRouteDetails, missionCampaignId]);

  const openMission = (campaign: Campaign, preview = false) => {
    setMissionCampaignId(campaign.id);
    setMapCampaignId(campaign.id);
    onMissionModeChange?.(!preview);
    const routeInProgress = campaign.myRoutePlaceIds.some(
      (id) => campaign.assignedPlaces?.[id]?.status !== "completed",
    );
    setMissionSheet(routeInProgress ? "run" : preview ? "preview" : "select");
    locateCampaign(
      campaign.id,
      preview && !routeInProgress ? (origin) => optimizeRouteDraft(campaign, origin) : undefined,
    );
    onFirstTourGuideEvent?.(
      routeInProgress ? "resume-tour" : preview ? "preview-route" : "select-sectors",
    );
    setMissionPlaceFilter("all");
    setShowRouteDetails(false);
    window.setTimeout(
      () =>
        document
          .getElementById("places-map-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };

  const closeMission = () => {
    locationRequestId.current += 1;
    setLocatingCampaign(null);
    setMissionCampaignId(null);
    setShowRouteDetails(false);
    missionSheetDragStart.current = null;
    onMissionModeChange?.(false);
  };

  const beginCampaignEdit = (campaign: Campaign) => {
    setEditTitle(campaign.title);
    setEditMessage(campaign.message);
    setEditPlaceIds(campaign.lieuDits.map((place) => place.id));
    setEditPlaceSearch("");
    setError("");
    setEditingCampaignId(campaign.id);
  };

  const closeCampaignEdit = () => {
    setEditingCampaignId(null);
    onCampaignEditClose?.();
  };

  const toggleCampaignPlace = (campaign: Campaign, placeId: string) => {
    const assignment = campaign.assignedPlaces?.[placeId];
    if (assignment && editPlaceIds.includes(placeId)) return;
    setEditPlaceIds((current) =>
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : current.length < 200
          ? [...current, placeId]
          : current,
    );
  };

  const saveCampaignEdit = async (campaign: Campaign) => {
    if (!user || !editPlaceIds.length) return;
    setSavingCampaign(true);
    setError("");
    try {
      await request(user, `/api/tractation/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          message: editMessage,
          lieuDitIds: editPlaceIds,
        }),
      });
      await load(user);
      closeCampaignEdit();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Impossible de modifier cette campagne.",
      );
    } finally {
      setSavingCampaign(false);
    }
  };

  const addSelectedMapPlace = (campaign: Campaign) => {
    if (
      !missionSelectedPlace ||
      !missionSelectedPlace.hasCoordinates ||
      campaign.assignedPlaces?.[missionSelectedPlace.id]
    )
      return;
    toggleRouteDraftPlace(campaign, missionSelectedPlace.id);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
  };

  const toggleRouteDraftPlace = (campaign: Campaign, placeId: string) => {
    setRouteDrafts((current) => {
      const currentIds = current[campaign.id] ?? getRouteDraft(campaign);
      return {
        ...current,
        [campaign.id]: currentIds.includes(placeId)
          ? currentIds.filter((id) => id !== placeId)
          : currentIds.length < 200
            ? [...currentIds, placeId]
            : currentIds,
      };
    });
  };

  const moveRouteDraftPlace = (campaign: Campaign, index: number, direction: -1 | 1) => {
    setRouteDrafts((current) => {
      const ids = [...(current[campaign.id] ?? getRouteDraft(campaign))];
      const destination = index + direction;
      if (destination < 0 || destination >= ids.length) return current;
      [ids[index], ids[destination]] = [ids[destination], ids[index]];
      return { ...current, [campaign.id]: ids };
    });
  };

  const optimizeRouteDraft = (campaign: Campaign, origin = getRouteOrigin(campaign.id)) => {
    setRouteDrafts((current) => {
      const draft = current[campaign.id] ?? getRouteDraft(campaign);
      const places = draft.flatMap((id) => {
        const place = campaign.lieuDits.find((item) => item.id === id);
        return place && place.lat !== null && place.lon !== null
          ? [{ id, lat: place.lat, lon: place.lon }]
          : [];
      });
      return { ...current, [campaign.id]: suggestRouteOrder(places, origin) };
    });
  };

  const locateCampaign = (campaignId: string, onLocated?: (origin: GeoPoint | null) => void) => {
    const requestId = ++locationRequestId.current;
    setError("");
    setRouteOrigins((current) => ({ ...current, [campaignId]: null }));
    if (!navigator.geolocation) {
      setError(
        "La géolocalisation n’est pas disponible dans ce navigateur. L’ordre reste modifiable.",
      );
      onLocated?.(suggestionOrigin);
      return;
    }
    setLocatingCampaign(campaignId);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestId.current) return;
        const origin = { lat: position.coords.latitude, lon: position.coords.longitude };
        setRouteOrigins((current) => ({
          ...current,
          [campaignId]: origin,
        }));
        setLocatingCampaign(null);
        onLocated?.(origin);
      },
      (geoError) => {
        if (requestId !== locationRequestId.current) return;
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Autorisez la géolocalisation pour classer les secteurs depuis votre position."
            : "Impossible d’obtenir votre position. L’ordre reste modifiable.",
        );
        setLocatingCampaign(null);
        onLocated?.(suggestionOrigin);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const openPreview = (campaign: Campaign) => {
    if (locatingCampaign === campaign.id) return;
    optimizeRouteDraft(campaign);
    setShowRouteDetails(false);
    setMissionSheet("preview");
    onFirstTourGuideEvent?.("preview-route");
  };

  // [SPEC-TRACTATION-05] A member takes every selected campaign stop in one atomic request.
  const claimRoute = async (campaign: Campaign) => {
    if (!user || missionSheet !== "preview") return;
    const routePlaceIds = getRouteDraft(campaign);
    if (!routePlaceIds.length) return;
    setClaimingRoute(campaign.id);
    setError("");
    try {
      await request(user, `/api/tractation/${campaign.id}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lieuDitIds: routePlaceIds }),
      });
      onFirstTourGuideEvent?.("tour-reserved");
      setRouteDrafts((current) => ({ ...current, [campaign.id]: [] }));
      setMissionSheet("run");
      if (typeof navigator !== "undefined" && "vibrate" in navigator)
        navigator.vibrate([18, 35, 18]);
      await load(user);
    } catch (routeError) {
      if (
        routeError instanceof TractationRequestError &&
        routeError.status === 409 &&
        routeError.placeId
      ) {
        setRouteDrafts((current) => ({
          ...current,
          [campaign.id]: getRouteDraft(campaign).filter((id) => id !== routeError.placeId),
        }));
        setMissionSheet("select");
        setError(
          `${routeError.message} Le secteur concerné a été retiré; vous pouvez valider le reste de votre tournée.`,
        );
      } else {
        setError(
          routeError instanceof Error ? routeError.message : "Impossible de prendre cette tournée.",
        );
      }
      await load(user).catch(() => undefined);
    } finally {
      setClaimingRoute(null);
    }
  };

  const cancelRoute = async (campaign: Campaign) => {
    if (!user) return;
    setCancellingRoute(campaign.id);
    setError("");
    try {
      await request(user, `/api/tractation/${campaign.id}/route`, { method: "DELETE" });
      setRouteDrafts((current) => ({ ...current, [campaign.id]: [] }));
      closeMission();
      await load(user);
      onFirstTourGuideEvent?.("tour-cancelled");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Impossible d’annuler cette tournée.",
      );
    } finally {
      setCancellingRoute(null);
    }
  };

  const join = async (campaignId: string) => {
    if (!user) return;
    setBusy(campaignId);
    setError("");
    try {
      await request(user, `/api/tractation/${campaignId}/join`, {
        method: "POST",
      });
      setCampaigns((previous) =>
        previous.map((campaign) =>
          campaign.id === campaignId ? { ...campaign, joined: true } : campaign,
        ),
      );
      const campaign = campaigns.find((item) => item.id === campaignId);
      if (campaign) openMission({ ...campaign, joined: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de rejoindre la campagne.");
    } finally {
      setBusy("");
    }
  };

  const updateAssignment = async (
    campaign: Campaign,
    place: Place,
    action: "claim" | "complete" | "release" | "reopen",
  ) => {
    if (!user) return;
    const key = `${campaign.id}:${place.id}`;
    setBusy(key);
    setError("");
    try {
      const result = (await request(user, `/api/tractation/${campaign.id}/places/${place.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })) as {
        status: PlaceAssignment["status"] | null;
        isMine: boolean;
        memberName?: string;
      };
      setCampaigns((previous) =>
        previous.map((item) =>
          item.id !== campaign.id
            ? item
            : {
                ...item,
                assignedPlaces: result.status
                  ? {
                      ...item.assignedPlaces,
                      [place.id]: {
                        status: result.status,
                        isMine: result.isMine,
                        memberName: result.memberName || item.assignedPlaces[place.id]?.memberName,
                      },
                    }
                  : Object.fromEntries(
                      Object.entries(item.assignedPlaces).filter(([id]) => id !== place.id),
                    ),
                myRoutePlaceIds:
                  action === "release"
                    ? item.myRoutePlaceIds.filter((id) => id !== place.id)
                    : item.myRoutePlaceIds,
              },
        ),
      );
      if (action === "complete" && typeof navigator !== "undefined" && "vibrate" in navigator)
        navigator.vibrate([18, 35, 18]);
      if (
        action === "complete" &&
        result.status === "completed" &&
        campaign.myRoutePlaceIds.includes(place.id) &&
        campaign.myRoutePlaceIds.every(
          (id) => id === place.id || campaign.assignedPlaces?.[id]?.status === "completed",
        )
      ) {
        onFirstTourGuideEvent?.("tour-finished");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de réserver ce lieu.");
      if (user) await load(user).catch(() => undefined);
    } finally {
      setBusy("");
    }
  };

  const download = async (campaign: Campaign) => {
    if (!user || !campaign.attachment) return;
    setBusy(`download:${campaign.id}`);
    setError("");
    try {
      const response = await fetch(`/api/tractation/${campaign.id}/document`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossible de télécharger le document.");
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = campaign.attachment.fileName;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de télécharger le document.");
    } finally {
      setBusy("");
    }
  };

  const replaceDocument = async (campaignId: string) => {
    if (!user || !replacementFiles[campaignId]) return;
    const selectedFile = replacementFiles[campaignId]!;
    if (
      selectedFile.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)
    ) {
      setError("Choisissez un PDF ou une image de 10 Mio maximum.");
      return;
    }
    const key = `upload:${campaignId}`;
    setBusy(key);
    setError("");
    try {
      await request(user, `/api/tractation/${campaignId}/document`, {
        method: "POST",
        headers: {
          "Content-Type": selectedFile.type,
          "X-File-Name": encodeURIComponent(selectedFile.name),
        },
        body: selectedFile,
      });
      setReplacementFiles((previous) => ({ ...previous, [campaignId]: null }));
      await load(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le document.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section
      id={selectedCampaignId ? "campaign-details" : undefined}
      className={`${selectedCampaignId && !showCampaignDetails ? "space-y-0 border-0 pt-0" : "space-y-3 border-t border-stone-200 pt-4"}`}
      aria-labelledby={
        selectedCampaignId && !showCampaignDetails ? undefined : "ongoing-campaigns-title"
      }
      aria-label={selectedCampaignId && !showCampaignDetails ? "Actions de la campagne" : undefined}
    >
      {(!selectedCampaignId || showCampaignDetails) && (
        <div className="flex items-center justify-between gap-3">
          <h2 id="ongoing-campaigns-title" className="text-lg font-bold text-stone-900">
            {selectedCampaignId ? "Détails de la campagne" : "Campagnes en cours"}
          </h2>
          <span className="text-xs text-stone-500">{campaigns.length}</span>
        </div>
      )}
      {(!selectedCampaignId || showCampaignDetails) && error && (
        <p
          role="alert"
          className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {selectedCampaignId && !showCampaignDetails && !editCampaignRequested ? null : loading ? (
        <p role="status" className="py-6 text-center text-sm text-stone-500">
          <Loader2 size={17} className="mr-2 inline animate-spin" />
          Chargement…
        </p>
      ) : campaigns.length === 0 ? (
        <p className="border-y border-stone-200 py-6 text-sm text-stone-600">
          Aucune campagne en cours.
        </p>
      ) : (
        <div
          className={
            selectedCampaignId ? "" : "divide-y divide-stone-200 border-y border-stone-200"
          }
        >
          {campaigns
            .filter((campaign) => !selectedCampaignId || campaign.id === selectedCampaignId)
            .map((campaign) => {
              const takenCount = Object.keys(campaign.assignedPlaces || {}).length;
              const completedCount = campaign.lieuDits.filter(
                (place) => campaign.assignedPlaces?.[place.id]?.status === "completed",
              ).length;
              const progressPercent = campaign.lieuDits.length
                ? Math.round((completedCount / campaign.lieuDits.length) * 100)
                : 0;
              const myRoutePlaceIds = campaign.myRoutePlaceIds || [];
              const routeDraft = getRouteDraft(campaign);
              const routeSegments = getRouteSegments(campaign);
              const orderedCampaignPlaces = sortCampaignPlaces(
                campaign.lieuDits,
                campaign.assignedPlaces,
                getRouteOrigin(campaign.id),
              );
              if (!selectedCampaignId)
                return (
                  <article
                    key={campaign.id}
                    className="space-y-3 border-b border-stone-200 py-4 last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                        <MapPinned size={22} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-stone-900">
                          {campaign.title}
                        </span>
                        <span className="mt-1 block text-xs text-stone-600">
                          {completedCount}/{campaign.lieuDits.length} secteurs terminés ·{" "}
                          {campaign.lieuDits.length - takenCount} disponibles
                        </span>
                        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-stone-100">
                          <span
                            className="block h-full rounded-full bg-emerald-600"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-emerald-900">
                          {progressPercent}% couvert
                        </span>
                      </span>
                    </div>
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                      {campaign.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMapCampaignId(campaign.id);
                        onCampaignSelect?.(campaign.id);
                      }}
                      className="btn-primary min-h-12 w-full justify-center px-4 text-base"
                    >
                      <MapPinned size={18} aria-hidden="true" />
                      {campaign.joined ? "Ouvrir la campagne" : "Découvrir la campagne"}
                    </button>
                  </article>
                );

              return (
                <article key={campaign.id} className="space-y-4">
                  <div className="space-y-3 py-3 pl-0 sm:pl-12">
                    {canCreate && editingCampaignId !== campaign.id && (
                      <button
                        type="button"
                        onClick={() => beginCampaignEdit(campaign)}
                        className="btn-secondary min-h-11 px-4 py-2 text-sm"
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Modifier la campagne
                      </button>
                    )}
                    {editingCampaignId === campaign.id ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void saveCampaignEdit(campaign);
                        }}
                        className="space-y-4 rounded-xl border border-stone-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-bold text-stone-900">
                            Modifier la campagne
                          </h3>
                          <button
                            type="button"
                            onClick={closeCampaignEdit}
                            aria-label="Annuler la modification"
                            className="grid size-10 place-items-center rounded-md text-stone-600 hover:bg-stone-100"
                          >
                            <X size={18} aria-hidden="true" />
                          </button>
                        </div>
                        <label className="block text-sm font-semibold text-stone-800">
                          Titre
                          <input
                            required
                            minLength={3}
                            maxLength={120}
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.currentTarget.value)}
                            className="input-base mt-1 min-h-11"
                          />
                        </label>
                        <label className="block text-sm font-semibold text-stone-800">
                          Consignes
                          <textarea
                            required
                            maxLength={4000}
                            rows={5}
                            value={editMessage}
                            onChange={(event) => setEditMessage(event.currentTarget.value)}
                            className="input-base mt-1 resize-y"
                          />
                        </label>
                        <fieldset>
                          <legend className="text-sm font-semibold text-stone-800">
                            Secteurs ciblés{" "}
                            <span className="font-normal text-stone-500">
                              ({editPlaceIds.length}/200)
                            </span>
                          </legend>
                          <input
                            type="search"
                            value={editPlaceSearch}
                            onChange={(event) => setEditPlaceSearch(event.currentTarget.value)}
                            aria-label="Rechercher un secteur à cibler"
                            placeholder="Rechercher un lieu-dit"
                            className="input-base mt-2 min-h-11"
                          />
                          <ul className="mt-2 max-h-[35dvh] divide-y divide-stone-200 overflow-y-auto border-y border-stone-200">
                            {availablePlaces
                              .filter(
                                (place) =>
                                  !editPlaceSearch.trim() ||
                                  place.nom
                                    .toLocaleLowerCase("fr")
                                    .includes(editPlaceSearch.trim().toLocaleLowerCase("fr")),
                              )
                              .map((place) => {
                                const assignment = campaign.assignedPlaces?.[place.id];
                                const checked = editPlaceIds.includes(place.id);
                                const locked = Boolean(assignment && checked);
                                const isBusy = busy === `${campaign.id}:${place.id}`;
                                return (
                                  <li key={place.id}>
                                    <div className="grid min-w-0 gap-1 rounded-md px-2 py-1 hover:bg-stone-50">
                                      <label
                                        className={`flex min-h-11 min-w-0 items-center gap-3 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={
                                            locked || (!checked && editPlaceIds.length >= 200)
                                          }
                                          onChange={() => toggleCampaignPlace(campaign, place.id)}
                                          className="size-5 shrink-0 accent-emerald-700"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                                          {place.nom}
                                        </span>
                                      </label>
                                      {assignment && (
                                        <div className="flex min-w-0 items-center justify-between gap-2 pl-8">
                                          <span className="min-w-0 flex-1 break-words text-xs font-semibold text-stone-600">
                                            {assignment.status === "completed"
                                              ? `Terminé par ${assignment.memberName || "un membre"}`
                                              : `Déjà pris par ${assignment.memberName || "un membre"}`}
                                          </span>
                                          {canCreate && (
                                            <details className="relative shrink-0">
                                              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md border border-stone-300 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
                                                Gérer
                                              </summary>
                                              <div className="absolute right-0 z-40 mt-1 grid w-48 max-w-[calc(100vw-2rem)] gap-1 rounded-md border border-stone-200 bg-white p-1 shadow-lg">
                                                {assignment.status === "claimed" ? (
                                                  <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                      void updateAssignment(
                                                        campaign,
                                                        place,
                                                        "complete",
                                                      )
                                                    }
                                                    className="min-h-11 rounded px-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                                                  >
                                                    Marquer fait
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                      void updateAssignment(
                                                        campaign,
                                                        place,
                                                        "reopen",
                                                      )
                                                    }
                                                    className="min-h-11 rounded px-3 text-left text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                                  >
                                                    Marquer non fait
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  disabled={isBusy}
                                                  onClick={() =>
                                                    void updateAssignment(
                                                      campaign,
                                                      place,
                                                      "release",
                                                    )
                                                  }
                                                  className="min-h-11 rounded px-3 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                                                >
                                                  Désattribuer le lieu
                                                </button>
                                              </div>
                                            </details>
                                          )}
                                          {isBusy && (
                                            <Loader2
                                              size={15}
                                              className="shrink-0 animate-spin text-stone-500"
                                              aria-label="Mise à jour en cours"
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                          <p className="mt-1 text-xs text-stone-500">
                            Un secteur déjà pris ou terminé ne peut pas être retiré.
                          </p>
                        </fieldset>
                        {error && (
                          <p
                            role="alert"
                            className="border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                          >
                            {error}
                          </p>
                        )}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={closeCampaignEdit}
                            className="btn-secondary min-h-11 justify-center px-4"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={savingCampaign || editPlaceIds.length === 0}
                            className="btn-primary min-h-12 justify-center px-4"
                          >
                            {savingCampaign ? (
                              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                            ) : (
                              <Save size={17} aria-hidden="true" />
                            )}
                            {savingCampaign ? "Enregistrement…" : "Enregistrer les modifications"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {campaign.message}
                      </p>
                    )}
                    {campaign.attachment && (
                      <button
                        type="button"
                        onClick={() => void download(campaign)}
                        disabled={busy === `download:${campaign.id}`}
                        className="btn-secondary min-h-10 px-3 py-2 text-sm"
                      >
                        <ArrowDownToLine size={16} />
                        Télécharger le document
                      </button>
                    )}
                    <fieldset className="hidden lg:block">
                      <legend className="mb-2 text-sm font-semibold text-stone-800">
                        Lieux de la campagne
                      </legend>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {orderedCampaignPlaces.map((place) => {
                          const assignment = campaign.assignedPlaces?.[place.id];
                          const isBusy = busy === `${campaign.id}:${place.id}`;
                          const routeStep = myRoutePlaceIds.indexOf(place.id);
                          return (
                            <div
                              key={place.id}
                              className="flex min-h-12 items-center gap-2 rounded-md px-2 hover:bg-stone-50"
                            >
                              <label
                                className={`flex min-w-0 flex-1 items-center gap-3 ${campaign.joined && (!assignment || assignment.isMine) ? "cursor-pointer" : "cursor-default"}`}
                              >
                                {!myRoutePlaceIds.length && campaign.joined && !assignment && (
                                  <input
                                    type="checkbox"
                                    checked={routeDraft.includes(place.id)}
                                    disabled={
                                      claimingRoute === campaign.id ||
                                      !place.hasCoordinates ||
                                      (routeDraft.length >= 200 && !routeDraft.includes(place.id))
                                    }
                                    onChange={() => toggleRouteDraftPlace(campaign, place.id)}
                                    aria-label={`${routeDraft.includes(place.id) ? "Retirer de" : "Ajouter à"} ma tournée : ${place.nom}`}
                                    className="size-4 accent-emerald-700"
                                  />
                                )}
                                {routeStep >= 0 && (
                                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                                    {routeStep + 1}
                                  </span>
                                )}
                                <span className="min-w-0 truncate text-sm">{place.nom}</span>
                              </label>
                              {assignment && (
                                <span
                                  className={`shrink-0 text-xs font-medium ${assignment.status === "completed" ? "text-emerald-800" : assignment.isMine ? "text-blue-800" : "text-stone-500"}`}
                                >
                                  {assignment.status === "completed"
                                    ? `Fait par ${assignment.memberName || "un membre"}`
                                    : assignment.isMine
                                      ? "Vous le prenez"
                                      : `Pris par ${assignment.memberName || "un membre"}`}
                                </span>
                              )}
                              {assignment &&
                                (canCreate || (campaign.joined && assignment.isMine)) &&
                                assignment.status === "claimed" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      void updateAssignment(campaign, place, "complete")
                                    }
                                    className="min-h-10 shrink-0 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                                  >
                                    {isBusy ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      "Marquer fait"
                                    )}
                                  </button>
                                )}
                              {assignment &&
                                (canCreate || (campaign.joined && assignment.isMine)) &&
                                assignment.status === "claimed" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      void updateAssignment(campaign, place, "release")
                                    }
                                    aria-label={`${assignment.isMine ? "Libérer" : "Désattribuer"} ${place.nom}`}
                                    className="min-h-10 shrink-0 px-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                                  >
                                    {assignment.isMine ? "Libérer" : "Désattribuer"}
                                  </button>
                                )}
                              {assignment &&
                                (canCreate || (campaign.joined && assignment.isMine)) &&
                                assignment.status === "completed" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void updateAssignment(campaign, place, "reopen")}
                                    aria-label={`Marquer ${place.nom} comme non fait`}
                                    className="min-h-10 shrink-0 px-2 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                                  >
                                    {isBusy ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      "Marquer non fait"
                                    )}
                                  </button>
                                )}
                              {campaign.joined && !assignment && !place.hasCoordinates && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void updateAssignment(campaign, place, "claim")}
                                  className="min-h-10 shrink-0 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                                >
                                  Prendre le lieu
                                </button>
                              )}
                              {!assignment && (
                                <span className="shrink-0 text-xs text-stone-500">Disponible</span>
                              )}
                              {isBusy && (
                                <Loader2
                                  size={14}
                                  className="shrink-0 animate-spin text-stone-500"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </fieldset>
                    {missionCampaignId === campaign.id && missionSheet === "preview" && (
                      <section
                        className="hidden space-y-3 border-t border-stone-200 pt-4 lg:block"
                        aria-label="Aperçu de ma tournée"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-stone-900">
                            Aperçu de ma tournée
                          </h3>
                          <button
                            type="button"
                            onClick={closeMission}
                            className="btn-secondary min-h-10 px-3 text-sm"
                          >
                            Retour aux secteurs
                          </button>
                        </div>
                        <ol
                          className="divide-y divide-stone-200 border-y border-stone-200"
                          aria-label="Ordre des étapes de la tournée"
                        >
                          {routeDraft.map((placeId, index) => {
                            const place = campaign.lieuDits.find((item) => item.id === placeId);
                            if (!place) return null;
                            return (
                              <li key={placeId} className="flex min-h-12 items-center gap-2 py-1">
                                <span className="grid size-7 place-items-center rounded-full bg-blue-800 text-xs font-bold text-white">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1 text-sm font-semibold">
                                  {place.nom}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => moveRouteDraftPlace(campaign, index, -1)}
                                  disabled={
                                    index === 0 ||
                                    claimingRoute === campaign.id ||
                                    locatingCampaign === campaign.id
                                  }
                                  aria-label={`Monter ${place.nom}`}
                                  className="grid size-10 place-items-center disabled:opacity-30"
                                >
                                  <ArrowUp size={17} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveRouteDraftPlace(campaign, index, 1)}
                                  disabled={
                                    index === routeDraft.length - 1 ||
                                    claimingRoute === campaign.id ||
                                    locatingCampaign === campaign.id
                                  }
                                  aria-label={`Descendre ${place.nom}`}
                                  className="grid size-10 place-items-center disabled:opacity-30"
                                >
                                  <ArrowDown size={17} aria-hidden="true" />
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                        {locatingCampaign === campaign.id && (
                          <p role="status" className="text-sm text-stone-600">
                            Mise à jour de votre position…
                          </p>
                        )}
                        {error && (
                          <p role="alert" className="text-sm text-amber-900">
                            {error}
                          </p>
                        )}
                        <footer className="flex flex-col items-start gap-2">
                          <button
                            type="button"
                            onClick={() => optimizeRouteDraft(campaign)}
                            disabled={
                              routeDraft.length < 2 ||
                              claimingRoute === campaign.id ||
                              locatingCampaign === campaign.id
                            }
                            className="btn-secondary min-h-10 px-3 text-sm disabled:opacity-50"
                          >
                            <Compass size={17} aria-hidden="true" /> Proposer un ordre plus court
                          </button>
                          <button
                            type="button"
                            onClick={() => void claimRoute(campaign)}
                            disabled={
                              !routeDraft.length ||
                              claimingRoute === campaign.id ||
                              locatingCampaign === campaign.id
                            }
                            className="btn-primary min-h-12 px-5 disabled:opacity-50"
                          >
                            {claimingRoute === campaign.id ? (
                              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                            ) : (
                              <Navigation size={18} aria-hidden="true" />
                            )}
                            {claimingRoute === campaign.id ? "Démarrage…" : "Démarrer"}
                          </button>
                        </footer>
                      </section>
                    )}
                    {myRoutePlaceIds.length > 0 && (
                      <section
                        className="hidden space-y-2 border-t border-stone-200 pt-3 lg:block"
                        aria-labelledby={`campaign-route-${campaign.id}`}
                      >
                        <h3
                          id={`campaign-route-${campaign.id}`}
                          className="text-sm font-semibold text-stone-900"
                        >
                          Ma tournée ·{" "}
                          {
                            myRoutePlaceIds.filter(
                              (id) => campaign.assignedPlaces?.[id]?.status === "completed",
                            ).length
                          }
                          /{myRoutePlaceIds.length} faits
                        </h3>
                        {routeSegments.length > 0 ? (
                          <>
                            <p className="text-xs leading-5 text-stone-600">
                              Google Maps recevra votre départ et les lieux de chaque étape lorsque
                              vous ouvrirez un itinéraire.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {routeSegments.map((segment, index) => (
                                <a
                                  key={`${campaign.id}:${index}`}
                                  href={googleMapsRouteUrl(
                                    segment.origin,
                                    segment.destination,
                                    segment.waypoints,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-secondary min-h-10 px-3 py-2 text-sm"
                                >
                                  <ArrowUpRight size={15} />
                                  Ouvrir l’étape {index + 1}/{routeSegments.length}
                                </a>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-stone-600">
                            Définissez un départ GPS ou recherchez une adresse pour ouvrir
                            l’itinéraire.
                          </p>
                        )}
                      </section>
                    )}
                    {canCreate && (
                      <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-end">
                        <label className="input-label min-w-0 flex-1">
                          {campaign.attachment ? "Remplacer le document" : "Ajouter un document"}
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              setReplacementFiles((previous) => ({
                                ...previous,
                                [campaign.id]: event.currentTarget.files?.[0] || null,
                              }))
                            }
                            className="mt-1 block w-full text-sm"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void replaceDocument(campaign.id)}
                          disabled={
                            !replacementFiles[campaign.id] || busy === `upload:${campaign.id}`
                          }
                          className="btn-secondary min-h-10 px-3 py-2 text-sm"
                        >
                          <ArrowDownToLine size={15} />
                          Envoyer
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      )}
      {!selectedCampaignId && nextCursor && (
        <button
          type="button"
          onClick={() => user && void load(user, nextCursor)}
          className="btn-secondary min-h-10 w-full py-2 text-sm"
        >
          Charger d’autres campagnes
        </button>
      )}

      {!selectedCampaignId && (
        <section className="mt-8 border-t border-stone-200 pt-6" aria-labelledby="archived-campaigns-title">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-stone-100 text-stone-700">
              <Archive size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="archived-campaigns-title" className="font-bold text-stone-900">Campagnes archivées</h2>
              <p className="text-xs text-stone-500">Consultation seulement · les campagnes clôturées ne peuvent plus être rejointes.</p>
            </div>
            <span className="text-xs text-stone-500">{archivedCampaigns.length}</span>
          </div>

          {archivedError && <p role="alert" className="mt-3 border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-800">{archivedError}</p>}
          {archivedLoading && !archivedCampaigns.length ? (
            <p role="status" className="py-5 text-sm text-stone-500"><Loader2 size={16} className="mr-2 inline animate-spin" aria-hidden="true" />Chargement des archives…</p>
          ) : archivedCampaigns.length ? (
            <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
              {archivedCampaigns.map((campaign) => (
                <li key={campaign.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-stone-800">{campaign.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                      <Archive size={13} aria-hidden="true" /> Archivée
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">{campaign.message}</p>
                  <p className="mt-2 text-xs text-stone-500">
                    {campaign.closedAt ? `Clôturée le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(campaign.closedAt))}` : "Clôturée"}
                    {` · ${campaign.placeCount} secteur${campaign.placeCount === 1 ? "" : "s"}`}
                    {` · par ${campaign.closedByName}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : !archivedLoading && !archivedError ? (
            <p className="mt-4 border-y border-stone-200 py-5 text-sm text-stone-600">Aucune campagne archivée pour le moment.</p>
          ) : null}

          {archivedCursor && (
            <button
              type="button"
              disabled={archivedLoading}
              onClick={() => user && void loadArchived(user, archivedCursor)}
              className="btn-secondary mt-3 min-h-10 w-full py-2 text-sm"
            >
              {archivedLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              Charger d’autres archives
            </button>
          )}
        </section>
      )}

      {selectedCampaignId && selectedCampaignId !== editingCampaignId && selectedCampaign && (
        <footer className="fixed inset-x-0 bottom-0 z-[900] border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(28,25,23,0.14)] backdrop-blur md:left-64">
          {error && (
            <p role="alert" className="mx-auto mb-2 max-w-7xl text-sm text-amber-900">
              {error}
            </p>
          )}
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
            {selectedCampaign.joined ? (
              <>
                <p className="hidden min-w-0 flex-1 text-sm text-stone-600 sm:block">
                  {selectedCampaign.myRoutePlaceIds.length
                    ? `${selectedCampaign.myRoutePlaceIds.filter((id) => selectedCampaign.assignedPlaces?.[id]?.status === "completed").length}/${selectedCampaign.myRoutePlaceIds.length} secteurs terminés`
                    : "Vous êtes inscrit à cette campagne"}
                </p>
                <button
                  type="button"
                  onClick={() => openMission(selectedCampaign)}
                  disabled={locatingCampaign === selectedCampaign.id}
                  className={`btn-primary min-h-12 w-full justify-center px-4 text-base sm:w-auto sm:min-w-64 ${resumableRouteInProgress ? "" : "lg:hidden"}`}
                >
                  {locatingCampaign === selectedCampaign.id ? (
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Navigation size={18} aria-hidden="true" />
                  )}
                  {locatingCampaign === selectedCampaign.id
                    ? "Localisation…"
                    : selectedCampaign.myRoutePlaceIds.length
                      ? resumableRouteInProgress
                        ? "Reprendre ma tournée"
                        : "Préparer une nouvelle tournée"
                      : "Préparer ma tournée"}
                </button>
                {resumableRouteInProgress && (
                  <button
                    type="button"
                    onClick={() => setRouteToCancel(selectedCampaign)}
                    disabled={cancellingRoute === selectedCampaign.id}
                    className="btn-secondary min-h-12 w-full justify-center border-rose-300 text-rose-800 disabled:opacity-50 sm:w-auto"
                  >
                    {cancellingRoute === selectedCampaign.id ? (
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <X size={18} aria-hidden="true" />
                    )}
                    {cancellingRoute === selectedCampaign.id ? "Annulation…" : "Annuler ma tournée"}
                  </button>
                )}
                {!resumableRouteInProgress && (
                  <button
                    type="button"
                    onClick={() => openMission(selectedCampaign, true)}
                    disabled={
                      !getRouteDraft(selectedCampaign).length ||
                      locatingCampaign === selectedCampaign.id
                    }
                    className="btn-primary hidden min-h-12 px-5 text-base disabled:opacity-50 lg:inline-flex"
                  >
                    <Navigation size={18} aria-hidden="true" /> Prévisualiser ma tournée
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="hidden min-w-0 flex-1 text-sm text-stone-600 sm:block">
                  Participez à cette campagne et préparez votre tournée.
                </p>
                <button
                  type="button"
                  onClick={() => void join(selectedCampaign.id)}
                  disabled={busy === selectedCampaign.id}
                  className="btn-primary min-h-12 w-full justify-center px-4 text-base sm:w-auto sm:min-w-64 disabled:cursor-wait"
                >
                  {busy === selectedCampaign.id ? (
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Users size={18} aria-hidden="true" />
                  )}
                  {busy === selectedCampaign.id ? "Inscription…" : "Rejoindre cette campagne"}
                </button>
              </>
            )}
          </div>
        </footer>
      )}

      {routeToCancel && (
        <dialog
          ref={cancelDialogRef}
          onClose={() => setRouteToCancel(null)}
          aria-labelledby="cancel-route-title"
          aria-describedby="cancel-route-description"
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-stone-200 bg-white p-5 text-stone-900 shadow-xl backdrop:bg-stone-950/60 sm:p-6"
        >
          <h2 id="cancel-route-title" className="text-lg font-bold">
            Annuler ma tournée ?
          </h2>
          <p id="cancel-route-description" className="mt-3 text-sm leading-6 text-stone-700">
            Les secteurs déjà terminés resteront marqués comme terminés. Les secteurs non terminés
            seront libérés et pourront être repris par d’autres membres.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              onClick={() => cancelDialogRef.current?.close()}
              className="btn-secondary min-h-11 justify-center px-4"
            >
              Garder ma tournée
            </button>
            <button
              type="button"
              onClick={() => {
                cancelDialogRef.current?.close();
                void cancelRoute(routeToCancel);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Confirmer l’annulation
            </button>
          </div>
        </dialog>
      )}

      {/* [SPEC-TRACTATION-06] Keep the complete mobile mission flow in a thumb-reachable sheet. */}
      {showRouteDetails && missionCampaign && (
        <div className="fixed inset-0 z-[950] bg-stone-950/20 lg:hidden" aria-hidden="true" />
      )}
      {missionCampaign && (
        <section
          className="fixed inset-x-0 bottom-0 z-[1000] flex h-[50dvh] max-h-[50dvh] flex-col rounded-t-2xl border border-stone-300 bg-white shadow-[0_-12px_36px_rgba(28,25,23,0.2)] lg:hidden"
          aria-label={`Mission ${missionCampaign.title}`}
        >
          <header className="flex h-11 shrink-0 items-center gap-2 border-b border-stone-200 px-3">
            <div
              className="flex min-h-10 min-w-0 flex-1 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
              role="group"
              aria-label="Poignée du panneau de tournée : glissez vers le bas pour fermer, vers le haut pour les détails"
              onPointerDown={(event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                missionSheetDragStart.current = event.clientY;
              }}
              onPointerUp={(event) => {
                const startY = missionSheetDragStart.current;
                missionSheetDragStart.current = null;
                if (startY === null) return;
                const deltaY = event.clientY - startY;
                if (deltaY > 72) {
                  closeMission();
                } else if (deltaY < -56 && missionSheet === "select") {
                  setShowRouteDetails(true);
                }
              }}
              onPointerCancel={() => {
                missionSheetDragStart.current = null;
              }}
            >
              <span className="h-1.5 w-10 rounded-full bg-stone-300" aria-hidden="true" />
            </div>
            <span className="max-w-[45%] truncate text-xs font-semibold text-stone-600">
              {missionCampaign.title}
            </span>
            <button
              type="button"
              onClick={closeMission}
              aria-label="Fermer le mode mission"
              className="grid size-10 shrink-0 place-items-center rounded-full text-stone-600 hover:bg-stone-100"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3">
            {missionSheet === "select" && (
              <div className="space-y-3">
                <div
                  role="tablist"
                  aria-label="Filtrer les secteurs"
                  className="grid grid-cols-2 rounded-lg border border-stone-200 bg-stone-100 p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={missionPlaceFilter === "all"}
                    onClick={() => setMissionPlaceFilter("all")}
                    className={`min-h-11 rounded-md px-3 text-sm font-semibold ${missionPlaceFilter === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"}`}
                  >
                    Tous les secteurs
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={missionPlaceFilter === "favorites"}
                    onClick={() => setMissionPlaceFilter("favorites")}
                    className={`min-h-11 rounded-md px-3 text-sm font-semibold ${missionPlaceFilter === "favorites" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"}`}
                  >
                    Mes favoris (
                    {
                      favoritePlaceIds.filter((id) =>
                        missionCampaign.lieuDits.some((place) => place.id === id),
                      ).length
                    }
                    )
                  </button>
                  {locatingCampaign === missionCampaign.id && (
                    <p role="status" className="flex items-center gap-2 text-sm text-stone-600">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      Mise à jour de votre position…
                    </p>
                  )}
                </div>
                {error && (
                  <p
                    role="alert"
                    className="border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    {error}
                  </p>
                )}
                {missionSelectedPlace && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-stone-900">
                        {missionSelectedPlace.nom}
                      </span>
                      <span className="text-xs text-stone-600">
                        {missionSelectedPlace.foyers} foyers recensés
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addSelectedMapPlace(missionCampaign)}
                      disabled={
                        !missionSelectedPlace.hasCoordinates ||
                        Boolean(missionCampaign.assignedPlaces?.[missionSelectedPlace.id]) ||
                        missionDraft.includes(missionSelectedPlace.id) ||
                        missionDraft.length >= 200
                      }
                      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-bold text-white disabled:bg-stone-300"
                    >
                      <Plus size={18} aria-hidden="true" />
                      Ajouter à ma tournée
                    </button>
                  </div>
                )}
                <ul
                  className="max-h-[23dvh] divide-y divide-stone-200 overflow-y-auto border-y border-stone-200"
                  aria-label="Secteurs de la campagne"
                >
                  {missionPlaces.map((place) => {
                    const assignment = missionCampaign.assignedPlaces?.[place.id];
                    const inDraft = missionDraft.includes(place.id);
                    const available = !assignment && place.hasCoordinates;
                    const isBusy = busy === `${missionCampaign.id}:${place.id}`;
                    return (
                      <li key={place.id}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!available && !inDraft) return;
                              toggleRouteDraftPlace(missionCampaign, place.id);
                              if (typeof navigator !== "undefined" && "vibrate" in navigator)
                                navigator.vibrate(12);
                            }}
                            disabled={!available && !inDraft}
                            aria-pressed={inDraft}
                            aria-label={`${inDraft ? "Retirer de" : "Ajouter à"} ma tournée : ${place.nom}`}
                            className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-2 text-left disabled:opacity-60"
                          >
                            <span
                              className={`grid size-8 shrink-0 place-items-center rounded-full ${assignment?.status === "completed" ? "bg-emerald-100 text-emerald-900" : assignment ? "bg-stone-100 text-stone-500" : inDraft ? "bg-blue-100 text-blue-900" : "bg-blue-700 text-white"}`}
                            >
                              {assignment?.status === "completed" ? (
                                <Check size={16} aria-label="Terminé" />
                              ) : inDraft ? (
                                <Check size={16} aria-label="Dans la tournée" />
                              ) : (
                                <MapPinned size={16} aria-hidden="true" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-stone-900">
                                {place.nom}
                              </span>
                              <span className="text-xs text-stone-500">
                                {place.foyers} foyers ·{" "}
                                {assignment?.status === "completed"
                                  ? `Fait par ${assignment.memberName || "un membre"}`
                                  : assignment
                                    ? assignment.isMine
                                      ? "Dans votre tournée"
                                      : `Pris par ${assignment.memberName || "un membre"}`
                                    : !place.hasCoordinates
                                      ? "Sans coordonnées"
                                      : inDraft
                                        ? "Sélectionné"
                                        : "Disponible"}
                              </span>
                            </span>
                            {available && !inDraft && (
                              <Plus
                                size={19}
                                className="shrink-0 text-blue-800"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                          {assignment && canCreate && (
                            <details className="relative shrink-0">
                              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
                                Gérer
                              </summary>
                              <div className="absolute right-0 z-40 mt-1 grid min-w-40 gap-1 rounded-md border border-stone-200 bg-white p-1 shadow-lg">
                                {assignment.status === "claimed" ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      void updateAssignment(missionCampaign, place, "complete")
                                    }
                                    className="min-h-11 rounded px-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                                  >
                                    Marquer fait
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      void updateAssignment(missionCampaign, place, "reopen")
                                    }
                                    className="min-h-11 rounded px-3 text-left text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                  >
                                    Marquer non fait
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    void updateAssignment(missionCampaign, place, "release")
                                  }
                                  className="min-h-11 rounded px-3 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                                >
                                  Désattribuer le lieu
                                </button>
                              </div>
                            </details>
                          )}
                          {assignment &&
                            !canCreate &&
                            missionCampaign.joined &&
                            assignment.isMine &&
                            assignment.status === "completed" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void updateAssignment(missionCampaign, place, "reopen")
                                }
                                aria-label={`Marquer ${place.nom} comme non fait`}
                                className="min-h-11 shrink-0 px-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  "Non fait"
                                )}
                              </button>
                            )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {missionSheet === "preview" && (
              <div className="space-y-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-stone-900">Aperçu de ma tournée</h2>
                  <button
                    type="button"
                    onClick={() => setMissionSheet("select")}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-blue-800"
                  >
                    <ArrowUp size={17} className="-rotate-90" aria-hidden="true" />
                    Modifier les secteurs
                  </button>
                </div>
                <ol
                  className="divide-y divide-stone-200 border-y border-stone-200"
                  aria-label="Ordre des étapes de la tournée"
                >
                  {missionDraft.map((placeId, index) => {
                    const place = missionCampaign.lieuDits.find((item) => item.id === placeId);
                    if (!place) return null;
                    return (
                      <li key={placeId} className="flex min-h-14 items-center gap-2 py-1">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-800 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                          {place.nom}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveRouteDraftPlace(missionCampaign, index, -1)}
                          disabled={
                            index === 0 ||
                            claimingRoute === missionCampaign.id ||
                            locatingCampaign === missionCampaign.id
                          }
                          aria-label={`Monter ${place.nom}`}
                          className="grid size-11 shrink-0 place-items-center rounded-md text-stone-700 disabled:opacity-30"
                        >
                          <ArrowUp size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRouteDraftPlace(missionCampaign, index, 1)}
                          disabled={
                            index === missionDraft.length - 1 ||
                            claimingRoute === missionCampaign.id ||
                            locatingCampaign === missionCampaign.id
                          }
                          aria-label={`Descendre ${place.nom}`}
                          className="grid size-11 shrink-0 place-items-center rounded-md text-stone-700 disabled:opacity-30"
                        >
                          <ArrowDown size={17} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {missionSheet === "run" && (
              <div className="space-y-3">
                {missionNextPlace &&
                  (() => {
                    const place = missionCampaign.lieuDits.find(
                      (item) => item.id === missionNextPlace,
                    );
                    const currentAssignment = place
                      ? missionCampaign.assignedPlaces?.[place.id]
                      : undefined;
                    const canCorrectCurrent = Boolean(
                      currentAssignment &&
                      (canCreate || (missionCampaign.joined && currentAssignment.isMine)),
                    );
                    const routeIndex = missionRoute.indexOf(missionNextPlace);
                    const remainingStops = missionRoute.slice(routeIndex).flatMap((id) => {
                      const stop = missionCampaign.lieuDits.find((item) => item.id === id);
                      return stop && stop.lat !== null && stop.lon !== null
                        ? [{ lat: stop.lat, lon: stop.lon }]
                        : [];
                    });
                    const currentSegments =
                      getRouteOrigin(missionCampaign.id) && remainingStops.length
                        ? buildTourRouteSegments(
                            getRouteOrigin(missionCampaign.id)!,
                            remainingStops,
                          )
                        : [];
                    const currentSegment = currentSegments[0];
                    return (
                      <>
                        <p className="text-xs font-semibold uppercase text-emerald-900">
                          Prochain secteur · {routeIndex + 1} sur {missionRoute.length}
                        </p>
                        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                          <h3 className="text-xl font-black text-stone-900">{place?.nom}</h3>
                          <p className="mt-1 text-sm text-stone-600">
                            {place?.foyers} foyers recensés
                          </p>
                        </div>
                        {currentSegment && (
                          <a
                            href={googleMapsRouteUrl(
                              currentSegment.origin,
                              currentSegment.destination,
                              currentSegment.waypoints,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary flex min-h-14 w-full justify-center text-base"
                          >
                            <Navigation size={20} aria-hidden="true" />Y aller avec Google Maps
                          </a>
                        )}
                        {!currentSegment && (
                          <button
                            type="button"
                            onClick={() => locateCampaign(missionCampaign.id)}
                            disabled={locatingCampaign === missionCampaign.id}
                            className="btn-secondary min-h-12 w-full justify-center"
                          >
                            <Compass size={18} aria-hidden="true" />
                            {locatingCampaign === missionCampaign.id
                              ? "Localisation…"
                              : "Me localiser pour l’itinéraire"}
                          </button>
                        )}
                        {currentAssignment?.status === "completed" && (
                          <p
                            role="status"
                            className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-900"
                          >
                            Secteur marqué comme fait
                          </p>
                        )}
                      </>
                    );
                  })()}
                {!missionNextPlace && (
                  <div role="status" className="space-y-3 py-4 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                      <Check size={28} aria-hidden="true" />
                    </span>
                    <p className="text-lg font-bold text-stone-900">
                      {missionRoute.length ? "Tournée terminée" : "Aucun secteur restant"}
                    </p>
                    <p className="text-sm text-stone-600">
                      {missionRoute.length
                        ? "Tous les secteurs de cette tournée sont marqués comme faits."
                        : "Les secteurs libérés sont de nouveau disponibles pour les autres membres."}
                    </p>
                    <button
                      type="button"
                      onClick={closeMission}
                      className="btn-primary mx-auto min-h-11 justify-center px-4"
                    >
                      Retour à la campagne
                    </button>
                  </div>
                )}
                {error && (
                  <p
                    role="alert"
                    className="border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {missionSheet === "select" && (
            <footer className="sticky bottom-0 z-20 shrink-0 border-t border-stone-200 bg-white px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(28,25,23,0.08)]">
              <div
                id="mission-route-details"
                hidden={!showRouteDetails}
                className="mb-3 max-h-[18dvh] overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 px-3"
                aria-label="Détails de la tournée"
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (touch)
                    routeDetailsTouchStart.current = {
                      y: touch.clientY,
                      scrollTop: event.currentTarget.scrollTop,
                    };
                }}
                onTouchEnd={(event) => {
                  const start = routeDetailsTouchStart.current;
                  const touch = event.changedTouches[0];
                  routeDetailsTouchStart.current = null;
                  if (
                    start &&
                    touch &&
                    start.scrollTop <= 1 &&
                    event.currentTarget.scrollTop <= 1 &&
                    touch.clientY - start.y > 56
                  ) {
                    setShowRouteDetails(false);
                  }
                }}
              >
                {missionDraft.length ? (
                  <ol className="divide-y divide-stone-200">
                    {missionDraft.map((placeId, index) => {
                      const place = missionCampaign.lieuDits.find((item) => item.id === placeId);
                      if (!place) return null;
                      return (
                        <li key={placeId} className="flex min-h-12 items-center gap-2 py-1">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                            {place.nom}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveRouteDraftPlace(missionCampaign, index, -1)}
                            disabled={index === 0}
                            aria-label={`Monter ${place.nom}`}
                            className="grid size-10 shrink-0 place-items-center rounded-md text-stone-700 disabled:opacity-30"
                          >
                            <ArrowUp size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRouteDraftPlace(missionCampaign, index, 1)}
                            disabled={index === missionDraft.length - 1}
                            aria-label={`Descendre ${place.nom}`}
                            className="grid size-10 shrink-0 place-items-center rounded-md text-stone-700 disabled:opacity-30"
                          >
                            <ArrowDown size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRouteDraftPlace(missionCampaign, placeId)}
                            aria-label={`Retirer ${place.nom} de la tournée`}
                            className="grid size-10 shrink-0 place-items-center rounded-md text-stone-500"
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="py-4 text-center text-sm text-stone-600">
                    Aucun secteur sélectionné.
                  </p>
                )}
              </div>
              {error && (
                <p
                  role="alert"
                  className="mb-2 border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  {error}
                </p>
              )}
              <div className="flex items-center gap-2">
                <details className="relative shrink-0">
                  <summary
                    aria-label="Actions de la tournée"
                    className="grid size-12 cursor-pointer list-none place-items-center rounded-lg border border-stone-300 bg-white text-stone-700"
                  >
                    <MoreVertical size={20} aria-hidden="true" />
                  </summary>
                  <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-30 grid min-w-52 gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={(event) => {
                        setShowRouteDetails((value) => !value);
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                      aria-expanded={showRouteDetails}
                      aria-controls="mission-route-details"
                      className="flex min-h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    >
                      <ListChecks size={17} aria-hidden="true" />
                      {showRouteDetails ? "Masquer les détails" : "Modifier la tournée"}
                    </button>
                    <p className="px-3 pb-2 text-xs leading-5 text-stone-500">
                      {missionDraft.length} secteur(s) sélectionné(s). Vous pouvez les réordonner ou
                      les retirer.
                    </p>
                  </div>
                </details>
                <span
                  className="min-w-14 text-center text-xs font-semibold text-stone-600"
                  aria-live="polite"
                >
                  {missionDraft.length} secteur(s)
                </span>
                <button
                  type="button"
                  onClick={() => openPreview(missionCampaign)}
                  disabled={!missionDraft.length || locatingCampaign === missionCampaign.id}
                  className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-2 text-xs font-bold text-white disabled:bg-stone-300 sm:min-h-14 sm:flex-none sm:gap-2 sm:px-5 sm:text-sm"
                >
                  <Navigation size={19} aria-hidden="true" />
                  Prévisualiser ma tournée
                </button>
              </div>
            </footer>
          )}
          {missionSheet === "preview" && (
            <footer className="shrink-0 border-t border-stone-200 bg-white px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(28,25,23,0.08)]">
              {error && (
                <p role="alert" className="mb-2 text-sm text-amber-900">
                  {error}
                </p>
              )}
              {locatingCampaign === missionCampaign.id && (
                <p role="status" className="mb-2 text-sm text-stone-600">
                  Mise à jour de votre position…
                </p>
              )}
              <button
                type="button"
                onClick={() => optimizeRouteDraft(missionCampaign)}
                disabled={
                  missionDraft.length < 2 ||
                  claimingRoute === missionCampaign.id ||
                  locatingCampaign === missionCampaign.id
                }
                className="btn-secondary mb-2 min-h-11 w-full justify-center px-3 text-sm disabled:opacity-50"
              >
                <Compass size={17} aria-hidden="true" /> Proposer un ordre plus court
              </button>
              <button
                type="button"
                onClick={() => void claimRoute(missionCampaign)}
                disabled={
                  !missionDraft.length ||
                  claimingRoute === missionCampaign.id ||
                  locatingCampaign === missionCampaign.id
                }
                className="btn-primary min-h-12 w-full justify-center disabled:opacity-50"
              >
                {claimingRoute === missionCampaign.id ? (
                  <Loader2 size={19} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Navigation size={19} aria-hidden="true" />
                )}
                {claimingRoute === missionCampaign.id ? "Démarrage…" : "Démarrer"}
              </button>
            </footer>
          )}
          {missionSheet === "run" && missionNextPlace && (
            <footer className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-stone-200 bg-white px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(28,25,23,0.08)] sm:px-4">
              {(() => {
                const place = missionCampaign.lieuDits.find((item) => item.id === missionNextPlace);
                const currentAssignment = place
                  ? missionCampaign.assignedPlaces?.[place.id]
                  : undefined;
                const canCorrectCurrent = Boolean(
                  currentAssignment &&
                  (canCreate || (missionCampaign.joined && currentAssignment.isMine)),
                );
                const isBusy = !place || busy === `${missionCampaign.id}:${place.id}`;

                return (
                  <>
                    {currentAssignment?.status === "completed" ? (
                      canCorrectCurrent ? (
                        <button
                          type="button"
                          onClick={() => void updateAssignment(missionCampaign, place!, "reopen")}
                          disabled={isBusy}
                          className="min-h-11 min-w-0 rounded-lg border border-amber-300 px-2 text-xs font-semibold text-amber-900 disabled:opacity-50 sm:px-3 sm:text-sm"
                        >
                          {isBusy ? "Mise à jour…" : "Marquer non fait"}
                        </button>
                      ) : (
                        <span className="flex min-h-11 items-center justify-center text-xs font-semibold text-emerald-900">
                          Secteur terminé
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => void updateAssignment(missionCampaign, place!, "complete")}
                        disabled={isBusy}
                        className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-2 text-xs font-bold text-white disabled:opacity-50 sm:gap-2 sm:px-3 sm:text-sm"
                      >
                        {isBusy ? (
                          <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Check size={17} aria-hidden="true" />
                        )}
                        Secteur terminé
                      </button>
                    )}
                    {canCorrectCurrent && (
                      <button
                        type="button"
                        onClick={() => void updateAssignment(missionCampaign, place!, "release")}
                        disabled={isBusy}
                        aria-label={
                          currentAssignment?.isMine
                            ? "Mince, je libère ce secteur"
                            : "Désattribuer ce secteur"
                        }
                        className="min-h-11 rounded-lg border border-stone-300 px-2 text-xs font-semibold text-stone-700 disabled:opacity-50 sm:px-3 sm:text-sm"
                      >
                        <span className="sm:hidden">Libérer</span>
                        <span className="hidden sm:inline">
                          {currentAssignment?.isMine ? "Libérer ce secteur" : "Désattribuer"}
                        </span>
                      </button>
                    )}
                  </>
                );
              })()}
            </footer>
          )}
        </section>
      )}
    </section>
  );
}
