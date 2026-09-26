"use client";

import React, { useState } from "react";
import { Users, FileText, CheckCircle2, XCircle, LogOut, Settings } from "lucide-react";

// Note: L'authentification Firebase et la liaison avec Firestore seront implémentées
// une fois que le projet Firebase sera connecté et 'firebase' installé.

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"membres" | "articles">("membres");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect Firebase Auth signInWithEmailAndPassword
    // Pour l'instant, c'est une maquette de l'espace
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-stone-900">Espace Administration</h1>
            <p className="text-stone-500">Collectif Kergrist-Moëlou</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input type="email" required className="w-full px-4 py-2 border rounded-xl" onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Mot de passe</label>
              <input type="password" required className="w-full px-4 py-2 border rounded-xl" onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-stone-900 text-stone-300 flex flex-col min-h-screen">
        <div className="p-6 border-b border-stone-800">
          <h2 className="text-xl font-bold text-white">Admin Collectif</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("membres")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "membres" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <Users size={20} /> Candidatures
          </button>
          <button 
            onClick={() => setActiveTab("articles")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "articles" ? "bg-emerald-600 text-white" : "hover:bg-stone-800"}`}
          >
            <FileText size={20} /> Articles & Docs
          </button>
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-800 transition-colors text-red-400">
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === "membres" && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Gestion des candidatures</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-amber-50/30">
                <h3 className="font-semibold text-stone-800">Candidatures en attente de validation</h3>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">1 nouvelle</span>
              </div>
              <div className="divide-y divide-stone-100">
                {/* Exemple de candidature */}
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-stone-50">
                  <div>
                    <h4 className="font-bold text-stone-900">Camille Dupont</h4>
                    <p className="text-stone-500 text-sm">camille@example.com • 06 12 34 56 78</p>
                    <p className="text-stone-400 text-xs mt-1">Inscrit(e) le 28/09/2026</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors">
                      <CheckCircle2 size={18} /> Valider
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                      <XCircle size={18} /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "articles" && (
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Articles & Documents</h2>
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-stone-200 text-center border-dashed">
              <Settings className="mx-auto text-stone-300 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">Module en construction</h3>
              <p className="text-stone-500">Cet espace vous permettra bientôt de publier des articles et de partager des documents (Phase 2).</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
