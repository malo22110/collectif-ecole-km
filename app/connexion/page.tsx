"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailLink,
} from "firebase/auth";
import {
  addDoc,
  collection,
  query,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";

export default function ConnexionPage() {
  const [authMode, setAuthMode] = useState<"idle" | "login">("idle");
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/espace-membre");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const savedEmail =
      window.localStorage.getItem("emailForSignIn") ||
      window.prompt("Confirmez l’adresse e-mail destinataire du lien.");
    if (!savedEmail) return;

    void signInWithEmailLink(auth, savedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem("emailForSignIn");
        router.replace("/espace-membre");
      })
      .catch(() =>
        setAuthError(
          "Le lien de connexion est invalide ou a expiré. Demandez-en un nouveau.",
        ),
      );
  }, [router]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/espace-membre");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError(err.message || "Erreur de connexion");
      }
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      await addDoc(collection(db, "magicLinks"), {
        email: email.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
      });
      window.localStorage.setItem("emailForSignIn", email.trim());
      setLinkSent(true);
    } catch (err: any) {
      setAuthError(err.message || "Erreur lors de l'envoi du lien");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Connexion</h1>
          <p className="text-stone-500">
            Accédez aux outils réservés aux membres du collectif.
          </p>
        </div>

        {authMode === "idle" ? (
          <div>
            {authError && (
              <p className="text-rose-500 text-sm mb-4 font-bold bg-rose-50 p-3 rounded-lg border border-rose-200 text-center">
                {authError}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white border-2 border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-5 h-5"
                  alt="Google"
                />
                Continuer avec Google
              </button>
              <button
                onClick={() => setAuthMode("login")}
                className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-900 transition-colors"
              >
                Lien magique par Email
              </button>
            </div>

            <div className="mt-8 text-center border-t border-stone-100 pt-6">
              <Link
                href="/#rejoindre"
                className="text-emerald-600 font-medium hover:underline text-sm"
              >
                Pas encore membre ? Rejoignez-nous !
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} className="text-left">
            <h4 className="font-bold text-stone-900 mb-4 text-center">
              Connexion sécurisée par email
            </h4>
            {authError && (
              <p className="text-red-500 text-sm mb-3 text-center">
                {authError}
              </p>
            )}

            {linkSent ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <p className="text-emerald-800 font-medium mb-2">
                  Lien magique envoyé ! 🪄
                </p>
                <p className="text-sm text-emerald-700">
                  Consultez votre boîte mail <strong>{email}</strong> et cliquez
                  sur le lien pour vous connecter automatiquement.
                </p>
                <button
                  type="button"
                  onClick={() => setLinkSent(false)}
                  className="text-xs text-emerald-600 underline mt-4 font-medium"
                >
                  Je n'ai rien reçu, recommencer
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-600 mb-4 text-center">
                  Entrez l'email utilisé lors de votre adhésion. Nous vous
                  enverrons un lien de connexion magique (sans mot de passe).
                </p>
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  required
                  className="input-base mb-4 w-full p-3 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("idle")}
                    className="w-1/3 px-4 py-3 border border-stone-200 rounded-xl text-stone-600 font-medium hover:bg-stone-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Recevoir le lien
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-600 text-sm font-medium"
          >
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
