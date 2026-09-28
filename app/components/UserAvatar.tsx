"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { User, LogOut, Settings, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";

export default function UserAvatar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if admin
        try {
          const q = query(collection(db, 'membres'), where('email', '==', currentUser.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            setIsAdmin(data.role === 'admin');
          }
        } catch (e) {}
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <Link href="/connexion" className="p-2 text-stone-600 hover:text-stone-900 transition-colors" title="Se connecter">
        <User size={20} />
      </Link>
    );
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-200 shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all"
        title={user.email}
      >
        {initial}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-stone-100 mb-1">
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>
          
          <Link 
            href="/espace-membre" 
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 font-medium"
            onClick={() => setShowMenu(false)}
          >
            <Users size={16} /> Espace Membre
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setShowMenu(false)}
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}

          <button
            onClick={() => {
              signOut(auth);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
