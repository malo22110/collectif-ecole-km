"use client";

import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { MessageSquare, Send, UserCircle, LogOut, Edit2, Trash2, X, Check } from "lucide-react";

export default function Comments({ topic, inline }: { topic?: string, inline?: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authMode, setAuthMode] = useState<"idle" | "login" | "register">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  
  // Vérifier si l'utilisateur revient avec un Magic Link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt("Veuillez confirmer votre adresse email pour finaliser la connexion.");
      }
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Erreur Magic Link", err);
            setAuthError("Le lien de connexion est invalide ou a expiré.");
          });
      }
    }
  }, []);

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

  
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setAuthError("");
    setLinkSent(true);
    
    try {
      // On demande au serveur d'envoyer le mail joli via Firestore
      await addDoc(collection(db, "magicLinks"), {
        email: email,
        url: window.location.href,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      window.localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      console.error(err);
      setAuthError("Erreur lors de l'envoi du lien de connexion.");
      setLinkSent(false);
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
        createdAt: serverTimestamp(),
        topic: topic || "Général"
      });
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du commentaire.");
    }
  };

  const handleEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditContent(text);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await updateDoc(doc(db, "commentaires", id), {
        text: editContent.trim(),
        editedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du commentaire.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    try {
      await deleteDoc(doc(db, "commentaires", id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du commentaire.");
    }
  };

  return (
    <div className={`bg-stone-50 border border-stone-200 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm ${!inline ? "mt-16" : ""}`}>
      <h3 className={`${inline ? "text-xl" : "text-2xl"} font-bold text-stone-900 mb-6 flex items-center gap-3`}>
        <MessageSquare className="text-emerald-600" />
        Espace Débat & Corrections (Membres)
      </h3>

      {/* Liste des commentaires */}
      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <p className="text-stone-500 text-center py-4 bg-white rounded-xl border border-stone-100">Aucun commentaire pour le moment. Lancez le débat !</p>
        ) : (
          (() => {
            const grouped = comments.reduce((acc: any, c: any) => {
              const t = c.topic || "Général";
              if (!acc[t]) acc[t] = [];
              acc[t].push(c);
              return acc;
            }, {});
            
            return (topic ? [[topic, grouped[topic] || []]] : Object.entries(grouped)).map(([groupTopic, groupComments]: any) => {
              if (groupComments.length === 0) return null;
              return (
                <div key={groupTopic} className="mb-6 last:mb-0">
                  
                  <div className="space-y-4">
                    {groupComments.map((c: any) => {
                      const isMyComment = user && user.email === c.authorEmail;
                      const isEditing = editingId === c.id;

                      return (
                        <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 relative group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800 text-sm">{c.authorName}</span>
                              {c.editedAt && <span className="text-[10px] text-stone-400 italic">(modifié)</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-stone-400">
                                {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                              </span>
                              {isMyComment && !isEditing && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button onClick={() => handleEdit(c.id, c.text)} className="text-stone-400 hover:text-emerald-600 transition-colors" title="Modifier">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDelete(c.id)} className="text-stone-400 hover:text-rose-600 transition-colors" title="Supprimer">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isEditing ? (
                            <div className="mt-3">
                              <textarea 
                                className="w-full p-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30 text-stone-900 text-sm min-h-[80px]"
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg flex items-center gap-1 transition-colors">
                                  <X size={14} /> Annuler
                                </button>
                                <button onClick={() => handleSaveEdit(c.id)} className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors">
                                  <Check size={14} /> Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-stone-700 whitespace-pre-wrap">{c.text}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
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
            
            <form onSubmit={handleSendMagicLink} className="max-w-sm mx-auto text-left">
              <h4 className="font-bold text-stone-900 mb-4 text-center">
                Connexion sécurisée par email
              </h4>
              {authError && <p className="text-red-500 text-sm mb-3 text-center">{authError}</p>}
              
              {linkSent ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                  <p className="text-emerald-800 font-medium mb-2">Lien envoyé !</p>
                  <p className="text-sm text-emerald-700">Consultez votre boîte mail <strong>{email}</strong> et cliquez sur le lien magique pour vous connecter automatiquement.</p>
                  <button type="button" onClick={() => setLinkSent(false)} className="text-xs text-emerald-600 underline mt-4">Je n'ai rien reçu, recommencer</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-stone-600 mb-4 text-center">Entrez l'email utilisé lors de votre adhésion. Nous vous enverrons un lien de connexion magique (sans mot de passe).</p>
                  <input 
                    type="email" 
                    placeholder="Votre adresse email" 
                    required 
                    className="input-base mb-4"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAuthMode("idle")} className="w-1/3 px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">Retour</button>
                    <button type="submit" className="w-2/3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      Recevoir le lien
                    </button>
                  </div>
                </>
              )}
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
