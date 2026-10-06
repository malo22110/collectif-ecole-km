"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, Check, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { auth } from "@/lib/firebase";

const CoordinatePicker = dynamic(() => import("./CoordinatePicker"), { ssr: false });

type Place = { id: string; nom: string; foyers: number; lat: number | null; lon: number | null };
type PlaceForm = { nom: string; foyers: string; lat: string; lon: string };
const emptyForm: PlaceForm = { nom: "", foyers: "0", lat: "", lon: "" };

async function authorizedRequest(user: User, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Impossible de gérer ce lieu-dit.");
  return data;
}

// [SPEC-TRACTATION-14] Managers can locate missing places and manage the shared locality list.
export default function GestionLieuxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"missing" | "all">("missing");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaceForm>(emptyForm);
  const [toDelete, setToDelete] = useState<Place | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const currentRequest = ++requestId;
      setUser(currentUser);
      setAllowed(false);
      setLoading(Boolean(currentUser));
      setError("");
      if (!currentUser) {
        setEditingId(null);
        dialogRef.current?.close();
        setError("Connectez-vous avec un compte responsable tractation pour gérer les lieux-dits.");
        setLoading(false);
        return;
      }
      void authorizedRequest(currentUser, "/api/tractation/lieux")
        .then((data: { places: Place[] }) => {
          if (active && currentRequest === requestId) {
            setPlaces(data.places);
            setAllowed(true);
          }
        })
        .catch((loadError) => {
          if (active && currentRequest === requestId)
            setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
        })
        .finally(() => {
          if (active && currentRequest === requestId) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (toDelete && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [toDelete]);

  const missing = places.filter((place) => place.lat === null || place.lon === null).length;
  const visiblePlaces = places.filter(
    (place) =>
      (filter === "all" || place.lat === null || place.lon === null) &&
      place.nom.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")),
  );
  const latitude = form.lat.trim() === "" ? null : Number(form.lat);
  const longitude = form.lon.trim() === "" ? null : Number(form.lon);
  const pickerValue =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
      ? { lat: latitude, lon: longitude }
      : null;

  const beginEdit = (place?: Place) => {
    setError("");
    setEditingId(place?.id ?? "new");
    setForm(
      place
        ? {
            nom: place.nom,
            foyers: String(place.foyers),
            lat: place.lat === null ? "" : String(place.lat),
            lon: place.lon === null ? "" : String(place.lon),
          }
        : emptyForm,
    );
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !editingId) return;
    const lat = form.lat.trim();
    const lon = form.lon.trim();
    if ((lat === "") !== (lon === "")) {
      setError("Saisissez la latitude et la longitude ensemble.");
      return;
    }
    const input = {
      nom: form.nom.trim(),
      foyers: Number(form.foyers),
      lat: lat === "" ? null : Number(lat),
      lon: lon === "" ? null : Number(lon),
    };
    setBusy(true);
    setError("");
    try {
      const creating = editingId === "new";
      const result = (await authorizedRequest(
        user,
        creating
          ? "/api/tractation/lieux"
          : `/api/tractation/lieux/${encodeURIComponent(editingId)}`,
        {
          method: creating ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      )) as { place: Place };
      setPlaces((current) =>
        [...current.filter((place) => place.id !== result.place.id), result.place].sort((a, b) =>
          a.nom.localeCompare(b.nom, "fr"),
        ),
      );
      setEditingId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!user || !toDelete) return;
    setBusy(true);
    setError("");
    try {
      await authorizedRequest(user, `/api/tractation/lieux/${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      setPlaces((current) => current.filter((place) => place.id !== toDelete.id));
      if (editingId === toDelete.id) setEditingId(null);
      dialogRef.current?.close();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full bg-stone-50 px-4 py-6 text-stone-900 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start gap-3 border-b border-stone-200 pb-5">
          <Link
            href="/espace-membre/tournees"
            aria-label="Retour aux campagnes"
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-stone-300 bg-white"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">Gérer les lieux-dits</h1>
            <p className="mt-1 text-sm text-stone-600">
              {missing} sans position GPS sur {places.length} lieux-dits
            </p>
          </div>
          {!loading && allowed && (
            <button type="button" onClick={() => beginEdit()} className="btn-primary min-h-11 px-3">
              <Plus size={18} aria-hidden="true" /> Ajouter
            </button>
          )}
        </header>

        {error && (
          <p
            role="alert"
            className="border-l-4 border-rose-700 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Loader2 size={18} className="animate-spin" />
            Chargement…
          </p>
        ) : (
          allowed && (
            <>
              {editingId && (
                <form
                  onSubmit={(event) => void save(event)}
                  className="space-y-4 border-y border-stone-200 bg-white py-5"
                  aria-label={editingId === "new" ? "Ajouter un lieu-dit" : "Modifier un lieu-dit"}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold">
                      {editingId === "new" ? "Ajouter un lieu-dit" : "Modifier un lieu-dit"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Fermer le formulaire"
                      className="grid size-10 place-items-center"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="input-label">
                      Nom
                      <input
                        required
                        maxLength={120}
                        value={form.nom}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, nom: event.target.value }))
                        }
                        className="input-base mt-1"
                      />
                    </label>
                    <label className="input-label">
                      Nombre de foyers
                      <input
                        required
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        value={form.foyers}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, foyers: event.target.value }))
                        }
                        className="input-base mt-1"
                      />
                    </label>
                    <label className="input-label">
                      Latitude
                      <input
                        type="number"
                        min={-90}
                        max={90}
                        step="any"
                        placeholder="48.28"
                        value={form.lat}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lat: event.target.value }))
                        }
                        className="input-base mt-1"
                      />
                    </label>
                    <label className="input-label">
                      Longitude
                      <input
                        type="number"
                        min={-180}
                        max={180}
                        step="any"
                        placeholder="-3.31"
                        value={form.lon}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lon: event.target.value }))
                        }
                        className="input-base mt-1"
                      />
                    </label>
                  </div>
                  <CoordinatePicker
                    value={pickerValue}
                    onChange={(point) =>
                      setForm((current) => ({
                        ...current,
                        lat: point.lat.toFixed(6),
                        lon: point.lon.toFixed(6),
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary min-h-11 px-4 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Check size={17} aria-hidden="true" />
                      )}{" "}
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-secondary min-h-11 px-4"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="group"
                  aria-label="Filtrer les lieux-dits"
                  className="inline-flex rounded-md border border-stone-300 bg-white p-1"
                >
                  <button
                    type="button"
                    aria-pressed={filter === "missing"}
                    onClick={() => setFilter("missing")}
                    className={`min-h-10 rounded px-3 text-sm font-semibold ${filter === "missing" ? "bg-emerald-800 text-white" : "text-stone-700"}`}
                  >
                    Sans GPS ({missing})
                  </button>
                  <button
                    type="button"
                    aria-pressed={filter === "all"}
                    onClick={() => setFilter("all")}
                    className={`min-h-10 rounded px-3 text-sm font-semibold ${filter === "all" ? "bg-emerald-800 text-white" : "text-stone-700"}`}
                  >
                    Tous ({places.length})
                  </button>
                </div>
                <label className="relative min-w-48 flex-1 sm:max-w-sm">
                  <span className="sr-only">Rechercher un lieu-dit</span>
                  <Search
                    size={17}
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher un lieu-dit"
                    className="input-base min-h-11 pl-9"
                  />
                </label>
              </div>
              <ul
                aria-label="Lieux-dits"
                className="divide-y divide-stone-200 border-y border-stone-200"
              >
                {visiblePlaces.map((place) => (
                  <li key={place.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md ${place.lat === null ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}
                    >
                      <MapPin size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-36 flex-1">
                      <strong className="block text-sm">{place.nom}</strong>
                      <span className="text-xs text-stone-600">
                        {place.foyers} foyers ·{" "}
                        {place.lat === null
                          ? "Sans position GPS"
                          : `${place.lat.toFixed(5)}, ${place.lon?.toFixed(5)}`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => beginEdit(place)}
                      aria-label={`Modifier ${place.nom}`}
                      title={`Modifier ${place.nom}`}
                      className="grid size-11 place-items-center rounded-md border border-stone-300 bg-white text-stone-700"
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setToDelete(place);
                      }}
                      aria-label={`Supprimer ${place.nom}`}
                      title={`Supprimer ${place.nom}`}
                      className="grid size-11 place-items-center rounded-md border border-rose-200 bg-white text-rose-800"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {!visiblePlaces.length && (
                  <li className="py-6 text-center text-sm text-stone-600">
                    Aucun lieu-dit dans cette liste.
                  </li>
                )}
              </ul>
            </>
          )
        )}
        {toDelete && (
          <dialog
            ref={dialogRef}
            onClose={() => setToDelete(null)}
            onCancel={(event) => {
              if (busy) event.preventDefault();
            }}
            aria-labelledby="delete-place-title"
            aria-describedby="delete-place-description"
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-stone-200 bg-white p-5 text-stone-900 shadow-xl backdrop:bg-stone-950/60"
          >
            <h2 id="delete-place-title" className="text-lg font-bold">
              Supprimer {toDelete.nom} ?
            </h2>
            <p id="delete-place-description" className="mt-3 text-sm leading-6">
              Ce lieu-dit disparaîtra de la carte et des listes. Cette action est irréversible. Un
              lieu utilisé dans une campagne ne peut pas être supprimé.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-rose-800">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                disabled={busy}
                onClick={() => dialogRef.current?.close()}
                className="btn-secondary min-h-11 justify-center px-4"
              >
                Conserver
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 size={17} aria-hidden="true" />
                )}{" "}
                Supprimer le lieu
              </button>
            </div>
          </dialog>
        )}
      </div>
    </main>
  );
}
