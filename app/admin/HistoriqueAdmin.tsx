"use client";

import React, { useState, useCallback } from "react";
import VisualCmsEditor from "./VisualCmsEditor";
import CmsPageEditor from "./CmsPageEditor";
import { LayoutTemplate, Code2 } from "lucide-react";

export default function HistoriqueAdmin({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void } = {}) {
  const [mode, setMode] = useState<"visual" | "expert">("visual");
  const [isDirty, setIsDirty] = useState(false);

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
    <div className="mt-8 border-t border-stone-200 pt-8">
      <h2 className="text-2xl font-bold text-stone-900 mb-6">Édition de la page Historique</h2>
      
      <div className="flex bg-stone-100 p-1 rounded-xl w-fit mb-6">
        <button 
          onClick={() => handleModeChange("visual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "visual" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
        >
          <LayoutTemplate size={16} /> Mode Simplifié
        </button>
        <button 
          onClick={() => handleModeChange("expert")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "expert" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
        >
          <Code2 size={16} /> Mode Expert (JSON)
        </button>
      </div>

      {mode === "visual"
        ? <VisualCmsEditor pageId="historique" onDirtyChange={handleDirtyChange} />
        : <CmsPageEditor pageId="historique" />
      }
    </div>
  );
}
