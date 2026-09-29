"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ExportMembers() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "membres"));
      const emails = snapshot.docs
        .map(doc => doc.data().email)
        .filter(email => email) // filtrer les potentiels champs vides
        .join(", ");

      const blob = new Blob([emails], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `emails_membres_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors de l'export:", err);
      alert("Erreur lors de l'export. Êtes-vous bien connecté ?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-stone-900 text-lg">Exporter les e-mails</h3>
        <p className="text-stone-500 text-sm mt-1">
          Télécharge la liste de tous les e-mails de la base de données (séparés par des virgules) pour un envoi groupé (Cci).
        </p>
      </div>
      <button 
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 shrink-0"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        Télécharger la liste
      </button>
    </div>
  );
}
