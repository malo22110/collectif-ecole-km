"use client";

import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";

export default function MailManager() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !html.trim()) return;

    setStatus("sending");
    try {
      await addDoc(collection(db, "mailOutbox"), {
        subject,
        html,
        testMode,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setStatus("success");
      setSubject("");
      setHtml("");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de l'envoi");
      setStatus("error");
    }
  };

  return (
    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
      <h3 className="text-xl font-bold text-stone-900 mb-6">Campagne d'e-mailing (SpreadMail)</h3>
      
      {status === "success" && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <p>L'e-mail a été placé dans la file d'attente d'envoi avec succès !</p>
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-rose-600" />
          <p>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Objet de l'e-mail</label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-base"
            placeholder="📢 Le site du collectif est en ligne..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Contenu (Format HTML autorisé)</label>
          <textarea 
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            className="input-base min-h-[300px] font-mono text-sm"
            placeholder="<p>Bonjour à tous,</p>"
            required
          />
        </div>

        <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <input 
            type="checkbox" 
            id="testMode"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
          />
          <label htmlFor="testMode" className="text-sm text-stone-800">
            <strong>Mode Test</strong> (Envoie l'e-mail uniquement à lecam.malo@gmail.com pour vérification)
          </label>
        </div>

        <button 
          type="submit" 
          disabled={status === "sending"}
          className="btn-primary w-full flex justify-center items-center gap-2"
        >
          <Send size={20} />
          {status === "sending" ? "Envoi en cours..." : "Diffuser l'e-mail"}
        </button>
      </form>
    </div>
  );
}
