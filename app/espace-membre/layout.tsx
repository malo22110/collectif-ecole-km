"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ShieldAlert,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  FileText,
  Mail,
  Settings,
  Newspaper,
  Shield,
  UserCircle2,
  MapPinned,
  Wallet,
  Users,
  Wrench,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../components/UserAvatar";

export default function EspaceMembreLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>(["membre"]);
  const [canManageTreasury, setCanManageTreasury] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
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
            setUserRoles(
              Array.isArray(data.roles) ? data.roles : data.role ? [data.role] : ["membre"],
            );
            const roles = Array.isArray(data.roles) ? data.roles : data.role ? [data.role] : [];
            setCanManageTreasury(roles.includes("admin") || roles.includes("tresorier"));
          }
        } catch (err) {
          console.error(err);
          setIsMember(false);
        }
      } else {
        setUser(null);
        setIsMember(false);
        setCanManageTreasury(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user || !(userRoles.includes("admin") || userRoles.includes("mail"))) {
      setUnreadMailCount(0);
      return;
    }
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/mail-inbox/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = await response.json();
        if (active && Number.isInteger(result.count)) setUnreadMailCount(Math.max(0, result.count));
      } catch {
        // Keep the last known count when the mailbox API is temporarily unavailable.
      }
    };
    void refreshUnreadCount();
    const interval = window.setInterval(() => void refreshUnreadCount(), 120_000);
    const onFocus = () => void refreshUnreadCount();
    window.addEventListener("focus", onFocus);
    window.addEventListener("mail-inbox-updated", onFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mail-inbox-updated", onFocus);
    };
  }, [user, userRoles]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">Chargement...</div>
    );

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
          <Link href="/" className="btn-primary w-full justify-center">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-stone-900 text-white p-4 print:hidden sticky top-0 z-40">
        <div className="flex min-w-0 items-center gap-3">
          {pathname !== "/espace-membre" && (
            <>
              <Link
                href="/espace-membre"
                aria-label="Retour au tableau de bord"
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg pr-2 text-sm font-semibold text-stone-200 hover:bg-stone-800 hover:text-white"
              >
                <ArrowLeft size={19} aria-hidden="true" /> <span>Tableau de bord</span>
              </Link>
              <span className="h-6 w-px shrink-0 bg-stone-700" aria-hidden="true" />
            </>
          )}
          <span className="truncate text-sm font-bold text-stone-400">Espace membre</span>
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
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-300 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:fixed md:top-0 md:left-0 md:h-screen md:w-64 md:transform-none shrink-0 print:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
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
            href="/espace-membre/tournees"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/tournees" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <MapPinned size={20} /> <span>Carte & campagnes</span>
          </Link>

          <Link
            href="/espace-membre/petition"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname.startsWith("/espace-membre/petition") || ["/espace-membre/signataires", "/espace-membre/non-signataires", "/espace-membre/correcteur", "/espace-membre/numeriser-petition"].includes(pathname) ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <FileText size={20} /> <span>Pétition</span>
          </Link>

          <Link
            href="/espace-membre/remboursements"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname.startsWith("/espace-membre/remboursements") ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Wallet size={20} />
            <span>{canManageTreasury ? "Trésorerie" : "Demander un remboursement"}</span>
          </Link>

          {(userRoles.includes("admin") ||
            userRoles.some((role) => ["redacteur", "faq", "presse"].includes(role))) && (
            <Link
              href="/espace-membre/redaction"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname.startsWith("/espace-membre/redaction") || ["/espace-membre/articles", "/espace-membre/faq", "/espace-membre/presse"].includes(pathname) ? "bg-emerald-600 text-white" : "hover:bg-stone-800 text-emerald-400"}`}
            >
              <Newspaper size={20} /> <span>Pôle rédaction</span>
            </Link>
          )}

          {(userRoles.includes("admin") || userRoles.includes("mail")) && (
            <Link
              href="/espace-membre/mailing"
              aria-label={
                unreadMailCount
                  ? `Campagne d’e-mailing, ${unreadMailCount} message(s) non lu(s)`
                  : "Campagne d’e-mailing"
              }
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname.startsWith("/espace-membre/mailing") ? "bg-emerald-600 text-white" : "hover:bg-stone-800 text-emerald-400"}`}
            >
              <Mail size={20} />{" "}
              <span className="min-w-0 flex-1 truncate">Campagne d'e-mailing</span>
              {unreadMailCount > 0 && (
                <span
                  className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-bold leading-4 text-white"
                  aria-hidden="true"
                >
                  {unreadMailCount > 99 ? "99+" : unreadMailCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/espace-membre/equipe"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/equipe" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <UserCircle2 size={20} /> <span>L'équipe</span>
          </Link>

          <Link
            href="/espace-membre/competences"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/competences" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Users size={20} /> <span>Compétences</span>
          </Link>

          <Link
            href="/espace-membre/actions"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/actions" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Wrench size={20} /> <span>Propositions & actions</span>
          </Link>

          <Link
            href="/espace-membre/reunions"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${pathname === "/espace-membre/reunions" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <CalendarDays size={20} /> <span>Agenda & comptes rendus</span>
          </Link>

          {(userRoles.includes("admin") || userRoles.includes("gestionnaire")) && (
            <Link
              href="/espace-membre/gestionnaire"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400"
            >
              <Shield size={20} /> <span>Demandes de rôles</span>
            </Link>
          )}

          {userRoles.includes("admin") && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap hover:bg-stone-800 text-emerald-400 mt-4 border-t border-stone-800 pt-4"
            >
              <Settings size={20} /> <span>Administration totale</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2 mt-auto">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-stone-400"
          >
            <ArrowLeft size={20} /> Retour au site
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-red-400"
          >
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 max-w-full md:ml-64">{children}</div>
    </div>
  );
}
