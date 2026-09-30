"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ShieldAlert, LayoutDashboard, Users, LogOut, ArrowLeft, Menu, X, FileText, Mail, Settings, HelpCircle, Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../components/UserAvatar";

export default function EspaceMembreLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>(['membre']);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRoles(Array.isArray(data.roles) ? data.roles : (data.role ? [data.role] : ['membre']));
          }
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-stone-900 text-white p-4 print:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldAlert size={20} className="text-emerald-500" /> Espace Membre
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-300 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:w-64 md:transform-none md:min-h-screen shrink-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert size={20} className="text-emerald-500" /> Espace Membre
            </h2>
            <p className="text-xs text-stone-500 mt-1 truncate max-w-[200px]">{user.email}</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 flex flex-col overflow-y-auto">
          <Link 
            href="/espace-membre"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <LayoutDashboard size={20} /> <span>Tableau de bord</span>
          </Link>
          <Link 
            href="/espace-membre/signataires"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/signataires" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Users size={20} /> <span>Signataires</span>
          </Link>
          
          {(userRoles.includes('admin') || userRoles.includes('redacteur')) && (
            <Link 
              href="/espace-membre/articles"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400"
            >
              <FileText size={20} /> <span>Rédiger des articles</span>
            </Link>
          )}

          {(userRoles.includes('admin') || userRoles.includes('mail')) && (
            <Link 
              href="/espace-membre/mailing"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400"
            >
              <Mail size={20} /> <span>Campagne d'e-mailing</span>
            </Link>
          )}
          
          {(userRoles.includes('admin') || userRoles.includes('faq')) && (
            <Link 
              href="/espace-membre/faq"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400"
            >
              <HelpCircle size={20} /> <span>Gérer la FAQ</span>
            </Link>
          )}

          {(userRoles.includes('admin') || userRoles.includes('presse')) && (
            <Link 
              href="/espace-membre/presse"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400"
            >
              <Newspaper size={20} /> <span>Gérer la Presse</span>
            </Link>
          )}

          {userRoles.includes('admin') && (
            <Link 
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400 mt-4 border-t border-stone-800 pt-4"
            >
              <Settings size={20} /> <span>Administration totale</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2 mt-auto">
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-stone-400">
            <ArrowLeft size={20} /> Retour au site
          </Link>
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-red-400">
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-full overflow-x-hidden md:overflow-visible">
        {children}
      </div>
    </div>
  );
}
