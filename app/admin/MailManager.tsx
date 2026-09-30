"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, AlertCircle, CheckCircle2, Bold, Italic, List, ListOrdered, Users, FileSignature } from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-stone-200 bg-stone-50 rounded-t-xl">
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bold') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
        title="Gras"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('italic') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
        title="Italique"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bulletList') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
        title="Liste à puces"
      >
        <List size={18} />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('orderedList') ? 'bg-stone-200 text-stone-900' : 'text-stone-600'}`}
        type="button"
        title="Liste numérotée"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  );
};

export default function MailManager() {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  
  const [target, setTarget] = useState<"all" | "membres" | "signataires" | "membres_non_signataires">("all");
  const [membres, setMembres] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const mSnap = await getDocs(collection(db, "membres"));
        const mData = mSnap.docs.map(d => d.data());
        setMembres(mData.filter(m => m.status === 'validated' && m.email));
        
        const sSnap = await getDocs(collection(db, "signatures"));
        const sData = sSnap.docs.map(d => d.data());
        setSignatures(sData.filter(s => s.email));
      } catch (e) {
        console.error("Erreur stats:", e);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchData();
  }, []);

  const getUniqueEmails = () => {
    const emails = new Set<string>();
    
    if (target === "membres_non_signataires") {
      const signatureEmails = new Set(signatures.map(s => s.email?.toLowerCase().trim()).filter(Boolean));
      membres.forEach(m => {
        const email = m.email?.toLowerCase().trim();
        if (email && !signatureEmails.has(email)) {
          emails.add(email);
        }
      });
      return Array.from(emails);
    }
    
    if (target === "all" || target === "membres") {
      membres.forEach(m => { if (m.email) emails.add(m.email.toLowerCase().trim()); });
    }
    if (target === "all" || target === "signataires") {
      signatures.forEach(s => { if (s.email) emails.add(s.email.toLowerCase().trim()); });
    }
    return Array.from(emails);
  };

  const getIntersectionCount = () => {
    let count = 0;
    const membreEmails = new Set(membres.map(m => m.email.toLowerCase().trim()));
    signatures.forEach(s => {
      if (s.email && membreEmails.has(s.email.toLowerCase().trim())) count++;
    });
    return count;
  };

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Bonjour à tous,</p><p><br/></p><p>À très vite,<br/>Le Collectif</p>",
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none min-h-[300px] p-4 text-sm',
      },
    },
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
    },
  });

  // Initialize htmlContent on load
  useEffect(() => {
    if (editor && htmlContent === "") {
      setHtmlContent(editor.getHTML());
    }
  }, [editor]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !htmlContent.trim() || htmlContent === "<p></p>") return;

    setStatus("sending");
    try {
      
      const payload: any = {
        subject,
        html: htmlContent,
        testMode,
        target,
        recipientCount: getUniqueEmails().length,
        status: "pending",
        createdAt: serverTimestamp()
      };
      
      if (scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt);
      }
      
      await addDoc(collection(db, "mailOutbox"), payload);
      setStatus("success");
      setSubject("");
      if (editor) editor.commands.setContent("<p>Bonjour à tous,</p><p><br/></p><p>À très vite,<br/>Le Collectif</p>");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de l'envoi");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 text-stone-500 mb-2">
            <Users size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Membres Validés</h3>
          </div>
          <p className="text-3xl font-black text-stone-900">{loadingStats ? "..." : membres.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 text-stone-500 mb-2">
            <FileSignature size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Signataires Pétition</h3>
          </div>
          <p className="text-3xl font-black text-stone-900">{loadingStats ? "..." : signatures.length}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3 text-emerald-700 mb-2">
            <Users size={20} />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Membres signataires</h3>
          </div>
          <p className="text-3xl font-black text-emerald-900">{loadingStats ? "..." : getIntersectionCount()}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Membres ayant signé la pétition</p>
        </div>
      </div>

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
          <label className="block text-sm font-semibold text-stone-700 mb-2">Audience cible (dé-doublonnée)</label>
          <div className="flex flex-wrap gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="target" checked={target === "all"} onChange={() => setTarget("all")} className="text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-medium">Tous ({loadingStats ? "..." : target === "all" ? getUniqueEmails().length : '...'})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="target" checked={target === "membres"} onChange={() => setTarget("membres")} className="text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-medium">Membres</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="target" checked={target === "signataires"} onChange={() => setTarget("signataires")} className="text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-medium">Signataires</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-amber-100/50 px-2 py-1 rounded-lg border border-amber-200">
              <input type="radio" name="target" checked={target === "membres_non_signataires"} onChange={() => setTarget("membres_non_signataires")} className="text-amber-600 focus:ring-amber-500" />
              <span className="text-sm font-medium text-amber-900">Membres n'ayant pas signé</span>
            </label>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Nombre de destinataires calculé pour l'envoi : <strong>{loadingStats ? "..." : getUniqueEmails().length}</strong>
          </p>
        </div>
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
          <label className="block text-sm font-semibold text-stone-700 mb-2">Contenu du message</label>
          <div className="border border-stone-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
            <MenuBar editor={editor} />
            <div className="bg-white cursor-text" onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">Programmer l'envoi (Optionnel)</label>
          <input 
            type="datetime-local" 
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="input-base"
          />
          <p className="text-xs text-stone-500 mt-1">Laissez vide pour envoyer immédiatement.</p>
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
    </div>
  );
}
