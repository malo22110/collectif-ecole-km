"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Heart, Loader2, MapPinned, Plus, Search } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { TourLieuDit } from "@/lib/tourneeGeo";
import MemberPlacePreferences from "@/app/espace-membre/components/MemberPlacePreferences";
import TractationPanel, { type CampaignMapState } from "@/app/espace-membre/components/TractationPanel";

const OpenStreetMap = dynamic(() => import("./OpenStreetMap"), {
	ssr: false,
	loading: () => <div className="flex h-[55vh] min-h-[400px] items-center justify-center bg-stone-100 text-sm text-stone-500">Chargement de la carte…</div>
});

interface NearbyPlace extends TourLieuDit {
	distanceKm: number;
}

interface GeocodeSuggestion {
	matchedAddress: string;
	origin: { lat: number; lon: number };
	nearest: NearbyPlace[];
}

function formatDistance(km: number) {
	return km < 1 ? `${Math.round(km * 1000)} m à vol d'oiseau` : `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km à vol d'oiseau`;
}

export default function TourneesPage() {
	const [locations, setLocations] = useState<TourLieuDit[]>([]);
	const [address, setAddress] = useState("");
	const [search, setSearch] = useState("");
	const [suggestion, setSuggestion] = useState<GeocodeSuggestion | null>(null);
	const [selectedPlace, setSelectedPlace] = useState<TourLieuDit | null>(null);
	const [campaignMap, setCampaignMap] = useState<CampaignMapState | null>(null);
	const [loading, setLoading] = useState(true);
	const [geocoding, setGeocoding] = useState(false);
	const [error, setError] = useState("");
	const [mapError, setMapError] = useState("");
	const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [canCreateCampaign, setCanCreateCampaign] = useState(false);
	const [showStatistics, setShowStatistics] = useState(false);
	const handleCanCreateChange = useCallback((allowed: boolean) => setCanCreateCampaign(allowed), []);
	const handleStatisticsVisibleChange = useCallback((visible: boolean) => setShowStatistics(visible), []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async user => {
			setCurrentUser(user);
			if (!user) {
				setMapError("Connectez-vous avec un compte membre validé pour consulter la carte.");
				setLoading(false);
				return;
			}
			try {
				const response = await fetch("/api/tournees", {
					headers: { Authorization: `Bearer ${await user.getIdToken()}` },
					cache: "no-store"
				});
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Impossible de charger les lieux-dits.");
				setLocations(data.locations);
			} catch (loadError) {
				setMapError(loadError instanceof Error ? loadError.message : "Erreur de connexion.");
			} finally {
				setLoading(false);
			}
		});
		return () => unsubscribe();
	}, []);

	const unlocated = useMemo(() => locations.filter(place => place.geocodeStatus !== "located"), [locations]);
	const zeroHouseholds = useMemo(() => locations.filter(place => place.foyers === 0).length, [locations]);
	const householdTotal = useMemo(() => locations.reduce((total, place) => total + place.foyers, 0), [locations]);
	const mapLocations = useMemo(() => {
		if (!campaignMap) return locations;
		const includedIds = new Set(campaignMap.placeIds);
		return locations.filter(place => includedIds.has(place.id));
	}, [campaignMap, locations]);
	const filtered = useMemo(() => {
		const query = search.trim().toLocaleLowerCase("fr");
		return mapLocations.filter(place => !query || place.nom.toLocaleLowerCase("fr").includes(query))
			.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
	}, [mapLocations, search]);
	const mapAssignments = campaignMap?.assignmentStatuses || {};
	const mapRoutePlaceIds = campaignMap?.routePlaceIds || [];
	const handleCampaignMapChange = useCallback((state: CampaignMapState | null) => setCampaignMap(state), []);

	const findNearby = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setSuggestion(null);
		const user = auth.currentUser;
		if (!user) {
			setError("Votre session a expiré. Reconnectez-vous.");
			return;
		}
		setGeocoding(true);
		try {
			const response = await fetch("/api/tournees/proximite", {
				method: "POST",
				headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ address })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Adresse non trouvée.");
			setSuggestion(data);
		} catch (lookupError) {
			setError(lookupError instanceof Error ? lookupError.message : "Impossible de géocoder cette adresse.");
		} finally {
			setGeocoding(false);
		}
	};

	const toggleFavorite = useCallback(async (placeId: string) => {
		if (!currentUser) return;
		const headers = { Authorization: `Bearer ${await currentUser.getIdToken()}` };
		try {
			const currentResponse = await fetch("/api/member-place-preferences", { headers, cache: "no-store" });
			if (!currentResponse.ok) throw new Error("Impossible de charger vos favoris.");
			const current = await currentResponse.json();
			const favorites: string[] = Array.isArray(current.favoritePlaceIds) ? current.favoritePlaceIds : [];
			const nextFavorites = favorites.includes(placeId)
				? favorites.filter(id => id !== placeId)
				: favorites.length < 20 ? [...favorites, placeId] : favorites;
			if (nextFavorites.length === favorites.length && !favorites.includes(placeId)) {
				setError("Vous pouvez enregistrer jusqu'à 20 lieux favoris.");
				return;
			}
			const saveResponse = await fetch("/api/member-place-preferences", {
				method: "PUT",
				headers: { ...headers, "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ favoritePlaceIds: nextFavorites, setupComplete: true, savedAddress: current.savedAddress || null })
			});
			if (!saveResponse.ok) throw new Error("Impossible d'enregistrer ce favori.");
			setFavoritePlaceIds(nextFavorites);
			setError("");
		} catch (favoriteError) {
			setError(favoriteError instanceof Error ? favoriteError.message : "Impossible d'enregistrer ce favori.");
		}
	}, [currentUser]);

	const favoriteSet = useMemo(() => new Set(favoritePlaceIds), [favoritePlaceIds]);
	const handleMemberFavoriteChange = useCallback((ids: string[]) => setFavoritePlaceIds(ids), []);

	return (
		<main className="min-h-full overflow-y-auto bg-stone-50 p-3 sm:p-4 md:p-8">
			<div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
				<header className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="flex items-center gap-3 text-2xl font-black text-stone-900 md:text-3xl"><MapPinned className="text-emerald-700" size={30} /> Carte & campagnes</h1>
						<p className="mt-2 max-w-3xl text-sm text-stone-600">Trouvez un lieu-dit, enregistrez vos favoris et rejoignez une campagne près de chez vous.</p>
					</div>
					{canCreateCampaign && <Link href="/espace-membre/tournees/nouvelle-campagne" className="btn-primary min-h-11 w-full px-4 py-2 sm:w-auto"><Plus size={18} aria-hidden="true" />Créer une campagne</Link>}
				</header>

				<form onSubmit={findNearby} className="flex flex-col gap-2 sm:flex-row sm:items-end" aria-label="Rechercher les lieux-dits proches">
					<label className="relative block min-w-0 flex-1 text-sm font-medium text-stone-700">
						<span className="sr-only">Rechercher une adresse</span>
						<Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
						<input type="text" required minLength={5} maxLength={180} autoComplete="street-address" value={address} onChange={event => setAddress(event.target.value)} placeholder="Adresse ou commune près de chez vous" className="input-base min-h-12 pl-10" />
					</label>
					<button type="submit" disabled={geocoding || !address.trim()} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-50">
						{geocoding ? <Loader2 className="animate-spin" size={18} /> : <Compass size={18} />}{geocoding ? "Recherche…" : "Rechercher"}
					</button>
				</form>
				{error && <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
				{showStatistics && <details className="border-b border-stone-200 pb-2">
					<summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-stone-600">Statistiques des secteurs</summary>
					<div className="grid grid-cols-2 gap-3 pb-3 md:grid-cols-4" aria-label="Statistiques des secteurs">
						<div><p className="text-xs font-semibold uppercase text-stone-500">Lieux-dits</p><p className="mt-1 text-lg font-bold text-stone-900">{loading ? "…" : locations.length}</p></div>
						<div><p className="text-xs font-semibold uppercase text-stone-500">Foyers recensés</p><p className="mt-1 text-lg font-bold text-stone-900">{loading ? "…" : householdTotal}</p></div>
						<div><p className="text-xs font-semibold uppercase text-stone-500">Sans foyer recensé</p><p className="mt-1 text-lg font-bold text-stone-700">{loading ? "…" : zeroHouseholds}</p></div>
						<div><p className="text-xs font-semibold uppercase text-stone-500">À localiser</p><p className="mt-1 text-lg font-bold text-amber-800">{loading ? "…" : unlocated.length}</p></div>
					</div>
				</details>}

				<section id="places-map-section" className="grid scroll-mt-4 gap-4 border-b border-stone-200 pb-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="min-w-0 space-y-3">
						{mapError ? <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{mapError}</p>
							: loading ? <div role="status" className="flex h-[48vh] min-h-[320px] items-center justify-center gap-3 bg-stone-100 text-stone-600 md:h-[68vh] md:min-h-[400px]"><Loader2 className="animate-spin" /> Chargement de la carte…</div>
							: <OpenStreetMap locations={mapLocations} origin={campaignMap ? campaignMap.origin : suggestion?.origin} originLabel={campaignMap?.origin ? "Position GPS utilisée pour la tournée de campagne" : "Adresse utilisée pour cette recherche"} favoritePlaceIds={favoritePlaceIds} onToggleFavorite={toggleFavorite} routePlaceIds={mapRoutePlaceIds} assignmentStatuses={mapAssignments} campaignMode={Boolean(campaignMap)} showHouseholdCounts={showStatistics} selectedPlace={selectedPlace} />}
						<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600">
							{showStatistics && <><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-emerald-800 bg-emerald-500" /> Foyers recensés</span><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-stone-600 bg-stone-400" /> 0 foyer recensé</span></>}
							{campaignMap && <><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-stone-600 bg-stone-300" /> Disponible</span><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-amber-700 bg-amber-400" /> Pris</span><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-emerald-700 bg-emerald-400" /> Fait</span></>}
							<span className="inline-flex items-center gap-2"><Heart size={13} className="fill-amber-300 text-amber-800" /> Mes favoris</span>
							{suggestion && <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-blue-800 bg-blue-400" /> Votre adresse</span>}
						</div>
						<p className="text-xs text-stone-500">Touchez un repère pour l’ajouter à vos favoris. Les marqueurs indiquent des lieux-dits, pas des domiciles.</p>
					</div>

					<aside className="min-w-0 border-t border-stone-200 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
						{campaignMap && <div className="mb-3 border-b border-stone-200 pb-3"><p className="truncate text-sm font-semibold text-stone-800">Campagne : {campaignMap.title}</p><p className="mt-1 text-xs text-stone-500">La carte n’affiche que les lieux ciblés par cette campagne.</p></div>}
						{suggestion && !campaignMap && <div className="mb-3 border-b border-stone-200 pb-3"><p className="mb-2 text-xs font-semibold uppercase text-stone-500">Près de {suggestion.matchedAddress}</p>{suggestion.nearest.map((place, index) => <div key={place.id} className="flex items-center gap-2 py-2"><button type="button" onClick={() => void toggleFavorite(place.id)} aria-pressed={favoriteSet.has(place.id)} aria-label={`${favoriteSet.has(place.id) ? "Retirer des" : "Ajouter aux"} favoris : ${place.nom}`} className={`grid size-10 shrink-0 place-items-center rounded-full border ${favoriteSet.has(place.id) ? "border-amber-300 bg-amber-100 text-amber-800" : "border-stone-200 text-stone-500 hover:bg-stone-100"}`}><Heart size={17} className={favoriteSet.has(place.id) ? "fill-amber-400" : ""} /></button><button type="button" onClick={() => setSelectedPlace(place)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-stone-800">{index + 1}. {place.nom}</p><p className="text-xs text-stone-500">{formatDistance(place.distanceKm)}{showStatistics ? ` · ${place.foyers} foyers` : ""}</p></button></div>)}</div>}
						<details className="mt-2 border-y border-stone-200">
							<summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-semibold text-stone-800">
									{campaignMap ? "Lieux de la campagne" : "Tous les lieux-dits"}
								<span className="text-xs font-normal text-stone-500">Rechercher, voir la liste ou ajouter des favoris</span>
							</summary>
							<div className="space-y-2 pb-3">
								<label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Chercher un lieu-dit" aria-label="Chercher un lieu-dit" className="input-base py-2 pl-9 text-sm" /></label>
								{showStatistics && <p className="text-xs font-semibold uppercase text-stone-500">{filtered.length} lieux-dits</p>}
								<ul className="max-h-64 divide-y divide-stone-200 overflow-y-auto border-y border-stone-200 bg-white sm:max-h-80 lg:max-h-[68vh]">
									{filtered.map(place => <li key={place.id} className="flex items-center gap-2 px-2 py-1"><button type="button" onClick={() => void toggleFavorite(place.id)} aria-pressed={favoriteSet.has(place.id)} aria-label={`${favoriteSet.has(place.id) ? "Retirer des" : "Ajouter aux"} favoris : ${place.nom}`} className={`grid size-10 shrink-0 place-items-center rounded-full border ${favoriteSet.has(place.id) ? "border-amber-300 bg-amber-100 text-amber-800" : "border-transparent text-stone-400 hover:bg-stone-100"}`}><Heart size={17} className={favoriteSet.has(place.id) ? "fill-amber-400" : ""} /></button><button type="button" onClick={() => setSelectedPlace(place)} className="min-w-0 flex-1 truncate py-2 text-left text-sm font-medium text-stone-800">{place.nom}</button>{showStatistics && <span className="shrink-0 text-xs text-stone-500">{place.foyers} foy.</span>}</li>)}
								</ul>
							</div>
						</details>
						{showStatistics && unlocated.length > 0 && <details className="mt-3 text-sm text-stone-600"><summary className="cursor-pointer font-semibold">Lieux sans coordonnées ({unlocated.length})</summary><ul className="mt-2 space-y-1 pl-4">{unlocated.map(place => <li key={place.id}>{place.nom} — {place.foyers} foyer(s)</li>)}</ul></details>}
					</aside>
				</section>

				<p className="text-xs leading-relaxed text-stone-500">L’adresse saisie sert à cette recherche uniquement. Elle n’est pas enregistrée sans votre accord.</p>
						<MemberPlacePreferences places={locations.map(({ id, nom }) => ({ id, nom }))} favoritePlaceIds={favoritePlaceIds} onFavoritesChange={handleMemberFavoriteChange} />
						<TractationPanel favoritePlaceIds={favoritePlaceIds} suggestionOrigin={suggestion?.origin || null} onCanCreateChange={handleCanCreateChange} onStatisticsVisibleChange={handleStatisticsVisibleChange} onCampaignMapChange={handleCampaignMapChange} />
				<p className="text-xs text-stone-500">Carte © OpenStreetMap contributors. Les points sont des repères indicatifs issus du géocodage des lieux-dits.</p>
			</div>
		</main>
	);
}
