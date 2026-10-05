"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  Plus,
  ScanText,
  Trash2,
  Cloud,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { scanPetitionWithGemini } from "@/lib/petitionGemini";

interface ScanEntry {
  fullName: string;
  ville: string;
  qualite: string;
  confidence: number;
  method?: "gemini" | "manual";
  manual?: boolean;
}

interface DuplicateMatch {
  entryIndex: number;
  candidates: Array<{ fullName: string; ville: string; source: string }>;
}

export default function NumeriserPetitionPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    importedCount: number;
    potentialDuplicateCount: number;
  } | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const sendEntries = async (action: "review" | "import") => {
    const user = auth.currentUser;
    if (!user) throw new Error("Votre session a expiré. Reconnectez-vous.");

    const response = await fetch("/api/signatures/paper-import", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action,
        entries: entries.map(({ fullName, ville, qualite, confidence }) => ({
          fullName,
          ville,
          qualite,
          confidence,
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "La demande n'a pas abouti.");
    return data;
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!selectedFile) return;
    setError("");
    setResult(null);
    setMatches([]);
    setReviewed(false);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Choisissez une photo au format image.");
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("La photo doit faire moins de 15 Mo.");
      return;
    }

    setPhoto(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setEntries([]);
  };

  const runGeminiScan = async () => {
    if (!photo) return;

    setError("");
    setMatches([]);
    setReviewed(false);
    setResult(null);
    setProcessing(true);
    try {
      const rows = await scanPetitionWithGemini(photo);
      setEntries(rows);
      if (rows.length === 0) {
        setError(
          "Gemini n'a reconnu aucune ligne exploitable. Vous pouvez les saisir manuellement.",
        );
      }
    } catch (scanError) {
      const message =
        scanError instanceof Error ? scanError.message : "La lecture Gemini a échoué.";
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const updateEntry = (index: number, field: keyof ScanEntry, value: string) => {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: field === "confidence" ? Number(value) : value,
            }
          : entry,
      ),
    );
    setMatches([]);
    setReviewed(false);
    setResult(null);
  };

  const addManualEntry = () => {
    setError("");
    setEntries((current) =>
      current.length >= 60
        ? current
        : [
            ...current,
            {
              fullName: "",
              ville: "",
              qualite: "",
              confidence: 100,
              manual: true,
            },
          ],
    );
    setMatches([]);
    setReviewed(false);
  };

  const removeEntry = (index: number) => {
    setEntries((current) => current.filter((_, entryIndex) => entryIndex !== index));
    setMatches([]);
    setReviewed(false);
  };

  const reviewDuplicates = async () => {
    setError("");
    if (entries.length === 0 || entries.some((entry) => entry.fullName.trim().length < 2)) {
      setError("Chaque ligne doit contenir au moins un prénom et un nom.");
      return;
    }

    setSaving(true);
    try {
      const data = await sendEntries("review");
      setMatches(data.matches || []);
      setReviewed(true);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "La vérification des doublons a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  const importEntries = async () => {
    if (!reviewed) return;
    setError("");
    setSaving(true);
    try {
      const data = await sendEntries("import");
      setResult({
        importedCount: data.importedCount,
        potentialDuplicateCount: data.potentialDuplicateCount,
      });
      setEntries([]);
      setMatches([]);
      setReviewed(false);
      setPhoto(null);
      setPreviewUrl("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "L'ajout des signatures a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    // [SPEC-PET-SCAN-06] Preserve scroll space below the final action on mobile, including the device safe area.
    <main className="min-h-full overflow-y-auto bg-stone-50 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="flex items-center gap-3 text-2xl font-black text-stone-900 md:text-3xl">
            <ScanText className="text-emerald-700" size={30} /> Numériser une pétition papier
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-600">
            Photographiez une page, relisez les champs reconnus et vérifiez les correspondances
            possibles avant d'ajouter les signataires.
          </p>
        </header>

        <section className="border-y border-stone-200 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-stone-900">1. Photo de la page</h2>
              <p className="mt-1 text-sm text-stone-600">
                Une photo à la fois. Pour un formulaire de plusieurs pages, recommencez après chaque
                ajout.
              </p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-700">
              <Camera size={18} /> Prendre ou choisir une photo
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhoto}
                className="sr-only"
                aria-label="Prendre ou choisir une photo de pétition"
              />
            </label>
          </div>

          {photo && (
            <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <figure className="min-w-0">
                <img
                  src={previewUrl}
                  alt="Aperçu local de la page photographiée"
                  className="max-h-[520px] w-full rounded-lg border border-stone-300 bg-white object-contain"
                />
                <figcaption className="mt-2 truncate text-xs text-stone-500">
                  {photo.name}
                </figcaption>
              </figure>
              <div className="self-center rounded-lg bg-white p-5 ring-1 ring-stone-200">
                {processing ? (
                  <div role="status" className="flex items-center gap-3 text-stone-700">
                    <Loader2 className="animate-spin text-emerald-700" size={22} />
                    <p className="font-semibold">Lecture en cours…</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-stone-700">
                      La photo reste sur cet appareil jusqu'à ce que vous lanciez le scanner.
                    </p>
                    <p className="text-xs leading-relaxed text-stone-600">
                      La photo sert à préparer la transcription. Elle n'est pas publiée sur le site
                      et les autres membres ne la voient pas.
                    </p>
                    <button
                      type="button"
                      onClick={runGeminiScan}
                      disabled={!photo}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-700 bg-white px-4 py-2 font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Cloud size={18} /> Envoyer la photo et scanner
                    </button>
                    <details className="text-xs text-stone-500">
                      <summary className="cursor-pointer font-medium text-stone-600">
                        À propos des données transmises
                      </summary>
                      <p className="mt-2 leading-relaxed">
                        En cliquant sur le bouton, la photo recadrée est envoyée à Google Gemini via
                        Firebase AI Logic pour analyse. Elle n'est pas publiée, visible par les
                        autres membres ni enregistrée par notre application. Seules les lignes que
                        vous relisez et confirmez sont ajoutées à la liste des signataires. Le
                        traitement par Google est soumis à ses conditions de service et de
                        confidentialité.
                      </p>
                    </details>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {result && (
          <div
            role="status"
            className="flex items-start gap-3 border-y border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-950"
          >
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={21} />
            <p>
              <strong>{result.importedCount} signature(s) ajoutée(s).</strong>{" "}
              {result.potentialDuplicateCount} entrée(s) marquée(s) comme doublon potentiel. Elles
              restent dans la base pour vérification des homonymes.
            </p>
          </div>
        )}

        {photo && !processing && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-stone-900">
                  2. Relire la transcription ({entries.length}/60)
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Corrigez chaque ligne. L’OCR manuscrit peut se tromper, en particulier sur les
                  noms.
                </p>
              </div>
              <button
                type="button"
                onClick={addManualEntry}
                disabled={entries.length >= 60}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-50"
              >
                <Plus size={17} /> Ajouter une ligne
              </button>
            </div>

            {entries.length === 0 && (
              <p className="text-sm text-stone-600">
                Aucune ligne détectée. Vous pouvez les saisir une par une en gardant la photo sous
                les yeux.
              </p>
            )}
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const duplicateMatch = matches.find((match) => match.entryIndex === index);
                return (
                  <article
                    key={`${index}-${entry.fullName}`}
                    className="grid gap-3 border-b border-stone-200 pb-4 md:grid-cols-[1.2fr_0.8fr_1fr_auto] md:items-end"
                  >
                    <label className="block text-sm font-medium text-stone-700">
                      Prénom et nom
                      <input
                        value={entry.fullName}
                        onChange={(event) => updateEntry(index, "fullName", event.target.value)}
                        maxLength={160}
                        className="input-base mt-1"
                        autoComplete="off"
                      />
                    </label>
                    <label className="block text-sm font-medium text-stone-700">
                      Commune
                      <input
                        value={entry.ville}
                        onChange={(event) => updateEntry(index, "ville", event.target.value)}
                        maxLength={120}
                        className="input-base mt-1"
                        placeholder="Kergrist-Moëlou ou autre"
                        autoComplete="off"
                      />
                    </label>
                    <label className="block text-sm font-medium text-stone-700">
                      Lien avec l'école
                      <input
                        value={entry.qualite}
                        onChange={(event) => updateEntry(index, "qualite", event.target.value)}
                        maxLength={160}
                        className="input-base mt-1"
                        placeholder="Parent, habitant, ancien élève…"
                        autoComplete="off"
                      />
                    </label>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <span
                        className={`text-xs ${entry.manual || entry.method === "manual" ? "text-stone-500" : entry.confidence < 70 ? "font-semibold text-amber-700" : "text-stone-500"}`}
                      >
                        {entry.manual || entry.method === "manual"
                          ? "Saisie manuelle"
                          : `Lecture assistée ${entry.confidence}%${entry.confidence < 70 ? " · à vérifier" : ""}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        aria-label={`Retirer la ligne ${index + 1}`}
                        title="Retirer cette ligne"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {duplicateMatch && (
                      <div className="md:col-span-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                        <p className="flex items-center gap-2 font-bold">
                          <AlertTriangle size={17} /> Correspondance possible (
                          {duplicateMatch.candidates.length})
                        </p>
                        <ul className="mt-2 space-y-1">
                          {duplicateMatch.candidates.map((candidate, candidateIndex) => (
                            <li key={`${candidate.fullName}-${candidate.ville}-${candidateIndex}`}>
                              {candidate.fullName} · {candidate.ville || "commune non précisée"} ·{" "}
                              {candidate.source}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2">
                          Il peut s'agir d'un homonyme. La nouvelle signature sera conservée et
                          marquée pour vérification.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={reviewDuplicates}
                disabled={
                  processing || saving || entries.some((entry) => entry.fullName.trim().length < 2)
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && !reviewed ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ScanText size={18} />
                )}
                Vérifier les doublons potentiels
              </button>
              <button
                type="button"
                onClick={importEntries}
                disabled={!reviewed || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && reviewed ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Ajouter les {entries.length} signatures
              </button>
            </div>
            {reviewed && matches.length === 0 && (
              <p role="status" className="text-sm text-emerald-800">
                Aucun doublon potentiel trouvé par comparaison du nom et de la commune. Les lignes
                seront tout de même ajoutées séparément.
              </p>
            )}
          </section>
        )}

        {error && (
          <p
            role="alert"
            className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
