"use client";

import React, { useEffect, useState } from "react";
import FaqManager from "@/app/admin/FaqManager";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ShieldAlert } from "lucide-react";

export default function EspaceFaq() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth.currentUser?.email) {
      setHasAccess(false);
      return;
    }
    const checkRole = async () => {
      try {
        const snap = await getDoc(doc(db, "membres", auth.currentUser!.email!));
        if (snap.exists()) {
          const roles = Array.isArray(snap.data().roles) ? snap.data().roles : (snap.data().role ? [snap.data().role] : []);
          setHasAccess(roles.includes('admin') || roles.includes('faq'));
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        setHasAccess(false);
      }
    };
    checkRole();
  }, []);

  if (hasAccess === null) return <div className="p-8 text-center text-stone-500">Vérification des droits...</div>;
  if (hasAccess === false) return (
    <div className="p-8 text-center text-red-500 flex flex-col items-center">
      <ShieldAlert size={48} className="mb-4 text-red-500" />
      <h2 className="text-xl font-bold">Accès refusé</h2>
      <p>Vous n'avez pas les droits pour accéder à cette page.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <FaqManager />
    </div>
  );
}
