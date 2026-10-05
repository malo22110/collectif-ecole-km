"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Printer } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function PetitionSignaturesExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePrint = async () => {
    setError("");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Votre session a expiré. Reconnectez-vous.");

      const response = await fetch("/api/admin/petition-export", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "L'extraction a échoué.");
      }

      const html = await response.text();
      const printFrame = document.createElement("iframe");
      printFrame.title = "Feuille de signatures de la pétition";
      printFrame.setAttribute("aria-hidden", "true");
      Object.assign(printFrame.style, {
        position: "fixed",
        right: "0",
        bottom: "0",
        width: "0",
        height: "0",
        border: "0",
      });
      printFrame.onload = () => {
        const printWindow = printFrame.contentWindow;
        if (!printWindow) {
          printFrame.remove();
          setError("Impossible d'ouvrir la feuille à imprimer.");
          return;
        }

        printWindow.addEventListener("afterprint", () => printFrame.remove(), {
          once: true,
        });
        printWindow.focus();
        printWindow.print();
      };
      printFrame.srcdoc = html;
      document.body.appendChild(printFrame);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "L'extraction a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-stone-900 text-lg">Liste consolidée des signataires</h3>
        <p className="mt-1 text-sm text-stone-600">
          Génère une extraction horodatée de toutes les signatures papier et en ligne, classées
          Kergrist, parents, puis autres.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Le document contient des données personnelles. Dans la fenêtre d'impression, choisissez
          une imprimante ou « Enregistrer en PDF ».
        </p>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertCircle size={16} />
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handlePrint}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
        {loading ? "Préparation…" : "Imprimer / enregistrer en PDF"}
      </button>
    </section>
  );
}
