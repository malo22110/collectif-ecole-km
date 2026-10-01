"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Heart } from "lucide-react";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { TourLieuDit } from "@/lib/tourneeGeo";

interface OpenStreetMapProps {
	locations: TourLieuDit[];
	origin?: { lat: number; lon: number } | null;
	favoritePlaceIds?: string[];
	onToggleFavorite?: (placeId: string) => void;
	showHouseholdCounts?: boolean;
	selectedPlace?: TourLieuDit | null;
}

function FitMapBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
	const map = useMap();
	useEffect(() => {
		if (bounds) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
	}, [bounds, map]);
	return null;
}

function FocusPlace({ place }: { place: TourLieuDit | null }) {
	const map = useMap();
	useEffect(() => {
		if (place && Number.isFinite(place.lat) && Number.isFinite(place.lon)) {
			map.flyTo([place.lat, place.lon], Math.max(map.getZoom(), 14), { duration: 0.5 });
		}
	}, [map, place]);
	return null;
}

function directionsUrl(destination: TourLieuDit, origin?: OpenStreetMapProps["origin"]) {
	const parameters = new URLSearchParams({
		api: "1",
		destination: `${destination.lat},${destination.lon}`,
		travelmode: "driving"
	});
	if (origin) parameters.set("origin", `${origin.lat},${origin.lon}`);
	return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

export default function OpenStreetMap({ locations, origin = null, favoritePlaceIds = [], onToggleFavorite, showHouseholdCounts = true, selectedPlace = null }: OpenStreetMapProps) {
	const located = useMemo(() => locations.filter(location =>
		Number.isFinite(location.lat) && Number.isFinite(location.lon)
	), [locations]);
	const favorites = useMemo(() => new Set(favoritePlaceIds), [favoritePlaceIds]);
	const bounds = useMemo<LatLngBoundsExpression | null>(() => {
		const points: LatLngExpression[] = located.map(location => [location.lat, location.lon]);
		if (origin) points.push([origin.lat, origin.lon]);
		return points.length ? points as LatLngBoundsExpression : null;
	}, [located, origin]);

	return (
		<div className="relative z-0 isolate h-[55vh] min-h-[400px] w-full overflow-hidden rounded-lg border border-stone-300 bg-stone-100 md:h-[68vh]">
			<MapContainer center={[48.28, -3.31]} zoom={12} scrollWheelZoom fadeAnimation={false} className="h-full w-full" aria-label="Carte des lieux-dits de Kergrist-Moëlou">
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<FitMapBounds bounds={bounds} />
				<FocusPlace place={selectedPlace} />
				{located.map(location => {
					const zeroHouseholds = location.foyers === 0;
					const isFavorite = favorites.has(location.id);
					const radius = (zeroHouseholds ? 6 : Math.min(15, 6 + Math.sqrt(location.foyers))) + (isFavorite ? 2 : 0);
					return (
						<CircleMarker
							key={location.id}
							center={[location.lat, location.lon]}
							radius={radius}
							pathOptions={{
								color: isFavorite ? "#92400e" : zeroHouseholds ? "#57534e" : "#065f46",
								fillColor: isFavorite ? "#fbbf24" : zeroHouseholds ? "#a8a29e" : "#10b981",
								fillOpacity: 0.82,
								weight: 2
							}}
						>
							<Popup>
								<div className="min-w-40 space-y-1 text-sm">
									<strong className="flex items-center gap-1.5 text-stone-900">{isFavorite && <Heart size={14} className="fill-amber-300 text-amber-800" aria-label="Lieu favori" />}{location.nom}</strong>
									{!showHouseholdCounts ? null : zeroHouseholds
										? <span className="inline-flex rounded border border-stone-300 bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">0 foyer recensé</span>
										: <p>{location.foyers} foyers recensés</p>}
										{onToggleFavorite && <button type="button" aria-pressed={isFavorite} onClick={() => onToggleFavorite(location.id)} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-amber-50"><Heart size={15} className={isFavorite ? "fill-amber-400 text-amber-800" : ""} />{isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}</button>}
									<a className="block pt-1 font-semibold text-emerald-800 underline" href={directionsUrl(location, origin || undefined)} target="_blank" rel="noreferrer">Ouvrir l'itinéraire</a>
								</div>
							</Popup>
						</CircleMarker>
					);
				})}
				{origin && <CircleMarker center={[origin.lat, origin.lon]} radius={9} pathOptions={{ color: "#1d4ed8", fillColor: "#60a5fa", fillOpacity: 0.95, weight: 3 }}><Popup><strong>Adresse utilisée pour cette recherche</strong></Popup></CircleMarker>}
			</MapContainer>
		</div>
	);
}
