"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const q = query(collection(db, "faqs"), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any);
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFaqs(fetched);
      } catch (error) {
        console.error("Erreur chargement FAQ", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Retour à l'accueil
          </Link>
          <div className="font-bold text-stone-900">Le Collectif</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-4 text-emerald-600">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            Questions Fréquentes
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            6 questions pour un choix éclairé et responsable. L'objectif est de démontrer que la
            reprise du projet est un acte de bonne gestion.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-stone-500 py-10">Chargement de la FAQ...</div>
        ) : (
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200"
              >
                <h3 className="text-xl font-bold text-stone-900 mb-3 flex gap-3">
                  <span className="text-emerald-500 font-black">{index + 1}.</span>
                  {faq.question}
                </h3>
                <div className="text-stone-700 leading-relaxed pl-8 whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
