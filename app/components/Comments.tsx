"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { MessageSquare, Send, UserCircle, LogOut } from "lucide-react";

export default function Comments() {
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authMode, setAuthMode] = useState<"idle" | "login" | "register">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Écouter l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        // Vérifier si l'utilisateur fait partie des membres validés ou s'il est admin
        try {
          const q = query(collection(db, "membres"), where("email", "==", currentUser.email), where("status", "==", "validated"));
          const snap = await getDocs(q);
          if (!snap.empty || currentUser.email === "contact@collectif-ecole-km.fr") { // l'admin peut aussi commenter
            setIsMember(true);
          } else {
            setIsMember(false);
          }
        } catch (e) {
          console.error(e);
          setIsMember(false);
        }
      } else {
        setIsMember(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Écouter les commentaires
  useEffect(() => {
    const q = query(collection(db, "commentaires"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(data);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAuthMode("idle");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setAuthMode("idle");
    } catch (err: any) {
      setAuthError("Erreur d'authentification. Vérifiez vos identifiants.");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !isMember) return;
    
    try {
      await addDoc(collection(db, "commentaires"), {
        text: newComment.trim(),
        authorEmail: user.email,
        authorName: user.displayName || user.email?.split('@')[0],
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du commentaire.");
    }
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 md:p-8 mt-16 max-w-4xl mx-auto shadow-sm">
      <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
        <MessageSquare className="text-emerald-600" />
        Espace Débat & Corrections (Membres)
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <p className="text-stone-500 text-center py-4 bg-white rounded-xl border border-stone-100">Aucun commentaire pour le moment. Lancez le débat !</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-stone-800 text-sm">{c.authorName}</span>
                <span className="text-xs text-stone-400">
                  {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                </span>
              </div>
              <p className="text-stone-700 whitespace-pre-wrap">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Zone d'action */}
      {!user ? (
        <div className="bg-white p-6 rounded-xl border border-stone-200 text-center">
          {authMode === "idle" ? (
            <div>
              <p className="text-stone-600 mb-4">Connectez-vous avec l'adresse email utilisée lors de votre adhésion pour participer au débat.</p>
              {authError && <p className="text-rose-500 text-sm mb-4 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">{authError}</p>}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleGoogleLogin} className="px-6 py-2 bg-white border-2 border-stone-200 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Google
                </button>
                <button onClick={() => setAuthMode("login")} className="px-6 py-2 bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-900 transition-colors">
                  Autre Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="max-w-sm mx-auto text-left">
              <h4 className="font-bold text-stone-900 mb-4 text-center">
                {authMode === "login" ? "Connexion" : "Créer un mot de passe"}
              </h4>
              {authError && <p className="text-red-500 text-sm mb-3">{authError}</p>}
              <input 
                type="email" 
                placeholder="Votre adresse email" 
                required 
                className="w-full px-4 py-2 border border-stone-300 rounded-lg mb-3 focus:outline-none focus:border-emerald-500 bg-white text-stone-900"
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="Mot de passe" 
                required 
                className="w-full px-4 py-2 border border-stone-300 rounded-lg mb-4 focus:outline-none focus:border-emerald-500 bg-white text-stone-900"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAuthMode("idle")} className="w-1/3 px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Retour</button>
                <button type="submit" className="w-2/3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  {authMode === "login" ? "Se connecter" : "S'inscrire"}
                </button>
              </div>
              <p className="text-center text-xs text-stone-500 mt-4 cursor-pointer hover:underline" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                {authMode === "login" ? "Première fois ? Créer un mot de passe" : "Déjà inscrit ? Se connecter"}
              </p>
            </form>
          )}
        </div>
      ) : !isMember ? (
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center">
          <p className="text-amber-800 font-medium mb-3">Votre compte ({user.email}) est en attente de validation par l'administrateur, ou n'est pas inscrit au Collectif.</p>
          <button onClick={() => signOut(auth)} className="text-sm underline text-amber-700 hover:text-amber-900">Se déconnecter</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <UserCircle size={16} /> Connecté en tant que <strong>{user.displayName || user.email}</strong>
            </div>
            <button onClick={() => signOut(auth)} className="text-xs flex items-center gap-1 text-stone-400 hover:text-rose-500 transition-colors">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
          <form onSubmit={handlePostComment} className="flex flex-col gap-3">
            <textarea 
              placeholder="Ajouter une précision, signaler une erreur, ou partager un avis..."
              className="w-full p-4 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-stone-900 min-h-[100px]"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Send size={18} />
                Publier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
