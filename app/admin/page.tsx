"use client";

import React, { useState, useEffect } from "react";
import ArticleManager from "./ArticleManager";
import FaqManager from "./FaqManager";
import ImportMembers from "./ImportMembers";
import ExportMembers from "./ExportMembers";
import PetitionSignaturesExport from "./PetitionSignaturesExport";
import PetitionCollectiveAgreements from "./PetitionCollectiveAgreements";
import SetupCmsBtn from "./SetupCmsBtn";
import HistoriqueAdmin from "./HistoriqueAdmin";
import MembreManager from "./MembreManager";
import DuplicateManager from "./DuplicateManager";
import MailManager from "./MailManager";
import PresseManager from "./PresseManager";
import { Mail } from "lucide-react";
import {
  Users,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  LogOut,
  Settings,
  Bot,
  Newspaper,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Membre {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  dateInscription: string;
}

function AdminDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as any) || "membres";
  const [activeTab, setActiveTab] = useState<
    "membres" | "articles" | "faq" | "emails" | "presse"
  >(initialTab);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [pendingMembers, setPendingMembers] = useState<Membre[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>(["membre"]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch roles
    const fetchRole = async () => {
      try {
        const docSnap = await getDoc(doc(db, "membres", user.email!));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const roles = Array.isArray(data.roles)
            ? data.roles
            : data.role
              ? [data.role]
              : ["membre"];
          setUserRoles(roles);
          if (!roles.includes("admin")) {
            window.location.href = "/espace-membre";
          }
        } else {
          window.location.href = "/espace-membre";
        }
      } catch (err) {
        window.location.href = "/espace-membre";
      }
    };
    fetchRole();

    const q = query(
      collection(db, "membres"),
      where("status", "==", "pending"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membresData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Membre[];
      setPendingMembers(membresData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password,
      );
    } catch (error: any) {
      setLoginError("Identifiants incorrects.");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleValidate = async (id: string) => {
    await updateDoc(doc(db, "membres", id), { status: "validated" });
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, "membres", id), { status: "rejected" });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900">
              Espace Administration
            </h1>
            <p className="text-stone-500">Collectif Kergrist-Moëlou</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="text-red-500 text-sm text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                className="input-base"
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="input-label">Mot de passe</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className="input-base"
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-stone-900 text-stone-300 flex flex-col min-h-screen">
        <div className="p-6 border-b border-stone-800">
          <h2 className="text-xl font-bold text-white">Admin Collectif</h2>
          <p className="text-xs text-stone-500 mt-1">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {userRoles.includes("admin") && (
            <button
              onClick={() => setActiveTab("membres")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === "membres" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} /> Candidatures
              </div>
              {pendingMembers.length > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          )}
          {(userRoles.includes("admin") || userRoles.includes("redacteur")) && (
            <button
              onClick={() => setActiveTab("articles")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "articles" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
            >
              <FileText size={20} /> Articles & Docs
            </button>
          )}
          {userRoles.includes("admin") && (
            <button
              onClick={() => setActiveTab("faq")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "faq" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
            >
              <HelpCircle size={20} /> FAQ
            </button>
          )}
          {userRoles.includes("admin") && (
            <button
              onClick={() => setActiveTab("presse")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "presse" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
            >
              <Newspaper size={20} /> Presse
            </button>
          )}
          {(userRoles.includes("admin") || userRoles.includes("mail")) && (
            <button
              onClick={() => setActiveTab("emails")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "emails" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
            >
              <Mail size={20} /> E-mails
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-red-400"
          >
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {activeTab === "presse" && userRoles.includes("admin") && (
          <PresseManager />
        )}
        {activeTab === "membres" && userRoles.includes("admin") && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              Gestion des candidatures
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-amber-50/30">
                <h3 className="font-semibold text-stone-800">
                  Candidatures en attente de validation
                </h3>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingMembers.length} nouvelle(s)
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {pendingMembers.length === 0 ? (
                  <div className="p-8 text-center text-stone-500">
                    Aucune candidature en attente.
                  </div>
                ) : (
                  pendingMembers.map((membre) => (
                    <div
                      key={membre.id}
                      className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-stone-900">
                          {membre.prenom} {membre.nom}
                        </h4>
                        <p className="text-stone-500 text-sm">
                          {membre.email} • {membre.telephone || "Aucun tel"}
                        </p>
                        <p className="text-stone-400 text-xs mt-1">
                          Inscrit(e) le{" "}
                          {new Date(membre.dateInscription).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleValidate(membre.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 size={18} /> Valider
                        </button>
                        <button
                          onClick={() => handleReject(membre.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          <XCircle size={18} /> Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <MembreManager />
            <DuplicateManager />
            <ImportMembers />
            <ExportMembers />
            <PetitionSignaturesExport />
            <PetitionCollectiveAgreements />
          </div>
        )}

        {activeTab === "articles" && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              Articles & Documents
            </h2>
            <ArticleManager />
            <SetupCmsBtn />
            <HistoriqueAdmin />
          </div>
        )}

        {activeTab === "faq" && userRoles.includes("admin") && <FaqManager />}

        {activeTab === "emails" &&
          (userRoles.includes("admin") || userRoles.includes("mail")) && (
            <MailManager />
          )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <AdminDashboardContent />
    </React.Suspense>
  );
}
