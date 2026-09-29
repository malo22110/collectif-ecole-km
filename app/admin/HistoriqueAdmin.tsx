"use client";

import React, { useState, useCallback } from "react";
import VisualCmsEditor from "./VisualCmsEditor";
import CmsPageEditor from "./CmsPageEditor";
import DraftReviewPanel from "./DraftReviewPanel";
import { LayoutTemplate, Code2, GitPullRequest } from "lucide-react";

export default function HistoriqueAdmin({
  onDirtyChange,
  isAdmin = true,
  userEmail = "",
}: {
  onDirtyChange?: (dirty: boolean) => void;
  isAdmin?: boolean;
  userEmail?: string;
} = {}) {
  const [mode, setMode] = useState<"visual" | "expert">("visual");
  const [isDirty, setIsDirty] = useState(false);
  const [isSimplified, setIsSimplified] = useState(false);
  // Onglet admin : éditeur ou révisions en attente
  const [adminTab, setAdminTab] = useState<"editor" | "reviews">("editor");

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
          {/* Toggle résumé / détails pour la preview (mode visuel uniquement) */}
          {mode === "visual" && adminTab === "editor" && (
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

          {/* Switch mode éditeur (admins seulement) */}
          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Onglets Éditeur / Révisions (admins seulement) */}
      {isAdmin && (
        <div className="flex gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200 mb-5 w-fit">
          <button
            onClick={() => setAdminTab("editor")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${adminTab === "editor" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            <LayoutTemplate size={14} /> Éditeur
          </button>
          <button
            onClick={() => setAdminTab("reviews")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${adminTab === "reviews" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
          >
            <GitPullRequest size={14} /> Révisions en attente
          </button>
        </div>
      )}

      {/* Contenu selon onglet */}
      {adminTab === "reviews" ? (
        <DraftReviewPanel />
      ) : mode === "expert" ? (
        <CmsPageEditor pageId="historique" />
      ) : (
        // Mode visuel : layout côte-à-côte par bloc (showPreview=true)
        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <VisualCmsEditor
            pageId="historique"
            onDirtyChange={handleDirtyChange}
            showPreview={true}
            isSimplified={isSimplified}
            isAdmin={isAdmin}
            userEmail={userEmail}
          />
        </div>
      )}
    </div>
  );
}
