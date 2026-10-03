"use strict";
"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { publishCmsPageRevision } from "@/lib/cmsRevisionClient";
import { Save, AlertCircle, RefreshCw } from "lucide-react";

export default function CmsPageEditor({ pageId = "historique" }: { pageId?: string }) {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "pages", pageId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPageData(snap.data());
        setJsonString(JSON.stringify(snap.data(), null, 2));
      } else {
        setError("Page introuvable en base de données.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const parsedData = JSON.parse(jsonString);
      // [SPEC-CMS-HISTORY-01] Le mode expert passe par le même archivage transactionnel.
      const result = await publishCmsPageRevision(parsedData, "expert");
      const savedData = { ...parsedData, version: result.version };
      setPageData(savedData);
      setJsonString(JSON.stringify(savedData, null, 2));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Erreur JSON invalide : " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-4 bg-white rounded-xl border border-stone-200">Chargement de la page...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mt-8">
      <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
        <div>
          <h3 className="font-bold text-stone-900">Éditeur de page CMS (Mode Expert)</h3>
          <p className="text-sm text-stone-500">Modification directe de la structure de la page <code className="bg-stone-200 px-1.5 py-0.5 rounded">/{pageId}</code></p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPage} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} /> Recharger
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </div>
      </div>
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-rose-50 text-rose-700 p-4 rounded-xl flex items-center gap-2 border border-rose-200">
            <AlertCircle size={20} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-2 border border-emerald-200">
            Page sauvegardée avec succès !
          </div>
        )}
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
          <strong>Attention :</strong> Cet éditeur modifie directement le code de la page. Vérifiez bien que votre JSON est valide avant d'enregistrer. Une virgule manquante empêchera la sauvegarde.
        </p>
        <textarea
          value={jsonString}
          onChange={(e) => setJsonString(e.target.value)}
          className="w-full h-[600px] font-mono text-sm p-4 bg-stone-900 text-stone-100 rounded-xl border-stone-700 focus:ring-emerald-500 focus:border-emerald-500"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
