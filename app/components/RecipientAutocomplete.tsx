"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { Loader2, Search, UserRound, X } from "lucide-react";

export interface RecipientOption {
  id: string;
  label: string;
  description?: string;
  value: string;
}

interface RecipientAutocompleteProps {
  label: string;
  selected: RecipientOption | null;
  onChange: (option: RecipientOption | null) => void;
  searchUrl?: string;
  placeholder?: string;
}

// [SPEC-MAIL-03] Reusable async member autocomplete for email and future admin workflows.
export default function RecipientAutocomplete({
  label,
  selected,
  onChange,
  searchUrl = "/api/mail-outbox/recipients",
  placeholder = "Rechercher par nom ou e-mail"
}: RecipientAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<RecipientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2 || selected) {
      setOptions([]);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        if (active) setError("Votre session a expiré. Reconnectez-vous.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${searchUrl}?q=${encodeURIComponent(normalized)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "La recherche a échoué.");
        if (active) setOptions(Array.isArray(data?.items) ? data.items : []);
      } catch (searchError) {
        if (active) setError(searchError instanceof Error ? searchError.message : "La recherche a échoué.");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, selected, searchUrl]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <label className="block text-sm font-semibold text-stone-700">
        {label}
        <span className="relative mt-1 block">
          <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            role="combobox"
            aria-expanded={open && !selected}
            aria-autocomplete="list"
            aria-controls="recipient-autocomplete-options"
            autoComplete="off"
            value={selected ? selected.label : query}
            readOnly={Boolean(selected)}
            onFocus={() => setOpen(true)}
            onChange={event => { setSelectedSafe(null); setQuery(event.target.value); setOpen(true); }}
            onKeyDown={event => {
              if (event.key === "Escape") setOpen(false);
              if (event.key === "Backspace" && selected) { onChange(null); setQuery(""); }
            }}
            placeholder={placeholder}
            className="input-base min-h-11 pl-9 pr-10"
          />
          {selected
            ? <button type="button" aria-label="Effacer le destinataire" onClick={() => { onChange(null); setQuery(""); setOpen(true); }} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded text-stone-500 hover:bg-stone-100"><X size={16} /></button>
            : loading && <Loader2 size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-stone-500" />}
        </span>
      </label>
      {error && <p role="alert" className="mt-1 text-xs text-rose-700">{error}</p>}
      {open && !selected && query.trim().length >= 2 && <ul id="recipient-autocomplete-options" role="listbox" aria-label="Résultats membres" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-stone-200 bg-white shadow-lg">
        {!loading && options.length === 0
          ? <li className="px-3 py-3 text-sm text-stone-500">Aucun membre trouvé.</li>
          : options.map(option => <li key={option.id} role="option" aria-selected="false">
            <button type="button" onClick={() => { onChange(option); setQuery(""); setOptions([]); setOpen(false); }} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none">
              <UserRound size={17} aria-hidden="true" className="shrink-0 text-emerald-800" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-900">{option.label}</span>{option.description && <span className="block truncate text-xs text-stone-500">{option.description}</span>}</span>
            </button>
          </li>)}
      </ul>}
    </div>
  );

  function setSelectedSafe(value: null) {
    if (selected) onChange(value);
  }
}