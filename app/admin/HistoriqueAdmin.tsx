"use client";

import React, { useState, useCallback } from "react";
import VisualCmsEditor from "./VisualCmsEditor";
import CmsPageEditor from "./CmsPageEditor";
import BlockRenderer from "../components/cms/BlockRenderer";
import { LayoutTemplate, Code2, Eye, EyeOff, Monitor, Smartphone } from "lucide-react";

export default function HistoriqueAdmin({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void } = {}) {
  const [mode, setMode] = useState<"visual" | "expert">("visual");
  const [isDirty, setIsDirty] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [isSimplified, setIsSimplified] = useState(false);
  // Mobile: "editor" ou "preview"
  const [mobilePanel, setMobilePanel] = useState<"editor" | "preview">("editor");

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [onDirtyChange]);

  const handlePageDataChange = useCallback((data: any) => {
    setLiveData(data);
  }, []);

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
          {mode === "visual" && liveData && (
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
        <>
          {/* Toggle mobile éditeur / preview */}
          <div className="flex lg:hidden bg-stone-100 p-0.5 rounded-xl mb-4 border border-stone-200">
            <button
              onClick={() => setMobilePanel("editor")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${mobilePanel === "editor" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
            >
              <LayoutTemplate size={15} /> Éditeur
            </button>
            <button
              onClick={() => setMobilePanel("preview")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${mobilePanel === "preview" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
            >
              <Eye size={15} /> Aperçu
            </button>
          </div>

          {/* Layout split-screen desktop */}
          <div className="flex gap-0 border border-stone-200 rounded-2xl overflow-hidden shadow-sm min-h-[80vh]">

            {/* Panneau ÉDITEUR */}
            <div className={`${mobilePanel === "preview" ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-1/2 border-r border-stone-200 overflow-y-auto`}>
              <VisualCmsEditor
                pageId="historique"
                onDirtyChange={handleDirtyChange}
                onPageDataChange={handlePageDataChange}
              />
            </div>

            {/* Panneau PREVIEW */}
            <div className={`${mobilePanel === "editor" ? "hidden" : "flex"} lg:flex flex-col w-full lg:w-1/2 bg-stone-50 overflow-y-auto`}>
              {/* Header preview */}
              <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex items-center gap-2">
                <Eye size={15} className="text-stone-400" />
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Aperçu en temps réel</span>
                {isDirty && (
                  <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Non sauvegardé
                  </span>
                )}
              </div>

              {/* Contenu preview */}
              <div className="py-6 overflow-x-hidden">
                {!liveData ? (
                  <div className="flex items-center justify-center h-40 text-stone-400 text-sm">
                    Chargement de l'aperçu...
                  </div>
                ) : (
                  liveData.blocks?.map((block: any, idx: number) => (
                    <BlockRenderer
                      key={idx}
                      block={block}
                      context={{ isSimplified, setActiveTopic: () => {}, commentCounts: {} }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
