"use client";

import React, { useState, useCallback } from "react";
import VisualCmsEditor from "./VisualCmsEditor";
import CmsPageEditor from "./CmsPageEditor";
import { LayoutTemplate, Code2 } from "lucide-react";

export default function HistoriqueAdmin({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void } = {}) {
  const [mode, setMode] = useState<"visual" | "expert">("visual");
  const [isDirty, setIsDirty] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [onDirtyChange]);

  const handleModeChange = (newMode: "visual" | "expert") => {
    if (isDirty) {
      const confirmed = window.confirm(
        "⚠️ Vous avez des modifications non sauvegardées.\n\nSi vous changez de mode, vos modifications seront perdues. Continuer quand même ?"
      );
      if (!confirmed) return;
    }
    setMode(newMode);
    setIsDirty(false);
  };

  return (
    <div className="mt-8 border-t border-stone-200 pt-6">
      {/* Barre de contrôle globale */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-stone-900">Édition de la page Historique</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle résumé / détails pour la preview */}
          {mode === "visual" && (
            <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setIsSimplified(false)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!isSimplified ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
              >
                Détails
              </button>
              <button
                onClick={() => setIsSimplified(true)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${isSimplified ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
              >
                Résumé
              </button>
            </div>
          )}

          {/* Switch mode éditeur */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg">
            <button
              onClick={() => handleModeChange("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "visual" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
            >
              <LayoutTemplate size={14} /> Simplifié
            </button>
            <button
              onClick={() => handleModeChange("expert")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "expert" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
            >
              <Code2 size={14} /> Expert
            </button>
          </div>
        </div>
      </div>

      {mode === "expert" ? (
        <CmsPageEditor pageId="historique" />
      ) : (
        // En mode visuel : VisualCmsEditor gère lui-même le layout côte-à-côte
        // via showPreview={true} → chaque bloc affiche [formulaire | aperçu] dans la même rangée
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <VisualCmsEditor
            pageId="historique"
            onDirtyChange={handleDirtyChange}
            showPreview={true}
            isSimplified={isSimplified}
          />
        </div>
      )}
    </div>
  );
}
