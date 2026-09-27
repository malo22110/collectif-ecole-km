"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import { getApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";


export default function AssistantPage() {
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");
  const [model, setModel] = useState<any>(null);
  const [chat, setChat] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/context.txt");
        const text = await res.text();
        setContext(text);
      } catch (err) {
        console.error("Failed to fetch context", err);
      }

      try {
        const app = getApp();
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        const generativeModel = getGenerativeModel(ai, {
          model: "gemini-1.5-flash", 
          generationConfig: {
            temperature: 0.1, 
          },
        });
        setModel(generativeModel);
      } catch (err) {
        console.error("Failed to init AI", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (model && context && !chat) {
      const initialChat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              { 
                text: `Tu es l'assistant IA officiel du collectif citoyen "Un nid tout neuf pour nos écureuils" de Kergrist-Moëlou.
Ton rôle est d'aider les membres du collectif à explorer et comprendre les documents officiels de la commune.
Tu dois te baser STRICTEMENT sur le contexte fourni ci-dessous, qui contient les PV officiels de 2022 à 2026.
Si on te pose une question dont la réponse ne figure pas dans ces PV, dis-le clairement. Ne fais pas d'hallucinations.
Réponds de manière concise et précise.

Voici le texte intégral des PV et documents :
${context}`
              }
            ],
          },
          {
            role: "model",
            parts: [{ text: "Compris. Je suis prêt à vous aider à analyser les procès-verbaux et documents du projet d'école." }],
          },
        ],
      });
      setChat(initialChat);
      setMessages([
        { role: "model", text: "Bonjour ! Je suis l'assistant du collectif. J'ai ingéré tous les PV de la municipalité de 2022 à 2026. Posez-moi vos questions sur le projet d'école, les budgets, ou les décisions !" }
      ]);
    }
  }, [model, context, chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const result = await chat.sendMessage(userText);
      const responseText = await result.response.text();
      setMessages((prev) => [...prev, { role: "model", text: responseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Erreur de communication avec l'IA (veillez à être bien connecté à internet, ou vérifiez l'authentification Firebase). Détail : " + (error?.message || "") }
      ]);
    } finally {
      setLoading(false);
    }
  };


  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Accès réservé aux membres.</p>
        <Link href="/admin" className="text-emerald-600 underline">Se connecter</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium">
            <ArrowLeft size={20} />
            Retour à l'Admin
          </Link>
          <div className="font-bold text-stone-900 flex items-center gap-2">
            <Bot size={20} className="text-emerald-600" />
            Assistant IA des PVs
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        {!chat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-500 gap-4">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p>Ingestion des procès-verbaux en cours (~300 Ko)...</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-4 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-emerald-600 text-white" : "bg-stone-50 text-stone-800 border border-stone-200 whitespace-pre-wrap"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-stone-50 text-stone-800 border border-stone-200 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-stone-400" size={16} />
                    Analyse des documents...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question sur les PV..."
                className="w-full bg-white border border-stone-200 rounded-full pl-6 pr-14 py-4 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
