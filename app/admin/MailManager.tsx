"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, AlertCircle, CheckCircle2, Bold, Italic, List, ListOrdered } from "lucide-react";
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
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
      await addDoc(collection(db, "mailOutbox"), {
        subject,
        html: htmlContent,
        testMode,
        status: "pending",
        createdAt: serverTimestamp()
      });
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
          <label className="block text-sm font-semibold text-stone-700 mb-2">Contenu du message</label>
          <div className="border border-stone-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
            <MenuBar editor={editor} />
            <div className="bg-white cursor-text" onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>
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
