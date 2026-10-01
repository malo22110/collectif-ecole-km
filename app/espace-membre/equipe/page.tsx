"use client";

// [SPEC-EQUIPE-01] Page d'annuaire de l'équipe : liste des membres validés groupés par rôle.
// Visible pour tous les membres validés. Affiche uniquement le prénom et nom (pas d'email).

import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { arrayUnion, doc, getDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ShieldAlert, Users, Shield, Check, Loader2, UserRoundPlus } from "lucide-react";

interface MembrePublic {
  id: string;
  prenom: string;
  nom: string;
  role?: string;
  roles?: string[];
}

const ALL_ROLES = [
  { key: "admin", label: "Administrateurs", icon: "🛡️", color: "bg-red-50 border-red-200 text-red-800" },
  { key: "gestionnaire", label: "Gestionnaires des rôles", icon: "🔑", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { key: "redacteur", label: "Rédacteurs", icon: "✍️", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "mail", label: "Responsables mailing", icon: "📨", color: "bg-violet-50 border-violet-200 text-violet-800" },
  { key: "faq", label: "Éditeurs FAQ", icon: "💬", color: "bg-sky-50 border-sky-200 text-sky-800" },
  { key: "presse", label: "Responsables Presse", icon: "📰", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "correcteur", label: "Correcteurs Pétition", icon: "🖊️", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { key: "tractation", label: "Responsables tractation", icon: "📣", color: "bg-teal-50 border-teal-200 text-teal-800" },
];

export default function EquipePage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [membres, setMembres] = useState<MembrePublic[]>([]);
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [myRoleRequests, setMyRoleRequests] = useState<string[]>([]);
  const [requestingRole, setRequestingRole] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) { setHasAccess(false); setLoading(false); return; }

    const init = async () => {
      try {
        // Vérifier que l'utilisateur est un membre validé
        const snap = await getDoc(doc(db, "membres", email));
        if (snap.exists() && snap.data().status === "validated") {
          const profile = snap.data();
          const roles = Array.isArray(profile.roles) ? profile.roles : (profile.role ? [profile.role] : []);
          const requests = Array.isArray(profile.roleRequests) ? profile.roleRequests : (profile.roleRequest ? [profile.roleRequest] : []);
          setMyRoles(roles);
          setMyRoleRequests(requests);
          setHasAccess(true);
          // Charger tous les membres validés
          const q = query(collection(db, "membres"), where("status", "==", "validated"));
          const membresSnap = await getDocs(q);
          const data = membresSnap.docs.map(d => ({
            id: d.id,
            prenom: d.data().prenom || "",
            nom: d.data().nom || "",
            role: d.data().role,
            roles: d.data().roles,
          })) as MembrePublic[];
          setMembres(data.sort((a, b) => a.nom.localeCompare(b.nom)));
        } else {
          setHasAccess(false);
        }
      } catch {
        setHasAccess(false);
      }
      setLoading(false);
    };
    init();
  }, []);

  const requestRole = async (role: string) => {
    const email = auth.currentUser?.email;
    if (!email || myRoles.includes(role) || myRoleRequests.includes(role)) return;
    setRequestingRole(role);
    setRequestError("");
    setRequestNotice("");
    try {
      await updateDoc(doc(db, "membres", email), {
        roleRequests: arrayUnion(role),
        roleRequest: role
      });
      setMyRoleRequests(current => Array.from(new Set([...current, role])));
      setRequestNotice("Votre demande a été envoyée aux responsables.");
    } catch (error) {
      console.error("Erreur lors de la demande de rôle:", error);
      setRequestError("Impossible d’envoyer votre demande pour le moment.");
    } finally {
      setRequestingRole(null);
    }
  };

  const getMembresForRole = (roleKey: string) =>
    membres.filter(m => {
      const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
      return roles.includes(roleKey);
    });

  if (hasAccess === null || loading)
    return <div className="p-8 text-center text-stone-500">Chargement...</div>;
  if (!hasAccess)
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-red-700">Accès refusé</h2>
        <p className="text-stone-500">Seuls les membres validés peuvent voir cette page.</p>
      </div>
    );

  const membresAvecRole = membres.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
    return roles.some(r => ALL_ROLES.map(ar => ar.key).includes(r));
  });

  const membresSansRole = membres.filter(m => {
    const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
    return !roles.some(r => ALL_ROLES.map(ar => ar.key).includes(r));
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={28} className="text-emerald-600" />
        <h1 className="text-2xl md:text-3xl font-black text-stone-900">L'équipe du collectif</h1>
      </div>
      <p className="text-stone-500 text-sm mb-8">
        Membres du collectif et leurs rôles — {membres.length} membre(s) en tout.
      </p>

      {requestError && <p role="alert" className="mb-4 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-800">{requestError}</p>}
      {requestNotice && <p role="status" aria-live="polite" className="mb-4 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{requestNotice}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ALL_ROLES.map(({ key, label, icon, color }) => {
          const membresRole = getMembresForRole(key);
          const isMemberOfRole = myRoles.includes(key);
          const hasPendingRequest = myRoleRequests.includes(key);
          const isRequestable = key !== "admin";
          return (
            <section key={key} className="flex min-h-56 flex-col rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl" aria-hidden="true">{icon}</span>
                <h2 className="font-bold text-stone-800 text-sm">{label}</h2>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
                  {membresRole.length}
                </span>
              </div>
              <ul className="space-y-2">
                {membresRole.map(m => (
                  <li key={m.id} className="flex items-center gap-2 text-stone-700">
                    <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0 uppercase">
                      {m.prenom?.[0]}{m.nom?.[0]}
                    </span>
                    <span className="font-medium">{m.prenom} {m.nom}</span>
                  </li>
                ))}
              </ul>
              {membresRole.length === 0 && <p className="mb-3 text-sm text-stone-500">Aucun membre dans cette équipe pour le moment.</p>}
              <div className="mt-auto border-t border-stone-100 pt-3">
                {isMemberOfRole ? <p className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-800"><Check size={16} aria-hidden="true" />Vous faites partie de cette équipe</p>
                  : hasPendingRequest ? <p className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-amber-800"><Loader2 size={15} aria-hidden="true" />Demande en attente</p>
                    : isRequestable && <button type="button" onClick={() => void requestRole(key)} disabled={requestingRole === key} className="btn-secondary min-h-10 w-full justify-center px-3 py-2 text-sm">
                      {requestingRole === key ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UserRoundPlus size={16} aria-hidden="true" />}
                      Demander à rejoindre
                    </button>}
              </div>
            </section>
          );
        })}
      </div>

      {/* Membres sans rôle spécifique */}
      {membresSansRole.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-stone-400" />
            <h2 className="font-bold text-stone-500 text-sm uppercase tracking-wider">Membres</h2>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {membresSansRole.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {membresSansRole.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-full px-3 py-1 text-sm text-stone-700">
                <span className="font-medium">{m.prenom} {m.nom}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
