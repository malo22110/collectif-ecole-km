"use client";

// [SPEC-TOURNEE-04] Members choose private favorite places; home address persistence is a separate opt-in.
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Heart, Loader2, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { auth } from "@/lib/firebase";

type PlaceOption = { id: string; nom: string };
type SuggestedPlace = PlaceOption & { distanceKm: number };
type PreferencesResponse = { favoritePlaceIds: string[]; setupComplete: boolean; savedAddress: string | null };

interface MemberPlacePreferencesProps {
  places: PlaceOption[];
  onFavoritesChange?: (favoriteIds: string[]) => void;
  favoritePlaceIds?: string[];
}

async function authorizedFetch(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

export default function MemberPlacePreferences({ places, onFavoritesChange, favoritePlaceIds: externalFavoritePlaceIds }: MemberPlacePreferencesProps) {
  const [user, setUser] = useState<User | null>(null);
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [confirmedAddress, setConfirmedAddress] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [suggestedPlaces, setSuggestedPlaces] = useState<SuggestedPlace[]>([]);
  const [matchedAddress, setMatchedAddress] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setLoaded(true);
        return;
      }
      try {
        const data = await authorizedFetch(currentUser, "/api/member-place-preferences") as PreferencesResponse;
        if (!active) return;
        setFavoritePlaceIds(data.favoritePlaceIds);
        setSelectedPlaceIds(data.favoritePlaceIds);
        setAddress(data.savedAddress || "");
        setSaveAddress(Boolean(data.savedAddress));
        onFavoritesChange?.(data.favoritePlaceIds);
        setOpen(!data.setupComplete);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos favoris.");
      } finally {
        if (active) setLoaded(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [onFavoritesChange]);

  useEffect(() => {
    if (!externalFavoritePlaceIds) return;
    setFavoritePlaceIds(externalFavoritePlaceIds);
    setSelectedPlaceIds(externalFavoritePlaceIds);
  }, [externalFavoritePlaceIds]);

  const manualMatches = useMemo(() => {
    const query = manualSearch.trim().toLocaleLowerCase("fr");
    if (query.length < 2) return [];
    return places.filter(place => place.nom.toLocaleLowerCase("fr").includes(query)).slice(0, 12);
  }, [manualSearch, places]);

  const favoriteNames = useMemo(() => favoritePlaceIds.map(id =>
    places.find(place => place.id === id)?.nom || id
  ), [favoritePlaceIds, places]);

  const togglePlace = (placeId: string) => {
    setSelectedPlaceIds(previous => previous.includes(placeId)
      ? previous.filter(id => id !== placeId)
      : previous.length < 20 ? [...previous, placeId] : previous);
  };

  const handleFindNearest = async () => {
    if (!user || !address.trim()) return;
    setError("");
    setNotice("");
    setGeocoding(true);
    try {
      const data = await authorizedFetch(user, "/api/tournees/proximite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() })
      });
      setMatchedAddress(data.matchedAddress);
      setConfirmedAddress(data.matchedAddress);
      setSuggestedPlaces(data.nearest);
      if (data.nearest.length === 0) setNotice("Aucun lieu géolocalisé n'a été trouvé à proximité. Vous pouvez choisir vos favoris manuellement.");
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Impossible de trouver les lieux proches.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      if (saveAddress && !confirmedAddress) {
        setError("Recherchez d'abord cette adresse pour confirmer qu'elle est dans la commune.");
        return;
      }
      const savedAddress = saveAddress ? confirmedAddress : null;
      const data = await authorizedFetch(user, "/api/member-place-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoritePlaceIds: selectedPlaceIds, setupComplete: true, savedAddress })
      }) as PreferencesResponse;
      setFavoritePlaceIds(data.favoritePlaceIds);
      setSelectedPlaceIds(data.favoritePlaceIds);
      setAddress(data.savedAddress || "");
      setSaveAddress(Boolean(data.savedAddress));
      onFavoritesChange?.(data.favoritePlaceIds);
      setOpen(false);
      setNotice("Vos lieux favoris ont été enregistrés.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer vos favoris.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      await authorizedFetch(user, "/api/member-place-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoritePlaceIds, setupComplete: true, savedAddress: saveAddress ? confirmedAddress || null : null })
      });
      setOpen(false);
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : "Impossible d'enregistrer ce choix.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !user) return null;

  return (
    <section className="border-b border-stone-200 pb-5" aria-labelledby="member-favorites-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="member-favorites-title" className="flex items-center gap-2 text-base font-bold text-stone-900">
            <Heart size={17} className="text-rose-700" aria-hidden="true" /> Mes lieux-dits favoris
          </h2>
          {favoriteNames.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {favoriteNames.map((name, index) => <span key={`${favoritePlaceIds[index]}-${name}`} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-900">{name}</span>)}
            </div>
          ) : <p className="mt-1 text-sm text-stone-600">Aucun favori enregistré.</p>}
        </div>
        <button type="button" onClick={() => { setError(""); setNotice(""); setSelectedPlaceIds(favoritePlaceIds); setOpen(value => !value); }} aria-expanded={open} className="btn-secondary shrink-0 px-3 py-2 text-sm">
          <Heart size={15} aria-hidden="true" /> {open ? "Fermer" : favoriteNames.length ? "Modifier mes favoris" : "Choisir mes favoris"}
        </button>
      </div>

      {notice && <p role="status" aria-live="polite" className="mt-3 text-sm font-medium text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mt-3 border-l-4 border-rose-600 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{error}</p>}

      {open && (
        <form onSubmit={handleSave} className="mt-4 space-y-4 border-t border-stone-200 pt-4">
          <p className="max-w-3xl text-sm text-stone-600">Saisissez votre adresse, même dans une commune voisine, pour proposer les trois lieux-dits géolocalisés les plus proches, ou choisissez directement vos favoris. Cette sélection restera privée.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label htmlFor="favorite-home-address" className="block min-w-0 flex-1 text-sm font-medium text-stone-700">
              Adresse du domicile
              <input id="favorite-home-address" type="text" minLength={5} maxLength={180} autoComplete="street-address" value={address} onChange={event => { setAddress(event.target.value); setMatchedAddress(""); setConfirmedAddress(""); }} placeholder="Adresse et commune" className="input-base mt-1" />
            </label>
            <button type="button" onClick={() => void handleFindNearest()} disabled={geocoding || address.trim().length < 5} className="btn-secondary min-h-11 shrink-0">
              {geocoding ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <MapPin size={17} aria-hidden="true" />}
              {geocoding ? "Recherche…" : "Proposer les plus proches"}
            </button>
          </div>
          {matchedAddress && <p className="text-sm text-stone-700">Adresse reconnue : <strong>{matchedAddress}</strong></p>}
          <label className="flex max-w-3xl items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={saveAddress} onChange={event => setSaveAddress(event.currentTarget.checked)} className="mt-0.5 size-4 accent-emerald-700" />
            <span className="flex items-start gap-1.5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-800" aria-hidden="true" />Mémoriser cette adresse dans mon espace privé. Elle ne sera visible que par moi; décochez pour ne conserver que les lieux favoris.</span>
          </label>

          {suggestedPlaces.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">Suggestions proches · {selectedPlaceIds.length}/20 favoris</legend>
              <div className="mt-2 divide-y divide-stone-100 border-y border-stone-200 bg-white">
                {suggestedPlaces.map(place => (
                  <label key={place.id} className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-stone-50">
                    <input type="checkbox" checked={selectedPlaceIds.includes(place.id)} onChange={() => togglePlace(place.id)} className="size-4 accent-emerald-700" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{place.nom}</span>
                    <span className="shrink-0 text-xs text-stone-500">{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${place.distanceKm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="favorite-place-search" className="relative block max-w-xl">
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input id="favorite-place-search" type="search" value={manualSearch} onChange={event => setManualSearch(event.target.value)} className="input-base py-2 pl-9" placeholder="Ajouter un autre lieu-dit" />
            </label>
            {manualSearch.trim().length >= 2 && (
              <div className="mt-1 max-w-xl divide-y divide-stone-100 border border-stone-200 bg-white">
                {manualMatches.length ? manualMatches.map(place => (
                  <label key={place.id} className="flex min-h-10 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-stone-50">
                    <input type="checkbox" checked={selectedPlaceIds.includes(place.id)} onChange={() => togglePlace(place.id)} className="size-4 accent-emerald-700" />
                    <span className="text-sm font-medium text-stone-800">{place.nom}</span>
                  </label>
                )) : <p className="px-3 py-2 text-sm text-stone-500">Aucun lieu-dit trouvé.</p>}
              </div>
            )}
          </div>

          <p className="text-xs text-stone-500">Jusqu'à 20 favoris. Vous pourrez les modifier plus tard depuis la carte ou les campagnes.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving || selectedPlaceIds.length > 20} className="btn-primary">
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Heart size={17} aria-hidden="true" />}
              Enregistrer mes favoris
            </button>
            <button type="button" onClick={handleSkip} disabled={saving} className="btn-secondary">Passer cette étape</button>
            <button type="button" onClick={() => setOpen(false)} disabled={saving} aria-label="Fermer sans enregistrer" className="btn-secondary px-3"><X size={17} aria-hidden="true" /></button>
          </div>
        </form>
      )}
    </section>
  );
}
