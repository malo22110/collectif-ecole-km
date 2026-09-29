"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import UserAvatar from "../components/UserAvatar";
import { ArrowLeft, Loader2, MessageCircle, X } from "lucide-react";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BlockRenderer from "../components/cms/BlockRenderer";
import HistoriqueAdmin from "../admin/HistoriqueAdmin";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { Pencil, Eye } from "lucide-react";
import Comments from "../components/Comments";

export default function HistoriquePage() {
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isSimplified, setIsSimplified] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [isEditorDirty, setIsEditorDirty] = useState(false);

  // [SPEC-CMS-DRAFT-01] Vérifie si l'utilisateur est admin ou éditeur
  useEffect(() => {
    const ADMIN_EMAILS = ["contact@collectif-ecole-km.fr", "lecam.malo@gmail.com", "collectif.ecole.km@gmail.com"];
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setCurrentUserEmail(user.email);
        if (ADMIN_EMAILS.includes(user.email)) {
          setCanEdit(true);
          setIsAdminUser(true);
        } else {
          const docSnap = await getDoc(doc(db, "membres", user.email));
          if (docSnap.exists()) {
            const role = docSnap.data().role;
            if (role === "admin") {
              setCanEdit(true);
              setIsAdminUser(true);
            } else if (role === "editor") {
              setCanEdit(true);
              setIsAdminUser(false);
            }
          }
        }
      } else {
        setCanEdit(false);
        setIsAdminUser(false);
        setCurrentUserEmail("");
      }
    });
    return () => unsubAuth();
  }, []);

  // 1. Charger les données du CMS depuis Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "pages", "historique"), (docSnap) => {
      if (docSnap.exists()) {
        setPageData(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Charger les compteurs de commentaires
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "commentaires"), (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.forEach(doc => {
        const topic = doc.data().topic || "Général";
        counts[topic] = (counts[topic] || 0) + 1;
      });
      setCommentCounts(counts);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-500">Page en cours de construction...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
          <div className="font-bold text-stone-900 hidden sm:block">Le Collectif</div>
          <div className="flex items-center gap-4">
            <Link href="/petition" className="text-sm font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full hover:bg-emerald-200 transition-colors">
              Pétition
            </Link>
            <UserAvatar />
          </div>
        </div>

        {/* Toggle intégré au header pour garantir qu'il soit sticky */}
        <div className="bg-stone-50/95 backdrop-blur-md border-t border-stone-200 py-2">
          <div className="max-w-5xl mx-auto px-4 flex justify-center">
            <div className="inline-flex bg-stone-200/50 p-1 rounded-full items-center border border-stone-200 shadow-inner">
              <button
                onClick={() => setIsSimplified(true)}
                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Version Courte (Résumé)
              </button>
              <button
                onClick={() => setIsSimplified(false)}
                className={`px-6 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${!isSimplified ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Détails Complets
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-8"></div>

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8 text-center">
        
        {/* TITRE ET SOUS-TITRE (Dynamiques via CMS) */}
        {pageData.header && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{pageData.header.title}</h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-12">
              {pageData.header.subtitle}
            </p>
          </>
        )}

      </div>

      {canEdit && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              if (editMode && isEditorDirty) {
                const ok = window.confirm("⚠️ Vous avez des modifications non sauvegardées.\n\nSi vous quittez le mode édition, vos modifications seront perdues. Continuer quand même ?");
                if (!ok) return;
              }
              setEditMode(!editMode);
              setIsEditorDirty(false);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold shadow-xl transition-all ${editMode ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
          >
            {editMode ? <><Eye size={16}/> Quitter l'édition</> : <><Pencil size={16}/> Modifier la page</>}
          </button>
        </div>
      )}

      <div className="w-full">
        {editMode ? (
          <div className="px-4 py-4">
            <HistoriqueAdmin
              onDirtyChange={setIsEditorDirty}
              isAdmin={isAdminUser}
              userEmail={currentUserEmail}
            />
          </div>
        ) : (
          <>

            {pageData.blocks && pageData.blocks.map((block: any, idx: number) => (
              <BlockRenderer key={idx} block={block} context={{ setActiveTopic, commentCounts, isSimplified }} />
            ))}
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
        {/* ESPACE COMMENTAIRES */}
        <div className="max-w-7xl mx-auto px-4 pb-16 text-left">
          <Comments topic="Général" />
        </div>
      </div>

      {/* DRAWER COMMENTAIRES */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/50 backdrop-blur-sm transition-opacity" onClick={() => setActiveTopic(null)}>
          <div className="w-full max-w-md bg-stone-50 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex justify-between items-center z-10 shadow-sm">
              <h3 className="font-bold text-stone-900 flex-1 truncate mr-4">Débat : {activeTopic}</h3>
              <button onClick={() => setActiveTopic(null)} className="p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4">
              <Comments topic={activeTopic} inline={true} />
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
