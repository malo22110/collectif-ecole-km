"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ShieldAlert, LayoutDashboard, Users, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../components/UserAvatar";

export default function EspaceMembreLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const { doc, getDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const docRef = doc(db, "membres", u.email!);
          const docSnap = await getDoc(docRef);
          setIsMember(docSnap.exists() && docSnap.data().status === "validated");
        } catch (err) {
          console.error(err);
          setIsMember(false);
        }
      } else {
        setUser(null);
        setIsMember(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50">Chargement...</div>;

  if (!user || isMember === false) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Accès restreint</h1>
          <p className="text-stone-600 mb-6">
            {!user 
              ? "Vous devez être connecté pour accéder à cette page." 
              : "Votre compte est en attente de validation ou l'adresse email utilisée n'est pas inscrite au collectif."}
          </p>
          <Link href="/" className="btn-primary w-full justify-center">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-stone-900 text-stone-300 flex flex-col md:min-h-screen shrink-0 print:hidden">
        <div className="p-6 border-b border-stone-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-emerald-500" /> Espace Membre
          </h2>
          <p className="text-xs text-stone-500 mt-1 truncate">{user.email}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          <Link 
            href="/espace-membre"
            className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">Tableau de bord</span>
          </Link>
          <Link 
            href="/espace-membre/signataires"
            className={`flex-1 md:flex-none flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/signataires" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Users size={20} /> <span className="hidden sm:inline">Signataires</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-stone-400">
            <ArrowLeft size={20} /> Retour au site
          </Link>
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-red-400">
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
