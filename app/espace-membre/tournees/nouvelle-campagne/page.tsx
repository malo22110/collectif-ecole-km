"use client";

// [SPEC-TRACTATION-02] Only validated tractation managers can create a campaign from this dedicated view.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, FileUp, Heart, Loader2, MapPin, Megaphone, Search } from "lucide-react";
import { auth } from "@/lib/firebase";

type Place = { id: string; nom: string; foyers: number };
type CampaignBootstrap = { places: Place[]; canCreate: boolean };
type PrivatePreferences = { favoritePlaceIds: string[] };

async function authorizedRequest(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "La requête a échoué.");
  return data;
}

export default function NouvelleCampagnePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setError("Connectez-vous avec un compte membre pour créer une campagne.");
        setLoading(false);
        return;
      }
      void Promise.all([
        authorizedRequest(currentUser, "/api/tractation") as Promise<CampaignBootstrap>,
        authorizedRequest(currentUser, "/api/member-place-preferences") as Promise<PrivatePreferences>
      ]).then(([campaignData, preferences]) => {
        if (!active) return;
        setPlaces(campaignData.places || []);
        setCanCreate(campaignData.canCreate);
        setFavoriteIds(preferences.favoritePlaceIds || []);
        setSelectedIds((campaignData.places || []).map(place => place.id));
      }).catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger les lieux-dits.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const visiblePlaces = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return places.filter(place => !normalizedSearch || place.nom.toLocaleLowerCase("fr").includes(normalizedSearch));
  }, [places, search]);
  const allPlacesSelected = places.length > 0 && places.every(place => selectedIds.includes(place.id));

  const togglePlace = (placeId: string) => {
    setSelectedIds(current => current.includes(placeId)
      ? current.filter(id => id !== placeId)
      : current.length < 200 ? [...current, placeId] : current);
  };

  const handleFile = (selectedFile?: File) => {
    setError("");
    if (!selectedFile) { setFile(null); return; }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type) || selectedFile.size > 10 * 1024 * 1024) {
      setError("Choisissez un PDF ou une image JPEG, PNG ou WebP de 10 Mio maximum.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canCreate || !selectedIds.length) return;
    setSaving(true);
    setError("");
    try {
      const campaign = await authorizedRequest(user, "/api/tractation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, lieuDitIds: selectedIds })
      }) as { id: string };
      setCreated(true);
      if (file) {
        try {
          await authorizedRequest(user, `/api/tractation/${campaign.id}/document`, {
            method: "POST",
            headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) },
            body: file
          });
        } catch {
          setError("La campagne est créée, mais le document n'a pas pu être téléversé. Vous pouvez le réessayer depuis la campagne.");
          setSaving(false);
          return;
        }
      }
      router.push("/espace-membre/tournees");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de créer la campagne.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-full w-full max-w-5xl space-y-5 bg-stone-50 p-4 md:p-8">
      <Link href="/espace-membre/tournees" className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-stone-700 hover:text-emerald-900">
        <ArrowLeft size={17} aria-hidden="true" /> Retour à la carte et aux campagnes
      </Link>
      <header className="border-b border-stone-200 pb-4">
        <h1 className="flex items-center gap-3 text-2xl font-black text-stone-900 md:text-3xl"><Megaphone size={27} className="text-emerald-800" aria-hidden="true" /> Nouvelle campagne</h1>
        <p className="mt-2 text-sm text-stone-600">Choisissez les lieux à couvrir et les informations à transmettre.</p>
      </header>

      {error && <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}
      {loading ? <p role="status" className="py-10 text-center text-sm text-stone-500"><Loader2 size={18} className="mr-2 inline animate-spin" />Chargement…</p>
        : !canCreate ? <p className="border-y border-stone-200 py-6 text-sm text-stone-700">La création est réservée aux responsables tractation.</p>
          : created ? <div className="flex flex-wrap items-center justify-between gap-4 border-y border-emerald-200 bg-emerald-50 p-4"><p className="font-semibold text-emerald-900">Campagne créée.</p><Link href="/espace-membre/tournees" className="btn-primary min-h-10 px-4 py-2">Retour à la carte</Link></div>
            : <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
              <div className="space-y-4">
                <label className="input-label">Nom de campagne<input required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} className="input-base mt-1" placeholder="Ex. Tractage du bourg" /></label>
                <label className="input-label">Message informatif<textarea required maxLength={4000} rows={7} value={message} onChange={event => setMessage(event.target.value)} className="input-base mt-1 resize-y" placeholder="Consignes, informations à transmettre, organisation…" /></label>
                <div>
                  <label htmlFor="campaign-document" className="input-label">Document à partager <span className="font-normal text-stone-500">(facultatif)</span></label>
                  <input id="campaign-document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => handleFile(event.currentTarget.files?.[0])} className="block w-full rounded-lg border border-stone-300 bg-white text-sm text-stone-700 file:mr-4 file:border-0 file:bg-stone-100 file:px-4 file:py-2.5 file:font-semibold file:text-stone-700 hover:file:bg-stone-200" />
                  {file && <p className="mt-1 text-xs text-stone-600">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} Mio</p>}
                </div>
                <button type="submit" disabled={saving || selectedIds.length === 0} className="btn-primary min-h-11 w-full sm:w-auto"><Megaphone size={17} aria-hidden="true" />{saving ? "Publication…" : `Publier la campagne · ${selectedIds.length} lieux`}</button>
              </div>

              <fieldset className="min-w-0">
                <legend className="input-label">Lieux ciblés <span className="font-normal text-stone-500">({selectedIds.length} sélectionnés)</span></legend>
                <label className="relative mb-2 block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} className="input-base py-2 pl-9" placeholder="Chercher un lieu-dit" /></label>
                <div className="mb-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedIds(allPlacesSelected ? [] : places.map(place => place.id))} disabled={!places.length} aria-pressed={allPlacesSelected} className="btn-secondary min-h-10 px-3 py-2 text-sm"><MapPin size={15} aria-hidden="true" />{allPlacesSelected ? "Aucun" : "Tous"}</button>
                  <button type="button" onClick={() => setSelectedIds(current => Array.from(new Set([...current, ...favoriteIds])).slice(0, 200))} disabled={!favoriteIds.length} className="btn-secondary min-h-10 px-3 py-2 text-sm"><Heart size={15} className="fill-rose-200 text-rose-700" aria-hidden="true" />Ajouter mes favoris</button>
                </div>
                <div className="max-h-[55vh] overflow-y-auto border-y border-stone-200 bg-white">
                  {visiblePlaces.map(place => <label key={place.id} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-stone-100 px-3 py-2 last:border-0 hover:bg-stone-50"><input type="checkbox" checked={selectedIds.includes(place.id)} onChange={() => togglePlace(place.id)} className="size-4 accent-emerald-700" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{place.nom}</span>{favoriteIds.includes(place.id) && <Heart size={14} className="fill-rose-200 text-rose-700" aria-label="Lieu favori" />}</label>)}
                </div>
                <p className="mt-2 text-xs text-stone-500">Tous les lieux sont sélectionnés par défaut. Vous pouvez ensuite affiner la sélection.</p>
              </fieldset>
            </form>}
    </main>
  );
}
