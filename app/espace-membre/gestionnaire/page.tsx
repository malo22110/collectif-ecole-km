"use client";

// [SPEC-GEST-01] Page d'approbation des demandes de rôles pour les membres avec le rôle 'gestionnaire' ou 'admin'.
// Les gestionnaires peuvent approuver/refuser les demandes de rôles des membres mais ne peuvent
// PAS modifier d'autres champs (nom, email, statut, etc.).

import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Check, X, Clock } from "lucide-react";

interface Membre {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  status: string;
  role?: string;
  roles?: string[];
  roleRequest?: string;
  roleRequests?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire des rôles",
  tresorier: "Trésorier",
  redacteur: "Rédacteur",
  mail: "Responsable mailing",
  faq: "Éditeur FAQ",
  presse: "Responsable Presse",
  correcteur: "Correcteur Pétition",
  tractation: "Responsable des campagnes de tractation",
};

export default function GestionnairePage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Membre[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) {
      setHasAccess(false);
      return;
    }
    const checkRole = async () => {
      try {
        const snap = await getDoc(doc(db, "membres", email));
        if (snap.exists()) {
          const roles = Array.isArray(snap.data().roles)
            ? snap.data().roles
            : snap.data().role
              ? [snap.data().role]
              : [];
          setHasAccess(roles.includes("admin") || roles.includes("gestionnaire"));
        } else {
          setHasAccess(false);
        }
      } catch {
        setHasAccess(false);
      }
    };
    checkRole();
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    const unsub = onSnapshot(collection(db, "membres"), (snap) => {
      const withRequests = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Membre)
        .filter(
          (m) => (Array.isArray(m.roleRequests) && m.roleRequests.length > 0) || m.roleRequest,
        );
      setPendingRequests(withRequests);
    });
    return () => unsub();
  }, [hasAccess]);

  const handleApprove = async (membre: Membre) => {
    setProcessing(membre.id);
    try {
      const currentRoles = Array.isArray(membre.roles)
        ? membre.roles
        : membre.role && membre.role !== "membre"
          ? [membre.role]
          : [];
      const reqs = Array.isArray(membre.roleRequests)
        ? membre.roleRequests
        : membre.roleRequest
          ? [membre.roleRequest]
          : [];
      const newRoles = Array.from(new Set([...currentRoles, ...reqs]));
      await updateDoc(doc(db, "membres", membre.id), {
        roles: newRoles,
        role: newRoles[0] || "membre",
        roleRequest: deleteField(),
        roleRequests: deleteField(),
      });
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'approbation.");
    }
    setProcessing(null);
  };

  const handleReject = async (membre: Membre) => {
    setProcessing(membre.id);
    try {
      await updateDoc(doc(db, "membres", membre.id), {
        roleRequest: deleteField(),
        roleRequests: deleteField(),
      });
    } catch (e) {
      console.error(e);
      alert("Erreur lors du refus.");
    }
    setProcessing(null);
  };

  if (hasAccess === null)
    return <div className="p-8 text-center text-stone-500">Vérification des droits...</div>;
  if (!hasAccess)
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-red-700">Accès refusé</h2>
        <p className="text-stone-500">Vous n'avez pas les droits pour accéder à cette page.</p>
      </div>
    );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck size={28} className="text-emerald-600" />
        <h1 className="text-2xl md:text-3xl font-black text-stone-900">
          Gestion des demandes de rôles
        </h1>
      </div>
      <p className="text-stone-500 text-sm mb-8">
        Approuvez ou refusez les demandes de rôles soumises par les membres du collectif.
      </p>

      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Check size={40} className="text-emerald-400 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Aucune demande en attente. Tout est à jour !</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-emerald-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Demandes en attente
            </h2>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
              {pendingRequests.length}
            </span>
          </div>
          <div className="divide-y divide-stone-100">
            {pendingRequests.map((membre) => {
              const reqs = Array.isArray(membre.roleRequests)
                ? membre.roleRequests
                : ([membre.roleRequest].filter(Boolean) as string[]);
              const currentRoles = Array.isArray(membre.roles)
                ? membre.roles
                : membre.role
                  ? [membre.role]
                  : [];
              const isProcessing = processing === membre.id;
              return (
                <div
                  key={membre.id}
                  className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">
                      {membre.prenom} {membre.nom}
                    </div>
                    <div className="text-stone-500 text-sm">{membre.email}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-stone-400 mr-1">Rôles actuels :</span>
                      {currentRoles.length > 0 ? (
                        currentRoles.map((r) => (
                          <span
                            key={r}
                            className="text-[10px] uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-600"
                          >
                            {ROLE_LABELS[r] || r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">membre</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Clock size={14} className="text-amber-500 shrink-0" />
                      {reqs.map((r) => (
                        <span
                          key={r}
                          className="text-[11px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-1 rounded-md border border-amber-200"
                        >
                          {ROLE_LABELS[r] || r}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(membre)}
                        disabled={isProcessing}
                        className="btn-primary py-1.5 px-4 text-sm flex items-center gap-1.5 disabled:opacity-60"
                        aria-label={`Approuver la demande de ${membre.prenom} ${membre.nom}`}
                      >
                        <Check size={15} />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(membre)}
                        disabled={isProcessing}
                        className="btn-secondary py-1.5 px-4 text-sm flex items-center gap-1.5 text-stone-500 border-stone-200 disabled:opacity-60"
                        aria-label={`Refuser la demande de ${membre.prenom} ${membre.nom}`}
                      >
                        <X size={15} />
                        Refuser
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
